# Protocolo `audit-retroativo` — Tuninho QA

> Modo 10 da skill. Aplica os modos 1-9 + sub-modo `audit-mcp-tools` retroativamente
> a uma operacao DDCE concluida, gerando relatorio paralelo SEM tocar nos artefatos
> originais.
>
> Caso de uso primario: validar uma operacao que foi declarada concluida sem que
> os gates de QA tenham sido rodados (situacao da Op 23, primeira execucao do QA).

---

## Quando usar

- Operacao concluida sem QA real
- Operacao concluida em modo autonomo sem evidencias visuais
- Auditoria periodica de operacoes legadas
- Validacao de qualidade antes de release/deploy critico
- Sob solicitacao explicita do operador ("audita a Op X")

---

## Saida (estrutura obrigatoria)

A pasta `qa/` e criada **paralela** aos artefatos originais — nunca os modifica.

```
_a4tunados/_operacoes/projetos/{NN}_{nome}/qa/
├── _0_QA_PROTOCOLO.md          # Como o QA foi conduzido (versao da skill, escopo, data)
├── _1_QA_DISCOVERY.md          # audit-discovery
├── _2_QA_DEFINE.md             # audit-define
├── _3_QA_EXECUTION_FASE_01.md  # audit-gate-fase × N
├── _4_QA_EXECUTION_FASE_02.md
├── ...
├── _N_QA_EXECUTION_FASE_NN.md
├── _N+1_QA_DEPLOY.md           # audit-deploy (se aplicavel)
├── _N+2_QA_GATE_FINAL.md       # audit-gate-final
├── _N+3_QA_PLANO_ACAO.md       # Consolidacao de gaps por severidade
├── _N+4_QA_LICOES_OP_{NN}.md   # Licoes para alimentar tuninho-qa/references/licoes-aprendidas.md
└── evidencias/
    ├── retroativo_fase_NN_T{X}.{Y}_{descricao}.png   # Screenshots Playwright
    ├── retroativo_mcp_{tool_name}.json               # Outputs MCP tools
    └── retroativo_audit-ambiente_{timestamp}.txt     # Snapshots de ambiente
```

---

## Sequencia de execucao

### Passo 0 — Setup e protocolo

1. Criar diretorio `qa/` na raiz da operacao
2. Criar `_0_QA_PROTOCOLO.md` com:
   - Versao da `tuninho-qa` (v0.1.0)
   - Data e hora do inicio da auditoria
   - Operador conduzindo
   - Modo (audit-retroativo)
   - Escopo: "Auditoria retroativa completa da Op {NN}"
   - Observacao: "Esta auditoria NAO modifica artefatos originais — apenas gera relatorio paralelo em qa/"

### Passo 1 — `audit-ambiente`

Rodar `scripts/audit-ambiente.sh`. Saida em `qa/evidencias/retroativo_audit-ambiente_{timestamp}.txt`.

Resultado vira parte do `_0_QA_PROTOCOLO.md` (snapshot do ambiente atual para comparacao com o que existia na sessao original).

### Passo 2 — `audit-sidecars`

Rodar `scripts/audit-sidecars.sh`. Saida em `qa/_0_QA_PROTOCOLO.md` (anexo).

### Passo 3 — `audit-discovery`

1. Ler `_0_PROMPT_ORIGINAL`, `_1_DISCOVERY_*`, `_1-xp_DISCOVERY_*`
2. Rodar todos os checks D1-D20 do checklist gate-discover
3. Registrar em `qa/_1_QA_DISCOVERY.md`
4. Para cada gap detectado: registrar como GAP-N com severidade

### Passo 4 — `audit-define`

1. Ler `_2_DEFINE_PLAN_*`, `_2-xp_DEFINE_PLAN_*`
2. Rodar todos os checks F1-F26 do checklist gate-define
3. **Importante**: detectar gap critico se `roteiros.yaml` nao existirem nas pastas das fases (esperado para operacoes pre-QA)
4. Registrar em `qa/_2_QA_DEFINE.md`

### Passo 5 — `audit-gate-fase` × N (uma vez por fase)

Para cada fase {1..N}:
1. Rodar todos os checks P1-P27 do checklist gate-fase
2. **Importante**: P12-P15 (review.md) e P16-P18 (evidencias) sao os checks mais provaveis de FAIL em operacoes pre-QA
3. **Importante**: P24-P26 (validacao Playwright) vao FALHAR para operacoes que nao rodaram QA
4. Registrar em `qa/_{N+2}_QA_EXECUTION_FASE_{N}.md`
5. Para cada FAIL: gerar GAP entry no relatorio

### Passo 6 — Acoes corretivas de QA (escopo limitado)

O QA pode **executar** as seguintes correcoes (modo `audit-retroativo` apenas):

- ✅ Rodar Playwright para roteiros que nao foram rodados → capturar evidencias → interpretar
- ✅ Invocar MCP tools nao testadas → registrar outputs verbatim
- ✅ Gerar `qa/relatorio-tarefa-T{N}.{M}.md` retroativo (com PASS/FAIL real)
- ✅ Capturar screenshots em `qa/evidencias/retroativo_*.png`
- ✅ Re-validar tokens via JSONL se ainda disponivel

O QA **NAO pode**:

- ❌ Editar artefatos originais (`_1_`, `_2_`, `_3_`, `review.md`, etc.)
- ❌ Corrigir bugs funcionais detectados (apenas reporta)
- ❌ Bumpar versao de outras skills
- ❌ Sugerir fix tecnico no codigo

