---
title: "Implementação: ticket-form (Node service de formularios → Planka + Supabase)"
aliases:
  - "ticket-form"
tags:
  - a4tunados
  - tuninho/escriba
  - type/implementation
  - status/active
date: 2026-05-19
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[implementacao/supabase-mirroring]]"
---

# Implementação — ticket-form

## Visão Geral

Serviço Node/Express auxiliar que serve **2 formulários públicos** + **1 endpoint webhook Google Forms** + integra com Planka API + Supabase mirroring.

Container: `planka-ticket-form-1` (imagem `planka-ticket-form:latest`), porta interna `3001` mapeada para `127.0.0.1:3002` no host (loopback), exposto externamente em `https://form-pdviewerp-stagging.fourtuna.com.br/` via nginx do host.

Construído por Gabriel Ghiaroni durante o bundle de PRs (PR #5 board seeding + form linkage, PR #13 ajuste design, PR #14 supabase mirror).

## Endpoints

| Path | Método | Handler | Destino | Escreve form_submissions? |
|---|---|---|---|---|
| `/` | GET | static `public/` | HTML do form Design | — |
| `/manutencao.html` | GET | static | HTML do form Manutenção (chamados técnicos) | — |
| `/artes.html` | GET | static | HTML do form Pedido de Artes | — |
| `/tabela.html` | GET | static | Tabela de preview de cards | — |
| `/api/config` | GET | inline | retorna `{CONTACT_REASONS, ...}` para o front | — |
| `/api/submit` | POST | `handler.js:submitHandler` | cria card em board Design "Demanda" | **NÃO** (by-design) |
| `/api/manutencao` | POST | `manutencaoHandler.js` | cria card em "Chamados Técnicos / Em Espera" + labels + custom fields | **SIM** (form_submissions + card_events) |
| `/api/gforms` | POST | `gformsHandler.js` | webhook Google Forms | **SIM** (form_submissions + card_events) |
| `/api/cards` | GET | inline | proxy de listagem de cards no Planka | — |

## Arquivos-fonte

```
ticket-form/
├── public/
│   ├── index.html         ← form Design
│   ├── manutencao.html    ← form Chamado Técnico (PR #13 ajustes)
│   ├── artes.html         ← form Pedido de Artes (PR #13)
│   ├── tabela.html        ← preview de cards
│   └── assets/
├── src/
│   ├── server.js          ← Express setup, 8 routes
│   ├── config.js          ← env loading + validations
│   ├── handler.js         ← /api/submit (Design — sem supabase)
│   ├── manutencaoHandler.js ← /api/manutencao (com supabase)
│   ├── gformsHandler.js   ← /api/gforms (com supabase)
│   ├── planka.js          ← cliente Planka API (login, createCard, attachLabel, ...)
│   └── supabase.js        ← cliente Supabase + helpers (PR #14)
├── package.json
└── Dockerfile
```

## Env vars (config.js)

```
PORT=3001 (default)
PLANKA_URL=http://planka:1337     ← url interna do container Planka
PLANKA_EMAIL=...                  ← form bot user
PLANKA_PASSWORD=...
PLANKA_LIST_ID=...                ← ID da lista "Demanda" (Design board) — opcional, fallback via PLANKA_PROJECT_NAME/BOARD_NAME/LIST_NAME
PLANKA_CHAMADOS_LIST_ID=...       ← ID da lista "Em Espera" (Chamados board)
PLANKA_PROJECT_NAME=PDView ERP    ← default
PLANKA_DESIGN_BOARD_NAME=Design
PLANKA_DESIGN_LIST_NAME=Demanda
PLANKA_CHAMADOS_BOARD_NAME=Chamados Técnicos
PLANKA_CHAMADOS_LIST_NAME=Em Espera
CONTACT_REASONS=Manutenção,Financeiro,Troca de Arte
PRIORITY_LABELS=BAIXA PRIORIDADE:<labelId>,MÉDIA GRAVIDADE:<labelId>,...
SUPABASE_URL=https://...supabase.co  ← PR #14, opcional
SUPABASE_SECRET_KEY=sb_secret_...    ← PR #14, opcional
```

## Fluxo `/api/manutencao` (canonical)

1. Validar campos obrigatórios: `cliente`, `bandeira`, `cidade`, `estado`, `motivo`, `garantia`, `prioridade`.
2. Resolver `chamadosListId` via `getChamadosListId()` (cache-on-first-fetch).
3. Resolver `labelId` por nome de prioridade via `getPriorityLabelId(prioridade)` → mapeia para um dos 8 labels:
   - BAIXA PRIORIDADE, MÉDIA GRAVIDADE, URGÊNCIA, EM TRATAMENTO, ATUALIZAÇÃO DO TRATAMENTO, PENDÊNCIAS DE INSTALAÇÃO, EM ESPERA, MÁXIMA PRIORIDADE.
4. Gerar OS no formato `YYMMDDHHmmss-NNN`.
5. `createCardInList(chamadosListId, cliente, '')` → POST Planka API → card criado em "Chamados Técnicos / Em Espera".
6. `attachLabel(card.id, labelId)`.
7. `createCardCustomFieldGroups(card.id, [{name: 'Dados do Chamado', fields: [...]}])` — popula OS, Cliente, Bandeira, Cidade, Estado, Data, Motivo, Garantia, Endereço, CEP, Resolução do Chamado.
8. `Promise.all([supabase.logFormSubmission, supabase.upsertCard, supabase.logCardEvent])` em best-effort (não bloqueia response em caso de falha Supabase).
9. Retornar `{ok: true, os: <OS>}`.

Erros possíveis e códigos HTTP:
- 400 `Campo obrigatório ausente: X` — validação 1
- 400 `Prioridade inválida: X` — validação 4
- 500 `Não foi possível localizar o board "Chamados Técnicos"` — falha em getChamadosListId
- 502 `Erro ao criar o chamado` — falha em createCardInList ou subsequentes

## Decisão: por que `/api/submit` (Design) NÃO escreve form_submissions?

Form Design é leve (motivo + descrição livre, ver `CONTACT_REASONS`). Não há semântica de "submissão estruturada" — é mais perto de "atalho de criação de card" que de "registro de chamado formal".

Eventos do card criado pelo /api/submit ainda são capturados via webhook do Planka server (`card_events('create')` em cards/create-one.js), o que mantém a auditoria mínima sem duplicar payload no form_submissions.

Para BI / SLA reports, a tabela `form_submissions` é o canon dos chamados técnicos (`form_type='chamado'`) — Design submissions são analisadas separadamente via `cards` + `card_events` filtrados por `board_name='Design'`.

## Como testar

```bash
# Manutenção
curl -X POST 'https://form-pdviewerp-stagging.fourtuna.com.br/api/manutencao' \
  -H 'Content-Type: application/json' \
  -d '{"cliente":"...", "bandeira":"...", "cidade":"...", ...}'

# Design
curl -X POST 'https://form-pdviewerp-stagging.fourtuna.com.br/api/submit' \
  -H 'Content-Type: application/json' \
  -d '{"motivo":"Troca de Arte","descricao":"..."}'

# Listar cards
curl 'https://form-pdviewerp-stagging.fourtuna.com.br/api/cards'
```

## Referências

- PRs: #5, #13, #14
- Files: `ticket-form/src/{server,config,handler,manutencaoHandler,gformsHandler,planka,supabase}.js`
- Mirroring: [[implementacao/supabase-mirroring]]
- ADR: [[decisoes/ADR-003-supabase-mirroring]]
