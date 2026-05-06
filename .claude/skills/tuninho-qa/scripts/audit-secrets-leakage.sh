#!/usr/bin/env bash
# audit-secrets-leakage.sh — Scan de secrets em comments de cards do mural
#
# Implementa Regra #30 do tuninho-mural v0.3.0 + sub-check de audit-gate-final
# do tuninho-qa v0.8.0. Motivado por GAP-OP05-004 (chave OpenRouter exposta
# em comentario publico do board prod).
#
# Usage:
#   ./audit-secrets-leakage.sh <CARD_ID> [--env prod|stage|dev]
#
# Exit codes:
#   0 — zero secrets detectados
#   1 — secrets detectados (WARN, nao bloqueia gate; operador decide)
#   2 — erro de execucao (card nao encontrado, API falhou)

set -u

CARD_ID="${1:-}"
ENV="${2:-prod}"

if [[ -z "$CARD_ID" ]]; then
  echo "Usage: $0 <CARD_ID> [--env prod|stage|dev]"
  exit 2
fi

# Normalizar --env
if [[ "$ENV" == "--env" ]]; then
  ENV="${3:-prod}"
fi

MURAL_CLI=".claude/skills/tuninho-mural/cli/mural-cli.js"
if [[ ! -f "$MURAL_CLI" ]]; then
  echo "ERROR: tuninho-mural CLI nao encontrado em $MURAL_CLI"
  exit 2
fi

# Carregar credenciais do env (endpoint `/api/cards/:id/comments` exige Bearer)
# Ver L5 do `audit-secrets-leakage`: fetch-card NAO inclui comments em
# `included` — necessario endpoint dedicado. CLI pode ser estendido em
# v0.3.1 com modo `fetch-comments`, enquanto isso usamos curl direto.
ENV_FILE="_a4tunados/env/mural/.env.mural.${ENV}"
[[ "$ENV" == "prod" ]] && ENV_FILE="_a4tunados/env/mural/.env.mural.prod"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: credenciais nao encontradas em $ENV_FILE"
  exit 2
fi
# shellcheck source=/dev/null
source "$ENV_FILE"
if [[ -z "${MURAL_API_URL:-}" || -z "${MURAL_TUNINHO_TOKEN:-}" ]]; then
  echo "ERROR: MURAL_API_URL ou MURAL_TUNINHO_TOKEN ausentes em $ENV_FILE"
  exit 2
fi

# Patterns de secret (v1 — lista inicial, expandir conforme for aprendendo)
# Cada pattern e uma regex PCRE que detecta um secret prefix-based comum
PATTERNS=(
  'sk-or-v1-[a-zA-Z0-9_-]{32,}'               # OpenRouter
  'sk-[a-zA-Z0-9]{40,}'                       # OpenAI / generic sk-
  'sk-ant-api03-[a-zA-Z0-9_-]{90,}'           # Anthropic API
  'AIza[0-9A-Za-z_-]{35}'                     # Google / Firebase API key
  'ya29\.[0-9A-Za-z_-]{20,}'                  # Google OAuth access token
  'ghp_[0-9A-Za-z]{36,}'                      # GitHub personal access token
  'gho_[0-9A-Za-z]{36,}'                      # GitHub OAuth token
  'xoxb-[0-9]{10,}-[0-9]{10,}-[0-9a-zA-Z]{24,}'  # Slack bot token
  'xoxp-[0-9]{10,}-[0-9]{10,}-[0-9]{10,}-[0-9a-f]{32,}'  # Slack user token
  'eyJ[a-zA-Z0-9_=-]+\.eyJ[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_.+/=-]+'  # JWT (any)
  '-----BEGIN (RSA |EC |DSA |OPENSSH |PRIVATE )?PRIVATE KEY-----'
  'pat-[0-9a-f]{32,}'                         # Airtable/generic pat-
  'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'  # SendGrid
)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AUDIT-SECRETS-LEAKAGE — Card $CARD_ID                      ║"
echo "║  (tuninho-qa v0.8.0+ | Regra #30 tuninho-mural v0.3.0)     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Env: $ENV"
echo

