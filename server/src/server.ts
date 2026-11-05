import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ensureDatabaseExists, seedDefaultAdmin } from './db/initDb.js';
import { createAuthRouter } from './auth/authRoutes.js';
import { createAdminRouter } from './admin/adminRoutes.js';
import { GameRoom } from './rooms/gameRoom.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const prisma = new PrismaClient();
const rooms: Map<string, GameRoom> = new Map();

// Setup Socket.io - Cho phép cả WampServer (http://localhost) và Vite (http://localhost:5173)
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

  // Chơi với Bot (Singleplayer / Bot Match)
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
    console.log(`[GAME] Started bot match ${roomCode} for ${data.playerName}`);
  });

  // Chọn Lõi
  socket.on('select_augment', (data: { augmentId: string }) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      room.selectAugment(playerId, data.augmentId);
    }
  });

  // Đánh bài
  socket.on('play_cards', (data: { cardIds: string[] }, callback) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      const result = room.playCards(playerId, data.cardIds);
      if (callback) callback(result);
    }
  });

  // Bỏ lượt
  socket.on('pass_turn', (callback) => {
    const roomCode = (socket as any).roomCode;
    const playerId = (socket as any).playerId;
    const room = rooms.get(roomCode);
    if (room && playerId) {
      const result = room.passTurn(playerId);
      if (callback) callback(result);
    }
  });

  // Bắt đầu round tiếp theo sau khi round kết thúc
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
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
    console.log(`🎮 Socket.io ready on port ${port}`);
    console.log(`🔑 Tài khoản Admin mặc định: admin / admin123`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});

