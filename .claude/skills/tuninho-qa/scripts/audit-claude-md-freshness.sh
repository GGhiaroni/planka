#!/usr/bin/env bash
# audit-claude-md-freshness.sh — sub-check tuninho-qa v0.13.0+
# Detecta drift entre CLAUDE.md e estado real do projeto.
# Modo advisory (WARN, não bloqueia GATE FINAL inicialmente; v0.14.0 vira bloqueante após 7d drift)

set +e

CLAUDE_MD="CLAUDE.md"
[ ! -f "$CLAUDE_MD" ] && { echo "FAIL: CLAUDE.md ausente"; exit 1; }

WARN_COUNT=0
echo "=== audit-claude-md-freshness (advisory) ==="

# Check 1: versão atual em CLAUDE.md vs package.json
PKG_V=$(node -e "console.log(require('./package.json').version)" 2>/dev/null)
if [ -n "$PKG_V" ]; then
  if grep -q "Versão atual: v$PKG_V\|Versao atual: v$PKG_V" "$CLAUDE_MD"; then
    echo "  ✓ Versão atual ($PKG_V) presente em CLAUDE.md"
  else
    echo "  ⚠ WARN: package.json é $PKG_V mas CLAUDE.md não menciona explicitamente"
    WARN_COUNT=$((WARN_COUNT+1))
  fi
fi

# Check 2: CDP Playwright em CLAUDE.md vs .mcp.json
CDP_REAL=$(grep -oE 'http://127.0.0.1:[0-9]+' .mcp.json | head -1)
CDP_CMD=$(grep -oE 'http://127.0.0.1:[0-9]+' "$CLAUDE_MD" | head -1)
if [ "$CDP_REAL" = "$CDP_CMD" ]; then
  echo "  ✓ CDP $CDP_REAL alinhado"
else
  echo "  ⚠ WARN: .mcp.json tem $CDP_REAL mas CLAUDE.md tem $CDP_CMD"
  WARN_COUNT=$((WARN_COUNT+1))
fi

# Check 3: lastmod CLAUDE.md vs package.json
CMD_DATE=$(stat -c %Y "$CLAUDE_MD" 2>/dev/null)
PKG_DATE=$(stat -c %Y package.json 2>/dev/null)
if [ -n "$CMD_DATE" ] && [ -n "$PKG_DATE" ]; then
  AGE_DAYS=$(( (PKG_DATE - CMD_DATE) / 86400 ))
  if [ "$AGE_DAYS" -gt 7 ]; then
    echo "  ⚠ WARN: package.json modificado $AGE_DAYS dias depois de CLAUDE.md"
    WARN_COUNT=$((WARN_COUNT+1))
  else
    echo "  ✓ CLAUDE.md mais recente que package.json ou diff < 7d"
  fi
fi

# Check 4: skills mencionadas em CLAUDE.md vs skills instaladas
SKILLS_INSTALLED=$(ls .claude/skills/tuninho-* -d 2>/dev/null | wc -l)
SKILLS_DOC=$(grep -c "^| \`tuninho-" "$CLAUDE_MD")
if [ "$SKILLS_DOC" -lt "$((SKILLS_INSTALLED - 2))" ]; then
  echo "  ⚠ WARN: $SKILLS_INSTALLED skills instaladas mas CLAUDE.md menciona apenas $SKILLS_DOC"
  WARN_COUNT=$((WARN_COUNT+1))
fi

# Check 5: branch atual segue padrão documentado
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if echo "$BRANCH" | grep -qE "^(main|develop|feat/|card/feat/|op/|chore/|fix/|docs/|archive/)"; then
  echo "  ✓ Branch atual ($BRANCH) segue padrão"
else
  echo "  ⚠ WARN: Branch atual ($BRANCH) fora do padrão documentado"
  WARN_COUNT=$((WARN_COUNT+1))
fi

echo ""
if [ "$WARN_COUNT" -eq 0 ]; then
  echo "Veredito: PASS — CLAUDE.md fresh"
  exit 0
elif [ "$WARN_COUNT" -le 3 ]; then
  echo "Veredito: PASS_COM_RESSALVAS — $WARN_COUNT warnings (advisory)"
  exit 0
else
  echo "Veredito: WARN — $WARN_COUNT warnings (advisory; v0.14.0 vira bloqueante)"
  exit 0
fi
