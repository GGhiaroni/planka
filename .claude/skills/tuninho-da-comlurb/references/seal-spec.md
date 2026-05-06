# Seal Spec — Tuninho da Comlurb

O seal e o artefato formal que confirma que o ritual de faxina passou com sucesso.
Vive dentro do HANDOFF da sessao corrente em `handoffs/HANDOFF_{date}_sessao_{NN}.yaml`.

## Schema

```yaml
# Campos adicionados pelo Comlurb no HANDOFF
comlurb_sealed: true                  # boolean — aplicado apos QA PASS
seal_timestamp: "2026-04-21T18:42:15Z" # ISO-8601 UTC
seal_version: "v0.1.0"                 # versao da skill Comlurb que aplicou
seal_mode: "faxina-pre-clear"          # enum: faxina-pre-clear | pre-compact | gate-guard-light | gate-guard-full | selo-final-operacao | emergencial-85pct
seal_qa_result:
  audit_handoff: PASS                  # enum: PASS | FAIL
  audit_continuidade: PASS
  audit_handoff_freshness: PASS
  invocations:
    - skill: tuninho-qa
      mode: audit-handoff
      timestamp: "2026-04-21T18:41:02Z"
      result: PASS
      artifacts: ["qa/QA_HANDOFF_2026-04-21_sessao_02.md"]
    - skill: tuninho-qa
      mode: audit-continuidade
      timestamp: "2026-04-21T18:41:45Z"
      result: PASS
      artifacts: ["qa/QA_CONTINUIDADE_2026-04-21_sessao_02.md"]
seal_next_session_briefing:            # Briefing que a proxima sessao vai ler
  length_words: 147
  key_points:
    - "Op 03 esta em Fase 3 (analytics instrumentacao)"
    - "Pendencias abertas: 3 (ver pendency-ledger.yaml)"
    - "Proxima acao: rodar Playwright em /admin/analytics para validar coleta"
  content_path: "handoffs/briefings/BRIEFING_2026-04-21_sessao_03.md"
```

## Deteccao pelo hook inicio-sessao

O `tuninho-hook-inicio-sessao v4.3.0` busca pelo arquivo `HANDOFF_{date}_sessao_{N-1}.yaml`
mais recente e verifica:
1. `comlurb_sealed: true` → aplicou seal
2. `seal_mode != "emergencial-85pct"` → nao foi apenas aviso, foi ritual completo
3. Campo `seal_next_session_briefing.content_path` existe → briefing formalizado

Se tudo ok: injeta no `additionalContext` da sessao nova o conteudo de
`seal_next_session_briefing.content_path` + instrucao pra apresentar briefing.

## Validacao pelo QA

`tuninho-qa audit-comlurb-seal` (sub-check novo em v0.6.0):
1. HANDOFF tem `comlurb_sealed: true`?
2. `seal_timestamp` e valido ISO-8601 e < 24h atras?
3. `seal_qa_result` tem os 3 sub-checks em PASS?
4. `seal_next_session_briefing.content_path` aponta pra arquivo existente?
5. Briefing tem >= 100 palavras?

Se todos PASS: selo valido.
Se algum FAIL: selo INVALIDO — QA reporta e recomenda re-invocar Comlurb.

## Invalidacao manual

O operador pode invalidar o seal editando o HANDOFF e removendo `comlurb_sealed`.
Isso e util se o operador descobriu algo errado apos o seal e quer forcar novo ritual.
