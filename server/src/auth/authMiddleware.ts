import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { getJwtSecret } from './jwtSecret.js';
import { prisma } from '../db/prismaClient.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: Role;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const secret = getJwtSecret();
  jwt.verify(token, secret, async (err: any, decoded: any) => {
    if (err || !decoded || !decoded.id) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true, isBanned: true },
      });

      if (!user) {
        return res.status(403).json({ error: 'Tài khoản không tồn tại' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
      }

      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      next();
    } catch (dbErr: any) {
      console.error('[AUTH ERROR] Lỗi tra cứu tài khoản trong DB:', dbErr.message);
      return res.status(500).json({ error: 'Lỗi xác thực hệ thống, vui lòng thử lại sau' });
    }
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
  }
  next();
}

