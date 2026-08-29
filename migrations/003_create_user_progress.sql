-- ---------------------------------------------------------------------------
-- 003_create_user_progress.sql
-- Progresso do usuario em um desafio + registro de capitulos concluidos.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_progress (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    challenge_id     UUID NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
    chapters_read    INTEGER NOT NULL DEFAULT 0 CHECK (chapters_read >= 0),
    xp_earned        INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    status           VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Um usuario tem um unico registro de progresso por desafio
    CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_challenge ON user_progress (challenge_id);

-- ---------------------------------------------------------------------------
-- Capitulos individuais concluidos (idempotencia da sincronizacao com YouVersion).
-- Evita creditar XP duas vezes para o mesmo capitulo/idioma.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapter_completions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    challenge_id   UUID NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
    -- Identificadores da API YouVersion (ex.: book_usfm = 'JHN', chapter = 3)
    book_usfm      VARCHAR(10) NOT NULL,
    chapter        INTEGER NOT NULL CHECK (chapter > 0),
    language       VARCHAR(2) NOT NULL CHECK (language IN ('pt', 'en')),
    xp_awarded     INTEGER NOT NULL CHECK (xp_awarded >= 0),
    completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Idempotencia: o mesmo capitulo/idioma nao pode ser creditado 2x no desafio
    CONSTRAINT uq_chapter_completion
        UNIQUE (user_id, challenge_id, book_usfm, chapter, language)
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON chapter_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_completions_challenge ON chapter_completions (challenge_id);
