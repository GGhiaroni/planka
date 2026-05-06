# Templates de Artefatos DDCE

> Referencia para os 4 artefatos obrigatorios de cada operacao DDCE.

---

## 1. Prompt Original (`_0_PROMPT_ORIGINAL`)

```markdown
---
operacao: {NN}
data: {YYYY-MM-DD}
tipo: prompt_original
---

{conteudo integral da demanda, verbatim, sem alteracoes}
```

**Regras:**
- Nenhuma modificacao no conteudo
- Se veio do mural, preservar `## [cardId]` headers
- Se veio como texto livre, preservar formatacao original

---

## 2. Discovery (`_1_DISCOVERY_{nome}`)

```markdown
---
operacao: {NN}
data: {YYYY-MM-DD}
tipo: discovery
versao: "1.0"
---

# Discovery — {nome}

## Resumo Executivo

{1-3 paragrafos: o que e a demanda, o que foi descoberto, e a recomendacao}

## Escopo

### Incluido
- {item que sera feito}
- {item que sera feito}

### Excluido
- {item que NAO sera feito e por que}

## Paisagem Tecnica (Estado Atual)

### Arquitetura Relevante
{Como o sistema funciona atualmente na area afetada}

### Arquivos-Chave
| Arquivo | Papel | Linhas Relevantes |
|---------|-------|--------------------|
| `path/to/file.js` | {papel} | {L42-L80} |

### Padroes Existentes
{Como funcionalidades similares foram implementadas}

## Analise de Adaptacao (Reuse-First)

### Candidatos Identificados

| # | Funcionalidade Existente | O que ja faz | Gap para a demanda | Esforco Adaptacao | Esforco Novo | Recomendacao |
|---|--------------------------|--------------|--------------------|--------------------|--------------|--------------|
| 1 | `{path/funcionalidade}` | {descricao} | {o que falta} | {P/M/G} | {P/M/G} | Adaptar / Novo |

### Abordagem Recomendada
{Para cada item do escopo, declarar: ADAPTAR (funcionalidade X) ou CRIAR NOVO (justificativa)}

### Decisao do Operador
{Escolha do operador durante entrevistas. Se divergiu da recomendacao, registrar justificativa.}

## Dependencias e Riscos

| Dependencia/Risco | Impacto | Mitigacao |
|-------------------|---------|-----------|
| {item} | Alto/Medio/Baixo | {como mitigar} |

## Decisoes do Operador (Entrevistas)

### Entrevista 1 ({data})
| Pergunta | Resposta |
|----------|----------|
| {pergunta} | {resposta} |

### Entrevista 2 ({data})
| Pergunta | Resposta |
|----------|----------|
| {pergunta} | {resposta} |

## Restricoes e Premissas
- {restricao tecnica ou de negocio}
- {premissa assumida}

## Proximos Passos
Aprovacao expressa do operador -> Fase DEFINE
```

---

## 3. Plano de Execucao (`_2_DEFINE_PLAN_{nome}`)

```markdown
---
operacao: {NN}
data: {YYYY-MM-DD}
tipo: define_plan
versao: "1.0"
---

# Plano de Execucao — {nome}

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Fases | {N} |
| Tarefas totais | {N} |
| Sessoes estimadas | {N} |
| Risco geral | BAIXO/MEDIO/ALTO |
| Tarefas por adaptacao | {N}/{total} ({%}%) |

---

## Fase 1: {nome}

### Objetivo
{1 linha descrevendo o objetivo da fase}

### Tarefas
- [ ] T1.1: {descricao}
  - **Tipo**: ADAPTACAO | NOVO | REFACTOR
  - **Base existente**: `{path/funcionalidade}` | N/A — {justificativa}
  - **Arquivos**: `path/to/file.js`, `path/to/other.js`
  - **Padrao de referencia**: `path/to/similar/implementation.js`
- [ ] T1.2: {descricao}
  - **Tipo**: ADAPTACAO | NOVO | REFACTOR
  - **Base existente**: `{path}` | N/A — {justificativa}
  - **Arquivos**: `path/to/file.js`

### Validacao Automatizada (padrao: Playwright)
1. Executar validacao conforme estrategia definida no plano
2. Verificar que {elemento/comportamento} esta correto
3. Capturar evidencias (screenshots, snapshots, logs)

### Validacao Humana
1. {Acao que o operador deve tomar}
2. Verificar que {resultado esperado}
3. Confirmar aprovacao

### Aprendizados Esperados
- {o que esperamos aprender com esta fase}

---

## Fase 2: {nome}
{mesma estrutura}

---

## Dependencias entre Fases
- Fase 2 depende de Fase 1 porque: {motivo}

## Riscos e Mitigacoes
| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| {risco} | Baixa/Media/Alta | Baixo/Medio/Alto | {mitigacao} |

## Metricas de Sucesso
- {criterio mensuravel 1}
- {criterio mensuravel 2}

## Notas
- Import parser: {se _0_ tem cardIds, _3_ sera compatible com mural}
```

---

## 4. Resultados (`_3_RESULTS_{nome}`)

