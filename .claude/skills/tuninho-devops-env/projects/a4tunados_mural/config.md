# a4tunados_mural — Environment Config

> Gerado em 2026-04-13 pela tuninho-devops-env v1.0.1 (Op 23 sessao 03 MARCO 5).
> Bootstrap scan — primeiro catalogo do projeto.

---

## Stack

**Sails.js 1.5.14 + React 18.2.0 + Vite 6.3.5 + PostgreSQL (16 dev / 17 prod) + Socket.io + Knex.js 3.1.0 + Redux-ORM**

Arquitetura multi-processo via `concurrently`: server (Sails.js + nodemon) + client (Vite HMR).

---

## Producao

- **URL**: https://mural.a4tunados.com.br
- **IP**: 167.99.24.138 (DigitalOcean droplet)
- **Porta**: 1337 (via Nginx reverse proxy)
- **PM2**: `a4tunados-mural` (script: `app.js` — NAO `npm start` porque usaria nodemon)
- **Database**: PostgreSQL 17 native, `postgres://postgres@127.0.0.1:5432/planka`
- **SSL**: Let's Encrypt, auto-renew via certbot timer
- **Migrations**: 30 aplicadas. Ultima: `20260325200000_add_list_forms.js`
- **Ultimo deploy**: 2026-03-26 (v2.3.0)

## Staging

- **URL**: https://stage.mural.a4tunados.com.br
- **IP**: 165.227.51.173 (reserved IP: 167.172.9.25)
- **Provider**: DigitalOcean droplet
- **PM2**: `a4tunados-staging`
- **Database**: PostgreSQL 17 native
- **SSL**: Let's Encrypt (expira 2026-05-27)

## Development (local macOS)

- **Backend**: http://localhost:1337 (Sails.js via nodemon, hot-reload ~1s)
- **Frontend**: http://localhost:3000 (Vite HMR, hot-reload instantaneo)
- **Database**: `postgres://vcg@localhost:5432/planka` (PostgreSQL 16 Homebrew)
- **User DB**: `vcg`
- **Node**: v22.20.0
- **Startup**: `npm start` (concurrently inicia server + client)
- **Parar**: `Ctrl+C` no terminal

```bash
# Ligar PG se nao estiver
brew services start postgresql@16

# Rodar tudo
npm start
```

### Estado atual do scan (snapshot)

| Servico | PID | Port | CWD |
|---------|-----|------|-----|
| Sails backend | 13648 | 1337 | server/ |
| Vite client | 91988 | 3001* | client/ |
| claude-sessions-service (local dev) | 41635 | 3848 | ../claude-sessions-service (projeto separado) |
| PostgreSQL 16 | 32646 | 5432 | (Homebrew) |

*port 3001 em vez do default 3000: Vite escolheu alt port porque havia outro vite ja em 3000 (PID 46483).

---

## Matriz de Isolamento

| Recurso | Dev (macOS) | Staging (DO) | Producao (DO) |
|---------|-------------|--------------|---------------|
| Backend port | 1337 | 1337 | 1337 |
| Client port | 3000 (alt 3001) | N/A (build) | N/A (build) |
| DB engine | PG16 Homebrew | PG17 native | PG17 native |
| DB user | vcg | postgres | postgres |
| DB name | planka | planka | planka |
| DB host | localhost | 127.0.0.1 | 127.0.0.1 |
| PM2 service | - (nodemon) | a4tunados-staging | a4tunados-mural |
| Domain | localhost:3000 | stage.mural.a4tunados.com.br | mural.a4tunados.com.br |
| SSL | N/A | Let's Encrypt | Let's Encrypt |

## Riscos de estado compartilhado

- **DEFAULT_ADMIN_PASSWORD** em `server/.env` DEVE ser diferente entre dev/staging/prod
- **port 3001 macOS** pode ter multiplos Vite concorrentes se o operador esquecer de matar dev server anterior
- **IPv4 vs IPv6**: sempre usar `127.0.0.1` (nao `localhost`) em prod — IPv6 falha

---

## Env Vars (nomes apenas)

### Obrigatorios
- `BASE_URL` = `http://localhost:3000` (dev) / `https://mural.a4tunados.com.br` (prod)
- `DATABASE_URL` = `postgresql://vcg@localhost/planka` (dev) / `postgresql://postgres@127.0.0.1/planka` (prod)
- `SECRET_KEY` — JWT signing
- `DEFAULT_ADMIN_EMAIL` = `admin@a4tunados.com.br`
- `DEFAULT_ADMIN_PASSWORD` — **NUNCA commitar**
- `DEFAULT_ADMIN_NAME` = `Admin A4tunados`
- `DEFAULT_ADMIN_USERNAME` = `admin`

### Op 23 novos
- `INTERNAL_ACCESS_TOKEN` — token hex 96 chars para MCP server do Tuninho bot (acted_on_behalf_of)

---

## Comandos-chave

```bash
# Conectar DB
psql -U vcg planka

# Migration status
cd server/db && npx knex migrate:status

# Rodar migrations
npm run server:db:migrate

# Seed de dados exemplo
npm run server:db:seed

# Reset completo (DEV — DESTRUTIVO)
dropdb -U vcg planka && createdb -U vcg planka && npm run server:db:init

# Lint antes de commit (OBRIGATORIO pelo husky)
cd server && npm run lint
cd ../client && npm run lint
```

---

## Skills relacionadas

| Skill | Uso |
|-------|-----|
| `tuninho-devops-mural-devprod` | Deploy de dev → prod DO via PM2 |
| `tuninho-delivery-cards` | Parse/historico/results dos cards do mural |
| `tuninho-mural` | CLI cliente do mural via mural-api-client |
| `tuninho-devops-env` | Este catalogo |
| `tuninho-portas-em-automatico` | Pre-flight de sessao (usa este catalogo) |

---

## Notes_for_next_scan

- [ ] Verificar se port 3001 ainda tem 2 Vites ou apenas 1
- [ ] Validar `INTERNAL_ACCESS_TOKEN` em server/.env apos qualquer deploy
- [ ] Monitorar `last_deploy` das producoes staging e prod DO
- [ ] Considerar integracao bidirecional com `tuninho-devops-mural-devprod` (apos deploy, re-scan automatico)

---

*Gerado por tuninho-devops-env v1.0.1 em 2026-04-13*
