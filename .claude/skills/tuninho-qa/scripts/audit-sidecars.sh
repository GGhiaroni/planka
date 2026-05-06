#!/bin/bash
# audit-sidecars.sh — Tuninho QA modo 2
#
# Verifica que sidecars devops dos projetos estao alimentados:
# - tuninho-devops-hostinger-alfa/projects/{nome}/config.md
# - tuninho-devops-env/projects/{nome}/config.md
# - tuninho-devops-vercel/projects/{nome}/config.md (se aplicavel)
#
# Args opcionais:
#   $1 = nome do projeto (default: detecta via git remote)
#   $2 = output dir (default: /tmp/tuninho-qa)

set -e

PROJETO="${1:-}"
OUTPUT_DIR="${2:-/tmp/tuninho-qa}"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$OUTPUT_DIR/audit-sidecars-$TIMESTAMP.txt"

if [ -z "$PROJETO" ]; then
  PROJETO=$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||' || basename "$PWD")
fi

FAIL_COUNT=0
WARN_COUNT=0
PASS_COUNT=0

log() { echo "$1" | tee -a "$REPORT"; }
check_pass() { PASS_COUNT=$((PASS_COUNT + 1)); log "  [PASS] $1"; }
check_fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); log "  [FAIL] $1"; }
check_warn() { WARN_COUNT=$((WARN_COUNT + 1)); log "  [WARN] $1"; }

log "=== Tuninho QA — audit-sidecars ==="
log "Timestamp: $TIMESTAMP"
log "Projeto detectado: $PROJETO"
log ""

DEVOPS_SKILLS="tuninho-devops-hostinger-alfa tuninho-devops-env tuninho-devops-vercel tuninho-devops-mural-devprod"

for devops in $DEVOPS_SKILLS; do
  log "## Sidecar: $devops/projects/$PROJETO/"
  SIDECAR=".claude/skills/$devops/projects/$PROJETO/config.md"

  if [ -f "$SIDECAR" ]; then
    LINHAS=$(wc -l < "$SIDECAR" | tr -d ' ')
    PLACEHOLDERS=$(grep -c '^{.*}$' "$SIDECAR" 2>/dev/null || echo 0)

    if [ "$LINHAS" -ge 30 ]; then
      check_pass "$devops sidecar OK ($LINHAS linhas)"
    else
      check_warn "$devops sidecar muito curto ($LINHAS linhas, esperado >= 30)"
    fi

    if [ "$PLACEHOLDERS" -gt 5 ]; then
      check_fail "$devops sidecar tem $PLACEHOLDERS placeholders nao preenchidos"
    fi
  else
    check_warn "$devops sidecar nao existe (pode ser nao-aplicavel ao projeto)"
  fi
done

log ""

# Server inventory do tuninho-devops-env
log "## Server Inventory (tuninho-devops-env)"
INVENTORY=".claude/skills/tuninho-devops-env/projects/server-inventory.json"
if [ -f "$INVENTORY" ]; then
  if command -v jq >/dev/null 2>&1; then
    SERVERS=$(jq -r 'keys | length' "$INVENTORY" 2>/dev/null || echo 0)
    check_pass "server-inventory.json tem $SERVERS servidores catalogados"
  else
    check_pass "server-inventory.json existe (jq nao disponivel para parse)"
  fi
else
  check_warn "server-inventory.json nao existe"
fi

log ""

# Resumo
log "=== RESUMO ==="
log "PASS: $PASS_COUNT"
log "WARN: $WARN_COUNT"
log "FAIL: $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  log "VEREDITO: FAIL"
  exit 1
fi

log "VEREDITO: PASS"
exit 0
