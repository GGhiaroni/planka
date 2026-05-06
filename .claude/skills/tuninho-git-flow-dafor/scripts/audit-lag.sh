#!/usr/bin/env bash
# tuninho-git-flow-dafor: audit-lag
# Usage: audit-lag.sh [--project NAME]
set -euo pipefail

PROJECT="${1:-}"
[ -z "$PROJECT" ] && PROJECT=$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||' || basename "$PWD")

# Fetch origin pra refs atualizadas
git fetch origin --prune --quiet 2>/dev/null || true

echo "=== Git Flow Audit — $PROJECT ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="

DEVELOP_HEAD=$(git rev-parse --short develop 2>/dev/null || echo "?")
MAIN_HEAD=$(git rev-parse --short main 2>/dev/null || echo "?")
DEVELOP_LAST=$(git log -1 --format='%ci' develop 2>/dev/null || echo "?")
MAIN_LAST=$(git log -1 --format='%ci' main 2>/dev/null || echo "?")

if [ "$DEVELOP_HEAD" != "?" ] && [ "$MAIN_HEAD" != "?" ]; then
  AHEAD=$(git rev-list --count main..develop 2>/dev/null || echo "?")
  BEHIND=$(git rev-list --count develop..main 2>/dev/null || echo "?")
else
  AHEAD="?"
  BEHIND="?"
fi

cat << EOF
develop: $DEVELOP_HEAD (last commit: $DEVELOP_LAST)
main:    $MAIN_HEAD (last commit: $MAIN_LAST)
develop ahead/behind main: ${AHEAD}/${BEHIND}

EOF

echo "Active feat/fix branches (lag → develop):"
printf "%-50s | %-10s | %-15s | %s\n" "BRANCH" "HEAD" "LAG→develop" "STATUS"
printf "%-50s-+-%-10s-+-%-15s-+-%s\n" "--------------------------------------------------" "----------" "---------------" "------------------"

CURRENT=$(git branch --show-current 2>/dev/null || echo "")
PENDING_COUNT=0
STALE_COUNT=0

for BRANCH in $(git branch --list 'feat/*' 'fix/*' 'card/*' --format='%(refname:short)' 2>/dev/null); do
  HEAD=$(git rev-parse --short "$BRANCH" 2>/dev/null || echo "?")
  LAG=$(git rev-list --count develop.."$BRANCH" 2>/dev/null || echo "?")
  LAST_COMMIT_DAYS=$(git log -1 --format='%cr' "$BRANCH" 2>/dev/null || echo "?")
  
  STATUS="?"
  if [ "$BRANCH" = "$CURRENT" ]; then
    STATUS="active_op"
  elif [ "$LAG" != "?" ] && [ "$LAG" -gt 0 ]; then
    if echo "$LAST_COMMIT_DAYS" | grep -qE 'months?|years?'; then
      STATUS="stale_candidate"
      STALE_COUNT=$((STALE_COUNT+1))
    else
      STATUS="pending_merge"
      PENDING_COUNT=$((PENDING_COUNT+1))
    fi
  fi
  
  printf "%-50s | %-10s | %-15s | %s\n" "$BRANCH" "$HEAD" "+$LAG commits" "$STATUS"
done

echo ""
if [ "$PENDING_COUNT" -gt 0 ]; then
  echo "⚠ STATUS: develop DEFASADA — $PENDING_COUNT branches pending_merge ahead"
  echo "   Recomendação: avaliar merge das branches pending para develop antes"
  echo "   de iniciar nova operação."
fi
if [ "$STALE_COUNT" -gt 0 ]; then
  echo "ℹ $STALE_COUNT branches stale_candidate — considerar archive-stale (preview)"
fi
if [ "$PENDING_COUNT" -eq 0 ] && [ "$STALE_COUNT" -eq 0 ]; then
  echo "✓ STATUS: develop OK — nenhuma branch significativamente atrasada"
fi
