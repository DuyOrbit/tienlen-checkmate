import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

dotenv.config();

export async function ensureDatabaseExists() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/tienlen_checkmate';
  // Parse standard MySQL connection url: mysql://[user[:password]@][host][:port][/database]
  const parsed = new URL(dbUrl);
  const user = parsed.username || 'root';
  const password = parsed.password || '';
  const host = parsed.hostname || 'localhost';
  const port = parseInt(parsed.port || '3306', 10);
  const dbName = parsed.pathname.replace(/^\//, '') || 'tienlen_checkmate';

  console.log(`[DB INIT] Connecting to MySQL at ${host}:${port} as ${user}...`);
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    console.log(`[DB INIT] Ensuring database '${dbName}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
    console.log(`[DB INIT] Database '${dbName}' is ready!`);
    return true;
  } catch (err: any) {
    console.error(`[DB INIT ERROR] Failed to connect to MySQL:`, err.message);
    console.error(`[DB TIP] Please make sure WampServer MySQL service is running on port ${port}.`);
    return false;
  }
}

export async function seedDefaultAdmin(prisma: PrismaClient) {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      console.log(`[SEED] Creating default admin account (username: admin)...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@tienlen.local',
          passwordHash,
          role: Role.ADMIN,
          stats: {
            create: {
              matchesPlayed: 0,
              checkmateWins: 0,
              totalPoints: 0,
            },
          },
        },
      });
      console.log(`[SEED] Admin created successfully: ID = ${admin.id}, username = admin (password: admin123)`);
    } else {
      console.log(`[SEED] Admin account already exists.`);
    }

    // Seed test player1 if not exists
    const playerExists = await prisma.user.findUnique({
      where: { username: 'player1' },
    });
    if (!playerExists) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('player123', salt);
      await prisma.user.create({
        data: {
          username: 'player1',
          email: 'player1@tienlen.local',
          passwordHash,
          role: Role.USER,
          stats: {
            create: {
              matchesPlayed: 5,
              checkmateWins: 2,
              top1Count: 3,
              totalPoints: 34,
            },
          },
        },
      });
      console.log(`[SEED] Test user 'player1' created (password: player123)`);
    }
  } catch (err: any) {
    console.error(`[SEED ERROR]`, err.message);
  }
}

// If run directly via `tsx src/db/initDb.ts`
if (process.argv[1]?.includes('initDb')) {
  (async () => {
    const ok = await ensureDatabaseExists();
    if (ok) {
      const prisma = new PrismaClient();
      await seedDefaultAdmin(prisma);
      await prisma.$disconnect();
    }
  })();
}

