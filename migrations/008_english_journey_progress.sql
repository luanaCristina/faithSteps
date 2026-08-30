-- 008_english_journey_progress.sql
-- Conclusão das lições da jornada de Inglês baseada na Bíblia.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS english_lesson_completions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id    VARCHAR(40) NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_english_lesson_completion UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_english_lesson_user
  ON english_lesson_completions (user_id);
