---
title: "Changelog do vault docs_planka"
tags:
  - a4tunados
  - tuninho/escriba
  - type/changelog
  - status/active
date: 2026-05-06
version: "1.1.0"
---

# Changelog — vault docs_planka

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
