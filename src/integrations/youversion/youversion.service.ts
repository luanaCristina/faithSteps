/**
 * Contrato de servico para consumo da YouVersion / Bible API.
 * Implementado por HttpYouVersionService (real) e MockYouVersionService (staging).
 */
import { Language } from '@/models';
import {
  BibleBook,
  BibleChapter,
  BiblePassage,
  ReadingPlan,
  VerseOfTheDay,
} from './youversion.types';

export interface YouVersionService {
  /** Lista os livros da Biblia no idioma informado. */
  listBooks(language: Language): Promise<BibleBook[]>;

  /** Lista os capitulos de um livro (por USFM). */
  listChapters(bookUsfm: string, language: Language): Promise<BibleChapter[]>;

  /**
   * Texto de uma passagem (capitulo/versiculo/intervalo) por referencia USFM.
   * Ex.: getPassage('JHN.3', 'pt') ou getPassage('JHN.3.16', 'en').
   */
  getPassage(ref: string, language: Language): Promise<BiblePassage>;

  /** Recupera um Plano de Leitura Diaria pelo id (base dos Desafios Sazonais). */
  getReadingPlan(planId: string, language: Language): Promise<ReadingPlan>;

  /** Versiculo do Dia para o idioma informado (Tutor de IA bilingue). */
  getVerseOfTheDay(language: Language): Promise<VerseOfTheDay>;
}
