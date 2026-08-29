-- ---------------------------------------------------------------------------
-- 001_create_users.sql
-- Usuarios do FaithSteps: identidade, gamificacao (XP/nivel) e idioma preferido.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    display_name      VARCHAR(120) NOT NULL,
    -- Idioma preferido para leitura/tutor bilingue: 'pt' | 'en'
    preferred_language VARCHAR(2) NOT NULL DEFAULT 'pt'
        CHECK (preferred_language IN ('pt', 'en')),
    -- Gamificacao
    total_xp          INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    level             INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    -- ID do usuario correspondente na plataforma YouVersion (opcional)
    youversion_user_id VARCHAR(120),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_youversion ON users (youversion_user_id);
