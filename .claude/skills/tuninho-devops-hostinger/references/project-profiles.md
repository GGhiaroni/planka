# Project Profiles — Perfis Estruturais de Projetos no Hostinger

> Referência canônica dos perfis estruturais de projetos hospedados nos servidores Hostinger (alfa e beta). Cada perfil define as características de runtime, persistência, build, networking e ciclo de deploy que se repetem em projetos similares. O perfil do projeto determina quais templates de sidecar, Nginx, scripts de bootstrap e rollback procedures se aplicam.
>
> **Criado em**: 2026-04-15 (Op 25) durante a formalização do perfil "full-stack" para receber o mural a4tunados no hostinger-beta.

---

## Índice dos Perfis

| # | Perfil | Característica central | Exemplos |
|---|---|---|---|
| 1 | **light** (SQLite file-based) | App Node.js com SQLite interno ao projeto | tuninho-ide-web, maestrofieldmanager, chooz_2026, claude-sessions-service |
| 2 | **static** (vanilla, sem DB) | HTML/CSS/JS puro ou Node.js leve sem persistência | familygames, weplus_prototipo (estado original) |
| 3 | **systemd flask** (Python nativo) | Python Flask + Gunicorn via systemd (sem PM2) | orquestravoadora |
| 4 | **full-stack** (DB externo + runtime externo + uploads) | App com PostgreSQL separado, Python venv dedicado, uploads em disco | **mural a4tunados** (inaugura perfil no hostinger-beta) |

---

## Perfil 1: `light` — SQLite file-based

### Característica
Aplicação Node.js (Express/Next.js/etc.) com SQLite como storage, onde o DB fica em um arquivo dentro do projeto (`data/*.db` ou `prisma/production.db`). Zero dependência externa de serviço de DB.

### Runtime
- Node.js 22 LTS via NodeSource
- PM2 para gerenciamento
- Módulos nativos comuns: `better-sqlite3`, `node-pty`, `@prisma/client`
- Requer `build-essential` para compilar nativos

### Persistência
- SQLite file-based
- Backup = copy do arquivo `.db` (com `sqlite3 .backup` para WAL safety)
- Restore = cp do arquivo
- Não há serviço de DB a gerenciar

### Build
- Frontend: esbuild/Vite/Next build
- Backend: Node direto (sem transpile) ou `next build`
- `npm rebuild` dos nativos pós-install

### Networking
- Nginx reverse proxy HTTPS → localhost:PORT
- Porta família 3xxx (3001-3999)
- client_max_body_size padrão (10M)
- WebSocket opcional (alguns projetos como tuninho-ide-web)

### Deploy
- **REMOTE mode** (padrão): tarball local → SCP → extract → pm2 restart
- **SELF_DEPLOY mode**: rsync incremental em workspace self-hosted (ex: tuninho-ide-web)
- Downtime: 3-60s

### Ciclo de vida típico
1. Dev local → commit → push
2. Deploy via `tuninho-devops-hostinger` (Stages 1-8)
3. Backup SQLite → tarball → SCP → extract → pm2 restart
4. Verificação: curl local + Playwright UI

### Sidecar template
`sidecar-templates/light.md` (não criado nesta operação — pode ser extraído dos sidecars existentes de tuninho-ide-web, maestrofieldmanager, etc.)

### Projetos que usam este perfil
- **tuninho-ide-web** (porta 3847, Express + WS + node-pty + tmux + better-sqlite3)
- **maestrofieldmanager** (porta 3001, Next.js + Prisma + SQLite)
- **chooz_2026** (porta 3849, Next.js)
- **claude-sessions-service** (porta 3848, Express + claude-agent-sdk + better-sqlite3 + MCP subprocess)

---

## Perfil 2: `static` — Vanilla sem DB

### Característica
Aplicação HTML/CSS/JS puro ou Node.js leve sem persistência. Pode ter backend Socket.io para sessões em memória, mas sem DB externo nem interno.

### Runtime
- Opção A: Nenhum (Nginx serve estáticos direto via `root` + `try_files`)
- Opção B: Node.js via PM2 para backend leve (Express + Socket.io)

### Persistência
- Nenhuma (sessões em memória, estado efêmero)
- Ou: arquivos estáticos no filesystem (immutáveis)

### Build
- Opção A: Zero (arquivos servidos como estão)
- Opção B: Vite build / esbuild simples para bundling front

### Networking
- Nginx reverse proxy HTTPS → localhost:PORT (se Node)
- Nginx direto com `root` (se 100% estático)
- Socket.io v4+ (se backend Node) com headers Upgrade

### Deploy
- REMOTE tarball ou rsync
- Downtime: 0-5s

### Projetos que usam este perfil
- **familygames** (porta 3030, Node.js + Express + Socket.io vanilla front, sem build)
- **weplus_prototipo** (porta 3850, evoluiu de estático para dinâmico via self-hosting)

