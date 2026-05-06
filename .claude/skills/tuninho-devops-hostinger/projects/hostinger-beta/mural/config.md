# Sidecar — mural (a4tunados mural) @ hostinger-beta

> **Perfil**: `full-stack` (primeiro projeto desse perfil no Hostinger)
> **Template**: `references/sidecar-templates/full-stack.md`
> **Criado em**: 2026-04-15 (Op 25 Fase 2 T2.4)
> **Origem**: replicação fiel de `mural.a4tunados.com.br` (DigitalOcean 167.99.24.138)

## Projeto

- **Nome**: mural
- **Nome público**: a4tunados mural
- **Perfil**: full-stack
- **Stack**: Sails.js 1.5.14 + React 18.2.0 + Vite 6.3.5 + PostgreSQL 17 + Socket.io v2 + Redux-Saga + Redux-ORM
- **Domínio**: mural.a4tunados.tuninho.ai
- **Porta HTTP**: 1337 (padrão Sails)
- **Servidor**: hostinger-beta (76.13.239.198)
- **App path**: `/opt/hostinger-beta/mural/`
- **Deploy mode**: REMOTE (tarball + SCP + SSH)
- **Status**: bootstrapping (Op 25)
- **Último deploy**: pendente (primeiro deploy vem na Fase 5 da Op 25)

## Particularidades de Deploy

### Runtime primário (Node.js)
- Versão Node: **22 LTS** via NodeSource (fallback Node 18 se Sails 1.5.14 quebrar)
- Framework: Sails.js 1.5.14
- Módulos nativos (exigem build-essential):
  - `bcrypt 5.1.1` (password hashing)
  - `sharp 0.33.5` (processamento de imagens)
  - `lodepng` (PNG encoding)
- CommonJS: ecosystem.config.**js** (não .cjs)
- **CRÍTICO**: após `npm install --omit=dev --ignore-scripts`, sempre `npm rebuild` (sem args — rebuild ALL)

### Runtime secundário (Python)
- Python: 3.13.x
- venv path: `server/.venv/`
- Pacotes: `apprise==1.9.3` (100+ notification providers)
- **CRÍTICO**: venv SEMPRE recriado no servidor (nunca copiar do macOS)
- Libs de sistema: `python3-dev libssl-dev libffi-dev`

### Database
- Engine: **PostgreSQL 17** (nativo systemd, mesmo patch level do prod DO)
- DB name: `planka`
- User: `postgres` (trust local-only)
- Host: **`127.0.0.1`** (NUNCA localhost — IPv6 falha, lição CLAUDE.md)
- Port: 5432
- Dump (source DO): `sudo -u postgres pg_dump -Fc -d planka`
- Restore (target beta): `sudo -u postgres pg_restore --clean --if-exists --no-owner --no-acl -d planka`
- Migrations: **Knex.js** (33 migrations, última `20260413120000_add_metadata_to_comment_and_action.js`)
- Verificação pós-restore: `SELECT name FROM migration ORDER BY name;` → 33 rows

### Uploads / Data dirs (tamanhos capturados do prod DO)
- Attachments: `server/private/attachments/` (~290 MB)
- Avatars: `server/public/user-avatars/` (~3.4 MB)
- Backgrounds: `server/public/background-images/` (~4 KB)
- Total data: ~293 MB
- **Backup strategy**: rsync dos 3 dirs + `pg_dump` do DB

### WebSocket (Socket.io v2)
- Versão Socket.io: **v2 (legacy)** — cliente antigo
- Protocol específico: precisa headers `Upgrade + Connection 'upgrade'`
- Nginx `proxy_read_timeout 300` (suficiente para Socket.io v2 ping/pong)
- `onlyAllowOrigins` no app checa contra `BASE_URL` — **DEVE** bater com BASE_URL do ecosystem.config.js

## Env vars produção

**Sensitive** (permission 600, `server/.env`):
- `SECRET_KEY` — cópia fiel do prod DO
- `DEFAULT_ADMIN_PASSWORD` — cópia fiel do prod DO
- `INTERNAL_ACCESS_TOKEN` — cópia fiel do prod DO (se existir)

**Não sensitive** (`ecosystem.config.js`):
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/planka
BASE_URL=https://mural.a4tunados.tuninho.ai   ← ÚNICA mudança vs prod DO
SECRET_KEY=<valor>
TRUST_PROXY=true
TOKEN_EXPIRES_IN=365
DEFAULT_ADMIN_EMAIL=admin@a4tunados.com.br
DEFAULT_ADMIN_NAME=Admin A4tunados
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_LANGUAGE=pt-BR
```

**Configurações ausentes (e ausência intencional)**:
- Zero `SMTP_*` (prod não envia emails)
- Zero `OIDC_*` (prod não usa SSO)
- Zero `S3_*` (prod usa filesystem local)
- Zero webhooks globais
- 1 único `notification_service` (Google Chat, apenas victorgaudio@4tuna.com.br)

## Ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: "a4tunados-mural",
    cwd: "/opt/hostinger-beta/mural/server",  // CWD é server/ (NÃO a raiz)
    script: "app.js",                          // NUNCA "npm start" (nodemon em dev)
    env: {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres@127.0.0.1:5432/planka",
      BASE_URL: "https://mural.a4tunados.tuninho.ai",
      SECRET_KEY: "<valor fiel do prod DO>",
      TRUST_PROXY: "true",
      DEFAULT_ADMIN_EMAIL: "admin@a4tunados.com.br",
      DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || "CHANGE_ME",
      DEFAULT_ADMIN_NAME: "Admin A4tunados",
      DEFAULT_ADMIN_USERNAME: "admin"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
```

## Nginx config

Localização: `/opt/hostinger-beta/nginx/sites/mural.conf`
Symlink: `/etc/nginx/sites-enabled/mural`

