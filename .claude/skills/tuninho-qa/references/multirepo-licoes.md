# Multi-repo — Licoes Aprendidas (Op 18 Fase 6)

> Referencia de aprendizados para sub-check `audit-multirepo-coherence`
> e operacoes DDCE multi-repo futuras. Atualizar conforme novos casos.

## Cenarios canonicos

### Cenario A — Op single-repo (default)
- HANDOFF sem `repos_state` ou `repos_state` vazio
- audit-multirepo retorna [SKIP] exit 0
- Backwards compat 100%

### Cenario B — Op multi-repo coerente
- HANDOFF tem `repos_state: {repo_a: {...}, repo_b: {...}}`
- Cada repo com `lag_commits` real <= 10
- `comlurb_sealed_repos` lista exatamente os repos com `sealed: true`
- audit-multirepo retorna [PASS] exit 0

### Cenario C — Lag elevado (WARN)
- Algum repo com `lag_commits > 10`
- Indica que branch da operacao esta defasada vs develop
- Operador deve avaliar merge/rebase antes de prosseguir
- audit-multirepo retorna [WARN] exit 2

### Cenario D — Inconsistencia sealed (FAIL bloqueante)
- repos_state[repo].sealed = true MAS repo nao em comlurb_sealed_repos[]
- OR: repo em comlurb_sealed_repos[] MAS repos_state[repo].sealed = false
- Indica bug no Comlurb v0.10.0+ ou drift manual
- audit-multirepo retorna [FAIL] exit 1

## Thresholds canonicos (ajustar conforme uso real)

| Threshold | Valor inicial | Justificativa |
|-----------|---------------|---------------|
| WARN lag | 10 commits | Operacoes longas naturalmente acumulam — abaixo de 10 considera-se ok |
| FAIL inconsistencia | 1 caso | Inconsistencia sealed = bug; tolerancia zero |
| SKIP single-repo | repos_state vazio ou ausente | Backwards compat |

## Anti-padroes detectados na pratica

(Vazio na criacao Op 18 Fase 6 — populacao via uso real em Ops futuras)

## Sub-checks relacionados

- `audit-handoff-consistency-ddce26` (Modo 12): valida 8 categorias do HANDOFF — multi-repo state e parte da Categoria 6 (arquivos modificados).
- `audit-gitflow-state` (v0.16.0): single-repo. Cooperacao: multi-repo extende com tabela por repo.
- `audit-vault-coverage` (v0.17.0): single-vault tipicamente. Multi-vault e operacao rara — anotar caso quando ocorrer.

## Roadmap de evolucao

- v0.17.2: helper `audit-multirepo --json` para integracao programatica
- v0.18.0: integracao com `tuninho-portas-em-automatico` Resp 11 multi-repo (cooperacao bidirecional — portas reporta lag, qa cruza com handoff)
- Futuro: caso real multi-repo dogfood Op 18 Fase 9 vai gerar primeiros aprendizados praticos pra esta lista

## Referencia comando

```bash
# Smoke single-repo (esperado SKIP)
bash .claude/skills/tuninho-qa/scripts/audit-multirepo.sh 17

# Multi-repo dogfood Op 18 (esperado PASS apos Fase 8 Comlurb v0.10.0)
bash .claude/skills/tuninho-qa/scripts/audit-multirepo.sh 18

# Inspecao do HANDOFF para diagnostico
ls -t _a4tunados/_operacoes/projetos/{NN}_*/handoffs/HANDOFF_*.yaml | head -1
```

## Origem operacional

Op 18 Fase 6 (a4tunados_web_claude_code, 2026-05-02). Implementacao da Decisao D8 do Discovery.
