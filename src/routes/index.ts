/**
 * Agregador de rotas + endpoints de leitura da API YouVersion (books/plans/votd).
 */
import { Router } from 'express';
import { z } from 'zod';
import { Language } from '@/models';
import { config } from '@/config';
import { validate } from '@/middleware/validate';
import { youversion } from '@/integrations/youversion/client';
import { buildTracks } from '@/modules/tracks';
import { challengeRoutes } from './challenge.routes';
import { progressRoutes } from './progress.routes';
import { userRoutes } from './user.routes';
import { devRoutes } from './dev.routes';
import { aiRoutes } from './ai.routes';
import { authRoutes } from './auth.routes';

const langQuery = z.object({
  language: z.nativeEnum(Language).default(Language.PT),
});

export const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Estrutura das Trilhas do Conhecimento (eixos, 66 livros por secao, tematicas).
router.get('/tracks', (_req, res) => res.json(buildTracks()));

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

// GET /api/bible/passage?ref=JHN.3&language=pt -> texto do capitulo/versiculo.
const passageQuery = langQuery.extend({
  ref: z.string().min(1).max(40).regex(/^[A-Za-z0-9.\-]+$/, 'Referencia USFM invalida.'),
});
router.get('/bible/passage', validate(passageQuery, 'query'), async (req, res, next) => {
  try {
    const { ref, language } = req.query as unknown as { ref: string; language: Language };
    res.json(await youversion.getPassage(ref, language));
  } catch (err) {
    next(err);
  }
});

router.use('/challenges', challengeRoutes);
router.use('/auth', authRoutes);
router.use('/progress', progressRoutes);
router.use('/users', userRoutes);
router.use('/dev', devRoutes);
router.use('/ai', aiRoutes);
