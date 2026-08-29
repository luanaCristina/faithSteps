-- ---------------------------------------------------------------------------
-- 004_create_talents.sql
-- Talentos: moeda redentiva acumulada pela leitura, convertida em doacao de
-- Biblias fisicas (Amar ao Proximo). Ledger append-only + saldo agregado.
-- ---------------------------------------------------------------------------

-- Saldo agregado por usuario (leitura rapida)
CREATE TABLE IF NOT EXISTS talents (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    balance            INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    bibles_donated     INTEGER NOT NULL DEFAULT 0 CHECK (bibles_donated >= 0),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talents_user ON talents (user_id);

-- Historico imutavel de movimentacoes (auditoria e transparencia)
CREATE TABLE IF NOT EXISTS talent_transactions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- EARN   -> acumulo por leitura
    -- DONATE -> conversao em doacao de Biblia
    kind           VARCHAR(10) NOT NULL CHECK (kind IN ('EARN', 'DONATE')),
    amount         INTEGER NOT NULL CHECK (amount > 0),
    -- Origem do ganho (opcional): capitulo/desafio que gerou os talentos
    source_challenge_id UUID REFERENCES challenges (id) ON DELETE SET NULL,
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_tx_user ON talent_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_talent_tx_kind ON talent_transactions (kind);
