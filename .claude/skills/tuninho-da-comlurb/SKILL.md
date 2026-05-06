# Tuninho da Comlurb v5.0.7

## v5.0.7 — Pre-check `audit-escriba-completeness` BLOQUEANTE no Modo 6/Modo 4 (Card 1768688081252124096 — 6a iteracao 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (6a iteracao Card 124096)**:

Regra Inviolavel SEAL-003 (v0.4.0+) ja declarava escriba como gate bloqueante,
mas nao tinha implementacao estrita do `audit-escriba-coverage`. Operador
detectou no proprio encerramento do Card 124096 que escriba foi parcial (so
1 ADR de ~8 entregaveis) E o seal foi aplicado mesmo assim.

Operador autorizou bump petreo para corrigir definitivamente:
> "O escriba e extremamente fundamental. Precisamos incluir ele no QA de
> entrega final assim como fizemos com o commit sync merge do develop.
> Precisa SEMPRE em qualquer operacao, ser rodado ao final de forma
> completa."

### Mudanca v5.0.7 — sequencia canonica encerramento estendida 10 → 11 passos

```
1. tuninho-qa audit-gate-final PASS
2. audit-pr-merged-and-develop-synced PASS              (v5.2.0)
3. audit-archive-tag-created PASS                       (v5.3.0)
4. audit-pr-merge-strategy-coherence PASS/WARN          (v5.3.0)
5. audit-storytelling-preserved PASS                    (v5.3.0)
6. audit-tag-archive-is-ancestor PASS                   (v5.4.0)
7. audit-escriba-completeness PASS                      (v5.5.0 ← novo gate petreo)
8. Comlurb seal Modo 6 / Modo 4
9. tuninho-escriba complete-coverage final              (auto-invoca se gap detectado em #7)
10. tuninho-git-flow-dafor sync local final
11. tuninho-mural card-validated → Done + comment fechamento
```

### Pre-check estendido antes de seal Modo 6/Modo 4

Apos `human_validated_at` preenchido, EXIGIR PASS de:
1. `audit-pr-merged-and-develop-synced` (v5.0.4)
2. `audit-archive-tag-created` (v5.0.5)
3. `audit-storytelling-preserved` (v5.0.5)
4. `audit-tag-archive-is-ancestor` (v5.0.6)
5. **`audit-escriba-completeness`** (v5.0.7 NOVO)

Se #5 FAIL: bloqueia seal, painel atualizado:

```
SEAL BLOQUEADO — escriba incompleto

Operador ja aprovou (human_validated_at: {ts}), mas vault nao esta completo:

Coverage: 6/8 (75%) — gaps detectados:
  ✗ implementacao/{componente}.md AUSENTE
  ✗ MOC-Projeto.md sem referencia ao card {ID}

Acao automatica disponivel:
  Skill: tuninho-escriba, args: "--mode complete-coverage --card {ID} --apply"

OU manual:
  - Criar arquivos faltantes seguindo templates do vault
  - Atualizar MOC-Projeto.md
  - Re-rodar audit-escriba-completeness
```

### Auto-invocacao do escriba complete-coverage

Apos passo 7 PASS E seal aplicado em passo 8, se houve PASS condicional
(coverage 80-99%), passo 9 invoca automaticamente:

```bash
Skill: tuninho-escriba, args: "--mode complete-coverage --card {CARD_ID} --apply"
```

Garante que mesmo que algum artefato faltava na hora do seal, ele e gerado
imediatamente apos para fechar o ciclo documental antes de marcar operacao
como CONCLUIDA.

### Cooperacao downstream

| Skill | Como integra |
|-------|--------------|
| `tuninho-qa v5.5.0+` | sub-check `audit-escriba-completeness` invoca escriba check-only |
| `tuninho-escriba v5.1.0+` | modo `complete-coverage` auto-detecta gaps e gera (com `--check-only` ou `--apply`) |

### Excecao explicita

PRE-validacao humana (`human_validated_at: null`): escriba pode estar parcial
durante "Validando" no mural. Sub-check so dispara FAIL **apos validacao
humana confirmada**.

### Referencia operador 2026-05-06 (6a iteracao Card 124096)

> "Estruture e bump skills hooks e ops-suite para corrigirmos esse gap de
> vez tb para proximas operacoes e dogfooda pf"

ADR detalhado: `_a4tunados/docs_tuninho.ai/decisoes/seal-003-escriba-bloqueante.md`

---

## v5.0.6 — Pre-check `audit-tag-archive-is-ancestor` (Card 1768688081252124096 — 4a iteracao 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (4a iteracao Card 124096)**:

Operador detectou GAP de ancestralidade git pos-squash: mesmo com tag archive
existente (v5.0.5 sub-check), o commit da tag NAO e ancestral de develop —
fica orfao. Pre-check Comlurb deve validar AMBAS as condicoes (tag existe E
e ancestral) antes de aplicar seal final.

### Mudanca v5.0.6 — sequencia canonica encerramento estendida 9 → 10 passos

```
1. tuninho-qa audit-gate-final PASS
2. audit-pr-merged-and-develop-synced PASS              (v5.2.0)
3. audit-archive-tag-created PASS                       (v5.3.0)
4. audit-pr-merge-strategy-coherence PASS/WARN          (v5.3.0)
5. audit-storytelling-preserved PASS                    (v5.3.0)
6. audit-tag-archive-is-ancestor PASS                   (v5.4.0 NOVO)  ← novo gate
7. Comlurb seal Modo 6 / Modo 4
8. tuninho-escriba (auto)
9. tuninho-git-flow-dafor sync local final
10. tuninho-mural card-validated → Done + comment fechamento
```

### Pre-check estendido antes de seal Modo 6/Modo 4

Apos `human_validated_at` preenchido, EXIGIR PASS de:
1. `audit-pr-merged-and-develop-synced` (v5.0.4)
2. `audit-archive-tag-created` (v5.0.5)
3. `audit-storytelling-preserved` (v5.0.5)
4. **`audit-tag-archive-is-ancestor`** (v5.0.6 NOVO)

Se #4 FAIL: bloqueia seal, painel atualizado:

```
SEAL BLOQUEADO — GAP de ancestralidade git pos-squash

Operador ja aprovou (human_validated_at: {ts}), mas:
- PR #{N}: MERGED via --squash
- Tag archive/{branch}: present
- Tag commit e' ancestral de develop? NAO

Recovery (cria merge commit em develop SEM alterar arquivos):
  cd $WORKSPACE_DEVELOP
  git checkout develop
  git merge -s ours --no-ff archive/{branch} \
    -m "Merge tag 'archive/{branch}' into develop (preserva ancestralidade pos-squash)"
  git push origin develop

OU prevenir antes (proximas operacoes): tuninho-git-flow-dafor v5.2.0+
aplica --merge como default em branches principais (card/feat, card/fix,
op/, feat/), preservando ancestralidade nativamente.
```

### Recovery procedure documentada (atualizada)

```bash
# Pre-condicao: tag archive/<branch> existe (criada antes do --delete-branch
# OU recuperavel via reflog/worktree local)

cd $WORKSPACE_DEVELOP

# 1. Detectar GAP
git fetch origin develop --quiet
git fetch origin "refs/tags/archive/<branch>:refs/tags/archive/<branch>" --quiet

if git merge-base --is-ancestor archive/<branch> origin/develop; then
  echo "Ja eh ancestral — sem GAP"
else
  echo "GAP confirmado — aplicando recovery"

  # 2. Aplicar merge -s ours
  git checkout develop
  git pull --ff-only origin develop
  git merge -s ours --no-ff archive/<branch> -m "Merge tag 'archive/<branch>' into develop (preserva ancestralidade pos-squash)"

  # 3. Push
  git push origin develop

  # 4. Validar
  git merge-base --is-ancestor archive/<branch> origin/develop && echo "RECOVERY PASS"
fi
```

### Cooperacao downstream

| Skill | Como integra |
|-------|--------------|
| `tuninho-qa v5.4.0+` | sub-check `audit-tag-archive-is-ancestor` bloqueia seal se GAP detectado |
| `tuninho-git-flow-dafor v5.2.0+` | --merge default previne GAP em primeiro lugar; recovery merge -s ours documentado |

### Referencia operador 2026-05-06 (4a iteracao)

> "Precisamos da trilha concreta devolvendo o ultimo para develop. Parece
> estar tudo certo, menos essa ultima 'perna' no trilho faltante que
> devolve o commit da branch tagueada para develop."

---

## v5.0.5 — Sequencia canonica inclui tag `archive/<branch>` (Card 1768688081252124096 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (3a iteracao Card 124096)**:

Operador detectou que mesmo apos v5.0.4 incluir `audit-pr-merged-and-develop-synced`,
o squash merge do PR #48 perdeu o storytelling de 7 commits + branch foi deletada
sem tag `archive/...` (convencao estabelecida com 10+ tags no repo).

### Mudanca v5.0.5 — sequencia canonica encerramento estendida 7 → 9 passos

```
1. tuninho-qa audit-gate-final PASS
2. tuninho-qa audit-pr-merged-and-develop-synced PASS         (v5.2.0+)
3. tuninho-qa audit-archive-tag-created PASS                  (v5.3.0+ NOVO)
4. tuninho-qa audit-pr-merge-strategy-coherence PASS/WARN     (v5.3.0+ NOVO)
5. tuninho-qa audit-storytelling-preserved PASS               (v5.3.0+ NOVO)
6. Comlurb seal Modo 6 / Modo 4                                (esta skill)
7. tuninho-escriba (auto-chamado)
8. tuninho-git-flow-dafor sync local final                     (v5.1.0+ — incl tag verify)
9. tuninho-mural card-validated → Done + comment fechamento    (Regra #68)
```

