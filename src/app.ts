/**
 * Configuracao do app Express: middleware, rotas e handler de erros.
 */
import express, { NextFunction, Request, Response } from 'express';
import { AppError, ERROR_CODES, ErrorResponse } from '@/models';
import { router } from '@/routes';

export const app = express();

app.use(express.json());

app.use('/api', router);

// Handler de erros centralizado -> formato { error: { code, message, details? } }
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Erro nao tratado:', err);
  const body: ErrorResponse = {
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Erro interno.' },
  };
  res.status(500).json(body);
});
