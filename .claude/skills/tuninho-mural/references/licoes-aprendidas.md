# Licoes Aprendidas — tuninho-mural

## #1 — Reusar mural-api-client em vez de reimplementar HTTP
- **Contexto**: A Op 23 criou duas camadas de comunicacao com o mural (MCP server + skill CLI). Ambas precisam fazer as mesmas chamadas HTTP.
- **Solucao**: Extrair a logica HTTP + auth + cache em uma lib compartilhada (`services/mural-api-client`) e importa-la de ambos os wrappers. Zero duplicacao.

## #2 — Credenciais em `_a4tunados/env/mural/` (padrao hostinger-alfa)
- **Contexto**: Cada skill de integracao com sistema externo precisa de credenciais. Colocar dentro da skill (`./config.json`) quebra o padrao do ops-suite.
- **Solucao**: Seguir o padrao estabelecido por `tuninho-devops-hostinger-alfa` — credenciais em `_a4tunados/env/{servico}/`, gitignored, chmod 600.

## #3 — 3 arquivos de env (dev/stage/prod) com flag `--env`
- **Contexto**: Operador tem dev local + staging DO + prod DO do mural. Hardcoded URL nao funciona.
- **Solucao**: 3 arquivos `.env.mural.{env}` + flag `--env dev|stage|prod` nos comandos. Default: dev.

## #4 — Parser de args puro JS em vez de dependencia minimist
- **Contexto**: Evitar adicionar dependencias npm para a CLI. Skills devem ser zero-dep quando possivel.
- **Solucao**: Parser minimo inline (~20 linhas) que cobre `--key value` e `--flag`. Suficiente para 8 comandos simples.

## #5 — Import dinamico do mural-api-client via path absoluto
- **Contexto**: A skill vive em `.claude/skills/tuninho-mural/cli/` e a lib em `services/mural-api-client/`. Sem npm link, import precisa de path absoluto.
- **Solucao**: Resolver repo root via `resolve(__dirname, '..', '..', '..', '..')` e import dinamico da lib. Funciona sem build step.
