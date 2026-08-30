/**
 * Rotas de sincronizacao de progresso e doacao de Talentos.
 */
import { Router } from 'express';
import { z } from 'zod';
import {
  AppError,
  ERROR_CODES,
  Language,
  TALENTS_PER_BIBLE_DONATION,
} from '@/models';
import { validate } from '@/middleware/validate';
import { withTransaction } from '@/config/database';
import { requireSessionUserId, resolveUserId } from '@/middleware/auth';
import { progressRepository } from '@/repositories/progress.repository';
import { challengeRepository } from '@/repositories/challenge.repository';
import { progressSyncService } from '@/services/progress-sync.impl';
import { userRepository } from '@/repositories/user.repository';
import { talentsRepository } from '@/repositories/talents.repository';

export const progressRoutes = Router();

const completeChapterSchema = z.object({
  userId: z.string().uuid(),
  challengeId: z.string().uuid(),
  bookUsfm: z.string().min(1).max(10),
  chapter: z.number().int().positive(),
  language: z.nativeEnum(Language),
  quizPassed: z.boolean().optional(),
  minutes: z.number().int().nonnegative().optional(),
});

// POST /api/progress/complete-chapter
const positionSchema = z.object({
  challengeId: z.string().uuid(),
  bookUsfm: z.string().min(1).max(10),
  chapter: z.number().int().positive(),
});

// POST /api/progress/position — exige sessão e nunca aceita userId do cliente.
progressRoutes.post('/position', validate(positionSchema), async (req, res, next) => {
  try {
    const userId = await requireSessionUserId(req);
    const { challengeId, bookUsfm, chapter } = req.body as z.infer<typeof positionSchema>;
    const challenge = await challengeRepository.findById(challengeId);
    if (!challenge) {
      throw new AppError(ERROR_CODES.CHALLENGE_NOT_FOUND, 'Desafio não encontrado.', 404);
    }
    const progress = await progressRepository.saveLastPosition(userId, challengeId, bookUsfm, chapter);
    res.json({
      challengeId,
      bookUsfm: progress.lastBookUsfm,
      chapter: progress.lastChapter,
      openedAt: progress.lastOpenedAt,
    });
  } catch (err) {
    next(err);
  }
});

progressRoutes.post(
  '/complete-chapter',
  validate(completeChapterSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof completeChapterSchema>;
      const userId = await resolveUserId(req, body.userId);
      const result = await progressSyncService.completeChapter({ ...body, userId });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

const donateSchema = z.object({
  userId: z.string().uuid(),
  bibles: z.number().int().positive(),
});

// POST /api/progress/donate
progressRoutes.post('/donate', validate(donateSchema), async (req, res, next) => {
  try {
    const { userId: requestedUserId, bibles } = req.body as { userId: string; bibles: number };
    const userId = await resolveUserId(req, requestedUserId);
    const cost = bibles * TALENTS_PER_BIBLE_DONATION;

    const result = await withTransaction(async (db) => {
      const user = await userRepository.findByIdForUpdate(db, userId);
      if (!user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'Usuario nao encontrado.', 404);
      }
      const talents = await talentsRepository.getOrCreateForUpdate(db, userId);
      if (talents.balance < cost) {
        throw new AppError(
          ERROR_CODES.INSUFFICIENT_TALENTS,
          'Talentos insuficientes para a doacao solicitada.',
          409,
          { balance: talents.balance, required: cost },
        );
      }
      return talentsRepository.debitForDonation(db, userId, bibles, cost);
    });

    res.json({
      biblesDonated: result.biblesDonated,
      talentsBalance: result.balance,
    });
  } catch (err) {
    next(err);
  }
});
