# tuninho.ai — Environment Config

> Atualizado em 2026-04-22 via `/tuninho-devops-env` v1.1.0 (bootstrap scan — `env-catalog.json` gerado agora).
> Op 03 Fase 3 migrou auth + landing publica (2026-04-21). Deploy producao migrado de Vercel para hostinger-beta em 2026-04-19 (Op 02 Fase 6).
> Para re-scan completo automatico: `/tuninho-devops-env`.

## ⚠️  Warnings Ativos (v1.1.0 — 2026-04-22 scan)

### GCP-ORG-1 — Firebase service account keys bloqueadas na org 4tuna.com.br (INFO)

Projeto usa Firebase (`NEXT_PUBLIC_FIREBASE_PROJECT_ID` detectado). Se for gerar
service account JSON pela primeira vez sob a org `4tuna.com.br`, AMBAS as policies
precisam estar desativadas:

- `iam.managed.disableServiceAccountApiKeyCreation` (projeto)
- `iam.disableServiceAccountKeyCreation` (org legada — sobrescreve projeto)

Referencia: `_a4tunados/_operacoes/projetos/03_go-live/qa/_12_QA_LICOES_RETROALIMENTACAO.md` L3.1.

### NODE-ENV-1 — NODE_ENV=production herdado da sessao Claude Code (ATENCAO)

**Detectado no scan**: `NODE_ENV=production` + `npm config get omit=dev`.

Neste workspace de dev, `npm install` silenciosamente pula devDependencies
(typescript, eslint, tailwind). Use sempre:

```bash
env -u NODE_ENV npm install --include=dev
# OU
NODE_ENV=development npm install --include=dev
```

Workaround tambem registrado no sidecar `projects/hostinger-beta/tuninho-ai/config.md`
do `tuninho-devops-hostinger` (pos-npm install em producao usa `env -u NODE_ENV`).

## Identificacao

