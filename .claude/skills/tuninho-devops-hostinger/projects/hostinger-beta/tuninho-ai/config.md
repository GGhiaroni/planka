# Sidecar — tuninho-ai @ hostinger-beta

> **Perfil**: `light` (Next.js + SQLite + PM2 single instance)
> **Criado em**: 2026-04-19 (Op 02 Fase 6 T6.1)
> **Status**: deployed (em prod desde 2026-04-19, ultimo deploy v0.5.32 em 2026-04-30 — Card 134 post-seal: fix DnD admin bypass)

## Board Dev — 4 fontes de conteudo (Card 134, 2026-04-29)

**ATENCAO:** Card do board Dev de tuninho.ai (`boards.kind = 'dev'`) tem 4 fontes
de conteudo. Ao investigar bug ou estado de um card, cobrir as 4:

1. `chats.title` — titulo do card
2. `chats.description` — descricao livre (TEXT, ate 2000 chars; setado via API
   `setCardDescription` ou edicao do admin/user na UI)
3. `messages WHERE chat_id = ?` — historico do chat com Claude (pode estar vazio)
4. `dev_card_comments WHERE chat_id = ?` — thread admin/tuninho (onde
   `@tuninho` mention dispara webhook outbound `dispatchToCss` pro CSS)

Query padrao de inspecao:

```bash
DB=/opt/hostinger-beta/tuninho-ai/data/tuninho.db
ssh hostinger-beta "sqlite3 -header $DB \"
SELECT id, title, length(description), substr(description, 1, 200), user_id FROM chats WHERE id = $CHAT_ID;
SELECT COUNT(*), max(created_at) FROM messages WHERE chat_id = $CHAT_ID;
SELECT id, author_kind, mentions_tuninho, dispatch_status, substr(body, 1, 200) FROM dev_card_comments WHERE chat_id = $CHAT_ID ORDER BY id;
\""
```

Pos card 134 v0.5.28+: o webhook outbound `tuninho.ai → claude-sessions-service`
ja inclui `chatTitle + chatDescription + recentMessages` no payload v2, entao
agentes em sessao Claude remota chegam com contexto completo do card e nao
precisam buscar via SSH+SQL daqui em diante (ressalva: payload v1 legado
continua suportado pra retro-compat).



## Projeto

- **Nome**: tuninho-ai
- **Nome publico**: tuninho.ai
- **Perfil**: light
- **Stack**: Next.js 16.2.4 + React 19 + Tailwind 4 + SQLite (better-sqlite3) + @anthropic-ai/claude-agent-sdk
- **Dominio**: dev.tuninho.ai
- **Porta HTTP**: 3100 (interno, reverse proxy via nginx 80/443)
- **Servidor**: hostinger-beta (76.13.239.198)
- **App path**: `/opt/hostinger-beta/tuninho-ai/`
- **Deploy mode**: REMOTE (tarball + SCP + SSH)
- **SSL**: certbot Let's Encrypt (desde bootstrap — dominio ja aponta pro IP)

## Particularidades de Deploy

### Runtime (Node.js)
- Versao Node: **22 LTS** (compativel com better-sqlite3 v12)
- Framework: Next.js 16.2.4 (App Router, Turbopack)
- Modulos nativos (exigem build-essential):
  - `better-sqlite3 12.x` — binding nativo
- NPM install: **`env -u NODE_ENV npm install --include=dev`** pra devDeps no build (workaround: ambiente tem NODE_ENV=production global)
- Build: `env -u NODE_ENV npm run build` (apos install)
- Pos-build: `npm ci --production` para slim pasta node_modules runtime
- **CRITICO**: PM2 `instances: 1` (SQLite single-writer — cluster mode CORROMPE DB)

### Database
- Engine: **SQLite + better-sqlite3**
- DB path: `/opt/hostinger-beta/tuninho-ai/data/tuninho.db`
- Pragmas: journal_mode=WAL, foreign_keys=ON, synchronous=NORMAL
- Migrations: inline em `src/lib/db.ts` via `db.exec(...)` no boot
- Schema: 6 tabelas (users, boards, columns, chats, messages, cards)
- Backup strategy: rsync do dir `data/` (inclui tuninho.db + tuninho.db-wal + tuninho.db-shm)
- **Gotcha migrations (L1.1, 2026-04-22)**: migrations rodam no boot via
  `globalThis.__dbInit`. Em dev, HMR do Next.js NAO re-executa o boot — o modulo
  ja carregado nao detecta ALTER TABLE novo que voce acabou de escrever. **Sempre
  reiniciar o dev server manualmente** (`Ctrl+C` + `npm run dev`) apos editar
  `src/lib/db.ts`. **Em producao apos deploy**, **pm2 restart** (NAO `pm2 reload`):
  `restart` mata e sobe processo do zero, garantindo que o novo codigo de migration
  rode e a `globalThis` seja limpa. `reload` faz graceful restart e em alguns
  cenarios o modulo antigo permanece em memoria compartilhada. Regra: **toda
  mudanca em `db.ts` → `pm2 restart tuninho-ai`, nunca `reload`**.

