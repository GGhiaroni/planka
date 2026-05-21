---
title: "Implementação: Supabase Mirroring (cards + form_submissions + card_events)"
aliases:
  - "Supabase Mirroring impl"
tags:
  - a4tunados
  - tuninho/escriba
  - type/implementation
  - status/active
date: 2026-05-19
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[decisoes/ADR-003-supabase-mirroring]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/report-executivo]]"
---

# Implementação — Supabase Mirroring

## Visão Geral

Sync write-only Planka → Supabase em 3 tabelas (`form_submissions`, `cards`, `card_events`) implementado em PR #14 (Ghiaroni, 2026-05-19). Habilitado em prod no Card 928537 (2026-05-19).

Decisão: ver [[decisoes/ADR-003-supabase-mirroring]].

## Stack / Dependências

| Componente | Versão | Função |
|---|---|---|
| `@supabase/supabase-js` | `^2` | Cliente Node oficial Supabase (REST + Realtime) |
| Supabase project | gerenciado | DB Postgres 15 + PostgREST + Auth + Dashboard |
| Service role key (`SUPABASE_SECRET_KEY`) | server-only | Bypassa RLS — só backend (Planka server + ticket-form) |

## Arquivos

| Arquivo | LOC | Função |
|---|---|---|
| `server/utils/supabase.js` | 135 | Client + helpers Planka backend (`logCardEvent`, `upsertCard`) |
| `ticket-form/src/supabase.js` | 126 | Client + helpers ticket-form (`logFormSubmission`, `upsertCard`, `logCardEvent`) |
| `server/api/helpers/cards/create-one.js` | +27 | Chama `upsertCard` + `logCardEvent('create')` |
| `server/api/helpers/cards/update-one.js` | +50 | `upsertCard` + `logCardEvent('update')` |
| `server/api/helpers/cards/delete-one.js` | +13 | `logCardEvent('delete')` |
| `server/api/helpers/card-labels/create-one.js` | +12 | `logCardEvent('label_add')` |
| `server/api/helpers/card-labels/delete-one.js` | +12 | `logCardEvent('label_remove')` |
| `ticket-form/src/manutencaoHandler.js` | +49 | `logFormSubmission('chamado')` + `upsertCard` + `logCardEvent('form_submit_chamado')` |
| `ticket-form/src/gformsHandler.js` | +43 | Equivalente para Google Forms webhook |
| `ticket-form/src/handler.js` (form Design) | — | **NÃO escreve** form_submissions (by-design) |
| `supabase/migrations/001_initial_schema.sql` | 96 | DDL das 3 tabelas |
| `supabase/README.md` | 84 | Setup + schema overview |

## Schema das tabelas

### `form_submissions`

```sql
id              UUID         PK DEFAULT gen_random_uuid()
form_type       TEXT         NOT NULL  -- 'chamado' | 'gforms' | 'design'
payload         JSONB        NOT NULL  -- payload bruto da submissão
planka_card_id  TEXT         NULL      -- FK lógica → cards.planka_id
os_number       TEXT         NULL      -- OS gerada (só para chamados)
status          TEXT         NOT NULL  -- 'created' | 'failed'
error_message   TEXT         NULL      -- se status='failed'
created_at      TIMESTAMPTZ  DEFAULT now()
```

### `cards`

```sql
planka_id       TEXT         PK
board_id        TEXT
list_id         TEXT
project_name    TEXT
board_name      TEXT
list_name       TEXT
name            TEXT
description     TEXT
labels          JSONB        -- snapshot [{name, color}]
custom_fields   JSONB        -- snapshot {field_name: value}
created_at      TIMESTAMPTZ  DEFAULT now()
updated_at      TIMESTAMPTZ  DEFAULT now()
```

Upsert por `planka_id` — re-execução sobrescreve com snapshot mais recente.

### `card_events`

```sql
id              UUID         PK
planka_card_id  TEXT         NOT NULL
event_type      TEXT         NOT NULL  -- 'create' | 'update' | 'delete' | 'label_add' | 'label_remove' | 'form_submit_chamado' | ...
data            JSONB        NOT NULL  -- payload do evento (campos antes/depois)
user_email      TEXT         NULL      -- email do operador que disparou
created_at      TIMESTAMPTZ  DEFAULT now()
```

Append-only — nunca DELETE/UPDATE.

## Lifecycle de um chamado

