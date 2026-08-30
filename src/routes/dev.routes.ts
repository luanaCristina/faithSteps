/**
 * Rotas de desenvolvimento/onboarding: cria dados minimos para uso imediato.
 * Idempotente: pode ser chamada varias vezes sem duplicar.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Language } from '@/models';
import { validate } from '@/middleware/validate';
import { userRepository } from '@/repositories/user.repository';
import { ensureWholeBibleChallenge } from '@/modules/onboarding';

export const devRoutes = Router();

const seedSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  language: z.nativeEnum(Language).optional(),
});

// POST /api/dev/seed -> garante o desafio Biblia Toda e cria/atualiza um usuario.
devRoutes.post('/seed', validate(seedSchema), async (req, res, next) => {
  try {
    const body = req.body as { displayName?: string; email?: string; language?: Language };

    // 1) Desafio Biblia Toda (cria se ainda nao existe).
    const challenge = await ensureWholeBibleChallenge();

    // 2) Usuario demo (idempotente por email).
    const email = body.email ?? 'peregrino@faithsteps.dev';
    const user = await userRepository.create({
      email,
      displayName: body.displayName ?? 'Peregrino',
      preferredLanguage: body.language ?? Language.PT,
    });

    res.status(201).json({
      user: { id: user.id, displayName: user.displayName, email: user.email },
      challenge: { id: challenge.id, title: challenge.title, totalChapters: challenge.totalChapters },
    });
  } catch (err) {
    next(err);
  }
});
