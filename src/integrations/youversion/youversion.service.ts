/**
 * Contrato de servico para consumo da YouVersion / Bible API.
 * Implementado por HttpYouVersionService (real) e MockYouVersionService (staging).
 */
import { Language } from '@/models';
import {
  BibleBook,
  BibleChapter,
  ReadingPlan,
  VerseOfTheDay,
} from './youversion.types';

export interface YouVersionService {
  /** Lista os livros da Biblia no idioma informado. */
  listBooks(language: Language): Promise<BibleBook[]>;

  /** Lista os capitulos de um livro (por USFM). */
  listChapters(bookUsfm: string, language: Language): Promise<BibleChapter[]>;

  /** Recupera um Plano de Leitura Diaria pelo id (base dos Desafios Sazonais). */
  getReadingPlan(planId: string, language: Language): Promise<ReadingPlan>;

  /** Versiculo do Dia para o idioma informado (Tutor de IA bilingue). */
  getVerseOfTheDay(language: Language): Promise<VerseOfTheDay>;
}
