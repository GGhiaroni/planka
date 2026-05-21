---
title: "Proposta ops-suite: modo escriba forense (operador estrangeiro) + scan init DDCE + hook guardian gitflow"
aliases:
  - "Operador estrangeiro proposal"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/draft
date: 2026-05-20
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/aprendizados]]"
---

# Proposta: ops-suite modo "operador estrangeiro"

> **Status: DRAFT — proposta operacional**, derivada do uso real no Card 928537. Sujeita a revisão do operador @victorgaudio antes de implementação no repo central `victorgaudio/a4tunados-ops-suite`.

## Motivação

Projetos a4tunados podem ter contributors **fora do ops-suite**: pessoas (ou bots) que commitam código sem passar por DDCE/fix-suporte/escriba/cards mural. Caso canônico: Gabriel Ghiaroni @ planka — 23 commits, 14 features (Apr 30 → May 19), nenhum ADR/sessao/changelog no vault.

**Consequência operacional**: a próxima sessão ops-suite no projeto parte de vault stale. Decisões implícitas do contributor externo não são acessíveis pelo Tuninho → DDCE Discovery falha silenciosamente em mapear pattern reuse → regressão/retrabalho.

**Quote operador (Card 928537, 2026-05-20)**:
> "ao detectar que h'á mudancas no projeto e na trilha gitflow sem estarem cobertos pelo ops-suite, precisa fazer essa varredura com abordagem diferenciada para se atualizar o escriba. e o ddce seja no modo que for, expresso, autonomo, card, etc... tb deve fazer essa varredurta ao iniciar qq operacao [...]. precisamos de um guardiao desse estado gitflow atualizado com metodos a4tunados tuninho ops-suite"

## Escopo proposto (3 partes)

### Parte 1 — `tuninho-escriba` modo `--forensic-foreign-operator` (NOVO)

**Trigger**: invocação explícita do operador OU detecção automática de drift (parte 2 do DDCE).

**Args sugeridos**:

```
Skill tool: tuninho-escriba, args:
  "--forensic-foreign-operator
   [--since YYYY-MM-DD]           # default: data da última operação ops-suite no projeto
   [--author <username>]          # default: todos exceto known ops-suite users (root, tuninho bot)
   [--branch <branch>]            # default: tronco canônico (deploy/staging | develop | main)
   [--apply]                      # default true — gera artefatos; --check-only só relata gaps
  "
```

**Comportamento**:

1. **Discovery cross-source**:
   - `git log --author=<X> --since=<Y> --format='%h|%ai|%s'` por contributor externo.
   - `git diff --stat <merge-base>..<branch>` para identificar magnitude.
   - Para cada commit/PR significativo: identificar arquivos novos/modificados + categoria (feat, fix, refactor, chore).
   - Cruzar com PRs do GitHub via `gh pr list --state merged --json number,title,headRefName,mergedAt,author`.

2. **Gap analysis**:
   - Comparar features detectadas com ADRs existentes em `_a4tunados/docs_<projeto>/decisoes/`.
   - Comparar mudanças em código com `implementacao/` docs.
   - Comparar com `changelog.md` do vault.
   - Reportar lista de gaps prioritizada.

3. **Generation** (se `--apply`):
   - 1 ADR por feature/PR significativo, com `status: inferred` + `decision: retroativa via escriba forense (operador estrangeiro)`.
   - 1 doc `implementacao/` por subsistema novo (heurística: novo top-level dir em `src/` ou `server/` ou similar).
   - Update MOC + changelog + report-executivo + versioning (minor bump).

4. **Output**:
   - Lista de artefatos gerados.
   - Lista de gaps que NÃO foram automatizáveis (precisam decisão humana).
   - Sugestão de pendências para o operador (ex: "rotate X", "patch upstream", etc).

**Acoplamento com regras existentes**:
- Honra Regra Inviolável #69 DDCE (transbordo > escassez).
- Honra SEAL-003 (bloqueante) — escriba forense satisfaz se gera 6/8 entregáveis (1=sessão, 2-4=ADRs, 5=implementação, 6=report, 7=MOC, 8=changelog). 3 dos 8 podem ser N/A em modo forense (sessão original não existe).
- Pode rodar `--check-only` em modo `audit-escriba-completeness` (sub-check QA).

### Parte 2 — `tuninho-ddce` Etapa 0.5 — Drift Detector + Force Sync (NOVO)

**Quando**: antes de qualquer operação DDCE (modos expansivo, autonomo, card-isolated, lite, etc).

**Comportamento**:

1. **Snapshot estado canônico**:
   ```bash
   TRUNK=$(gh api repos/{owner}/{repo} --jq '.default_branch')
   git fetch origin --prune
   ```

2. **Diff vault vs realidade**:
   - Listar commits em `origin/{TRUNK}` desde última sessão ops-suite (`last_session_at` em `MOC-Sessoes.md` ou frontmatter de `changelog.md`).
   - Excluir commits de autores known-ops-suite (root, tuninho, victorgaudio em modo ops-suite).
   - Resultado: lista de commits "foreign".

