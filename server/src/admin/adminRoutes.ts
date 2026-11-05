import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest, authenticateToken, requireAdmin } from '../auth/authMiddleware.js';

export function createAdminRouter(prisma: PrismaClient) {
  const router = Router();

  // All routes here require valid token AND role=ADMIN
  router.use(authenticateToken);
  router.use(requireAdmin);

  // GET ALL USERS WITH STATS
  router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          stats: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ users });
    } catch (err: any) {
      console.error('Admin users error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // TOGGLE BAN USER
  router.patch('/users/:id/ban', async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { isBanned } = req.body;

      if (id === req.user!.id) {
        return res.status(400).json({ error: 'Admin cannot ban self' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isBanned: Boolean(isBanned) },
        select: {
          id: true,
          username: true,
          isBanned: true,
          role: true,
        },
      });

      return res.json({ message: 'User ban status updated', user: updated });
    } catch (err: any) {
      console.error('Admin ban error:', err);
      return res.status(500).json({ error: 'Failed to update user ban status' });
    }
  });

  // CHANGE ROLE (USER <-> ADMIN)
  router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if (id === req.user!.id && role !== Role.ADMIN) {
        return res.status(400).json({ error: 'Admin cannot remove self admin role' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      return res.json({ message: 'User role updated', user: updated });
    } catch (err: any) {
      console.error('Admin role error:', err);
      return res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // GET SYSTEM STATS
  router.get('/stats', async (_req: AuthRequest, res: Response) => {
    try {
      const totalUsers = await prisma.user.count();
      const bannedUsers = await prisma.user.count({ where: { isBanned: true } });
      const totalMatches = await prisma.match.count();
      
      const topPlayers = await prisma.userStats.findMany({
        take: 5,
        orderBy: { checkmateWins: 'desc' },
        include: {
          user: {
            select: { username: true, role: true },
          },
        },
      });

      return res.json({
        totalUsers,
        bannedUsers,
        totalMatches,
        topPlayers,
      });
    } catch (err: any) {
      console.error('Admin stats error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
