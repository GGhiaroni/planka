#!/usr/bin/env bash
# audit-version-consistency.sh — sub-check tuninho-qa v0.12.0+
# Valida que package.json.version, src/lib/version.ts APP_VERSION, e
# ChangelogModal.tsx[0].version estão alinhados.
# Uso: bash audit-version-consistency.sh [--fail-on-mismatch]

set +e

PKG_VERSION=$(node -e "console.log(require('./package.json').version)" 2>/dev/null)
if [ -z "$PKG_VERSION" ]; then
  echo "FAIL: package.json não encontrado ou sem version"
  exit 1
fi

# version.ts deve importar de package.json (preferred) ou ter constante igual
VERSION_TS_OK=0
if [ -f src/lib/version.ts ]; then
  if grep -q 'import.*pkg.*from.*package.json' src/lib/version.ts && grep -q 'pkg.version' src/lib/version.ts; then
    VERSION_TS_VALUE="$PKG_VERSION (importado de package.json)"
    VERSION_TS_OK=1
  else
    VERSION_TS_VALUE=$(grep 'APP_VERSION' src/lib/version.ts | grep -oP '"\K[^"]+' | head -1)
    [ "$VERSION_TS_VALUE" = "$PKG_VERSION" ] && VERSION_TS_OK=1
  fi
else
  VERSION_TS_VALUE="N/A (arquivo ausente)"
fi

# ChangelogModal[0].version deve == package.json
CHGMODAL_VERSION=""
if [ -f src/components/app/ChangelogModal.tsx ]; then
  CHGMODAL_VERSION=$(grep -m1 'version: "' src/components/app/ChangelogModal.tsx | sed -n 's/.*version: "\([^"]*\)".*/\1/p')
fi

echo "=== audit-version-consistency ==="
echo "package.json:           $PKG_VERSION"
echo "src/lib/version.ts:     $VERSION_TS_VALUE"
echo "ChangelogModal[0]:      $CHGMODAL_VERSION"

VEREDITO="PASS"
[ "$VERSION_TS_OK" -ne 1 ] && VEREDITO="FAIL — version.ts divergente"
[ "$CHGMODAL_VERSION" != "$PKG_VERSION" ] && VEREDITO="FAIL — ChangelogModal divergente"

echo ""
echo "Veredito: $VEREDITO"
[ "$VEREDITO" = "PASS" ] && exit 0 || exit 1
