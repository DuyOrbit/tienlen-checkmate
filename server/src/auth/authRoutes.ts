import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest, authenticateToken } from './authMiddleware.js';

export function createAuthRouter(prisma: PrismaClient) {
  const router = Router();
  const jwtSecret = process.env.JWT_SECRET || 'tienlen_cyberpunk_super_secret_key_2026';

  // REGISTER
  router.post('/register', async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          username,
          email: email || null,
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
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account registered successfully',
        token,
        user,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // LOGIN
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await prisma.user.findUnique({
        where: { username },
        include: { stats: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Account has been suspended by Admin' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          stats: user.stats,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET CURRENT USER PROFILE
  router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBanned: true,
          createdAt: true,
          stats: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user });
    } catch (err: any) {
      console.error('Profile error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

