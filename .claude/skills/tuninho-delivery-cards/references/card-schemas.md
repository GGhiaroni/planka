# Card Schemas — Tuninho Delivery Cards

> Referencia completa de schemas, convencoes e formatos para operacoes com cards.

---

## Frontmatter: Card Original

```yaml
---
card_id: "{cardId}"
operacao: {NN}
data: {YYYY-MM-DD}
tipo: card_original
titulo: "{titulo}"
---
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `card_id` | string | ID numerico do card no mural (ex: `"1740204023375463712"`) |
| `operacao` | number | Numero da operacao DDCE em que o card foi parseado |
| `data` | string | Data de criacao do arquivo no formato `YYYY-MM-DD` |
| `tipo` | string | Sempre `card_original` |
| `titulo` | string | Titulo completo do card conforme aparece no mural |

---

## Frontmatter: Card Results

```yaml
---
card_id: "{cardId}"
operacao: {NN}
data: {YYYY-MM-DD}
tipo: card_results
titulo: "{titulo}"
status: "{STATUS}"
---
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `card_id` | string | ID numerico do card no mural |
| `operacao` | number | Numero da operacao DDCE em que o resultado foi registrado |
| `data` | string | Data de criacao do arquivo no formato `YYYY-MM-DD` |
| `tipo` | string | Sempre `card_results` |
| `titulo` | string | Titulo completo do card |
| `status` | string | Status do resultado (ver tabela abaixo) |

### Valores de Status

| Status | Significado |
|--------|-------------|
| `CONCLUIDO COM SUCESSO` | Card totalmente entregue, todos os criterios atendidos |
| `PARCIAL` | Card parcialmente entregue, alguns criterios pendentes |
| `PENDENTE` | Card iniciado mas sem entrega concreta |
| `CANCELADO` | Card cancelado durante a operacao |

---

## Algoritmo de Slug

O slug e gerado a partir do titulo do card para uso em nomes de arquivos e diretorios.

### Passos

1. **Input**: Titulo do card (ex: `"Batuta Manager MVP 2"`)
2. **Lowercase**: `"batuta manager mvp 2"`
3. **Remover acentos/diacriticos**: `"batuta manager mvp 2"` (sem alteracao neste caso)
4. **Espacos para hifens**: `"batuta-manager-mvp-2"`

### Exemplos

| Titulo Original | Slug Gerado |
|-----------------|-------------|
| Batuta Manager | `batuta-manager` |
| Batuta Manager MVP 2 | `batuta-manager-mvp-2` |
| Correcao de Bug Critico | `correcao-de-bug-critico` |
| Implementacao do Modulo de Presenca | `implementacao-do-modulo-de-presenca` |
| Exportacao XLSX Turmas | `exportacao-xlsx-turmas` |

---

## Convencoes de Nomeacao de Arquivos

### Primeira ocorrencia

```
original_{cardId}_{slug}.md
results_{cardId}_{slug}.md
```

Exemplo:
```
original_1740204023375463712_batuta-manager.md
results_1740204023375463712_batuta-manager.md
```

### Re-opened (versionado)

Quando um card ja tem arquivo existente (re-opened em outra operacao):

```
original_{cardId}_{slug}_{NN}.md
results_{cardId}_{slug}_{NN}.md
```

Onde `{NN}` e o numero sequencial com zero-padding (02, 03, 04...).

Exemplo:
```
original_1740204023375463712_batuta-manager_02.md
results_1740204023375463712_batuta-manager_02.md
```

### Estrutura de Diretorio

```
_a4tunados/
  _operacoes/
    cards/
      cards-manifest.json
      1740204023375463712_batuta-manager/
        original_1740204023375463712_batuta-manager.md
        results_1740204023375463712_batuta-manager.md
        original_1740204023375463712_batuta-manager_02.md
        results_1740204023375463712_batuta-manager_02.md
```

---

## Regex de Validacao

### Deteccao de cards no prompt

```regex
^## \[(\d+)\]\s+(.+)$
```

- **Grupo 1**: `cardId` (numerico)
- **Grupo 2**: `titulo` (texto completo)
- Flag: multiline (`m`)

### Validacao de secoes no _3_RESULTS_

Cada card no results deve conter:

```regex
^### Description$
```

```regex
^### Comments$
```

---

## Formato Mural-Compatible (Export)

O formato de exportacao deve ser compativel com o import do mural a4tunados:

```markdown
## [1740204023375463712] Batuta Manager

### Description
Implementar o admin panel para o projeto Esporte Pela Vida Saudavel,
incluindo gestao de alunos, turmas, presenca e exportacao de relatorios.

### Comments
- Deploy realizado com sucesso no Hostinger Alfa
- Modulo de presenca implementado com marcacao individual
- Exportacao XLSX funcionando para todas as turmas
- 48 screenshots de validacao coletados
```

### Restricoes do formato mural

- `### Comments` deve ter no maximo ~50 linhas por card
- Cada linha de comment deve comecar com `- ` (bullet point)
- Nao incluir frontmatter YAML no export — apenas o markdown puro

---

## Exemplo Completo: Card Real

### Original (parseado do prompt)

```markdown
---
card_id: "1740204023375463712"
operacao: 5
data: 2026-03-28
tipo: card_original
titulo: "Batuta Manager"
---
## [1740204023375463712] Batuta Manager

### Description
Implementar o admin panel BatutaManager para o projeto
Esporte Pela Vida Saudavel com gestao completa de alunos,
turmas, presenca e relatorios.

### Acceptance Criteria
- [ ] CRUD de alunos funcionando
- [ ] CRUD de turmas funcionando
- [ ] Sistema de presenca operacional
- [ ] Exportacao XLSX disponivel
- [ ] Deploy no Hostinger Alfa
```

### Results (registrado apos execucao)

```markdown
---
card_id: "1740204023375463712"
operacao: 5
data: 2026-03-28
tipo: card_results
titulo: "Batuta Manager"
status: "CONCLUIDO COM SUCESSO"
---
## [1740204023375463712] Batuta Manager

### Description
Admin panel BatutaManager implementado com sucesso no Hostinger Alfa.
Todos os criterios de aceitacao atendidos.

### Comments
- CRUD de alunos implementado e testado
- CRUD de turmas implementado e testado
- Sistema de presenca com marcacao individual
- Exportacao XLSX para todas as turmas
- Deploy realizado no Hostinger Alfa com Nginx + SSL
- 48 screenshots de validacao coletados via Playwright
```