---

## Perfil 3: `systemd flask` — Python nativo

### Característica
Aplicação Python Flask servida via Gunicorn e gerenciada por systemd (não PM2). Exceção à regra PM2-centric do resto dos projetos.

### Runtime
- Python 3 sistema-wide (não venv)
- Flask + Gunicorn (via systemd unit file)
- Sem Node.js no path do projeto

### Persistência
- Nenhuma ou SQLite interno

### Build
- Nenhum

### Networking
- Nginx reverse proxy HTTPS → localhost:PORT
- Gunicorn listens em TCP ou Unix socket

### Deploy
- REMOTE rsync
- `systemctl restart projeto.service`
- Downtime: 2-5s

### Por que systemd e não PM2?
Flask + Gunicorn é stack canônico Python. Systemd é nativo do Linux e se integra melhor com Gunicorn. PM2 é Node.js-centric e seria overhead desnecessário.

### Projetos que usam este perfil
- **orquestravoadora** (porta 3040, Flask + Gunicorn via systemd unit `orquestravoadora.service`)

---

## Perfil 4: `full-stack` — DB externo + runtime externo + uploads

> **Perfil novo formalizado na Op 25** para receber projetos com stack completa tipo mural a4tunados.

### Característica
Aplicação "pesada" com **múltiplas dependências externas ao projeto**:
- PostgreSQL como serviço sistêmico (não SQLite file)
- Python venv isolado dentro do projeto para runtime secundário (notificações, ML, etc.)
- Módulos nativos pesados (Sharp, bcrypt, lodepng)
- Uploads dinâmicos em disco (attachments, avatars, user-generated content)
- WebSocket real-time (Socket.io v2 ou superior)
- Migrations de DB versionadas (Knex/Prisma migration system)

### Runtime
- Node.js 18+ (ou 22 LTS, dependendo da compatibilidade do framework)
- PM2 para gerenciamento
- Python 3 + venv dedicado **dentro** do projeto (ex: `server/.venv/`)
- Módulos nativos pesados que exigem `build-essential`:
  - `bcrypt` (password hashing)
  - `sharp` (processamento de imagens)
  - `lodepng` (PNG encoding)
  - outros conforme o projeto
- **Requer**: `build-essential`, `python3-dev`, `libssl-dev`, `libffi-dev`, `libpq-dev` (se usa drivers PG compilados)

### Persistência (DB)
- **PostgreSQL 17** como serviço sistêmico (systemd postgresql@17-main.service)
- Autenticação: `trust` local-only (127.0.0.1)
- Conexão: **127.0.0.1 NUNCA localhost** (IPv6 falha)
- Backup: `pg_dump -Fc` (formato custom)
- Restore: `pg_restore --clean --if-exists`
- Migrations versionadas (tabela `migration` no schema)

### Persistência (uploads)
- Filesystem local (não S3/Blob)
- Paths típicos:
  - `server/private/attachments/` (attachments de cards/documentos)
  - `server/public/user-avatars/` (avatars de usuários)
  - `server/public/background-images/` (backgrounds customizados)
- Backup: rsync dos diretórios
- Restore: rsync reverse

### Runtime secundário (Python)
- `python3 -m venv server/.venv`
- Pacotes instalados via `pip install` dentro do venv
- **CRÍTICO**: venv NUNCA copiar do macOS → Linux (symlinks incompatíveis). Sempre recriar no servidor.
- Exemplo: `Apprise 1.9.3` para notificações (100+ providers)

### Build
- Cliente (frontend): Vite build → `dist/` → copiar para `server/public/`
- Servidor: sem transpile (Sails.js roda JS direto)
- **SEMPRE** após `npm install`: `npm rebuild` (sem args, rebuild ALL nativos) — rebuild individual **NÃO** é suficiente

### Networking
- Nginx reverse proxy HTTPS → localhost:PORT
- **Porta 1337** (padrão Sails.js) ou outra específica do framework
- **client_max_body_size 50M** (ou maior, para uploads)
- **proxy_read_timeout 300+ (até 86400)** para Socket.io v2 com long polling fallback
- Headers obrigatórios:
  - `Upgrade $http_upgrade`
  - `Connection 'upgrade'`
  - `proxy_http_version 1.1`
  - `proxy_buffering off` (para streaming)
  - `proxy_request_buffering off`
- CRÍTICO: `TRUST_PROXY=true` no app + `X-Forwarded-*` headers no Nginx

