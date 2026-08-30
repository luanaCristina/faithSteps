/**
 * Regras puras de gamificacao (documento V2): XP, Talentos, niveis de
 * discipulado e bonus. Sem I/O - facilmente testavel (unit + property-based).
 */
import {
  BOOK_COMPLETION_TALENTS_BONUS,
  BOOK_COMPLETION_XP_BONUS,
  DISCIPLESHIP_TIERS,
  DiscipleshipLevel,
  DiscipleshipTier,
  Language,
  TALENTS_PER_BIBLE_DONATION,
  TALENTS_PER_CHAPTER,
  XP_PER_CHAPTER,
} from '@/models';

/** XP concedido ao concluir um capitulo no idioma informado. */
export function xpForChapter(language: Language): number {
  return XP_PER_CHAPTER[language];
}

/** Talentos concedidos ao concluir um capitulo no idioma informado. */
export function talentsForChapter(language: Language): number {
  return TALENTS_PER_CHAPTER[language];
}

/** Bonus de XP ao concluir um livro inteiro. */
export function bookCompletionXp(): number {
  return BOOK_COMPLETION_XP_BONUS;
}

/** Bonus de Talentos ao concluir um livro inteiro. */
export function bookCompletionTalents(): number {
  return BOOK_COMPLETION_TALENTS_BONUS;
}

/**
 * Nivel numerico a partir do XP total (curva simples: 100 XP por nivel).
 * Usado para a barra de XP; distinto das Eras de Discipulado.
 */
export function levelForXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(totalXp / 100) + 1;
}

/**
 * Era de Discipulado a partir do total de capitulos lidos (documento V2).
 * Retorna o maior tier cujo requisito de capitulos foi atingido.
 */
export function discipleshipTierForChapters(chaptersRead: number): DiscipleshipTier {
  const read = Math.max(0, chaptersRead);
  let current: DiscipleshipTier = DISCIPLESHIP_TIERS[0];
  for (const tier of DISCIPLESHIP_TIERS) {
    if (read >= tier.chaptersRequired) current = tier;
  }
  return current;
}

/** Atalho: apenas o nivel (enum) de discipulado. */
export function discipleshipLevelForChapters(chaptersRead: number): DiscipleshipLevel {
  return discipleshipTierForChapters(chaptersRead).level;
}

/**
 * Converte um saldo de Talentos no numero de Biblias que podem ser doadas
 * e no residual que permanece no saldo (1 Biblia = TALENTS_PER_BIBLE_DONATION).
 */
export function biblesFromTalents(balance: number): {
  bibles: number;
  remaining: number;
} {
  if (balance <= 0) return { bibles: 0, remaining: Math.max(0, balance) };
  const bibles = Math.floor(balance / TALENTS_PER_BIBLE_DONATION);
  const remaining = balance - bibles * TALENTS_PER_BIBLE_DONATION;
  return { bibles, remaining };
}
