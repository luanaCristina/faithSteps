/**
 * Tipos do Tutor de IA biblico bilingue.
 */
import { Language } from '@/models';

/** Entrada comum: referencia do capitulo + texto + idioma-alvo do usuario. */
export interface ChapterContext {
  /** Referencia USFM (ex.: 'JHN.3'). */
  ref: string;
  /** Referencia legivel (ex.: 'Joao 3'). */
  reference: string;
  /** Texto do capitulo (fonte para a IA). */
  text: string;
  /** Idioma preferido do usuario (para o resumo bilingue). */
  language: Language;
}

/** Resumo executivo bilingue de um capitulo. */
export interface ChapterSummary {
  reference: string;
  /** Resumo em portugues. */
  summaryPt: string;
  /** Resumo em ingles (aprendizado bilingue). */
  summaryEn: string;
  /** Aplicacao pratica / reflexao curta. */
  application: string;
}

/** Uma pergunta de quiz de multipla escolha. */
export interface QuizQuestion {
  question: string;
  options: string[];
  /** Indice (0-based) da opcao correta. */
  answerIndex: number;
}

/** Flashcard de vocabulario em ingles (SRS). */
export interface Flashcard {
  /** Termo/versiculo em ingles. */
  front: string;
  /** Traducao/significado em portugues. */
  back: string;
}
