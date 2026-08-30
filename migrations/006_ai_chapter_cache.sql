-- ---------------------------------------------------------------------------
-- 006_ai_chapter_cache.sql
-- Cache das geracoes de IA por capitulo/idioma. Evita chamadas repetidas ao
-- LLM (economia de custo) e da respostas instantaneas.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_chapter_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Tipo do conteudo: 'summary' | 'quiz' | 'flashcards'.
    kind        VARCHAR(20) NOT NULL,
    -- Referencia USFM do capitulo (ex.: 'JHN.3').
    ref         VARCHAR(40) NOT NULL,
    language    VARCHAR(2) NOT NULL CHECK (language IN ('pt', 'en')),
    -- Provedor que gerou (mock/gemini) - para invalidar se trocar.
    provider    VARCHAR(20) NOT NULL DEFAULT 'mock',
    -- Payload gerado (JSON).
    payload     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_ai_cache UNIQUE (kind, ref, language, provider)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup
    ON ai_chapter_cache (kind, ref, language, provider);
