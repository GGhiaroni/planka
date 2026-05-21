---
title: "ADR-007: Paridade de cor labels table view vs chips kanban"
aliases:
  - "ADR-007"
  - "Label color parity"
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

# ADR-007: Cor de linha da TableView idêntica ao chip do Kanban

## Status

**Inferida** — implementada por Gabriel Ghiaroni na PR [#11](https://github.com/GGhiaroni/planka/pull/11) (commit `c1c18671`, 2026-05-07).

## Contexto

Planka tem duas visualizações principais do board: **Kanban** (cards-as-tiles) e **TableView** (cards-as-rows). Cada label tem cor associada exibida como chip no Kanban. Na TableView pré-fix, as linhas pintavam cor de label usando uma paleta interna diferente (CSS variables distintas), criando **inconsistência visual** entre as 2 views — operador veia o label como "amarelo" no kanban e "laranja" na tabela.

## Decisão

Unificar a paleta — TableView lê os mesmos valores CSS do chip kanban (`--label-color-*` ou similar). Implementação puramente em `client/src/components/.../TableView.scss` (ou correspondente).

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Mudar paleta da TableView pra match | Fix simples, sem refactor | Risco de inconsistência futura |
| **CSS variables compartilhadas (escolhido)** | Single source of truth, manutenção futura simples | Refactor pequeno em SCSS |
| Pintar inline (inline style) | Garantia absoluta de paridade | Performance ruim, violates separation |

## Consequências

**Positivas:**
- Coerência visual entre views.
- Futuras mudanças de paleta refletem em ambas automaticamente.

**Negativas:**
- Nenhuma significativa.

## Referências

- PR #11: https://github.com/GGhiaroni/planka/pull/11
- Commit: `c1c18671 fix: cores da linha da Planilha iguais às chips de label do Kanban`