3. **Triagem**:
   - **0 commits foreign**: silent, prossegue para Etapa 1.
   - **1-3 commits foreign menores** (docs, typos, dependabot): silent inject como pendency-ledger entry, prossegue.
   - **>3 commits foreign OU PR mergeada não-mapeada OU arquivos novos em diretórios não documentados**: **BLOQUEIA** com alerta:
     ```
     ⚠️ Drift detectado: N commits foreign em <branch> desde <data>.
        - <commit1> | <author> | <subject>
        - ...
     Antes de iniciar a operação, invocar escriba forense?
     (s/n) — recomendado s
     ```

4. **Se `s`**: invoca escriba `--forensic-foreign-operator` automaticamente.
5. **Após escriba**: sync local com tronco canônico (`git checkout <TRUNK> && git pull --ff-only`), commit do vault atualizado, PR de sync (se develop não bate com vault) ou direct push se autorizado.
6. Só **após esse ciclo de sync** começa a operação real.

**Modos especiais**:
- `--skip-drift-detection`: opt-out explícito (operador sabe que está em sync). Registra `OBL-DRIFT-SKIP-OVERRIDE` no contrato.
- `--drift-only-warn`: alerta mas não bloqueia (compatível com modo pragmático autônomo).

### Parte 3 — Hook UserPromptSubmit `tuninho-hook-gitflow-guardian` (OPCIONAL — reforço)

**Comportamento**: em todo UserPromptSubmit, se o cwd é um projeto a4tunados com vault, executa em background:

```bash
TRUNK=$(gh api repos/{owner}/{repo} --jq '.default_branch' 2>/dev/null)
LAST_VAULT_SYNC=$(grep -m1 'date:' _a4tunados/docs_*/MOC-Projeto.md | sed 's/date: //')
FOREIGN_COMMITS=$(git log "origin/$TRUNK" --since="$LAST_VAULT_SYNC" \
  --invert-grep --author="root\|tuninho\|<known-ops-users>" --oneline | wc -l)

if [ "$FOREIGN_COMMITS" -gt 5 ]; then
  echo "⚠️ Drift gitflow detectado: $FOREIGN_COMMITS commits foreign em origin/$TRUNK desde $LAST_VAULT_SYNC."
  echo "Recomendado: invocar Skill tool: tuninho-escriba, args: --forensic-foreign-operator"
fi
```

WARN-only — não bloqueia o prompt. Apenas injeta `additionalContext` no prompt do operador.

## Sequência de implementação proposta

| Step | Skill afetada | Bump | Esforço estimado |
|---|---|---|---|
| 1 | `tuninho-escriba` | v5.1.0 → v5.2.0 (minor — novo modo) | médio (~2h) |
| 2 | `tuninho-ddce` | v4.20.0 → v4.21.0 (minor — nova Etapa 0.5) | médio (~2h) |
| 3 | `tuninho-hook-gitflow-guardian` | v0.1.0 (novo hook) | baixo (~1h) |
| 4 | `tuninho-qa` | adicionar `audit-foreign-operator-drift` sub-check | baixo (~1h) |
| 5 | Manifest ops-suite | v5.52.0 → v5.53.0 | trivial |

**Total**: ~6h. Dogfooded primeiro neste projeto planka (Card 928537 já fez a versão "ad-hoc"), depois propagado via `tuninho-updater`.

## Anti-padrões a evitar

- ❌ **Falso positivo em projetos só com Maksim Eltyshev (upstream Planka)**: o upstream gera centenas de commits em qualquer fork. Trigger deve ser por **branch deployada** (deploy/staging tip) não por todos os commits acessíveis.
- ❌ **Bloqueio em operações leves** (typo, doc-only): drift detection deve ter threshold (>3 commits foreign OU PR mergeada com >50 LOC).
- ❌ **Loop infinito**: escriba forense termina, DDCE roda, gera commits ops-suite — o próprio commit ops-suite NÃO é foreign. Marca via author identity (`tuninho bot` ou similar) + footer commit (`Co-Authored-By: Tuninho <chame@4tuna.com.br>`).
- ❌ **Sobrescrita acidental de docs existentes**: escriba forense sempre cria novos ADRs (numeração sequencial) — nunca edita ADRs existentes sem confirmação.

## Lições do dogfood (Card 928537)

Já registradas em [[cards/1778610132976928537_atualizacao-env-hostinger/aprendizados]]:
- L1: `nohup` no servidor > re-rodar CI em build longo.
- L2: Vault stale com contributor externo → scan forense obrigatório.
- L3: VPS sem git é canon válido (rsync from CI ≠ git pull).
- L4: `.env` gitignored em prod → patch idempotente.
- L5: Stale branch sem código mudado = zero risco.
- L6: PR docs em branch nova ≠ trabalho na branch stale.
- L7: Secret no body mural = pendência de rotação canônica.

## Próximos passos para o operador

1. Revisar esta proposta.
2. Autorizar (ou pedir ajustes) na implementação no repo central `victorgaudio/a4tunados-ops-suite`.
3. Definir threshold de "foreign commits" (sugestão: >3 ou >50 LOC) — parametrizável via env `OPS_SUITE_DRIFT_THRESHOLD`.
4. Definir lista de authors known-ops-suite (sugestão: usuários git que rodam tuninho bot OU operador em modo ops-suite — heurística pela presença de `Co-Authored-By: Tuninho` no commit).
5. Implementar (eu posso fazer via PR no repo central, em sessão ops-suite separada).
