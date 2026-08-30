-- ---------------------------------------------------------------------------
-- 005_book_completions_and_badges.sql
-- Documento V2: bonus por livro concluido, insignias (badges) e tempo de leitura.
-- ---------------------------------------------------------------------------

-- Livros concluidos por usuario/desafio (garante o bonus de +150 XP uma unica vez).
CREATE TABLE IF NOT EXISTS book_completions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    challenge_id   UUID NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
    book_usfm      VARCHAR(10) NOT NULL,
    xp_awarded     INTEGER NOT NULL DEFAULT 0,
    talents_awarded INTEGER NOT NULL DEFAULT 0,
    completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_book_completion UNIQUE (user_id, challenge_id, book_usfm)
);

CREATE INDEX IF NOT EXISTS idx_book_completions_user ON book_completions (user_id);

-- Insignias conquistadas (ex.: "Primeiros Passos", "Palavra Cumprida", "Insignia do Livro").
CREATE TABLE IF NOT EXISTS badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code        VARCHAR(60) NOT NULL,
    label       VARCHAR(120) NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_badge UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges (user_id);

-- Tempo de leitura acumulado e ofensiva (streak) por usuario.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reading_minutes INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_streak  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_read_date  DATE;
