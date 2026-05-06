# Pre-Flight Checklist — 7 Verificacoes Obrigatorias

> Referencia usada por `scripts/preflight-checks.sh`.
>
> Cada check e nao-bloqueante por design — a skill NAO impede o operador
> de trabalhar, mas reporta WARNINGs claros via painel "Portas em Automatico".

---

## Filosofia

A metafora "portas em automatico" vem da aviacao: o piloto nao esta PROIBIDO
de decolar se um check falhar, mas sabe que precisa reportar e decidir. Aqui
e igual: o operador ve os WARNINGs, ve o estado real, e decide como proceder.

**Bloquear e privilegio da tuninho-qa** (Modo 12 `audit-handoff`). A
tuninho-portas-em-automatico so **reporta**.

---

## Os 7 checks

### Check 1 — Branch git correta

**Comando**: `git branch --show-current`

**Esperado**:
- Se ha HANDOFF da sessao anterior: branch deve bater com o que o HANDOFF declarava
- Se nao ha HANDOFF anterior: qualquer branch e OK (primeira sessao)

**Status**:
- `PASS` — branch detectado
- `WARN` — nao e repo git OU branch nao bate com HANDOFF

**Acao corretiva sugerida**: `git checkout {branch_esperada}`

---

### Check 2 — Working tree

**Comando**: `git status --short | wc -l`

**Esperado**: working tree limpo OU modificacoes documentadas no HANDOFF anterior
(ex: `HANDOFF.ddce.fase_metodo: HANDOFF_PENDING_TRACKING_FIX_E_DEPLOY`).

**Status**:
- `PASS` — working tree limpo (0 arquivos)
- `WARN` — `N arquivos nao commitados`

**Acao corretiva sugerida**: revisar `git status` antes de comecar. Documentar no HANDOFF se as mods sao intencionais.

**Nota especial**: em sessao de continuacao de operacao (ex: Op 23 sessao 03), e NORMAL ter mods nao commitadas da sessao anterior (ex: HANDOFF.yaml atualizado, qa/ relatorios novos). O WARN nao e indicativo de problema.

---

### Check 3 — Skills tuninho-* atualizadas

**Comando**: `ls .claude/skills/tuninho-*` + opcionalmente `gh api` para comparar manifest remoto

**Esperado**: todas as skills `tuninho-*` instaladas estao na versao mais recente do repo central (`victorgaudio/a4tunados-ops-suite`).

**Status v0.1.0** (simplificado):
- `PASS` — `.claude/skills/` existe e tem N skills `tuninho-*`
- `WARN` — `.claude/skills/` nao existe

**Status v0.2.0** (completo):
- `PASS` — todas as skills na versao mais recente do manifest remoto
- `WARN` — 1 ou mais skills desatualizadas (lista nomes)

A v0.1.0 nao valida versoes remotas para evitar dependencia de `gh api`
durante pre-flight (pode ser lento ou falhar offline). A versao completa
pode ser invocada manualmente via `tuninho-updater status`.

---

### Check 4 — Hook tuninho-hook-conta-token ativo

**Comando**: `ls $HOME/.claude/plugins/a4tunados-ops-suite/hooks/scripts/tuninho-hook-conta-token.py`

**Esperado**: arquivo existe e e executavel

**Status**:
- `PASS` — ativo
- `WARN` — nao encontrado

**Motivo**: o hook de token e o que habilita checkpoints de saude da sessao a cada 20% e stop automatico em 80%. Sem ele, a sessao pode entrar em colapso de contexto sem aviso.

**Acao corretiva sugerida**: `/tuninho-updater` (pull) para re-sincronizar os hooks.

---

### Check 5 — Sentinel `.escriba-bypass-active`

**Comando**: `test -f .claude/.escriba-bypass-active`

**Esperado**: o sentinel NAO existe (ou foi explicitamente criado para uma razao pontual).

**Status**:
- `PASS` — sentinel inativo
- `WARN` — sentinel ativo — remover com `rm .claude/.escriba-bypass-active`

**Motivo**: o sentinel e usado ocasionalmente para bypass temporario do tuninho-escriba em sessoes de emergencia. Deixa-lo ativo permanentemente e bug.

**Acao corretiva sugerida**: remover o sentinel. Se ha razao para mantelo, documentar no HANDOFF.

---

### Check 6 — tuninho-qa instalada

**Comando**: `cat .claude/skills/tuninho-qa/SKILL.md | head -50 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+'`

**Esperado**: tuninho-qa instalada e na versao >= v0.5.0 (minimo para `audit-handoff`).

**Status**:
- `PASS` — instalada + versao detectada
- `WARN` — nao instalada OU versao < v0.5.0

**Motivo**: a tuninho-qa e o agente de Control oficial do metodo DDCE. Sem ela instalada, a sessao perde capacidade de auditoria estrutural.

**Acao corretiva sugerida**: `/tuninho-updater` (pull) para instalar/atualizar.

---

### Check 7 — Cards manifest

**Comando**: `ls -d _a4tunados/_operacoes/cards/* 2>/dev/null`

**Esperado** (so se aplicavel): cards do mural registrados no diretorio `_a4tunados/_operacoes/cards/`.

**Status**:
- `PASS` — N cards detectados OU nao aplicavel (projeto sem cards mural)
- `WARN` — cards em inconsistencia com cards-manifest (TBD v0.2.0)

**Motivo**: apenas projetos com integracao mural (a4tunados_mural, familygames, etc) tem cards. Projetos sem mural pulam esse check.

---

## Pesos / Severidade

Na v0.1.0, todos os checks tem peso igual e status unico (PASS ou WARN).

Na v0.2.0, considerar:
- **Peso por criticidade**: check 4 (hook) e 6 (tuninho-qa) sao mais criticos que check 2 (working tree)
- **Niveis**: PASS / INFO / WARN / FAIL
- **Bloqueio condicional**: se 2+ checks criticos falham, emitir FAIL (mas ainda nao bloquear automaticamente)

---

## Integracao com tuninho-qa

Quando a sessao estiver em uma operacao DDCE ativa, **apos o painel ser apresentado**,
o agente (ou operador) pode invocar `tuninho-qa audit-handoff` para uma auditoria
mais profunda do HANDOFF (que aplica REGRA_MASTER_1-4 + 8 checks da Regra #26).

A skill portas-em-automatico NAO invoca tuninho-qa automaticamente — isso e
responsabilidade do agente quando estiver trabalhando na operacao.

---

*Parte da skill tuninho-portas-em-automatico v0.1.0*
