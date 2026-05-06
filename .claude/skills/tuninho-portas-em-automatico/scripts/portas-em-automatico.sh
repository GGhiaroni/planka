#!/usr/bin/env bash
# portas-em-automatico.sh — Entry-point da skill tuninho-portas-em-automatico
#
# Orquestra os 4 sub-scripts:
#   1. coletar-raw-sessions.sh
#   2. coletar-plan-files.sh
#   3. preflight-checks.sh
#   4. apresentar-painel.sh
#
# Invocado pelo hook tuninho-hook-inicio-sessao.py (via subprocess) OU manualmente.
#
# Usage:
#   ./portas-em-automatico.sh [--silent] [--operacao NN]
#
# Exit codes:
#   0 — Pre-flight PASS ou WARN (nao bloqueia)
#   1 — Erro interno (script quebrado)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

SILENT=0
OPERACAO=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --silent) SILENT=1; shift ;;
    --operacao) OPERACAO="$2"; shift 2 ;;
    *) shift ;;
  esac
done

log() {
  [[ "$SILENT" == "0" ]] && echo "$@"
}

# Detecta projeto via git remote
PROJECT_NAME=$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||' 2>/dev/null)
if [[ -z "$PROJECT_NAME" ]]; then
  PROJECT_NAME=$(basename "$(pwd)")
fi

# Detecta operacao ativa:
#   1. Fluxo card-isolated (branch card/...): OPERACAO="card-{id}"
#   2. Fallback: ultima operacao Op em _operacoes/projetos/
if [[ -z "$OPERACAO" ]]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$CURRENT_BRANCH" =~ ^card/ ]]; then
    CARD_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+$' | head -1)
    if [[ -n "$CARD_ID" ]]; then
      CARD_DIR=$(find _a4tunados/_operacoes/cards/ -maxdepth 1 -type d -name "${CARD_ID}_*" 2>/dev/null | head -1)
      if [[ -n "$CARD_DIR" ]]; then
        OPERACAO="card-${CARD_ID}"
      fi
    fi
  fi
  if [[ -z "$OPERACAO" ]]; then
    LATEST_OP_DIR=$(ls -dt _a4tunados/_operacoes/projetos/*/ 2>/dev/null | head -1)
    if [[ -n "$LATEST_OP_DIR" ]]; then
      OPERACAO=$(basename "$LATEST_OP_DIR" | sed 's/_.*$//')
    fi
  fi
fi

log "# Tuninho Portas em Automatico v0.4.1"
log "# Projeto: $PROJECT_NAME"
log "# Operacao ativa: ${OPERACAO:-nenhuma}"
log ""

# 1. Coletar raw sessions
if [[ -x "$SCRIPT_DIR/coletar-raw-sessions.sh" ]]; then
  COLETA_OUTPUT=$("$SCRIPT_DIR/coletar-raw-sessions.sh" --operacao "${OPERACAO:-}" 2>&1 || true)
  log "$COLETA_OUTPUT"
fi

# 2. Coletar plan files
if [[ -x "$SCRIPT_DIR/coletar-plan-files.sh" ]]; then
  PLAN_OUTPUT=$("$SCRIPT_DIR/coletar-plan-files.sh" --operacao "${OPERACAO:-}" 2>&1 || true)
  log "$PLAN_OUTPUT"
fi

# 3. Pre-flight checks
if [[ -x "$SCRIPT_DIR/preflight-checks.sh" ]]; then
  PREFLIGHT_OUTPUT=$("$SCRIPT_DIR/preflight-checks.sh" 2>&1 || true)
  PREFLIGHT_EXIT=$?
else
  PREFLIGHT_OUTPUT="(preflight-checks.sh nao encontrado)"
  PREFLIGHT_EXIT=1
fi

# 4. Apresentar painel (sempre, mesmo em --silent — painel e o output principal)
if [[ -x "$SCRIPT_DIR/apresentar-painel.sh" ]]; then
  "$SCRIPT_DIR/apresentar-painel.sh" \
    --projeto "$PROJECT_NAME" \
    --operacao "${OPERACAO:-}" \
    --preflight "$PREFLIGHT_EXIT" \
    --preflight-output "$PREFLIGHT_OUTPUT"
fi

exit 0
