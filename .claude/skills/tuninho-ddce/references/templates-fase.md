# Templates de Fase DDCE

> Templates para os arquivos dentro de cada diretorio `fase_NN/` de uma operacao.

---

## plano.md (OBRIGATORIO — criado na Etapa 7)

```markdown
# Plano — Fase {N}: {NOME}

> Extraido do plano geral da operacao. Este arquivo permite entender o objetivo
> e a estrategia da fase sem precisar consultar documentos externos.

## Objetivo
{1-2 frases descrevendo o que esta fase entrega e por que e necessaria}

## Contexto na Operacao
- **Operacao:** {NN} — {nome_operacao}
- **Fase:** {N} de {total_fases}
- **Dependencias:** {Depende de Fase X porque... | Nenhuma}

## Tarefas Planejadas

- [ ] T{N}.1: {descricao}
  - **Tipo**: ADAPTACAO | NOVO | REFACTOR
  - **Base existente**: `{path}` | N/A — {justificativa}
  - **Arquivos**: `{lista}`
  - **Padrao de referencia**: `{file path}`
- [ ] T{N}.2: {descricao}
  - **Tipo**: ADAPTACAO | NOVO | REFACTOR
  - **Base existente**: `{path}` | N/A
  - **Arquivos**: `{lista}`

## Validacao Automatizada
1. {Passo de validacao Playwright ou alternativa}
2. {Verificacao de elemento/comportamento}
3. {Captura de evidencias}

## Validacao Humana
1. {Acao que o operador deve tomar}
2. {Resultado esperado}
3. {Criterio de aprovacao}

## Aprendizados Esperados
- {O que esperamos aprender com esta fase}

## Riscos Especificos
| Risco | Mitigacao |
|-------|-----------|
| {risco} | {mitigacao} |
```

**Regras:**
- Deve ser auto-suficiente: quem ler so este arquivo entende o que a fase faz
- Extraido do `_2_DEFINE_PLAN_` (ou `PLANO_GERAL.md`) durante a Etapa 7
- Atualizado se o plano mudar durante a execucao (registrar motivo da mudanca)

---

## checklist.md

```markdown
# Checklist — Fase {N}: {NOME}

## Tarefas

- [ ] T{N}.1: {descricao detalhada da tarefa}
  - Tipo: ADAPTACAO | NOVO | REFACTOR
  - Base existente: `{path}` | N/A — {justificativa}
  - Arquivos: `{path}`
  - Padrao: `{referencia}`
- [ ] T{N}.2: {descricao detalhada da tarefa}
  - Tipo: ADAPTACAO | NOVO | REFACTOR
  - Base existente: `{path}` | N/A — {justificativa}
  - Arquivos: `{path}`
- [ ] T{N}.3: {descricao detalhada da tarefa}
  - Tipo: ADAPTACAO | NOVO | REFACTOR
  - Base existente: `{path}` | N/A — {justificativa}

## Validacao Automatizada (padrao: Playwright)

- [ ] Executar validacao conforme estrategia definida no plano
- [ ] Verificar {elemento/comportamento}
- [ ] Capturar evidencias (screenshots, snapshots, logs)

## Validacao Humana

- [ ] {Acao 1} — esperar {resultado 1}
- [ ] {Acao 2} — esperar {resultado 2}
- [ ] Confirmar aprovacao ao operador DDCE

## Status

| Metrica | Valor |
|---------|-------|
| Tarefas | 0/{total} concluidas |
| Playwright | Pendente / Aprovado / Reprovado |
| Aprovacao humana | Pendente / Aprovado |
| Escriba | Pendente / Executado |
```

---

## checkpoints.md

```markdown
# Checkpoints — Fase {N}: {NOME}

> Log de controle (Control) da fase. Registra pre-checks, pos-checks e transicoes.

## Log de Controle

### {YYYY-MM-DD HH:MM} — Inicio da Fase {N}
- CONTROL CHECK: Fase {N} e a proxima no plano? **OK**
- Tarefas planejadas: {N}
- Posicao no plano: **confirmada**

---

### {YYYY-MM-DD HH:MM} — T{N}.1: {nome da tarefa}
- PRE-CHECK: Sequencia do plano? **OK**
- Tipo: {ADAPTACAO/NOVO/REFACTOR}
- Base existente: {path ou N/A}
- Implementacao: {resumo do que foi feito}
- POST-CHECK: Criterios atendidos? **OK**
- POST-CHECK ADAPTACAO: {Se ADAPTACAO: funcionalidade original preservada? **OK** | N/A se NOVO}
- Arquivos: `{lista}`

---

### {YYYY-MM-DD HH:MM} — Validacao Playwright
- Fluxos testados: {N}
- Resultado: **100% passing** / {N}% passing
- Evidencias: `evidencias/screenshot_01.png`, `evidencias/snapshot_01.txt`
- Bugs encontrados: {N} (corrigidos: {N})

---

### {YYYY-MM-DD HH:MM} — Validacao Humana
- Operador testou: {sim/nao}
- Resultado: **Aprovado** / Reprovado
- Observacoes: {feedback do operador}

---

## Status Final da Fase

### Visao Produto
{Descricao acessivel do que foi entregue nesta fase}

### Visao Dev
{Detalhes tecnicos com referencias de arquivos e decisoes}

### Evidencias
| Arquivo | Descricao |
|---------|-----------|
| `evidencias/screenshot_01.png` | {o que mostra} |
| `evidencias/snapshot_01.txt` | {o que capturou} |
```

---

## aprendizados.md

```markdown
# Aprendizados — Fase {N}: {NOME}

> Licoes especificas desta fase. Consolidados em `aprendizados_operacao.md` ao final.

## Licoes

| # | Aprendizado | Contexto | Acao Futura |
|---|-------------|----------|-------------|
| 1 | {descricao da licao} | {em que momento ocorreu} | {o que fazer diferente} |
| 2 | {descricao} | {contexto} | {acao} |

## Observacoes
- {observacao relevante que nao e exatamente uma licao}
```

---

## Estrutura de evidencias/

```
evidencias/
├── screenshot_01.png          # Via browser_run_code (NUNCA browser_take_screenshot)
├── screenshot_02.png
├── snapshot_01.txt            # Via browser_snapshot
├── snapshot_02.txt
└── {outros arquivos de evidencia}
```

**Convencao de nomes:**
- Screenshots: `screenshot_{NN}.png` (sequencial)
- Snapshots: `snapshot_{NN}.txt` (sequencial)
- Fluxos: `flow_{nome}_{step}.png` (quando documentando um fluxo completo)

**Regras:**
- NUNCA usar `browser_take_screenshot` (erro de tipo de imagem)
- Screenshots: `await page.screenshot({ path: 'caminho/file.png', fullPage: true })`
- Snapshots: `browser_snapshot` (output de texto)
