/**
 * Contrato do Tutor de IA. Implementado por MockAiTutorService (default, gratis)
 * e GeminiAiTutorService (LLM real via env).
 */
import {
  ChapterContext,
  ChapterSummary,
  Flashcard,
  QuizQuestion,
} from './ai-tutor.types';

export interface AiTutorService {
  /** Resumo executivo bilingue do capitulo. */
  explainChapter(ctx: ChapterContext): Promise<ChapterSummary>;

  /** Gera perguntas de quiz sobre o capitulo. */
  generateQuiz(ctx: ChapterContext, count?: number): Promise<QuizQuestion[]>;

  /** Extrai flashcards de vocabulario em ingles do capitulo. */
  generateFlashcards(ctx: ChapterContext, count?: number): Promise<Flashcard[]>;
}
