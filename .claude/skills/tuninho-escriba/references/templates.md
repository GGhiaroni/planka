# Templates — Tuninho Escriba

Este arquivo contem os templates para todos os tipos de documento do vault.
Leia este arquivo na Etapa B4 (Bootstrap) ou ao criar novos documentos.

---

## Template: Sessão (`_templates/template-sessao.md`)

```markdown
---
title: "Sessão — {{descrição}}"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/session
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Sessoes]]"
  - "[[plano/plano-original]]"
---

# Sessão — {{descrição}}

## Contexto

{{Qual era o objetivo desta sessão? O que motivou o trabalho?}}

## Plano Original

Baseado em: [[plano/plano-original]]

{{Resumo do plano seguido ou link para o plano específico}}

## Prompts Utilizados

Registro completo em: [[prompts/{{YYYY-MM-DD}}_{{NN}}_contexto]]

### Resumo dos prompts
1. {{Primeiro prompt — resumo}}
2. {{Segundo prompt — resumo}}

## Ações Executadas

### Infraestrutura
- {{Pacotes instalados, configurações alteradas}}

### Código
- {{Arquivos criados ou modificados com descrição do que foi feito}}

### Testes
- {{Testes executados e resultados}}

## Arquivos Modificados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `{{caminho/arquivo}}` | Criado | {{descrição}} |

## Decisões Tomadas

- [[decisoes/{{nome-decisao}}]] — {{resumo}}

## Resultado

{{O que foi alcançado? Estado final do projeto após esta sessão}}

## Consumo de Tokens

| Métrica | Valor |
|---------|-------|
| Modelo | {{modelo}} |
| Tokens consumidos | {{N}}k / {{limite}}k |
| Utilização | {{N}}% |

> [!info] Tokens extraídos automaticamente do JSONL da sessão Claude Code

## Próximos Passos

- [ ] {{Sugestão de próximo passo}}
```

---

## Template: Decisão / ADR (`_templates/template-decisao.md`)

```markdown
---
title: "Decisão — {{nome}}"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[sessoes/{{sessão-relacionada}}]]"
---

# Decisão — {{nome}}

## Status
Aceita

## Contexto
{{Qual era o problema ou necessidade que levou a esta decisão?}}

## Decisão
{{O que foi decidido?}}

## Alternativas Consideradas

### {{Alternativa 1}}
- Prós: {{...}}
- Contras: {{...}}

## Consequências
{{Quais são as implicações desta decisão?}}

## Sessão
Tomada durante: [[sessoes/{{YYYY-MM-DD}}_{{NN}}_descricao]]
```

---

## Template: Implementação (`_templates/template-implementacao.md`)

```markdown
---
title: "{{Nome do Componente}}"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/implementation
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
---

# {{Nome do Componente}}

## Visão Geral
{{O que é este componente e qual seu papel no projeto?}}

## Stack / Dependências

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| {{tech}} | {{versão}} | {{função}} |

## Arquitetura
{{Como o componente funciona internamente?}}

## Arquivos

| Arquivo | Função |
|---------|--------|
| `{{caminho}}` | {{descrição}} |

## Como Testar
{{Passos para testar o componente}}

## Decisões Relacionadas
- [[decisoes/{{decisão}}]]
```

---

## Template: Registro de Prompts

```markdown
---
title: "Prompts — {{contexto}}"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/prompt
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[sessoes/{{YYYY-MM-DD}}_{{NN}}_descricao]]"
---

# Prompts — {{contexto}}

Sessão: [[sessoes/{{YYYY-MM-DD}}_{{NN}}_descricao]]

## Prompt 1
> {{prompt completo do usuário, na íntegra}}

**Contexto**: {{o que motivou este prompt}}
**Resultado**: {{o que foi feito em resposta}}
```

---

## Estrutura: MOC-Projeto.md

```markdown
---
title: "Projeto — Map of Content"
aliases:
  - "MOC"
  - "Índice"
tags:
  - a4tunados
  - tuninho/escriba
  - type/moc
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related: []
---

# Projeto — Map of Content

## Visão Geral
{{Descrição breve do projeto}}

## Navegação
- [[MOC-Sessoes]] — Registro de todas as sessões de trabalho
- [[changelog]] — Histórico de mudanças do projeto
- [[versioning]] — Controle de versões da documentação

## Plano
- [[plano/plano-original]] — Plano original do projeto

## Implementação
{{Links para cada doc de implementação}}

## Decisões
{{Links para cada ADR}}

## Prompts
{{Links para registros de prompts}}
```

