---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: results
operador: victorgaudio
modelo: claude-opus-4-7[1m]
modo: DDCE_EXPANSIVO_MULTI_SESSOES_condensado_em_1
---

# Resultados — Op 01 deploy-planka-hostinger-redeploy

## Resumo Executivo

Re-deploy do staging Planka customizado em **https://pdviewerp-stagging.fourtuna.com.br/** com a versão `develop` atualizada (5 commits novos do dev), correção de bug WS pré-existente no source (sails.io.js + socket.io-client v4 incompat), ticket-form funcional em **https://form-pdviewerp-stagging.fourtuna.com.br/**, e CI/CD via GitHub Actions na branch `deploy/staging` configurada (push automático = deploy automático). Zero impacto nos outros projetos do servidor (a4tunados-mural, tuninho-ai). Operação inteira executada em sessão única, condensando o modo DDCE_EXPANSIVO_MULTI_SESSOES.

## Status por Fase

### Fase 1: Bootstrap deploy seguro — **CONCLUIDO COM SUCESSO**

**Produto:**
- Staging acessível em https://pdviewerp-stagging.fourtuna.com.br/
- Login admin OK
- Dashboard carrega (after fix do bug WS) com "Create project" UI funcional

**PM:**
- Decisões: nginx do host (não Caddy do compose) como reverse proxy; Caddy mantido em "Created" perpétuo no compose (override hostinger-beta.yml protege)
- Garantias: pg_dump preventivo + tag pre-deploy + healthcheck antes de declarar OK + Playwright real validado
- Reversibilidade: imagem `planka-custom:pre-fix-ws-fetch` mantida no servidor para rollback rápido se necessário

**Dev:**
- Arquivos: 1 modificado no client (`client/src/api/socket.js`)
- Padrão: substituição de wrapper sails.io.js por fetch REST puro — backend Sails responde no mesmo `/api/*` via HTTP. WS continua para realtime push events (subscribe).
- Detalhe técnico: bug raiz é incompatibilidade de protocolo entre sails.io.js v1.2.1 (lançado em 2018) e socket.io-client v4 (2024+). socket.request retornava undefined no upgrade WebSocket → fetchCore quebrava ao destructurar `{item: user}`.
- Workaround adicional no nginx do servidor B: `location /engine.io/` proxy para `/socket.io/` (cliente compilado emite paths /engine.io/ por causa do mesmo bug).

### Fase 2: Ticket-form fix — **CONCLUIDO COM SUCESSO**

**Produto:**
- Form em https://form-pdviewerp-stagging.fourtuna.com.br/ retornando HTTP 200 com `<title>Portal de Chamados</title>`
- Backend ticket-form rodando UP healthy (era EXITED com crash loop antes)

**PM:**
- Decisões: criar Project + Boards no Planka via REST API (não via Playwright manual) para ganhar velocidade
- Garantias: .env backupado antes de qualquer modificação; ticket-form restartado isoladamente sem afetar planka

**Dev:**
- Boards criados:
  - Project "PDView ERP" (id 1769129203543835674)
  - Board "Demanda" (id 1769129205750039580) → List "A Fazer" (id 1769129208207901732 = `PLANKA_LIST_ID`)
  - Board "Chamados" (id 1769129206974776352) → List "Em Espera" (id 1769129209155814437 = `PLANKA_CHAMADOS_LIST_ID`)
- `.env` no servidor atualizado com os 2 IDs
- Container ticket-form recriado, healthy

### Fase 3: CI/CD via branch deploy/staging — **CONCLUIDO PARCIALMENTE (3 ações manuais pendentes do operador)**

**Produto:**
- Workflow GitHub Actions desenhado e commitado (em `docs/deploy-staging.workflow.yml.template` por limitação de scope OAuth)
- Script `scripts/deploy.sh` idempotente com rollback automático
- Branch `deploy/staging` criada no remote
- Documentação completa em `DEPLOY-STAGING.md`

