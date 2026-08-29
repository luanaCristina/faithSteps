/**
 * Entidades de dominio (camelCase). Os repositorios mapeiam snake_case -> camelCase.
 */
import { ChallengeType, Language, ProgressStatus, TalentTxKind } from './enums';

export interface User {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: Language;
  totalXp: number;
  level: number;
  youversionUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  challengeType: ChallengeType;
  totalChapters: number;
  youversionPlanId: string | null;
  /** Meta coletiva de capitulos (apenas SERVICE). */
  collectiveGoalChapters: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  challengeId: string;
  chaptersRead: number;
  xpEarned: number;
  status: ProgressStatus;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

/** Capitulo concluido individualmente - base de idempotencia da sincronizacao. */
export interface ChapterCompletion {
  id: string;
  userId: string;
  challengeId: string;
  bookUsfm: string;
  chapter: number;
  language: Language;
  xpAwarded: number;
  completedAt: Date;
}

/** Saldo agregado de Talentos por usuario. */
export interface Talents {
  id: string;
  userId: string;
  balance: number;
  biblesDonated: number;
  updatedAt: Date;
}

/** Movimentacao imutavel no ledger de Talentos. */
export interface TalentTransaction {
  id: string;
  userId: string;
  kind: TalentTxKind;
  amount: number;
  sourceChallengeId: string | null;
  note: string | null;
  createdAt: Date;
}

/** Visao de progresso enriquecida com metricas derivadas (Challenges Engine). */
export interface ChallengeProgressView {
  challengeId: string;
  userId: string;
  chaptersRead: number;
  totalChapters: number;
  /** Percentual lido, 0..100. */
  percentComplete: number;
  status: ProgressStatus;
  /** Estimativa dinamica de conclusao (sem penalidades). Null se ritmo desconhecido. */
  estimatedCompletionDate: Date | null;
}
