---
title: "Changelog do vault docs_planka"
tags:
  - a4tunados
  - tuninho/escriba
  - type/changelog
  - status/active
date: 2026-05-19
version: "1.2.0"
---

# Changelog — vault docs_planka

## [1.2.0] — 2026-05-19 (Card 928537 + cobertura forense Ghiaroni)

> **Bump MINOR — primeira aplicação do escriba modo forense (operador estrangeiro)**: cobertura retroativa das 14 features do Gabriel Ghiaroni (23 commits, 2026-04-30 → 2026-05-19) que estavam sem documentação no vault. ADRs marcados `status: inferred` quando inferidos a partir de código + git log + PRs no GitHub.

### Adicionado — Card 928537 (operacional, sub-árvore)

- `cards/1778610132976928537_atualizacao-env-hostinger/sessoes/2026-05-19_01_card-928537-deploy-supabase.md` — sessão completa (~13min técnico, 4 prompts operador)
- `cards/.../prompts/2026-05-19_01_prompts.md` — transcript verbatim dos 4 prompts
- `cards/.../decisoes.md` — 6 decisões locais (D1-D6)
- `cards/.../aprendizados.md` — 7 lições potencialmente migráveis (L1-L7)
- `cards/.../report-executivo.md` — consolidação executiva

### Adicionado — ADRs retroativos (operador estrangeiro)

- `decisoes/ADR-003-supabase-mirroring.md` — Espelhamento Planka → Supabase (PR #14, 2026-05-19)
- `decisoes/ADR-004-auto-archive-30-dias.md` — Auto-arquivamento de cards Concluídos (PR #7, 2026-05-07)
- `decisoes/ADR-005-realtime-finalized-sync.md` — Sync real-time `Chamado finalizado em` (PR #9, 2026-05-07)
- `decisoes/ADR-006-silent-resync-tab-focus.md` — Silent re-sync on Visibility API (PR #10, 2026-05-07)
- `decisoes/ADR-007-label-color-parity-table-kanban.md` — Paridade de cor TableView vs Kanban (PR #11, 2026-05-07)
- `decisoes/ADR-008-ux-bundle-may-2026.md` — Bundle UX/UI (10 features, May 4-7)

### Adicionado — Implementação

- `implementacao/supabase-mirroring.md` — Arquitetura completa do mirror (3 tabelas + lifecycle + falhas conhecidas + como testar)
- `implementacao/ticket-form-system.md` — Serviço Node de formulários (8 routes + 3 forms + integração Supabase + Planka API)

### Modificado

- `MOC-Projeto.md` — reorganizado: seção "Notas sobre operador estrangeiro" + ADRs categorizados (tracked vs retroativos) + catálogo de 14 features com PR + ADR + data + pendências consolidadas
- `report-executivo.md` — adicionada timeline Card 928537 + catálogo Ghiaroni
- `versioning.md` — bump 1.1.0 → 1.2.0

## [1.1.0] — 2026-05-06 (Card 377530)

### Adicionado

- `cards/1769151526032377530_validar-fluxo-de-deploy-automa/` — sub-arvore card-isolated
- `cards/.../sessoes/2026-05-06_01_card-377530-validar-deploy.md` — sessao completa
- `cards/.../prompts/2026-05-06_01_prompts.md` — transcript dos 7 prompts do operador
- `cards/.../decisoes.md` — 6 ADRs locais (D1 a D6)
- `cards/.../aprendizados.md` — 6 licoes (L1 a L6) potencialmente migraveis pra ops-suite
- `cards/.../report-executivo.md` — consolidacao executiva do card

### Modificado

- `MOC-Projeto.md` — adicionada secao "Cards card-isolated" com link pro Card 377530
- `MOC-Projeto.md` — link complementar pro mapeamento dos forms na implementacao

## [1.0.0] — 2026-05-06 (Op 01)

### Adicionado

- Vault inicial criado ao final da Op 01 (`feat/deploy-planka-hostinger-redeploy`)
- `MOC-Projeto.md` — indice principal
- `sessoes/2026-05-06_op01-deploy-staging.md` — sessao Op 01
- `decisoes/ADR-001-deploy-staging-cicd.md` — ADR fluxo CI/CD
- `decisoes/ADR-002-workaround-socket-io-v4.md` — ADR workaround Sails+socket.io
- `implementacao/staging-deploy-flow.md` — fluxo deploy staging via branch
