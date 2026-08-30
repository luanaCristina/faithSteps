/**
 * Repositorio do cache de IA por capitulo. Guarda o JSON gerado por
 * (kind, ref, language, provider) para evitar chamadas repetidas ao LLM.
 */
import { query } from '@/config/database';

export type AiCacheKind = 'summary' | 'quiz' | 'flashcards';

interface CacheRow<T> {
  payload: T;
}

export const aiCacheRepository = {
  async get<T>(
    kind: AiCacheKind,
    ref: string,
    language: string,
    provider: string,
  ): Promise<T | null> {
    const res = await query<CacheRow<T>>(
      `SELECT payload FROM ai_chapter_cache
        WHERE kind = $1 AND ref = $2 AND language = $3 AND provider = $4`,
      [kind, ref, language, provider],
    );
    return res.rows[0] ? (res.rows[0].payload as T) : null;
  },

  async set<T>(
    kind: AiCacheKind,
    ref: string,
    language: string,
    provider: string,
    payload: T,
  ): Promise<void> {
    await query(
      `INSERT INTO ai_chapter_cache (kind, ref, language, provider, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (kind, ref, language, provider)
       DO UPDATE SET payload = EXCLUDED.payload, created_at = now()`,
      [kind, ref, language, provider, JSON.stringify(payload)],
    );
  },
};