### Auth
- JWT via `jose` (HS256, 7d exp)
- Cookie `auth` httpOnly + sameSite=lax + secure (em prod)
- bcryptjs salt 10

### Claude SDK
- `@anthropic-ai/claude-agent-sdk` via OAuth (NAO API KEY)
- Credentials: `/root/.claude/.credentials.json` (600 perm)
- Setup no servidor: `npm install -g @anthropic-ai/claude-code` + SCP `.credentials.json` local (preferido) OU `claude setup-token` (operador cola token manualmente)
- **CONFIRMADO na Op 02**: OAuth refresh_token FUNCIONA remoto. Quando access_token expira, SDK usa refresh_token pra obter novo sem intervencao humana. Refresh NAO requer login original — so refresh_token valido.
- Pre-requisito: SCP credentials enquanto access_token ainda esta valido (accessToken expiresAt > now). Se SCP de token ja expirado, precisa refreshar local antes ou re-SCP.
- Fallback: `ANTHROPIC_API_KEY` em `.env.production` (funciona sem OAuth se operador preferir API key — cobranca API em vez de Max subscription)
- ANTHROPIC_MODEL=claude-sonnet-4-6

## Env vars produção

**Sensitive** (`.env.production`, permission 600):
- `JWT_SECRET` — gerar via `openssl rand -base64 32` (novo, NAO reusar dev)
- Claude OAuth via `/root/.claude/.credentials.json` (nao env var)

**Nao sensitive** (ecosystem.config.js):
- `NODE_ENV=production`
- `PORT=3100`
- `ANTHROPIC_MODEL=claude-sonnet-4-6`
- `ALLOWED_EMAILS=victorgaudio@gmail.com` (ajustar conforme operador)
- `DATABASE_PATH=/opt/hostinger-beta/tuninho-ai/data/tuninho.db`

### Env vars introduzidas na Op 05 (seletor-modelo-admin)
- `OPENROUTER_API_KEY` — server-only, NUNCA prefix `NEXT_PUBLIC_`. Habilita o
  provider OpenRouter quando o admin seleciona no painel `/admin > Modelo LLM`.
  Sem a key, `src/lib/llm/openrouter.ts` retorna erro amigavel (mas Anthropic
  OAuth continua funcionando).
  - **Procedimento de set**: SSH → `nano /opt/hostinger-beta/tuninho-ai/.env.production`
    → adicionar linha `OPENROUTER_API_KEY=sk-or-v1-...` → `pm2 restart tuninho-ai`
    (nao reload — mudanca de env var exige restart completo).
  - **Rotacao**: toda rotacao exige redeploy (decisao MVP Op 05). Pode evoluir
    pra `admin_settings` criptografado numa op futura.
  - **Incidente conhecido GAP-OP05-004 (2026-04-23)**: operador postou a chave
    completa em comentario do card 1759607409325638796 no mural prod antes
    do Tuninho alertar sobre secrets leak. Decisao do operador: ambiente
    seguro, NAO rotacionar. Bumps petreos das skills (`tuninho-mural`
    `redact-secrets` soft alert + `tuninho-qa` `audit-secrets-leakage`)
    foram acionados pra prevenir reincidencia.

## Op 05 — Admin settings (chave-valor)
- Nova tabela `admin_settings` (key PK, value, updated_by, updated_at) criada
  via migration idempotente em `src/lib/db.ts`. Migration usa `CREATE TABLE IF
  NOT EXISTS` + `ALTER TABLE messages ADD COLUMN model` com pragma-gate — idempotent
  (bate `pm2 restart` sem problema).
- Settings leitura: `src/lib/admin-settings.ts` — `getSetting(key, default)` /
  `setSetting(key, value, updatedBy)`.
- Keys conhecidas:
  - `llm_provider` (default `"anthropic-oauth"`)
  - `llm_model` (default `process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"`)
  - `llm_system_prompt` (default hardcoded em `admin-settings.ts`)
- Seed: NAO popula (P11.1). Defaults sao resolvidos no codigo a cada request.
- Backup de admin_settings vai no rsync padrao do `data/` (so 1 tabela a mais).

## Nginx config

Path: `/opt/hostinger-beta/nginx/sites/tuninho-ai.conf`