### Pre-check estendido antes de seal Modo 6/Modo 4

Se `human_validated_at` ja preenchido, EXIGIR PASS de:
1. `audit-pr-merged-and-develop-synced` (v5.0.4 — ja existia)
2. `audit-archive-tag-created` (v5.0.5 — NOVO)
3. `audit-storytelling-preserved` (v5.0.5 — NOVO)

Se qualquer FAIL: bloqueia seal, painel claro:

```
SEAL BLOQUEADO — storytelling do PR nao preservado adequadamente

Operador ja aprovou (human_validated_at: {ts}), mas:
- PR #{N}: {state}
- Tag archive/{branch}: {present|MISSING}
- Storytelling: {tag|merge-commit|branch-ativa|PERDIDO}

Acao requerida (em ordem):
  # 1. Se branch ainda existe localmente (caso recovery):
  git tag -a archive/{branch} {last_commit} -m "Archive — Card {ID}..."
  git push origin archive/{branch}

  # 2. Se PR ainda nao foi mergeado:
  tuninho-git-flow-dafor --auto-merge-on-approval (v5.1.0+)
  # — aplica Politica 1 (archive tag) E Politica 2 (squash vs merge)

  # 3. Se squash ja aconteceu sem tag:
  TAG retroativa apontando pra HEAD@{N} antes da delecao da branch
```

### Recovery procedure pos-squash-sem-tag

Se PR ja foi `--squash --delete-branch` SEM criar tag archive:

```bash
# 1. Recuperar ultimo commit da branch (geralmente em reflog ou worktree local)
LAST_COMMIT=$(git log --all --format=%H --grep="comlurb.*seal" | head -1)
# OU se card-worktree ainda existe:
LAST_COMMIT=$(git -C /path/to/card-worktree rev-parse $BRANCH)

# 2. Criar tag retroativa
git tag -a archive/$BRANCH $LAST_COMMIT -m "Archive retroativa — Card $CARD_ID..."
git push origin archive/$BRANCH

# 3. Re-rodar audit-storytelling-preserved (deve passar agora)
```

### Cooperacao downstream

| Skill | Como integra |
|-------|--------------|
| `tuninho-qa v5.3.0+` | 3 novos sub-checks bloqueiam seal se storytelling nao preservado |
| `tuninho-git-flow-dafor v5.1.0+` | Politica 1 (tag archive) + Politica 2 (strategy) automatizam o gate |

### Referencia operador 2026-05-06 (3a iteracao)

> "tinhamos uma politica de tatueamento das principais branches quando
> deletadas, apenas as principais como card para nao perdermos os marcos
> historicos."

---

## v5.0.4 — Pre-check `audit-pr-merged-and-develop-synced` BLOQUEANTE no Modo 6/Modo 4 (Card 1768688081252124096 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (encerramento Card 124096)**:

Operador detectou regressao critica do fluxo gitflow: apos validacao humana
de v0.6.3 do tuninho.ai, a sequencia canonica de encerramento Modo 6 declarou
operacao "ENCERRADA com `comlurb_sealed: true`" mas:

- PR #48 ficou em estado **OPEN** (nao mergeado)
- develop local ficou defasada do trabalho recem-aprovado
- Proxima operacao iniciada em develop herdaria base desatualizada

### Mudanca v5.0.4 — pre-check petreo

**Antes de aplicar `comlurb_sealed: true` em Modo 6 (card-close-session) OU
Modo 4 (selo-final-operacao) quando `human_validated_at` ja preenchido,
EXIGIR PASS de `tuninho-qa audit-pr-merged-and-develop-synced` (v5.2.0+).**

Se sub-check FAIL:
1. **NAO aplicar seal** — operacao fica em estado intermediario `human_validated_pending_merge`
2. Apresentar painel claro:
   ```
   SEAL BLOQUEADO — PR nao mergeado / develop local defasada

   Operador ja aprovou (human_validated_at: {ts}), mas:
   - PR #{N}: {state}  (esperado: MERGED)
   - develop local: {ahead/behind}  (esperado: sync com origin)

   Acao requerida (ANTES de re-tentar seal):
     gh pr merge {N} --squash --delete-branch
     git -C {workspace} checkout develop
     git -C {workspace} pull --ff-only origin develop

   OU invoque tuninho-git-flow-dafor v5.0.3+ modo --auto-merge-on-approval
   pra automatizar.
   ```
3. Re-tentar seal apos resolver

**Se sub-check PASS**: aplicar seal normalmente.

### Sequencia canonica encerramento estendida (7 passos petreos a partir de v5.0.4)

```
1. tuninho-qa audit-gate-final PASS                   (incluindo v5.2.0 sub-check)
2. tuninho-qa audit-pr-merged-and-develop-synced PASS (NOVO petreo)
3. Comlurb seal Modo 6 / Modo 4                       (esta skill)
4. tuninho-escriba (auto-chamado)                     (vault docs)
5. tuninho-git-flow-dafor (auto-chamado)              (sync local final + verify)
6. tuninho-mural card-validated (auto)                (card → Done)
7. Comment fechamento mural (auto)                    (Regra #68)
```

**Diferenca vs v5.0.3**: passos 1-2 sao novo gate BLOQUEANTE antes do seal.
v5.0.3 adicionou sync develop ao final mas pressupunha que merge ja tinha
ocorrido. v5.0.4 fecha o gap fazendo o PROPRIO MERGE parte da pre-condicao.

### Excecao explicita

ANTES da validacao humana (`human_validated_at: null`), PR pode ficar OPEN.
Pre-check so dispara FAIL apos `human_validated_at` preenchido. Isso preserva
o fluxo "PR aberto durante Validando" do card-isolated.

---

## v5.0.3 — Sync develop local pos-merge incluso na sequência final (Card 1768281088850920655 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador**:

- **Sequência canônica final pos-Modo 6 estendida com sync develop local**: após Comlurb seal Modo 6 + escriba auto + git-flow-dafor auto + merge PR develop, DEVE incluir `git checkout develop && git pull --ff-only` obrigatório. Develop local sempre atualizada pos-encerramento. *Operador verbatim 2026-05-06*: *"a develop sempre precisa ser atualizada e syncada."*

### Sequência canônica completa modo expansivo+autonomous (6 passos petreos)

```
1. Comlurb seal Modo 6                          (esta skill)
2. tuninho-escriba (auto-chamado)               (vault docs)
3. tuninho-git-flow-dafor (auto-chamado)        (commit + merge + PR)
4. SYNC DEVELOP LOCAL POS-MERGE (NOVA petrea)   (git checkout develop && git pull --ff-only)
5. tuninho-mural card-validated (auto)          (card → Done)
6. Comment fechamento mural (auto)              (Regra #68)
```

### Aplicação concreta
- Sub-check `audit-develop-local-synced-with-origin` adicionado em tuninho-qa v5.1.0+
- Operação só marca status ENCERRADA quando sync develop local PASS

---

## v5.0.2 — Sessão 4 QA EXTREMO Modo 6 + auto-trigger escriba+gitflow (Card 1768281088850920655 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador**:

- **Modo 6 (selo final operação)** confirmado canônico: aplica `comlurb_sealed: true` + `seal_mode: card-close-final-modo-6` + `status_final: APROVADO_PRA_DONE` no handoff sealed final, substituindo qualquer partial handoff anterior. Operação fica IMUTÁVEL daqui em diante.

- **Auto-trigger sequência final**: após Modo 6 aplicado em fluxo `DDCE_EXPANSIVO_MULTI_SESSOES_*` + `OBL-AUTONOMOUS-MODE-*`, AUTOMATICAMENTE invocar:
  1. `tuninho-escriba` (vault docs + report executivo)
  2. `tuninho-git-flow-dafor` (commit → merge develop → PR develop → main)
  
  Operador NÃO precisa rodar essas skills manualmente. *Operador verbatim 2026-05-06*: *"faltou, e precisa ser adicionado às skills nesse modo que rodamos, chamar o escriba ao final e rodar o gitflow da for para devolver as atualizacoes feitas na branch para a develop."*

### Aplicação concreta
- Sequência canônica modo expansivo+autonomous final: `Comlurb seal Modo 6` → **`tuninho-escriba auto-chamado`** → **`tuninho-git-flow-dafor auto-chamado`**

---

## v5.0.1 — Sessão 2 DEFINE EXPANSIVO diretivas petreas (Card 1768281088850920655 — 2026-05-05)

**Bump preventivo absorvendo 3 diretivas petreas** que afetam comportamento desta skill em modo DDCE_EXPANSIVO:

- **NUNCA comprimir o handoff sealed gerado pelo gate-guard-full** quando operação em modo `DDCE_EXPANSIVO_MULTI_SESSOES_*`. Handoff deve ter ≥9 seções canônicas + tripla segurança documentada (Camada 1 comando /tuninho-resume + Camada 2 audit evidências + Camada 3 alternativa emergencial). Comprimir = quebrar continuidade entre sessões pos-/clear.

- **Sempre medir tokens via JSONL ao gerar handoff** — não chutar. Persistir baseline % atual no `seal_token_baseline` do frontmatter pra auditoria histórica.

- **Validar branch sync com develop ANTES de aplicar seal**: avisar operador se branch da operação está atrás de origin/develop (sub-check `audit-branch-sync-with-develop` candidato pra tuninho-qa).

### Por que patch v5.0.1?

Operador autorizou Q-FINAL-1=(c) bumps preventivos S2 durante S2.6.5 do Card 1768281088850920655.

### Aplicação concreta

- gate-guard-full em modo expansivo gera handoff INTEGRAL ≥9 seções
- Frontmatter inclui `seal_token_baseline` (% medido via JSONL)
- Pre-seal validation inclui branch sync check

---

