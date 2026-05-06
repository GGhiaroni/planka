#!/usr/bin/env bash
# Tuninho Resume v0.1.0 — escaneia handoffs sealed e apresenta o mais recente
# Usage: resume.sh [--list|--all] [--op NN] [--card ID]
set -euo pipefail

MODE="default"
OP_FILTER=""
CARD_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list|--all) MODE="list"; shift ;;
    --op) OP_FILTER="$2"; shift 2 ;;
    --card) CARD_FILTER="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Coletar handoffs sealed
SEALED_FILE=$(mktemp)
trap "rm -f $SEALED_FILE" EXIT

# Ops DDCE multi-fase
find _a4tunados/_operacoes/projetos -name "HANDOFF_*.yaml" 2>/dev/null | while read -r f; do
  if grep -q "^comlurb_sealed: true" "$f" 2>/dev/null; then
    TS=$(grep -m1 "^seal_timestamp:" "$f" | sed "s/^seal_timestamp:[[:space:]]*//; s/['\"]//g; s/^[[:space:]]*//; s/[[:space:]]*$//")
    OP=$(echo "$f" | grep -oE 'projetos/[0-9]+_[^/]+' | sed 's|projetos/||')
    echo "${TS}|${f}|op|${OP}" >> "$SEALED_FILE"
  fi
done

# Cards isolados
find _a4tunados/_operacoes/cards -name "HANDOFF.md" 2>/dev/null | while read -r f; do
  if grep -q "comlurb_sealed: true" "$f" 2>/dev/null; then
    TS=$(grep -m1 "Selado em:" "$f" | sed "s/.*Selado em:[[:space:]]*//; s/^[[:space:]]*//; s/[[:space:]]*$//")
    CID=$(echo "$f" | grep -oE 'cards/[^/]+' | sed 's|cards/||')
    echo "${TS}|${f}|card|${CID}" >> "$SEALED_FILE"
  fi
done

if [ ! -s "$SEALED_FILE" ]; then
  echo "Nenhum handoff selado encontrado em _a4tunados/_operacoes/"
  echo "Nada pra retomar — operação pode estar em andamento sem Comlurb seal."
  exit 0
fi

# Filtrar por --op ou --card se especificado
if [ -n "$OP_FILTER" ]; then
  grep "^.*|.*|op|${OP_FILTER}" "$SEALED_FILE" > "${SEALED_FILE}.filtered" || true
  mv "${SEALED_FILE}.filtered" "$SEALED_FILE"
  if [ ! -s "$SEALED_FILE" ]; then
    echo "Nenhum handoff sealed encontrado para Op ${OP_FILTER}"
    exit 1
  fi
fi

if [ -n "$CARD_FILTER" ]; then
  grep "^.*|.*|card|.*${CARD_FILTER}" "$SEALED_FILE" > "${SEALED_FILE}.filtered" || true
  mv "${SEALED_FILE}.filtered" "$SEALED_FILE"
  if [ ! -s "$SEALED_FILE" ]; then
    echo "Nenhum handoff sealed encontrado para Card ${CARD_FILTER}"
    exit 1
  fi
fi

# Modo list: apresenta tabela
if [ "$MODE" = "list" ]; then
  echo "Handoffs sealed encontrados (mais recente primeiro):"
  echo ""
  printf "%-22s | %-6s | %-50s\n" "TIMESTAMP" "TYPE" "OPERAÇÃO/CARD"
  printf "%-22s-+-%-6s-+-%-50s\n" "----------------------" "------" "--------------------------------------------------"
  sort -r "$SEALED_FILE" | while IFS='|' read -r ts path type id; do
    printf "%-22s | %-6s | %s\n" "$ts" "$type" "$id"
  done
  echo ""
  echo "Para retomar específico:"
  echo "  /tuninho-resume --op {NN}"
  echo "  /tuninho-resume --card {ID}"
  exit 0
fi

# Modo default: pegar o mais recente
LATEST=$(sort -r "$SEALED_FILE" | head -1)
TS=$(echo "$LATEST" | cut -d'|' -f1)
PATH_HANDOFF=$(echo "$LATEST" | cut -d'|' -f2)
TYPE=$(echo "$LATEST" | cut -d'|' -f3)
ID=$(echo "$LATEST" | cut -d'|' -f4)

cat << HEADER
============================================================
🔁 RETOMADA — Tuninho Resume v0.1.0
============================================================
Handoff selado mais recente:
  Timestamp: $TS
  Type:      $TYPE
  ID:        $ID
  Path:      $PATH_HANDOFF
============================================================

--- CONTEÚDO INTEGRAL DO HANDOFF ---
HEADER

cat "$PATH_HANDOFF"

cat << FOOTER

============================================================
PRÓXIMOS PASSOS:
1. Leia o briefing acima (especialmente: estado_final,
   proximos_passos_sessao_2, briefing_proxima_sessao,
   pendencias_finais)
2. Rode os comandos do DRIFT CHECK (git status, git rev-parse, etc)
3. Digite 'ok' / 'prossiga' / 'continuar' para o agente seguir
============================================================
FOOTER
