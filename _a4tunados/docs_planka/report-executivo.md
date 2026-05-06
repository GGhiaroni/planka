---
title: "Report Executivo Geral — projeto planka"
tags:
  - a4tunados
  - tuninho/escriba
  - type/report
  - status/active
date: 2026-05-06
version: "1.1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[sessoes/2026-05-06_op01-deploy-staging]]"
  - "[[cards/1769151526032377530_validar-fluxo-de-deploy-automa/report-executivo]]"
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

| Operacao | Tipo | Inicio | Fim | Duracao | Status |
|----------|------|--------|-----|---------|--------|
| Op 01: deploy-planka-hostinger-redeploy | DDCE | 2026-05-06 | 2026-05-06 | ~6h | ✅ CONCLUIDA |
| Card 377530: Validar fluxo de deploy automatico | card-isolated pragmatico | 2026-05-06 18:28Z | 2026-05-06 19:55Z | ~1h25m | ✅ VALIDADO |

## Tempo de Execucao

- **Tempo bruto** (primeiro commit Op 01 → fim Card 377530): ~12h calendario
  (deploy + 1 dia de uso + retorno operador + Card 377530)
- **Tempo liquido** (soma das duracoes de operacoes): ~7h25m
- **Ociosidade**: ~4h35m (operador testando staging entre Op 01 e detectar gaps)

## Consumo de Tokens e Custos

| Operacao | Delta Tokens | Custo USD est. | Custo BRL est. |
|----------|--------------|----------------|----------------|
| Op 01: deploy-planka-hostinger-redeploy | N/D¹ | N/D | N/D |
| Card 377530: Validar fluxo deploy | 238.062 | $3.57 | R$20.35 |
| **Total documentado** | **238.062** | **$3.57** | **R$20.35** |

> ¹ Op 01 nao deixou metricas de tokens documentadas no vault inicial. Reconstrucao
> precisaria varrer JSONLs do worktree daquela operacao.

> **Metodologia**: Blended rate ~$15/MTok para Opus 4.7 (mix 70% cache read +
> 20% input + 10% output). Cambio: R$5,70/USD. Formula: `delta * 15 / 1_000_000`.

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

## Resumo Executivo

Projeto planka deployado em staging em ~6h via Op 01 (DDCE) + ~1h25m via Card
377530 (card-isolated pragmatico) — total ~7h25m de execucao liquida.
Fluxo CI/CD totalmente validado: push em `deploy/staging` → GitHub Actions
detecta → rsync + rebuild ticket-form + deploy.sh + smoke + rollback automatico.
2 forms funcionando end-to-end criando cards estruturados no Planka com custom
fields preenchidos e labels aplicadas.
