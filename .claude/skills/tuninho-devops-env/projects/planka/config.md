# planka — Environment Config

> Staging do Planka kanban customizado em hostinger-beta. Deploy via Docker Compose
> + nginx do host. Stack Sails.js + React 18 + PostgreSQL 16. CI/CD via Actions
> na branch `deploy/staging`. **Bootstrap concluido 2026-05-06 (Op DDCE 01)**.

## Produção (staging — único ambiente "online")

| Campo | Valor |
|-------|-------|
| **Porta** | 1338 (loopback only — nginx host proxy) |
| **Domínio** | https://pdviewerp-stagging.fourtuna.com.br |
| **Form domínio** | https://form-pdviewerp-stagging.fourtuna.com.br |
| **Servidor** | hostinger-beta (76.13.239.198 / srv1590899.hstgr.cloud) |
| **App path** | /opt/hostinger-beta/planka/ |
| **Stack** | Node.js 18+ Sails.js + React 18 + PostgreSQL 16 |
| **Process manager** | Docker Compose (NÃO PM2) |
| **DB** | container postgres:16-alpine + volume `planka_postgres-data` |
| **SSL** | Let's Encrypt — auto-renew via certbot |
| **CI/CD** | GitHub Actions trigger em branch `deploy/staging` |

## Matriz de Isolamento

| Recurso | Staging | Outros projetos no servidor |
|---------|---------|------------------------------|
| Porta HTTP container | 1338 (loopback) | a4tunados-mural usa 1337 nativo (PM2) |
| Porta ticket-form | 3002 (loopback) | — |
| Network | docker bridge `planka_default` | mural+tuninho-ai sem container |
| Domínios | *.fourtuna.com.br (Planka + form) | mural.a4tunados.tuninho.ai, tuninho.ai |

## Warnings ativos

```yaml
- code: SAILS-IO-V4-INCOMPAT
  severity: medium
  detail: "socket.request retorna undefined no upgrade WS. Workaround aplicado: fetch REST + nginx /engine.io/→/socket.io/"
  pendency: "Atualizar sails.io.js OU substituir por socket.io-client direto"

- code: CADDY-NEVER-STARTED
  severity: low
  detail: "Caddy do compose em estado Created perpétuo (Caddyfile mount bug). nginx do host serve."
```

## Co-located services (NOT_TOCAR)

- **a4tunados-mural**: PM2 cluster port 1337 → mural.a4tunados.tuninho.ai
- **tuninho-ai**: PM2 fork Next.js port 3100 → tuninho.ai, dev.tuninho.ai

## Env vars (chaves)

```
PLANKA_DOMAIN, FORM_DOMAIN, LETSENCRYPT_EMAIL, POSTGRES_PASSWORD, SECRET_KEY,
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_USERNAME, PLANKA_FORM_EMAIL,
PLANKA_FORM_PASSWORD, PLANKA_LIST_ID, PLANKA_CHAMADOS_LIST_ID, PRIORITY_LABELS,
CONTACT_REASONS
```

## Boards Planka criados (referência)

```
Project "PDView ERP" id=1769129203543835674
  Board "Demanda"   id=1769129205750039580 → List "A Fazer"   id=1769129208207901732 (PLANKA_LIST_ID)
  Board "Chamados"  id=1769129206974776352 → List "Em Espera" id=1769129209155814437 (PLANKA_CHAMADOS_LIST_ID)
```
