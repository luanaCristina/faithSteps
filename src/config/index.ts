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
    // Provedores gerenciados (Neon/Render) fornecem uma connection string unica.
    // Quando presente, ela tem prioridade sobre os campos individuais.
    url: process.env.DATABASE_URL ?? '',
    host: process.env.DB_HOST ?? 'localhost',
    port: int(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'faithsteps',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    // SSL obrigatorio na maioria dos Postgres gerenciados (Neon exige).
    ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
  },

  // Executa migrations automaticamente ao subir (util no free tier).
  runMigrationsOnBoot:
    (process.env.RUN_MIGRATIONS_ON_BOOT ?? 'false').toLowerCase() === 'true',

  youversion: {
    baseUrl: process.env.YOUVERSION_API_BASE_URL ?? 'https://api.youversion.com/v1',
    apiKey: process.env.YOUVERSION_API_KEY ?? '',
    useMock: (process.env.YOUVERSION_USE_MOCK ?? 'false').toLowerCase() === 'true',
    // version_id da Biblia por idioma (YouVersion Platform).
    // Default 3034 (BSB, dominio publico) - versao liberada para apps free.
    // Versoes com copyright (ex.: NVI=129, NIV=111) exigem acesso concedido a app,
    // senao a API retorna 404. Ajuste por env se sua app tiver acesso.
    versionId: {
      [Language.PT]: int(process.env.YOUVERSION_VERSION_ID_PT, 3034),
      [Language.EN]: int(process.env.YOUVERSION_VERSION_ID_EN, 3034),
    },
  },

  gamification: {
    xpPerChapter: {
      [Language.PT]: int(process.env.XP_PER_CHAPTER_PT, XP_PER_CHAPTER[Language.PT]),
      [Language.EN]: int(process.env.XP_PER_CHAPTER_EN, XP_PER_CHAPTER[Language.EN]),
    },
  },

  ai: {
    // 'mock' (default, gratis) ou 'gemini' (requer GEMINI_API_KEY).
    provider: (process.env.AI_PROVIDER ?? 'mock').toLowerCase() as 'mock' | 'gemini',
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? '',
      model: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
      baseUrl:
        process.env.GEMINI_BASE_URL ??
        'https://generativelanguage.googleapis.com/v1beta',
    },
  },
};

export type AppConfig = typeof config;