### Ecosystem (PM2)
```js
{
  name: "nome-do-app",
  cwd: "/opt/{host}/{projeto}/server",  // CWD é server/, não raiz
  script: "app.js",                      // NUNCA "npm start" (roda nodemon em prod)
  env: {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://postgres@127.0.0.1:5432/{db}",
    BASE_URL: "https://{dominio}",
    SECRET_KEY: "...",
    TRUST_PROXY: "true",
    // ... demais env vars do app
  },
  instances: 1,  // sem cluster mode em general
  autorestart: true,
  max_memory_restart: "1G"
}
```

### Arquivos de ambiente
- `server/.env` (permission 600)
- `ecosystem.config.js` (no dir raiz do projeto, não no server/)
- Ambos contêm valores sensíveis — **nunca commitar**

### Deploy
- REMOTE (tarball + SCP)
- Downtime: 30-90s (mais alto por causa de `npm install` + `npm rebuild` + recriação de venv)
- Migrations: executadas via `node db/init.js` ou `npm run server:db:migrate`
- **REGRA**: DB deve estar restaurado ANTES de `pm2 start` (senão app cria schemas vazios conflitando com restore posterior)

### Sequência obrigatória de deploy
1. Tarball local (excluindo node_modules, .git, `._*`, `_a4tunados`, `.claude`)
2. SCP para servidor
3. Extract em `/opt/{host}/{projeto}/`
4. `find . -name "._*" -delete`
5. `cd server && npm install --omit=dev --ignore-scripts`
6. `npm rebuild` (sem args — rebuild ALL)
7. `cd ../client && npm install --ignore-scripts && npm run build && cp -r dist/* ../server/public/`
8. Recriar Python venv: `rm -rf server/.venv && python3 -m venv server/.venv && .venv/bin/pip install apprise==1.9.3` (ou similares)
9. Criar `server/.env` (cópia fiel, apenas BASE_URL diferente se staging/prod)
10. Criar `ecosystem.config.js` (apontando para `script: "app.js"` direto)
11. DB já restaurado (pg_restore foi antes)
12. `node db/init.js` (valida migrations; idempotente)
13. `pm2 start ecosystem.config.js && pm2 save`
14. Verificar: `curl http://127.0.0.1:PORT` → HTTP 200, logs sem erros

### Sidecar template
`sidecar-templates/full-stack.md` — usar como ponto de partida para qualquer novo projeto full-stack.

### Projetos que usam este perfil
- **mural a4tunados** — inaugura o perfil no hostinger-beta (Op 25)
  - Stack: Sails.js 1.5.14 + React 18 + Vite 6 + PostgreSQL 17 + Socket.io v2 + Redux-Saga + Redux-ORM + Apprise + Sharp + bcrypt
  - DB: 27 MB
  - Attachments: 290 MB
  - Users: 15
  - Domínio: mural.a4tunados.tuninho.ai

### Considerações para múltiplos projetos full-stack no mesmo servidor
- **Porta PostgreSQL**: 5432 é compartilhado por todos os DBs locais (cada projeto tem seu DB nomeado dentro do mesmo cluster). Sem conflito.
- **Isolamento de DB**: cada projeto deve ter seu próprio DB (ex: `planka`, `crm`, `store`) e seu próprio user (se auth não for trust).
- **Nginx**: cada projeto tem seu `.conf` em `/opt/{host}/nginx/sites/` com server_name distinto.
- **Porta HTTP**: cada projeto tem porta única (1337, 3xxx, etc.).
- **Uploads**: cada projeto tem seus paths isolados dentro de `/opt/{host}/{projeto}/`.
- **PM2**: cada projeto tem service_name distinto.
- **Python venv**: cada projeto tem seu venv dentro de `server/.venv/` (isolado).

### Risco de conflito futuro
- **Disk usage**: projetos full-stack crescem em uploads. Monitorar `du -sh /opt/{host}/{projeto}/` periodicamente.
- **PG performance**: múltiplos DBs grandes no mesmo cluster podem afetar um ao outro. Ajustar `shared_buffers` e `work_mem` se necessário.
- **Port collision**: cuidado ao alocar novas portas. Manter `server-inventory.json` atualizado.

---

## Como usar este documento

1. **Ao onboard de novo projeto**: identificar a qual perfil ele se encaixa (ou inaugurar um novo). Usar o template de sidecar correspondente.
2. **Ao deploy**: a skill `tuninho-devops-hostinger` carrega o sidecar do projeto e seleciona os passos aplicáveis ao perfil.
3. **Ao debug**: se um deploy falha, verificar primeiro se está seguindo o padrão do perfil (ex: rebuild nativos em full-stack, venv recriado no servidor, etc.).

---

## Histórico de atualizações

| Data | Versão | Operação | Mudança |
|------|--------|----------|---------|
| 2026-04-15 | 1.0 | Op 25 | Criação inicial com 4 perfis (light, static, systemd flask, full-stack). Perfil full-stack documentado em detalhe para receber o mural a4tunados no hostinger-beta. |
