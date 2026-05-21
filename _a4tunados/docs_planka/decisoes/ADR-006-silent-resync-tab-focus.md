---
title: "ADR-006: Silent re-sync ao voltar pra aba (cobre eventos socket perdidos)"
aliases:
  - "ADR-006"
  - "Silent re-sync"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/inferred
date: 2026-05-07
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[ADR-002-workaround-socket-io-v4]]"
  - "[[ADR-005-realtime-finalized-sync]]"
---

# ADR-006: Silent re-sync na re-focagem de aba

## Status

**Inferida** — implementada por Gabriel Ghiaroni na PR [#10](https://github.com/GGhiaroni/planka/pull/10) (commit `e76d881e`, 2026-05-07).

## Contexto

Planka usa socket.io para push de updates em tempo real. Quando o usuário muda de aba (Visibility API → hidden), o browser **suspende a conexão WebSocket** em alguns cenários:
- Background tab em Chrome com poucos recursos.
- Switch de rede (WiFi → móvel).
- Sleep/wake do laptop.

Isso causa **lost events**: card foi movido por outro operador, mas o cliente em foreground/recovered não recebeu o `cardUpdate`. UI fica estale silenciosamente.

Conjugado com o workaround [[ADR-002-workaround-socket-io-v4|sails.io.js + socket.io v4 incompat]], o problema piora — `socket.request` retornava `undefined` em upgrade WS, e a reconexão silenciosa não dispara um refetch.

## Decisão

Adicionar listener Visibility API em `client/src/components/Core.jsx`:

```javascript
useEffect(() => {
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      // Silent re-fetch core state — board, lists, cards, labels, etc.
      dispatch(fetchCore());
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}, [dispatch]);
```

**Silent** = sem loading spinner / toast — usuário não percebe. Estado é meramente reconciliado.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Polling fixo (a cada 30s) | Simples | Tráfego desnecessário em uso normal |
| Heartbeat ping no socket | Detecta queda rápido | Não cobre case de tab background |
| **Refetch on visibility (escolhido)** | Custo zero quando aba ativa, refetch só quando necessário | Não cobre case de aba ativa com socket morto silenciosamente |
| Refetch on focus (window.onfocus) | Mais granular | Não captura switch entre tabs do mesmo browser |

## Consequências

**Positivas:**
- Estado sempre fresco quando usuário retoma o trabalho.
- Custo de rede baixo — só dispara quando re-focando.
- Não acopla com socket — funciona mesmo se WS morto.

**Negativas / riscos:**
- Se aba fica ativa mas socket morre silenciosamente, ainda fica estale. Mitigação futura: heartbeat + force-refetch após N ms sem evento.
- `fetchCore` é uma chamada pesada (todos os cards do board). Em boards gigantes pode causar visible jank — mitigado pela política de [[ADR-004-auto-archive-30-dias|auto-archive 30 dias]].

## Referências

- PR #10: https://github.com/GGhiaroni/planka/pull/10
- Commit: `e76d881e feat: sync silencioso ao voltar pra aba (cobre eventos socket perdidos)`
- File: `client/src/components/Core.jsx`
