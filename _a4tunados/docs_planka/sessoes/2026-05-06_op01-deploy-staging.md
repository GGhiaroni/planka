---
date: 2026-05-06
operacao: 01
tipo: sessao_unica_condensada
operador: victorgaudio
modelo: claude-opus-4-7[1m]
modo: DDCE_EXPANSIVO_MULTI_SESSOES (condensado em 1 sessão)
---

# Sessão 2026-05-06: Op 01 deploy-planka-hostinger-redeploy

## Contexto inicial

Operador instalou ops-suite v5.41.1 no projeto planka (primeira instalação do tuninho).
Pediu DDCE para descobrir e re-deployar projeto Planka que já estava deployado em
ambiente Hostinger.

## Discovery — descobertas

- 2 servidores Hostinger envolvidos:
  - **hostinger-alfa** (31.97.243.191) — workspace dev (Claude Code roda aqui)
  - **hostinger-beta** (76.13.239.198) — staging real (alvo)
- Domínio `pdviewerp-stagging.fourtuna.com.br` resolve pra hostinger-beta
- Stack rodando em hostinger-alfa em `/docker/pdview_erp_stagging/` era cópia paralela
  quebrada (ignorada)
- Stack real em `/opt/hostinger-beta/planka/` — Docker Compose + nginx do host
- 5 commits recentes do dev (May 4-6) precisavam ser deployados

## Define — plano

3 fases em modo autônomo criterioso:
1. Bootstrap deploy seguro (rsync + rebuild + restart + smoke + E2E)
2. Ticket-form fix (boards iniciais + .env update + restart)
3. CI/CD via branch `deploy/staging` (GitHub Actions + SSH rsync)

## Execution — entregas

### Fase 1
- pg_dump preventivo (`/opt/hostinger-beta/backups/planka-pre-redeploy-20260506-162732.dump`)
- rsync 140KB (preservando `.env` e `docker-compose.hostinger-beta.yml`)
- Build em 1m53s
- Restart em 11s downtime
- **Bug detectado**: WS handshake retornava 502 (sails.io.js + socket.io v4 incompat)
- **Workaround nginx**: `location /engine.io/` → `/socket.io/` no servidor B
- **Fix code**: `client/src/api/socket.js` substituído `socket.request` por `fetch` REST
- Rebuild + restart com fix → dashboard carrega ✓

### Fase 2
- Login admin via REST API
- Criados Project "PDView ERP" + Boards "Demanda" + "Chamados" + Lists
- IDs salvos em `_a4tunados/_operacoes/projetos/01_*/fase_02/evidencias/planka-ids.json`
- `.env` no servidor atualizado com `PLANKA_LIST_ID` e `PLANKA_CHAMADOS_LIST_ID`
- Container `ticket-form` recriado, healthy
- Form em https://form-pdviewerp-stagging.fourtuna.com.br/ → HTTP 200 ✓

### Fase 3
- SSH key dedicada `/root/.ssh/deploy_planka_actions` gerada no servidor B
- `scripts/deploy.sh` criado (idempotente, com rollback automático)
- Workflow Actions criado (em `docs/deploy-staging.workflow.yml.template` por scope OAuth)
- `DEPLOY-STAGING.md` com instruções pro dev
- Branch `deploy/staging` criada e pushada

### Cross-project (zero impacto validado)
- a4tunados-mural mantida online (PM2 cluster)
- tuninho-ai mantida online (PM2 fork Next.js)
- nginx do host só recebeu adição (não alterou outros sites)

## Pendências do operador (manuais)

1. Mover `docs/deploy-staging.workflow.yml.template` → `.github/workflows/deploy-staging.yml`
2. Adicionar 3 secrets no GitHub (UI): `STAGING_DEPLOY_SSH_KEY`, `STAGING_DEPLOY_HOST`, `STAGING_DEPLOY_USER`
3. Validar CI/CD com push trigger

## Aprendizados canônicos

- **L-OP01-1**: 2 servidores Hostinger no mesmo ecossistema (alfa+beta) requerem clareza explícita em todos os contextos — confusão de IPs gerou ~10min de retrabalho
- **L-OP01-2**: rsync `--delete` requer cuidado com arquivos staging-specific que existem só no servidor (ex: `docker-compose.hostinger-beta.yml`) — sempre dry-run antes
- **L-OP01-3**: bug pré-existente em fork pode ser exposto pela primeira vez quando alguém realmente usa o app — `engine.io` 502 estava lá há semanas mas só apareceu nos logs hoje
- **L-OP01-4**: token OAuth do gh CLI sem scope `workflow` bloqueia push de `.github/workflows/*` — workaround: salvar como template e pedir operador mover via UI/git local
- **L-OP01-5**: condensar DDCE_EXPANSIVO em sessão única é viável quando 100% sob mesmo agente em modo autônomo, mas exige rigor extra com tokens e priorização cirúrgica

## Métricas

- **Tokens sessão**: ~417k baseline → ~785k fim (~78% da janela 1M)
- **Deploys executados**: 3 (rebuild inicial, rebuild com fix, ticket-form restart)
- **Bugs corrigidos**: 1 (workaround nginx + fix client socket.js)
- **PRs criados**: 3 (PR#1 install, PR#2 deploy+CI/CD, PR#3 sidecars+results)
- **Branches criadas**: 2 (`feat/deploy-planka-hostinger-redeploy`, `deploy/staging`)

## Encerramento

Operação selada via Comlurb Modo 6 manual em 2026-05-06 (artefato `SEAL_FINAL.yaml`
em `_a4tunados/_operacoes/projetos/01_deploy-planka-hostinger-redeploy/`).
