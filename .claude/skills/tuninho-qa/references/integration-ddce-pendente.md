# Integration DDCE — PENDENTE

> Mecanismo de garantia de integracao diferida da `tuninho-qa` na `tuninho-ddce`.
>
> A integracao foi propositalmente deixada para uma operacao futura (decidido na
> sessao 02 da Op 23) para que a `tuninho-qa` seja primeiro provada via auditoria
> retroativa antes de virar um ponto de invocacao obrigatorio do DDCE.
>
> **CRITICO**: O modo `audit-gate-final` da tuninho-qa LE este arquivo. Se ha
> entradas `PENDENTE`, ele BLOQUEIA o encerramento de qualquer operacao que
> NAO seja a operacao designada para aplicar a integracao.

---

## Status global

| Item | Valor |
|------|-------|
| **Operacao designada para aplicar integracao** | Op 03 go-live tuninho.ai (2026-04-21) |
| **Versao alcancada da tuninho-ddce apos integracao** | v4.2.0 (major bump do v3 pro v4 — fluxo Contract Pattern + Comlurb integration) |
| **Status global** | APLICADO (9 de 9 pontos) em 2026-04-21 |
| **Data de criacao** | 2026-04-13 |
| **Data de fechamento** | 2026-04-22 (auditoria retroativa confirmou aplicacao) |
| **Referencia** | `_a4tunados/_operacoes/projetos/03_go-live/pendency-ledger.yaml` PEND-03-002 |

---

## Pontos de integracao (todos APLICADOS em 2026-04-21)

### Ponto 1 — Etapa 2 (Exploracao Ciclo 1) — `audit-ambiente` + `audit-sidecars`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao na tuninho-ddce v3.9.0**: secao "Etapa 2: Exploracao Profunda — Ciclo 1", apos eixo (g) "Skills tuninho-devops"

**Codigo a inserir**:
```markdown
- **(h)** Auditoria de ambiente (OBRIGATORIA): Invocar `Skill: tuninho-qa` modo
  `audit-ambiente` para validar MCPs ativos, skills tuninho-* atualizadas, hooks
  ativos, gh autenticado. Em seguida, modo `audit-sidecars` para validar que os
  sidecars devops do projeto estao alimentados. Se qualquer check falhar, o QA
  BLOQUEIA o avanco e lista o que precisa ser resolvido. (Bloqueante)
```

**Bloqueante**: NAO (warning na primeira passagem, BLOQUEANTE quando v3.10.0 estiver aplicada e operacao envolver deploy)

---

### Ponto 2 — Etapa 5 (GATE DISCOVER) — `audit-discovery`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "GATE DISCOVER — CONFIRMACAO OBRIGATORIA", apos a checagem da web research

**Codigo a inserir**:
```markdown
**INVOCACAO OBRIGATORIA DO QA antes do gate**:

```
Skill tool: skill: "tuninho-qa", args: "audit-discovery --operacao {NN}"
```

O QA roda checks D1-D20 do checklist gate-discover. Se retornar PASS, prosseguir.
Se retornar FAIL, BLOQUEAR — corrigir os gaps reportados e re-invocar o QA ate
PASS. So entao apresentar o Discovery ao operador para aprovacao expressa.
```

**Bloqueante**: SIM

---

### Ponto 3 — Etapa 8 (GATE DEFINE) — `audit-define` + `create-roteiros`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "GATE DEFINE — CONFIRMACAO OBRIGATORIA", apos a verificacao do `_2-xp_`

**Codigo a inserir**:
```markdown
**INVOCACAO OBRIGATORIA DO QA antes do gate**:

```
Skill tool: skill: "tuninho-qa", args: "create-roteiros --operacao {NN}"
Skill tool: skill: "tuninho-qa", args: "audit-define --operacao {NN}"
```

O `create-roteiros` gera `fase_NN/qa/roteiros.yaml` para cada fase, baseado nas
tarefas do plano. O `audit-define` roda checks F1-F26 do checklist gate-define.

Se qualquer falhar, BLOQUEAR — corrigir e re-invocar.
```