---

## Estrutura: MOC-Sessoes.md

```markdown
---
title: "Sessões — Map of Content"
aliases:
  - "Sessões"
  - "Histórico"
tags:
  - a4tunados
  - tuninho/escriba
  - type/moc
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
---

# Sessões — Map of Content

Registro cronológico de todas as sessões de trabalho.

## Sessões

| Data | Sessão | Resumo | Tokens |
|------|--------|--------|--------|
| {{YYYY-MM-DD}} | [[sessoes/{{YYYY-MM-DD}}_{{NN}}_descricao]] | {{resumo}} | {{N}}k ({{N}}%) |
```

---

## Estrutura: changelog.md

```markdown
---
title: "Changelog"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/changelog
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[versioning]]"
---

# Changelog

Histórico de todas as mudanças documentadas no projeto.

## [{{versão}}] — {{YYYY-MM-DD}}

### Adicionado
- {{item}}

### Modificado
- {{item}}

### Arquivado
- {{item}}
```

---

## Estrutura: versioning.md

```markdown
---
title: "Controle de Versões"
aliases:
  - "Versionamento"
tags:
  - a4tunados
  - tuninho/escriba
  - type/changelog
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[changelog]]"
---

# Controle de Versões

## Versão Atual da Documentação
**{{versão}}**

## Skill Tuninho Escriba
**v2.0.0**

## Histórico de Versões

| Versão | Data | Tipo | Descrição |
|--------|------|------|-----------|
| {{versão}} | {{YYYY-MM-DD}} | {{Patch/Minor/Major}} | {{descrição}} |

## Convenção de Versionamento
- **Patch** (0.0.x): Adição de sessão, correções menores, novos prompts
- **Minor** (0.x.0): Novos tipos de documento, reorganização de seções
- **Major** (x.0.0): Reestruturação completa do vault
```

---

## Template: Funcionalidade (`funcionalidades/nome-feature.md`)

```markdown
---
title: "{{Nome da Funcionalidade}}"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/feature
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
---

# {{Nome da Funcionalidade}}

## Visao Geral
{{O que esta funcionalidade faz e por que existe?}}

## Fluxo do Usuario
{{Passo a passo da experiencia do usuario}}

## Componentes Envolvidos

| Componente | Arquivo | Papel |
|-----------|---------|-------|
| {{componente}} | `{{caminho}}` | {{papel}} |

## Regras de Negocio
- {{Regra 1}}
- {{Regra 2}}

## Decisoes Relacionadas
- [[decisoes/{{decisao}}]]

## Status
{{Implementado / Em desenvolvimento / Pendente}}
```

---

## Template: Report Executivo (`report-executivo.md`)

