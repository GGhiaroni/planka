---
title: "ADR-005: Sync real-time + fallback manual do campo Chamado finalizado em"
aliases:
  - "ADR-005"
  - "syncFinalizedAt"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/inferred
date: 2026-05-07
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[ADR-006-silent-resync-tab-focus]]"
---

# ADR-005: Sync real-time + fallback do campo `Chamado finalizado em`

## Status

**Inferida** — implementada por Gabriel Ghiaroni na PR [#9](https://github.com/GGhiaroni/planka/pull/9) (commits `d9874bdf`, `00f78774`, `13d85b99`, 2026-05-07).

## Contexto

Cards no board `Chamados Técnicos` precisam registrar **automaticamente** o timestamp em que foram movidos para `Executados` (ou equivalente "concluído"). Este campo custom (`Chamado finalizado em`) alimenta SLA reports e o painel de prazos.

Implementação naïve — setar o campo no client após drag-and-drop — tem 2 falhas:

1. **Drop multi-cliente**: se 2 operadores movem cards simultaneamente, último ganha (race condition no client).
2. **Reconexão de socket**: se cliente perde socket e move card durante reconnect, evento se perde.

## Decisão

**Dual write — socket emit + server-side hook idempotente:**

1. **Server-side** (`server/api/helpers/cards/sync-finalized-at.js`, chamado de create-one + update-one):
   - Quando card entra em lista que match regex `Conclu|Executad|Done` (ou flag explícita no list), seta `customField('Chamado finalizado em', now())`.
   - Idempotente — se o campo já tem valor, não sobrescreve (preserva histórico real do operador).
   - Se o card SAI de lista de conclusão e volta, limpa o campo (deliverable: contagem real desde a entrada definitiva).

2. **Socket emit**: o evento `cardUpdate` normal do Sails carrega o novo valor do campo, propagando para todos os clientes conectados (em tempo real).

3. **Dockerfile COPY** (commit `13d85b99`): garante que `sync-finalized-at.js` está incluído na build da imagem (problema prévio onde o arquivo existia em dev mas não no container prod).

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Só client | Simples | Race conditions, perda em reconnect |
| Trigger DB | Atômico | Difícil de testar, lock-in |
| Cron periódico varrendo cards "stale" | Robusto contra perda | Latência alta (não é real-time) |
| **Helper server-side em create/update (escolhido)** | Real-time, idempotente, auditável | Acopla lógica de negócio ao helper |

## Consequências

**Positivas:**
- Campo sempre populado quando esperado.
- Real-time para todos os clientes via socket.
- Idempotente — re-execução não corrompe histórico.

**Negativas / riscos:**
- Regex de detecção de lista "concluída" hardcoded. Listas com nome custom (ex: `Resolvido pelo cliente`) podem não match.
- Mitigação: parametrizar via `CHAMADOS_DONE_LIST_REGEX` em env (PENDÊNCIA).

## Referências

- PR #9: https://github.com/GGhiaroni/planka/pull/9
- Commits: `d9874bdf`, `00f78774`, `13d85b99`
- File: `server/api/helpers/cards/sync-finalized-at.js`
- Co-relacionado: [[ADR-006-silent-resync-tab-focus]] (resiliência client-side complementar)
