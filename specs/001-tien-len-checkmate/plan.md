# Implementation Plan: Tiến Lên Checkmate & Augments

**Branch**: `001-tien-len-checkmate` | **Date**: 2026-11-05 | **Spec**: [spec.md](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/spec.md)

## Summary
Xây dựng trò chơi bài Tiến Lên Miền Nam Web-based đồ họa Cyberpunk / Esport Arcade. Hệ thống tích hợp cơ chế Checkmate 16 điểm, Lõi Công Nghệ (Point Augments), Backend Node.js/Socket.io, Cơ sở dữ liệu **MySQL (WAMP Server)** với hệ thống Phân Quyền Người Dùng (RBAC) và Admin Dashboard trực quan (có thể xem/sửa cả trên web lẫn qua phpMyAdmin).

## Technical Context
- **Language / Runtime**: TypeScript, Node.js v24
- **Database**: **MySQL (WampServer `mysql5.7.31` tại `localhost:3306`)**
- **ORM & Driver**: Prisma ORM (`provider = "mysql"`) kết hợp script migration tự động
- **Database URL**: `mysql://root:@localhost:3306/tienlen_checkmate`
- **Authentication**: JWT, bcryptjs, Middleware kiểm tra quyền (`requireAuth`, `requireAdmin`)
- **Backend**: Express + Socket.io (WebSocket Realtime)
- **Frontend**: Vite + React, Tailwind CSS (Cyberpunk theme), Lucide Icons, Canvas Confetti
- **State & Game Engine**: Pure TypeScript logic (`engine/` shared)

## Database Schema (Prisma for MySQL)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

model User {
  id           String        @id @default(uuid())
  username     String        @unique @db.VarChar(50)
  email        String?       @unique @db.VarChar(100)
  passwordHash String        @db.VarChar(255)
  role         Role          @default(USER)
  isBanned     Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  stats        UserStats?
  matchPlayers MatchPlayer[]

  @@map("users")
}

model UserStats {
  id            String @id @default(uuid())
  userId        String @unique
  user          User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  matchesPlayed Int    @default(0)
  checkmateWins Int    @default(0)
  top1Count     Int    @default(0)
  top2Count     Int    @default(0)
  top3Count     Int    @default(0)
  top4Count     Int    @default(0)
  totalPoints   Int    @default(0)

  @@map("user_stats")
}

model Match {
  id          String        @id @default(uuid())
  roomCode    String?       @db.VarChar(10)
  winnerId    String?       @db.VarChar(36)
  totalRounds Int           @default(1)
  createdAt   DateTime      @default(now())
  endedAt     DateTime?
  players     MatchPlayer[]

  @@map("matches")
}

model MatchPlayer {
  id        String   @id @default(uuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  name      String   @db.VarChar(50)
  isBot     Boolean  @default(false)
  finalRank Int
  points    Int

  @@map("match_players")
}
```

## Project Structure

```text
tienlen/
├── .specify/
│   └── constitution.md
├── specs/
│   └── 001-tien-len-checkmate/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── server/
│   ├── prisma/
│   │   └── schema.prisma    # MySQL Database schema
│   ├── src/
│   │   ├── engine/          # TLMN rules, combo evaluator, scoring, augments
│   │   ├── bot/             # Heuristic AI Bot decision engine
│   │   ├── auth/            # JWT, bcrypt, auth routes & middleware
│   │   ├── admin/           # Admin user management endpoints
│   │   ├── rooms/           # Room manager & state sync
│   │   └── server.ts        # Express + Socket.io entry
│   ├── .env                 # DATABASE_URL="mysql://root:@localhost:3306/tienlen_checkmate"
│   └── package.json
├── public/                  # Built assets served via Apache WAMP
│   ├── index.html
│   └── assets/
├── index.php                # WAMP entry point (http://localhost/tienlen)
├── .htaccess                # Apache rewrite rules
├── tienlen_checkmate.sql    # Continuously updated MySQL schema & seeds
├── start-game.bat           # One-click game launcher
├── client/
│   ├── src/
│   │   ├── components/      # Card, Hand, Table, Scoreboard, AugmentModal, WinModal
│   │   ├── admin/           # Admin Dashboard view & User management table
│   │   ├── auth/            # Login, Register, Profile modal
│   │   ├── hooks/           # useGame, useSocket, useAuth
│   │   ├── styles/          # Cyberpunk theme, glowing neon utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── package.json             # Root npm scripts
```
