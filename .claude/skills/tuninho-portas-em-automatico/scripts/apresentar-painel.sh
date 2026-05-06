#!/usr/bin/env bash
# apresentar-painel.sh — Formata o painel de pre-voo "Portas em Automatico"
#
# Usage:
#   ./apresentar-painel.sh --projeto NOME --operacao NN --preflight EXIT --preflight-output OUTPUT
#
# Responsabilidade 6 da skill tuninho-portas-em-automatico.

set -u

PROJETO="unknown"
OPERACAO=""
PREFLIGHT_EXIT=0
PREFLIGHT_OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --projeto) PROJETO="$2"; shift 2 ;;
    --operacao) OPERACAO="$2"; shift 2 ;;
    --preflight) PREFLIGHT_EXIT="$2"; shift 2 ;;
    --preflight-output) PREFLIGHT_OUTPUT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Detecta sessao atual inferindo via arquivo HANDOFF mais recente
SESSAO_ATUAL=""
SESSAO_ANTERIOR=""
if [[ -n "$OPERACAO" ]]; then
  OP_DIR=$(find _a4tunados/_operacoes/projetos/ -maxdepth 1 -type d -name "${OPERACAO}_*" 2>/dev/null | head -1)
  if [[ -n "$OP_DIR" && -d "$OP_DIR/handoffs" ]]; then
    # Pega o arquivo HANDOFF mais recente
    LATEST_HANDOFF=$(find "$OP_DIR/handoffs" -maxdepth 1 -name "HANDOFF_*_sessao_*.yaml" 2>/dev/null | sort | tail -1)
    PREV_HANDOFF=$(find "$OP_DIR/handoffs" -maxdepth 1 -name "HANDOFF_*_sessao_*.yaml" 2>/dev/null | sort | tail -2 | head -1)

    if [[ -n "$LATEST_HANDOFF" ]]; then
      SESSAO_ATUAL=$(basename "$LATEST_HANDOFF" | sed -nE 's/.*_sessao_([0-9]+)\.yaml/\1/p')
    fi
    if [[ -n "$PREV_HANDOFF" && "$PREV_HANDOFF" != "$LATEST_HANDOFF" ]]; then
      SESSAO_ANTERIOR=$(basename "$PREV_HANDOFF" | sed -nE 's/.*_sessao_([0-9]+)\.yaml/\1/p')
    fi

    # Conta raw_sessions coletadas
    if [[ -d "$OP_DIR/handoffs/raw_sessions" ]]; then
      RAW_LOCAL_COUNT=$(find "$OP_DIR/handoffs/raw_sessions" -maxdepth 1 -name "*.jsonl" 2>/dev/null | wc -l | tr -d ' ')
      PLAN_FILES_COUNT=$(find "$OP_DIR/handoffs/raw_sessions/plan_files" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ')
    fi
  fi
fi

RAW_LOCAL_COUNT="${RAW_LOCAL_COUNT:-0}"
PLAN_FILES_COUNT="${PLAN_FILES_COUNT:-0}"
SESSAO_ATUAL="${SESSAO_ATUAL:-?}"
SESSAO_ANTERIOR="${SESSAO_ANTERIOR:-nenhuma}"

# Parse preflight output (key=status|message)
BRANCH_STATUS=""
WT_STATUS=""
SKILLS_STATUS=""
HOOK_STATUS=""
SENTINEL_STATUS=""
QA_STATUS=""
CARDS_STATUS=""
TOTAL_PASS=0
TOTAL_WARN=0
TOTAL_FAIL=0

while IFS= read -r line; do
  case "$line" in
    branch=*)          BRANCH_STATUS="${line#branch=}" ;;
    working_tree=*)    WT_STATUS="${line#working_tree=}" ;;
    skills=*)          SKILLS_STATUS="${line#skills=}" ;;
    hook_conta_token=*) HOOK_STATUS="${line#hook_conta_token=}" ;;
    sentinel_bypass=*) SENTINEL_STATUS="${line#sentinel_bypass=}" ;;
    tuninho_qa=*)      QA_STATUS="${line#tuninho_qa=}" ;;
    cards_manifest=*)  CARDS_STATUS="${line#cards_manifest=}" ;;
    totals=*)
      TOTALS_RAW="${line#totals=}"
      TOTAL_PASS="${TOTALS_RAW%%|*}"
      TOTALS_RAW="${TOTALS_RAW#*|}"
      TOTAL_WARN="${TOTALS_RAW%%|*}"
      TOTAL_FAIL="${TOTALS_RAW##*|}"
      ;;
  esac
done <<< "$PREFLIGHT_OUTPUT"

icon() {
  case "$1" in
    PASS*) echo "✅" ;;
    WARN*) echo "⚠️ " ;;
    FAIL*) echo "❌" ;;
    *)     echo "· " ;;
  esac
}

# Determina status final
if [[ "$TOTAL_FAIL" -gt 0 ]]; then
  STATUS_FINAL="❌ PRE-FLIGHT FAIL — sessao segue mas com gaps criticos"
elif [[ "$TOTAL_WARN" -gt 0 ]]; then
  STATUS_FINAL="⚠️  PRE-FLIGHT WARN — $TOTAL_WARN avisos nao-bloqueantes"
else
  STATUS_FINAL="✅ LIBERADO PARA INICIO"
fi

cat <<PANEL

╔══════════════════════════════════════════════════════════════╗
║   🛬 PORTAS EM AUTOMATICO — Pre-Flight Sessao Claude Code    ║
╠══════════════════════════════════════════════════════════════╣
║ Projeto:    $PROJETO
║ Operacao:   Op ${OPERACAO:-(nenhuma)}
║ Sessao:     $SESSAO_ATUAL (anterior: $SESSAO_ANTERIOR)
║
║ Raw sessions coletadas:
║   • Local: $RAW_LOCAL_COUNT JSONLs
║   • Plan files: $PLAN_FILES_COUNT
║
║ Pre-flight checks (7):
║   $(icon "$BRANCH_STATUS")   branch:        ${BRANCH_STATUS##*|}
║   $(icon "$WT_STATUS")   working tree:  ${WT_STATUS##*|}
║   $(icon "$SKILLS_STATUS")   skills:        ${SKILLS_STATUS##*|}
║   $(icon "$HOOK_STATUS")   hook token:    ${HOOK_STATUS##*|}
║   $(icon "$SENTINEL_STATUS")   sentinel:      ${SENTINEL_STATUS##*|}
║   $(icon "$QA_STATUS")   tuninho-qa:    ${QA_STATUS##*|}
║   $(icon "$CARDS_STATUS")   cards:         ${CARDS_STATUS##*|}
║
║ Totais: $TOTAL_PASS PASS, $TOTAL_WARN WARN, $TOTAL_FAIL FAIL
║
║ STATUS: $STATUS_FINAL
╚══════════════════════════════════════════════════════════════╝

PANEL

exit 0
