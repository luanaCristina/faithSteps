import { Router } from 'express';
import { z } from 'zod';
import { AppError, ERROR_CODES } from '@/models';
import { pool } from '@/config/database';
import { requireSessionUserId } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { findEnglishLesson } from '@/modules/tracks';
import { userRepository } from '@/repositories/user.repository';
import { progressRepository } from '@/repositories/progress.repository';

export const englishRoutes = Router();

const lessonParams = z.object({
  lessonId: z.string().regex(/^eng-\d{2}$/, 'Lição de Inglês inválida.'),
});

const ENGLISH_ACHIEVEMENTS = [
  { count: 1, code: 'english_first_lesson', label: 'Inglês: Primeira lição' },
  { count: 5, code: 'english_five_lessons', label: 'Inglês: Ritmo de aprendiz' },
  { count: 10, code: 'english_halfway', label: 'Inglês: Meio da jornada' },
  { count: 20, code: 'english_journey_complete', label: 'Inglês: Jornada concluída' },
];

// POST /api/english/lessons/:lessonId/complete
englishRoutes.post('/lessons/:lessonId/complete', validate(lessonParams, 'params'), async (req, res, next) => {
  try {
    const { lessonId } = req.params as z.infer<typeof lessonParams>;
    if (!findEnglishLesson(lessonId)) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Lição de Inglês não encontrada.', 404);
    }

    const userId = await requireSessionUserId(req);
    const newlyCompleted = await progressRepository.completeEnglishLesson(userId, lessonId);
    const awards: string[] = [];
    if (newlyCompleted) {
      const completedCount = (await progressRepository.englishLessonProgress(userId)).length;
      for (const achievement of ENGLISH_ACHIEVEMENTS) {
        if (completedCount >= achievement.count) {
          const awarded = await userRepository.awardBadge(pool, userId, achievement.code, achievement.label);
          if (awarded) awards.push(achievement.label);
        }
      }
    }
    res.status(newlyCompleted ? 201 : 200).json({
      lessonId,
      completed: true,
      newlyCompleted,
      awards,
    });
  } catch (err) {
    next(err);
  }
});
