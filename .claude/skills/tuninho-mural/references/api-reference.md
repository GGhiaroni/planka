# API Reference — tuninho-mural

> Reference de comandos CLI e exemplos de uso.

## Comandos Globais

Todos os comandos suportam:
- `--env dev|stage|prod` — seleciona o arquivo de credenciais (default: dev)

## Exemplos Praticos

### connect — teste de conexao

```bash
node mural-cli.js connect --env dev
# [tuninho-mural] Connected to http://localhost:1337 (env: dev)
#   - health: OK
```

### list-cards — listar cards de um board

```bash
node mural-cli.js list-cards --board 1738934225471538416 --env dev
# [tuninho-mural] Board "one" has 5 cards
#   - 1738934598353552632  booooa
#   - ...
```

### fetch-card — contexto completo de um card

```bash
node mural-cli.js fetch-card --card 1738934598353552632 --env dev
# [tuninho-mural] Card 1738934598353552632: booooa
#   description: ...
#   included keys: cardMemberships, cardLabels, taskLists, tasks, customFieldGroups, ...
#   memberships: 2
#   labels: 3
#   task lists: 1
#   attachments: 0
```

### create-card — criar novo card

```bash
node mural-cli.js create-card \
  --list 1752019391500780804 \
  --name "Card criado via CLI" \
  --description "Descricao em markdown\n\n- item 1\n- item 2" \
  --type project \
  --env dev
```

### update-card — atualizar campos de um card

```bash
# Mudar nome
node mural-cli.js update-card --card 1234 --name "Novo titulo"

# Mudar state
node mural-cli.js update-card --card 1234 --state done

# Mover para outra list
node mural-cli.js update-card --card 1234 --list 5678

# Atualizar descricao
node mural-cli.js update-card --card 1234 --description "## Nova descricao"
```

### comment — adicionar comentario

```bash
node mural-cli.js comment \
  --card 1234 \
  --text "Comentario gerado via tuninho-mural CLI" \
  --env dev
```

### export-result — exportar resultado DDCE para o mural

Ao final de uma operacao DDCE, exportar `_3_RESULTS_` para comentarios nos
cards correspondentes:

```bash
node mural-cli.js export-result \
  --card 1738934598353552632 \
  --results _a4tunados/_operacoes/prompts/23_3_RESULTS_claudecode_back_v3.md \
  --env dev
```

Se o arquivo results usa o formato `## [cardId]`, a CLI extrai automaticamente
a secao correspondente ao card e a publica como comentario.

## Arquitetura

```
Claude Code CLI (local)
    ↓
Skill tool: "tuninho-mural", args: "fetch-card --card ..."
    ↓
node .claude/skills/tuninho-mural/cli/mural-cli.js fetch-card --card ...
    ↓
services/mural-api-client (shared lib, Op 23 Fase 2)
    ↓
HTTP (Bearer MURAL_TUNINHO_TOKEN)
    ↓
Mural backend (Sails.js)
```

## Diferencas em relacao ao MCP server

| Aspecto | MCP server (mural-mcp) | Skill tuninho-mural |
|---------|------------------------|---------------------|
| Onde roda | Subprocess stdio spawnado pelo Agent SDK V1 no Hostinger/local | Local (maquina do operador), invocado via Claude Code Skill tool |
| Operator injection | Automatica via session-manager (acted_on_behalf_of) | Nao injeta — atribuicao direta ao Tuninho bot |
| Tools expostas | 25 tools ao Claude Agent | 8 comandos CLI ao operador humano |
| Usado para | Claude dentro de sessoes do verso do card | Operacoes manuais do operador no terminal |
| Auth | MURAL_TUNINHO_TOKEN via env var no spawn | MURAL_TUNINHO_TOKEN via .env.mural.{env} |
| Cache | In-memory por sessao | In-memory por invocacao do comando |

## Troubleshooting

### "Missing env file"
Certifique-se de ter criado `.env.mural.dev` (ou `.stage`/`.prod`) em
`_a4tunados/env/mural/` com:
```
MURAL_API_URL=http://localhost:1337
MURAL_TUNINHO_TOKEN=...
```

### "Network error" / "fetch failed"
Verifique:
1. O dev server do mural esta rodando (`npm start` em `server/`)
2. A URL do MURAL_API_URL corresponde ao ambiente (localhost:1337 vs mural.a4tunados.com.br)
3. Firewall/rede permitem a conexao

### "Mural API .. failed: 401"
Token invalido. Regenere via `python3 -c "import secrets; print(secrets.token_hex(48))"`
e atualize tanto `server/.env` do mural quanto `.env.mural.{env}`.

### "Mural API .. failed: 404" em POST
Verifique que o usuario Tuninho existe no DB (rode a migration `20260413100000_seed_tuninho_user.js`)
e tem role admin. Alguns endpoints (como POST /api/projects/:id/boards) exigem
que o usuario seja project manager do projeto, nao apenas admin.
