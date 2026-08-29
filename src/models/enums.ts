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

/**
 * Regras de XP por capitulo concluido, por idioma.
 * PT reforca a leitura; EN premia o esforco bilingue adicional.
 */
export const XP_PER_CHAPTER: Record<Language, number> = {
  [Language.PT]: 15,
  [Language.EN]: 25,
};

/**
 * Capitulos lidos necessarios para acumular uma Biblia doada.
 * Alinhado ao Desafio da Biblia Toda.
 */
export const CHAPTERS_PER_BIBLE_DONATION = TOTAL_BIBLE_CHAPTERS;