```nginx
server {
    listen 80;
    server_name mural.a4tunados.tuninho.ai;

    client_max_body_size 50M;       # uploads grandes (attachments)
    proxy_read_timeout 300;          # Socket.io v2 friendly
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    location / {
        proxy_pass http://127.0.0.1:1337;  # 127.0.0.1 NUNCA localhost
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
# Bloco HTTPS adicionado automaticamente por `certbot --nginx --redirect`
```

## Sequência de deploy (Op 25)

1. Backup preemptivo: N/A (primeiro deploy)
2. Tarball local (excluindo node_modules, .git, `._*`, `_a4tunados`, `.claude`)
3. `find . -name "._*" -delete` (lição CLAUDE.md #2)
4. SCP para `beta:/tmp/mural-code.tar.gz`
5. Extract em `/opt/hostinger-beta/mural/`
6. `cd server && npm install --omit=dev --ignore-scripts`
7. `npm rebuild` (sem args — rebuild ALL nativos: bcrypt, sharp, lodepng)
8. `cd ../client && npm install --ignore-scripts && npm run build && cp -r dist/* ../server/public/ && cp dist/index.html ../server/views/`
9. Recriar Python venv: `rm -rf server/.venv && python3 -m venv server/.venv && .venv/bin/pip install apprise==1.9.3`
10. Escrever `server/.env` (permission 600) cópia fiel do prod + BASE_URL atualizado
11. Escrever `ecosystem.config.js`
12. **DB já restaurado na Fase 4** via pg_restore (pré-requisito)
13. `node db/init.js` (valida migrations, idempotente)
14. `pm2 start ecosystem.config.js && pm2 save`
15. Verificar: `curl http://127.0.0.1:1337` → HTTP 200
16. Verificar: `pm2 logs a4tunados-mural --lines 50 --nostream` → sem erros

## rsync_excludes (para SELF_DEPLOY futuro, se aplicável)

```
node_modules/
.git/
.env*
._*
.DS_Store
_a4tunados/
.claude/
.playwright-mcp/
server/.venv/                       # venv nunca é sincronizado
server/private/attachments/         # uploads persistem no servidor
server/public/user-avatars/
server/public/background-images/
server/public/assets/               # client build output (regenerado)
server/public/favicons/
server/views/index.html             # copiado do client build
logs/
*.log
```

## conditional_triggers

| Trigger | Condição | Ação |
|---------|----------|------|
| npm install server | `server/package.json` mudou | `cd /opt/hostinger-beta/mural/server && npm install --omit=dev --ignore-scripts && npm rebuild` |
| npm install client + build | `client/package.json` ou `client/src/**` mudou | `cd /opt/hostinger-beta/mural/client && npm install --ignore-scripts && npm run build && cp -r dist/* ../server/public/` |
| Python venv reinstall | `server/requirements.txt` mudou ou venv ausente | `rm -rf server/.venv && python3 -m venv server/.venv && .venv/bin/pip install apprise==1.9.3` |
| Migration | nova migration em `server/db/migrations/` | `node server/db/init.js` |

## cross_projects (verificação de não-conflito)

No **hostinger-beta**, o mural é o **primeiro e único** projeto (no momento da criação deste sidecar). Não há conflitos cruzados a verificar. Porta 1337 livre, domínio único.

**Projetos futuros a serem trazidos para o beta** (planejados fora do escopo da Op 25):
- Projetos hoje no alfa que terão seus domínios migrados pro beta quando o beta virar prod (operação futura)

## Histórico de Deploys

| Data | Versão | Tipo | Downtime | Incidentes | Operador |
|------|--------|------|----------|------------|----------|
| 2026-04-15 (planejado) | v2.3.0 | bootstrap | N/A (primeiro deploy) | — | victorgaudio |

## Observações específicas do projeto

### Por que o mural é "full-stack" e singular no ecossistema Hostinger
- Único projeto do Hostinger com **PostgreSQL externo** (todos os outros usam SQLite file ou não têm DB)
- Único projeto com **Python venv dentro do projeto** (orquestravoadora usa Python sistema-wide sem venv)
- Único projeto com **uploads dinâmicos em disco** (attachments + avatars + backgrounds)
- Único projeto com **módulos nativos pesados** (Sharp, bcrypt, lodepng simultâneos)
- Único projeto com **Socket.io v2** (versão legacy — outros usam v4+)
- Herdou do Planka padrão não-padrão: `ecosystem.config.js` com `script: "app.js"` direto (não `npm start`)

### Riscos conhecidos
- **Sails 1.5.14 + Node 22**: não testado previamente; fallback Node 18 se quebrar
- **lodepng rebuild**: falhas silenciosas em `npm rebuild` individual (lição CLAUDE.md) — sempre usar `npm rebuild` sem args
- **Python venv cross-platform**: NUNCA copiar do macOS; sempre recriar
- **Socket.io v2 Nginx**: client_max_body_size + proxy_read_timeout + headers Upgrade são críticos
- **DB restore idempotência**: usar `--clean --if-exists` em pg_restore

### Referências
- Nginx config original capturado do prod DO durante Discovery (Op 25)
- ecosystem.config.js original do prod DO capturado durante Discovery (Op 25)
- Lições críticas em `CLAUDE.md` linhas 524-530
- Deploy guide DO como referência: `/docs/deploy/digital_ocean/README.md`
- Processo de staging como modelo: `/docs/DEPLOY_STAGING_DO.md`
- Perfil estrutural: `references/project-profiles.md` (Perfil 4: full-stack)
- Template de sidecar: `references/sidecar-templates/full-stack.md`

---

**Sidecar v1.0.0** — criado na Op 25 (2026-04-15) Fase 2 T2.4
