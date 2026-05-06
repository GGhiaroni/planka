# Sidecar Template — Perfil `full-stack`

> Template para sidecar de projetos com perfil **full-stack** (PostgreSQL externo + Python venv + uploads em disco + WebSocket + módulos nativos pesados).
>
> **Uso**: ao onboard de um novo projeto full-stack, copiar este template para `projects/{host}/{projeto}/config.md` e substituir os placeholders.
>
> **Referência do perfil**: `references/project-profiles.md` (seção Perfil 4)

---

# Sidecar — {NOME_PROJETO}

## Projeto

- **Nome**: {NOME_PROJETO}
- **Nome público**: {NOME_PUBLICO_SE_DIFERENTE}
- **Perfil**: full-stack
- **Stack**: {FRAMEWORK_PRINCIPAL} + {DB_ENGINE} + {FRONTEND} + {RUNTIME_SECUNDARIO}
- **Domínio**: {dominio.exemplo.com}
- **Porta HTTP**: {PORTA}
- **Servidor**: {hostinger-alfa|hostinger-beta}
- **App path**: `/opt/{host}/{projeto}/`
- **Deploy mode**: REMOTE (tarball + SCP + SSH)
- **Último deploy**: {DATA_VERSAO}

## Particularidades de Deploy

### Runtime primário (Node.js)
- Versão Node: {18|20|22} LTS
- Framework: {Sails.js 1.5.14 | Next.js 15 | Express 5 | ...}
- Módulos nativos: {bcrypt, sharp, lodepng, ...} (requer build-essential)
- ESM vs CommonJS: {"type": "module" → ecosystem.config.cjs | CommonJS → ecosystem.config.js}
- **CRÍTICO**: após `npm install`, sempre `npm rebuild` (sem args — rebuild ALL nativos)

### Runtime secundário (Python)
- Python: 3.{MINOR}
- venv path: `server/.venv/` (dentro do projeto)
- Pacotes instalados via `pip install` dentro do venv
- Exemplo: `apprise==1.9.3`
- **CRÍTICO**: venv SEMPRE recriado no servidor (nunca copiar do macOS)
- Libs de sistema requeridas (apt): `python3-dev libssl-dev libffi-dev`

### Database
- Engine: PostgreSQL {17}
- DB name: `{nome_db}`
- User: `postgres` (trust local) ou `{user_custom}`
- Host: **`127.0.0.1`** (NUNCA localhost — IPv6 falha)
- Port: 5432 (shared pelo cluster)
- Dump: `pg_dump -Fc -d {nome_db}`
- Restore: `pg_restore --clean --if-exists --no-owner --no-acl -d {nome_db}`
- Migrations: {Knex | Prisma | outro} — executadas via `{comando}`

### Uploads / Data dirs
- Attachments: `server/private/attachments/` ({TAMANHO} em backup mais recente)
- Avatars: `server/public/user-avatars/`
- Backgrounds: `server/public/background-images/`
- Logs: `logs/`
- **Backup**: rsync dos diretórios + `pg_dump` do DB

### WebSocket (Socket.io)
- Versão Socket.io: {v2 | v4}
- Config Nginx: headers `Upgrade + Connection 'upgrade' + proxy_http_version 1.1 + proxy_buffering off`
- `proxy_read_timeout`: 300 (ou mais — até 86400 para conexões longas)
- `onlyAllowOrigins` do app deve bater com `BASE_URL`

## Env vars produção

**Sensitive** (nunca commitar, sempre carregadas do `server/.env` com perm 600):
- `SECRET_KEY`
- `DEFAULT_ADMIN_PASSWORD`
- `DATABASE_URL` (se contém password)
- `INTERNAL_ACCESS_TOKEN`
- {outras específicas do projeto}

**Não sensitive** (hardcoded no `ecosystem.config.js`):
- `NODE_ENV=production`
- `BASE_URL={URL_PUBLICA}`
- `TRUST_PROXY=true`
- `TOKEN_EXPIRES_IN={dias}`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_NAME`
- `DEFAULT_LANGUAGE`
- `DATABASE_URL=postgresql://postgres@127.0.0.1:5432/{db}` (sem password se trust)

## Ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: "{nome-app-pm2}",
    cwd: "/opt/{host}/{projeto}/server",  // CWD é server/, não raiz do projeto
    script: "app.js",                      // NUNCA "npm start" (nodemon em dev)
    env: {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres@127.0.0.1:5432/{db}",
      BASE_URL: "https://{dominio}",
      SECRET_KEY: "{valor_real}",
      TRUST_PROXY: "true",
      // outras env vars do app
    },
    instances: 1,  // sem cluster mode (Sails e similares não escalam bem horizontalmente sem redis sessions)
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
```

## Nginx config

```nginx
server {
    listen 80;
    server_name {dominio.exemplo.com};

    client_max_body_size 50M;       # ajustar conforme upload máximo
    proxy_read_timeout 300;          # Socket.io friendly
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    location / {
        proxy_pass http://127.0.0.1:{PORTA};  # 127.0.0.1 NUNCA localhost
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
# HTTPS bloco adicionado automaticamente por `certbot --nginx --redirect`
```

## Sequência de deploy (resumo)

1. Backup DB prod + uploads (se já existe deploy anterior)
2. Tarball local excluindo `node_modules`, `.git`, `._*`, `_a4tunados`, `.claude`
3. `find . -name "._*" -delete` (arquivos macOS quebram Linux)
4. SCP para servidor
5. Extract em `/opt/{host}/{projeto}/`
6. `cd server && npm install --omit=dev --ignore-scripts`
7. `npm rebuild` (sem args — rebuild ALL)
8. `cd ../client && npm install --ignore-scripts && npm run build && cp -r dist/* ../server/public/ && cp dist/index.html ../server/views/`
9. Recriar Python venv: `rm -rf server/.venv && python3 -m venv server/.venv && .venv/bin/pip install {pacotes}`
10. Criar `server/.env` (permission 600) — cópia fiel do prod, apenas BASE_URL distinto se staging/prod
11. Criar `ecosystem.config.js`
12. DB já restaurado via pg_restore (passo anterior ao deploy da app)
13. `node db/init.js` (valida migrations; idempotente)
14. `pm2 start ecosystem.config.js && pm2 save`
15. Verificar: `curl http://127.0.0.1:{PORTA}` → HTTP 200
16. Verificar: `pm2 logs {nome} --lines 50 --nostream` → sem erros

## rsync_excludes (se usar SELF_DEPLOY)

```
node_modules/
.git/
.env*
._*
.DS_Store
_a4tunados/
.claude/
.playwright-mcp/
server/.venv/          # venv nunca é sincronizado
server/private/attachments/  # uploads persistem no servidor
server/public/user-avatars/
server/public/background-images/
server/public/*.js      # build output (regenerado pelo build)
server/public/*.css
server/views/index.html # copiado do build
*.log
logs/
data/
```

## conditional_triggers

| Trigger | Condição | Ação |
|---------|----------|------|
| npm install server | `server/package.json` mudou | `cd {prod_path}/server && npm install --omit=dev --ignore-scripts && npm rebuild` |
| npm install client + build | `client/package.json` ou `client/src/**` mudou | `cd {prod_path}/client && npm install --ignore-scripts && npm run build && cp -r dist/* ../server/public/` |
| Python venv reinstall | `requirements.txt` mudou ou primeiro deploy | `rm -rf server/.venv && python3 -m venv server/.venv && .venv/bin/pip install ...` |
| Migration | nova migration em `server/db/migrations/` | `node server/db/init.js` (ou `npm run server:db:migrate`) |

## cross_projects (verificação de não-conflito)

Antes de deploy, verificar que outros projetos no mesmo servidor continuam saudáveis:
{listar projetos vizinhos no mesmo host com porta e domínio}

## Histórico de Deploys

| Data | Versão | Tipo | Downtime | Incidentes | Operador |
|------|--------|------|----------|------------|----------|
| {YYYY-MM-DD} | {vX.Y.Z} | bootstrap | ~{seg}s | {descrição ou nenhum} | {operador} |

## Observações específicas do projeto

{seção livre para documentar particularidades, como:
 - compatibilidade com versões específicas de dependências
 - workarounds conhecidos
 - integrações externas (APIs, webhooks)
 - notas de performance
 - limites conhecidos}

---

**Template v1.0.0** — criado na Op 25 (2026-04-15) junto com a formalização do perfil `full-stack` em `references/project-profiles.md`.
