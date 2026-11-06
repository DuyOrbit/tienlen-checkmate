import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { prisma } from './db/prismaClient.js';
import { getJwtSecret } from './auth/jwtSecret.js';
import { ensureDatabaseExists, seedDefaultAdmin } from './db/initDb.js';
import { createAuthRouter } from './auth/authRoutes.js';
import { createAdminRouter } from './admin/adminRoutes.js';
import { GameRoom } from './rooms/gameRoom.js';

dotenv.config();

// Tự động chuẩn hóa SSL cho Cloud MySQL (TiDB Cloud / Aiven) với Prisma
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    if (url.includes('ssl=')) {
      url = url.replace(/ssl=[^&]*/, 'sslaccept=strict');
    } else if (!url.includes('sslaccept=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}sslaccept=strict`;
    }
    process.env.DATABASE_URL = url;
    console.log('[PRISMA SSL] Đã chuẩn hóa kết nối bảo mật: sslaccept=strict');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../../public');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Phục vụ frontend tĩnh trực tiếp từ thư mục public để đồng nhất server
app.use(express.static(publicPath));

const rooms: Map<string, GameRoom> = new Map();

// Setup Socket.io - Cho phép cả WampServer (http://localhost), Port 3001 và Vite (5173)
interface SocketData {
  playerId: string;
  playerName: string;
  isGuest: boolean;
  guestToken?: string;
  roomCode?: string;
}

const io = new SocketIOServer<any, any, any, SocketData>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const jwtSecret = getJwtSecret();

// Middleware xác thực danh tính Socket qua handshake JWT hoặc cấp guestId có ký an toàn từ server
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token && typeof token === 'string') {
    try {
      const decoded: any = jwt.verify(token, jwtSecret);
      if (decoded && decoded.id) {
        // Tra DB kiểm tra tài khoản bị khóa và lấy role/username thật
        try {
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, role: true, isBanned: true },
          });

          if (user) {
            if (user.isBanned) {
              return next(new Error('Tài khoản đã bị khóa bởi Quản trị viên'));
            }
            socket.data.playerId = user.id;
            socket.data.playerName = user.username;
            socket.data.isGuest = false;
            return next();
          }
        } catch (dbErr: any) {
          console.error('[SOCKET AUTH ERROR] Không thể kết nối DB tra cứu user:', dbErr.message);
          return next(new Error('Lỗi máy chủ xác thực tài khoản'));
        }
      }
    } catch {
      // Token sai hoặc hết hạn -> xử lý xuống phần guest
    }
  }

  // Khách (Guest): Kiểm tra guestToken có ký hợp lệ do server cấp trước đó
  const incomingGuestToken = socket.handshake.auth?.guestToken;
  if (incomingGuestToken && typeof incomingGuestToken === 'string') {
    try {
      const guestDecoded: any = jwt.verify(incomingGuestToken, jwtSecret);
      if (guestDecoded && guestDecoded.guestId && typeof guestDecoded.guestId === 'string' && guestDecoded.guestId.startsWith('guest-')) {
        socket.data.playerId = guestDecoded.guestId;
        socket.data.guestToken = incomingGuestToken;
        socket.data.playerName = 'Khách';
        socket.data.isGuest = true;
        return next();
      }
    } catch {
      // guestToken hết hạn hoặc giả mạo -> cấp mới bên dưới
    }
  }

  // Cấp guestId và guestToken có ký mới từ server (hạn 8 giờ)
  const guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
  const newGuestToken = jwt.sign({ guestId, isGuest: true }, jwtSecret, { expiresIn: '8h' });
  socket.data.playerId = guestId;
  socket.data.guestToken = newGuestToken;
  socket.data.playerName = 'Khách';
  socket.data.isGuest = true;
  next();
});

// REST Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', createAuthRouter(prisma));
app.use('/api/admin', createAdminRouter(prisma));

// Phát trạng thái game được lọc riêng (redacted) cho từng socket trong phòng
function broadcastRoomState(room: GameRoom) {
  const roomCode = room.state.roomCode;
  const roomSockets = io.sockets.adapter.rooms.get(roomCode);
  if (!roomSockets) return;

  for (const socketId of roomSockets) {
    const s = io.sockets.sockets.get(socketId);
    if (s) {
      const playerId = s.data?.playerId || (s as any).playerId;
      s.emit('game_state', room.getRedactedState(playerId));
    }
  }
}

type ActionCallback = (res: { success: boolean; message?: string; roomCode?: string }) => void;

