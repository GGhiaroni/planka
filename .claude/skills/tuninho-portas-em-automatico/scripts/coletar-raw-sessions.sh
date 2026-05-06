#!/usr/bin/env bash
# coletar-raw-sessions.sh — Copia JSONLs de sessoes anteriores para handoffs/raw_sessions/
#
# Usage: ./coletar-raw-sessions.sh [--operacao NN]
#
# Responsabilidades 1 + 2 da skill tuninho-portas-em-automatico.

set -u

OPERACAO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --operacao) OPERACAO="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# NOTA v0.4.1: nao abortamos se OPERACAO="" — ainda podemos estar em fluxo
# card-isolated (detectado via branch git mais abaixo). So abortamos se
# nem OPERACAO nem card-isolated forem detectados.

# Detecta o slug do projeto para achar a pasta em ~/.claude/projects/
# Claude Code normaliza '/', '.', '_' e qualquer nao-alfanum para '-' no slug
CWD_SLUG=$(echo "$PWD" | sed 's|[^a-zA-Z0-9-]|-|g')
CLAUDE_PROJ_DIR="$HOME/.claude/projects/${CWD_SLUG}"

if [[ ! -d "$CLAUDE_PROJ_DIR" ]]; then
  echo "# coletar-raw-sessions: ~/.claude/projects/${CWD_SLUG}/ nao existe — nada a coletar"
  exit 0
fi

# Detecta destino conforme fluxo:
#   - Fluxo card-isolated (branch card/...): _operacoes/cards/{id}_*/raw_sessions/
#   - Fluxo Op normal: _operacoes/projetos/{NN}_*/handoffs/raw_sessions/
DEST_DIR=""
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ "$CURRENT_BRANCH" =~ ^card/ ]]; then
  CARD_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+$' | head -1)
  if [[ -n "$CARD_ID" ]]; then
    CARD_DIR=$(find _a4tunados/_operacoes/cards/ -maxdepth 1 -type d -name "${CARD_ID}_*" 2>/dev/null | head -1)
    if [[ -n "$CARD_DIR" ]]; then
      DEST_DIR="$CARD_DIR/raw_sessions"
    fi
  fi
fi

if [[ -z "$DEST_DIR" ]]; then
  OP_DIR=$(find _a4tunados/_operacoes/projetos/ -maxdepth 1 -type d -name "${OPERACAO}_*" 2>/dev/null | head -1)
  if [[ -z "$OP_DIR" ]]; then
    echo "# coletar-raw-sessions: nem card-isolated (branch=$CURRENT_BRANCH) nem operacao Op '$OPERACAO' encontrados"
    exit 0
  fi
  DEST_DIR="$OP_DIR/handoffs/raw_sessions"
fi

mkdir -p "$DEST_DIR"

COPIED=0
SKIPPED=0

# Itera JSONLs ordenados por mtime (mais antigos primeiro → sessao 01, 02, ...)
SESSION_NUM=0
for jsonl in $(ls -tr "$CLAUDE_PROJ_DIR"/*.jsonl 2>/dev/null); do
  SESSION_NUM=$((SESSION_NUM + 1))
  JSONL_NAME=$(basename "$jsonl")
  UUID_SHORT=$(echo "$JSONL_NAME" | cut -c1-8)
  MTIME_DATE=$(date -r "$jsonl" +%Y-%m-%d 2>/dev/null || echo "unknown")
  SESSION_PAD=$(printf "%02d" "$SESSION_NUM")

  # Verifica se ja foi copiado (match parcial por UUID curto)
  EXISTING=$(find "$DEST_DIR" -maxdepth 1 -name "*_${UUID_SHORT}.jsonl" -o -name "*_${UUID_SHORT}_partial.jsonl" 2>/dev/null | head -1)
  if [[ -n "$EXISTING" ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Copia
  DEST_NAME="${MTIME_DATE}_sessao_${SESSION_PAD}_${UUID_SHORT}.jsonl"
  cp "$jsonl" "$DEST_DIR/$DEST_NAME" 2>/dev/null && COPIED=$((COPIED + 1)) || true
done

echo "# coletar-raw-sessions: $COPIED novos JSONLs copiados, $SKIPPED ja existentes"

# Lista plan files do projeto no Claude (busca recursiva em ~/.claude/projects/{slug}/)
if [[ -d "$CLAUDE_PROJ_DIR" ]]; then
  OTHER_FILES=$(find "$CLAUDE_PROJ_DIR" -maxdepth 2 -type f -not -name "*.jsonl" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$OTHER_FILES" -gt 0 ]]; then
    echo "# coletar-raw-sessions: $OTHER_FILES arquivos nao-jsonl detectados em ~/.claude/projects/{slug}/ (nao copiados — verificar manualmente)"
  fi
fi

exit 0
