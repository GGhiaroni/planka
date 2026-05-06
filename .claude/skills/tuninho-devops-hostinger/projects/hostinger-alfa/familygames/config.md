# Sidecar — familygames

## Projeto

| Campo | Valor |
|-------|-------|
| **Projeto** | familygames |
| **Nome publico** | Brohin Games |
| **Dominio** | familysundaygames.fourtuna.com.br |
| **Porta** | 3030 |
| **Stack** | Node.js 22 + Express 5.2 + Socket.io 4.8 + qrcode |
| **Frontend** | Vanilla JS/CSS (sem bundler, sem build) |
| **Banco de dados** | Nenhum |
| **PM2 service** | familygames |
| **PM2 id** | 6 |
| **Deploy mode** | REMOTE |

## Servidor

| Campo | Valor |
|-------|-------|
| **Server** | hostinger-alfa |
| **IP** | 31.97.243.191 |
| **App path** | /opt/hostinger-alfa/familygames/ |
| **Nginx config** | /opt/hostinger-alfa/nginx/sites/familygames.conf |
| **SSL** | Let's Encrypt (expira 2026-07-03) |
| **Ecosystem** | ecosystem.config.cjs |
| **Logs** | /opt/hostinger-alfa/familygames/logs/ |

## Deploy

| Campo | Valor |
|-------|-------|
| **Ultimo deploy** | 2026-04-04T05:33:16Z |
| **Versao** | v2.0.0 |
| **Tipo** | Bootstrap |
| **Hash** | cb1bf3e |
| **Branch** | deploy/hostinger-alfa |
| **Ultimo scan** | 2026-04-13 (Op 23 sessao 03 MARCO 5 — tuninho-devops-env) |
| **PID** | 527313 (online no scan) |

## Particularidades

- **Sem build step**: nao precisa de `npm run build`, `npx prisma generate`, etc.
- **Sem banco de dados**: nenhum SQLite, Prisma, migration, seed.
- **Socket.io**: Nginx precisa de location block dedicado para `/socket.io/` com `proxy_read_timeout 86400`.
- **ESM**: package.json tem `"type": "module"` — ecosystem deve ser `.cjs`.
- **npm install**: pode usar `--omit=dev` (devDeps nao sao necessarias em producao).
- **QR Code**: server.js gera QR Code com IP detectado na interface de rede — em producao mostra IP interno, nao o dominio.

## Tarball excludes

```
node_modules, .git, .env*, ._*, .DS_Store, _a4tunados, .claude,
.playwright-mcp, tuninho-escriba-workspace, *.png
```
