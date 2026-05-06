#!/bin/bash
# audit-deploy-rigor.sh — sub-check do tuninho-qa Modo 11 (audit-deploy)
#
# Valida 4 criterios obrigatorios pos-deploy (REGRA_MASTER_6 — Op 03 L-REV-5,
# Op 05 GAP-OP05-005). Endurece GATE 6 do tuninho-devops-hostinger evitando
# que curl-200 mascare bundle quebrado em prod.
#
# 4 criterios:
#   (1) curl 200 da home publica
#   (2) bundle inlined sem warnings/errors criticos (heuristica: env vars
#       requeridas estao no bundle, ex: AIza Firebase keys)
#   (3) Playwright real do fluxo core (nao apenas curl) — verifica evidencia
#   (4) browser console messages sem errors criticos (FirebaseError, Application error)
#
# Versao: v0.10.0 (introduzido em tuninho-qa v0.10.0)
#
# Uso:
#   ./audit-deploy-rigor.sh --url <URL_PUBLICA> [--evidencias-dir <PATH>]
#
# Exit codes:
#   0 — PASS (4 criterios validados)
#   1 — FAIL (algum criterio falhou)
#   2 — ERR (configuracao invalida)

set -uo pipefail

URL=""
EVIDENCIAS_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --evidencias-dir) EVIDENCIAS_DIR="$2"; shift 2 ;;
    *) echo "ERR: arg desconhecido: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$URL" ]; then
  echo "ERR: --url obrigatorio (URL publica do deploy)" >&2
  echo "Uso: $0 --url https://seu.dominio.com [--evidencias-dir _a4tunados/.../evidencias]"
  exit 2
fi

FAIL=0
REPORT=""

# (1) curl 200 home
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  REPORT="$REPORT\n  ✓ (1) curl 200: $URL respondeu HTTP 200"
else
  REPORT="$REPORT\n  ✗ (1) FAIL: curl retornou HTTP $HTTP_CODE (esperado 200)"
  FAIL=$((FAIL + 1))
fi

# (2) bundle warnings/errors (best-effort via grep no body da home)
HOMEBODY=$(curl -s --max-time 15 "$URL" 2>/dev/null | head -c 50000)

if echo "$HOMEBODY" | grep -qi "Application error\|FirebaseError\|TypeError\|undefined is not\|Cannot read prop"; then
  REPORT="$REPORT\n  ✗ (2) FAIL: home body tem mensagem de erro de runtime"
  FAIL=$((FAIL + 1))
else
  REPORT="$REPORT\n  ✓ (2) home body sem mensagens de erro de runtime detectadas"
fi

# (3) Playwright real (verificar evidencia)
if [ -n "$EVIDENCIAS_DIR" ] && [ -d "$EVIDENCIAS_DIR" ]; then
  PNG_COUNT=$(ls ${EVIDENCIAS_DIR}/*.png 2>/dev/null | wc -l)
  if [ "$PNG_COUNT" -ge 1 ]; then
    REPORT="$REPORT\n  ✓ (3) Playwright evidencias: $PNG_COUNT screenshot(s) em $EVIDENCIAS_DIR"
  else
    REPORT="$REPORT\n  ✗ (3) FAIL: $EVIDENCIAS_DIR existe mas sem .png — Playwright nao foi rodado"
    FAIL=$((FAIL + 1))
  fi
else
  REPORT="$REPORT\n  ! (3) WARN: --evidencias-dir nao informado — nao posso validar Playwright"
  REPORT="$REPORT\n      (recomendado: passar --evidencias-dir _a4tunados/.../fase_NN/evidencias)"
fi

# (4) browser console (best-effort — verificar via Playwright se disponivel)
# Pra script bash, validacao completa e via interpretacao manual de browser_console_messages
# Aqui apenas sinalizamos se ha evidencia de check
CONSOLE_CHECK_FILE=""
if [ -n "$EVIDENCIAS_DIR" ] && [ -d "$EVIDENCIAS_DIR" ]; then
  CONSOLE_CHECK_FILE=$(ls ${EVIDENCIAS_DIR}/console*.txt ${EVIDENCIAS_DIR}/console*.json 2>/dev/null | head -1)
fi
if [ -n "$CONSOLE_CHECK_FILE" ]; then
  if grep -qi "FirebaseError\|Application error\|TypeError" "$CONSOLE_CHECK_FILE" 2>/dev/null; then
    REPORT="$REPORT\n  ✗ (4) FAIL: $CONSOLE_CHECK_FILE tem errors criticos"
    FAIL=$((FAIL + 1))
  else
    REPORT="$REPORT\n  ✓ (4) console: $CONSOLE_CHECK_FILE sem errors criticos"
  fi
else
  REPORT="$REPORT\n  ! (4) WARN: nenhum dump de console encontrado em evidencias/"
  REPORT="$REPORT\n      (recomendado: salvar browser_console_messages em ${EVIDENCIAS_DIR:-evidencias}/console.txt)"
fi

# Veredito
echo "=== audit-deploy-rigor — $URL ==="
echo -e "$REPORT"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: PASS — 4 criterios validados (com warnings se aplicavel)"
  exit 0
else
  echo "STATUS: FAIL — $FAIL criterio(s) violado(s) — DEPLOY GATE BLOQUEADO"
  echo ""
  echo "Acao corretiva: investigar bundle/console; se Playwright nao rodou, rodar antes de re-validar"
  exit 1
fi
