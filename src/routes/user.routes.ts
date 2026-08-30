/**
 * Rotas de usuario: dashboard redentivo (perfil + progresso + gamificacao).
 */
import { Router } from 'express';
import { z } from 'zod';
import { AppError, ERROR_CODES, TOTAL_BIBLE_CHAPTERS } from '@/models';
import { validate } from '@/middleware/validate';
import { resolveUserId } from '@/middleware/auth';
import { userRepository } from '@/repositories/user.repository';
import { talentsRepository } from '@/repositories/talents.repository';
import { progressRepository } from '@/repositories/progress.repository';
import { challengeRepository } from '@/repositories/challenge.repository';
import {
  discipleshipTierForChapters,
  levelForXp,
} from '@/modules/gamification';
import { estimateCompletionDate, percentComplete } from '@/modules/challenges-engine';
import { bookNamePt, chaptersInBook, CHAPTERS_PER_BOOK } from '@/modules/bible-books';

export const userRoutes = Router();

const idParams = z.object({ id: z.string().uuid() });

// GET /api/users/:id/dashboard
userRoutes.get('/:id/dashboard', validate(idParams, 'params'), async (req, res, next) => {
  try {
    const userId = await resolveUserId(req, req.params.id);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'Usuario nao encontrado.', 404);
    }

    const talents = await talentsRepository.findByUser(userId);
    const badges = await userRepository.listBadges(userId);

    // Desafio Biblia Toda ativo (base do dashboard de progresso).
    const [challenge] = await challengeRepository.listActive();
    let progressBlock = null;
    if (challenge) {
      const progress = await progressRepository.find(userId, challenge.id);
      const chaptersRead = progress?.chaptersRead ?? 0;
      const startedAt = progress?.startedAt ?? new Date();
      const perBook = await progressRepository.bookProgress(userId, challenge.id);
      const readMap = new Map(perBook.map((b) => [b.bookUsfm, b.chaptersRead]));

      const books = Object.keys(CHAPTERS_PER_BOOK).map((usfm) => {
        const total = chaptersInBook(usfm);
        const read = readMap.get(usfm) ?? 0;
        return {
          usfm,
          name: bookNamePt(usfm),
          chaptersRead: read,
          totalChapters: total,
          percent: percentComplete(read, total),
          completed: read >= total,
        };
      });

      progressBlock = {
        challengeId: challenge.id,
        title: challenge.title,
        chaptersRead,
        totalChapters: challenge.totalChapters,
        percentComplete: percentComplete(chaptersRead, challenge.totalChapters),
        startedAt,
        lastBookUsfm: progress?.lastBookUsfm ?? null,
        lastChapter: progress?.lastChapter ?? null,
        lastOpenedAt: progress?.lastOpenedAt ?? null,
        estimatedCompletionDate: estimateCompletionDate({
          chaptersRead,
          totalChapters: challenge.totalChapters,
          startedAt,
        }),
        books,
      };
    }

    const chaptersRead = progressBlock?.chaptersRead ?? 0;
    const tier = discipleshipTierForChapters(chaptersRead);

    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        preferredLanguage: user.preferredLanguage,
        totalXp: user.totalXp,
        level: levelForXp(user.totalXp),
        currentStreak: user.currentStreak,
        readingMinutes: user.readingMinutes,
      },
      discipleship: {
        level: tier.level,
        name: tier.name,
        englishLevel: tier.englishLevel,
      },
      talents: {
        balance: talents?.balance ?? 0,
        biblesDonated: talents?.biblesDonated ?? 0,
      },
      badges,
      progress: progressBlock,
      totalBibleChapters: TOTAL_BIBLE_CHAPTERS,
    });
  } catch (err) {
    next(err);
  }
});
