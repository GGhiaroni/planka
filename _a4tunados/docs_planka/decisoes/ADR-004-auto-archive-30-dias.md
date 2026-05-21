---
title: "ADR-004: Auto-arquivar cards concluídos após 30 dias"
aliases:
  - "ADR-004"
  - "Auto-archive 30d"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/inferred
date: 2026-05-07
version: "1.0"
related:
  - "[[MOC-Projeto]]"
---

# ADR-004: Auto-arquivamento de cards Concluídos após 30 dias

## Status

**Inferida** — implementada por Gabriel Ghiaroni na PR [#7](https://github.com/GGhiaroni/planka/pull/7) (commit `ccdd42dc`, 2026-05-07). Entrada retroativa via escriba modo forense.

## Contexto

Boards `Demanda` e `Chamados Técnicos` acumulam cards em listas tipo `Concluído` / `Executados` indefinidamente. Sem limpeza automática:

- UI fica poluída — buscar card recente vira scroll infinito.
- Performance degrada em boards com milhares de cards finalizados.
- Operador precisa arquivar manualmente, gerando overhead recorrente.

Planka upstream tem campo `isClosed` (arquivamento) mas não tem timer automático.

## Decisão

Adicionar hook periódico (`server/api/hooks/auto-archive/index.js` ou equivalente) que, a intervalos configuráveis, varre cards com `state` de conclusão e `updatedAt` > 30 dias atrás e seta `isClosed=true`.

**Env vars de controle**:
- `AUTO_ARCHIVE_CLOSED_AFTER_DAYS` (default 30)
- `AUTO_ARCHIVE_CHECK_INTERVAL_MIN` (default 60 min)

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Cron externo (host) | Independente do app | Mais complexo de versionar, requer SSH setup |
| Trigger no Postgres | Atômico, no banco | Difícil de auditar, lock-in de schema |
| **Hook no Sails (escolhido)** | Próximo ao código, configurável via env, log nativo | Acoplado ao runtime — se app cai, não roda |

## Consequências

**Positivas:**
- Boards permanecem leves automaticamente.
- Configurável via env (sem rebuild para mudar threshold).
- Auditável via logs do container Planka.

**Negativas / riscos:**
- Card arquivado por engano (mal-classificado como Concluído) some da UI default — operador precisa unhide.
- Job rodando concorrente com edição manual: rare race, geralmente ok (Planka tem optimistic locking).

## Validação

Comportamento validado em staging — boards `Chamados Técnicos`/Executados não acumulam histórico antigo na UI default. Confirmação visual operador.

## Referências

- PR #7: https://github.com/GGhiaroni/planka/pull/7
- Commit: `ccdd42dc feat: arquiva automaticamente cards Concluídos após 30 dias`
- Env vars: `.env.example` (`AUTO_ARCHIVE_*`)
