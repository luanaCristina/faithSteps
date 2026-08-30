-- 007_auth_sessions_and_reading_position.sql
-- Cadastro/login por sessão e retomada da última posição de leitura.
-- ---------------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS auth_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions (expires_at);

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS last_book_usfm VARCHAR(10),
  ADD COLUMN IF NOT EXISTS last_chapter INTEGER,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'ck_user_progress_last_chapter_positive'
  ) THEN
    ALTER TABLE user_progress
      ADD CONSTRAINT ck_user_progress_last_chapter_positive
      CHECK (last_chapter IS NULL OR last_chapter > 0);
  END IF;
END $$;