**Bloqueante**: SIM

---

### Ponto 4 — Etapa 10 (cada tarefa) — `pre-check` + `post-check`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "Etapa 10: Executar Tarefas", item 1 (CONTROL PRE-CHECK) e item 4 (CONTROL POST-CHECK)

**Codigo a inserir** (substituindo a referencia ao protocolo control-protocol.md):
```markdown
1. **CONTROL PRE-CHECK via tuninho-qa**:
   ```
   Skill tool: skill: "tuninho-qa", args: "pre-check --operacao {NN} --fase {N} --tarefa T{N}.{M}"
   ```
   Se FAIL, resolver pre-condicoes antes de implementar.

[...]

4. **CONTROL POST-CHECK via tuninho-qa**:
   ```
   Skill tool: skill: "tuninho-qa", args: "post-check --operacao {NN} --fase {N} --tarefa T{N}.{M}"
   ```
   O QA roda o roteiro Playwright e interpreta cada screenshot. Se FAIL, NAO
   marcar `[x]` no checklist — corrigir e re-invocar.
```

**Bloqueante**: SIM (post-check)

---

### Ponto 5 — Etapa 14 (GATE FASE) — `audit-gate-fase`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "Etapa 14: Fase Concluida — Escriba + Transicao", apos o checklist bloqueante manual e antes da invocacao do escriba

**Codigo a inserir**:
```markdown
**INVOCACAO OBRIGATORIA DO QA antes do gate**:

```
Skill tool: skill: "tuninho-qa", args: "audit-gate-fase --operacao {NN} --fase {N}"
```

O QA roda checks P1-P27 do checklist gate-fase, incluindo sub-checks de
tokens-jsonl e handoff-consistency. Se FAIL, BLOQUEAR — corrigir e re-invocar.

So apos PASS objetivo, invocar tuninho-escriba e prosseguir para o GATE FASE
manual com aprovacao do operador.
```

**Bloqueante**: SIM

---

### Ponto 6 — Etapa 15-16 (GATE FINAL) — `audit-gate-final`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "Etapa 16: Retroalimentacao + Encerramento", como primeiro item antes da analise da operacao

**Codigo a inserir**:
```markdown
**INVOCACAO OBRIGATORIA DO QA antes da retroalimentacao**:

```
Skill tool: skill: "tuninho-qa", args: "audit-gate-final --operacao {NN}"
```

O QA roda checks G1-G18 do checklist gate-final, incluindo o sub-check
`licoes-skills-bump` (Principio 11 — Memoria → Skill, sempre).

Se FAIL, BLOQUEAR encerramento — incorporar aprendizados nas skills correspondentes
com bump de versao, atualizar artefatos faltantes, e re-invocar.

Apos PASS, prosseguir com o protocolo de retroalimentacao normal.
```

**Bloqueante**: SIM

---

### Ponto 7 — Pos-deploy (qualquer fase) — `audit-deploy`

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: nova secao "Etapa 11.5: Validacao de Deploy" (criar logo apos Etapa 11), aplicavel apenas se a fase incluiu deploy via tuninho-devops-{hostinger,vercel,etc}

**Codigo a inserir**:
```markdown
### Etapa 11.5: Validacao de Deploy (se aplicavel)

Se a fase atual incluiu deploy, INVOCACAO OBRIGATORIA do QA pos-deploy:

```
Skill tool: skill: "tuninho-qa", args: "audit-deploy --projeto {nome} --servidor {alvo}"
```

O QA verifica:
- Processo PM2/systemd healthy
- Nginx config valido
- SSL valido (>= 30 dias para expiracao)
- Env vars carregadas
- Playwright contra URL publica + interpretacao visual
- Zero impacto cross-project
- Logs sem erros nas ultimas 50 linhas

Se FAIL, BLOQUEAR — investigar e corrigir antes de prosseguir para Etapa 12.
```

**Bloqueante**: SIM

---

