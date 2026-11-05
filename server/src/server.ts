import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ensureDatabaseExists, seedDefaultAdmin } from './db/initDb.js';
import { createAuthRouter } from './auth/authRoutes.js';
import { createAdminRouter } from './admin/adminRoutes.js';
import { GameRoom } from './rooms/gameRoom.js';

dotenv.config();

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

const prisma = new PrismaClient();
const rooms: Map<string, GameRoom> = new Map();

// Setup Socket.io - Cho phép cả WampServer (http://localhost), Port 3001 và Vite (5173)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// REST Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', createAuthRouter(prisma));
app.use('/api/admin', createAdminRouter(prisma));

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // 1. Chơi với Bot (Singleplayer / Quick Match)
  socket.on('start_bot_game', (data: { playerId: string; playerName: string }) => {
    const roomCode = `BOT-${socket.id.substring(0, 5).toUpperCase()}`;
    socket.join(roomCode);

    const room = new GameRoom(roomCode, prisma, (state) => {
      io.to(roomCode).emit('game_state', state);
    });

    rooms.set(roomCode, room);
    (socket as any).roomCode = roomCode;
    (socket as any).playerId = data.playerId;

    room.initVsBots(data.playerId, data.playerName);
    socket.emit('game_state', room.state);
    console.log(`[GAME] Started bot match ${roomCode} for ${data.playerName}`);
  });

  // 2. Tạo Phòng Chờ Bạn Bè (Custom Room)
  socket.on('create_custom_room', (data: { playerId: string; playerName: string }, callback) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const roomCode = `CM${randomSuffix}`;
    socket.join(roomCode);

    const room = new GameRoom(roomCode, prisma, (state) => {
      io.to(roomCode).emit('game_state', state);
    });

    rooms.set(roomCode, room);
    (socket as any).roomCode = roomCode;
    (socket as any).playerId = data.playerId;

    room.initCustomRoom(data.playerId, data.playerName);
    socket.emit('game_state', room.state);
    console.log(`[GAME] Created custom room ${roomCode} by ${data.playerName}`);
    if (callback) callback({ success: true, roomCode });
  });

  // 3. Tham gia phòng bằng Mã Phòng
  socket.on('join_custom_room', (data: { roomCode: string; playerId: string; playerName: string }, callback) => {
    const code = data.roomCode.trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      if (callback) callback({ success: false, message: 'Không tìm thấy phòng với mã này!' });
      return;
    }
    socket.join(code);
    (socket as any).roomCode = code;
    (socket as any).playerId = data.playerId;

    const res = room.addPlayer(data.playerId, data.playerName);
    if (res.success) {
      socket.emit('game_state', room.state);
    }
    if (callback) callback(res);
  });

  // 4. Thêm Bot vào phòng chờ
  socket.on('add_bot_to_room', (callback) => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (room && room.state.phase === 'WAITING') {
      const res = room.addBot();
      if (callback) callback(res);
    }
  });

  // 5. Bắt đầu ván đấu từ phòng chờ
  socket.on('start_custom_game', (callback) => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (room && room.state.phase === 'WAITING') {
      const res = room.startCustomMatch();
      if (callback) callback(res);
    }
  });

  // 6. Rời phòng
  socket.on('leave_room', () => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      socket.leave(roomCode);
      delete (socket as any).roomCode;
    }
  });

  // 7. Chọn Lõi
  socket.on('select_augment', (data: { augmentId: string }) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      room.selectAugment(playerId, data.augmentId);
    }
  });

  // 8. Đánh bài
  socket.on('play_cards', (data: { cardIds: string[] }, callback) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      const result = room.playCards(playerId, data.cardIds);
      if (callback) callback(result);
    }
  });

  // 9. Bỏ lượt
  socket.on('pass_turn', (callback) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      const result = room.passTurn(playerId);
      if (callback) callback(result);
    }
  });

  // 10. Tiếp tục round mới
  socket.on('next_round', () => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (room && room.state.phase === 'ROUND_END') {
      room.startNewRound();
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Fallback serving frontend cho SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

async function bootstrap() {
  console.log('--- KHỞI TẠO TIẾN LÊN CHECKMATE SERVER ---');
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
    console.log(`🔑 Tài khoản Admin mặc định: admin / admin123`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});
