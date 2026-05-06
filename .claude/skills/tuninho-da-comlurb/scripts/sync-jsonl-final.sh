#!/usr/bin/env bash
# Comlurb Passo 1 — Sincronizar JSONL da sessao atual + plan files
# Copia JSONL corrente de ~/.claude/projects/{slug}/ para handoffs/raw_sessions/
# como {data}_sessao_{NN}_{uuid8}_partial.jsonl

set -eu

CWD="$(pwd)"
OP_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cwd) CWD="$2"; shift 2;;
    --op-dir) OP_DIR="$2"; shift 2;;
    *) shift;;
  esac
done

if [[ -z "$OP_DIR" ]] || [[ ! -d "$CWD/$OP_DIR" ]]; then
  echo "  ⚠ Operacao nao identificada — skip passo 1 detalhado"
  echo "  OP_DIR=$OP_DIR"
  exit 0
fi

cd "$CWD"

# Derivar slug do projeto (Claude Code convention: / → -, remove leading -, . → -)
SLUG=$(echo "$CWD" | sed 's|/|-|g; s|^-||; s|\.|-|g')
CLAUDE_PROJ_DIR="$HOME/.claude/projects/-$SLUG"

echo "  Slug: $SLUG"
echo "  Claude dir: $CLAUDE_PROJ_DIR"

if [[ ! -d "$CLAUDE_PROJ_DIR" ]]; then
  echo "  ⚠ Claude projects dir nao existe — sessao sem JSONL ainda?"
  echo "  OK (skip)"
  exit 0
fi

# JSONL mais recente (sessao atual em escrita)
LATEST_JSONL=$(ls -t "$CLAUDE_PROJ_DIR"/*.jsonl 2>/dev/null | head -1 || true)

if [[ -z "$LATEST_JSONL" ]]; then
  echo "  ⚠ Nenhum JSONL encontrado"
  exit 0
fi

# Inferir numero da sessao atual: quantos handoffs ja existem?
RAW_DIR="$OP_DIR/handoffs/raw_sessions"
mkdir -p "$RAW_DIR"

# Contar sessoes existentes pra inferir NN atual
EXISTING=$(ls "$OP_DIR/handoffs"/HANDOFF_*_sessao_*.yaml 2>/dev/null | wc -l)
if [[ $EXISTING -eq 0 ]]; then
  SESSAO_NN="01"
else
  # Pega o maior numero existente (sessao corrente = ultimo)
  SESSAO_NN=$(ls "$OP_DIR/handoffs"/HANDOFF_*_sessao_*.yaml 2>/dev/null | sed 's/.*sessao_//;s/\.yaml//' | sort -n | tail -1)
fi

# UUID curto + data
JSONL_NAME=$(basename "$LATEST_JSONL" .jsonl)
UUID8="${JSONL_NAME:0:8}"
DATA=$(date -u +%Y-%m-%d)

DEST="$RAW_DIR/${DATA}_sessao_${SESSAO_NN}_${UUID8}_partial.jsonl"

# Se destino ja existe: versionar
if [[ -f "$DEST" ]]; then
  V=2
  while [[ -f "$RAW_DIR/${DATA}_sessao_${SESSAO_NN}_${UUID8}_partial_v${V}.jsonl" ]]; do
    V=$((V+1))
  done
  DEST="$RAW_DIR/${DATA}_sessao_${SESSAO_NN}_${UUID8}_partial_v${V}.jsonl"
fi

cp "$LATEST_JSONL" "$DEST"
BYTES=$(stat -c%s "$DEST" 2>/dev/null || stat -f%z "$DEST" 2>/dev/null)
echo "  ✓ JSONL sincronizado: $(basename "$DEST") ($(($BYTES / 1024)) KB)"

# Plan files — reutiliza logica do portas-em-automatico se possivel
PLAN_DIR="$RAW_DIR/plan_files"
mkdir -p "$PLAN_DIR"

PLAN_COUNT=0
shopt -s nullglob
for planfile in "$HOME/.claude/plans"/*.md; do
  [[ -f "$planfile" ]] || continue
  # Apenas plan files recentes (< 7 dias) pra essa sessao
  if find "$planfile" -mtime -7 > /dev/null 2>&1; then
    PLAN_NAME=$(basename "$planfile")
    PLAN_DEST="$PLAN_DIR/${DATA}_${PLAN_NAME}"
    if [[ ! -f "$PLAN_DEST" ]]; then
      cp "$planfile" "$PLAN_DEST"
      PLAN_COUNT=$((PLAN_COUNT+1))
    fi
  fi
done
shopt -u nullglob

echo "  ✓ Plan files sincronizados: $PLAN_COUNT"

# Export para os proximos scripts lerem
echo "COMLURB_SESSAO_NN=$SESSAO_NN" > "$OP_DIR/.comlurb-context"
echo "COMLURB_JSONL_DEST=$DEST" >> "$OP_DIR/.comlurb-context"
echo "COMLURB_DATA=$DATA" >> "$OP_DIR/.comlurb-context"

exit 0
