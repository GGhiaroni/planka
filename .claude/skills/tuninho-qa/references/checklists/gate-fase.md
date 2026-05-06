# Checklist GATE FASE — Tuninho QA

> Roda no modo `audit-gate-fase` (modo 8). Todos os checks bloqueantes.
> Implementa Regra #13 do tuninho-ddce + Licao #51 (review.md sistematicamente
> esquecido).

---

## Pre-condicoes

- [ ] Fase esta marcada como "concluida" pela execucao
- [ ] Todas as tarefas da fase foram executadas (claim do executor)

---

## Checks dos 6 arquivos por fase (BLOQUEANTES)

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| P1 | `plano.md` existe | `ls fase_{N}/plano.md` | 1 arquivo | SIM |
| P2 | `plano.md` tem conteudo real (>= 20 linhas) | `wc -l fase_{N}/plano.md` | >= 20 | SIM |
| P3 | `plano.md` sem placeholders | `grep -c "^{.*}$" fase_{N}/plano.md` | == 0 | SIM |
| P4 | `checklist.md` existe | `ls fase_{N}/checklist.md` | 1 arquivo | SIM |
| P5 | `checklist.md` todas tarefas marcadas | `grep -c "^- \[ \]" fase_{N}/checklist.md` | == 0 (zero pendentes) | SIM |
| P6 | `checklist.md` tem >= 1 tarefa marcada | `grep -c "^- \[x\]" fase_{N}/checklist.md` | >= 1 | SIM |
| P7 | `checkpoints.md` existe | `ls fase_{N}/checkpoints.md` | 1 arquivo | SIM |
| P8 | `checkpoints.md` >= 20 linhas | `wc -l fase_{N}/checkpoints.md` | >= 20 | SIM |
| P9 | `checkpoints.md` tem CONTROL pre/pos | `grep -c "CONTROL OK\|CONTROL FAIL\|pre-check\|pos-check" fase_{N}/checkpoints.md` | >= 1 | SIM |
| P10 | `aprendizados.md` existe | `ls fase_{N}/aprendizados.md` | 1 arquivo | SIM |
| P11 | `aprendizados.md` tem conteudo real | `wc -l fase_{N}/aprendizados.md` | >= 5 | NAO (alerta) |
| P12 | **`review.md` existe** | `ls fase_{N}/review.md` | 1 arquivo | SIM |
| P13 | **`review.md` >= 30 linhas** | `wc -l fase_{N}/review.md` | >= 30 | SIM |
| P14 | **`review.md` zero placeholders** | `grep -c "^{.*}$" fase_{N}/review.md` | == 0 | SIM |
| P15 | **`review.md` tem 5 secoes obrigatorias** | `grep -c "^## Periodo\|^## Visao Produto\|^## Visao Tecnica\|^## Evidencias\|^## Metricas" fase_{N}/review.md` | >= 5 | SIM |
| P16 | `evidencias/` existe | `ls -d fase_{N}/evidencias/` | 1 diretorio | SIM |
| P17 | `evidencias/` tem >= 1 screenshot | `ls fase_{N}/evidencias/*.png 2>/dev/null \| wc -l` | >= 1 | SIM |
| P18 | Cada screenshot referenciado em review.md | grep -c "evidencias/" review.md | == numero de PNGs em evidencias/ | SIM |

## Sub-check: tokens-jsonl

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| P19 | tokens_inicio_fase_{N} capturado | `grep "tokens_inicio_fase\|fim_fase_{N-1}" README.md HANDOFF.yaml` | Valor numerico | SIM |
| P20 | tokens_fim_fase_{N} capturado | `grep "tokens_fim_fase_{N}\|fim_fase_{N}" README.md HANDOFF.yaml` | Valor numerico | SIM |
| P21 | delta_tokens calculado | `grep "delta.*fase_{N}\|delta_fase_{N}" README.md` | Valor numerico | NAO (alerta) |

## Sub-check: handoff-consistency

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| P22 | HANDOFF.yaml fase_atual atualizada | `grep "fase_execucao\|fase_atual" HANDOFF.yaml` | Valor coerente com fase recem-concluida | SIM |
| P23 | HANDOFF.yaml painel_resumido atualizado | `grep -A 5 "painel_resumido:" HANDOFF.yaml` | Lista fases concluidas inclui esta fase | SIM |

## Sub-check: validacao Playwright executada

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| P24 | qa/relatorio-tarefa-T{N}.{M}.md existe para cada tarefa | `ls fase_{N}/qa/relatorio-tarefa-*.md \| wc -l` | == numero de tarefas | SIM |
| P25 | Cada relatorio-tarefa marca PASS | `grep -L "Status.*FAIL" fase_{N}/qa/relatorio-tarefa-*.md` | Todos PASS | SIM |
| P26 | Cada screenshot tem interpretacao no relatorio | (manual: cross-check) | 100% interpretados | SIM |

## Sub-check: escriba invocado

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| P27 | Vault Escriba tem entrada da fase | `grep -r "Op {NN}.*Fase {N}" _a4tunados/docs_a4tunados_mural/sessoes/ 2>/dev/null` | >= 1 match | NAO (alerta) |

---

## Veredito do gate

- **PASS**: TODOS bloqueantes (P1-P20, P22-P26) PASS
- **FAIL**: Qualquer bloqueante FAIL — BLOQUEADO

## Acoes em caso de FAIL

Reportar em `qa/_{N+2}_QA_EXECUTION_FASE_{N}.md`. Responsavel: Execution Fase {N}.
Re-invocar `audit-gate-fase` apos correcao.

---

*Tuninho QA v0.1.0 — checklist gate-fase*