### Variante A: Card-Import-Compatible (quando _0_ tem `## [cardId]`)

```markdown
## [{cardId}] {titulo}

### Description

{copia integra do conteudo original do _0_ para este card}

### Comments

> **Status: CONCLUIDO COM SUCESSO**

**O que foi entregue (visao produto):**
- {descricao acessivel para quem acompanha o projeto}

**O que foi feito (visao dev):**
- Arquivos criados: {lista}
- Arquivos modificados: {lista}
- Padroes utilizados: {descricao}

**Evidencias:**
- `fase_01/evidencias/screenshot_01.png` — {descricao}

---

## Resumo Geral da Operacao

| Item | ID | Status |
|------|----|--------|
| {titulo} | {cardId} | CONCLUIDO COM SUCESSO |

| Adaptacao vs Novo | {N} adaptacao / {N} novo |

**Operacao:** {NN}_{nome}
**Periodo:** {data_inicio} a {data_fim}
**Sessoes:** {N}

### Tokens e Tempo por Fase

| Fase | Duracao | Tokens Delta | % do Total |
|------|---------|--------------|-----------|
| DISCOVER | {duracao} | {delta} | {%} |
| DEFINE | {duracao} | {delta} | {%} |
| Fase 1: {nome} | {duracao} | {delta} | {%} |
| Fase 2: {nome} | {duracao} | {delta} | {%} |
| **TOTAL** | **{total}** | **{soma}** | **100%** |
```

### Variante B: Free-Form (quando _0_ nao veio do mural)

```markdown
---
operacao: {NN}
data: {YYYY-MM-DD}
tipo: results
---

# Resultados — {nome}

## Resumo
{1-3 paragrafos do que foi entregue}

## Resultados por Fase

### Fase 1: {nome}
**Status:** CONCLUIDO COM SUCESSO
**Produto:** {o que o usuario final ve}
**Dev:** {o que foi feito tecnicamente}
**Evidencias:** `fase_01/evidencias/`

### Fase 2: {nome}
**Status:** CONCLUIDO COM SUCESSO
...

## Metricas Finais

| Metrica | Valor |
|---------|-------|
| Sessoes | {N} |
| Fases | {N}/{total} |
| Tarefas | {N}/{total} |
| Tarefas por adaptacao | {N}/{total} ({%}%) |

### Tokens e Tempo por Fase

| Fase | Duracao | Tokens Delta | % do Total |
|------|---------|--------------|-----------|
| DISCOVER | {duracao} | {delta} | {%} |
| DEFINE | {duracao} | {delta} | {%} |
| Fase 1: {nome} | {duracao} | {delta} | {%} |
| **TOTAL** | **{total}** | **{soma}** | **100%** |

## Pendencias
- {item pendente, se houver}

## Aprendizados Consolidados
1. {licao principal}
2. {licao secundaria}
```

### Status Possiveis

| Status | Quando usar |
|--------|-------------|
| `CONCLUIDO COM SUCESSO` | Tudo feito e validado |
| `PARCIAL` | Feito parcialmente, com justificativa |
| `PENDENTE` | Nao iniciado ou bloqueado |
| `CANCELADO` | Removido do escopo com justificativa |

---

## 5. Arquivos por Card (`cards/{cardId}/`)

> Criados automaticamente quando o prompt contem headers `## [cardId]`.
> Vivem em `_a4tunados/_operacoes/cards/{cardId}/`.
> Sao ADITIVOS — a pasta `prompts/` continua com os artefatos agregados.

### original.md

```markdown
---
card_id: "{cardId}"
operacao: {NN}
data: {YYYY-MM-DD}
tipo: card_original
titulo: "{titulo do card}"
---

{conteudo verbatim da secao do card no _0_, sem o header ## [cardId]}
```

**Regras:**
- Extrair da secao correspondente do `_0_PROMPT_ORIGINAL`
- Preservar formatacao original incluindo `### Description`
- Se card ja tem `original.md` de operacao anterior: salvar como `original_{NN}.md`
- Criar diretorio `cards/{cardId}/` se nao existir

### results.md

```markdown
---
card_id: "{cardId}"
operacao: {NN}
data: {YYYY-MM-DD}
tipo: card_results
titulo: "{titulo do card}"
status: "{CONCLUIDO COM SUCESSO | PARCIAL | PENDENTE | CANCELADO}"
---

{conteudo da secao do card no _3_, incluindo ### Description e ### Comments}
```

**Regras:**
- Extrair da secao correspondente do `_3_RESULTS_`
- Incluir Description (copia do original) e Comments (resultados) completos
- Se card ja tem `results.md` de operacao anterior: salvar como `results_{NN}.md`

### Exemplo de estrutura resultante

```
_a4tunados/_operacoes/cards/
├── 1735786908392359623/
│   ├── original.md          # Op 15: demanda original deste card
│   └── results.md           # Op 15: resultado deste card
├── 1738776098063254891/
│   ├── original.md          # Op 15
│   ├── original_18.md       # Op 18 (mesmo card reaberto)
│   ├── results.md           # Op 15
│   └── results_18.md        # Op 18
└── ...
```
