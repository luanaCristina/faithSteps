/**
 * Rotas de Desafios Biblicos (thin controllers - delegam ao repositorio/servico).
 */
import { Router } from 'express';
import { z } from 'zod';
import { AppError, ERROR_CODES } from '@/models';
import { validate } from '@/middleware/validate';
import { challengeRepository } from '@/repositories/challenge.repository';

export const challengeRoutes = Router();

const idParams = z.object({ id: z.string().uuid() });

challengeRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await challengeRepository.listActive());
  } catch (err) {
    next(err);
  }
});

challengeRoutes.get('/:id', validate(idParams, 'params'), async (req, res, next) => {
  try {
    const challenge = await challengeRepository.findById(req.params.id);
    if (!challenge) {
      throw new AppError(ERROR_CODES.CHALLENGE_NOT_FOUND, 'Desafio nao encontrado.', 404);
    }
    res.json(challenge);
  } catch (err) {
    next(err);
  }
});
