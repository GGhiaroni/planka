---
adr: 001
date: 2026-05-06
status: ACCEPTED
operacao: 01
---

# ADR-001 — Deploy staging via Docker Compose + nginx do host + CI/CD GitHub Actions

## Contexto

O staging do Planka customizado (`pdviewerp-stagging.fourtuna.com.br`) precisa ser
deployado em servidor Hostinger compartilhado com outros projetos críticos
(a4tunados-mural, tuninho-ai). Necessidade dual:

1. Mínimo impacto nos demais projetos
2. Mecanismo simples para o dev atualizar deploy via push (sem terminal SSH manual)

## Decisão

**Stack runtime**: Docker Compose com 3 serviços ativos (planka, postgres, ticket-form) + 1 desativado (caddy — não sobe por causa do nginx do host).

**Reverse proxy**: nginx do host (já gerencia outros projetos) com sites dedicados:
- `pdviewerp-stagging.fourtuna.com.br` → `127.0.0.1:1338`
- `form-pdviewerp-stagging.fourtuna.com.br` → `127.0.0.1:3002`

**SSL**: Let's Encrypt via certbot (auto-renew).

**CI/CD**: GitHub Actions trigger em push na branch `deploy/staging`. Workflow faz rsync do código + invoca `scripts/deploy.sh` no servidor via SSH.

## Alternativas consideradas

| Opção | Rejeitada porque |
|-------|------------------|
| Caddy do compose como reverse proxy | Bata em 80/443 com nginx do host → quebraria outros projetos |
| Webhook custom + endpoint no servidor | Complexidade extra (daemon HTTP próprio) |
| Polling cron | Delay de minutos (UX pior) |
| Self-hosted runner Actions | Daemon extra no servidor (viola "mínimo impacto") |
| Watchtower + image registry | CI separado pra build da imagem (custo + complexidade) |

## Consequências

### Positivas
- Zero infra extra no servidor (workflow e secrets vivem no GitHub)
- Audit trail visual em github.com/.../actions
- Dev usa fluxo natural de git push
- Reversível (revert commit + push)
- nginx do host preserva pattern dos outros projetos

### Negativas
- Token OAuth do agente (sem scope `workflow`) requer ação manual operador inicial pra mover workflow
- Build local da imagem (não pushed pra registry) — cada deploy rebuilda completo
- Caddy do compose fica em estado "Created" perpetuamente (cosmético)

## Bug pré-existente herdado

`sails.io.js v1.2.1 + socket.io-client v4` incompat — workaround pragmático em
`client/src/api/socket.js` (fetch REST direto) + nginx workaround `location /engine.io/`
proxy pra `/socket.io/`. Solução estrutural pendente — ver ADR-002.

## Referências

- Op 01: `_a4tunados/_operacoes/projetos/01_deploy-planka-hostinger-redeploy/`
- DEPLOY-STAGING.md (raiz do repo)
- Sidecars: `tuninho-devops-hostinger/projects/hostinger-beta/planka/`
