# Tuninho Git Flow d'a4 v5.2.0

## v5.2.0 — `--merge` e DEFAULT + recovery `merge -s ours` pos-squash (Card 1768688081252124096 — 4a iteracao 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (4a iteracao Card 124096)**:

Operador inspecionou git graph apos v5.1.0 e detectou que **mesmo com tag
archive criada**, o squash merge introduz GAP de ancestralidade git: o
ultimo commit da branch (apontado pela tag) NAO e ancestral de develop —
fica orfao, conectado so via tag (preserva conteudo) mas sem a relacao de
paternidade git no graph.

```
ANTES (v5.1.0 squash + tag, com GAP):
  develop ──── 0379dff (squash linear, sem 2 parents)
                                                  
                            (orfao, conectado so via tag)
                            97b2a7c ←── tag archive/<branch>
```

```
DEPOIS (v5.2.0 merge default OU recovery merge -s ours):
  develop ──── M (merge commit, 2 parents)
              /│
             0379dff   97b2a7c ←── tag archive/<branch>
                       (ancestral de develop via parent #2)
```

Operador verbatim 2026-05-06 (4a iteracao):
> "Aqui reflete o develop referenciando ao commit la de tras ao inves de
> incorporar o mais recente que foi tagueado. Nosso gitflow nao e assim.
> Precisamos da trilha concreta devolvendo o ultimo para develop. Parece
> estar tudo certo, menos essa ultima 'perna' no trilho faltante que
> devolve o commit da branch tagueada para develop."

### Mudanca v5.2.0 — `--merge` e o DEFAULT (Politica 2 reescrita)

A politica anterior (v5.1.0) tinha `--squash` como caminho mais curto
quando branch tinha ≤2 commits. Nova politica:

