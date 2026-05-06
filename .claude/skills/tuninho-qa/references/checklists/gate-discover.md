# Checklist GATE DISCOVER — Tuninho QA

> Roda no modo `audit-discovery` (modo 3). Todos os checks sao bloqueantes.
> O QA roda cada item via comando real, registra output verbatim, marca PASS/FAIL.

---

## Pre-condicoes

- [ ] Operacao tem numero `{NN}` definido
- [ ] Pasta `_a4tunados/_operacoes/projetos/{NN}_*/` existe
- [ ] Operador disponivel para resolver gaps detectados (modo interativo) OU
      operador autorizou modo autonomo

---

## Checks de artefato

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| D1 | `_0_PROMPT_ORIGINAL` existe | `wc -l _a4tunados/_operacoes/prompts/{NN}_0_PROMPT_ORIGINAL.md` | >= 1 linha | SIM |
| D2 | `_1_DISCOVERY_*` existe | `ls _a4tunados/_operacoes/prompts/{NN}_1_DISCOVERY_*.md` | 1 arquivo | SIM |
| D3 | `_1_DISCOVERY_` tem secoes obrigatorias | `grep -c "^## " _1_DISCOVERY_*.md` | >= 6 | SIM |
| D4 | `_1-xp_DISCOVERY_*` existe | `ls _a4tunados/_operacoes/prompts/{NN}_1-xp_DISCOVERY_*.md` | 1 arquivo | SIM |
| D5 | `_1-xp_` tem >= 200 linhas | `wc -l _1-xp_*.md` | >= 200 | SIM |
| D6 | `_1-xp_` tem 10 partes | `grep -c "^## PARTE" _1-xp_*.md` | >= 10 | SIM |

## Checks de profundidade do discovery

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| D7 | Web research executada | `grep -c "https://" _1_DISCOVERY_*.md _1-xp_*.md` | >= 6 | SIM |
| D8 | Vault Escriba consultado | `grep -ci "vault\|escriba\|MOC-Projeto\|decisoes/\|implementacao/" _1-xp_*.md` | >= 1 | SIM |
| D9 | Devops sidecars consultados | `grep -ci "devops-hostinger\|devops-env\|server-inventory\|nginx-templates" _1-xp_*.md` | >= 1 | SIM |
| D10 | Operacoes anteriores escaneadas | `grep -ci "operacao [0-9]\|aprendizados_operacao\|cards/" _1-xp_*.md` | >= 1 | SIM |
| D11 | Candidatos a adaptacao analisados | `grep -c "ADAPTACAO\|reuse\|candidato" _1_DISCOVERY_*.md` | >= 1 | SIM |
| D12 | Entrevistas registradas verbatim | `grep -c "Entrevista\|^- P:\|^- R:" _1_DISCOVERY_*.md` | >= 4 | SIM |

## Checks de processo

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| D13 | 3 ciclos de exploracao | `grep -ci "ciclo 1\|ciclo 2\|ciclo 3\|exploracao" _1-xp_*.md` | >= 3 | SIM |
| D14 | 2 ciclos de entrevista | `grep -ci "entrevista 1\|entrevista 2" _1-xp_*.md` | >= 2 | SIM |
| D15 | Riscos mapeados | `grep -ci "risco\|mitigacao" _1_DISCOVERY_*.md` | >= 1 | SIM |
| D16 | Decisoes do operador registradas | `grep -ci "decisao\|^### Decisao" _1_DISCOVERY_*.md` | >= 1 | SIM |

## Sub-check: knowledge-persistence

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| D17 | Aprendizados de Discovery em skill | (manual: cross-check com licoes-aprendidas das skills tuninho-*) | Toda licao operacional esta em alguma skill | SIM |
| D18 | Nada operacional em MEMORY.md | `grep -ci "skill\|pattern\|hook\|migration" ~/.claude/projects/*/memory/*.md` | Zero conhecimento operacional do projeto | ALERTA |

## Checks de tokens

| # | Check | Comando | Esperado | Bloqueia |
|---|-------|---------|----------|----------|
| D19 | tokens_inicio_discover capturado | `grep "tokens_inicio_discover" README.md HANDOFF.yaml` | Valor numerico presente | NAO (alerta) |
| D20 | tokens_fim_discover capturado | `grep "tokens_fim_discover" README.md HANDOFF.yaml` | Valor numerico presente | NAO (alerta) |

---

## Veredito do gate

- **PASS**: TODOS os bloqueantes (D1-D17) PASS
- **PASS COM RESSALVAS**: Todos bloqueantes PASS, mas alguns alertas (D18-D20) FAIL
- **FAIL**: Qualquer bloqueante FAIL — gate BLOQUEADO ate correcao + re-validacao

## Acoes em caso de FAIL

Para cada check FAIL, registrar em `qa/_1_QA_DISCOVERY.md`:
- Numero do check (D{N})
- Severidade (CRITICA / ALTA / MEDIA / BAIXA)
- Categoria (artefato / processo / cobertura / memoria)
- Comando + output verbatim
- Acao corretiva (responsavel: Discovery)
- Re-validacao necessaria

**O QA NAO corrige.** Apenas reporta. A fase Discovery e responsavel pela
correcao. Apos correcao, re-invocar `audit-discovery` para confirmar.

---

*Tuninho QA v0.1.0 — checklist gate-discover*