```nginx
server {
    listen 80;
    server_name dev.tuninho.ai;

    # Certbot adiciona listen 443 ssl + redirect 80 → 443 automaticamente

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        # SSE streaming pro /api/chats/[id]/send
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

**CRITICO**: `proxy_buffering off` + `X-Accel-Buffering: no` nos response headers = streaming SSE funcional sem buffer do nginx.

## SSL / Certbot

Comando (executado no servidor):
```bash
certbot --nginx -d dev.tuninho.ai --non-interactive --agree-tos \
  --email victorgaudio@gmail.com --redirect
```

Certbot automaticamente:
- Solicita cert Let's Encrypt
- Modifica nginx config pra listen 443 ssl + HTTP 301 redirect
- Configura renewal automatico (cron/systemd timer)

## Deploy command sequence (Stage 0B bootstrap)

Executado via skill `tuninho-devops-hostinger`:

1. `ssh-add _a4tunados/env/hostinger-beta/id_ed25519` (passphrase: tentar 'tanarede')
2. `ssh root@76.13.239.198 "mkdir -p /opt/hostinger-beta/tuninho-ai"`
3. Local: `env -u NODE_ENV npm run build`
4. Local: `tar -czf /tmp/tuninho-ai.tar.gz --exclude=node_modules --exclude=.next/cache --exclude=data --exclude=_a4tunados .`
5. `scp /tmp/tuninho-ai.tar.gz root@76.13.239.198:/opt/hostinger-beta/tuninho-ai/`
6. `ssh root@76.13.239.198 "cd /opt/hostinger-beta/tuninho-ai && tar xzf tuninho-ai.tar.gz && env -u NODE_ENV npm install --include=dev && npm run build && npm ci --omit=dev"`
7. `ssh root@76.13.239.198 "cd /opt/hostinger-beta/tuninho-ai && ln -sf .env.production .env && pm2 start ecosystem.config.js && pm2 save"`
8. Nginx config + `nginx -t && nginx -s reload`
9. `certbot --nginx -d dev.tuninho.ai ...`
10. Claude Code setup: `npm install -g @anthropic-ai/claude-code`
11. Claude OAuth: `claude setup-token` OU `scp ~/.claude/.credentials.json root@76.13.239.198:/root/.claude/.credentials.json`
12. `pm2 restart tuninho-ai` (pra reler credentials)
13. Smoke test: `curl -sI https://dev.tuninho.ai/` → HTTP 200
14. Playwright externo: fluxo end-to-end

## Port registry

Esta usando porta **3100**. Lista do beta:
- 3100 → tuninho-ai (este projeto)
- 1337 → mural (planejado, ainda nao deployado)
- (outras reservadas no server-registry.json)

## Troubleshooting

### better-sqlite3 build falha
```bash
apt-get install -y build-essential python3
cd /opt/hostinger-beta/tuninho-ai
npm rebuild better-sqlite3 --build-from-source
```

### Claude SDK auth error
```bash
cat /root/.claude/.credentials.json  # deve ter OAuth tokens
claude --version  # deve retornar versao

# Check expiresAt
python3 -c "
import json, datetime
d = json.load(open('/root/.claude/.credentials.json'))
exp = d['claudeAiOauth']['expiresAt']
now = int(datetime.datetime.now().timestamp() * 1000)
print(f'expiresAt: {datetime.datetime.fromtimestamp(exp/1000).isoformat()}')
print(f'valido: {exp > now}')
"

# Teste direto CLI (forca refresh se expirado)
claude 'Responda apenas: pong'

# Se falhar com 'Invalid authentication credentials':
# 1. SCP fresh credentials do operador local
# 2. Ou fallback pra ANTHROPIC_API_KEY em .env.production
```

### Monitor periodico
Script em `/opt/hostinger-beta/tuninho-ai/monitor/smoke.sh` roda via cron a cada 30min.
- Valida expiresAt das credentials
- HTTP 200 do home
- PM2 status online
- SSE real via /api/chats/.../send
- Log em `/opt/hostinger-beta/tuninho-ai/monitor/smoke.log`
- Status em `/opt/hostinger-beta/tuninho-ai/monitor/last-status` (OK | FAIL | FAIL-SSE)

Se falhar, ler log pra entender categoria.

### SSE streaming com delay
- Verificar `proxy_buffering off` em nginx
- Verificar response headers `X-Accel-Buffering: no` (ja setado no route.ts)

### PM2 nao inicia
```bash
pm2 logs tuninho-ai --lines 50
pm2 describe tuninho-ai
# Verificar que instances: 1 em ecosystem.config.js
```
