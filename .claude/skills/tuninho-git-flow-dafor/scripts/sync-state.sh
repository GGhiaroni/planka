#!/usr/bin/env bash
# tuninho-git-flow-dafor: sync-state
# Usage: sync-state.sh [--project NAME]
set -euo pipefail

PROJECT="${1:-}"
[ -z "$PROJECT" ] && PROJECT=$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||' || basename "$PWD")

git fetch origin --prune --quiet 2>/dev/null || true

SIDECAR_DIR="$HOME/.claude/plugins/a4tunados-ops-suite/skills/tuninho-git-flow-dafor/projects/$PROJECT"
mkdir -p "$SIDECAR_DIR"
STATE="$SIDECAR_DIR/state.yaml"

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DEVELOP_HEAD=$(git rev-parse develop 2>/dev/null || echo "null")
MAIN_HEAD=$(git rev-parse main 2>/dev/null || echo "null")
DEVELOP_LAST=$(git log -1 --format='%cI' develop 2>/dev/null || echo "null")
MAIN_LAST=$(git log -1 --format='%cI' main 2>/dev/null || echo "null")
CURRENT=$(git branch --show-current 2>/dev/null || echo "")

cat > "$STATE" << EOF
project: $PROJECT
generated_at: "$TS"
generated_by: tuninho-git-flow-dafor v0.1.0

protected_branches:
  - main
  - develop
merge_strategy_to_develop: ff_only
release_strategy: trunk-based

state:
  develop_head: "$DEVELOP_HEAD"
  develop_last_merge_at: "$DEVELOP_LAST"
  main_head: "$MAIN_HEAD"
  main_last_merge_at: "$MAIN_LAST"

active_branches:
EOF

# Branch atual
if [ -n "$CURRENT" ] && [[ "$CURRENT" =~ ^(feat|fix|card)/ ]]; then
  HEAD=$(git rev-parse "$CURRENT" 2>/dev/null || echo "null")
  LAG=$(git rev-list --count develop.."$CURRENT" 2>/dev/null || echo "0")
  cat >> "$STATE" << EOF
  - name: "$CURRENT"
    head: "$HEAD"
    lag_to_develop: $LAG
    status: active_op
EOF
fi

cat >> "$STATE" << EOF

parallel_open_branches:
EOF

for BRANCH in $(git branch --list 'feat/*' 'fix/*' --format='%(refname:short)' 2>/dev/null); do
  [ "$BRANCH" = "$CURRENT" ] && continue
  HEAD=$(git rev-parse "$BRANCH" 2>/dev/null || echo "null")
  LAG=$(git rev-list --count develop.."$BRANCH" 2>/dev/null || echo "0")
  LAST_COMMIT=$(git log -1 --format='%cI' "$BRANCH" 2>/dev/null || echo "null")
  cat >> "$STATE" << EOF
  - name: "$BRANCH"
    head: "$HEAD"
    lag_to_develop: $LAG
    last_commit_at: "$LAST_COMMIT"
    status: pending_merge
EOF
done

cat >> "$STATE" << EOF

archived_branches: []
EOF

echo "✓ State sincronizado: $STATE"
echo "   Branches catalogadas: $(grep -c "^  - name:" "$STATE")"