### Passo 7 — `audit-deploy` (se aplicavel)

Se a operacao incluiu deploy:
1. Verificar PM2/systemd healthy
2. Verificar URL publica via Playwright
3. Verificar SSL, nginx, env vars
4. Registrar em `qa/_{N+3}_QA_DEPLOY.md`

### Passo 8 — `audit-mcp-tools` (se aplicavel)

Se a operacao registrou MCP tools (ex: Op 23 com 25 tools):
1. Iniciar subprocess do MCP server via stdio
2. Listar todas as tools (`tools/list`)
3. Comparar com lista esperada
4. Para cada tool: invocar com input minimo, registrar resposta verbatim
5. Salvar em `qa/evidencias/retroativo_mcp_{tool_name}.json`
6. Marcar PASS/FAIL por tool

### Passo 9 — `audit-gate-final`

1. Rodar todos os checks G1-G18 do checklist gate-final
2. Sub-check critico: `licoes-skills-bump` — varrer `aprendizados_operacao.md`, identificar quais aprendizados deveriam estar em skill mas nao estao
3. Registrar em `qa/_{N+4}_QA_GATE_FINAL.md`

### Passo 10 — Plano de Acao consolidado

Gerar `qa/_{N+5}_QA_PLANO_ACAO.md` agregando TODOS os gaps por:
- Severidade (CRITICA → BAIXA)
- Categoria (artefato, evidencia, documentacao, cobertura, memoria, deploy)
- Responsavel (Discovery, Define, Execution Fase X, Control, Operador)
- Re-validacao necessaria

Formato:
```markdown
# Plano de Acao — QA Retroativo Op {NN}

## Resumo Executivo

| Categoria | CRITICA | ALTA | MEDIA | BAIXA | TOTAL |
|-----------|---------|------|-------|-------|-------|
| Artefato | 0 | 2 | 1 | 0 | 3 |
| Evidencia | 8 | 0 | 0 | 0 | 8 |
| ... | | | | | |
| **TOTAL** | **8** | **3** | **2** | **0** | **13** |

## Acoes por Responsavel

### Discovery (responsavel: Discovery)
- GAP-3: ... — acao: ... — re-validacao: audit-discovery

### Execution Fase 6 (responsavel: Execution)
- GAP-9: ... — acao: ... — re-validacao: audit-gate-fase fase 6

### Operador
- GAP-12: aprendizado X esta em memoria mas deveria estar em tuninho-Y/SKILL.md (bump v0.1.0 → v0.2.0)
```

### Passo 11 — Licoes para tuninho-qa

Gerar `qa/_{N+6}_QA_LICOES_OP_{NN}.md` com licoes que alimentam
`.claude/skills/tuninho-qa/references/licoes-aprendidas.md`:

Foco nas licoes META do QA — coisas que reforcam por que o QA existe e como pode
ser melhorado, NAO bugs do projeto auditado.

Exemplos:
- "Operacoes em modo autonomo tendem a pular interpretacao visual mesmo capturando screenshots"
- "Smoke tests via SDK clients sao tentadores de aceitar como substituto de Playwright UI — manter Regra #19 rigida"
- "Aprendizados sobre comportamento de SDK ficam em memoria local quando deveriam ir para skill — sub-check `licoes-skills-bump` deve ser primeira parada do gate final"

### Passo 12 — Atualizar `licoes-aprendidas.md` da propria tuninho-qa

Apos gerar o `_{N+6}_QA_LICOES_OP_{NN}.md`, **incorporar** as licoes em
`.claude/skills/tuninho-qa/references/licoes-aprendidas.md` E bumpar a versao
da tuninho-qa (v0.1.0 → v0.2.0 minor, ou patch).

Esta e uma **excecao** ao Principio 11 (QA nao bumpa outras skills) — porque
estamos bumpando a propria tuninho-qa, que e a skill responsavel pelas licoes
de QA.

---

## Tempo estimado

| Fase | Tempo | Tokens |
|------|-------|--------|
| Setup | 5 min | 5k |
| audit-ambiente + sidecars | 10 min | 10k |
| audit-discovery | 15 min | 15k |
| audit-define | 15 min | 15k |
| audit-gate-fase × N (Op 23: × 7) | 60-90 min | 60-100k |
| Playwright execucao (8 roteiros) | 60-90 min | 80-120k |
| audit-mcp-tools (25 tools) | 30-45 min | 30-50k |
| audit-deploy | 20 min | 20k |
| audit-gate-final | 15 min | 15k |
| Plano de acao | 15 min | 15k |
| Licoes + bump | 15 min | 15k |
| **TOTAL Op 23** | **~4-5h** | **~280-380k** |

---

## Regras criticas do `audit-retroativo`

1. **NUNCA modificar artefatos originais** — toda saida vai para `qa/`
2. **NUNCA pular fases** — auditar TODAS as fases da operacao
3. **NUNCA aceitar amostragem em MCP tools** — auditar 100% das tools registradas
4. **SEMPRE rodar Playwright** para validacao visual, mesmo que demore
5. **SEMPRE interpretar cada screenshot** via Read tool
6. **SEMPRE registrar verbatim** outputs de comandos, calls MCP, screenshots
7. **SEMPRE reportar gap de memoria → skill** se detectado
8. **SEMPRE bumpar a propria tuninho-qa** ao final, incorporando licoes
9. **NUNCA sugerir fix de codigo** — apenas reportar gap

---

*Tuninho QA v0.1.0 — protocolo audit-retroativo*
