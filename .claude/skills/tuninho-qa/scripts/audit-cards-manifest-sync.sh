#!/usr/bin/env bash
# audit-cards-manifest-sync.sh — sub-check tuninho-qa v0.13.0+
# Valida que cards-manifest.json está sincronizado com diretórios em
# _a4tunados/_operacoes/cards/.
# Tolerância: ±1 (card recém-criado pode estar sendo processado)

set +e

MANIFEST="_a4tunados/_operacoes/cards/cards-manifest.json"
CARDS_DIR="_a4tunados/_operacoes/cards"

if [ ! -f "$MANIFEST" ]; then
  echo "FAIL: manifest não existe em $MANIFEST"
  exit 1
fi

# FS count
FS_COUNT=$(ls -d "$CARDS_DIR"/*/ 2>/dev/null | wc -l)

# Manifest count
MAN_COUNT=$(python3 -c "import json; m=json.load(open('$MANIFEST')); print(len(m.get('cards', {})))")

# Diff
DIFF=$((FS_COUNT - MAN_COUNT))
ABS_DIFF=${DIFF#-}

echo "=== audit-cards-manifest-sync ==="
echo "FS cards (diretorios): $FS_COUNT"
echo "Manifest cards: $MAN_COUNT"
echo "Diff: $DIFF"

if [ "$ABS_DIFF" -le 1 ]; then
  echo "Veredito: PASS (tolerância ±1)"
  exit 0
elif [ "$ABS_DIFF" -le 3 ]; then
  echo "Veredito: WARN — diff entre 2 e 3 (rodar manifest-sync)"
  exit 0
else
  echo "Veredito: FAIL — diff > 3 (necessita investigação)"
  echo "Acao corretiva: python3 .claude/skills/tuninho-delivery-cards/scripts/manifest-sync.py"
  exit 1
fi
