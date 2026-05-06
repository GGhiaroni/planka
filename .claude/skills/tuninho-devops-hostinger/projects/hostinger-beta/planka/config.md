# Planka — hostinger-beta config

> Staging do Planka customizado (fork GGhiaroni/planka v2.1.0) para uso interno como
> `pdviewerp-stagging`. Deploy via Docker Compose + nginx do host como reverse proxy.
> CI/CD via GitHub Actions na branch `deploy/staging`.

## Identidade

| Campo | Valor |
|-------|-------|
| **Servidor** | hostinger-beta (76.13.239.198 / srv1590899.hstgr.cloud) |
| **Path no servidor** | `/opt/hostinger-beta/planka/` |
| **Repo** | github.com/GGhiaroni/planka (fork) |
| **Branch deploy** | `deploy/staging` |
| **Stack** | Sails.js + React 18 + PostgreSQL 16 + Caddy (desabilitado) — Docker Compose |
| **Imagem custom** | `planka-custom:latest` (build local, base `plankanban/planka:2.1.1`) |
| **Versão Planka** | 2.1.0 (upstream em 2.1.1 — uma patch atrás) |
| **Owner arquivos** | 501:staff (UID externo — push via rsync/Actions) |

## URLs

| Serviço | URL | Backend |
|---|---|---|
| Planka | `https://pdviewerp-stagging.fourtuna.com.br/` | `127.0.0.1:1338` |
| Form (tickets) | `https://form-pdviewerp-stagging.fourtuna.com.br/` | `127.0.0.1:3002` |

## Containers

```
planka-planka-1            planka-custom:latest        UP healthy        127.0.0.1:1338→1337
planka-postgres-1          postgres:16-alpine           UP healthy
planka-ticket-form-1       planka-ticket-form           UP healthy        127.0.0.1:3002→3001
planka-caddy-1             caddy:2-alpine               Created (NÃO sobe — nginx do host serve)
```

## Compose canônico

```bash
cd /opt/hostinger-beta/planka
docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env <CMD>
```

**SEMPRE especificar serviços** (`up -d planka postgres ticket-form`) — `up -d` puro tentaria subir Caddy nas portas 80/443 e quebraria nginx do host.

## Override `docker-compose.hostinger-beta.yml`

Mantido **APENAS no servidor** (excluído do rsync deliberadamente). Mapeia:
- planka: `127.0.0.1:1338:1337`
- ticket-form: `127.0.0.1:3002:3001`

## Nginx (sites do host)

| Site | Path | server_name | upstream | SSL |
|---|---|---|---|---|
| `/opt/hostinger-beta/nginx/sites/planka.conf` | sites-enabled/planka.conf | pdviewerp-stagging.fourtuna.com.br | 127.0.0.1:1338 | Let's Encrypt auto-renew |
| `/opt/hostinger-beta/nginx/sites/formularios.conf` | sites-enabled/formularios.conf | form-pdviewerp-stagging.fourtuna.com.br | 127.0.0.1:3002 | Let's Encrypt auto-renew |

**Workaround `/engine.io/` → `/socket.io/`** adicionado em `planka.conf` (`location /engine.io/ { proxy_pass http://127.0.0.1:1338/socket.io/; ...}`) por bug pré-existente sails.io.js v1.2.1 + socket.io-client v4.

## .env (chaves apenas — valores no servidor)

```
PLANKA_DOMAIN, FORM_DOMAIN, LETSENCRYPT_EMAIL, POSTGRES_PASSWORD, SECRET_KEY,
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_USERNAME, PLANKA_FORM_EMAIL,
PLANKA_FORM_PASSWORD, PLANKA_LIST_ID, PLANKA_CHAMADOS_LIST_ID, PRIORITY_LABELS,
CONTACT_REASONS
```

`.env` é **excluído do rsync** (preservado em todo deploy).

## Boards iniciais (criados via API em 2026-05-06)

```
Project "PDView ERP" (id 1769129203543835674)
  ├── Board "Demanda" (id 1769129205750039580)
  │   └── List "A Fazer" (id 1769129208207901732) ← PLANKA_LIST_ID
  └── Board "Chamados" (id 1769129206974776352)
      └── List "Em Espera" (id 1769129209155814437) ← PLANKA_CHAMADOS_LIST_ID
```

## CI/CD via GitHub Actions

- Workflow: `.github/workflows/deploy-staging.yml` (operador moveu de `docs/deploy-staging.workflow.yml.template`)
- Script: `scripts/deploy.sh` (idempotente, com pg_dump preventivo + rollback automático)
- Trigger: push em branch `deploy/staging`
- SSH key dedicada: `/root/.ssh/deploy_planka_actions` (private no GitHub Secret)
- Doc dev: `DEPLOY-STAGING.md`

## Backups

- pg_dump em `/opt/hostinger-beta/backups/planka-pre-deploy-*.dump` (criado a cada deploy via `scripts/deploy.sh`)
- Retenção: manual por enquanto (limpar > 30 dias futuramente)

## Outros projetos no mesmo servidor (NÃO TOCAR)

- **a4tunados-mural** (PM2 cluster, port 1337) — `mural.a4tunados.tuninho.ai`
- **tuninho-ai** (PM2 fork Next.js, port 3100) — `tuninho.ai`, `dev.tuninho.ai`

## Histórico

- **2026-04-30**: Setup inicial via SCP + docker compose up. Caddy do compose nunca subiu (Caddyfile mount bug).
- **2026-05-06**: Op DDCE 01 — re-deploy com develop atualizada, fix bug socket.io WS, ticket-form funcional, CI/CD configurada.

## Bugs conhecidos (a corrigir no upstream do dev)

- `sails.io.js` v1.2.1 + `socket.io-client` v4 incompat — `socket.request` retorna `undefined` no upgrade WS, quebrando `fetchCore`. Workaround pragmático aplicado em `client/src/api/socket.js` (fetch REST direto). Solução estrutural: atualizar wrapper ou downgrade socket.io-client.

## Sub-checks futuros

- `audit-deploy-rigor`: validar SSL, container healthy, smoke E2E
- `audit-cross-project-health`: a4tunados-mural + tuninho-ai mantidos online após deploys
