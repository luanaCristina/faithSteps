-- ---------------------------------------------------------------------------
-- 002_create_challenges.sql
-- Desafios Biblicos: Biblia Toda, Sazonais/Tematicos e de Servico.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS challenges (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug               VARCHAR(120) NOT NULL UNIQUE,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    -- Tipo do desafio:
    --   WHOLE_BIBLE  -> Desafio da Biblia Toda (1.189 capitulos)
    --   SEASONAL     -> Sazonais/tematicos (ex: "Evangelhos em 30 dias")
    --   SERVICE      -> Comunitario/impacto social (Amar ao Proximo)
    challenge_type     VARCHAR(20) NOT NULL
        CHECK (challenge_type IN ('WHOLE_BIBLE', 'SEASONAL', 'SERVICE')),
    -- Total de capitulos-alvo (1189 para a Biblia toda)
    total_chapters     INTEGER NOT NULL CHECK (total_chapters > 0),
    -- Referencia opcional ao Reading Plan da API YouVersion
    youversion_plan_id VARCHAR(120),
    -- Meta coletiva (usado por SERVICE): capitulos que destravam a doacao
    collective_goal_chapters INTEGER CHECK (collective_goal_chapters IS NULL OR collective_goal_chapters > 0),
    -- Janela do desafio (opcional para sazonais)
    starts_at          TIMESTAMPTZ,
    ends_at            TIMESTAMPTZ,
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_challenge_window
        CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges (challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges (is_active);
