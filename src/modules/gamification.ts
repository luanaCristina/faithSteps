/**
 * Regras puras de gamificacao: XP por leitura e conversao em Talentos.
 * Sem I/O - facilmente testavel (unit + property-based).
 */
import { CHAPTERS_PER_BIBLE_DONATION, Language, XP_PER_CHAPTER } from '@/models';

/** XP concedido ao concluir um capitulo no idioma informado. */
export function xpForChapter(language: Language): number {
  return XP_PER_CHAPTER[language];
}

/**
 * Nivel a partir do XP total.
 * Curva simples: cada nivel exige 100 XP. Nunca retorna abaixo de 1.
 */
export function levelForXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(totalXp / 100) + 1;
}

/**
 * Talentos ganhos por concluir um capitulo.
 * Regra redentiva: 1 capitulo lido = 1 Talento (acumula para doacao de Biblias).
 */
export function talentsForChapter(): number {
  return 1;
}

/**
 * Converte um saldo de Talentos no numero de Biblias que podem ser doadas
 * e no residual que permanece no saldo.
 */
export function biblesFromTalents(balance: number): {
  bibles: number;
  remaining: number;
} {
  if (balance <= 0) return { bibles: 0, remaining: Math.max(0, balance) };
  const bibles = Math.floor(balance / CHAPTERS_PER_BIBLE_DONATION);
  const remaining = balance - bibles * CHAPTERS_PER_BIBLE_DONATION;
  return { bibles, remaining };
}
