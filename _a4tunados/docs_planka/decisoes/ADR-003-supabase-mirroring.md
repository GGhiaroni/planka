---
title: "ADR-003: Espelhamento bidirecional Planka → Supabase para BI/auditoria"
aliases:
  - "ADR-003"
  - "Supabase mirroring"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/inferred
date: 2026-05-19
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[implementacao/supabase-mirroring]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/sessoes/2026-05-19_01_card-928537-deploy-supabase]]"
---

# ADR-003: Espelhamento Planka → Supabase

## Status

**Inferida** — implementada por **Gabriel Ghiaroni** na PR [#14 `feat/conecta-ao-supabase`](https://github.com/GGhiaroni/planka/pull/14) (commit `0d2dc09e`, 2026-05-19) sem ADR explícita. Esta entrada é retroativa via escriba modo forense (operador estrangeiro).

## Contexto

Planka armazena tudo em PostgreSQL local do container (`planka-postgres-1`, volume `planka_postgres-data`). Esse banco é:

- **Acoplado ao runtime**: queries diretas exigem `docker exec planka-postgres-1 psql ...` ou expor a porta 5432 (atualmente loopback only).
- **Sujeito a perda em rebuild**: embora o volume persista, há risco operacional em rollback agressivo.
- **Não-queryable por dashboards externos**: BI / relatórios de chamados / análise de SLA exigem ETL ad-hoc.
- **Sem auditoria nativa rica**: Planka tem `Action`/log no schema próprio, mas é otimizado pra UI, não pra evento-source analítico.

Surge a demanda: **mirror near-realtime do estado dos cards + dos eventos de form submission para um banco externo gerenciado** — Supabase (PostgreSQL gerenciado + REST API + dashboard SQL Editor + Realtime opcional futuro).

## Decisão

Implementar **sync write-only Planka → Supabase** em três tabelas:

1. **`form_submissions`** — chamado registrado via `ticket-form` (`/api/manutencao`, `/api/gforms`), com payload bruto + `planka_card_id` referenciando o card criado.
2. **`cards`** — estado canônico do card (upsert por `planka_id`), populado em create + reflete labels + custom_fields snapshot.
3. **`card_events`** — append-only timeline de eventos (`create`, `update`, `label_add`, `label_remove`, `delete`, `form_submit_chamado`, `form_submit_design`, ...), com `planka_card_id` + `event_type` + payload.

**Pontos de injeção** (server Planka):
- `server/api/helpers/cards/create-one.js` → `upsertCard` + `logCardEvent('create')`
- `server/api/helpers/cards/update-one.js` → `upsertCard` + `logCardEvent('update')`
- `server/api/helpers/cards/delete-one.js` → `logCardEvent('delete')`
- `server/api/helpers/card-labels/create-one.js` → `logCardEvent('label_add')`
- `server/api/helpers/card-labels/delete-one.js` → `logCardEvent('label_remove')`

**Pontos de injeção** (ticket-form):
- `ticket-form/src/manutencaoHandler.js` → `logFormSubmission('chamado')` + `upsertCard` + `logCardEvent('form_submit_chamado')`
- `ticket-form/src/gformsHandler.js` → idem com tipo `gforms`
- `ticket-form/src/handler.js` (form Design `/api/submit`) — **NÃO escreve `form_submissions`** por design — só dispara `card_events` via webhook do Planka quando o card é criado.

**Client centralizado**:
- `server/utils/supabase.js` (Planka backend)
- `ticket-form/src/supabase.js` (ticket-form Node service)

Ambos lendo `SUPABASE_URL` + `SUPABASE_SECRET_KEY` do env. Se uma das vars está ausente, o client retorna no-op + warn log — comportamento gracioso pra dev local sem Supabase configurado.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Postgres logical replication** (slot + publication direto pra Supabase) | Realtime nativo, sem código na app | Acoplamento ao schema Planka (mudança upstream quebra), exige Supabase rodar replicação inversa, mais complexo operacionalmente |
| **CDC via Debezium/Kafka** | Padrão enterprise, desacoplado | Overhead de infra brutal pra um staging single-tenant |
| **Webhook → endpoint Supabase Function** | Sem dependência de SDK no servidor | Latência adicional, falha silenciosa se função cair |
| **SDK direto no server (escolhido)** | Latência mínima, código auditável, best-effort sem bloquear request | Acopla `@supabase/supabase-js` ao bundle Planka (+130MB image), sem replay automático em falha — eventos perdidos ficam perdidos |

## Consequências

**Positivas:**
- BI/relatórios via Supabase SQL Editor sem tocar produção.
- Auditoria externa (`card_events` append-only) sobrevive a wipes do banco Planka.
- Dashboards futuros (PowerBI, Metabase, Looker) podem consumir Supabase REST/PostgREST.
- Stack secundário gerenciado (sem ops de DB próprio).

**Negativas / riscos:**
- **Best-effort**: se Supabase está offline ou a key expira, eventos perdidos não são re-tentados (NÃO há retry queue local). Mitigação futura: pendency-ledger local com replay.
- **+130MB na imagem** `planka-custom:latest` (596MB → 726MB) por causa do `@supabase/supabase-js`. Aceito porque a image é interna.
- **Build longo** (`npm install @supabase/supabase-js@^2` adiciona ~5min de build) — causa raiz do failure mode "SSH timeout do runner" documentado em `DEPLOY-STAGING.md`. Ver [[ADR-001-deploy-staging-cicd]] e Card 928537.
- **Secrets em .env do VPS**: `SUPABASE_SECRET_KEY` é service_role — bypassa RLS. Rotação manual recomendada. Card 928537 expôs a chave no body do mural (rotação foi sinalizada como pendência).
- **Schema dual**: cards/labels existem em 2 bancos com semânticas levemente distintas — Planka tem ID Snowflake, Supabase armazena `planka_card_id` como string.

## Schema Supabase (referência)

Ver `supabase/migrations/001_initial_schema.sql` no repo + `supabase/README.md`. Resumo:

- **`form_submissions`**: `id UUID PK | form_type TEXT | payload JSONB | planka_card_id TEXT | os_number TEXT | status TEXT | error_message TEXT | created_at TIMESTAMPTZ`
- **`cards`**: `planka_id TEXT PK | board_id TEXT | list_id TEXT | project_name TEXT | board_name TEXT | list_name TEXT | name TEXT | description TEXT | labels JSONB | custom_fields JSONB | created_at TIMESTAMPTZ | updated_at TIMESTAMPTZ`
- **`card_events`**: `id UUID PK | planka_card_id TEXT | event_type TEXT | data JSONB | user_email TEXT | created_at TIMESTAMPTZ`

## Validação em produção (2026-05-19)

Card [[cards/1778610132976928537_atualizacao-env-hostinger/sessoes/2026-05-19_01_card-928537-deploy-supabase|928537]] habilitou as 2 env vars no VPS e validou via API REST do Supabase:

- `/api/manutencao` → 1 row em `form_submissions` + 3 rows em `card_events` (create, label_add, form_submit_chamado).
- Webhook Planka server → row em `card_events` para card criado via API direta.
- `/api/submit` (Design form) → row em `card_events` (via webhook), **sem** row em `form_submissions` (by-design).

## Referências

- PR #14: https://github.com/GGhiaroni/planka/pull/14
- Commit principal: `0d2dc09e feat: espelhamento de cards e formulários para Supabase`
- Files: `server/utils/supabase.js` (135 LOC), `ticket-form/src/supabase.js` (126 LOC), `supabase/migrations/001_initial_schema.sql` (96 LOC)
- Card 928537: [[cards/1778610132976928537_atualizacao-env-hostinger/report-executivo]]
