#!/usr/bin/env bash
# preflight-checks.sh — 7 verificacoes pre-flight da sessao Claude Code
#
# Usage: ./preflight-checks.sh
#
# Responsabilidade 5 da skill tuninho-portas-em-automatico.
#
# Output: formato key=value, uma por linha, para ser parseado pelo apresentar-painel.sh
#
# Exit codes:
#   0 — Todos os checks PASS ou WARN (nao bloqueia sessao)
#   1 — Erro interno (nao usado pela skill para bloquear — apenas indica que o script quebrou)

set -u

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

result() {
  local key="$1"
  local status="$2"
  local message="$3"
  echo "${key}=${status}|${message}"
  case "$status" in
    PASS) PASS_COUNT=$((PASS_COUNT + 1)) ;;
    WARN) WARN_COUNT=$((WARN_COUNT + 1)) ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)) ;;
  esac
}

# ============================================================
# CHECK 1: Branch git
# ============================================================
BRANCH=$(git branch --show-current 2>/dev/null)
if [[ -n "$BRANCH" ]]; then
  result "branch" "PASS" "$BRANCH"
else
  result "branch" "WARN" "nao e um repo git"
fi

# ============================================================
# CHECK 2: Working tree
# ============================================================
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
if [[ "$UNCOMMITTED" -eq 0 ]]; then
  result "working_tree" "PASS" "limpo"
else
  result "working_tree" "WARN" "$UNCOMMITTED arquivos nao commitados"
fi

# ============================================================
# CHECK 3: Skills tuninho-* atualizadas
# ============================================================
if [[ -d ".claude/skills" ]]; then
  SKILLS_COUNT=$(find .claude/skills -maxdepth 1 -type d -name "tuninho-*" 2>/dev/null | wc -l | tr -d ' ')
  result "skills" "PASS" "$SKILLS_COUNT skills tuninho-* instaladas"
else
  result "skills" "WARN" ".claude/skills/ nao existe"
fi

# ============================================================
# CHECK 4: Hook tuninho-hook-conta-token ativo
# ============================================================
HOOK_PATH="$HOME/.claude/plugins/a4tunados-ops-suite/hooks/scripts/tuninho-hook-conta-token.py"
if [[ -x "$HOOK_PATH" ]]; then
  result "hook_conta_token" "PASS" "ativo"
else
  result "hook_conta_token" "WARN" "nao encontrado em $HOOK_PATH"
fi

# ============================================================
# CHECK 5: Sentinel .escriba-bypass-active
# ============================================================
if [[ -f ".claude/.escriba-bypass-active" ]]; then
  result "sentinel_bypass" "WARN" "sentinel .escriba-bypass-active ainda ativo — remover"
else
  result "sentinel_bypass" "PASS" "inativo"
fi

# ============================================================
# CHECK 6: tuninho-qa instalada
# ============================================================
QA_SKILL=".claude/skills/tuninho-qa/SKILL.md"
if [[ -f "$QA_SKILL" ]]; then
  QA_VERSION=$(grep -oE "v[0-9]+\.[0-9]+\.[0-9]+" "$QA_SKILL" 2>/dev/null | head -1)
  result "tuninho_qa" "PASS" "instalada ${QA_VERSION:-versao_desconhecida}"
else
  result "tuninho_qa" "WARN" "nao instalada"
fi

# ============================================================
# CHECK 7: Cards manifest (so se ha cards/)
# ============================================================
if [[ -d "_a4tunados/_operacoes/cards" ]]; then
  CARDS_COUNT=$(find _a4tunados/_operacoes/cards -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$CARDS_COUNT" -gt 1 ]]; then
    result "cards_manifest" "PASS" "$((CARDS_COUNT - 1)) cards em _operacoes/cards/"
  else
    result "cards_manifest" "PASS" "nenhum card registrado"
  fi
else
  result "cards_manifest" "PASS" "nao aplicavel (sem _operacoes/cards)"
fi

# ============================================================
# Totals
# ============================================================
echo "totals=${PASS_COUNT}|${WARN_COUNT}|${FAIL_COUNT}"

exit 0
