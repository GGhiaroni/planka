#!/usr/bin/env bash
# coletar-plan-files.sh — Copia plan files do ~/.claude/plans e ~/.claude/todos
# para handoffs/raw_sessions/plan_files/
#
# Usage: ./coletar-plan-files.sh [--operacao NN]
#
# Responsabilidade 3 da skill tuninho-portas-em-automatico.

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

# Detecta destino conforme fluxo:
#   - Fluxo card-isolated (branch card/...): _operacoes/cards/{id}_*/raw_sessions/plan_files/
#   - Fluxo Op normal: _operacoes/projetos/{NN}_*/handoffs/raw_sessions/plan_files/
DEST_DIR=""
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ "$CURRENT_BRANCH" =~ ^card/ ]]; then
  CARD_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+$' | head -1)
  if [[ -n "$CARD_ID" ]]; then
    CARD_DIR=$(find _a4tunados/_operacoes/cards/ -maxdepth 1 -type d -name "${CARD_ID}_*" 2>/dev/null | head -1)
    if [[ -n "$CARD_DIR" ]]; then
      DEST_DIR="$CARD_DIR/raw_sessions/plan_files"
    fi
  fi
fi

if [[ -z "$DEST_DIR" ]]; then
  OP_DIR=$(find _a4tunados/_operacoes/projetos/ -maxdepth 1 -type d -name "${OPERACAO}_*" 2>/dev/null | head -1)
  if [[ -z "$OP_DIR" ]]; then
    echo "# coletar-plan-files: nem card-isolated (branch=$CURRENT_BRANCH) nem operacao Op '$OPERACAO' encontrados"
    exit 0
  fi
  DEST_DIR="$OP_DIR/handoffs/raw_sessions/plan_files"
fi

mkdir -p "$DEST_DIR"

COPIED=0
SKIPPED=0
IRRELEVANT=0
PROJ_ROOT="$PWD"
PROJ_SHORT=$(basename "$PWD")

# Tenta varios paths conhecidos (tolerante a ausencia)
# NOTA v0.1.0: ~/.claude/todos/ e pulado por default — arquivos efemeros de TodoWrite
# (2 bytes cada) nao sao relevantes como contexto de handoff.
for PLANS_DIR in "$HOME/.claude/plans"; do
  if [[ ! -d "$PLANS_DIR" ]]; then
    continue
  fi

  # So copia arquivos modificados nos ultimos 30 dias, nao vazios (> 100 bytes),
  # E que referenciam o projeto corrente no conteudo (filtro anti-polucao)
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    FSIZE=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
    if [[ "$FSIZE" -lt 100 ]]; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    # Filtro de relevancia: plan file deve mencionar o projeto no conteudo
    # (path absoluto, nome curto, ou o slug invertido usado pelo Claude Code)
    if ! grep -qF "$PROJ_ROOT" "$f" 2>/dev/null && ! grep -qF "$PROJ_SHORT" "$f" 2>/dev/null; then
      IRRELEVANT=$((IRRELEVANT + 1))
      continue
    fi

    FNAME=$(basename "$f")
    MTIME_DATE=$(date -r "$f" +%Y-%m-%d 2>/dev/null || echo "unknown")
    DEST_NAME="${MTIME_DATE}_${FNAME}"

    if [[ -f "$DEST_DIR/$DEST_NAME" ]]; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    cp "$f" "$DEST_DIR/$DEST_NAME" 2>/dev/null && COPIED=$((COPIED + 1)) || true
  done < <(find "$PLANS_DIR" -maxdepth 1 -type f -mtime -30 2>/dev/null)
done

echo "# coletar-plan-files: $COPIED plan files relevantes copiados, $SKIPPED ignorados, $IRRELEVANT de outros projetos (filtrados)"
exit 0
