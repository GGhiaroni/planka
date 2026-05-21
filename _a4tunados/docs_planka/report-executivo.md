---
title: "Report Executivo Geral — projeto planka"
tags:
  - a4tunados
  - tuninho/escriba
  - type/report
  - status/active
date: 2026-05-19
version: "1.2.0"
related:
  - "[[MOC-Projeto]]"
  - "[[sessoes/2026-05-06_op01-deploy-staging]]"
  - "[[cards/1769151526032377530_validar-fluxo-de-deploy-automa/report-executivo]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/report-executivo]]"
---

# Report Executivo — projeto planka

## Visao Geral

| Campo | Valor |
|-------|-------|
| Projeto | planka (fork GGhiaroni) |
| Repo | github.com/GGhiaroni/planka |
| Base upstream | github.com/plankanban/planka v2.1.0 |
| Stack | Sails.js + React 18 + PostgreSQL 16 + Docker Compose + Caddy |
| Modelo Claude usado | Opus 4.6 (Op 01) + Opus 4.7 1M (Card 377530) |
| URL producao staging | https://pdviewerp-stagging.fourtuna.com.br/ |
| URL form staging | https://form-pdviewerp-stagging.fourtuna.com.br/ |
| Servidor | hostinger-beta (76.13.239.198) `/opt/hostinger-beta/planka/` |
| Operador | @victorgaudio |

## Timeline Completa

| Operação | Tipo | Início | Fim | Duração | Status |
|----------|------|--------|-----|---------|--------|
| Op 01: deploy-planka-hostinger-redeploy | DDCE | 2026-05-06 | 2026-05-06 | ~6h | ✅ CONCLUÍDA |
| Card 377530: Validar fluxo de deploy automatico | card-isolated pragmático | 2026-05-06 18:28Z | 2026-05-06 19:55Z | ~1h25m | ✅ VALIDADO |
| **23 commits Ghiaroni** (fora do ops-suite) | externo | 2026-04-30 15:18Z | 2026-05-19 15:55Z | ~19 dias de calendário | ✅ Em produção via deploy/staging tip `059a91d7` |
| Card 928537: Atualização ENV hostinger (Supabase prod) | card-isolated pragmático | 2026-05-19 19:22Z | 2026-05-19 21:11Z | ~13min técnico | ✅ Validando |

## Tempo de Execução

- **Tempo bruto** (primeiro commit Op 01 → fim Card 928537): ~14 dias calendário
- **Tempo líquido** (soma das durações de operações ops-suite): ~7h40m (Op 01 + Card 377530 + Card 928537)
- **Tempo Ghiaroni** (não-medido em sessões ops-suite): 23 commits ao longo de ~19 dias
- **Ociosidade dos canais ops-suite**: ~12+ dias entre operações

## Consumo de Tokens e Custos

| Operação | Delta Tokens | Custo USD est. | Custo BRL est. |
|----------|--------------|----------------|----------------|
| Op 01: deploy-planka-hostinger-redeploy | N/D¹ | N/D | N/D |
| Card 377530: Validar fluxo deploy | 238.062 | $3.57 | R$20.35 |
| Card 928537: Atualização ENV hostinger | N/D² | N/D | N/D |
| **Total documentado** | **238.062** | **$3.57** | **R$20.35** |

> ¹ Op 01 não deixou métricas de tokens documentadas no vault inicial. Reconstrução
> precisaria varrer JSONLs do worktree daquela operação.
> ² Card 928537 não capturou tokens em tempo real durante execução. Pode ser
> reconstruído via parse do JSONL da sessão se necessário.

> **Metodologia**: Blended rate ~$15/MTok para Opus 4.7 (mix 70% cache read +
> 20% input + 10% output). Câmbio: R$5,70/USD. Fórmula: `delta * 15 / 1_000_000`.

## Entregaveis Consolidados

### Codigo / Sistema

- ✅ Fork GGhiaroni/planka customizado (5 features novas em develop)
- ✅ Imagem Docker `planka-custom:latest` buildada no servidor
- ✅ ticket-form com 2 endpoints (`/api/gforms`, `/api/manutencao`) corrigidos pra
  nao mandar `description: ""`
- ✅ `scripts/deploy.sh` rebuildando ticket-form sempre

### Documentacao

- ✅ `DEPLOY-STAGING.md` (raiz do repo, Op 01)
- ✅ `DEPLOY.md` (raiz do repo, Op 01)
- ✅ Vault docs_planka com:
  - 1 MOC principal
  - 1 changelog
  - 2 ADRs do Op 01
  - 1 doc de implementacao do Op 01
  - 1 sessao Op 01
  - Sub-arvore `cards/` com Card 377530 completo (sessao + prompts + decisoes +
    aprendizados + report)

### Infraestrutura

- ✅ Hostinger-beta provisionado com Docker Compose + Caddy + Postgres
- ✅ DNS pdviewerp-stagging.fourtuna.com.br + form-pdviewerp-stagging apontados
- ✅ Caddy proxy reverso com cert HTTPS automatico
- ✅ GitHub Actions workflow `.github/workflows/deploy-staging.yml` ATIVO em
  `deploy/staging`
- ✅ 3 secrets configurados: STAGING_DEPLOY_HOST, STAGING_DEPLOY_USER,
  STAGING_DEPLOY_SSH_KEY