| Campo | Valor |
|-------|-------|
| **Projeto** | tuninho.ai |
| **Package name** | `tuninho-ai-init` |
| **Path** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai` |
| **Stack** | Next.js 16.2.4 + React 19 + TypeScript 5 + Tailwind 4 + Turbopack |
| **Runtime** | Node.js 22 LTS (em prod); Node >=20 em dev |
| **BD** | SQLite (`better-sqlite3`) |
| **Auth** | Firebase Auth (Google signin) via `next-firebase-auth-edge` |
| **Claude SDK** | `@anthropic-ai/claude-agent-sdk` com OAuth |
| **Servidor local (dev)** | hostinger-alfa workspace (nao hospeda prod) |
| **Deploy producao** | hostinger-beta — https://dev.tuninho.ai |

## Desenvolvimento (local — hostinger-alfa workspace)

| Item | Valor |
|------|-------|
| **Dev server** | `npm run dev` (Next.js + Turbopack) |
| **Porta dev padrao** | 3000 |
| **Portas ocupadas vizinhas** | 3001 (`maestrofieldmanager`), 3847 (`tuninho-ide-web`) |
| **CDP Playwright MCP** | 9226 (via `.mcp.json`) |
| **Node version** | >=20 (via `@types/node` 20) |
| **Package manager** | npm (com `package-lock.json`) |
| **Build cache** | `.next/` (gitignored) |
| **DB dev path** | `./data/tuninho.db` (gitignored — so `.gitkeep` commitado) |
| **Gotcha NODE_ENV** | Sessao tem `NODE_ENV=production` — prefixar `NODE_ENV=development npm install --include=dev` quando instalar devDeps |

## Matriz de Portas no hostinger-alfa (vizinhos)

| Porta | Servico | Projeto |
|-------|---------|---------|
| 3001 | next-server | maestrofieldmanager (PM2 id 0) |
| 3847 | node | tuninho-ide-web (PM2 id 4) |
| 3849 | next-server | outro workspace Next |
| 9222-9225 | chrome-headless | Playwright MCPs de outros projetos |
| 9226 | chrome-headless | Playwright MCP **deste projeto** |

## Producao — hostinger-beta (ativo desde Op 02 Fase 6)

| Item | Valor |
|------|-------|
| **Provedor** | Hostinger VPS (hostinger-beta) |
| **Host** | 76.13.239.198 |
| **Dominio** | dev.tuninho.ai |
| **URL** | https://dev.tuninho.ai |
| **SSL** | Let's Encrypt via certbot (renewal auto) |
| **App path** | `/opt/hostinger-beta/tuninho-ai/` |
| **Porta interna** | 3100 (PM2 -> Nginx 443) |
| **PM2 name** | `tuninho-ai` (fork mode, instances=1 — SQLite single-writer) |
| **Skill deploy** | `tuninho-devops-hostinger` |
| **Sidecar deploy** | `.claude/skills/tuninho-devops-hostinger/projects/hostinger-beta/tuninho-ai/config.md` |
| **Registry portas** | `_a4tunados/deploys/hostinger-beta/server-registry.json` |
| **Monitor** | cron `*/30min` em `/opt/hostinger-beta/tuninho-ai/monitor/smoke.sh` (HTTP + PM2 + SSE + credentials expiry) |
| **Cross-project** | compartilha servidor com `a4tunados-mural` (porta 1337) — zero conflito |

## Env Vars de producao

Em `/opt/hostinger-beta/tuninho-ai/.env.production` (permissao 600, NAO commitado):

**Server-only (secrets)**:
- `JWT_SECRET` — usado como cookie signature key do next-firebase-auth-edge (reuso do nome legado; renomear para AUTH_COOKIE_SIGNATURE_KEY e futuro)
- `FIREBASE_ADMIN_CREDENTIALS_B64` — service account JSON em base64 (Firebase Admin SDK)
- `DATABASE_PATH=/opt/hostinger-beta/tuninho-ai/data/tuninho.db`
- `PORT=3100`
- `NODE_ENV=production`
- `ANTHROPIC_MODEL=claude-sonnet-4-6`

**Client/public (inline em .env.production ou ecosystem.config.js)**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (`tuninho-ai.firebaseapp.com`)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (`tuninho-ai`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Claude SDK auth** (nao env var — arquivo):
- `/root/.claude/.credentials.json` (permissao 600) — OAuth tokens
- Fallback: `ANTHROPIC_API_KEY` em `.env.production` se operador preferir

Legado removido na Op 03: `ALLOWED_EMAILS` (substituido por `users.role` ENUM no SQLite).

## Riscos de Estado Compartilhado

### 1. Workspace compartilhado no hostinger-alfa (dev)

- **Porta 3000**: se `npm run dev` rodar junto com outro projeto Next.js, ha colisao. Mitigacao: `PORT=3050 npm run dev`
- **Token GitHub** no remote URL: nao commitado, mas visivel em `git remote -v`

### 2. Playwright CDP dedicado (9226) — sem conflito

Porta 9226 e exclusiva deste projeto. Outros projetos usam 9222-9225.

### 3. Credentials Firebase + Claude SDK em prod

- Firebase service account JSON: sensivel. Rotacionar em caso de exposicao (qualquer session log que tenha passado por transcript com chave privada).
- Claude OAuth: `/root/.claude/.credentials.json` expira periodicamente; monitor roda cron check em `expiresAt - now` e alerta.

## Como rodar dev

```bash
cd /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai
NODE_ENV=development npm install --include=dev   # se node_modules desatualizado
npm run dev   # Next.js em localhost:3000
```

## Como deployar producao

Via skill `tuninho-devops-hostinger`:

```
/tuninho-devops-hostinger   # ou "deploy hostinger-beta", "deploy tuninho-ai", etc
```

Fluxo (Stage 0B bootstrap ja feito na Op 02; agora e incremental):
1. SSH key loaded (`_a4tunados/env/hostinger-beta/id_ed25519`)
2. Local `env -u NODE_ENV npm run build`
3. Tarball + SCP para `/opt/hostinger-beta/tuninho-ai/`
4. SSH remote: extract + `npm install --include=dev` + rebuild `better-sqlite3` + `npm run build`
5. Atualiza `.env.production` (se novas env vars)
6. `pm2 restart tuninho-ai`
7. Smoke: `curl -sI https://dev.tuninho.ai/` -> 200

## Historico de Scans

| Data | Tipo | Descobertas chave |
|------|------|-------------------|
| 2026-04-19 | Manual retroativo | Scope = `victorgaudios-projects` (nao a4tunados); deploy via GitHub webhook; nenhum processo local PM2 — estado pre-Op-02-F6 |
| 2026-04-19 | Op 02 F6 | Migracao para hostinger-beta completa (PM2 porta 3100, Nginx + SSL, cron smoke) |
| 2026-04-21 | Op 03 F3 | Firebase Auth + waitlist + events. 9 env vars novas em .env.production |

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 0.1.0 | 2026-04-19 | Seed minimo |
| 1.0.0 | 2026-04-19 | Scan manual completo (estado pre-hostinger-beta) |
| 2.0.0 | 2026-04-21 | Pos-migracao hostinger-beta + Op 03 F3 (Firebase Auth + waitlist) |
| 2.1.0 | 2026-04-22 | Bootstrap completo via `/tuninho-devops-env` v1.1.0. Gerado `env-catalog.json` + 2 warnings ativos (GCP-ORG-1 Firebase org policies + NODE-ENV-1 NODE_ENV=production na sessao) derivados da Op 03 go-live. |
