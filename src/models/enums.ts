/**
 * Enums e constantes de dominio do YouVersion FaithSteps.
 * Sem logica - apenas definicoes compartilhadas.
 */

/** Idiomas suportados para leitura e tutor bilingue. */
export enum Language {
  PT = 'pt',
  EN = 'en',
}

/** Tipos de Desafio Biblico. */
export enum ChallengeType {
  /** Desafio da Biblia Toda (1.189 capitulos). */
  WHOLE_BIBLE = 'WHOLE_BIBLE',
  /** Sazonais/tematicos (ex.: "Evangelhos em 30 dias"). */
  SEASONAL = 'SEASONAL',
  /** Desafio de Servico - metas coletivas (Amar ao Proximo). */
  SERVICE = 'SERVICE',
}

/** Status do progresso do usuario em um desafio. */
export enum ProgressStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/** Tipo de movimentacao no ledger de Talentos. */
export enum TalentTxKind {
  /** Acumulo por leitura. */
  EARN = 'EARN',
  /** Conversao em doacao de Biblia fisica. */
  DONATE = 'DONATE',
}

/** Total de capitulos da Biblia (66 livros). */
export const TOTAL_BIBLE_CHAPTERS = 1189;

/** Total de livros da Biblia. */
export const TOTAL_BIBLE_BOOKS = 66;

/**
 * Regras de XP por capitulo concluido, por idioma (documento V2).
 * PT reforca a leitura; EN premia o esforco bilingue adicional.
 */
export const XP_PER_CHAPTER: Record<Language, number> = {
  [Language.PT]: 15,
  [Language.EN]: 25,
};

/**
 * Talentos ganhos por capitulo concluido, por idioma (documento V2).
 * Talentos acumulam para doacao de Biblias fisicas.
 */
export const TALENTS_PER_CHAPTER: Record<Language, number> = {
  [Language.PT]: 2,
  [Language.EN]: 4,
};

/** Bonus ao concluir um livro inteiro da Biblia (documento V2). */
export const BOOK_COMPLETION_XP_BONUS = 150;
export const BOOK_COMPLETION_TALENTS_BONUS = 20;

/** XP extra por quiz/flashcard dominado no capitulo (documento V2). */
export const QUIZ_XP_BONUS = 10;
export const QUIZ_TALENTS_BONUS = 2;

/** Bonus ao concluir a Biblia toda (documento V2). */
export const WHOLE_BIBLE_XP_BONUS = 2500;

/**
 * Talentos necessarios para doar 1 Biblia fisica integral.
 * Concluir a Biblia toda (1.189 cap.) garante ao menos 1 doacao.
 */
export const TALENTS_PER_BIBLE_DONATION = 1000;

/**
 * @deprecated Mantido para compatibilidade. Use TALENTS_PER_BIBLE_DONATION.
 * Capitulos lidos necessarios para acumular uma Biblia doada.
 */
export const CHAPTERS_PER_BIBLE_DONATION = TOTAL_BIBLE_CHAPTERS;

/** As 5 Grandes Eras de Discipulado (documento V2). */
export enum DiscipleshipLevel {
  APPRENTICE = 1, // Aprendiz da Palavra (Neofito)
  WALKER = 2, // Discipulo Caminhante (Consistente)
  GUARDIAN = 3, // Guardiao da Palavra (Praticante)
  MASTER = 4, // Mestre & Discipulador (Lider de Impacto)
  EXEGETE = 5, // Expert & Exegeta (Mestre Teologico)
}

/** Metadados de cada Era de Discipulado (nome, faixa de ingles, capitulos-alvo). */
export interface DiscipleshipTier {
  level: DiscipleshipLevel;
  name: string;
  englishLevel: string;
  /** Capitulos lidos para alcancar este nivel (criterio simplificado). */
  chaptersRequired: number;
}

export const DISCIPLESHIP_TIERS: DiscipleshipTier[] = [
  { level: DiscipleshipLevel.APPRENTICE, name: 'Aprendiz da Palavra', englishLevel: 'A1/A2', chaptersRequired: 0 },
  { level: DiscipleshipLevel.WALKER, name: 'Discipulo Caminhante', englishLevel: 'B1', chaptersRequired: 100 },
  { level: DiscipleshipLevel.GUARDIAN, name: 'Guardiao da Palavra', englishLevel: 'B2', chaptersRequired: 400 },
  { level: DiscipleshipLevel.MASTER, name: 'Mestre & Discipulador', englishLevel: 'C1', chaptersRequired: 750 },
  { level: DiscipleshipLevel.EXEGETE, name: 'Expert & Exegeta', englishLevel: 'C2', chaptersRequired: 1189 },
];
