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
}

/** Resultado da sincronizacao de um capitulo. */
export interface CompleteChapterResponse {
  chaptersRead: number;
  totalChapters: number;
  percentComplete: number;
  xpAwarded: number;
  totalXp: number;
  talentsBalance: number;
  biblesDonated: number;
}

/** Payload para converter Talentos em doacao de Biblia. */
export interface DonateBiblesRequest {
  userId: string;
  bibles: number;
}