function sanitizePlayerName(rawName: any, fallback = 'Khách'): string {
  if (typeof rawName !== 'string') return fallback;
  const cleaned = rawName.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
  if (!cleaned) return fallback;
  return cleaned.substring(0, 20);
}

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id} (${socket.data.playerId}, guest=${socket.data.isGuest})`);

  // Gửi thông tin session đã được server xác thực về cho client
  socket.emit('session_init', {
    playerId: socket.data.playerId,
    playerName: socket.data.playerName,
    isGuest: socket.data.isGuest,
    guestToken: socket.data.guestToken,
  });

  // Kiểm tra Reconnection: Nếu người chơi đã có ghế trong một phòng đang hoạt động (bỏ qua phòng đã MATCH_OVER)
  for (const [code, r] of rooms) {
    if (r.state.phase === 'MATCH_OVER') continue;
    const existingP = r.state.players.find((p) => p.id === socket.data.playerId);
    if (existingP) {
      socket.join(code);
      socket.data.roomCode = code;
      r.handlePlayerReconnect(socket.data.playerId);
      socket.emit('game_state', r.getRedactedState(socket.data.playerId));
      console.log(`[SOCKET] Reconnected ${existingP.name} (${socket.data.playerId}) to room ${code}`);
      break;
    }
  }

  // 1. Chơi với Bot (Singleplayer / Quick Match)
  socket.on('start_bot_game', (data?: { playerName?: string }) => {
    const playerId = socket.data.playerId;
    const playerName = !socket.data.isGuest ? socket.data.playerName : sanitizePlayerName(data?.playerName, 'Khách');
    const roomCode = `BOT-${socket.id.substring(0, 5).toUpperCase()}`;
    socket.join(roomCode);

    const room = new GameRoom(roomCode, prisma, () => {
      broadcastRoomState(room);
    });
    room.onRoomEmpty = (code) => {
      rooms.delete(code);
      console.log(`[GAME] Room ${code} empty callback -> deleted`);
    };

    rooms.set(roomCode, room);
    socket.data.roomCode = roomCode;

    room.initVsBots(playerId, playerName);
    socket.emit('game_state', room.getRedactedState(playerId));
    console.log(`[GAME] Started bot match ${roomCode} for ${playerName} (${playerId})`);
  });

  // 2. Tạo Phòng Chờ Bạn Bè (Custom Room)
  socket.on('create_custom_room', (data: { playerName?: string } | undefined, callback?: ActionCallback) => {
    const playerId = socket.data.playerId;
    const playerName = !socket.data.isGuest ? socket.data.playerName : sanitizePlayerName(data?.playerName, 'Khách');
    let roomCode = '';
    do {
      roomCode = `CM${Math.floor(1000 + Math.random() * 9000)}`;
    } while (rooms.has(roomCode));
    socket.join(roomCode);

    const room = new GameRoom(roomCode, prisma, () => {
      broadcastRoomState(room);
    });
    room.onRoomEmpty = (code) => {
      rooms.delete(code);
      console.log(`[GAME] Room ${code} empty callback -> deleted`);
    };

    rooms.set(roomCode, room);
    socket.data.roomCode = roomCode;

    room.initCustomRoom(playerId, playerName);
    socket.emit('game_state', room.getRedactedState(playerId));
    console.log(`[GAME] Created custom room ${roomCode} by ${playerName} (${playerId})`);
    if (callback) callback({ success: true, roomCode });
  });

  // 3. Tham gia phòng bằng Mã Phòng
  socket.on('join_custom_room', (data: { roomCode: string; playerName?: string }, callback?: ActionCallback) => {
    if (!data?.roomCode) {
      if (callback) callback({ success: false, message: 'Vui lòng cung cấp mã phòng!' });
      return;
    }
    const code = data.roomCode.trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng với mã này!' });
      return;
    }
    const playerId = socket.data.playerId;
    const playerName = !socket.data.isGuest ? socket.data.playerName : sanitizePlayerName(data?.playerName, 'Khách');

    socket.join(code);
    socket.data.roomCode = code;

    const res = room.addPlayer(playerId, playerName);
    if (res.success) {
      socket.emit('game_state', room.getRedactedState(playerId));
    }
    if (callback) callback(res);
  });

  // 4. Thêm Bot vào phòng chờ
  socket.on('add_bot_to_room', (callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (room.state.phase !== 'WAITING') {
      if (callback) callback({ success: false, message: 'Phòng đã bắt đầu trận đấu!' });
      return;
    }
    if (!room.isHost(playerId)) {
      if (callback) callback({ success: false, message: 'Chỉ chủ phòng mới có quyền thêm Bot!' });
      return;
    }
    const res = room.addBot();
    if (callback) callback(res);
  });

  // 5. Bắt đầu ván đấu từ phòng chờ
  socket.on('start_custom_game', (callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (room.state.phase !== 'WAITING') {
      if (callback) callback({ success: false, message: 'Trận đấu đang diễn ra!' });
      return;
    }
    if (!room.isHost(playerId)) {
      if (callback) callback({ success: false, message: 'Chỉ chủ phòng mới có quyền bắt đầu trận đấu!' });
      return;
    }
    const res = room.startCustomMatch();
    if (callback) callback(res);
  });

  // 6. Rời phòng
  socket.on('leave_room', (callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    if (roomCode) {
      socket.leave(roomCode);
      delete socket.data.roomCode;

      const room = rooms.get(roomCode);
      if (room) {
        const { roomEmpty } = room.handlePlayerLeave(playerId);
        if (roomEmpty) {
          room.cleanup();
          rooms.delete(roomCode);
          console.log(`[GAME] Destroyed room ${roomCode} on leave (empty)`);
        }
      }
    }
    if (callback) callback({ success: true, message: 'Đã rời phòng' });
  });

  // 7. Chọn Lõi
  socket.on('select_augment', (data: { augmentId: string }, callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (playerId) {
      room.selectAugment(playerId, data.augmentId);
      if (callback) callback({ success: true, message: 'Đã chọn Lõi thành công' });
    }
  });

  // 8. Đánh bài
  socket.on('play_cards', (data: { cardIds: string[] }, callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (playerId) {
      const result = room.playCards(playerId, data.cardIds);
      if (callback) callback(result);
    }
  });

  // 9. Bỏ lượt
  socket.on('pass_turn', (callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (playerId) {
      const result = room.passTurn(playerId);
      if (callback) callback(result);
    }
  });

  // 10. Tiếp tục round mới
  socket.on('next_round', (callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    if (room.state.phase !== 'ROUND_END') {
      if (callback) callback({ success: false, message: 'Chưa kết thúc ván đấu!' });
      return;
    }
    if (!room.isHost(playerId)) {
      if (callback) callback({ success: false, message: 'Chỉ chủ phòng mới có quyền bắt đầu ván tiếp theo!' });
      return;
    }
    room.startNewRound();
    if (callback) callback({ success: true, message: 'Bắt đầu ván mới thành công!' });
  });

  // 11. Đổi riêng 1 Lõi (Reroll Augment Slot)
  socket.on('reroll_augment_slot', (data: { slotIndex: number }, callback?: ActionCallback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng!' });
      return;
    }
    const result = room.rerollAugmentSlot(playerId, data?.slotIndex);
    if (callback) callback(result);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id} (${socket.data.playerId})`);
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        const { roomEmpty } = room.handlePlayerDisconnect(playerId);
        if (roomEmpty) {
          room.cleanup();
          rooms.delete(roomCode);
          console.log(`[GAME] Room ${roomCode} cleaned up after disconnect`);
        }
      }
    }
  });
});

// Fallback serving frontend cho SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

async function bootstrap() {
  console.log('--- KHỞI TẠO TIẾN LÊN CHECKMATE SERVER ---');

  // Tự động push schema bảng vào Cloud Database nếu cần
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
    try {
      console.log('[PRISMA AUTO PUSH] Đang tự động kiểm tra và đồng bộ bảng vào Cloud Database...');
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
      console.log('[PRISMA AUTO PUSH] Đồng bộ bảng thành công!');
    } catch (pushErr: any) {
      console.warn('[PRISMA AUTO PUSH NOTE]', pushErr.message);
    }
  }

  // 1. Đảm bảo MySQL Database tồn tại & Seed Admin
  const dbOk = await ensureDatabaseExists();
  if (dbOk) {
    try {
      await seedDefaultAdmin(prisma);
    } catch (e: any) {
      console.warn('[DB WARNING] Seed step skipped or tables not yet migrated:', e.message);
    }
  }

  // 2. Start HTTP Server
  server.listen(port, () => {
    console.log(`🚀 Server đồng nhất đang chạy tại: http://localhost:${port}`);
    console.log(`🎮 Web & Socket.io sẵn sàng phục vụ tại cùng một cổng ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});