**PM:**
- Decisões: GitHub Actions + SSH rsync (zero infra extra no servidor, audit trail visual, dev usa fluxo normal de git)
- Pendências (operador faz via UI):
  1. Mover `docs/deploy-staging.workflow.yml.template` → `.github/workflows/deploy-staging.yml`
  2. Adicionar 3 secrets: `STAGING_DEPLOY_SSH_KEY`, `STAGING_DEPLOY_HOST`, `STAGING_DEPLOY_USER`
  3. Push commit em `deploy/staging` para validar fluxo end-to-end

**Dev:**
- `scripts/deploy.sh` (sincronizado para o servidor): pg_dump preventivo + tag rollback + build + force-recreate planka + healthcheck 90s + smoke HTTP + restart ticket-form (idempotente)
- Workflow YAML usa secrets, faz rsync (excluindo .env, docker-compose.hostinger-beta.yml, _a4tunados, .git, node_modules), invoca deploy.sh via SSH
- SSH key dedicada `deploy_planka_actions` gerada no servidor B + adicionada em authorized_keys

## Resumo Geral da Operação

| Item | Status |
|------|--------|
| Re-deploy do código develop atualizada | CONCLUIDO |
| Fix bug WS (sails.io.js + socket.io v4) | CONCLUIDO (workaround pragmático) |
| Ticket-form online | CONCLUIDO |
| CI/CD setup (workflow + script + docs) | CONCLUIDO |
| Branch `deploy/staging` no remote | CONCLUIDO |
| Sidecars devops atualizados | CONCLUIDO |
| Zero impacto cross-project | VALIDADO |
| Secrets GitHub configurados | PENDENTE (operador via UI) |
| Workflow movido pra `.github/workflows/` | PENDENTE (operador local push) |
| Validação CI/CD end-to-end (push trigger) | PENDENTE (depende dos 2 acima) |

**Operacao:** 01_deploy-planka-hostinger-redeploy
**Operador:** victorgaudio
**Modelo:** claude-opus-4-7[1m]
**Periodo:** 2026-05-06 (sessão única condensada)
**Servidores envolvidos:**
- hostinger-alfa (31.97.243.191) — workspace dev (Claude Code)
- **hostinger-beta (76.13.239.198)** — staging real (alvo)

### Tokens (estimado)

| Fase | Δ tokens estimado |
|------|-------------------|
| Pre-DDCE (install ops-suite) | ~417k (carregado da sessão prévia) |
| DISCOVER | ~99k |
| DEFINE | ~30k |
| EXECUTION (Fases 1+2+3) | ~140k |
| Encerramento (sidecars + RESULTS + escriba + comlurb) | ~50k |
| **TOTAL** | **~736k (~73-78% da janela 1M)** |

## Bugs documentados pra dev resolver depois

1. **sails.io.js v1.2.1 + socket.io-client v4** — incompatibilidade. Workaround pragmático aplicado. Solução estrutural: atualizar wrapper ou substituir por uso direto de socket.io-client. Documentado em `DEPLOY-STAGING.md`.
2. **Caddy do compose nunca subiu** — Caddyfile virou diretório no mount. Não bloqueante (nginx do host serve). Limpar serviço do override no futuro.

## Próximos passos sugeridos

### Imediato (operador)
1. Mover workflow file → `.github/workflows/deploy-staging.yml`
2. Adicionar 3 secrets via GitHub UI
3. Validar CI/CD com `git commit --allow-empty -m "test: trigger" + push origin deploy/staging`

### Curto prazo (dev)
1. Atualizar `client/package.json` com sails.io.js mais recente OU remover wrapper
2. Validar 5 features novas via staging real (drag intra-coluna, line-height, coluna colapsada, log do board, seed Falar com cliente)

### Médio prazo
1. Considerar migrar para registry Docker (push image) ao invés de build local — pode acelerar deploys
2. Setup de Watchtower ou similar pra atualização automática de base image (security updates)
3. Limpar Caddy do override hostinger-beta.yml
