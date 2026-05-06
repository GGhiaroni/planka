# Sidecar — tuninho-ide-web

## Projeto
- **Nome**: tuninho-ide-web
- **Stack**: Express + WS + node-pty + tmux + better-sqlite3
- **Dominio**: tuninhoideweb.fourtuna.com.br
- **Porta**: 3847

## Particularidades de Deploy

- **Modulos nativos**: node-pty e better-sqlite3 requerem `build-essential` no servidor
- **Claude CLI**: precisa estar instalado globalmente (`npm install -g @anthropic-ai/claude-code`)
- **ESM**: package.json tem `"type": "module"`, usar `ecosystem.config.cjs` (NAO .js)
- **tmux mouse**: ON (scroll funciona). Selecao de texto: **Shift+arraste** (padrao terminal)
- **postinstall**: glob `*/spawn-helper` (cross-platform, NAO `darwin-*`)
- **Build frontend**: `npm run build` gera bundles esbuild (codemirror, xterm, marked)
- **Sem Prisma**: usa better-sqlite3 direto, DB em `data/tuninho.db`
- **Admin user**: `node admin.js add-user admin senhasegura --role admin`

## Env vars producao
- `NODE_ENV=production`
- `PORT=3847`
- `JWT_SECRET` (auto-gerado)
- `SHELL=/bin/bash`

## Self-Deploy Config

> Este projeto roda no proprio servidor (IDE editando a si mesma).
> Deploy via rsync workspace→producao, sem SSH.

| Campo | Valor |
|-------|-------|
| **deploy_mode** | SELF_DEPLOY |
| **workspace_path** | /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/a4tunados_web_claude_code |
| **prod_path** | /opt/hostinger-alfa/tuninho-ide-web |
| **db_path** | data/tuninho.db |
| **health_endpoint** | http://localhost:3847/ |
| **graceful_restart** | true por default (pm2 restart graceful — Licao #32). EXCECAO: se `ecosystem.config.cjs` mudou no diff, usar `pm2 delete + pm2 start ecosystem.config.cjs --only tuninho-ide-web` (com env limpo — ver L-CARD176755-8). |
| **session_preservation** | tmux sobrevive ao restart; WebSocket auto-reconnect ~2-3s |

### rsync_excludes

```
data/
node_modules/
.git/
workspaces/
logs/
ecosystem.config.cjs
_a4tunados/
.claude/
.mcp.json
.playwright-mcp/
evidencias/
subprojetos/
dev.sh
deploy.sh
CLAUDE.md
README.md
.env
.env.production
.env.local
.env.preview
```

> Nota (Op 15, 2026-04-21): `README.md` adicionado porque prod tem versao manual
> descritiva criada em 12/04/26 fora do git. Excluir preserva sem conflito.
>
> Nota (Op 19, 2026-05-03): `.env*` adicionados apos detectar bug durante deploy
> autonomous v0.4.1 — workspace nao tem `.env` (gitignored), prod tem `.env` com
> `JWT_SECRET` (328 bytes). Sem proteger em excludes, `rsync --delete` deletaria
> `.env` em prod (BRICK risk: JWT cai, todas sessoes deslogam, login quebra).
> Detectado defensivamente no dry-run, mitigado naquela run; este fix torna
> permanente para deploys futuros.

### conditional_triggers

| Trigger | Condicao | Acao |
|---------|----------|------|
| npm install | `package.json` mudou (diff workspace vs prod) | `cd {prod_path} && npm install --production` |
| npm run build | `*-src.js` mudou (codemirror-src, xterm-src, marked-src) | `cd {prod_path} && npm run build` |
| ecosystem cold restart | `ecosystem.config.cjs` mudou (diff workspace vs prod) | **NAO usar `pm2 restart` graceful**. Rodar em env limpo: `env -i HOME=/root PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TERM=xterm bash -c 'cd {prod_path} && pm2 delete tuninho-ide-web; pm2 start ecosystem.config.cjs --only tuninho-ide-web && pm2 save'`. Validar pos-restart: `pm2 jlist` deve mostrar valores configurados (max_memory_restart, kill_timeout, etc) iguais aos do `.cjs`. Origem: L-CARD176755-8 (env vars vazadas + reload sem reread config). |

### cross_projects

```
maestrofieldmanager|3001|maestro.fourtuna.com.br
chooz_2026|3849|chooz2026.fourtuna.com.br
systemd:orquestravoadora|3040|dev.oficinaorquestravoadora2026.55jam.com.br
```

## Historico de Deploys
| Deploy | Data | Versao | Notas |
|--------|------|--------|-------|
| Bootstrap | 2026-03-30 | v0.1.0 | Primeiro deploy. Instalou build-essential + Claude CLI. |
| Hotfix | 2026-03-30 | v0.2.0 | Fix tmux-manager envStr + selecao texto + auto-focus |
| Feature | 2026-03-30 | v0.3.0 | Multi-viewer terminal + admin connections panel |
| Fix | 2026-03-30 | v0.4.0 | Re-enable tmux mouse on (scroll), Shift+drag para selecao |
| Self-Deploy | 2026-04-02 | v0.5.0 | Primeiro self-deploy via rsync. Auto-reconnect WS + deploy.sh + dev.sh |
| Self-Deploy | 2026-04-03 | v0.6.0 | Op 09: Multi-session stability (claim/attach, overlays, heartbeat, isolamento dev/prod). Downtime ~2s. Via skill v2.1.0 |
| Self-Deploy | 2026-04-04 | v9.0.0 | Op 11: GitGraph interativo (SVG, context menu, changes, push/pull/sync, branch status bar). Downtime ~2s. Via skill v2.2.0 |
| Self-Deploy | 2026-04-06 | v9.1.0 | Fix gitgraph: dblclick checkout com refresh, user-select none, cursor pointer. Downtime ~2s. Via skill v2.2.2 |
| Self-Deploy | 2026-04-21 | v0.3.1 | Op 15 Chat Terminal Revisão: scroll defer-open + DOM renderer + fontFamily universal + iOS touch-action manipulation + position:fixed removido. Downtime ~34s (incidente PM2 restart → recovery via pm2 start). 13 tmux sessions recuperadas. Via skill v2.2.2. |
| Self-Deploy | 2026-05-03 | v0.4.1 | Op 19 (card-isolated 1766067208959559112) — chat-terminal follow-up Op 15 fixes iPad real (retry-loop _openAndFitSession, cursor bar+blink off, hasTouch substitui isMobile, handleResize idempotente). Downtime <1s. Via skill v3.5.2 --autonomous. **NOTA**: detectado bug sidecar — `.env*` nao estava em rsync_excludes. Adicionado defensivamente nesta run, devera ser fixado no proximo edit do sidecar. |
