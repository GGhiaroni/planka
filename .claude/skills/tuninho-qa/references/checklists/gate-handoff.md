# Gate Handoff — Checklist Petreo (REGRA_MASTER_1 + REGRA_MASTER_4)

> Usado pelo Modo 12 `audit-handoff`. Combina pendency accounting (REGRA_MASTER_1) com os
> 8 checks da Regra #26 do tuninho-ddce absorvidos como sub-check obrigatorio (REGRA_MASTER_4).
>
> **NUNCA** aprovar handoff sem executar este checklist integral. Descoberta na sessao 02
> da Op 23 quando o operador cobrou manualmente a contabilizacao de pendencias que estava
> ausente — a regra torna a deteccao automatica.

---

## Inputs obrigatorios

- `--operacao {NN}`: numero da operacao (ex: 23)
- `--sessao {NN}`: numero da sessao atual (auto-detecta se ha `handoffs/HANDOFF_*_sessao_{NN}.yaml` ativo)

---

## Localizacao dos handoffs

**Nova estrutura (a partir de tuninho-ddce v3.10.0)**:
```
_a4tunados/_operacoes/projetos/{NN}_*/handoffs/
├── HANDOFF_{YYYY-MM-DD}_sessao_01.yaml   (imutavel — snapshot sessao 01)
├── HANDOFF_{YYYY-MM-DD}_sessao_02.yaml   (imutavel — snapshot sessao 02)
├── HANDOFF_{YYYY-MM-DD}_sessao_03.yaml   (head ATIVO da sessao 03)
└── raw_sessions/                          (JSONLs + plan files)
```

**Estrutura legacy (pre v3.10.0)**:
```
_a4tunados/_operacoes/projetos/{NN}_*/HANDOFF.yaml   (head unico, sobrescrito a cada sessao)
```

Se detectar estrutura legacy: emitir WARNING de migracao pendente mas nao bloquear (compatibilidade retroativa).

---

## Categoria 1 — Pendency Accounting (REGRA_MASTER_1)

Se existe snapshot da sessao N-1 (`handoffs/HANDOFF_*_sessao_{N-1}.yaml`):

- [ ] **C1.1** — Carregar snapshot N-1 e listar todas as pendencias declaradas (campo `pendencias_*` ou equivalente)
- [ ] **C1.2** — Para cada pendencia do snapshot N-1, verificar status no head atual:
  - Marcada como `concluida` + referencia a commit/acao no head atual? → FEITA
  - Ainda marcada como `pendente` no head atual? → PENDENTE (herda)
  - Marcada como `deferida` ou `fora_da_op` com justificativa? → DEFERIDA
- [ ] **C1.3** — Gerar tabela de saldo:
  ```
  Herdadas da sessao anterior: N
    Feitas:     M
    Pendentes:  K (listadas no head)
    Deferidas:  J (com justificativa)
  ```
- [ ] **C1.4** — **ALERTA CRITICO**: se alguma pendencia do snapshot N-1 NAO aparece mais no head (nem feita, nem pendente, nem deferida) → foi silenciosamente esquecida → GAP CRITICO → BLOQUEIA
- [ ] **C1.5** — Listar novas pendencias geradas na sessao atual (campo `pendencias_novas_sessao_{N}` ou equivalente)

Se NAO existe snapshot N-1 (primeira sessao OU migracao pendente):
- [ ] **C1.6** — Emitir alerta: "Primeira sessao detectada OU migracao legacy pendente"
- [ ] **C1.7** — Pular C1.1-C1.4, apenas registrar pendencias atuais para servir de base a sessao seguinte

---

## Categoria 2 — Artefatos DDCE (Regra #26 check 1)

- [ ] **C2.1** — `_0_PROMPT_ORIGINAL.md` existe e tem linhas >= 20
- [ ] **C2.2** — `_1_DISCOVERY_*.md` existe e tem secoes (Resumo, Escopo, Paisagem, Adaptacao, Dependencias, Decisoes, Restricoes)
- [ ] **C2.3** — `_1-xp_DISCOVERY_*.md` existe e tem linhas >= 200 e 10 partes
- [ ] **C2.4** — `_2_DEFINE_PLAN_*.md` existe e tem linhas >= 200
- [ ] **C2.5** — `_2-xp_DEFINE_PLAN_*.md` existe e tem linhas >= 200
- [ ] **C2.6** — `_3_RESULTS_*.md` existe (se operacao concluida)

---

## Categoria 3 — Dossie/Output (Regra #26 check 2)

