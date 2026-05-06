# Pendency Ledger — Schema

O pendency-ledger e a fonte canonical de pendencias cross-sessao de uma operacao DDCE.
Resolve o problema estrutural: "pendencias silenciosamente esquecidas entre sessoes".

## Localizacao

```
_a4tunados/_operacoes/projetos/{NN}_{nome}/pendency-ledger.yaml
```

Um arquivo por operacao. Persiste entre sessoes. Fonte unica da verdade sobre
o que esta aberto.

## Schema

```yaml
operacao: "03_resolve-esses-cards"
ledger_version: "1.0"
updated_at: "2026-04-21T18:40:00Z"
updated_by: "tuninho-da-comlurb v0.1.0"

summary:
  total: 12
  by_status:
    open: 3
    in_progress: 1
    closed: 7
    deferred: 1
  by_origin_session:
    sessao_01: 8
    sessao_02: 4

pendencies:
  - id: "P-F2-T1.3"                     # ID estavel — nao muda entre sessoes
    titulo: "Implementar debounce no save de coluna"
    descricao: "Chamadas PATCH /api/columns/[id] estao disparando a cada keystroke. Precisa debounce 500ms."
    origem_sessao: "sessao_01"
    origem_timestamp: "2026-04-19T14:22:10Z"
    status: "open"                       # enum: open | in_progress | closed | deferred | silenciosamente_carregada
    prioridade: "media"                  # enum: baixa | media | alta | critica
    relacionado_a:
      card_id: "1758104948899317397"
      fase: 2
      tarefa: "T1.3"
    proxima_acao: "Adicionar useDebouncedCallback de react-use em AppStateProvider linha 293"
    historico:
      - timestamp: "2026-04-19T14:22:10Z"
        sessao: "sessao_01"
        evento: "criada"
        nota: "Detectada durante DISCOVER"
      - timestamp: "2026-04-21T17:15:00Z"
        sessao: "sessao_02"
        evento: "reconciliada"
        nota: "Ainda pendente, sem trabalho nesta sessao"

  - id: "P-F3-T2.1"
    titulo: "Migration schema analytics_events"
    status: "closed"
    fechada_em_sessao: "sessao_02"
    fechada_em_timestamp: "2026-04-21T18:10:00Z"
    resolucao: "Migration 002_analytics_events.sql aplicada com sucesso. Testada manualmente."
    # ...demais campos opcionais
```

## Operacoes do script reconciliar-pendency-ledger.py

### 1. Criar ledger inicial (se nao existe)

Ao rodar pela primeira vez em uma operacao, cria o arquivo com `pendencies: []`.

### 2. Sincronizar com HANDOFF

O HANDOFF da sessao atual deve conter:
```yaml
pendencias_declaradas:
  fechadas_nesta_sessao:
    - "P-F2-T1.3 — razao: implementei o debounce"
    - "P-F3-T2.1 — razao: migration aplicada"
  abertas_nesta_sessao:
    - id: "P-F4-T3.2"
      titulo: "Validacao de email no register"
      descricao: "..."
  deferidas:
    - "P-F5-T1.1 — razao: fora do escopo da Op 03, vira pra Op 04"
```

O script le o HANDOFF e aplica as mudancas no ledger.

### 3. Detectar pendencias silenciosamente_carregadas

Para cada pendencia com `status: open` e `origem_sessao` anterior a sessao atual:
se ela nao aparece em `pendencias_declaradas.fechadas_nesta_sessao` NEM em
`pendencias_declaradas.deferidas`, ela sofreu **acumulo silencioso**.

O script marca como `silenciosamente_carregada` + gera WARNING.

### 4. Integridade referencial

Cada pendencia tem `relacionado_a` apontando para card/fase/tarefa. O script
valida que as referencias existem (ex: card existe em `cards-manifest.json`).

## Uso pelo tuninho-qa

`audit-continuidade` (modo novo em v0.6.0) le o ledger e valida:
1. Nenhuma pendencia em `silenciosamente_carregada` — se houver, FAIL
2. Timestamps coerentes (fechamento posterior a criacao)
3. Referencias validas
4. Summary bate com contagem real

## Integracao DDCE

O tuninho-ddce v4.1.0 le o ledger:
- **Etapa 9** (inicio de fase): apresenta pendencias abertas relacionadas a fase
- **Etapa 14** (fim de fase): pergunta ao operador quais pendencias estao fechadas
- **Etapa 16** (retroalimentacao): consolida pendencias `deferred` como candidatas
  para proxima operacao
