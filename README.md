# YouVersion FaithSteps

Ecossistema redentivo de discipulado gamificado, aprendizado bilíngue de inglês e leitura integral da Bíblia (1.189 capítulos). O objetivo é a formação do caráter de Cristo através dos dois grandes mandamentos: amar a Deus sobre todas as coisas e amar ao próximo como a si mesmo.

## Manifesto — Lamento e Oração

> "Redime esta aplicação, ó Deus!
>
> Que cada linha de código seja uma oração e cada capítulo lido uma entrega.
>
> Transforma o nosso esforço humano em instrumento do Teu Espírito,
>
> Para que não busquemos aplausos para nós,
>
> Mas que vidas sejam formadas, restauradas e tornadas parecidas com Jesus.
>
> Amém."

## Visão Geral

O FaithSteps integra-se à YouVersion / Bible API para consumir livros, capítulos, planos de leitura e o Versículo do Dia. À medida que o usuário marca capítulos como concluídos, o motor de sincronização credita XP e acumula Talentos, uma moeda redentiva convertida em doação de Bíblias físicas.

### Regras de gamificação

- Concluir um capítulo em Português concede **+15 XP**.
- Concluir um capítulo em Inglês concede **+25 XP** (esforço bilíngue).
- Cada capítulo lido acumula Talentos; ao atingir 1.189 (a Bíblia toda), uma Bíblia é doada.
- O Desafio da Bíblia Toda acompanha progresso, percentual e estimativa dinâmica de conclusão, **sem penalidades**.

## Módulo de Desafios (Challenges Engine)

1. **Bíblia Toda** (1.189 capítulos): barra de progresso, percentual e estimativa dinâmica.
2. **Sazonais / Temáticos**: estrutura flexível consumindo Reading Plans da API (ex.: "Evangelhos em 30 dias").
3. **De Serviço (Amar ao Próximo)**: metas coletivas que destravam impacto social e doação de Bíblias físicas.

## Stack

- Node.js + TypeScript (strict, ES2020, CommonJS)
- Express 4
- PostgreSQL via `pg` (SQL cru, sem ORM)
- Zod para validação
- Jest + Supertest + fast-check para testes

## Estrutura

```
src/
├── app.ts                     # App Express (middleware, rotas, error handler)
├── server.ts                  # Entry point (dotenv, listen)
├── config/                    # database, config, migrate
├── middleware/                # validate (Zod)
├── models/                    # enums, types, errors, requests
├── modules/                   # lógica pura: gamification, challenges-engine
├── integrations/youversion/   # cliente da Bible API (http + mock) e interfaces
├── repositories/              # SQL cru + mapeamento snake_case -> camelCase
├── routes/                    # controllers finos
└── services/                  # interfaces de orquestração (progress-sync, challenge)
migrations/                    # 001_users, 002_challenges, 003_user_progress, 004_talents
```

## Schemas do Banco (resumo)

- **users**: identidade, idioma preferido (pt/en), `total_xp`, `level`, `youversion_user_id`.
- **challenges**: `challenge_type` (WHOLE_BIBLE | SEASONAL | SERVICE), `total_chapters`, `youversion_plan_id`, meta coletiva.
- **user_progress** + **chapter_completions**: progresso por desafio e capítulos concluídos (com idempotência).
- **talents** + **talent_transactions**: saldo agregado e ledger append-only (EARN | DONATE).

## Integração com a YouVersion API

A implementação está em `src/integrations/youversion/`. O contrato `YouVersionService` expõe `listBooks`, `listChapters`, `getReadingPlan` e `getVerseOfTheDay`. Há duas implementações:

- `HttpYouVersionService`: consome a API real (chave via variável de ambiente).
- `MockYouVersionService`: dados determinísticos para staging/dev (`YOUVERSION_USE_MOCK=true`).

> **Segurança:** a chave da YouVersion vem **apenas** de `YOUVERSION_API_KEY` no `.env` (nunca commitada). Se uma chave for exposta, rotacione-a imediatamente no portal da plataforma.

## Como rodar

```bash
cp .env.example .env      # preencha as variáveis
npm install
npm run migrate           # aplica as migrations em ordem
npm run dev               # sobe a API em modo desenvolvimento
```

Outros comandos: `npm run build`, `npm start`, `npm test`, `npm run test:coverage`.

## Variáveis de Ambiente

| Variável                 | Padrão                          |
|--------------------------|---------------------------------|
| PORT                     | 3000                            |
| DB_HOST                  | localhost                       |
| DB_PORT                  | 5432                            |
| DB_NAME                  | faithsteps                      |
| DB_USER                  | postgres                        |
| DB_PASSWORD              | postgres                        |
| YOUVERSION_API_BASE_URL  | https://api.youversion.com/v1   |
| YOUVERSION_API_KEY       | (obrigatória, via .env)         |
| YOUVERSION_USE_MOCK      | false                           |
| XP_PER_CHAPTER_PT        | 15                              |
| XP_PER_CHAPTER_EN        | 25                              |
