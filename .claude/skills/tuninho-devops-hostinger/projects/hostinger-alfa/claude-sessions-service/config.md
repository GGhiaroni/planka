# Sidecar — claude-sessions-service (Op 23)

## Projeto
- **Nome**: claude-sessions-service (monorepo `services/claude-sessions-service/` do a4tunados_mural)
- **Stack**: Express 4 + ws 8 + better-sqlite3 + @anthropic-ai/claude-agent-sdk ^0.2.101 + @modelcontextprotocol/sdk ^1.29 (transitive)
- **Subprocess filho**: `mcp-servers/mural-mcp/` (stdio, 25 tools)
- **Dominio**: tuninhoideweb.fourtuna.com.br (path-based via Nginx)
- **Porta**: 3848
- **PM2 name**: claude-sessions-service (id 16)

## Particularidades de Deploy

- **Modulos nativos**: better-sqlite3 (rebuild se necessario)
- **Agent SDK V1** (NAO V2) — migrado na Op 21
- **MCP subprocess**: `mcp-servers/mural-mcp/` tem seu proprio `node_modules` (file: ref para mural-api-client). Deve ser incluso no tarball e ter `npm install` no servidor apos scp.
- **Dependencia**: `services/mural-api-client/` (lib compartilhada) precisa ser copiada junto
- **ESM**: package.json tem `"type": "module"`
- **ecosystem.config.cjs**: `script: 'server/index.js'`, max_memory_restart 512M

## Env vars producao
- `NODE_ENV=production`
- `PORT=3848`
- `API_KEY=<d66b1837...>` (compartilhado com frontend)
- `WORKSPACES_DIR=/opt/hostinger-alfa/tuninho-ide-web/workspaces`
- `CLAUDE_MODEL=claude-sonnet-4-6`
- **[Op 23 NOVO]** `MURAL_API_BASE=https://mural.a4tunados.com.br`
- **[Op 23 NOVO]** `MURAL_TUNINHO_TOKEN=<internal_access_token>` (vira do server/.env do mural em prod DO, ainda nao deployado)

## Deploy Mode
- **NAO e self-deploy** — deploy tradicional via scp + ssh + pm2 restart
- Prod path: `/opt/hostinger-alfa/claude-sessions-service`
- Tarball excludes: `node_modules`, `data`, `logs`, `.git`, `deploy-scripts`, `__test-bearer.js`, `_operacoes`, `_a4tunados`, etc

## Fluxo de Deploy
1. Gerar tarball com `services/claude-sessions-service/` + `services/mural-api-client/`
2. scp para `/tmp/claude-sessions-service.tar.gz`
3. Extrair em `/opt/hostinger-alfa/claude-sessions-service`
4. `cd services/mural-api-client && npm install` (ou file:ref via symlink)
5. `cd services/claude-sessions-service && npm install --omit=dev`
6. `cd mcp-servers/mural-mcp && npm install --omit=dev`
7. `pm2 restart claude-sessions-service`
8. Verificar health: `curl https://tuninhoideweb.fourtuna.com.br/api/sessions/health`

## Cross-project coexistencia
- Coexiste com: tuninho-ide-web (3847), chooz_2026 (3849), maestrofieldmanager (3001), familygames (3047), weplus (porta dinamica)
- Todos compartilham o WORKSPACES_DIR (`/opt/hostinger-alfa/tuninho-ide-web/workspaces`)

## Status Op 23 (2026-04-13)
- Codigo da Op 23 presente no branch `feat/op23-claudecode-back-v3`
- **NAO deployado em producao Hostinger ainda** — operador deve invocar `tuninho-devops-hostinger deploy claude-sessions-service` apos validacao humana pos-DDCE
- **MCP server mural-mcp vai ficar DORMENTE** em producao ate o mural prod DO ser atualizado com as mudancas da Op 23 (migrations + helpers enrichment) — isso sera uma op futura (Op 24 ou similar)

## Historico de Deploys
| Deploy | Data | Versao | Notas |
|--------|------|--------|-------|
| Initial | 2026-04-12 | v1.0.0 | Deploy inicial Op 20 (V2 unstable) |
| V1 migration | 2026-04-12 | v2.0.0 | Op 21: migrado para V1 query() |
| (pending) | TBD | v2.1.0 | Op 23: mural-mcp subprocess + effort + operator injection |