### Ponto 8 — Adicao de regras na secao "Regras Inviolaveis"

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "Regras Inviolaveis" da tuninho-ddce

**Codigo a inserir**:
```markdown
| 27 | **QA obrigatorio em todos os gates** | NUNCA aprovar gate (DISCOVER, DEFINE, FASE, FINAL) sem invocar `tuninho-qa` no modo correspondente. O QA roda checks objetivos e BLOQUEIA se gap. Aprovar gate sem QA = quebra de metodo. |
| 28 | **Memoria → Skill, sempre** | Todo aprendizado operacional do projeto (padroes, bugs, decisoes, workarounds) deve ser incorporado em alguma `tuninho-*` ou skill projetada com bump de versao para propagacao via `tuninho-updater`. Memoria local do Claude (`MEMORY.md`) e PROIBIDA como destino de aprendizado operacional — perde-se entre ambientes. Verificacao via `tuninho-qa` modo `audit-gate-final` sub-check `licoes-skills-bump`. |
```

**Bloqueante**: NAO (regras sao retroativas — viram bloqueantes na proxima passagem)

---

### Ponto 9 — Adicao de licao na secao "Versionamento → Historico"

**Status**: APLICADO na Op 03 go-live (2026-04-21, tuninho-ddce v4.1.0 + v4.2.0)

**Localizacao**: secao "Historico" da tuninho-ddce, novo bloco v3.10.0

**Codigo a inserir**:
```markdown
- **v3.10.0** ({data_da_aplicacao}): Integracao com `tuninho-qa` v0.1.0 nos gates
  obrigatorios. tuninho-qa criada na sessao 02 da Op 23 (claudecode_back_v3) como
  agente de Control oficial do metodo DDCE. Mudancas:
  (1) Etapa 2 ganhou eixo (h) — auditoria de ambiente e sidecars via tuninho-qa
  (2) Etapas 5, 8, 14, 15-16 ganharam invocacao obrigatoria do tuninho-qa
  (3) Etapa 10 (cada tarefa) ganhou pre-check e post-check via tuninho-qa
  (4) Nova Etapa 11.5 (Validacao de Deploy) com tuninho-qa modo `audit-deploy`
  (5) Regras #27 e #28 adicionadas (QA obrigatorio + Memoria→Skill)
  (6) Licoes #52 e #53 adicionadas (Op 23 sessao 02)
```

**Bloqueante**: SIM (deve ser aplicado quando a integracao acontecer)

---

## Procedimento de aplicacao da integracao

Quando a operacao designada estiver pronta para aplicar a integracao:

1. **Ler este arquivo** integralmente
2. Para cada ponto PENDENTE:
   a. Abrir `.claude/skills/tuninho-ddce/SKILL.md`
   b. Localizar a secao indicada
   c. Aplicar o `Codigo a inserir` via Edit tool
   d. Mudar status do ponto neste arquivo de `PENDENTE` para `APLICADO` com data
3. **Bumpar versao da tuninho-ddce** de v3.9.0 para v3.10.0
4. **Atualizar a secao Historico** da tuninho-ddce com a entrada v3.10.0
5. **Re-invocar tuninho-qa** modo `audit-gate-final` para confirmar que `integration-ddce-pendente.md` agora tem zero entradas PENDENTE
6. **Apos PASS objetivo**: encerrar a operacao designada normalmente

---

## Verificacao automatica

O modo `audit-gate-final` da tuninho-qa executa:

```bash
PENDENTES=$(grep -c "^.*Status.*: PENDENTE$" .claude/skills/tuninho-qa/references/integration-ddce-pendente.md)
if [ "$PENDENTES" -gt 0 ]; then
  echo "FAIL: $PENDENTES pontos de integracao tuninho-qa ↔ tuninho-ddce ainda PENDENTE"
  echo "BLOQUEIA encerramento da operacao (exceto se for a operacao designada para aplicar a integracao)"
  exit 1
fi
```

---

*Tuninho QA v0.1.0 — integration-ddce-pendente | Criado na Op 23 sessao 02*