# Fetch card pra pegar description
CARD_JSON=$(node "$MURAL_CLI" fetch-card --card "$CARD_ID" --env "$ENV" 2>/dev/null)
if [[ -z "$CARD_JSON" ]]; then
  echo "ERROR: falha ao buscar card via tuninho-mural"
  exit 2
fi

# Fetch comments via endpoint dedicado (fetch-card nao inclui)
COMMENTS_JSON=$(curl -sS "${MURAL_API_URL}/api/cards/${CARD_ID}/comments" \
  -H "Authorization: Bearer ${MURAL_TUNINHO_TOKEN}" 2>/dev/null)

COMMENTS_TEXT=$(echo "$COMMENTS_JSON" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    comments = data.get('items', [])
    for c in comments:
        cid = c.get('id', '?')
        text = c.get('text', '') or ''
        created = c.get('createdAt', '?')
        print(f'---COMMENT-{cid}|{created}---')
        print(text)
except Exception as e:
    sys.stderr.write(f'parse comments err: {e}\n')
    sys.exit(1)
" 2>/dev/null)

N_COMMENTS=$(echo "$COMMENTS_TEXT" | grep -c '^---COMMENT-' || echo 0)

# Description do card
DESC_TEXT=$(echo "$CARD_JSON" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    item = data.get('item', {})
    desc = item.get('description') or ''
    print('---DESCRIPTION---')
    print(desc)
except Exception:
    pass
" 2>/dev/null)

FULL_TEXT="$DESC_TEXT"$'\n'"$COMMENTS_TEXT"

if [[ -z "$FULL_TEXT" ]]; then
  echo "⚠  WARN: Card $CARD_ID sem description nem comments — nada a escanear"
  exit 0
fi

LEAKS_FOUND=0
LEAK_REPORT=""

# Scan por cada pattern
for PAT in "${PATTERNS[@]}"; do
  MATCHES=$(echo "$FULL_TEXT" | grep -oP "$PAT" 2>/dev/null | sort -u)
  if [[ -n "$MATCHES" ]]; then
    COUNT=$(echo "$MATCHES" | wc -l | tr -d ' ')
    LEAKS_FOUND=$((LEAKS_FOUND + COUNT))
    # Contexto: qual comment teve o match?
    while IFS= read -r match; do
      # Redigir o match (primeiros 12 chars + ***)
      PREVIEW="${match:0:12}***(${#match}chars)"
      # Localizar em qual comment apareceu
      LOC=$(echo "$FULL_TEXT" | awk -v pat="$match" '
        /^---(COMMENT|DESCRIPTION)/ { section=$0 }
        index($0, pat) { print section; exit }
      ')
      LEAK_REPORT+=$'\n'"  ❌ PATTERN: ${PAT:0:30}..."
      LEAK_REPORT+=$'\n'"     PREVIEW: $PREVIEW"
      LEAK_REPORT+=$'\n'"     LOCAL:   $LOC"
    done <<< "$MATCHES"
  fi
done

# Report
echo "── Resultado ──"
if [[ "$LEAKS_FOUND" -eq 0 ]]; then
  echo "✅ PASS: Nenhum secret detectado em description + $N_COMMENTS comments"
  exit 0
fi

echo "Escaneados: description + $N_COMMENTS comments"

echo "⚠  WARN: $LEAKS_FOUND secret(s) detectado(s) em texto publico do card"
echo "$LEAK_REPORT"
echo
echo "── Recomendacao ──"
echo "  1. Avaliar risco com operador — historico Planka e imutavel"
echo "  2. Se critico: rotacionar credential + editar/deletar comment via mural API"
echo "  3. Adicionar helper tuninho-mural v0.3.0 redact-secrets no fluxo de postagem"
echo "     pra prevenir reincidencia (alerta soft pre-post)"
echo
echo "Regra operacional: WARN nao bloqueia gate — operador decide trade-off"
echo "(conforme decisao Op 05 GAP-OP05-004, 2026-04-23T15:18Z)"

exit 1
