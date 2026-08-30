import { Router } from 'express';
import { requireSessionUserId } from '@/middleware/auth';
import { leaderboardRepository } from '@/repositories/leaderboard.repository';

export const leaderboardRoutes = Router();

// GET /api/leaderboard
leaderboardRoutes.get('/', async (req, res, next) => {
  try {
    const userId = await requireSessionUserId(req);
    const [entries, currentUser] = await Promise.all([
      leaderboardRepository.top(10),
      leaderboardRepository.findUser(userId),
    ]);
    res.json({ entries, currentUser });
  } catch (err) {
    next(err);
  }
});