| Cenario | Estrategia | Razao |
|---------|-----------|-------|
| **DEFAULT** (qualquer branch principal: card/feat/*, card/fix/*, op/*, feat/*) | **`--merge` no-fast-forward** | Preserva ancestralidade nativamente — commit da branch vira parent #2 do merge commit em develop. Sem GAP. |
| Branch com 1 commit unico atomico SEM marcos historicos (ex: chore tipografico, fix bug em ramo solto chore/*) | `--squash` | Aceitavel apenas quando o commit e' atomico e nao representa marco. |
| Recovery pos-squash (caso operador ja fez --squash sem ancestralidade) | `git merge -s ours --no-ff archive/<branch>` em develop | Cria merge commit com 2 parents, NAO altera arquivos (ja estao em develop via squash), so re-conecta ancestralidade. |

**Razao da inversao**: GAP de ancestralidade git e regressao silenciosa do
gitflow — `git log --graph` em develop nao mostra os marcos da branch.
Tag archive **preserva conteudo** mas NAO a paternidade. So `--merge` (ou
recovery `merge -s ours`) preserva AMBOS.

### POLITICA 1 reforcada — Tag `archive/<branch>` continua OBRIGATORIA

Mesmo com `--merge` default, a tag `archive/<branch>` continua sendo
criada antes da delecao. Razao: branch deletada nao e referenciavel
diretamente; a tag e o ponteiro estavel. Em git graph, a tag mostra o
nome da branch original (rotulo) e o merge commit mostra a relacao
ancestral. Os dois mecanismos sao COMPLEMENTARES:

- **Tag archive**: ponteiro estavel + rotulo no graph
- **Merge commit (2 parents)**: ancestralidade git (commit da branch e
  ancestral de develop)

### Recovery procedure — pos-squash sem ancestralidade

Se operador (ou agente) ja aplicou `--squash --delete-branch` sem `--merge`:

```bash
# 0. Pre-condicao: tag archive/<branch> ja existe (ou pode ser criada
#    a partir do ultimo commit conhecido da branch local/reflog)

# 1. Verificar GAP
git -C $WORKSPACE_DEVELOP merge-base --is-ancestor archive/$BRANCH develop && \
  echo "JA E ANCESTRAL (gap fechado)" || \
  echo "GAP CONFIRMADO — proceder recovery"

# 2. Aplicar merge -s ours em develop (NAO altera arquivos)
cd $WORKSPACE_DEVELOP
git checkout develop
git merge -s ours --no-ff archive/$BRANCH -m "Merge tag 'archive/$BRANCH' into develop (preserva ancestralidade pos-squash)"
git push origin develop

# 3. Validar
git merge-base --is-ancestor archive/$BRANCH develop && \
  echo "RECOVERY PASS — ancestralidade restaurada"
git log --oneline --graph -5
```

**Nota tecnica `-s ours`**: estrategia ours faz com que o resultado do
merge seja igual ao parent #1 (develop atual). Conteudo de arquivos
nao muda — todos os arquivos da branch ja estao em develop via squash.
A unica mudanca e estrutural: develop ganha 1 commit novo (merge commit)
com 2 parents, restaurando a relacao ancestral.

### Modo `--auto-merge-on-approval` v5.2.0 (atualizado)

```bash
PR_NUMBER={detectado via gh pr list}
BRANCH={detectado}
WORKSPACE_DEVELOP={resolvido}

# DECISAO DE ESTRATEGIA (Politica 2 v5.2.0 — merge eh default)
COMMIT_COUNT=$(git -C $WORKSPACE_DEVELOP rev-list --count develop..$BRANCH 2>/dev/null || echo 0)

# Branches principais (card/feat, card/fix, op/, feat/) sempre --merge
case "$BRANCH" in
  card/feat/*|card/fix/*|op/*|feat/*)
    STRATEGY="merge"  # default petreo
    ;;
  chore/*|tmp/*|wip/*)
    [[ $COMMIT_COUNT -eq 1 ]] && STRATEGY="squash" || STRATEGY="merge"
    ;;
  *)
    [[ $COMMIT_COUNT -le 2 ]] && STRATEGY="squash" || STRATEGY="merge"
    ;;
esac
echo "[git-flow-dafor v5.2.0] strategy=$STRATEGY (branch=$BRANCH commits=$COMMIT_COUNT)"

# Fase 0 — TAGUEAMENTO ARCHIVE (Politica 1) ANTES de deletar branch
LAST_COMMIT=$(git -C $WORKSPACE_DEVELOP rev-parse origin/$BRANCH)
git -C $WORKSPACE_DEVELOP tag -a archive/$BRANCH $LAST_COMMIT -m "Archive — $BRANCH..."
git -C $WORKSPACE_DEVELOP push origin archive/$BRANCH

# Fase 1 — merge no remoto com strategy correta
gh pr merge $PR_NUMBER --$STRATEGY --delete-branch

# Fase 2 — sync develop local
cd $WORKSPACE_DEVELOP
git fetch origin develop --quiet
git checkout develop
git pull --ff-only origin develop

# Fase 3 — VALIDAR ANCESTRALIDADE (NOVO v5.2.0)
git merge-base --is-ancestor archive/$BRANCH develop && \
  echo "ancestralidade OK" || {
    echo "GAP detectado pos-merge — aplicar recovery merge -s ours"
    git merge -s ours --no-ff archive/$BRANCH \
      -m "Merge tag 'archive/$BRANCH' into develop (preserva ancestralidade pos-squash)"
    git push origin develop
  }

# Fase 4 — sync verify
[[ "$(git rev-parse develop)" == "$(git rev-parse origin/develop)" ]] || ABORT

# Fase 5 — limpar branch remota se ainda existe
git ls-remote origin $BRANCH 2>/dev/null | grep -q . && git push origin --delete $BRANCH

# Fase 6 — validar tag
git ls-remote origin "refs/tags/archive/$BRANCH" 2>/dev/null | grep -q . || WARN

cd - >/dev/null
echo "auto-merge-on-approval PASS"
```

### Cooperacao downstream

| Skill | Bump cooperativo | Mudanca |
|-------|------------------|---------|
| `tuninho-qa` | v5.3.0 → v5.4.0 | sub-check `audit-tag-archive-is-ancestor` valida que tag e ancestral de develop pos-merge |
| `tuninho-da-comlurb` | v5.0.5 → v5.0.6 | pre-check inclui audit-tag-archive-is-ancestor |

### Anti-padroes adicionais rejeitados

- "Squash + tag = mesma coisa que merge" — falso. Tag preserva conteudo
  mas NAO a relacao ancestral. So merge commit (2 parents) preserva ambos.
- "Merge commit polui o graph com linhas paralelas" — pelo contrario:
  graph com merge commits CONTA a historia. Linear graph com squash MENTE.
- "Recovery merge -s ours muda arquivos" — falso. Estrategia ours preserva
  parent #1 (develop atual) — zero mudanca de arquivos, so re-conecta
  ancestralidade.

---

## v5.1.0 — Politica `archive/<branch>` + criterio squash vs merge (Card 1768688081252124096 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (3a iteracao Card 124096)**:

Operador detectou regressao critica do storytelling git: ao fazer
`gh pr merge --squash --delete-branch` no PR #48 (que tinha **7 commits**
representando iteracoes v0.6.1→v0.6.2→v0.6.3 + fixes pos-deploy + comlurb
seal), o squash esmagou tudo em **1 unico commit em develop**, perdendo:

1. Marcos historicos das iteracoes (impossivel ver "quando o fix max_turns
   foi feito" no graph)
2. Storytelling do post-deploy (fixes apos validacao humana ficaram invisiveis)
3. Branch deletada do remoto sem tag `archive/...` apontando pro ultimo commit
   (ja era convencao estabelecida — 10+ tags `archive/*` no repo)

Operador verbatim 2026-05-06 (3a iteracao):
> "Cara, reveja essa correcao pois varios commits ficaram fora, o que e
> mais grave ainda. E tb tinhamos uma politica de tatueamento das principais
> branches quando deletadas, apenas as principais como card para nao
> perdermos os marcos historicos. Reveja a fundo essa politica pois o git
> graph que vi nao me agradou."

### Mudanca v5.1.0 — duas politicas combinadas

#### POLITICA 1 — Tagueamento `archive/<branch>` OBRIGATORIO antes de deletar

Antes de qualquer `gh pr merge --delete-branch` ou `git push origin --delete`,
criar tag anotada apontando pro **ultimo commit da branch**:

```bash
LAST_COMMIT=$(git -C $WORKSPACE rev-parse $BRANCH)
git -C $WORKSPACE tag -a archive/$BRANCH $LAST_COMMIT -m "Archive — Card $CARD_ID

Branch original: $BRANCH (deletada apos merge PR #$PR_NUMBER)
Ultimo commit: $LAST_COMMIT
Merge em develop: $MERGE_COMMIT (PR #$PR_NUMBER, $TIMESTAMP)

Storytelling preservado dos commits da branch:
$(git log --oneline $BASE..$LAST_COMMIT)

Estrategia 1 (CLAUDE.md): 'archive/* (tags) — branches mergeadas
arquivadas — preserva storytelling sem poluir git branch'."

git -C $WORKSPACE push origin archive/$BRANCH
```

**Aplicacao**: APENAS para branches **principais** (cards). Patterns inclusos:
- `card/feat/<slug>-<id6>` — fluxo card-isolated DDCE feature
- `card/fix/<slug>-<id6>` — fluxo card-isolated DDCE fix
- `op/<NN>-<slug>` — operacoes DDCE NORMAL
- `feat/<slug>` — features de longo prazo

NAO se aplica a:
- `chore/*` ramos efemeros (sem marco historico)
- `tmp/*`, `wip/*` branches descartaveis

#### POLITICA 2 — Criterio squash vs merge

Decisao entre estrategias de merge baseada no numero de commits da branch:

| Cenario | Estrategia | Comando |
|---------|-----------|---------|
| Branch ≤2 commits, entrega unica/atomica | `--squash` | `gh pr merge --squash --delete-branch` |
| Branch ≥3 commits OU iteracoes pos-deploy (≥2 bumps de versao) | `--merge` | `gh pr merge --merge --delete-branch` |
| Branch com `comlurb_sealed: true` historico (Card-isolated com selo final) | `--merge` SEMPRE | preserva marcos das iteracoes pos-validacao |
| Branch com `human_validated_at` + commits **apos** aprovacao | `--merge` SEMPRE | preserva o post-seal extra-op (Modo 7 SEAL-005) |

**Razao**: `--merge` cria merge commit em develop com 2 parents — os commits
da branch ficam acessiveis no `git log --graph` em linhas paralelas. Storytelling
preservado nativamente. `--squash` so e adequado quando a branch e atomica
(mensagem unica representa o trabalho inteiro).

#### Modo `--auto-merge-on-approval` ATUALIZADO

Sequencia idempotente v5.1.0 (incorpora Politicas 1 e 2):

```bash
# Pre-condicoes
PR_NUMBER={detectado via gh pr list}
BRANCH={detectado via git branch --show-current OU PR head}
WORKSPACE_DEVELOP={resolvido via Regra Inviolavel #72}

# DECISAO DE ESTRATEGIA (Politica 2)
COMMIT_COUNT=$(git -C $WORKSPACE_DEVELOP rev-list --count develop..$BRANCH)
HAS_VERSION_BUMPS=$(git -C $WORKSPACE_DEVELOP log develop..$BRANCH --oneline | grep -cE "v[0-9]+\.[0-9]+\.[0-9]+")
HAS_COMLURB_SEAL=$(git -C $WORKSPACE_DEVELOP log develop..$BRANCH --oneline | grep -ic "comlurb.*seal" || echo 0)

if [[ $COMMIT_COUNT -le 2 && $HAS_VERSION_BUMPS -le 1 && $HAS_COMLURB_SEAL -eq 0 ]]; then
  STRATEGY="squash"
else
  STRATEGY="merge"
fi
echo "[git-flow-dafor v5.1.0] strategy=$STRATEGY (commits=$COMMIT_COUNT bumps=$HAS_VERSION_BUMPS seal=$HAS_COMLURB_SEAL)"

# Fase 0 (NOVA) — TAGUEAMENTO ARCHIVE (Politica 1) ANTES de deletar branch
LAST_COMMIT=$(git -C $WORKSPACE_DEVELOP rev-parse origin/$BRANCH)
git -C $WORKSPACE_DEVELOP tag -a archive/$BRANCH $LAST_COMMIT -m "Archive — $BRANCH

Branch deletada apos merge PR #$PR_NUMBER (strategy=$STRATEGY).
Ultimo commit: $LAST_COMMIT
$(git -C $WORKSPACE_DEVELOP log --oneline ${BASE_BRANCH:-develop}..$LAST_COMMIT)
"
git -C $WORKSPACE_DEVELOP push origin archive/$BRANCH

# Fase 1 — merge no remoto com strategy correta
gh pr merge $PR_NUMBER --$STRATEGY --delete-branch
# Excecao tratada: se gh falhar com "develop is already used by worktree at X",
# o merge ainda ocorre no remoto — sucesso.
# Se --delete-branch falhar (branch ja foi deletada): seguir.

# Fase 2 — sync develop local
cd $WORKSPACE_DEVELOP
git fetch origin develop --quiet
git checkout develop
git pull --ff-only origin develop

# Fase 3 — verificar
LOCAL=$(git rev-parse develop)
REMOTE=$(git rev-parse origin/develop)
[[ "$LOCAL" == "$REMOTE" ]] || ABORT "FF develop falhou"

# Fase 4 — limpar branch remota se ainda existe
git ls-remote origin $BRANCH 2>/dev/null | grep -q . && \
  git push origin --delete $BRANCH

# Fase 5 — validar tag archive existe
git ls-remote origin "refs/tags/archive/$BRANCH" 2>/dev/null | grep -q . || \
  WARN "Tag archive nao foi pushada — investigar"

cd - >/dev/null
echo "auto-merge-on-approval PASS — strategy=$STRATEGY, archive tag=archive/$BRANCH"
```

### Argumentos esperados (estendidos v5.1.0)

```
--auto-merge-on-approval
  --pr {PR_NUMBER}              (obrigatorio se nao detectavel)
  --workspace-develop {PATH}    (default: resolve via Regra #72)
  --strategy {squash|merge|auto} (default: auto — aplica Politica 2)
  --skip-archive-tag            (excecao explicita — NAO recomendado)
  --skip-delete-branch          (preserva branch remota apos merge)
  --dry-run                     (mostra o que faria sem executar)
```

### Anti-padroes rejeitados (3 novos)

- "Branch tinha 1 commit so, squash e ok" — pode ser, MAS sempre criar tag archive
- "Storytelling nao importa, conteudo esta em develop" — falso. Storytelling e
  auditoria temporal: "quando essa correcao foi feita?", "porque essa decisao?",
  "qual ordem das iteracoes?" so respondidas via commits intermediarios
- "Tag archive e overhead, branch nem sera consultada de novo" — quando alguem
  consulta 6 meses depois e a branch nao existe mais, perder o storytelling
  e' irreversivel. Tag e barata; perda e cara

### Cooperacao downstream (cascata)

| Skill | Bump cooperativo | Mudanca |
|-------|------------------|---------|
| `tuninho-qa` | v5.2.0 → v5.3.0 | sub-checks `audit-archive-tag-created`, `audit-pr-merge-strategy-coherence`, `audit-storytelling-preserved` |
| `tuninho-da-comlurb` | v5.0.4 → v5.0.5 | sequencia canonica inclui validacao de tag archive |

### Referencia operador 2026-05-06 (3a iteracao Card 124096)

> "Cara, reveja essa correcao pois varios commits ficaram fora, o que e
> mais grave ainda. E tb tinhamos uma politica de tatueamento das
> principais branches quando deletadas, apenas as principais como card
> para nao perdermos os marcos historicos."

---

## v5.0.3 — Modo `--auto-merge-on-approval` (Card 1768688081252124096 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador (encerramento Card 124096)**:

Operador detectou regressao do fluxo gitflow: PR #48 ficou OPEN apos validacao
humana porque a sequencia anterior assumia "operador faz merge manual". Isso
gerou develop local defasada + risco de proxima operacao herdar base velha.

### Novo modo: `--auto-merge-on-approval`

**Trigger**: invocado pela Comlurb Modo 6/Modo 4 v5.0.4+ quando
`human_validated_at` ja preenchido E o `audit-pr-merged-and-develop-synced`
da QA v5.2.0+ retorna FAIL (PR ainda OPEN).

**Sequencia automatizada** (idempotente):

```bash
# Pre-condicoes
PR_NUMBER={detectado via gh pr list --search 'card/feat/{slug}-{id6}'}
BASE={detectado: develop}
WORKSPACE_DEVELOP={resolvido via Regra Inviolavel #72 — workspace dev humano}

# Fase 1 — merge no remoto
gh pr merge $PR_NUMBER --squash --delete-branch
# Excecao tratada: se gh falhar com "develop is already used by worktree at X"
# (que e o WORKSPACE_DEVELOP), o merge ainda ocorre no remoto — sucesso.
# Verificar via gh pr view --json state pos-tentativa.

# Fase 2 — sync develop local (no workspace dev humano, NAO no card worktree)
cd $WORKSPACE_DEVELOP
git fetch origin develop --quiet
git checkout develop
git pull --ff-only origin develop

# Fase 3 — verificar
LOCAL=$(git rev-parse develop)
REMOTE=$(git rev-parse origin/develop)
[[ "$LOCAL" == "$REMOTE" ]] || ABORT "FF develop falhou — investigar manualmente"

# Fase 4 — limpar branch remota se ainda existe
git ls-remote origin {BRANCH} 2>/dev/null | grep -q . && \
  git push origin --delete {BRANCH}

cd - >/dev/null
echo "auto-merge-on-approval PASS — PR mergeado, develop local sync, branch deletada"
```

### Argumentos esperados

```
--auto-merge-on-approval
  --pr {PR_NUMBER}              (obrigatorio se nao detectavel via branch atual)
  --workspace-develop {PATH}    (default: resolve via Regra Inviolavel #72)
  --skip-delete-branch          (opcional — preserva branch remota apos merge)
  --dry-run                     (opcional — mostra o que faria sem executar)
```

### Anti-padroes rejeitados

- Tentar fazer merge sem checar `human_validated_at` — pre-aprovacao NAO autoriza merge
- Fazer merge dentro do card worktree (cwd do card) — sempre pivotar pro WORKSPACE_DEVELOP
- Pular sync local apos merge remoto — develop local desatualizada e o bug raiz que motivou v5.0.2

### Cooperacao downstream

| Skill | Como integra |
|-------|--------------|
| `tuninho-qa v5.2.0+` | sub-check `audit-pr-merged-and-develop-synced` valida pos-execucao |
| `tuninho-da-comlurb v5.0.4+` | invoca este modo automaticamente quando seal final detecta PR open |
| `tuninho-ddce` | Etapa 16.7 NOVA pos-validacao humana invoca este modo antes da Etapa 17 (Comlurb seal) |

### Referencia operador verbatim 2026-05-06

> "Pelo o que estou vendo aqui no gitgraph nao foi feito o PR do commit
> mais recente para o develop nem o merge do mesmo e sync pra develop local
> estar o mais atualizado possivel. Como isso e extremamente impactante,
> faca bump de QA para que seja uma validacao obrigatoria para encerrar a
> operacao com sucesso."

---

## v5.0.2 — Sync develop local pos-merge é PETREO (Card 1768281088850920655 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador**:

- **Encerramento de QUALQUER operação DDCE (extensiva, autônoma, card-isolated) DEVE incluir sync develop local pos-merge**: após PR mergeado em develop via `gh pr merge`, o local fica defasado (commits do merge ficam apenas em origin). É OBRIGATÓRIO `git checkout develop && git pull origin develop --ff-only` pra trazer o merge de volta pro local. Sem isso, próxima operação iniciada em develop herda base desatualizada. *Operador verbatim 2026-05-06*: *"esse fluxo que fizemos por interacoes deve ser padrao git flow no encerramento de uma operacao ddce seja extensiva, autonoma ou card isolated. a develop sempre precisa ser atualizada e syncada."*

### Nova etapa 7.6 — Sync develop local pos-merge (PETREO)

Após Etapa 7.4 (merge PR em develop via `gh pr merge`), executar OBRIGATORIAMENTE:

```bash
# 1. Checkout develop
git checkout develop

# 2. Pull fast-forward (sem merge commit local)
git pull origin develop --ff-only

# 3. Verificar sync 0 0
git rev-list --left-right --count develop...origin/develop
# Esperado: "0  0" (sem ahead, sem behind)

# 4. Verificar hash bate com origin
LOCAL=$(git rev-parse develop)
REMOTE=$(git rev-parse origin/develop)
[ "$LOCAL" = "$REMOTE" ] && echo "SYNC_OK" || echo "SYNC_FAIL: local=$LOCAL remote=$REMOTE"
```

**Se sync FAIL**: investigar antes de declarar operação encerrada. Causas possíveis:
- PR não mergeado realmente (verificar `gh pr view N --json state,mergedAt`)
- Outros commits no remote (rebase necessário)
- Branch local em outro estado (detached HEAD, branch errada)

**SEM GATE** — esta etapa roda automaticamente. Apenas reporta resultado.

### Aplicação concreta
- Sequência canônica COMPLETA modo expansivo+autonomous: `Comlurb seal Modo 6` → `tuninho-escriba (auto)` → `tuninho-git-flow-dafor (auto)` → **`sync develop local pos-merge (auto, NOVA petrea)`**
- Aplicável a TODOS os modos de operação DDCE: normal, expansivo, autônomo, card-isolated
- Próxima operação inicia em develop sempre atualizada
- Sub-check QA correlato: `audit-develop-local-synced-with-origin` (tuninho-qa v5.1.0+)

---

## v5.0.1 — Sessão 4 QA EXTREMO auto-trigger pos-escriba (Card 1768281088850920655 — 2026-05-06)

**Bump pos-mortem absorvendo regra petrea operador**:

- **Auto-trigger pelo escriba no final de modo expansivo+autonomous**: tuninho-escriba em modo `DDCE_EXPANSIVO_MULTI_SESSOES_*` deve invocar tuninho-git-flow-dafor automaticamente após Etapa RE (report executivo) pra completar ciclo: commit → merge develop --no-ff → PR develop → main. *Operador verbatim 2026-05-06*: *"faltou, e precisa ser adicionado às skills nesse modo que rodamos, chamar o escriba ao final e rodar o gitflow da for para devolver as atualizacoes feitas na branch para a develop."*

### Aplicação concreta
- Sequência canônica modo expansivo+autonomous final: `Comlurb seal Modo 6` → `tuninho-escriba auto-chamado` → **`tuninho-git-flow-dafor auto-chamado`**
- Operador NÃO precisa rodar gitflow manualmente
- Em fluxo card-isolated, este ciclo já passa por Comlurb + escriba; agora gitflow fecha automaticamente
- Branch original (card/feat/...) pode ser arquivada via `archive/*` tag (estratégia 1) após merge final

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

# Tuninho Git Flow d'a4 v0.5.2

## v0.5.2 — Cataloging a4tunados_mural state sync prod ↔ develop + protected_branches modular (Card 467499, 2026-05-04)

**Aprendizado canonico operador 2026-05-04** durante Card 1762662734295467499 (Multi-board dispatcher mural):

Operador detectou via git tree do a4tunados_mural que **deploys anteriores em prod aconteceram sem fechar git flow** (Card 1766075986438260195 deployou frontend mas nunca mergeou pra develop). Resultado: state inconsistente entre prod, develop e master.

Operador instruiu padrao DEFINITIVO para a4tunados_mural:
> *"O gitflow (por mais que seja envolvendo deploy em producao) NAO DEVE TOCAR a master. sempre a base será a develop, com o commit pr merge para develop. ela é a centralozadora de todas as operacoes. a Master é mais delicada e dewve ser mantida sem envolvimentos."*

### Mudanças v0.5.2

**1. Schema state.yaml ganha `prod_state` block**:

```yaml
prod_state:
  domain: "https://mural.a4tunados.com.br"
  ip: "{ip}"
  base_branch: "master"  # qual ref está deployada em prod
  patches_aplicados_alem_de_master:
    - card: "{cardId} ({titulo})"
      data: "{ts}"
      tipo: "{frontend bundle|backend cirurgico|migration|config}"
      escopo: "{descricao}"
      git_flow_status: "{OK|BREACHED}"  # OK se ja em develop, BREACHED se nao
      backup: "{path}"
```

Permite catalogar **state sync prod ↔ develop** apos deploys cirurgicos.

**2. Schema state.yaml ganha `debt` block** (divida tecnica explicita):

```yaml
debt:
  - issue: "{descricao}"
    severity: "{BAIXO|MEDIO|ALTO}"
    impact: "{consequencia}"
    proposed_fix: "{solucao}"
```

**3. `protected_branches` modular por repo** (override per projeto):

- a4tunados_mural: `[master, develop]` — master intocavel + develop centralizadora
- a4tunados-ops-suite: `[main]` — main e o trunk (historico do repo)
- Outros repos: configuravel via sidecar

**4. Cataloging do a4tunados_mural absorvido**:

Sidecar `projects/a4tunados_mural/state.yaml` populado com:
- master HEAD `b03e5707` (2026-04-11) — deploy v2.3.2
- develop HEAD `86610e05` (2026-05-03) — PR #6 attachments
- master_behind_develop: 749 arquivos diff
- prod_state: 2 patches aplicados alem de master (Card 176607 frontend BREACHED + Card 467499 backend OK)
- debt: 2 issues conhecidos (develop muito a frente de master + frontend deploy fora do git flow)

### Cooperacao com tuninho-ddce v4.18.0

A Regra Inviolavel #66 do DDCE (deploy DEVE fechar git flow feat→develop, master intocavel) **invoca esta skill** ao final de toda operacao DDCE com deploy:

```bash
# Apos deploy + smoke OK, antes do Comlurb seal:
Skill tool: skill: "tuninho-git-flow-dafor", args: "sync-state --project {nome}"
# Atualiza state.yaml + cataloga prod_state com patches aplicados
```

### Origem operacional

Card 1762662734295467499 (tuninho.ai, 2026-05-04). Bump PATCH consolidando aprendizado de cataloging post-deploy + cooperacao com Regra DDCE #66.

### Backward compat

Sidecars existentes sem `prod_state` ou `debt` continuam validos. Campos novos sao opcionais. Schema versioning via `generated_by: tuninho-git-flow-dafor v0.5.2`.

---

## v0.5.1 — Schema multi-repo `repos: []` em state.yaml (Op 18 Fase 4, 2026-05-03)

**Aprendizado canonico Op 18 (a4tunados_web_claude_code, 2026-05-02 Fase 4)**: Card 2 da Op 18 pediu DDCE multi-repo. Esta skill ganha schema opt-in `repos: []` no `state.yaml` para catalogar estado de N repos por operacao simultaneamente. Backwards compat 100%: sidecars sem `repos: []` continuam single-repo.

### Schema state.yaml v0.2.1

```yaml
operacao: 18
# Single-repo (v0.2.0 — sem mudanca)
branch: feat/op18-tester-user-multirepo-ddce
develop_lag_commits: 0

# Multi-repo (v0.2.1 — opt-in)
repos:
  - name: a4tunados_web_claude_code
    branch: feat/op18-tester-user-multirepo-ddce
    develop_lag_commits: 0
    head_short: 6642a5a
    gitflow_status: branch_ahead_clean
  - name: a4tunados-ops-suite
    branch: main
    develop_lag_commits: 0
    head_short: abc1234
    gitflow_status: pr_merged
```

### Cooperacao

- `tuninho-portas-em-automatico v0.5.1+` Resp 11 detecta `repos: []` e invoca `audit-lag` em modo multi-repo.
- `tuninho-qa v0.17.x+` sub-check `audit-multirepo-coherence` cruza com `repos_state: {}` do HANDOFF.
- `tuninho-da-comlurb v0.10.0+` popula `repos_state` baseado em `repos: []`.

### Origem operacional

Op 18 Fase 4. Bump PATCH aditivo.

---

# Tuninho Git Flow d'a4 v0.2.0

> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite.

Você é o Tuninho no papel de **Gerente do Git Flow d'a4tunados** — cataloga estado real de branches por projeto e cumpre o padrão "git flow d'a4" definido pelo operador.

## Por que existe (motivação canônica)

Op 17 do a4tunados_web_claude_code (2026-05-02) revelou cenário operacional:
- 13+ branches `feat/*` paralelas no repo
- `develop` defasada (Op 14, 15, 16 documentadas mas NÃO merged)
- Operador relatou: "foi sugerida main ao invés de develop e ainda temos branches com commits mais atualizados do que a develop"

Sem catalogação, agentes inferem estado git de forma errada. Esta skill resolve isso via sidecars `state.yaml` por projeto + integração com hook `tuninho-hook-git-flow` v1.3.0+.

## Padrão "git flow d'a4tunados"

```
feat/{nome}  ──┐
fix/{nome}   ──┤  PR + merge-ff
               v
develop ───────┐  PR + merge-ff (trunk-based-ish)
               v
main ────────── (produção, conservadora)
```

Regras:
- **main**: extremamente conservadora, recebe via PR merge-ff de develop apenas
- **develop**: base obrigatória de novas operações; SEMPRE recebe via PR merge-ff feat/* e fix/*
- **feat/*** e **fix/***: sempre originam de develop (ou de feat/* mais recente se develop defasada — operador decide explicitamente)
- Sem release/* branches por padrão
- Sem tags como gate de release
- Worktrees dedicados pra fluxo card-isolated (paths: `/opt/hostinger-alfa/card-worktrees/{projeto}/card-{id}_{slug}/`)

## Modos (5)

### Modo 1: `init-branch`

**Quando**: operador inicia operação nova e precisa criar branch.

**Input**: `--name {feat/op-NN-slug|fix/slug}` + opcional `--from {develop|feat/X}` (default: develop).

**Processo**:
1. Verificar working tree clean (`git status --short`)
2. Fetch origin --prune
3. Validar que `--from` está atualizado vs origin
4. Se `--from develop` mas develop está N commits atrás de feat/* mais ativa:
   - WARN ao operador
   - Sugerir alternativas: (a) merge develop → feat/X primeiro, (b) usar feat/X como base, (c) prosseguir consciente
5. `git checkout -b {name} {from}`
6. Atualizar sidecar `state.yaml` com active_branches[]

**Bloqueia**: NÃO. WARN-first.

**Script**: `scripts/init-branch.sh`

### Modo 2: `sync-state`

**Quando**: periódico (1x por sessão via hook git-flow ou portas-em-automatico) + sob demanda.

**Input**: opcional `--project {nome}` (default: detecta via git remote).

**Processo**:
1. `git fetch origin --prune --quiet`
2. Listar todas branches local + remote
3. Para cada branch: calcular lag vs develop (`git rev-list --count develop..{branch}`)
4. Render `state.yaml` no sidecar do projeto

**Bloqueia**: NÃO. Apenas atualiza estado.

**Script**: `scripts/sync-state.sh`

### Modo 3: `audit-lag`

**Quando**: pre-flight (chamado por `tuninho-portas-em-automatico` Resp 11) + sob demanda.

**Input**: opcional `--project {nome}`.

**Processo**:
1. Ler `state.yaml` do projeto (gera via sync-state se ausente ou >1h velho)
2. Calcular: develop atrasada vs N branches feat/*, develop_last_merge_at vs ultimo commit feat/*
3. Reportar tabela markdown: branch | head | lag_to_develop | status (active_op|pending_merge|stale_candidate)

**Output**:
```
=== Git Flow Audit — {projeto} ({timestamp}) ===
develop: {commit_hash} (last merge: {ts})
main:    {commit_hash} (last merge: {ts})
develop ahead/behind main: {ahead}/{behind}

Active branches:
| Branch                     | Head    | Lag→develop | Status         |
|----------------------------|---------|-------------|----------------|
| feat/op17-tester-gitflow   | bc58789 | +6 commits  | active_op      |
| feat/chat_terminal_fixes   | bc58789 | +6 commits  | pending_merge  |
| feat/explorer_editor_*     | abc1234 | +N commits  | stale_candidate|
| ...                        |         |             |                |

Status: develop {OK|DEFASADA — N branches pending_merge ahead}
Recomendação: {sugestão ações concretas}
```

**Bloqueia**: NÃO.

**Script**: `scripts/audit-lag.sh`

### Modo 4: `propose-merge`

**Quando**: operador pergunta "quais feat/* estão prontas pra develop?" ou "quais ja foram pra develop e podem ir pra main?".

**Input**: opcional `--target {develop|main}` (default: develop).

**Processo**:
1. Listar feat/* ahead de develop
2. Pra cada: checar se tem PR aberto, se merged, se stale
3. Sugerir candidatos pra merge

**Bloqueia**: NÃO. Apenas lista.

### Modo 5: `archive-stale`

**Quando**: cleanup periódico (mensal) ou após merge de PR (Regra DDCE #45 v4.7.0).

**Input**: `--branch {name}` (específica) ou `--auto-stale-days N` (todas com last commit > N dias e merged em develop).

**Processo**:
1. Pra cada candidata: criar tag `archive/{branch}` apontando pro head
2. `git push origin --delete {branch}`
3. `git push origin "archive/{branch}"`
4. Atualizar state.yaml movendo de active_branches → archived_branches
5. Best practice (web research Op 17): "automate detection, NOT deletion" — sempre preview com confirmação operador

**Bloqueia**: NÃO. Mas pede confirmação operador antes de delete.

## Schema sidecar state.yaml

`projects/{projeto}/state.yaml`:

```yaml
project: {nome}
generated_at: {ISO_TS}
generated_by: tuninho-git-flow-dafor v0.1.0

protected_branches: [main, develop]
merge_strategy_to_develop: ff_only
release_strategy: trunk-based  # default: PR merge-ff develop→main

state:
  develop_head: {commit}
  develop_last_merge_at: {ISO_TS}
  main_head: {commit}
  main_last_merge_at: {ISO_TS}
  develop_ahead_main: {N}
  develop_behind_main: {N}

active_branches:
  - name: {branch}
    head: {commit}
    parent: {develop|outro_feat}
    lag_to_develop: {N commits}
    status: {active_op|pending_merge|stale_candidate}
    operation: {NN_or_null}
    last_commit_at: {ISO_TS}

parallel_open_branches:
  - name: {feat/*}
    head: {commit}
    lag_to_develop: {N}
    status: {pending_merge|stale}
    pr_url: {url|null}

archived_branches: []  # populado por archive-stale
```

## Integração com outras skills

| Skill | Como integra |
|---|---|
| `tuninho-hook-git-flow` v1.3.0+ | Lê `state.yaml` pra refinar warnings (branch-from-develop check, lag awareness) |
| `tuninho-portas-em-automatico` v0.5.0+ Resp 11 | Invoca `audit-lag` no pre-flight (WARN se develop defasada) |
| `tuninho-qa` v0.16.0+ | Sub-check `audit-gitflow-state` valida sidecar populado e atualizado |
| `tuninho-ddce` Etapa 0 (op start) | Pode invocar `init-branch` ou `audit-lag` antes da Etapa 1 |

## Política de Merge Automático para Develop (v0.2.0+)

**Regra operacional canônica do operador (definida 2026-05-02 sessão #2 Op 17):**

PRs cuja base é `develop` devem ser mergeados IMEDIATAMENTE após criação, sem pedir confirmação ao operador. PRs cuja base é `main` continuam exigindo confirmação explícita (política conservadora gitflow d'a4 — main intocada).

### Operacionalização

```bash
# Após gh pr create --base develop, executar imediatamente:
gh pr merge {N} --repo {repo_qualificado} --merge --delete-branch
```

### Decisão por base

| Base do PR | Ação automática? | Razão |
|---|---|---|
| `develop` | ✅ Merge automático sem confirmar | Operador autorizou padrão; develop é trunk de integração contínua |
| `main` | ❌ NUNCA — sempre pedir confirmação explícita | Política conservadora; main = produção; merge é decisão consciente |
| Branch arbitrária (rebase, etc.) | ❌ Pedir confirmação | Casos especiais não cobertos pela regra |

### Aplicabilidade por repo

- **Projetos a4tunados com gitflow d'a4** (a4tunados_web_claude_code, a4tunados_mural, etc.): regra ATIVA — PR → develop = merge auto
- **Repos com modelo trunk simples** (a4tunados-ops-suite e similares onde main = trunk): regra NÃO se aplica — PR → main exige confirmação como sempre

### Salvaguardas

Mesmo no merge automático para develop:
- Se CI estiver com checks vermelhos → NÃO mergear, reportar
- Se houver merge conflict → NÃO forçar, reportar
- Após merge: `git checkout develop && git pull` localmente pra sincronizar
- SEMPRE qualificar repo + branch ao reportar (Regra Inviolável #55 do DDCE v4.10.1)

### Anti-padrões aqui rejeitados

❌ Pedir confirmação a cada PR → develop ("posso mergear?") — fricção desnecessária
❌ Esperar operador confirmar antes de mergear PR → develop quando CI passou
❌ Confundir base develop com base main — qualificar SEMPRE antes de aplicar a regra

## Anti-padrões rejeitados

❌ **Auto-arquivamento de branches alheias** — só preview/sugestão (best practice 2026)
❌ **Bloquear edits sem warn primeiro** — WARN-first, BLOCK só quando inevitável
❌ **Modificar develop diretamente** — develop só recebe via PR merge-ff
❌ **Inferir estado git sem fetch origin recente** (<60s)

## Regras Inviolaveis

1. NUNCA modificar branches main/develop diretamente — só via PR merge-ff
2. NUNCA inferir estado git sem fetch origin recente (<60s)
3. SEMPRE atualizar state.yaml após operação significativa (init/merge/archive)
4. SEMPRE preferir warn a block — block só pra dirty+protected+intent-modify
5. SEMPRE preview antes de archive-stale — operador confirma manualmente
6. SEMPRE mergear PR → develop automaticamente sem pedir confirmação (v0.2.0+) — fricção zero. Excecao: PR → main NUNCA é automatico, sempre exige confirmação explicita do operador.

## Histórico

- **v0.2.0** (2026-05-02 sessão #2 Op 17 follow-up): Política de Merge Automático para Develop.
  Operador definiu: "ja deixe como padrao SEMPRE fazer esse merge. NAO PRECISA mais ficar perguntando".
  Nova seção dedicada documenta a regra (PR → develop = merge auto via `gh pr merge --merge --delete-branch`;
  PR → main continua exigindo confirmação). Nova Regra Inviolável #6. Aplicabilidade restrita a repos
  com gitflow d'a4 (não vale pra repos trunk como o próprio a4tunados-ops-suite).

- **v0.1.0** (2026-05-02): Versão inicial. Criada na Op 17 do projeto a4tunados_web_claude_code (F4).
  5 modos (init-branch, sync-state, audit-lag, propose-merge, archive-stale). Sidecar schema state.yaml com 8 campos canônicos (alinhado Discovery B2).
  Cooperação com hook v1.3.0 + portas-em-automatico v0.5.0 + tuninho-qa v0.16.0.
  Default merge-strategy: ff_only. Release: trunk-based-ish (PR merge-ff develop→main, sem release branches).
