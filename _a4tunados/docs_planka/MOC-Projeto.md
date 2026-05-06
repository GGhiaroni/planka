# MOC — planka (fork GGhiaroni)

> Map of Content do projeto **planka** — fork customizado do Planka kanban.
> Vault inicial criado em 2026-05-06 ao final da Op 01.

## Identidade

- **Repo**: github.com/GGhiaroni/planka
- **Base upstream**: github.com/plankanban/planka v2.1.0 (em v2.1.1 no upstream)
- **Stack**: Sails.js + React 18 + PostgreSQL 16 + Docker Compose
- **Staging**: https://pdviewerp-stagging.fourtuna.com.br/ (hostinger-beta)
- **Form tickets**: https://form-pdviewerp-stagging.fourtuna.com.br/

## Operações executadas

- [Op 01: deploy-planka-hostinger-redeploy](sessoes/2026-05-06_op01-deploy-staging.md) — 2026-05-06

## ADRs

- [ADR-001: Deploy staging via Docker Compose + nginx host + CI/CD GitHub Actions](decisoes/ADR-001-deploy-staging-cicd.md)
- [ADR-002: Workaround sails.io.js + socket.io-client v4 incompat](decisoes/ADR-002-workaround-socket-io-v4.md)

## Implementação

- [Fluxo deploy staging via branch deploy/staging](implementacao/staging-deploy-flow.md)

## Funcionalidades (do dev)

5 features novas commitadas em develop (May 4-6) deployadas no staging:
- Coluna colapsada (collapse/expand)
- Drag-and-drop intra-coluna (reorder cards)
- 3 opções altura linha planilha
- Seed coluna 'Falar com o cliente' em boards Design
- Log/histórico do board

## Skills tuninho relevantes

- `tuninho-devops-hostinger` — sidecar `projects/hostinger-beta/planka/` (deploy info)
- `tuninho-devops-env` — sidecar `projects/planka/` (env config)
