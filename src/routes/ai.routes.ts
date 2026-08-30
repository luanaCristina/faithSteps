/**
 * Rotas do Tutor de IA biblico bilingue.
 * Fluxo: cache -> (miss) busca texto na YouVersion -> gera com IA -> cacheia.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Language } from '@/models';
import { config } from '@/config';
import { validate } from '@/middleware/validate';
import { createAiTutor, ChapterContext } from '@/integrations/ai';
import { aiCacheRepository, AiCacheKind } from '@/repositories/ai-cache.repository';
import { youversion } from '@/integrations/youversion/client';

export const aiRoutes = Router();

const tutor = createAiTutor(config.ai);
const provider = config.ai.provider;

const chapterQuery = z.object({
  ref: z.string().min(1).max(40).regex(/^[A-Za-z0-9.\-]+$/, 'Referencia USFM invalida.'),
  language: z.nativeEnum(Language).default(Language.PT),
});

/** Monta o contexto do capitulo buscando o texto na YouVersion. */
async function buildContext(ref: string, language: Language): Promise<ChapterContext> {
  const passage = await youversion.getPassage(ref, language);
  return { ref, reference: passage.reference, text: passage.content, language };
}

/**
 * Resolve um recurso de IA com cache: tenta o cache; em miss, gera e grava.
 */
async function cached<T>(
  kind: AiCacheKind,
  ref: string,
  language: Language,
  generate: () => Promise<T>,
): Promise<T> {
  const hit = await aiCacheRepository.get<T>(kind, ref, language, provider);
  if (hit) return hit;
  const fresh = await generate();
  await aiCacheRepository.set<T>(kind, ref, language, provider, fresh);
  return fresh;
}

// GET /api/ai/chapter-summary?ref=JHN.3&language=pt
aiRoutes.get('/chapter-summary', validate(chapterQuery, 'query'), async (req, res, next) => {
  try {
    const { ref, language } = req.query as unknown as { ref: string; language: Language };
    const data = await cached('summary', ref, language, async () =>
      tutor.explainChapter(await buildContext(ref, language)),
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/quiz?ref=JHN.3&language=pt
aiRoutes.get('/quiz', validate(chapterQuery, 'query'), async (req, res, next) => {
  try {
    const { ref, language } = req.query as unknown as { ref: string; language: Language };
    const data = await cached('quiz', ref, language, async () =>
      tutor.generateQuiz(await buildContext(ref, language), 2),
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/flashcards?ref=JHN.3&language=en
aiRoutes.get('/flashcards', validate(chapterQuery, 'query'), async (req, res, next) => {
  try {
    const { ref, language } = req.query as unknown as { ref: string; language: Language };
    const data = await cached('flashcards', ref, language, async () =>
      tutor.generateFlashcards(await buildContext(ref, language), 5),
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});
