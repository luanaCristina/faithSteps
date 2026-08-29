/**
 * Rotas de sincronizacao de progresso e doacao de Talentos.
 */
import { Router } from 'express';
import { z } from 'zod';
import {
  AppError,
  CHAPTERS_PER_BIBLE_DONATION,
  ERROR_CODES,
  Language,
} from '@/models';
import { validate } from '@/middleware/validate';
import { withTransaction } from '@/config/database';
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
});

// POST /api/progress/complete-chapter
progressRoutes.post(
  '/complete-chapter',
  validate(completeChapterSchema),
  async (req, res, next) => {
    try {
      const result = await progressSyncService.completeChapter(req.body);
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
    const { userId, bibles } = req.body as { userId: string; bibles: number };
    const cost = bibles * CHAPTERS_PER_BIBLE_DONATION;

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
