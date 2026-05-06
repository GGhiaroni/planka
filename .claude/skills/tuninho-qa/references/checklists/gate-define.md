# Checklist GATE DEFINE — Tuninho QA

> Roda no modo `audit-define` (modo 4). Todos os checks bloqueantes.

---

## Pre-condicoes

- [ ] GATE DISCOVER passou (modo `audit-discovery` retornou PASS)
- [ ] Operador aprovou Discovery expressamente

---

## Checks de artefato

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| F1 | `_2_DEFINE_PLAN_*` existe | `ls _a4tunados/_operacoes/prompts/{NN}_2_DEFINE_PLAN_*.md` | 1 arquivo | SIM |
| F2 | `_2_DEFINE_PLAN_` tem secoes obrigatorias | `grep -c "^## " _2_DEFINE_PLAN_*.md` | >= 5 | SIM |
| F3 | `_2-xp_DEFINE_PLAN_*` existe | `ls _a4tunados/_operacoes/prompts/{NN}_2-xp_DEFINE_PLAN_*.md` | 1 arquivo | SIM |
| F4 | `_2-xp_` >= 200 linhas | `wc -l _2-xp_*.md` | >= 200 | SIM |
| F5 | PLANO_GERAL.md existe na pasta da operacao | `ls _a4tunados/_operacoes/projetos/{NN}_*/PLANO_GERAL.md` | 1 arquivo | SIM |

## Checks de estrutura do plano

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| F6 | Todas as fases tem objetivo | `grep -c "^### Objetivo" _2_DEFINE_PLAN_*.md` | == numero de fases | SIM |
| F7 | Todas as fases tem checklist de tarefas | `grep -c "^### Tarefas" _2_DEFINE_PLAN_*.md` | == numero de fases | SIM |
| F8 | Todas as tarefas sao tipadas | `grep -c "Tipo.*ADAPTACAO\|Tipo.*NOVO\|Tipo.*REFACTOR" _2_DEFINE_PLAN_*.md` | == numero total de tarefas | SIM |
| F9 | Todas as tarefas tem Base existente | `grep -c "Base existente" _2_DEFINE_PLAN_*.md` | == numero total de tarefas | SIM |
| F10 | Validacao Playwright planejada por fase | `grep -c "Validacao Automatica\|Playwright" _2_DEFINE_PLAN_*.md` | == numero de fases | SIM |
| F11 | Validacao humana planejada por fase | `grep -c "Validacao Humana" _2_DEFINE_PLAN_*.md` | == numero de fases | SIM |
| F12 | Aprendizados esperados por fase | `grep -c "Aprendizados Esperados" _2_DEFINE_PLAN_*.md` | == numero de fases | SIM |
| F13 | Riscos com mitigacoes | `grep -c "Risco\|Mitigacao" _2_DEFINE_PLAN_*.md` | >= 2 | SIM |
| F14 | Dependencias entre fases mapeadas | `grep -c "Dependencias entre Fases\|depende de" _2_DEFINE_PLAN_*.md` | >= 1 | SIM |

## Checks de reuse-first

| # | Check | Calculo | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| F15 | Ratio reuse-first | `tarefas_ADAPTACAO / total_tarefas * 100` | >= 30% | NAO (alerta) |
| F16 | Tarefas NOVO tem justificativa | Cada tarefa tipo NOVO tem `Base existente: N/A — {justificativa}` | 100% | SIM |

## Checks de roteiros QA

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| F17 | Roteiros YAML existem por fase | `ls _a4tunados/_operacoes/projetos/{NN}_*/fase_*/qa/roteiros.yaml` | 1 por fase | SIM |
| F18 | Roteiros cobrem todas as tarefas | Cada `roteiros.yaml` tem entrada para cada tarefa T{N}.{M} | Cobertura 100% | SIM |
| F19 | Roteiros tem pre_condicoes preenchidas | `grep -c "pre_condicoes:" roteiros.yaml` | == numero de tarefas | SIM |
| F20 | Roteiros tem criterios_sucesso e _bloqueio | `grep -c "criterios_sucesso\|criterios_bloqueio" roteiros.yaml` | == 2x numero de tarefas | SIM |
| F21 | Roteiros tem interpretacao_esperada | `grep -c "interpretacao_esperada:" roteiros.yaml` | == numero de tarefas | SIM |

## Checks de estrutura de pasta da operacao

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| F22 | Pasta da operacao criada | `ls -d _a4tunados/_operacoes/projetos/{NN}_*/` | 1 diretorio | SIM |
| F23 | README.md existe | `wc -l _a4tunados/_operacoes/projetos/{NN}_*/README.md` | >= 10 | SIM |
| F24 | HANDOFF.yaml existe | `ls _a4tunados/_operacoes/projetos/{NN}_*/HANDOFF.yaml` | 1 arquivo | SIM |
| F25 | aprendizados_operacao.md existe | `ls _a4tunados/_operacoes/projetos/{NN}_*/aprendizados_operacao.md` | 1 arquivo | SIM |
| F26 | Pasta de cada fase tem 6 arquivos stub | `ls _a4tunados/_operacoes/projetos/{NN}_*/fase_*/` | plano.md, checklist.md, checkpoints.md, aprendizados.md, review.md, evidencias/ | SIM |

---

## Veredito do gate

- **PASS**: TODOS bloqueantes PASS
- **FAIL**: Qualquer bloqueante FAIL — BLOQUEADO

## Acoes em caso de FAIL

Reportar em `qa/_2_QA_DEFINE.md`. Responsavel: Define. Re-invocar `audit-define`
apos correcao.

---

*Tuninho QA v0.1.0 — checklist gate-define*
