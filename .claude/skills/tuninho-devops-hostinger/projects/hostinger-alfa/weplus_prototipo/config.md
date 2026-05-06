# Sidecar — weplus_prototipo

> **⚠️ EVOLUCAO DO PROJETO — ATUALIZADO 2026-04-13 na Op 23 sessao 03 MARCO 5**
>
> Este sidecar foi criado em 2026-04-08 (Op 01 DDCE) descrevendo o projeto como
> 100% estatico sem PM2. **A realidade mudou** entre aquela data e 2026-04-13.
> O scan via SSH + PM2 jlist descobriu que existe um PM2 service chamado `weplus`
> rodando na porta 3850 em outro path (workspace self-hosting).
>
> **Historico preservado ao final do documento.** Este header documenta o estado ATUAL.

## Estado Atual (2026-04-13)

| Campo | Valor |
|-------|-------|
| **Projeto** | weplus_prototipo |
| **Nome publico** | WePlus |
| **Dominio** | weplus.a4tunados.com.br |
| **Porta PM2** | **3850** (antes era N/A — site estatico) |
| **Stack atual** | **Node.js dinamico** (detalhes nao catalogados) |
| **PM2 service** | `weplus` (online, PID 1014360 no scan) |
| **CWD real** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/weplus_prototipo` |
| **Deploy mode** | SELF_DEPLOY via workspace self-hosting |
| **Nginx config** | `/etc/nginx/sites-enabled/weplus.conf` (proxy_pass :3850) |
| **Server** | hostinger-alfa (31.97.243.191) |
| **SSL** | Let's Encrypt |
| **Ultimo scan** | 2026-04-13 (Op 23 sessao 03 MARCO 5) |

## Observacoes da evolucao

- **Migracao de static → dynamic**: entre 2026-04-08 (deploy inicial, Op 01 DDCE) e 2026-04-13 (scan atual, Op 23 sessao 03), o projeto virou uma app Node.js com backend dinamico. Stack especifico (Express? Next.js?) ainda nao catalogado — proxima op deve capturar.
- **Path mudou**: sidecar original dizia `/opt/hostinger-alfa/weplus_prototipo/` (local fixo). A realidade e que o PM2 roda de dentro do workspace `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/weplus_prototipo/` — indicando que o deploy e via self-hosting (Claude Code dentro do tuninho-ide-web edita direto no workspace que e tambem onde o PM2 aponta).
- **Deploy flow**: SELF_DEPLOY e mantido como deploy mode — o operador continua editando via self-hosting, so que agora tem PM2 por cima.

---

## Historico — Estado Original (Op 01 DDCE, 2026-04-08)

> Preservado para auditoria. NAO usar como fonte de verdade atual.

Projeto: weplus_prototipo
Nome publico: WePlus
Dominio: weplus.a4tunados.com.br
Porta: N/A (Nginx serve static direto, sem proxy_pass)
Stack: HTML/CSS/JS estatico puro (sem build, sem framework, sem backend)
Frontend: Vanilla JS + CSS custom properties + Chart.js CDN + Lucide Icons CDN
Banco de dados: Nenhum
PM2 service: Nenhum (site estatico — Nginx serve direto via root + try_files)
Deploy mode: SELF_DEPLOY
Server: hostinger-alfa
IP: 31.97.243.191
App path (original): /opt/hostinger-alfa/weplus_prototipo/
Nginx config (original): /opt/hostinger-alfa/nginx/sites/weplus.conf
SSL: Let's Encrypt (expira 2026-07-06)
Logs: N/A (access/error logs no Nginx global)
Ultimo deploy (original): 2026-04-08
Versao: 1.0.0
Tipo: Bootstrap
Branch: main

## Self-Deploy

workspace_path: /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/weplus_prototipo
prod_path: /opt/hostinger-alfa/weplus_prototipo
health_endpoint: https://weplus.a4tunados.com.br/
graceful_restart: N/A (sem processo — basta rsync + nginx reload se config mudar)

rsync_excludes:
.git/, _a4tunados/, .claude/, .mcp.json, .playwright-mcp/, node_modules/, mobile-homepage-375x812.png

cross_projects:
maestrofieldmanager|3001|maestro.fourtuna.com.br
chooz_2026|3849|chooz2026.fourtuna.com.br
familygames|3030|familysundaygames.fourtuna.com.br
tuninho-ide-web|3847|tuninhoideweb.fourtuna.com.br
systemd:orquestravoadora|3040|oficinaorquestravoadora2026.55jam.com.br

## Particularidades

- Primeiro projeto 100% estatico no servidor — sem PM2, sem porta interna
- Nginx serve direto via `root` + `try_files`, NAO proxy_pass
- PWA com Service Worker v3: sw.js deve ter Cache-Control no-cache/no-store
- manifest.webmanifest: precisa `default_type application/manifest+json` no Nginx (nao existe no mime.types padrao)
- Assets sem fingerprinting: cache 7d (NAO immutable)
- HTML: no-cache (garante versao atualizada)
- Header customizado X-Served-By: hostinger-alfa-nginx (prova de origem)
- Deploy = rsync + nginx reload (sem npm install, sem build, sem pm2 restart)
- Sem .env, sem secrets, sem banco, sem migrations

## Changelog e Versionamento

changelog_path: _a4tunados/docs_weplus_prototipo/changelog.md
version_path: _a4tunados/docs_weplus_prototipo/versioning.md

## Historico de Deploy

| Data | Versao | Tipo | Observacoes |
|------|--------|------|-------------|
| 2026-04-08 | 1.0.0 | Bootstrap | Migracao do Vercel. DDCE Op 01. DNS Wix → A record. SSL Certbot. |
