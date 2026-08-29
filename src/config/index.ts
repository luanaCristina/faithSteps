/**
 * Configuracao centralizada via variaveis de ambiente.
 * Segredos (chave YouVersion) vem apenas do ambiente - nunca hardcoded.
 */
import { Language, XP_PER_CHAPTER } from '@/models';

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: int(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'faithsteps',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  },

  youversion: {
    baseUrl: process.env.YOUVERSION_API_BASE_URL ?? 'https://api.youversion.com/v1',
    apiKey: process.env.YOUVERSION_API_KEY ?? '',
    useMock: (process.env.YOUVERSION_USE_MOCK ?? 'false').toLowerCase() === 'true',
  },

  gamification: {
    xpPerChapter: {
      [Language.PT]: int(process.env.XP_PER_CHAPTER_PT, XP_PER_CHAPTER[Language.PT]),
      [Language.EN]: int(process.env.XP_PER_CHAPTER_EN, XP_PER_CHAPTER[Language.EN]),
    },
  },
};

export type AppConfig = typeof config;