- [ ] **C3.1** — Pasta `qa/` existe (se a operacao teve auditoria pela tuninho-qa)
- [ ] **C3.2** — Contagem de relatorios em `qa/` (esperado >= 10 para operacoes auditadas)

---

## Categoria 4 — Documentos Operacao (Regra #26 check 3)

- [ ] **C4.1** — `README.md` existe e tem linhas >= 50
- [ ] **C4.2** — `PLANO_GERAL.md` existe e e copia do `_2_DEFINE_PLAN_`
- [ ] **C4.3** — HANDOFF ativo existe (novo path ou legacy)
- [ ] **C4.4** — `aprendizados_operacao.md` existe

---

## Categoria 5 — Fases Executadas (Regra #26 check 4)

Para cada fase no plano:

- [ ] **C5.N.1** — `fase_N/plano.md` existe e tem linhas >= 20
- [ ] **C5.N.2** — `fase_N/checklist.md` tem todas as tarefas marcadas `[x]` (se fase concluida)
- [ ] **C5.N.3** — `fase_N/checkpoints.md` existe (mesmo se vazio)
- [ ] **C5.N.4** — `fase_N/aprendizados.md` existe e tem conteudo
- [ ] **C5.N.5** — `fase_N/review.md` existe, tem linhas >= 30, e ZERO placeholders `{...}` nao preenchidos
- [ ] **C5.N.6** — `fase_N/evidencias/` tem >= 1 arquivo (PNG para UI, TXT/JSON para backend)

---

## Categoria 6 — Arquivos Codigo Modificados (Regra #26 check 5)

- [ ] **C6.1** — Branch git correta (`git branch --show-current`)
- [ ] **C6.2** — Commit hash mais recente referenciado no HANDOFF
- [ ] **C6.3** — Status `git status --short` consistente com HANDOFF (ou documentado como intencional)
- [ ] **C6.4** — Branch sync com origin (`0 ahead, 0 behind` ou documentado)

---

## Categoria 7 — Linhas Contexto Retomada (Regra #26 check 6)

- [ ] **C7.1** — Calcular total de linhas dos arquivos XP + handoffs + README + aprendizados
- [ ] **C7.2** — Estimativa de cold-start em tokens (~ total_linhas × 0.02)
- [ ] **C7.3** — Alertar se estimativa > 100k tokens (handoff pesado)

---

## Categoria 8 — Foco Principal (REGRA_MASTER_1 sub-check)

- [ ] **C8.1** — Identificar `objetivo_principal` do HANDOFF atual
- [ ] **C8.2** — Verificar se a sessao corrente tem acoes relacionadas ao objetivo principal (cruza com `feito_na_sessao_{N}`)
- [ ] **C8.3** — Alertar se a sessao corrente foi > 50% trabalho lateral (risco de perda de foco)

---

## Veredito Final

```
┌─────────────────────────────────────────────────────────┐
│  AUDIT-HANDOFF — Op {NN} Sessao {NN}                    │
├─────────────────────────────────────────────────────────┤
│  Categoria 1 Pendency Accounting:  PASS | WARN | FAIL  │
│  Categoria 2 Artefatos DDCE:       PASS | WARN | FAIL  │
│  Categoria 3 Dossie/Output:        PASS | WARN | FAIL  │
│  Categoria 4 Documentos Operacao:  PASS | WARN | FAIL  │
│  Categoria 5 Fases Executadas:     PASS | WARN | FAIL  │
│  Categoria 6 Codigo Modificado:    PASS | WARN | FAIL  │
│  Categoria 7 Contexto Retomada:    PASS | WARN | FAIL  │
│  Categoria 8 Foco Principal:       PASS | WARN | FAIL  │
├─────────────────────────────────────────────────────────┤
│  VEREDITO: CONSISTENTE / INCONSISTENTE / COM_GAPS       │
│  BLOQUEIA CLEAR: SIM | NAO                              │
└─────────────────────────────────────────────────────────┘
```

**BLOQUEIA /clear se**:
- C1.4 falha (pendencias silenciosamente esquecidas)
- Qualquer check CRITICO das categorias 2, 3, 4, 6 com FAIL
- C8.3 falha (risco de perda de foco nao mitigado)

---

*Checklist absorvido dos 8 checks da Regra #26 do tuninho-ddce + pendency accounting petreo da REGRA_MASTER_1. Criado na sessao 03 da Op 23 (claudecode_back_v3) como parte do bump tuninho-qa v0.5.0.*
