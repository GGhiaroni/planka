# Checklist GATE FINAL — Tuninho QA

> Roda no modo `audit-gate-final` (modo 9). Todos os checks bloqueantes.
> Ultimo gate antes do encerramento da operacao.

---

## Pre-condicoes

- [ ] Todas as fases da operacao tem GATE FASE PASS
- [ ] tuninho-escriba foi invocado em cada fase

---

## Checks de artefato `_3_RESULTS_`

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G1 | `_3_RESULTS_*` existe | `ls _a4tunados/_operacoes/prompts/{NN}_3_RESULTS_*.md` | 1 arquivo | SIM |
| G2 | `_3_RESULTS_` >= 100 linhas | `wc -l _3_RESULTS_*.md` | >= 100 | SIM |
| G3 | `_3_RESULTS_` formato correto (multi-card OU free-form) | regex match | Cards com `### Description` + `### Comments`, ou free-form com fases | SIM |
| G4 | `_3_RESULTS_` tem secao Tokens e Custo | `grep -c "Tokens e Custo\|## Metricas" _3_RESULTS_*.md` | >= 1 | SIM |
| G5 | Status final claro por card/fase | `grep -c "CONCLUIDO COM SUCESSO\|PARCIAL\|PENDENTE\|CANCELADO" _3_RESULTS_*.md` | >= 1 | SIM |

## Checks de matriz central (se aplicavel)

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G6 | Vault tem `funcionalidades/{feature}-matrix.md` | `ls _a4tunados/docs_*/funcionalidades/*-matrix.md` | >= 0 (alerta se 0 e operacao toca feature multi-op) | NAO (alerta) |
| G7 | Matriz central atualizada nesta operacao | `git log --oneline -10 -- _a4tunados/docs_*/funcionalidades/` | Commit recente OU edicao na branch atual | NAO (alerta) |

## Checks de tabela de tokens consolidada

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G8 | README.md tem tabela completa de tokens | `grep -c "DISCOVER\|DEFINE\|Fase " README.md` | >= numero de fases + 2 | SIM |
| G9 | Tabela tem inicio, fim, delta para cada fase | `grep -c "tokens_inicio\|tokens_fim\|delta" README.md` | >= 3 × (fases + 2) | SIM |
| G10 | Total geral calculado | `grep "delta_total\|TOTAL" README.md` | 1 linha | SIM |
| G11 | Custo USD calculado | `grep "USD\|custo_usd" README.md _3_RESULTS_*.md` | >= 1 | SIM |

## Checks de aprendizados

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G12 | `aprendizados_operacao.md` consolidado | `wc -l _a4tunados/_operacoes/projetos/{NN}_*/aprendizados_operacao.md` | >= 20 | SIM |
| G13 | Aprendizados de cada fase agregados | `grep -c "Fase " aprendizados_operacao.md` | >= numero de fases | SIM |

## Sub-check CRITICO: licoes-skills-bump

| # | Check | Procedimento | Esperado | Bloqueia |
|---|-------|--------------|----------|----------|
| G14 | Detectar aprendizados que devem ir para skill | Para cada licao em `aprendizados_operacao.md`, verificar se ela esta documentada em alguma `tuninho-*/references/licoes-aprendidas.md` ou em uma regra do `SKILL.md` | 100% incorporados | SIM |
| G15 | Skill correspondente bumpou versao | Para cada skill que recebeu licao nova, verificar `git diff` ou `wc -l` do SKILL.md mostrando bump na secao de versionamento | Bump aplicado | SIM |
| G16 | Nada operacional ficou em MEMORY.md | `grep -ci "skill\|hook\|pattern\|migration\|deploy" ~/.claude/projects/*/memory/MEMORY.md` (procurar por entradas que sejam conhecimento operacional do projeto, nao do usuario) | Zero | NAO (alerta) |

## Sub-check: integration-ddce-pendente

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G17 | `integration-ddce-pendente.md` sem entradas PENDENTE (OU operacao atual e a designada) | `grep -c "PENDENTE" .claude/skills/tuninho-qa/references/integration-ddce-pendente.md` | == 0 OU operacao_atual == operacao_designada | SIM |

## Checks de delivery-cards (se multi-card)

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G18 | Cards individuais tem `results_*.md` | `ls _a4tunados/_operacoes/cards/*/results_*.md \| wc -l` | == numero de cards da operacao | NAO (alerta) |

## Checks de contract compliance

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| G19 | Contract file exists | `ls contracts/qa-contract.yaml` | 1 arquivo | SIM |
| G20 | Contract status ACTIVE ou FULFILLED | `grep "status:" contracts/qa-contract.yaml \| head -1` | ACTIVE ou FULFILLED | SIM |
| G21 | Compliance 100% | Rodar modo `audit-contract-compliance` | PASS | SIM |
| G22 | Zero blocking PENDING | `grep -B5 "status: PENDING" contracts/qa-contract.yaml \| grep -c "blocking: true"` | == 0 | SIM |

---

## Veredito do gate final

- **PASS**: TODOS bloqueantes (G1-G5, G8-G15, G17, G19-G22) PASS
- **FAIL**: Qualquer bloqueante FAIL — operacao NAO PODE ser encerrada

## Acoes em caso de FAIL

Reportar em `qa/_10_QA_GATE_FINAL.md`. Responsavel: depende do gap:
- Artefato faltando → fase responsavel
- Tokens incompletos → quem executou a fase
- Aprendizados nao incorporados em skill → operador (decide qual skill bumpar)
- Pendencias de integracao → operacao designada
- Memoria local com conhecimento operacional → operador (move para skill)

---

## Diretriz Principio 11 — Memoria → Skill, sempre

O sub-check G14 e G15 sao a aplicacao pratica do Principio 11. O QA exige que:

1. Toda licao operacional descoberta na operacao tenha sido **incorporada em alguma skill versionada** (com bump de versao para garantir propagacao via tuninho-updater).

2. Nada operacional do projeto fique apenas em memoria local do Claude (`~/.claude/projects/.../memory/`).

3. Se um aprendizado e candidato a memoria mas tambem candidato a skill, **prevalece a skill** — memoria so para conhecimento estritamente especifico do usuario operador (preferencias pessoais, contas, atalhos individuais).

Sem isso, conhecimento se perde entre ambientes (laptop A → laptop B → server) e o ops-suite vira inconsistente entre instalacoes.

---

*Tuninho QA v1.0.0 — checklist gate-final*
