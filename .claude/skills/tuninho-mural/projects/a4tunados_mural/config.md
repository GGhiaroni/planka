# Sidecar — tuninho-mural para a4tunados_mural

## Projeto

- **Nome**: a4tunados_mural
- **Backend**: Sails.js + PostgreSQL 17
- **Frontend**: React 18 + Vite
- **Ambientes**: dev (localhost:1337) / stage (stage.mural.a4tunados.com.br) / prod (mural.a4tunados.com.br)

## Credenciais

| Env | Path | Conteudo |
|-----|------|----------|
| dev | `_a4tunados/env/mural/.env.mural.dev` | MURAL_API_URL=http://localhost:1337 + MURAL_TUNINHO_TOKEN=... |
| stage | `_a4tunados/env/mural/.env.mural.stage` | stage.mural.a4tunados.com.br (nao setar sem operador confirmar) |
| prod | `_a4tunados/env/mural/.env.mural.prod` | mural.a4tunados.com.br (nao setar sem operador confirmar) |

**Regra**: o token para cada ambiente e o mesmo `INTERNAL_ACCESS_TOKEN` que
esta no `server/.env` do mural naquele ambiente. Ambiente dev: vem do `.env`
local do operador. Ambientes stage/prod: vem do `.env` do servidor (Digital
Ocean) — nao armazenados localmente por default.

## Cards / Operacoes

- Pasta de cards: `_a4tunados/_operacoes/cards/`
- Pasta de prompts DDCE: `_a4tunados/_operacoes/prompts/`
- Operacoes: `_a4tunados/_operacoes/projetos/`
- Vault escriba: `_a4tunados/docs_a4tunados_mural/`

## Integracao com DDCE

Ao final de uma operacao DDCE (`Etapa 15 DDCE`), pode-se invocar:

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js export-result \
  --card {cardId} \
  --results _a4tunados/_operacoes/prompts/{NN}_3_RESULTS_{nome}.md \
  --env dev
```

Para exportar o comentario do `_3_RESULTS_` diretamente no card correspondente.

## Historico

- 2026-04-13: v0.1.0 inicial (Op 23 Fase 5)