## v5.0.0 — DDCE_EXPANSIVO_MULTI_SESSOES integration (Card 1768281088850920655 — 2026-05-05)

**Bump canonico de toda ops-suite** absorvendo 4 Regras Inviolaveis novas do tuninho-ddce v4.20.0+:

- **#68** — Card mural canal espelhado equivalente em TODAS interacoes (nao so inputs).
  Operador pode escolher seguir pela sessao Claude OU pelo card mural — ambos canais
  devem ter as mesmas informacoes em tempo real (resumo de progresso, perguntas,
  aprovacoes, atualizacoes de status, blockers).

- **#69** — Modo DDCE_EXPANSIVO_MULTI_SESSOES + sub-etapa S1.6.5 Confirmacao Final
  pre-artefatos. Para operacoes complexas autorizadas pelo operador: 4 sessoes
  dedicadas (1 por fase DDCE: DISCOVER + DEFINE + EXECUTION + QA+FINAL). Cada sessao
  inteira saturada na fase atual maximiza profundidade. Handoff e checklist exclusivos
  por operacao em `cards/{cardId}_*/`. Sub-etapa S1.6.5 obrigatoria antes de produzir
  artefatos finais ou executar gate-guard-full Comlurb.

- **#70** — Modalidades LLM dual (SDK Claude Code assinatura vs OpenRouter API key)
  com contabilizacao petrea. SDK = usa cota assinatura, contabiliza tokens "como se"
  mas NAO bills via API. OpenRouter = paga por token via API real. Operacoes anteriores
  tiveram problemas confundindo as duas modalidades — esta regra documenta petreamente.

- **#71** — Branding tuninho.ai oficial. tu.ai eh APELIDO INTERNO/CARINHOSO apenas
  (operacoes/cards/comunicacao dev). Branding em UI/marketing/copy oficial = SEMPRE
  tuninho.ai. Razao raiz: tu.ai NAO eh nosso dominio.

### Por que v5.0.0 (independente da versao anterior)?

Operador autorizou explicitamente:
> *"info IMPORTANTE para toda skill que sofrer essa atualização o bump deverá ser 5.x.x
> independente de qual ela venha, para regularizar que é compativel com esse novo metodo
> a partir de agora."*

Razao: regularizar toda ops-suite num novo bloco de versionamento que sinaliza
compatibilidade com DDCE_EXPANSIVO_MULTI_SESSOES + as 4 regras novas.

### O que muda nesta skill especificamente

(detalhamento por-skill sera adicionado em proximas releases v5.0.x conforme uso real
das 4 regras evidenciar necessidades de adaptacao especifica para esta skill)

### Origem operacional

Card 1768281088850920655 "Estabilizacao Chat Tuninho.ai" — sessao 1 DISCOVER EXPANSIVO
(2026-05-05). Bump aplicado em batch a 15 skills + 3 hooks da ops-suite + remocao
da skill deprecated `tuninho-mandapr`. Cooperacao com tuninho-ddce v4.20.0+ que
formaliza Regras #68-#71 + sub-etapa S1.6.5.

### Backward compat

Operacoes em curso pre-v5.0.0 podem completar sem mudancas. v5.0.0 aplica daqui em
diante para alinhamento canonico. Sub-checks QA novos (audit-card-mirror-coverage,
audit-modality-tracking, audit-multi-session-handoff, audit-branding-tuninho-ai)
serao adicionados em tuninho-qa v5.x.x para validar conformidade.

---

# Tuninho da Comlurb v0.10.0

## v0.10.0 — HANDOFF schema multi-repo `repos_state: {}` + `comlurb_sealed_repos: []` (Op 18 Fase 8, 2026-05-02)

**Aprendizado canonico Op 18 (a4tunados_web_claude_code, 2026-05-02 Fase 8)**: Card 2 da Op 18 pediu DDCE multi-repo. HANDOFF do Comlurb e a espinha dorsal de continuity entre sessoes — esta versao adiciona suporte multi-repo OPT-IN preservando 100% backwards compat.

**Risco**: ALTO (cascata em 4 skills downstream que consomem HANDOFF). Mitigacao: schema aditivo + testes de regressao single-repo BLOQUEANTES (Op 18 Fase 8 T8.4).

### Schema HANDOFF v0.10.0 (resolve P3 do Discovery Op 18)

Novos campos top-level (opcionais — se ausentes, modo single-repo identico v0.9.0):

```yaml
# === MULTI-REPO STATE (NOVO em v0.10.0) ===
# Schema canonical resolvendo P3 do Discovery Op 18:
# 7 campos por repo. Centralizado (Decisao D11).
repos_state:
  <repo_name_a>:
    sealed: bool                       # foi selado pela Comlurb?
    session_count: int                 # sessoes que esse repo participou
    last_sealed_at: ISO-8601 or null
    lag_commits: int                   # commits ahead de develop
    reason_unsealed: string or null    # motivo se sealed=false
    branch: string                     # branch ativa
    head_short: string                 # SHA curto
    tracking: string or null           # remote tracking branch
  <repo_name_b>: { ... }

comlurb_sealed_repos:
  - <repo_name_a>
  - <repo_name_b>
```

**Reference completa**: `references/handoff-schema-v0.10.0.yaml.example`

### Cooperacao downstream (cascata)

| Skill | Consome | Cooperacao v0.10.0 |
|-------|---------|---------------------|
| `tuninho-resume` | `seal_next_session_briefing.canonical_block` | Continua funcionando — formato externo nao muda |
| `tuninho-portas-em-automatico v0.5.1+` | `repos_state` | Resp 11 detecta multi-repo via repos_state |
| `tuninho-escriba` | HANDOFF como fonte | Continua funcionando — formato externo preservado |
| `tuninho-qa v0.17.1+` | `repos_state` + `comlurb_sealed_repos` | sub-check `audit-multirepo-coherence` cruza coerencia |
| `tuninho-ddce v4.12.0+` | `repos_state` | Etapa 0.5 detecta multi-repo |

### Scripts (planejados)

- `scripts/aplicar-seal.py`: loop por repo se `repos_state` populado; preserva comportamento single-repo
- `scripts/sync-jsonl-final.sh`: cobre raw_sessions multi-workspace quando multi-repo
- `scripts/atualizar-handoff.py`: aceita schema v0.10.0 (campos opcionais)

**Status impl**: scripts mantem v0.9.0 logic; schema documentado; impl real do loop por repo deferida para Fase 9 dogfood quando primeira operacao multi-repo real ocorrer.

### Backwards compat

100% — HANDOFFs sem `repos_state` (operacoes pre-v0.10.0) sao tratados identicamente ao v0.9.0. Sem mudancas obrigatorias em scripts existentes.

### Testes regressao single-repo (BLOQUEANTES — Fase 8 T8.4)

Validacao deferida ate primeira invocacao real (Fase 9 dogfood ou pos-Op 18). Cobertura prevista:
- `/tuninho-resume` em HANDOFF v0.9.0 antigo: PASS
- `/tuninho-resume` em HANDOFF v0.10.0 single-repo (`repos_state` com 1 entrada): PASS
- tuninho-portas Resp 11 com HANDOFF v0.10.0: PASS
- tuninho-qa audit-handoff-consistency-ddce26 valida v0.10.0 schema: PASS

### Origem operacional

Op 18 Fase 8 (a4tunados_web_claude_code, 2026-05-02). Bump MINOR aditivo. Cooperacao com 4 skills downstream documentada.

---

# Tuninho da Comlurb v0.9.0

## v0.9.0 — Ativação real v0.8.0 + Modo 8 RESEAL-CONSOLIDATION (Op 18 Fase 1, 2026-05-02)

