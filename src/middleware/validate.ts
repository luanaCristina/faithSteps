/**
 * Middleware de validacao baseado em Zod.
 * Valida body/params/query e converte falhas em AppError(VALIDATION_ERROR).
 */
import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError, ERROR_CODES } from '@/models';

type Source = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Requisicao invalida.',
          400,
          result.error.flatten(),
        ),
      );
      return;
    }
    req[source] = result.data;
    next();
  };
}
