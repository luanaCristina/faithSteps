/**
 * DTOs de request/response da API FaithSteps.
 */
import { Language } from './enums';

/** Payload para marcar um capitulo como concluido (sincronizacao de progresso). */
export interface CompleteChapterRequest {
  userId: string;
  challengeId: string;
  bookUsfm: string;
  chapter: number;
  language: Language;
  /** Se o usuario acertou o quiz do capitulo (concede XP extra). */
  quizPassed?: boolean;
  /** Minutos investidos na leitura (Chronos), opcional. */
  minutes?: number;
}

/** Resultado da sincronizacao de um capitulo. */
export interface CompleteChapterResponse {
  chaptersRead: number;
  totalChapters: number;
  percentComplete: number;
  xpAwarded: number;
  totalXp: number;
  level: number;
  discipleshipLevel: number;
  discipleshipName: string;
  currentStreak: number;
  talentsBalance: number;
  biblesDonated: number;
  /** Livro concluido neste evento (se houve). */
  bookCompleted: string | null;
  /** Insignias concedidas neste evento. */
  badgesAwarded: string[];
}

/** Payload para converter Talentos em doacao de Biblia. */
export interface DonateBiblesRequest {
  userId: string;
  bibles: number;
}