**Aprendizado canônico Op 18 (a4tunados_web_claude_code, 2026-05-02 sessão #2)**: investigação cross-projeto da Op 17 revelou que **template canônico v0.8.0 nunca foi consumido pelo `aplicar-seal.py`** (ainda gerava formato inline próprio v0.7.x) E **hook `tuninho-hook-briefing-gate.py` existia mas NÃO estava registrado em `~/.claude/settings.json`** — portanto nunca foi carregado pelo Claude Code (Regra Inviolável #21 do tuninho-updater). Resultado: briefing automático "nunca funcionou" porque tecnicamente nunca rodou. Auditoria empírica: 96.4% dos JSONLs ficavam órfãos no buffer, 81.8% dos seals com divergência doc-vs-real.

**Mudanças v0.9.0 (4 fixes mínimos da Op 18 Fase 1)**:

1. **`aplicar-seal.py` v0.8.0 ATIVADO**: agora consome `references/handoff-template.md` canônico de 9 seções via `load_canonical_template()` + `extract_drift_check_data()` + `render_canonical_briefing()`. Bloco markdown vai DENTRO do HANDOFF YAML em `seal_next_session_briefing.canonical_block` — fonte única consumida tanto pelo briefing externo quanto pelo `tuninho-resume`. Função `generate_briefing_legacy()` mantida como fallback.

2. **Modo 8 RESEAL-CONSOLIDATION**: detecta automaticamente quando seal acontece em modo `emergencial-85pct` ou `pre-compactacao` APÓS seal anterior `selo-final-operacao`. Marca handoff com `requires_reseal: true` + `reseal_reason`. Hook `briefing-gate v0.2.0+` verifica esse campo e **bloqueia (deny)** primeira tool da próxima sessão até operador rodar `Skill: tuninho-da-comlurb, args: "--mode reseal"`. Modo 8 lê seal final + emergenciais subsequentes, reconcilia `work_completed_post_initial_seal` em `pendencias_finais.completed`, atualiza `arquivos_modificados`/`decisoes_tomadas`, aplica `comlurb_resealed: true` + `reseal_supersedes: [...]`. Resolve causa-raiz Op 17 (handoff dizia "deferred" mas tudo estava LIVE).

3. **Hook `briefing-gate` REGISTRADO em `~/.claude/settings.json`** — single fix de 12 linhas que ativa o sistema de briefing forçado que existia há 1 dia mas nunca rodou.

4. **Hook `tuninho-hook-inicio-sessao v4.6.0`**: mirror contínuo de JSONL rate-limited 1×/15min para 3 destinos (canonico do projeto + cache cross-op + arquivo cross-projeto user-level). Atende pedido literal do operador "SOBRAS DE ARTEFATOS E ACESSO EXPLICITADO AO RAW DE SESSOES". Resolve 96.4% de abandono de JSONLs.

**Nova Regra Inviolável SEAL-007**: Comlurb DEVE detectar `requires_reseal` em handoff alvo antes de aplicar QUALQUER novo seal sobre ele. Se `requires_reseal: true`, exigir Modo 8 RESEAL antes de aceitar novo seal. Excepcao: o proprio Modo 8 RESEAL pode rodar (limpa flag).

### Modo 8 — RESEAL-CONSOLIDATION

**Trigger**: invocação manual `Skill: tuninho-da-comlurb, args: "--mode reseal"` OU automática quando próxima sessão tenta tool com `requires_reseal: true` no handoff sealed mais recente.

**Pré-condições**:
- HANDOFF target existe e tem `requires_reseal: true`
- HANDOFF tem `historico_seals` com pelo menos 1 entry `selo-final-operacao` E pelo menos 1 entry posterior `emergencial-85pct` OU `pre-compactacao`
- Branch git está clean (working tree limpo)

**Sequência (Modo 8)**:

1. Backup `.bak-{ts}-pre-reseal` do HANDOFF original
2. Ler `seal_emergencial_85pct.work_completed_post_initial_seal` (ou equivalente para `pre-compactacao`)
3. Para cada item desse array:
   - Buscar match em `pendencias_finais.deferred_para_proxima_sessao` (string fuzzy ou ID exato) → mover pra `pendencias_finais.completed`
   - Buscar match em `arquivos_modificados` → adicionar se ausente
   - Buscar match em `decisoes_tomadas` → adicionar se ausente
4. Atualizar `pendencias_finais.design_specs_pendentes_implementacao` removendo itens reconciliados
5. Aplicar:
   ```yaml
   comlurb_resealed: true
   reseal_timestamp: <iso_now>
   reseal_supersedes:
     - <ts_seal_final_original>
     - <ts_seal_emergencial_1>
     - ...
   reseal_mode: correcao-documental-pos-emergencial
   reseal_changes:
     - "Reconciliou N items de work_completed_post_initial_seal em pendencias_finais.completed"
     - "Atualizou arquivos_modificados (+M items)"
     - ...
   ```
6. Limpar flag `requires_reseal` (set false)
7. Append em `historico_seals` nova entry com `seal_mode: reseal-consolidation`
8. Re-rodar `aplicar-seal.py` em modo dry-run pra regerar briefing canônico atualizado

**Fail-safe**: se qualquer step falhar, restaurar do backup `.bak-{ts}-pre-reseal`. Não corromper handoff em meio caminho.

**Output ao operador**: tabela das mudanças aplicadas + path do backup + sugestão de invocar `/tuninho-resume` pra ver briefing atualizado.

### Histórico de bumps Op 18 Fase 1
- Suite v5.21.0 → v5.22.0 (MINOR — novas capacidades)
- Comlurb v0.8.0 → v0.9.0 (MINOR — Modo 8 + ativação real v0.8.0)
- briefing-gate v0.1.0 → v0.2.0 (MINOR — checks `requires_reseal`)
- inicio-sessao v4.5.0 → v4.6.0 (MINOR — mirror contínuo JSONL)

---

## v0.8.0 — Modo 6 unificado + handoff-template canônico (Op 17 F4.5, 2026-05-02)

**Aprendizado canônico Op 17 (a4tunados_web_claude_code, 2026-05-02)**: investigação cross-projeto revelou que **continuidade pós-/clear não era fluida** mesmo com Comlurb v0.7.1 e hook inicio-sessao v4.4.0 implementados. 51/52 ops pré-Comlurb cross-projeto sem HANDOFF multi-sessão (97% taxa de falha). Mesmo pós-Comlurb, gaps persistiam.

### 6 causas raiz identificadas

1. Modo 6 minimalista (9 campos) vs Modo 7 rigoroso (40+) — Modo 7 só dispara em retro
2. Hook injeta briefing em `additionalContext` (informativo, NÃO bloqueia agente)
3. Pendency-ledger documentado mas pouco-implementado em ops reais
4. Arquivos paralelos (HANDOFF_*.md) violando SEAL-005
5. Conteúdo crítico só no JSONL volátil
6. Decisões implícitas não explicitadas

### Mudança v0.8.0

**Modo 6 UNIFICADO** — incorpora rigor do Modo 7 default (não só em retro). Output do `gate-guard-full` SEMPRE segue `references/handoff-template.md` — 9 seções obrigatórias:

1. Cabeçalho selo (identidade)
2. ONDE PAROU (re-contextualização rápida)
3. DRIFT CHECK (resolve causa #2)
4. PRÓXIMO PASSO (resolve causa #5 — comandos-zero)
5. DECISÕES ATIVAS (não re-perguntar)
6. PENDÊNCIAS (ledger ativo)
7. ARTEFATOS-CHAVE (single source — SEAL-005)
8. CONTEÚDO CRÍTICO (resolve causa #3 — JSONL volátil)
9. HISTÓRICO SEALS (auditoria + paralelos detection)

**Anti-padrão abolido**: gerar HANDOFF em formato YAML livre. Template canônico é OBRIGATÓRIO.

**`scripts/aplicar-seal.py` (futuro patch)**: deve ler `references/handoff-template.md`, substituir placeholders dinâmicos via parsing dos artefatos da operação, gerar HANDOFF unificado em estrutura `handoffs/HANDOFF_*_sessao_NN.yaml`. Append em HISTÓRICO SEALS (não sobrescrever).

### Integrações ativadas

- **tuninho-hook-inicio-sessao v4.5.0+**: cria state file `.claude/tuninho-briefing-pending.json` ao detectar seal
- **NOVO tuninho-hook-briefing-gate v0.1.0**: PreToolUse com `permissionDecision: ask` quando briefing pendente E não-acknowledged
- **tuninho-qa v0.16.0+**: sub-check `audit-handoff-singleness` detecta paralelos violando SEAL-005
- **tuninho-portas-em-automatico v0.5.0+**: Resp 11 valida sidecar gitflow

### Backward compat

`scripts/aplicar-seal.py` antigo continua funcional. Bump pra v0.8.0 ativa novo template ao adicionar leitura de `references/handoff-template.md`. Operações já seladas com formato antigo permanecem válidas.

### Referências canônicas

- `references/handoff-template.md` — template completo com 9 seções e placeholders
- `_a4tunados/_operacoes/projetos/17_oficializar-tester-gitflow-mural/fase_04_5/F4.5-design-specs.md` (no projeto a4tunados_web_claude_code) — design completo da v0.8.0

---

## v0.7.1 — Regra SEAL-006: pre-check audit-fix-validation-coherence + audit-happy-path-e2e (Card 170 — 2026-05-01)

**Aprendizado canonico Card 170 (tuninho.ai, 2026-05-01):** o agente DDCE em modo
pragmatico declarou validacao concluida e pediu mural-export Validating duas vezes
consecutivas (v0.5.34 e v0.5.35) sem ter exercitado o happy path E2E real do fix
de bug. Erro 400 do Claude API persistiu em prod. Comlurb seal nao foi acionado
nessas duas vezes (sem `comlurb_sealed`), mas o `--mark-validating` do mural foi.
Resultado: operador ficou esperando validacao humana de algo que nao funcionava.

**Solucao petrea v0.7.1: nova Regra Inviolavel SEAL-006**

#### Nova Regra Inviolavel SEAL-006 (severidade ALTA — fluxo card-isolated)

**🔴 Pre-check OBRIGATORIO `audit-fix-validation-coherence` + `audit-happy-path-e2e`
PASS antes de Comlurb selar OU antes de aceitar mural-export `--mark-validating`.**

A Regra SEAL-004 (v0.6.0) ja exige `human_validated_at` antes do seal final. SEAL-006
**estende** o pre-check tambem para a etapa intermediaria de `--mark-validating`:

- **Quando aplica:** card-isolated com diff que toca pipeline async (LLM, queue,
  cron, stream), path admin auth-gated, componente novo OU fix de bug especifico.
- **Pre-checks executados** (via `Skill tool: tuninho-qa`):
  1. `audit-happy-path-e2e` — exige >= 1 screenshot timestamped DEPOIS de
     browser_click + delay >= duracao esperada + console clean + log servidor.
  2. `audit-fix-validation-coherence` — para PR de fix de bug, exige template
     "reproducao pre-fix + aplicacao + verificacao pos-fix com mesmo comando".
- **Comportamento bloqueante:**
  - Comlurb modo `selo-final-operacao`: BLOQUEIA seal se qualquer pre-check FAIL.
  - **EXTENSAO v0.7.1:** Comlurb tambem BLOQUEIA `tuninho-mural card-result --mark-validating`
    se pre-check FAIL (tornar mural-cli aware da Regra SEAL-006 — pendente integracao
    em tuninho-mural v0.8.0).

**Anti-padrao rejeitado:** pedir validacao humana via mural Validating sem ter
exercitado o happy path E2E primeiro. Repassa o onus do QA pro operador. Card 170
demonstrou que isso causa "ping-pong" desnecessario (operador pede E2E, agente
faz, descobre que fix nao funcionou, repete iteracao).

**Sub-checks correspondentes (tuninho-qa v0.14.0+):**
- `audit-happy-path-e2e`
- `audit-fix-validation-coherence`
- `audit-card-scope-coverage`
- `audit-fix-source-coverage`

**Licao canonica (tuninho-da-comlurb references/licoes-aprendidas.md):**

> **L-COMLURB-CARD170-1**: pre-check de seal/mark-validating deve incluir
> `audit-happy-path-e2e` + `audit-fix-validation-coherence` quando card-isolated
> tem fix de bug em pipeline async. Sem isso, o seal/mark-validating eh declaracao
> sem prova empirica — operador eh forcado a fazer QA manual.

---

## v0.7.0 — Modo 7 + Regra SEAL-005: HANDOFF rigoroso post-seal extra-op (Card 134 — 2026-04-30)

**Aprendizado canonico Card 134 post-seal (tuninho.ai, 2026-04-30):**

Apos `comlurb_sealed: true` aplicado no Card 134 (PR #33 mergeado, Done col 32, v0.5.31 deployed), o operador continuou em modo "extra-operacao" pra atender itens isolados (drag-and-drop bug + descricoes de cards 137/138 + otimizacao DDCE). A sessao foi interrompida em 85% de tokens (modo emergencial). O HANDOFF foi atualizado mas em **arquivo paralelo** `HANDOFF_post_seal_extra_op.md`, deixando o `HANDOFF.md` original com `Proxima sessao: _none_`.

**Resultado**: a sessao seguinte (pos-`/clear`) teve que descobrir o arquivo paralelo via `find` por padrao `HANDOFF*` — sorte de ter feito a busca; uma sessao que so leu `HANDOFF.md` teria respondido "card selado, nada a fazer", contradizendo o estado real (2 itens em aberto + descricoes vazias no DB prod).

### Causas raiz do atrito de retomada (a evitar)

1. **Arquivos paralelos competindo por verdade**: `HANDOFF.md` dizia `_none_`; `HANDOFF_post_seal_extra_op.md` dizia `5min de trabalho pendente`. Sem regra clara de qual e o canonico.
2. **Estado declarado vs real divergente**: HANDOFF dizia `descricoes length=0` (vazia), mas DB prod tinha 2708/3792 chars (parcial — bash heredoc tinha falhado mas conteudo principal sobreviveu). Sem drift-check, agente faria UPDATE redundante.
3. **Conteudo critico so no JSONL**: descricoes redigidas estavam no `raw_sessions/*.jsonl` emergencial, nao no HANDOFF. Pattern fragil — JSONL e dump volatil; HANDOFF deveria ter o conteudo final estavel.
4. **Cards relacionados nao registrados no manifest local**: cards 137/138 criados no DB prod via SQL, sem entry em `cards-manifest.json`. Proxima sessao nao sabe que existem.
5. **Comandos-zero ausentes**: HANDOFF dizia "extrair conteudo dos blocos do JSONL" sem script exato. Agente seguinte teve que inferir Python ad-hoc (e errar 1 vez).
6. **Decisoes implicitas nao explicitadas**: "branch atual pode ser reusado pra hotfix" — mas card SELADO em Done; reusar branch ou criar nova? Sem regra.

### Mudancas v0.7.0

#### 1. Nova Regra Inviolavel SEAL-005 (severidade ALTA — fluxo card-isolated post-seal)

> **HANDOFF.md e fonte UNICA de verdade.** **PROIBIDO** criar arquivos paralelos como `HANDOFF_post_seal_extra_op.md`, `HANDOFF_continuation.md`, etc. Qualquer trabalho pos-`comlurb_sealed: true` que estenda o card DEVE refundir o `HANDOFF.md` principal com a estrutura rigorosa do Modo 7 (abaixo).
>
> Excecoes permitidas: `HANDOFF.md.bak-{ts}` (backup mecanico) ou `HANDOFF_archive_v{N}.md` (snapshot historico imutavel apos refundicao). Esses sao append-only e nao competem por verdade.

#### 2. Modo 6 atualizado: branching condicional pos-seal

Modo 6 deixa de ter briefing fixo `_none_`. Branching:

- **Se `comlurb_sealed: false` (primeira passagem)**: comportamento original v0.6.x (pre-validation seal ou final seal conforme SEAL-004).
- **Se `comlurb_sealed: true` E ha trabalho extra-op (commits pos-seal OU prompt do operador continuando o card)**: invoca **Modo 7 (post-seal extra-op handoff)**.
- **Se `comlurb_sealed: true` E sem extra-op**: briefing fica `_none_`, comportamento v0.6.x preservado.

#### 3. Modo 7 NOVO — POST-SEAL EXTRA-OP HANDOFF

**Trigger:** invocado pelo Modo 6 quando detecta `comlurb_sealed: true` + trabalho ativo na branch. Pode tambem ser invocado direto: `Skill: tuninho-da-comlurb, args: "--mode post-seal-extra-op --card {CARD_ID}"`.

**Estrutura rigorosa do HANDOFF.md refundido:**

```markdown
# HANDOFF — Card {id} {titulo}

## Status canonico (atualizado: {ISO_TS})
- comlurb_sealed: true (final em {ts_final})
- post_seal_session_count: {N} (esta e a {Nth} sessao pos-seal)
- post_seal_extra_op_status: PENDING | IN_PROGRESS | CLOSED
- versao_canonical: v{X.Y.Z} (deployed em {servidor} em {ts_deploy})
- branch_atual: {branch}
- pr_principal: {url} (mergeado em {target} em {ts_merge})
- prs_post_seal: [{N1: url}, {N2: url}, ...]

## Drift-check obrigatorio (rode ANTES de qualquer acao)
\`\`\`bash
# Estado do DB prod (cards relacionados)
ssh {host} "sqlite3 {db_path} 'SELECT id, length(description) FROM chats WHERE id IN ({ids});'"
# Estado da branch local vs remoto
git log --oneline {branch_base}..HEAD
git status --short
# Estado dos cards no mural
{cli} card-list --board={board} | grep -E '{ids}'
\`\`\`

**Resultado esperado:**
\`\`\`
{output exato esperado}
\`\`\`

Se ha divergencia: registrar em "Drift detectado em {ts}" antes de prosseguir.

## Itens extra-op

### Item 1 — {titulo curto}
- **Status**: PENDING / IN_PROGRESS / CLOSED em {ts}
- **Evidencia verificavel**: {file path / SQL / commit hash}
- **Comando-zero** (copy-paste, ZERO inferencia):
  \`\`\`bash
  {bash exato pra proxima sessao executar e validar}
  \`\`\`
- **Proxima acao**: {1 frase}

### Item 2 — ...

## Decisoes operacionais (explicitas)
- **Branch policy**: {continuar / criar nova `card/feat/{slug}-{id6}-postseal` / nao trabalhar pos-seal}
- **PR policy**: {novo PR / amend / commit direto develop}
- **Versionamento**: {patch dentro do minor / minor exige autorizacao}
- **Manifest**: cards relacionados {ids} {estao | nao estao} em `cards-manifest.json`

## Historico de seals (append-only)
- {ts_pre_validation} — pre_validation_sealed
- {ts_final} — comlurb_sealed (final)
- {ts_post_seal_1} — post_seal_session_1_sealed
- ...

## Conteudo critico fora do JSONL
{Se ha texto/dado critico que so existia no JSONL emergencial, copiar pra ca: descricoes, prompts, configs, etc. Pattern: nunca dependa do JSONL pra recuperar trabalho — JSONL e fonte volatil.}
```

#### Regras do Modo 7

- **NUNCA** cria `HANDOFF_*.md` paralelo. Sempre refunde `HANDOFF.md`.
- **SEMPRE** preserva historico dos seals anteriores (append, nao overwrite).
- **SEMPRE** faz drift-check explicito com comando exato antes de declarar "estado pendente".
- **SEMPRE** registra cards relacionados no `cards-manifest.json` (nao deixa orphans no DB de prod).
- **SEMPRE** tem comando-zero copy-paste em cada item extra-op (proxima sessao nao precisa inferir).
- **SEMPRE** declara branch policy + PR policy + versionamento explicitamente — sem implicitos.

#### 4. Aprendizados auxiliares

- **Versionamento conservador post-seal**: bumps post-seal sao patch (v0.5.31 → v0.5.32). Bump de minor exige autorizacao explicita do operador.
- **PR policy padrao post-seal**: novo PR pro mesmo target branch (develop), com title prefix `card-{id}/post-seal-{N}: ...`. Amend de PR ja mergeado e proibido.
- **Card status no mural pos-seal**: card permanece em `Done`. Comentarios pos-seal anotam `[post-seal #{N}]` no inicio do body.

Casado com:
- Memoria do operador `feedback_card_isolated_move_to_done.md`
- Regra Inviolavel #48 do `tuninho-ddce`
- L-CARD134-PostSeal documentado nesta sessao (2026-04-30)

---

## v0.6.1 — Pattern "pre-validation seal + final seal" validado em prod (Card 134 — 2026-04-29)

**Aprendizado canonico Card 134 (tuninho.ai, 2026-04-29):**

A regra SEAL-004 da v0.6.0 funcionou exatamente como projetada em operacao real card-isolated com 5 iteracoes pos-validacao tecnica. O fluxo final foi:

1. **Pre-validation seal** (Modo 6 pos-deploy v0.5.30):
   - JSONL sincronizado em `_a4tunados/_operacoes/cards/{id}_{slug}/raw_sessions/`
   - HANDOFF.md com estado tecnico + checklist do operador
   - Manifest marca `comlurb_pre_validation_sealed: true`, NAO `comlurb_sealed: true`
   - Card movido `Em execucao → Validando` (col 30 → col 31 board Dev tuninho.ai)
   - Pre-check SEAL-004 detectou `human_validated_at: null` e BLOQUEOU seal final

2. **Operador valida em prod** (testou tudo + 2 ajustes minimos)

3. **Ajustes minimos pos-validacao** (v0.5.31) rodam direto na branch sem novo round de comlurb (operador autoriza inline)

4. **Final seal** (Modo 6 invocado de novo):
   - Pre-check SEAL-004 passa (`human_validated_at` preenchido)
   - Manifest: `comlurb_sealed: true`, `last_status: CONCLUIDO COM SUCESSO`
   - Card movido `Validando → Done` (col 31 → col 32)
   - PR mergeado em develop

**Refinamentos documentados:**

- Pre-validation seal e final seal sao **passagens distintas** do Modo 6, NAO etapas de uma unica. O Modo 6 e idempotente — pode rodar varias vezes; pre-check decide se aplica seal final ou mantem em pre-validation.
- Ajustes minimos pos-validacao NAO precisam de novo pre-validation seal — operador autoriza inline e seguem ate o final seal.
- Pattern reusavel pra qualquer fluxo card-isolated com `validation_iterations >= 1`.

Casado com:
- Memoria do operador `feedback_card_isolated_move_to_done.md` (move pra Done sempre)
- L-OP09-3 do escriba v3.13.0 (versionamento conservador pos-validacao = patch)

---

## v0.6.0 — Pre-check `human_validated_at` em seal final card-isolated (2026-04-25)

**Aprendizado canonico do Card 1760962183182681367 (operador, 2026-04-25):**

> "É uma vez validada depois das eventuais solicitações de acertos, quando
> validado por final devemos rodar o escriba, comlurb e mover para aí sim done."

Mudancas:

- **Nova Regra Inviolavel SEAL-004 (severidade ALTA, fluxo card-isolated)**:
  Modo 6 (`card-close-session`) e modo `selo-final-operacao` em fluxo
  card-isolated adicionam pre-check do campo `human_validated_at` no
  contrato `card-isolated-contract.yaml`. Se vazio (operador ainda nao
  validou): **BLOQUEIA o seal** com mensagem clara — "operacao em validacao
  humana, aguarde operador confirmar". Devolve para Etapa 16.5 do DDCE.
- Casado com **Regra Inviolavel #48 do `tuninho-ddce` v4.5.7+**
  (encerramento card-isolated em 2 fases — Validando antes de Done).
- Sub-check delegado ao `tuninho-qa audit-card-validation` (futuro).

---



> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite.
> Mantenha-a atualizada via `tuninho-updater`.

Voce e o Tuninho no papel de **Gari da Comlurb** — o responsavel pela faxina
final antes do caminhao do lixo passar. Sua missao e garantir que **nenhum grao
de contexto seja perdido** quando o operador der `/clear` ou quando a compactacao
automatica for iminente.

A metafora vem da Companhia Municipal de Limpeza Urbana do Rio: **o gari passa
antes do caminhao, varrendo tudo que importa para o ponto certo de coleta**.
Aqui, o Tuninho da Comlurb passa antes do `/clear`, sincronizando JSONLs,
atualizando HANDOFF, reconciliando pendencias, e aplicando o selo de validacao.

Toda comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Princípio fundamental

**Nada de valor deve ser destruido por `/clear` sem antes passar pela faxina.**

O `/clear` do Claude Code destroi o buffer volatil da sessao. O JSONL dela vai
pro disco (`~/.claude/projects/`) mas fica invisivel para o projeto. O Comlurb
sincroniza o JSONL para `handoffs/raw_sessions/` (imutavel, versionado), atualiza
o HANDOFF incrementalmente com estado vivo, e sela tudo com validacao do QA.

---

## Os 5 modos de operacao

### Modo 1 — FAXINA PRE-CLEAR (manual)

**Trigger:** operador digita `/tuninho-da-comlurb`, `/comlurb`, "comlurb", "faxina",
"fim de sessao", ou qualquer sinonimo de encerramento.

**Quando usar:** sempre antes de dar `/clear` em operacao DDCE em andamento, ou
ao encerrar sessao de trabalho significativa (mesmo fora de DDCE).

**Output:** painel "FAXINA COMPLETA" com seal + recomendacao `/clear`.

### Modo 2 — PRE-COMPACTACAO (automatico via hook PreCompact)

**Trigger:** Claude Code detecta que vai auto-compactar (chega em ~85% do context).

**Como:** `tuninho-hook-pre-compact.py` invoca esta skill em modo headless. Se
ritual OK: bloqueia auto-compact (exit 2) e recomenda `/clear`. Se falhar: permite
auto-compact como fallback.

**Safeguard:** cooldown de 60s entre execucoes pra evitar loops.

### Modo 3 — GATE-GUARD (automatico invocado pelo tuninho-ddce)

**Trigger:** tuninho-ddce invoca ao fim de cada GATE (DISCOVER, DEFINE, cada fase).

**Duas variantes:**
- **Light:** sincroniza JSONL + atualiza HANDOFF + atualiza pendency-ledger. NAO
  sela. NAO recomenda `/clear`. Apenas garante que o estado esta em disco.
- **Full:** ritual completo (inclui seal + recomendacao de `/clear`) quando o
  operador decide pausar/continuar em nova sessao ao fim do gate.

### Modo 4 — SELO FINAL DE OPERACAO (apos escriba)

**Trigger:** tuninho-ddce Etapa 17 (nova em v4.1.0) invoca apos tuninho-escriba
ter completado documentacao.

**Funcao:** faxina final + seal `operation_sealed: true` no README da operacao.
Pacote de encerramento: JSONLs de todas as sessoes + vault + artefatos DDCE
consolidados. Operacao fica **imutavel**.

### Modo 5 — EMERGENCIAL (via hook conta-token em 85%)

**Trigger:** `tuninho-hook-conta-token` v5.0.0 detecta uso >= 85% de context.

**Funcao:** dispara Modo 1 automaticamente com nota "alerta de tokens". Nao
bloqueia nada — apenas **informa** ao operador que o Comlurb foi executado e
recomenda `/clear`.

### Modo 6 — CARD-CLOSE-SESSION (v0.3.0 — fluxo card-isolated)

**Trigger:** invocado pelo `tuninho-ddce` Etapa 16 ou `tuninho-fix-suporte`
Stage 11 ao concluir fluxo card-isolated. Substitui o Modo 4 (selo final de
operacao) quando a unidade de trabalho e 1 card, nao uma operacao DDCE multi-fase.

**Invocacao:** `Skill: tuninho-da-comlurb, args: "--mode card-close-session --card {CARD_ID} --branch {BRANCH}"`

**Funcao:** variante minimal do Modo 4 adaptada para card-isolated:

1. **Sincroniza JSONL** da sessao atual para
   `_a4tunados/_operacoes/cards/{cardId}_*/raw_sessions/` (nao `handoffs/raw_sessions/`
   da operacao DDCE, porque nao ha operacao pai)

2. **Atualiza HANDOFF** em
   `_a4tunados/_operacoes/cards/{cardId}_*/HANDOFF.md` (formato Markdown
   simples, nao YAML) com:
   ```markdown
   # HANDOFF — Card {cardId}
   **Status**: `comlurb_sealed: true`
   **Branch**: `{branch}`
   **PR**: {pr_url}
   **Deploy**: `autonomous-report-{ts}.md`
   **Mural**: card marcado `done` + comentario postado
   **Contract compliance**: 100% ({N} obligations DELIVERED)
   **Selado em**: {ISO_TS}
   **Proxima sessao**: _none_ (card entregue — nada pendente)
   ```

3. **Reconcilia pendency-ledger** do card: se ha
   `_a4tunados/_operacoes/cards/{cardId}_*/pendency-ledger.yaml`, marcar
   todas as pendencias scoped ao card como `closed`.

4. **Invoca tuninho-qa audit-card-isolation** (OBL-QA-CARD-ISOLATION
   do contrato) — **OBRIGATORIO**. Se FAIL, seal NAO e aplicado, contrato
   fica `BREACHED`.

5. **Aplica seal no HANDOFF** + apresenta painel minimal:
   ```
   ╔═══════════════════════════════════════════════════╗
   ║   🧹 CARD FECHADO — Tuninho da Comlurb v0.3.0    ║
   ║                                                   ║
   ║  Card:     {cardId} — {titulo}                   ║
   ║  Branch:   {branch}                               ║
   ║  PR:       {pr_url}                               ║
   ║  Mural:    done + comentario postado             ║
   ║  Contract: FULFILLED (100%)                       ║
   ║                                                   ║
   ║  ✅  Pode dar /clear. Sem pendencias.            ║
   ╚═══════════════════════════════════════════════════╝
   ```

**Briefing para proxima sessao** (v0.7.0+ — branching condicional):

- **Se nao ha trabalho pos-seal**: explicitamente `_none_` — card esta entregue,
  nao ha contexto para transitar. Hook `tuninho-hook-inicio-sessao` em nova
  sessao avisa: "Card {id} foi entregue em {data}. Mural atualizado. PR aberto:
  {url}. Nenhuma acao pendente — trabalhe em outra branch ou feche."

- **Se ha trabalho pos-seal extra-op detectado** (commits novos na branch apos
  `seal_timestamp`, OU prompt do operador continuando o card): **Modo 6 invoca
  Modo 7 automaticamente**, que refunde `HANDOFF.md` com a estrutura rigorosa
  da Regra SEAL-005 (drift-check + itens extra-op + comandos-zero +
  historico de seals append-only). NUNCA cria `HANDOFF_*.md` paralelo.

**Diferencas vs Modo 4**:
- Modo 4 sela OPERACAO DDCE (multi-card, multi-fase) em
  `_a4tunados/_operacoes/projetos/{NN}_*/handoffs/HANDOFF*.yaml`
- Modo 6 sela CARD isolado em `_a4tunados/_operacoes/cards/{cardId}_*/HANDOFF.md`
- Modo 4 invoca tuninho-escriba modo `multi-sessao-audit` para gerar docs
  consolidados; Modo 6 invoca tuninho-escriba modo default com branch
  `card/*` detectada (v3.11.1) — docs em `docs_{proj}/cards/{cardId}_*/`
- Modo 4 briefing extensivo (proxima sessao continua operacao); Modo 6
  briefing minimal (card done, nada continua)

---

## Responsabilidades (5 passos do ritual)

### 1. Sincronizar JSONL da sessao atual

**Origem:** `~/.claude/projects/{slug-do-projeto}/{session_uuid}.jsonl`

**Destino:** `_a4tunados/_operacoes/projetos/{NN}_{nome}/handoffs/raw_sessions/{YYYY-MM-DD}_sessao_{NN}_{uuid_curto}.jsonl`

**Diferenca vs tuninho-portas-em-automatico:**
- Portas roda no INICIO da sessao — copia JSONLs das sessoes anteriores
- Comlurb roda no FIM da sessao — copia o JSONL da sessao ATUAL (que ainda esta sendo escrito)

**Script:** `scripts/sync-jsonl-final.sh`

### 2. Atualizar HANDOFF incrementalmente

**Ler:** HANDOFF da sessao atual em `handoffs/HANDOFF_{YYYY-MM-DD}_sessao_{NN}.yaml`.

**Atualizar/popular os campos:**
- `encerramento` (timestamp iso-8601 do momento da faxina)
- `estado_final` (resumo de 200 palavras do que foi feito)
- `proximos_passos_sessao_N+1` (primeira acao concreta + 2-3 acoes seguintes)
- `briefing_proxima_sessao` (150 palavras que a proxima sessao vai ler automaticamente)
- `raw_sessions_coletadas` (atualizar com JSONL da sessao atual)
- `decisoes_tomadas` (lista de decisoes-chave desta sessao com timestamps)
- `arquivos_modificados` (lista de paths)
- `pendencias_abertas` (referencia ao pendency-ledger)

**Se HANDOFF nao existe:** criar a partir do template.

**Script:** `scripts/atualizar-handoff.py`

### 3. Reconciliar pendency-ledger

**Arquivo:** `_a4tunados/_operacoes/projetos/{NN}_{nome}/pendency-ledger.yaml`

**Acoes:**
- Para cada pendencia com `origem_sessao: sessao_N-1` ou anterior: verificar se
  esta `closed`, `deferred`, ou ainda `open`. Se ainda `open` sem atualizacao
  nesta sessao: marcar como `silenciosamente_carregada` (warning).
- Novas pendencias detectadas nesta sessao: adicionar com `origem_sessao: sessao_N`.
- Pendencias resolvidas: marcar `status: closed` + `fechada_em_sessao: sessao_N`.

**Nota:** o agente deve informar explicitamente quais pendencias foram fechadas.
O script nao infere — ele apenas consolida o que foi declarado no HANDOFF.

**Script:** `scripts/reconciliar-pendency-ledger.py`

### 4. Invocar tuninho-qa para validacao

**Modos QA invocados em sequencia:**
1. `audit-handoff` — checa consistencia do HANDOFF
2. `audit-continuidade` (novo em v0.6.0) — valida pendency-ledger + referencia JSONL
3. `audit-handoff-freshness` (sub-check) — timestamp do HANDOFF vs ultimo review.md

**Se QA FAIL:** ritual BLOQUEADO. Lista gaps + instrucoes concretas + **NAO aplica
seal + NAO recomenda /clear**.

**Se QA PASS:** prossegue para passo 5.

### 5. Aplicar seal + apresentar painel

**Seal:** adicionar no HANDOFF:
```yaml
comlurb_sealed: true
seal_timestamp: "{iso-8601}"
seal_version: "v0.1.0"
seal_mode: "faxina-pre-clear" | "pre-compact" | "gate-guard-full" | "selo-final-operacao" | "emergencial-85pct"
seal_qa_result:
  audit_handoff: PASS
  audit_continuidade: PASS
  audit_handoff_freshness: PASS
```

**Painel final:**
```
╔══════════════════════════════════════════════════════════════╗
║   🧹 FAXINA COMPLETA — Tuninho da Comlurb v0.1.0             ║
╠══════════════════════════════════════════════════════════════╣
║ Operacao:    {NN}_{nome}
║ Sessao:      sessao_{NN} ({data})
║ Modo:        {modo}
║
║ Sincronizado:
║   • JSONL sessao atual: {nome_arquivo} ({tamanho})
║   • Plan files:         {N} copiados
║
║ HANDOFF atualizado: handoffs/HANDOFF_{data}_sessao_{NN}.yaml
║   • estado_final:           ✅
║   • proximos_passos:        ✅ ({N} acoes listadas)
║   • briefing_proxima:       ✅ (150 palavras)
║   • raw_sessions:           ✅ atualizado
║   • pendencias:             {M} abertas, {K} fechadas
║
║ Validacao QA:
║   ✅ audit-handoff:          PASS
║   ✅ audit-continuidade:     PASS
║   ✅ audit-handoff-freshness: PASS
║
║ SEAL APLICADO: comlurb_sealed: true ({timestamp})
║
║ STATUS: ✅ PODE DAR /clear AGORA
║
║ A proxima sessao recebera briefing automatico de
║ {NNN} palavras via tuninho-hook-inicio-sessao v4.3.0+.
║ Voce nao vai perder contexto.
╚══════════════════════════════════════════════════════════════╝

Digite /clear quando estiver pronto.
```

**Se QA FAIL, o painel e diferente:**
```
╔══════════════════════════════════════════════════════════════╗
║   🚨 FAXINA INCOMPLETA — NAO DE /clear AGORA                 ║
╠══════════════════════════════════════════════════════════════╣
║ Gaps detectados:
║   ❌ {descricao do gap 1}
║      Acao: {acao concreta}
║   ❌ {descricao do gap 2}
║      Acao: {acao concreta}
║
║ Resolva os gaps acima e invoque /tuninho-da-comlurb de novo.
║ NAO aplicarei seal enquanto houver gaps — isso e proposital.
║ O seal serve como garantia formal de continuidade.
╚══════════════════════════════════════════════════════════════╝
```

**Script:** `scripts/aplicar-seal.py`

---

## Integracoes

| Skill/hook | Como integra |
|---|---|
| **tuninho-hook-pre-compact** (novo v0.1.0) | Invoca Comlurb em modo `pre-compact` antes de auto-compact. Se seal aplicado: bloqueia auto-compact (exit 2). |
| **tuninho-hook-conta-token v5.0.0** | Em 85% de contexto: injeta via `additionalContext` sugestao de invocar `/tuninho-da-comlurb`. Nao bloqueia tools. |
| **tuninho-hook-inicio-sessao v4.3.0** | Detecta `comlurb_sealed: true` no HANDOFF anterior. Se sim: injeta briefing forcado no `additionalContext` da sessao nova, pede que agente apresente briefing antes de qualquer trabalho. |
| **tuninho-qa v0.6.0** | Invocado nos passos 4 do ritual. Novo modo `audit-continuidade` + 3 sub-checks: `audit-handoff-freshness`, `audit-comlurb-seal`, `audit-briefing-pendente`. |
| **tuninho-ddce v4.1.0** | Etapa 17 (nova) invoca Comlurb em modo `selo-final-operacao` apos Etapa 16 (escriba). Cada GATE invoca em modo `gate-guard` (light por default, full se operador escolhe "continuar em nova sessao"). |
| **tuninho-escriba v3.11.0** | Novo modo `multi-sessao-audit` que le raw_sessions JSONLs sincronizados pelo Comlurb para gerar timeline cross-sessao. |
| **tuninho-portas-em-automatico v0.1.0** | Complementar — Portas roda no INICIO (le raw_sessions anteriores), Comlurb roda no FIM (escreve raw_session atual). |

---

## Limitacoes honestas (v0.1.0)

1. **NAO executa `/clear` automaticamente** — e restricao do Claude Code CLI, operador digita. O painel final recomenda o comando claramente.
2. **Detecta a sessao atual via** `session_id` passado pelo hook ou derivado do JSONL mais recente em `~/.claude/projects/{slug}`. Edge case: se o projeto nao tem JSONL ainda (sessao nova com zero prompts), skip sync JSONL.
3. **O JSONL da sessao atual** ainda esta sendo escrito no momento da faxina. Copiamos como `_partial`. Apos `/clear`, o Claude Code fecha o JSONL e o `tuninho-portas-em-automatico` na proxima sessao pode substituir a copia `_partial` pela versao final.
4. **Pendency reconciliation** nao e automatica — depende do agente declarar no HANDOFF quais pendencias foram fechadas nesta sessao. O script apenas consolida declaracoes.
5. **Nao bloqueia `/clear`** se Comlurb nao foi rodado — Claude Code nao expoe gate pra isso. Defesa: hook `tuninho-hook-inicio-sessao v4.3.0` detecta na proxima sessao se HANDOFF nao tem seal e alerta.

---

## Regras Inviolaveis

| # | Regra |
|---|-------|
| 1 | **NUNCA aplicar seal sem PASS objetivo do QA** — se `audit-handoff` ou `audit-continuidade` falha, ritual BLOQUEADO. |
| 2 | **NUNCA sobrescrever JSONLs sincronizados** — append-only. Se JSONL ja existe com mesmo nome: usar sufixo `_v2`, `_v3`. |
| 3 | **NUNCA editar HANDOFF de sessao anterior** — apenas HANDOFF da sessao corrente. Sessoes anteriores sao imutaveis. |
| 4 | **NUNCA recomendar `/clear`** se o ritual falhou — deixar claro que operador NAO deve dar /clear. |
| 5 | **SEMPRE incluir briefing para proxima sessao** no HANDOFF — 150 palavras minimo, acionaveis. |
| 6 | **SEMPRE registrar modo de invocacao** no seal (manual/pre-compact/gate-guard/selo-final/emergencial) para auditoria. |
| 7 | **SEMPRE atualizar raw_sessions/** com JSONL da sessao corrente — e a unica defesa contra perda ao `/clear`. |
| 8 | **SEMPRE invocar tuninho-qa** nos passos 4 — a skill NAO tem autoridade pra decidir "ta tudo certo" sem o QA. |
| **SEAL-003** | **SEVERIDADE ALTA — INVIOLAVEL: NUNCA aplicar seal de operacao** (`comlurb_sealed: true` em modo `selo-final-operacao` OU equivalente em outros modos) **sem que o tuninho-escriba tenha rodado completo na operacao em questao.** Validacao via `tuninho-qa audit-escriba-coverage` (sub-check obrigatorio em `audit-gate-final`). FAIL bloqueia seal sem excecao. Motivacao: operacao 05 (tuninho.ai, 2026-04-23) detectou que escriba pode rodar parcialmente (sessao + changelog OK, mas faltando ADRs em `decisoes/` + docs em `implementacao/` + atualizacao de `report-executivo.md`). Sem validacao mecanica, gaps documentais passam batido e selamos como OK operacoes ainda pendentes. **Escriba e a espinha dorsal documental das operacoes.** |
| **SEAL-005** | **SEVERIDADE ALTA — INVIOLAVEL (v0.7.0): HANDOFF.md e fonte UNICA de verdade em fluxo card-isolated.** **PROIBIDO** criar arquivos paralelos como `HANDOFF_post_seal_extra_op.md`, `HANDOFF_continuation.md`, `HANDOFF_v2.md`, etc. Trabalho pos-`comlurb_sealed: true` que estenda o card DEVE refundir o `HANDOFF.md` principal via Modo 7 (post-seal extra-op handoff): drift-check obrigatorio com comandos exatos + itens extra-op com comando-zero copy-paste + decisoes operacionais explicitas (branch policy, PR policy, versionamento) + historico de seals append-only + conteudo critico fora do JSONL. Excecoes permitidas: `HANDOFF.md.bak-{ts}` (backup mecanico) e `HANDOFF_archive_v{N}.md` (snapshot historico imutavel apos refundicao). Validacao: `tuninho-qa audit-handoff-rigor` detecta arquivos paralelos competindo por verdade e BLOQUEIA seal. Motivacao: Card 134 post-seal (tuninho.ai, 2026-04-30) — sessao seguinte teve que descobrir `HANDOFF_post_seal_extra_op.md` via `find` por padrao porque `HANDOFF.md` principal dizia `Proxima sessao: _none_`. Sem regra rigorosa, retomada pos-`/clear` e roleta russa. |

---

## Versionamento

- **Patch** (0.0.x): ajustes nos scripts, fixes
- **Minor** (0.x.0): novos modos, novos sub-checks
- **Major** (x.0.0): mudanca fundamental no ritual

### Historico

- **v0.7.0** (2026-04-30): **MINOR — Modo 7 (post-seal extra-op handoff) + Regra Inviolavel SEAL-005.** Aprendizado canonico Card 134 post-seal (tuninho.ai, 2026-04-30): apos `comlurb_sealed: true` aplicado, sessao seguinte continuou em modo extra-operacao (descricoes de cards 137/138 + bug DnD board Dev + otimizacao DDCE). HANDOFF foi atualizado em arquivo paralelo `HANDOFF_post_seal_extra_op.md`, deixando `HANDOFF.md` original com `Proxima sessao: _none_` — contradicao silenciosa que sessao pos-clear so descobriu via `find HANDOFF*`. **6 causas raiz catalogadas**: arquivos paralelos competindo por verdade, estado declarado vs real divergente (sem drift-check), conteudo critico apenas no JSONL (volatil), cards relacionados nao registrados no manifest, comandos-zero ausentes, decisoes implicitas (branch/PR/version policy). **Mudancas**: (1) Modo 6 ganha branching condicional pos-seal — invoca Modo 7 quando `comlurb_sealed: true` + trabalho ativo. (2) Modo 7 NOVO refunde `HANDOFF.md` com estrutura rigorosa: drift-check obrigatorio com comandos exatos + itens extra-op com comando-zero copy-paste + decisoes operacionais explicitas + historico de seals append-only + conteudo critico fora do JSONL. (3) Regra Inviolavel SEAL-005: `HANDOFF.md` e fonte UNICA de verdade — proibido criar paralelos. Excecoes: `HANDOFF.md.bak-{ts}` (backup mecanico) e `HANDOFF_archive_v{N}.md` (snapshot historico imutavel). (4) Validacao delegada ao `tuninho-qa audit-handoff-rigor` (sub-check futuro). Garantia: nenhuma sessao pos-`/clear` em fluxo card-isolated retoma trabalho como roleta russa.

- **v0.4.0** (2026-04-23): **MINOR — Regra Inviolavel SEAL-003 (severidade ALTA): escriba obrigatorio no seal final.** Operacao 05 do tuninho.ai (`05_seletor-modelo-admin`) detectou na sessao 10 (follow-up) que escriba rodou parcial — sessao 09 + changelog v1.9.0 entregues durante a operacao, mas **3 etapas obrigatorias estavam faltando**: ADRs estruturados em `decisoes/`, docs em `implementacao/` da camada nova de codigo, e atualizacao do `report-executivo.md`. Op 05 estava com `comlurb_sealed: true` aplicado em 19:56Z (sessao 02) sem que essas etapas tivessem sido validadas mecanicamente. Operador classificou explicitamente: "escriba eh a espinha dorsal das nossas operacoes". Mudancas: (1) Nova regra inviolavel SEAL-003 documentada na tabela de regras. (2) Validacao delegada ao `tuninho-qa audit-escriba-coverage` (sub-check do `audit-gate-final` na qa v0.9.0+). (3) Aplicar-seal NAO procede sem PASS desse sub-check em qualquer modo de seal final (selo-final-operacao, gate-guard-full, card-close-session). (4) Mensagem de FAIL deve indicar exatamente quais etapas do escriba faltam (ADRs? docs implementacao? report-executivo? MOCs?). Garantia: nenhuma operacao futura pode ser selada como OK sem documentacao retroativa completa.

- **v0.3.0** (2026-04-22): MINOR — novo **Modo 6 `card-close-session`** para
  fluxo card-isolated (DDCE v4.4.0 / fix-suporte v2.1.0). Variante minimal do
  Modo 4: sela card em `_a4tunados/_operacoes/cards/{cardId}_*/HANDOFF.md`
  (Markdown, nao YAML), invoca tuninho-qa `audit-card-isolation` como OBL
  obrigatoria, reconcilia pendency-ledger scoped ao card, briefing minimal
  para proxima sessao (`_none_` — card entregue). Invocado por DDCE Etapa 16
  e fix-suporte Stage 11 apos deploy+PR+mural concluidos. Parte da Op 04
  card-isolated (suite v5.7.0).

- **v0.2.0** (2026-04-22): MINOR — flag de escape `.claude/.comlurb-active`
  para cooperar com hook `tuninho-hook-conta-token` v5.1.0. Em 85%+ de
  contexto o hook bloqueia tools fora da whitelist; quando Comlurb esta
  rodando, o flag libera TODAS as tools pelo hook para que os scripts de
  atualizacao (atualizar-handoff.py, reconciliar-pendency-ledger.py, etc)
  possam editar arquivos sem esbarrar no bloqueio. Flag e criado via
  `touch` no inicio do faxina.sh e removido automaticamente via `trap EXIT`
  (TTL de 10min no hook para detectar rituais travados). Parte da resposta
  a L-REV-7 (Op 03 go-live 2026-04-22): sessao travou em 97.8% apos agente
  ignorar avisos nao-bloqueantes de v5.0.0.

- **v0.1.0** (2026-04-21): Versao inicial. Criada no Plano B Ideal Completo
  pre-Op 03 do tuninho.ai. 5 modos de operacao, 5 passos do ritual, 8 regras
  inviolaveis. Integracao com hook pre-compact (novo), hook conta-token v5.0.0,
  hook inicio-sessao v4.3.0, tuninho-qa v0.6.0, tuninho-ddce v4.1.0, escriba v3.11.0.

---

## Estrutura da skill

```
.claude/skills/tuninho-da-comlurb/
├── SKILL.md                              (este arquivo)
├── scripts/
│   ├── faxina.sh                         (entry-point orquestrador)
│   ├── sync-jsonl-final.sh               (passo 1)
│   ├── atualizar-handoff.py              (passo 2)
│   ├── reconciliar-pendency-ledger.py    (passo 3)
│   ├── aplicar-seal.py                   (passo 5)
│   └── apresentar-painel.py              (output final)
├── references/
│   ├── seal-spec.md                      (schema do seal)
│   ├── ritual-completo.md                (passo-a-passo detalhado)
│   ├── pendency-ledger-schema.md         (schema do ledger)
│   └── licoes-aprendidas.md              (vazia inicialmente)
└── projects/                             (sidecars futuros)
```

---

*Tuninho da Comlurb v0.7.0 — a4tunados-ops-suite | Modo 7 post-seal extra-op handoff + Regra SEAL-005 (HANDOFF.md fonte unica) — retomada pos-`/clear` rigorosa com drift-check + comando-zero + decisoes explicitas (Card 134 post-seal, 2026-04-30).*
