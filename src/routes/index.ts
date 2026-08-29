/**
 * Agregador de rotas + endpoints de leitura da API YouVersion (books/plans/votd).
 */
import { Router } from 'express';
import { z } from 'zod';
import { Language } from '@/models';
import { config } from '@/config';
import { validate } from '@/middleware/validate';
import {
  HttpYouVersionService,
  MockYouVersionService,
  YouVersionService,
} from '@/integrations/youversion';
import { challengeRoutes } from './challenge.routes';
import { progressRoutes } from './progress.routes';

// Seleciona a implementacao (mock em staging) a partir da config.
const youversion: YouVersionService = config.youversion.useMock
  ? new MockYouVersionService()
  : new HttpYouVersionService({
      baseUrl: config.youversion.baseUrl,
      apiKey: config.youversion.apiKey,
    });

const langQuery = z.object({
  language: z.nativeEnum(Language).default(Language.PT),
});

export const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.get('/bible/books', validate(langQuery, 'query'), async (req, res, next) => {
  try {
    const { language } = req.query as unknown as { language: Language };
    res.json(await youversion.listBooks(language));
  } catch (err) {
    next(err);
  }
});

router.get('/bible/verse-of-the-day', validate(langQuery, 'query'), async (req, res, next) => {
  try {
    const { language } = req.query as unknown as { language: Language };
    res.json(await youversion.getVerseOfTheDay(language));
  } catch (err) {
    next(err);
  }
});

router.use('/challenges', challengeRoutes);
router.use('/progress', progressRoutes);