```
1. Operador acessa form-pdviewerp-stagging.fourtuna.com.br/manutencao.html
2. Submete form → POST /api/manutencao
3. ticket-form:manutencaoHandler.js:
   3.1 valida campos obrigatórios
   3.2 createCardInList(chamadosListId, name, '')  → Planka API
        ├─ Planka server:cards/create-one.js:
        │   ├─ insert no Postgres Planka
        │   ├─ supabase.upsertCard(card)               ← cards table
        │   └─ supabase.logCardEvent('create', card)   ← card_events
        └─ retorna {item: card}
   3.3 attachLabel(card.id, labelId) → Planka API
        ├─ Planka server:card-labels/create-one.js:
        │   └─ supabase.logCardEvent('label_add')      ← card_events
   3.4 createCardCustomFieldGroups(card.id, [groups]) → Planka API (custom_fields no card)
   3.5 Promise.all([
         supabase.logFormSubmission('chamado', payload, card.id, os)  ← form_submissions
         supabase.upsertCard({...com custom_fields populados...})      ← cards (re-upsert)
         supabase.logCardEvent('form_submit_chamado', ...)             ← card_events
       ])
4. Retorna { ok: true, os: '260519193527-017' }
```

Resultado para uma submissão de chamado: **1 row form_submissions + 3 rows card_events** (create, label_add, form_submit_chamado) + **1 entry em cards**.

## Lifecycle de submissão Design (`/api/submit`)

`/api/submit` usa `handler.js` que NÃO chama supabase. Só:
1. valida motivo + descrição
2. `createCard(name, description)` → cria card em "Demanda"
3. Planka webhook do server (cards/create-one.js) escreve `card_events('create')`

→ **1 row card_events** apenas. Nenhuma row em form_submissions. Comportamento intencional — form Design não tem semântica de "submissão estruturada" para BI.

## Comportamento gracioso (sem env vars)

Se `SUPABASE_URL` ou `SUPABASE_SECRET_KEY` ausentes no env:

```js
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  // client = null
  // all helpers become no-ops + warn once
}
```

Permite rodar staging/dev local sem Supabase configurado. Não bloqueia operação principal (criação de card no Planka funciona normalmente).

## Pontos de falha conhecidos / pendências

1. **Sem retry queue local** — se Supabase está down/lento na hora do `logCardEvent`, evento perdido. Mitigação futura: gravar em fila local (Redis ou Postgres planka) + replay job.
2. **Build longo do Docker** — `npm install @supabase/supabase-js@^2` no Dockerfile adiciona ~5min ao build, causando SSH timeout do runner GH Actions (documentado em [[ADR-001-deploy-staging-cicd]] e Card 928537). Mitigação proposta: pre-install em layer cacheada via `package-lock.json` ou `npm ci`.
3. **`SUPABASE_SECRET_KEY` é service_role** — bypassa RLS. Vazamento (como o que aconteceu no body do Card 928537) compromete a integridade do mirror. Recomendação: rotação trimestral + audit log Supabase Dashboard.
4. **Schema migration manual** — `supabase/migrations/001_initial_schema.sql` precisa ser aplicado via Dashboard ou `supabase migration up`. Não há automação no deploy.

## Como testar

### A) Pipeline `/api/manutencao` (escreve nas 3 tabelas)

```bash
curl -X POST 'https://form-pdviewerp-stagging.fourtuna.com.br/api/manutencao' \
  -H 'Content-Type: application/json' \
  -d '{
    "cliente":"TESTE",
    "bandeira":"TESTE",
    "cidade":"Sao Paulo",
    "estado":"SP",
    "motivo":"validar pipeline",
    "garantia":"Sim",
    "prioridade":"BAIXA PRIORIDADE"
  }'
```

Esperado: `{"ok":true,"os":"YYMMDDHHmm-NNN"}` + 1 form_submission + 3 card_events.

### B) Validar via Supabase REST API (chave do .env do VPS)

```bash
ssh root@hostinger-beta
cd /opt/hostinger-beta/planka
source .env
curl -sS \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  "$SUPABASE_URL/rest/v1/form_submissions?select=*&order=created_at.desc&limit=5"
```

### C) Validar via SQL Editor (UI Supabase Dashboard)

```sql
select event_type, planka_card_id, created_at
from card_events
order by created_at desc
limit 10;

select form_type, planka_card_id, os_number, status, created_at
from form_submissions
order by created_at desc
limit 10;
```

## Referências

- ADR: [[decisoes/ADR-003-supabase-mirroring]]
- Card 928537 (habilitação prod): [[cards/1778610132976928537_atualizacao-env-hostinger/report-executivo]]
- PR #14: https://github.com/GGhiaroni/planka/pull/14
- `supabase/README.md` (no repo)
