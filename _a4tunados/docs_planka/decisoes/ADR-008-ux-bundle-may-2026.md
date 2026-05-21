---
title: "ADR-008: Bundle UX/UI Custom Planka (May 2026)"
aliases:
  - "ADR-008"
  - "UX Bundle May 2026"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/inferred
date: 2026-05-04
version: "1.0"
related:
  - "[[MOC-Projeto]]"
---

# ADR-008: Bundle de Customizações UX (2026-05-04)

## Status

**Inferida** — bundle de 8 commits do Gabriel Ghiaroni em 2026-05-04 (entre `97d41528` e `9fae494b`), todos pre-CI/CD (antes da PR #5 que estabeleceu o fluxo deploy/staging).

## Contexto

Planka upstream (v2.1.0) tem UX padrão de Trello-clone. Para o caso de uso interno do PDView ERP (boards `Demanda` + `Chamados Técnicos`), faltavam 8 capacidades práticas detectadas em uso real:

1. Coluna com tipo "label" (não Kanban tradicional)
2. Cores de label mais distinguíveis em telas longas
3. Deleção rápida de label (hover X)
4. Bug com drag de card multi-label
5. Coluna colapsada (poupar espaço horizontal)
6. UX de drag-and-drop em coluna colapsada (drop ainda funciona)
7. Drag-and-drop intra-coluna (reorder dentro da mesma lista)
8. TableView com 3 modos de altura de linha (compact / medium / spacious)
9. Histórico/log do board (card activity timeline)
10. Seed de coluna `Falar com o cliente` no board Design (default)

## Decisão

Implementar todos como mudanças do client + ajustes server pontuais. Sem ADR individual por feature porque o bundle foi **iterativo durante um dia de trabalho focado em UX**, refletindo aprendizado em uso real. Versão "v1 da aplicação" (commit `81f0ef93`) marca o início desse bundle.

**Files principais touched:**
- `client/src/components/LabelChip.jsx` + `.scss`
- `client/src/components/List/List.jsx` (+ collapse logic)
- `client/src/components/Card/Item.jsx` (activity log)
- `client/src/components/TableView/TableView.jsx` + `.scss` (row height, label colors)
- `client/src/utils/collapsed-lists.js` (estado de colapso, localStorage)
- `client/src/selectors/cards.js` (intra-list reorder)
- `client/src/locales/` (strings PT-BR)
- `server/db/seeds/01_default_design_columns.js` (seed)

## Alternativas consideradas

- **Fork pesado do upstream**: rejeitado — operador prefere manter merge upstream futuro viável.
- **Patches separados em features distintas**: foi feito como commits separados, mas integrados em uma única "v1" lógica.
- **Tudo via extensão/plugin Planka**: Planka v2.1.0 não tem sistema de plugins maduro.

## Consequências

**Positivas:**
- Board pronto pra uso interno PDView ERP em ~1 dia de UX work.
- Customizações isoladas em components (rebase upstream possível com merge conflict pontual).

**Negativas / riscos:**
- Sem ADR/teste individual por feature → regressão em uma feature pode passar despercebida.
- Upgrade Planka v2.1.0 → v2.1.1+ vai exigir reaplicar manualmente (não está em formato de patch).
- `client/src/locales/pt-BR/` divergiu do upstream — futuras traduções upstream não merges automaticamente.

## Mitigação proposta (PENDÊNCIA)

Gerar diff agregado `feature-bundle-may-2026.patch` aplicável em upgrade futuro do upstream.

## Referências

Commits ordenados:
- `81f0ef93` v1 da aplicação
- `97d41528` coluna tipo personalizado + label
- `c477b95d` cores melhores para rótulos
- `faa1687e` X no label no hover
- `41f6d7ac` fix card multi-label drag
- `0eb2a53e` coluna colapsada
- `09751bf4` UX DnD coluna colapsada
- `dc9f6cc4` DnD intra-coluna
- `de1eb9d7` 3 opções altura linha planilha
- `25a49d8a` seed coluna Falar com o cliente
- `9fae494b` log/histórico do board
