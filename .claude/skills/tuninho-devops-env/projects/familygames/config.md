# familygames — Environment Config

> Brohin Games — plataforma de jogos local multiplayer (TV + controles via QR Code).
> Self-hosting: workspace e producao no mesmo servidor (hostinger-alfa).

## Producao

| Campo | Valor |
|-------|-------|
| **Porta** | 3030 |
| **Dominio** | https://familysundaygames.fourtuna.com.br |
| **PM2 service** | familygames (id 6, pid 527313, online) |
| **App path** | /opt/hostinger-alfa/familygames/ |
| **Workspace** | /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/familygames |
| **Stack** | Node.js 22 + Express 5.2 + Socket.io 4.8 + qrcode |
| **DB** | Nenhum (state em memoria) |
| **Logs** | /opt/hostinger-alfa/familygames/logs/ |
| **Ecosystem** | ecosystem.config.cjs (PORT=3030, PUBLIC_URL setado) |
| **SSL** | Let's Encrypt — expira 2026-07-03 |

## Desenvolvimento

| Campo | Valor |
|-------|-------|
| **Porta sugerida** | 4000 (3030 esta ocupado pelo prod no mesmo servidor) |
| **Comando** | `PORT=4000 npm start` ou `PORT=4000 npm run dev` |
| **NUNCA** | `npm start` puro — herda PORT=3847 do shell (SHELL-PORT-1) |

## Matriz de Isolamento

| Recurso | Producao | Desenvolvimento |
|---------|----------|-----------------|
| Porta HTTP | 3030 | OVERRIDE necessario (4000+) |
| PM2 | familygames | nao-PM2 (node direto) |
| Dominio | familysundaygames.fourtuna.com.br | localhost |
| Database | n/a | n/a |
| Logs | /opt/hostinger-alfa/familygames/logs/ | stdout |

## Warnings ativos

### SHELL-PORT-1 (severity: high)

Shell pai exporta `PORT=3847` (herdado do tuninho-ide-web IDE host). `.env.production`
tem `PORT=3030`. `npm start` puro neste workspace tenta bind em 3847 → **EADDRINUSE**
garantido (porta ocupada pelo proprio tuninho-ide-web prod).

**Mitigacao**: SEMPRE rodar com PORT explicito:

```bash
PORT=4000 npm start         # ou
PORT=4000 npm run dev       # com auto-reload
```

## Servicos co-localizados no servidor

| Servico | Porta | Dominio |
|---------|-------|---------|
| tuninho-ide-web | 3847 | tuninhoideweb.fourtuna.com.br |
| weplus | ? | (sidecar weplus_prototipo) |
| next-server (dev) | 3000 | localhost |
| chrome-headless | 9223 | (CDP local do IDE) |

## Particularidades do projeto

- ESM (`"type": "module"` no package.json) — ecosystem deve ser `.cjs`
- Socket.io exige nginx com `location /socket.io/` e `proxy_read_timeout 86400`
- QR Code: `server.js` usa env var `PUBLIC_URL` para gerar URL do controller (em prod)
- Reconexao automatica de jogadores por nome (localStorage `brohin_player_name`)
- Sem build step, sem bundler, sem TypeScript — vanilla JS/CSS

## Versao do scan

- **Scan**: 2026-05-03 20:46 UTC
- **Modo**: bootstrap (primeiro catalogo)
- **Skill**: tuninho-devops-env v1.2.0
- **Detector ativo**: SHELL-PORT-1 (L2.2 Op 05)
