#!/bin/bash
# audit-ambiente.sh — Tuninho QA modo 1
#
# Verifica estado do ambiente de desenvolvimento:
# - MCPs ativos
# - Skills tuninho-* instaladas e versoes
# - Hooks ativos em .claude/hooks.json
# - gh autenticado
# - dev server rodando (se aplicavel)
#
# Saida: relatorio em stdout + arquivo de evidencia
# Exit code: 0 = PASS, 1 = FAIL bloqueante

set -e

OUTPUT_DIR="${1:-/tmp/tuninho-qa}"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$OUTPUT_DIR/audit-ambiente-$TIMESTAMP.txt"

FAIL_COUNT=0
WARN_COUNT=0
PASS_COUNT=0

log() {
  echo "$1" | tee -a "$REPORT"
}

check_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "  [PASS] $1"
}

check_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "  [FAIL] $1"
}

check_warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  log "  [WARN] $1"
}

log "=== Tuninho QA — audit-ambiente ==="
log "Timestamp: $TIMESTAMP"
log "PWD: $PWD"
log ""

# ============================================================
# Check 1: Skills tuninho-* instaladas
# ============================================================
log "## Check 1: Skills tuninho-* locais"
SKILL_DIR=".claude/skills"

if [ ! -d "$SKILL_DIR" ]; then
  check_fail "Diretorio $SKILL_DIR nao existe"
else
  EXPECTED_SKILLS="tuninho-ddce tuninho-escriba tuninho-qa tuninho-mural tuninho-updater tuninho-delivery-cards tuninho-devops-hostinger-alfa tuninho-devops-env tuninho-devops-vercel tuninho-devops-mural-devprod tuninho-fix-suporte"

  for skill in $EXPECTED_SKILLS; do
    if [ -d "$SKILL_DIR/$skill" ]; then
      VERSION=$(grep -m1 -oE 'v[0-9]+\.[0-9]+\.[0-9]+' "$SKILL_DIR/$skill/SKILL.md" 2>/dev/null | head -1 || echo "?")
      check_pass "$skill ($VERSION)"
    else
      check_warn "$skill ausente (pode ser opcional)"
    fi
  done
fi

log ""

# ============================================================
# Check 2: Hooks ativos
# ============================================================
log "## Check 2: Hooks .claude/hooks/"
HOOKS_DIR=".claude/hooks"

if [ -d "$HOOKS_DIR" ]; then
  HOOK_COUNT=$(ls "$HOOKS_DIR" 2>/dev/null | wc -l | tr -d ' ')
  check_pass "$HOOK_COUNT hooks encontrados em $HOOKS_DIR"
  ls "$HOOKS_DIR" 2>/dev/null | while read h; do
    log "    - $h"
  done
else
  check_warn "$HOOKS_DIR nao existe (hooks podem estar em outro lugar)"
fi

log ""

# ============================================================
# Check 3: gh autenticado
# ============================================================
log "## Check 3: gh CLI autenticado"

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    GH_USER=$(gh api user --jq .login 2>/dev/null || echo "?")
    check_pass "gh autenticado como: $GH_USER"
  else
    check_fail "gh CLI presente mas nao autenticado (rode: gh auth login)"
  fi
else
  check_warn "gh CLI nao instalado"
fi

log ""

# ============================================================
# Check 4: Manifest remoto acessivel
# ============================================================
log "## Check 4: Manifest remoto ops-suite"

MANIFEST=$(gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ -n "$MANIFEST" ]; then
  check_pass "manifest.json acessivel via gh api"
else
  check_warn "manifest.json nao acessivel (offline ou sem permissao)"
fi

log ""

# ============================================================
# Check 5: Git status do projeto
# ============================================================
log "## Check 5: Git status"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BRANCH=$(git branch --show-current)
  CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
  check_pass "branch atual: $BRANCH"
  log "    arquivos modificados: $CHANGES"
else
  check_fail "Nao esta dentro de um repo git"
fi

log ""

# ============================================================
# Check 6: Dev server (heuristica — porta 3000 ou 1337)
# ============================================================
log "## Check 6: Dev servers (heuristica)"

if command -v lsof >/dev/null 2>&1; then
  PORT_3000=$(lsof -i :3000 -sTCP:LISTEN 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
  PORT_1337=$(lsof -i :1337 -sTCP:LISTEN 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')

  if [ "$PORT_3000" -gt 0 ]; then
    check_pass "Porta 3000 (frontend) ativa"
  else
    check_warn "Porta 3000 (frontend) inativa"
  fi

  if [ "$PORT_1337" -gt 0 ]; then
    check_pass "Porta 1337 (backend mural) ativa"
  else
    check_warn "Porta 1337 (backend mural) inativa"
  fi
else
  check_warn "lsof nao disponivel — pular check de portas"
fi

log ""

# ============================================================
# Resumo
# ============================================================
log "=== RESUMO ==="
log "PASS: $PASS_COUNT"
log "WARN: $WARN_COUNT"
log "FAIL: $FAIL_COUNT"
log ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  log "VEREDITO: FAIL — $FAIL_COUNT checks bloqueantes falharam"
  log "Relatorio: $REPORT"
  exit 1
fi

log "VEREDITO: PASS"
log "Relatorio: $REPORT"
exit 0
