# Template — Comentario Cross-Repo PR Linking (Op 18 Card 2 — D7)

> Workaround documentado para o gap de custom field nativo no Planka. Permite
> rastrear PRs de N repos numa unica operacao DDCE via comentario tabular
> markdown postado no card mural correspondente.

## Quando usar

Em qualquer operacao DDCE que envolva mudancas em 2+ repos simultaneamente
(ex: Op 18 muda `a4tunados_web_claude_code` + `a4tunados-ops-suite` paralelos).
Postar **um** comentario por card mural relevante usando este template.
Atualizar o **mesmo** comentario quando PR muda status (open -> merged).

## Cadencia

- **Comentario inicial**: ao final da Etapa 1 (DDCE) — branches paralelas criadas
- **Atualizacao apos GATE FASE**: PR de cada fase aberto/mergeado
- **Atualizacao final apos Etapa 16**: todos PRs em estado final

## Template canonico

```markdown
## PRs cross-repo — Op {NN}

| Repo | PR | Status | Branch | Linhas |
|------|----|----|--------|--------|
| {repo_a} | #{N} | open\|merged\|closed | {branch_a} | +{N1} -{N2} |
| {repo_b} | #{M} | open\|merged\|closed | {branch_b} | +{M1} -{M2} |

**Atualizado em**: {ISO-8601}
**Operador**: {github_username}
**Modelo**: {claude_model}

---

### Notas

- {observacao 1, ex: "Bumps de skill mergeados em ops-suite #110"}
- {observacao 2, ex: "Branch principal continua aberta — fechamento na Fase 9"}
```

## Exemplo real (Op 18 — preview)

```markdown
## PRs cross-repo — Op 18

| Repo | PR | Status | Branch | Linhas |
|------|----|----|--------|--------|
| a4tunados_web_claude_code | #N (a abrir) | pendente | feat/op18-tester-user-multirepo-ddce | +1270 -0 |
| a4tunados-ops-suite | #110 | merged | fix/op18-bumps-multirepo | +600 -50 |

**Atualizado em**: 2026-05-02T19:18:00Z
**Operador**: victorgaudio
**Modelo**: claude-opus-4-7[1m]

---

### Notas

- Bumps urgentes mergeados em ops-suite #110 durante sessao 01 (DDCE v4.11.0 + QA v0.17.0 — Regra Inviolavel #56 vault leitura BLOQUEANTE)
- Bumps complementares (mural v0.9.0, ddce v4.12.0, git-flow v0.2.1, portas v0.5.1, qa v0.17.x, comlurb v0.10.0) entrarao em PRs subsequentes via tuninho-updater push
- Branch principal `feat/op18-...` mergeada em develop ao fim da Fase 9 (gitflow d'a4)
```

## Atualizacao via tuninho-mural

Postar comentario inicial:

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js comment \
  --card 1766153417106916845 \
  --text "$(cat _a4tunados/_operacoes/projetos/18_*/cross-repo-comment.md)" \
  --env dev
```

**Atualizar** comentario existente nao e suportado pela API Planka simples
(POST so cria; PATCH edit so funciona via UI). Padrao adotado: postar **novo**
comentario com header `## PRs cross-repo — Op {NN} (atualizado {ISO})` quando
status muda. Comentarios anteriores ficam como historico.

## Anti-padroes

- ❌ Tentar usar custom field nativo no Planka (Op 18 D7 explicitamente decidiu workaround)
- ❌ Postar comentario por repo (gera N comentarios para uma operacao — confuso)
- ❌ Editar comentario antigo (API nao suporta facilmente — usar novo comentario com header datado)
- ❌ Esquecer de atualizar quando PR mergeia (deixa rastreabilidade invalida)

## Sub-check QA futuro (proposta)

`audit-cross-repo-pr-linking` em tuninho-qa: cruza branches multi-repo da
operacao com presenca de comentario "## PRs cross-repo" no card mural. Se
operacao tem >1 repo no `repos_state` e card mural nao tem comentario com
esse header: WARN (Regra DDCE #41/#43 — comunicacao centralizada no card).

## Origem operacional

Op 18 Fase 3 (a4tunados_web_claude_code, 2026-05-02). Decisao D7 do operador
preserva ergonomia atual sem exigir mudanca em outro produto (Planka).
