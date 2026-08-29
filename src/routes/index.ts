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
      versionId: config.youversion.versionId,
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

// --- Diagnostico temporario da integracao YouVersion ----------------------
// Chama a API real e reporta status/corpo sem revelar a chave. Remover apos validar.
router.get('/bible/_diag', async (_req, res, next) => {
  try {
    const key = config.youversion.apiKey;
    const base = config.youversion.baseUrl;
    const targets = ['/bibles', `/bibles/${config.youversion.versionId[Language.EN]}/books`];
    const results: unknown[] = [];
    for (const path of targets) {
      const r = await fetch(new URL(path, base), {
        headers: { 'X-YVP-App-Key': key, Accept: 'application/json' },
      });
      const body = (await r.text()).slice(0, 200);
      results.push({ path, status: r.status, body });
    }
    res.json({
      baseUrl: base,
      apiKeyPresent: Boolean(key),
      apiKeyLength: key.length,
      versionIdEn: config.youversion.versionId[Language.EN],
      results,
    });
  } catch (err) {
    next(err);
  }
});

router.use('/challenges', challengeRoutes);
router.use('/progress', progressRoutes);
