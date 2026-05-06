# Handoff Template Canônico (v0.8.0 — design Op 17 F4.5)

> **Destino**: `~/.claude/plugins/a4tunados-ops-suite/skills/tuninho-da-comlurb/references/handoff-template.md` (push via tuninho-updater na F7)
>
> **Status**: DESIGN — implementação no plugin repo aguarda F7 (tuninho-updater push)

## Filosofia

Operadores reportaram historicamente que retomadas pós-/clear não eram fluidas
mesmo com Comlurb v0.7.1 e hook inicio-sessao v4.4.0. Causas raiz documentadas
(Op 17 Discovery cross-projeto):

1. Modo 6 minimalista (9 campos) vs Modo 7 rigoroso (40+) — gap de adoção
2. Hook injetava briefing em `additionalContext` (informativo, NÃO bloqueia)
3. Pendency-ledger documentado mas pouco-implementado em ops reais
4. Arquivos paralelos (`HANDOFF_*.md`) violando SEAL-005
5. Conteúdo crítico só no JSONL volátil
6. Decisões implícitas não explicitadas

Este template canônico unifica Modo 6 + Modo 7 com rigor em **9 seções
obrigatórias**, formato 30-segundos-readable, drift-check + comandos-zero
em cada item.

## Estrutura Canônica

```markdown
================================================================
🔁 RETOMADA — {OP_NOME} (sessão #{N})
Selada: {ISO_TS}    Modo: {seal_mode}    Confiança: {%}
Branch: {BRANCH}    Commit: {COMMIT_SHORT}    Repo: {VAULT}
================================================================

▶ ONDE PAROU (one-liner por nível)
  Operação: {OP_NN}_{nome} — {1-linha do objetivo}
  Fase: {FASE} — {1-linha descrição}
  Tarefa: {ID} — {descrição curta}
  Última ação validada: {timestamp + descrição em 1 linha}

▶ DRIFT CHECK (rode ANTES de qualquer trabalho — copy-paste)
  $ git status                       # esperado: clean
  $ git rev-parse HEAD               # esperado: {commit_esperado}
  $ git branch --show-current        # esperado: {branch_esperada}
  $ {comando_validacao_estado_1}     # esperado: {output_esperado_1}
  $ {comando_validacao_estado_2}     # esperado: {output_esperado_2}
  ⚠ Se DIVERGENTE em qualquer linha: PARE, audite, reporte ao operador.

▶ PRÓXIMO PASSO (1 ação concreta — copy-paste)
  {ação_concreta_em_1_linha} em {arquivo:linha_se_aplicável}

  Comando-zero:
  $ {bash_exato_pra_executar}

  Resultado esperado: {output_observável_que_indica_sucesso}

▶ DECISÕES ATIVAS (NÃO re-perguntar — ler e seguir)
  • {decisão_1}: {valor} — fonte: {turn|comment_url|adr_path}
  • {decisão_2}: {valor} — fonte: {...}
  • {decisão_3}: {valor} — fonte: {...}

▶ PENDÊNCIAS (ledger automático — NÃO duplicar)
  Total: {N} | Open: {O} | In-progress: {I} | Closed: {C} | Deferred: {D}

  [open]         PEND-{N}-001: {título} — prioridade {alta|media|baixa}
                 origem: {fase|sessao_anterior}
                 acao: {1-linha}
  [in_progress]  PEND-{N}-002: {título}
                 origem: {...}
                 acao: {...}
  [deferred]     PEND-{N}-003: {título} — para op futura
                 razão: {1-linha}

  Detalhe completo: {path_pendency_ledger.yaml}

▶ ARTEFATOS-CHAVE (paths absolutos)
  Plano:        {path_2_DEFINE_PLAN.md}
  Discovery:    {path_1_DISCOVERY.md}
  Discovery XP: {path_1-xp_DISCOVERY.md} ← contexto extenso pra retomada
  HANDOFF:      {path_handoff_yaml}    ← VOCÊ ESTÁ AQUI (fonte ÚNICA — SEAL-005)
  Vault:        {path_vault_sessoes}    ← ADRs + sessoes anteriores
  QA reports:   {path_qa_dir}/         ← _1_, _2_, _N_ relatórios

▶ CONTEÚDO CRÍTICO (extraído de JSONL volátil)
  {Se sessão anterior gerou conteúdo crítico que só estava no JSONL — descrições,
   prompts dinâmicos, configs interativos — copiar AQUI verbatim. Não confiar
   em raw_sessions/*.jsonl pois pode ser purgado.}

  ---
  {conteudo_verbatim_1}
  ---
  {conteudo_verbatim_2}
  ---

▶ HISTÓRICO DE SEALS (append-only — auditoria)
  {ts1} {seal_mode1} — {evento_1_resumido}
  {ts2} {seal_mode2} — {evento_2_resumido}
  ...
  {ts_atual} {seal_atual} — {esta_selagem}

================================================================
⛔ AGENTE: APRESENTAR ESTE BRIEFING AO OPERADOR ANTES DE QUALQUER TOOL.
   Aguardar "prossiga", "ok continuar", "lgtm" ou similar.
   Sem isso = violação Regra Inviolável #19 (handoff validation).
================================================================
```

## Mapeamento das 9 seções → causa raiz

| Seção | Resolve causa raiz | Obrigatória |
|---|---|---|
| Cabeçalho selo | Identidade + traceback | SIM |
| ONDE PAROU | Re-contextualização rápida | SIM |
| DRIFT CHECK | Causa #2 (estado declarado vs real) | SIM |
| PRÓXIMO PASSO | Causa #5 (comandos-zero ausentes) | SIM |
| DECISÕES ATIVAS | Re-perguntar contexto estabelecido | SIM |
| PENDÊNCIAS | Pendency-ledger pouco-implementado | SIM |
| ARTEFATOS-CHAVE | Single source of truth (SEAL-005) | SIM |
| CONTEÚDO CRÍTICO | Causa #3 (JSONL volátil) | Condicional |
| HISTÓRICO SEALS | Auditoria + paralelos detection | SIM |

## Anti-padrões rejeitados

❌ Markdown solto sem cabeçalho de selo — operador não sabe se foi sealed
❌ YAML sem template canônico — cada Comlurb gera estrutura diferente
❌ DRIFT CHECK ausente — agente assume estado e age cego
❌ Comandos-zero não copy-paste (texto descritivo) — operador/agente perde tempo decifrando
❌ Decisões implícitas — sessão futura re-pergunta o que já foi decidido
❌ Múltiplos arquivos `HANDOFF_*.md` — viola SEAL-005

## Geração automática (mudanças necessárias em scripts)

`scripts/aplicar-seal.py` (v0.8.0+) DEVE gerar HANDOFF.md neste formato canônico
substituindo placeholders. Lê:
- Estado git (branch, commit) automaticamente via `git rev-parse`
- pendency-ledger.yaml (já mantido por reconciliar-pendency-ledger.py)
- Decisões ativas via parsing dos artefatos `_1_DISCOVERY_`, `_2_DEFINE_PLAN_`
- Histórico anterior do HANDOFF (append na seção SEALS)

Operador edita CONTEÚDO CRÍTICO manualmente quando há (raro — sessão emergencial 85%).