- ✅ Planka staging com 2 boards estruturados ("Demanda" 3 listas, "Chamados"
  3 listas + 8 labels de prioridade)
- ✅ Backup pg_dump preventivo a cada deploy (rollback safety)

## Jornada das Operacoes

### Op 01: deploy-planka-hostinger-redeploy (2026-05-06)

Provisionamento inicial do staging Planka. Deploy Docker Compose com 4 services
(planka, postgres, ticket-form, caddy). DNS + HTTPS + ticket-form com 2 forms.
Workaround inline pra incompat `sails.io.js` + `socket.io-client` v4 (substituido
`socket.request` por `fetch` REST). CI/CD setup parcial: secrets configurados +
template de workflow em `docs/`, mas workflow nao instalado em
`.github/workflows/`. Setup validado manualmente.

### Card 377530: Validar fluxo de deploy automatico (2026-05-06)

Operador tentou usar os 2 forms e detectou que falhavam. Investigacao identificou
3 gaps independentes:

1. **Workflow Actions inexistente** — apenas template em `docs/`, push em
   `deploy/staging` nao trigava nada.
2. **`description: ""` rejeitada** pelo Planka — quebrava ambos os forms na criacao
   de cards.
3. **Labels nao criadas** + `PRIORITY_LABELS` no `.env` com IDs vazios — quebrava
   o Chamado Tecnico mesmo se o problema 2 fosse resolvido.

Modo pragmatico conversacional. Fixes cirurgicos em codigo (2 commits) + criacao
infra Planka via API REST (4 listas + 8 labels) + atualizacao .env servidor.
Workflow ativado via UI pelo operador (token gh sem scope `workflow`). Validacao
end-to-end em 2 niveis: deploy manual via SSH (primeira) e deploy automatico via
Actions (segunda — primeiro run real foi success em ~1m).

### Card 928537: Atualização ENV hostinger (2026-05-19)

Auto-deploy CI da PR #14 (`feat/conecta-ao-supabase`, Ghiaroni) falhou por SSH
timeout durante `npm install @supabase/supabase-js@^2` (~5min de build). VPS
ficou em estado intermediário (rsync ok, build incompleto). Operador @victorgaudio
abriu Card 928537 com runbook explícito.

Execução: SSH manual no VPS → backup `.env` → append idempotente das 2 vars
SUPABASE_* → `nohup bash scripts/deploy.sh` (evita SSH timeout do runner) →
rebuild planka + ticket-form → smoke HTTP 200 → validação espelhamento Supabase
via REST API + 2 testes de pipeline (`/api/manutencao` escreveu `form_submissions`
+ `card_events`; `/api/submit` escreveu só `card_events` via webhook do Planka —
comportamento by-design). 2 cards de teste deletados.

Follow-up operador identificou nossa branch card-isolated como stale (20+ commits
atrás de `origin/deploy/staging`). Verificado que build manual usou os arquivos
rsynced do Ghiaroni (`059a91d7`), zero risco de regressão. Criada PR [#15](https://github.com/GGhiaroni/planka/pull/15) doc-only
em branch nova baseada em `deploy/staging` documentando `DEPLOY-STAGING.md` com
o failure mode + recovery + 3 mitigações estruturais propostas. PR aberta NÃO
auto-merge per card-isolated.

Em parallelo, operador autorizou aplicação retroativa do **escriba modo forense
(operador estrangeiro)** — esta atualização do vault cobre as 14 features do
Ghiaroni via 6 ADRs novos + 2 docs de implementação + reorganização do MOC.

## Funcionalidades Ghiaroni (catálogo cross-PR)

14 features mapeadas, cobertas em ADRs:

| Categoria | Features | ADRs |
|---|---|---|
| UX/UI bundle (May 4-7) | Custom label list type, Coluna colapsada, DnD intra-coluna, Altura linha planilha, Seed Design board, Activity log, Cor labels parity | [ADR-007](decisoes/ADR-007-label-color-parity-table-kanban.md), [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) |
| Card lifecycle | Auto-archive 30d, Sync `finalizado em`, Silent re-sync tab focus | [ADR-004](decisoes/ADR-004-auto-archive-30-dias.md), [ADR-005](decisoes/ADR-005-realtime-finalized-sync.md), [ADR-006](decisoes/ADR-006-silent-resync-tab-focus.md) |
| Forms + integration | Seed boards + form linkage (#5), Ajustes form Pedido de Artes (#13) | (em [[implementacao/ticket-form-system]]) |
| Data mirror | Espelhamento Supabase (cards + form_submissions + card_events) | [ADR-003](decisoes/ADR-003-supabase-mirroring.md) |

## Resumo Executivo

Projeto planka deployado em staging em ~6h (Op 01 DDCE) + ~1h25m (Card 377530 card-isolated) +
~13min técnico (Card 928537 card-isolated) — total ~7h40m de execução líquida no canal
ops-suite. Em paralelo, **23 commits do Ghiaroni** entre 2026-04-30 e 2026-05-19
trouxeram **14 features** ao staging via fluxo CI/CD próprio (PR padrão GitHub),
fora do ops-suite. Habilitação do espelhamento Supabase em prod (Card 928537)
foi o encontro entre os 2 fluxos. Vault atualizado retroativamente via **escriba
modo forense (operador estrangeiro)** — primeira aplicação prototipada para gerar
proposta formal de novo modo na ops-suite ([ver feedback memory]).
