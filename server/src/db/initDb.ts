import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

dotenv.config();

export async function ensureDatabaseExists() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[DB INIT WARNING] DATABASE_URL is not set. Database features will be disabled until configured.');
    return false;
  }

  try {
    const parsed = new URL(dbUrl);
    const user = parsed.username || 'root';
    const password = parsed.password || '';
    const host = parsed.hostname || 'localhost';
    const port = parseInt(parsed.port || '3306', 10);
    const dbName = parsed.pathname.replace(/^\//, '') || 'tienlen_checkmate';
    const isRemote = host !== 'localhost' && host !== '127.0.0.1';

    console.log(`[DB INIT] Connecting to MySQL at ${host}:${port} as ${user}...`);

    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: isRemote ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined,
    });

    console.log(`[DB INIT] Ensuring database '${dbName}' exists...`);
    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
    } catch (e: any) {
      console.log(`[DB INIT NOTE] Database creation query note:`, e.message);
    }
    await connection.end();
    console.log(`[DB INIT] Database '${dbName}' is ready!`);
    return true;
  } catch (err: any) {
    console.error(`[DB INIT ERROR] Failed to connect to MySQL:`, err.message);
    return false;
  }
}

export async function seedDefaultAdmin(prisma: PrismaClient) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.warn('[SEED WARNING] Biến môi trường ADMIN_PASSWORD chưa được thiết lập. Bỏ qua việc tạo tài khoản Admin.');
    } else {
      const adminExists = await prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (!adminExists) {
        console.log(`[SEED] Đang khởi tạo tài khoản Admin từ biến môi trường ADMIN_PASSWORD...`);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        await prisma.user.create({
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
        console.log(`[SEED] Khởi tạo tài khoản Admin thành công.`);
      } else {
        console.log(`[SEED] Tài khoản Admin đã tồn tại.`);
      }
    }

    // Chỉ seed test player1 khi không phải production
    if (process.env.NODE_ENV !== 'production') {
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
                matchesPlayed: 0,
                checkmateWins: 0,
                totalPoints: 0,
              },
            },
          },
        });
        console.log(`[SEED] Đã tạo tài khoản test player1 cho môi trường dev.`);
      }
    }
  } catch (err: any) {
    console.error(`[SEED ERROR] Failed to seed admin/test users:`, err.message);
  }
}
