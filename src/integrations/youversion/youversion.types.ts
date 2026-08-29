/**
 * Tipos das respostas da YouVersion / Bible API (subconjunto usado pelo FaithSteps).
 * Nomes alinhados as convencoes da plataforma (ex.: USFM para livros).
 */
import { Language } from '@/models';

/** Livro da Biblia conforme a API. */
export interface BibleBook {
  /** Codigo USFM do livro (ex.: 'GEN', 'JHN'). */
  usfm: string;
  /** Nome localizado (Portugues ou Ingles conforme idioma solicitado). */
  name: string;
  /** Quantidade de capitulos do livro. */
  chapterCount: number;
}

/** Capitulo de um livro. */
export interface BibleChapter {
  bookUsfm: string;
  chapter: number;
  /** Referencia canonica localizada (ex.: 'Joao 3'). */
  reference: string;
}

/** Um dia dentro de um plano de leitura. */
export interface ReadingPlanDay {
  day: number;
  /** Referencias do dia em USFM (ex.: ['JHN.1', 'JHN.2']). */
  references: string[];
}

/** Plano de Leitura Diaria (Reading Plan) - base dos Desafios Sazonais. */
export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  language: Language;
  days: ReadingPlanDay[];
}

/** Versiculo do Dia (Verse of the Day) - alimenta o Tutor de IA bilingue. */
export interface VerseOfTheDay {
  reference: string;
  text: string;
  language: Language;
  /** Data ISO (YYYY-MM-DD) a que o versiculo se refere. */
  date: string;
}