```markdown
---
title: "Report Executivo Geral"
aliases:
  - "Report"
  - "Executive Report"
  - "Consolidacao"
tags:
  - a4tunados
  - tuninho/escriba
  - type/report
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[MOC-Sessoes]]"
---

# Report Executivo — {{Nome do Projeto}}

## Visao Geral

| Item | Valor |
|------|-------|
| **Projeto** | {{nome completo do projeto}} |
| **Cliente** | {{cliente/organizacao}} |
| **Stack** | {{stack principal}} |
| **Modelo IA** | {{modelo usado}} |
| **Producao** | {{URL de producao ou N/A}} |
| **Operador** | {{operador}} |

---

## Timeline Completa

| | Op 01 | Op 02 | ... |
|---|---|---|---|
| **Nome** | {{nome}} | {{nome}} | ... |
| **Tipo** | {{tipo}} | {{tipo}} | ... |
| **Inicio (UTC)** | {{data hora}} | {{data hora}} | ... |
| **Fim (UTC)** | {{data hora}} | {{data hora}} | ... |
| **Duracao** | {{duracao}} | {{duracao}} | ... |
| **Status** | {{status}} | {{status}} | ... |

### Tempo de Execucao

| Metrica | Valor |
|---------|-------|
| **Primeiro prompt** | {{timestamp UTC}} |
| **Ultimo commit** | {{timestamp UTC}} |
| **Tempo bruto (elapsed)** | {{tempo total}} |
| **Tempo liquido (soma operacoes)** | {{soma das duracoes}} |
| **Ociosidade/gaps entre operacoes** | {{bruto - liquido}} |

---

## Consumo de Tokens

| Operacao | Tokens Delta (context) | % do Total |
|----------|----------------------|------------|
| Op 01 — {{nome}} | {{delta}} | {{%}} |
| Op 02 — {{nome}} | {{delta}} | {{%}} |
| ... | ... | ... |
| **TOTAL** | **{{total}}** | **100%** |

> Nota: Esses valores representam o delta de crescimento do contexto em cada sessao, conforme registrado nos READMEs das operacoes.

---

## Estimativa de Custos (Claude Opus 4)

Usando a base de calculo detalhada da Op {{N}} (~${{valor}} para {{tokens}}k tokens) como referencia proporcional:

| Operacao | Custo Estimado (USD) | Custo Estimado (BRL) |
|----------|---------------------|---------------------|
| Op 01 — {{nome}} | ~${{valor}} | ~R$ {{valor}} |
| Op 02 — {{nome}} | ~${{valor}} | ~R$ {{valor}} |
| ... | ... | ... |
| **TOTAL** | **~${{total}}** | **~R$ {{total}}** |

> Cambio: R$ {{cambio}}/USD (estimado). Custos baseados em pricing publico: Input $15/MTok, Output $75/MTok, Cache $1.88/MTok.

---

## Entregaveis Consolidados

### Codigo e Sistema
| Metrica | Valor |
|---------|-------|
| {{metrica}} | {{valor}} |

### Documentacao
| Metrica | Valor |
|---------|-------|
| {{metrica}} | {{valor}} |

### Infraestrutura (Producao)
| Item | Valor |
|------|-------|
| {{item}} | {{valor}} |

---

## Jornada das Operacoes

1. **Op 01 — {{nome}}** ({{duracao}}): {{descricao narrativa de 1-2 linhas}}

2. **Op 02 — {{nome}}** ({{duracao}}): {{descricao narrativa de 1-2 linhas}}

---

## Resumo Executivo

Em **{{tempo bruto}}** de tempo bruto (**{{tempo liquido}}** liquidas), {{descricao concisa do que foi alcancado, com os numeros-chave de custo e entregaveis}}.
```

> [!tip] **Regras do template:**
> - Substituir TODOS os `{{placeholders}}` com dados reais extraidos dos READMEs
> - A tabela Timeline deve ter uma coluna por operacao
> - Custos usam a operacao com custo mais detalhado como base proporcional
> - Se uma operacao nao tem metricas, marcar "N/D" (nao disponivel)
> - O Resumo Executivo deve caber em 2-3 linhas e conter os numeros mais impactantes
> - Atualizar `version` no frontmatter a cada update (incrementar patch)

---

## Template: Sessao Bootstrap (`sessoes/YYYY-MM-DD_01_bootstrap.md`)

```markdown
---
title: "Sessao — Bootstrap da Documentacao"
aliases: []
tags:
  - a4tunados
  - tuninho/escriba
  - type/session
  - status/active
date: {{YYYY-MM-DD}}
version: "1.0"
related:
  - "[[MOC-Sessoes]]"
---

# Sessao — Bootstrap da Documentacao

## Contexto
Primeira execucao do Tuninho Escriba neste projeto. Modo Bootstrap ativado
para criar documentacao base completa a partir do discovery do codebase.

## Discovery Realizado

### Documentacao Existente Varrida
- {{Lista de docs encontrados e lidos}}

### Agents Explore Lancados
1. **Frontend/UI** — {{resumo dos achados}}
2. **Backend/API** — {{resumo dos achados}}
3. **Config/Infra** — {{resumo dos achados}}

## Documentos Criados

| Pasta | Quantidade | Documentos |
|-------|-----------|------------|
| implementacao/ | {{N}} | {{lista}} |
| funcionalidades/ | {{N}} | {{lista}} |
| decisoes/ | {{N}} | {{lista}} |
| plano/ | {{N}} | {{lista}} |

## Resultado
Vault Obsidian completo criado em `_a4tunados/docs_{{nome}}/` com {{N}} documentos.

## Proximos Passos
- [ ] {{sugestao}}
```
