# Tuninho Resume v5.0.1

## v5.0.1 — Sessão 2 DEFINE EXPANSIVO diretivas petreas (Card 1768281088850920655 — 2026-05-05)

**Bump preventivo absorvendo 3 diretivas petreas** que afetam comportamento desta skill em modo DDCE_EXPANSIVO:

- **NUNCA comprimir o briefing apresentado pelo /tuninho-resume** quando handoff sealed for de modo `DDCE_EXPANSIVO_MULTI_SESSOES_*`. Apresentar briefing completo, verbatim, com todas seções canônicas (9+ seções). Saturação é objetivo do modo expansivo.

- **Sempre medir tokens via JSONL no painel inicial do /tuninho-resume**, não chutar. Apresentar baseline real % atual ao operador junto com briefing.

- **Validar branch sync com develop ANTES de apresentar briefing**: rodar `git fetch origin develop + git status` no DRIFT CHECK e avisar operador se branch está atrás de origin/develop (Regra Inviolavel candidata #72).

### Por que patch v5.0.1?

Operador autorizou Q-FINAL-1=(c) bumps preventivos S2 durante S2.6.5 do Card 1768281088850920655.

### Aplicação concreta

- /tuninho-resume em modo expansivo apresenta briefing INTEGRAL sem trim
- DRIFT CHECK estendido pra cobrir branch sync com develop
- Token baseline reportado é medido via JSONL, não estimado

---

## v5.0.0 — DDCE_EXPANSIVO_MULTI_SESSOES integration (Card 1768281088850920655 — 2026-05-05)

**Bump canonico de toda ops-suite** absorvendo 4 Regras Inviolaveis novas do tuninho-ddce v4.20.0+:

- **#68** — Card mural canal espelhado equivalente em TODAS interacoes (nao so inputs).
  Operador pode escolher seguir pela sessao Claude OU pelo card mural — ambos canais
  devem ter as mesmas informacoes em tempo real (resumo de progresso, perguntas,
  aprovacoes, atualizacoes de status, blockers).

- **#69** — Modo DDCE_EXPANSIVO_MULTI_SESSOES + sub-etapa S1.6.5 Confirmacao Final
  pre-artefatos. Para operacoes complexas autorizadas pelo operador: 4 sessoes
  dedicadas (1 por fase DDCE: DISCOVER + DEFINE + EXECUTION + QA+FINAL). Cada sessao
  inteira saturada na fase atual maximiza profundidade. Handoff e checklist exclusivos
  por operacao em `cards/{cardId}_*/`. Sub-etapa S1.6.5 obrigatoria antes de produzir
  artefatos finais ou executar gate-guard-full Comlurb.

- **#70** — Modalidades LLM dual (SDK Claude Code assinatura vs OpenRouter API key)
  com contabilizacao petrea. SDK = usa cota assinatura, contabiliza tokens "como se"
  mas NAO bills via API. OpenRouter = paga por token via API real. Operacoes anteriores
  tiveram problemas confundindo as duas modalidades — esta regra documenta petreamente.

- **#71** — Branding tuninho.ai oficial. tu.ai eh APELIDO INTERNO/CARINHOSO apenas
  (operacoes/cards/comunicacao dev). Branding em UI/marketing/copy oficial = SEMPRE
  tuninho.ai. Razao raiz: tu.ai NAO eh nosso dominio.

### Por que v5.0.0 (independente da versao anterior)?

Operador autorizou explicitamente:
> *"info IMPORTANTE para toda skill que sofrer essa atualização o bump deverá ser 5.x.x
> independente de qual ela venha, para regularizar que é compativel com esse novo metodo
> a partir de agora."*

Razao: regularizar toda ops-suite num novo bloco de versionamento que sinaliza
compatibilidade com DDCE_EXPANSIVO_MULTI_SESSOES + as 4 regras novas.

### O que muda nesta skill especificamente

(detalhamento por-skill sera adicionado em proximas releases v5.0.x conforme uso real
das 4 regras evidenciar necessidades de adaptacao especifica para esta skill)

### Origem operacional

Card 1768281088850920655 "Estabilizacao Chat Tuninho.ai" — sessao 1 DISCOVER EXPANSIVO
(2026-05-05). Bump aplicado em batch a 15 skills + 3 hooks da ops-suite + remocao
da skill deprecated `tuninho-mandapr`. Cooperacao com tuninho-ddce v4.20.0+ que
formaliza Regras #68-#71 + sub-etapa S1.6.5.

### Backward compat

Operacoes em curso pre-v5.0.0 podem completar sem mudancas. v5.0.0 aplica daqui em
diante para alinhamento canonico. Sub-checks QA novos (audit-card-mirror-coverage,
audit-modality-tracking, audit-multi-session-handoff, audit-branding-tuninho-ai)
serao adicionados em tuninho-qa v5.x.x para validar conformidade.

---

# Tuninho Resume v0.1.0

> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite.

Você é o Tuninho no papel de **Recuperador de Briefing** — gatilho explícito de retomada pós-/clear.

## Por que existe (motivação canônica)

Operador relatou que o "briefing automático via hook tuninho-hook-inicio-sessao NUNCA aconteceu" historicamente. Mesmo com seal aplicado pela Comlurb, retomadas pós-/clear ficavam sem briefing forçado. Operador frustrado em cair na "armadilha de confiar em automação que nunca foi validada".

**Solução**: comando EXPLÍCITO que o operador aciona. Sem mágica, sem dependência de timing de hook, sem suposições. Operador digita `/tuninho-resume` e vê o briefing IMEDIATAMENTE.

Esta skill é **complementar** ao hook (não substituta). Hook continua tentando injetar briefing automaticamente, MAS se falhar (por qualquer razão), o operador tem o comando como fallback garantido.

## Modos

### Modo 1 (default): apresentar briefing do handoff sealed mais recente

**Trigger**: `/tuninho-resume` ou variações listadas no description.

**Processo**:

1. Escanear `_a4tunados/_operacoes/projetos/*/handoffs/HANDOFF_*.yaml` por arquivos com `comlurb_sealed: true`
2. Escanear `_a4tunados/_operacoes/cards/*/HANDOFF.md` por arquivos com `comlurb_sealed: true` (fluxo card-isolated)
3. Ordenar todos por `seal_timestamp` (mais recente primeiro)
4. Pegar o mais recente
5. Apresentar briefing canônico ao operador

**Output**: painel completo do handoff selado mais recente, copy-paste-ready, com:
- Identidade da operação (nome, branch, commit, vault)
- Onde parou (fase, tarefa, última ação)
- DRIFT CHECK comandos copy-paste pra rodar
- PRÓXIMO PASSO concreto (1 ação)
- DECISÕES ATIVAS (não re-perguntar)
- PENDÊNCIAS (ledger)
- Artefatos-chave com paths
- Histórico de seals

### Modo 2: listar todos handoffs sealed (operador escolhe)

**Trigger**: `/tuninho-resume --list` ou `--all`

**Output**: tabela ordenada de handoffs sealed em todas as operações + cards-isolated, operador escolhe qual retomar via `/tuninho-resume --op {NN}` ou `--card {ID}`.

### Modo 3: forçar retomada de op específica

**Trigger**: `/tuninho-resume --op {NN}` ou `--card {ID}`

**Processo**: vai direto pra op/card especificada (ignora "mais recente").

## Estrutura de saída padrão

```
============================================================
🔁 RETOMADA — {OP_NOME} (sessão #{N+1})
============================================================
Handoff selado em: {seal_timestamp}
Modo do seal: {seal_mode} (Comlurb v{X.Y.Z})
Branch: {BRANCH} | Commit: {COMMIT_SHORT}
Vault: {VAULT_PATH}

▶ ONDE PAROU
  Op: {NN}_{nome} — {1-linha objetivo}
  Fase: {FASE}
  Última ação: {timestamp + descrição}

▶ DRIFT CHECK (rode ANTES de qualquer trabalho)
  $ git checkout {BRANCH}
  $ git status                # esperado: clean
  $ git rev-parse HEAD        # esperado: {commit_esperado}
  $ {comando_extra_se_aplicavel}

▶ PRÓXIMO PASSO
  {ação concreta em 1 linha}
  Comando-zero: $ {bash_se_aplicavel}

▶ DECISÕES ATIVAS (NÃO re-perguntar)
  • {decisão_1}: {valor}
  • ...

▶ PENDÊNCIAS ({N} abertas)
  [open]  PEND-{N}-001: {título}
  ...

▶ ARTEFATOS-CHAVE
  Plano:        {path}
  Discovery:    {path}
  Discovery XP: {path}
  HANDOFF:      {path}    ← VOCÊ ESTÁ AQUI

▶ HISTÓRICO DE SEALS
  {ts1} {seal_mode1}
  ...
  {ts_atual} {seal_atual}     ← último

============================================================
Para prosseguir: leia o briefing acima, rode o DRIFT CHECK,
e digite "ok" / "prossiga" / "continuar" pra começar.
============================================================
```

## Implementação

### Script principal

`scripts/resume.sh`:
```bash
#!/usr/bin/env bash
# Tuninho Resume — escaneia handoffs sealed e apresenta o mais recente
set -euo pipefail

MODE="${1:-default}"
OP_FILTER="${2:-}"

# Coletar todos os handoffs sealed
SEALED=()

# Ops DDCE multi-fase
while IFS= read -r f; do
  if grep -q "comlurb_sealed: true" "$f" 2>/dev/null; then
    TS=$(grep -m1 "seal_timestamp:" "$f" | sed 's/.*seal_timestamp: *//; s/[\"'"'"']//g')
    SEALED+=("$TS|$f|op")
  fi
done < <(find _a4tunados/_operacoes/projetos -name "HANDOFF_*.yaml" 2>/dev/null)

# Cards isolados
while IFS= read -r f; do
  if grep -q "comlurb_sealed: true" "$f" 2>/dev/null; then
    TS=$(grep -m1 "Selado em:" "$f" | sed 's/.*Selado em: *//')
    SEALED+=("$TS|$f|card")
  fi
done < <(find _a4tunados/_operacoes/cards -name "HANDOFF.md" 2>/dev/null)

if [ ${#SEALED[@]} -eq 0 ]; then
  echo "Nenhum handoff selado encontrado em _a4tunados/_operacoes/"
  echo "Nada pra retomar — operação pode estar em andamento sem Comlurb seal."
  exit 0
fi

# Ordenar por timestamp (mais recente primeiro)
LATEST=$(printf '%s\n' "${SEALED[@]}" | sort -r | head -1)
TS=$(echo "$LATEST" | cut -d'|' -f1)
PATH_HANDOFF=$(echo "$LATEST" | cut -d'|' -f2)
TYPE=$(echo "$LATEST" | cut -d'|' -f3)

if [ "$MODE" = "--list" ] || [ "$MODE" = "--all" ]; then
  echo "Handoffs sealed encontrados (mais recente primeiro):"
  printf '%s\n' "${SEALED[@]}" | sort -r | while IFS='|' read -r ts path type; do
    OP=$(echo "$path" | grep -oE '/(projetos|cards)/[^/]+/' | sed 's|/||g')
    echo "  $ts | $type | $OP | $path"
  done
  exit 0
fi

# Apresentar briefing do mais recente
echo "============================================================"
echo "🔁 RETOMADA — Handoff sealed mais recente"
echo "============================================================"
echo "Selado em: $TS"
echo "Type: $TYPE"
echo "Path: $PATH_HANDOFF"
echo ""
echo "--- BRIEFING ---"
cat "$PATH_HANDOFF"
echo ""
echo "============================================================"
echo "Para prosseguir: leia o briefing acima, rode DRIFT CHECK"
echo "(comandos no campo briefing_proxima_sessao), e digite 'ok'"
echo "ou 'prossiga' para continuar."
echo "============================================================"
```

### Como o agente apresenta

Quando operador digita `/tuninho-resume`:

1. Agente invoca `Skill: tuninho-resume`
2. Roda `scripts/resume.sh` para coletar handoff sealed mais recente
3. Lê o conteúdo do handoff via Read tool
4. Apresenta briefing FORMATADO (não dump cru) ao operador, organizando os campos no layout canônico
5. Espera operador dizer "ok"/"prossiga"/"continuar"

### Variantes

- `/tuninho-resume --list` ou `/tuninho-resume --all`: lista todos sealed, operador escolhe
- `/tuninho-resume --op 17`: força retomar Op 17 (ignora "mais recente")
- `/tuninho-resume --card 1234567`: força retomar card-isolated específico

## Anti-padrões rejeitados

❌ **Confiar em hook automático sem fallback** — historicamente não funcionou, operador perdeu confiança
❌ **Retomar sem ler handoff** — risco de drift, agente age cego
❌ **Resumir o handoff em 1 linha** — operador precisa do briefing completo, não resumo
❌ **Inventar contexto** — se sealed e briefing está incompleto, REPORTAR, não preencher

## Integração com outras skills

| Skill | Como integra |
|---|---|
| `tuninho-hook-inicio-sessao` | Hook tenta injetar briefing automático no `additionalContext`. Se falhar, operador usa /tuninho-resume como fallback explícito. Hook + skill são REDUNDANTES POR DESIGN. |
| `tuninho-da-comlurb` | Comlurb v0.7.1+ aplica seal. /tuninho-resume lê esse seal. |
| `tuninho-da-comlurb v0.8.0+` | Quando v0.8.0 implementado, Comlurb gera HANDOFF no template canônico (9 seções). /tuninho-resume apresenta as 9 seções diretamente. |
| `tuninho-ddce` | DDCE Etapa 0/9 (retomada via /ddce-continuar) pode invocar /tuninho-resume internamente como passo de re-contextualização. |

## Regras Inviolaveis

| # | Regra |
|---|---|
| 1 | NUNCA inventar conteúdo do briefing — apresentar EXATAMENTE o que está no handoff sealed |
| 2 | NUNCA pular o DRIFT CHECK — sempre apresentar comandos pra operador rodar |
| 3 | NUNCA assumir que operador ack o briefing — esperar resposta explícita |
| 4 | SEMPRE ordenar por seal_timestamp (mais recente primeiro) por default |
| 5 | SEMPRE incluir path do handoff no output (operador pode querer abrir manualmente) |

## Versionamento

### Histórico

- **v0.1.0** (2026-05-02): Versão inicial criada na Op 17 do projeto a4tunados_web_claude_code.
  Motivação canônica: operador relatou que briefing automático via hook NUNCA funcionou, exigindo gatilho explícito que ele aciona quando sente necessidade. Substitui dependência em hook automático por comando determinístico.
