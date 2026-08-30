/**
 * Fabrica do Tutor de IA: escolhe o provedor conforme a config.
 * - Sem chave / provider=mock  -> MockAiTutorService (gratis, default).
 * - provider=gemini + chave    -> Gemini com fallback automatico para o mock.
 */
import { AiTutorService } from './ai-tutor.service';
import { MockAiTutorService } from './ai-tutor.mock';
import { GeminiAiTutorService, GeminiConfig } from './ai-tutor.gemini';
import {
  ChapterContext,
  ChapterSummary,
  Flashcard,
  QuizQuestion,
} from './ai-tutor.types';

export interface AiTutorConfig {
  provider: 'mock' | 'gemini';
  gemini: GeminiConfig;
}

/**
 * Envolve um provedor real e cai para o mock se qualquer chamada falhar.
 * Mantem a experiencia do usuario sem quebrar quando o LLM esta indisponivel.
 */
class FallbackAiTutor implements AiTutorService {
  constructor(
    private readonly primary: AiTutorService,
    private readonly fallback: AiTutorService,
  ) {}

  async explainChapter(ctx: ChapterContext): Promise<ChapterSummary> {
    try {
      return await this.primary.explainChapter(ctx);
    } catch {
      return this.fallback.explainChapter(ctx);
    }
  }

  async generateQuiz(ctx: ChapterContext, count?: number): Promise<QuizQuestion[]> {
    try {
      return await this.primary.generateQuiz(ctx, count);
    } catch {
      return this.fallback.generateQuiz(ctx, count);
    }
  }

  async generateFlashcards(ctx: ChapterContext, count?: number): Promise<Flashcard[]> {
    try {
      return await this.primary.generateFlashcards(ctx, count);
    } catch {
      return this.fallback.generateFlashcards(ctx, count);
    }
  }
}

export function createAiTutor(config: AiTutorConfig): AiTutorService {
  const mock = new MockAiTutorService();
  if (config.provider === 'gemini' && config.gemini.apiKey) {
    return new FallbackAiTutor(new GeminiAiTutorService(config.gemini), mock);
  }
  return mock;
}
