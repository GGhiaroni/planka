#!/bin/bash
# audit-fase.sh — Tuninho QA modo 8 (audit-gate-fase)
#
# Verifica que uma fase de execucao DDCE tem todos os 6 arquivos
# obrigatorios + evidencias + sem placeholders.
#
# Uso: ./audit-fase.sh {NN} {N}
# Ex:  ./audit-fase.sh 23 6

set +e

NN="${1:-}"
N="${2:-}"

if [ -z "$NN" ] || [ -z "$N" ]; then
  echo "Uso: $0 {NN} {N}"
  echo "Ex:  $0 23 6"
  exit 2
fi

NN_PAD=$(printf "%02d" "$NN")
N_PAD=$(printf "%02d" "$N")

PROJ_GLOB="_a4tunados/_operacoes/projetos/${NN_PAD}_*"
PROJ_DIR=$(ls -d $PROJ_GLOB 2>/dev/null | head -1)

if [ -z "$PROJ_DIR" ]; then
  echo "[FAIL] Pasta da operacao nao encontrada: $PROJ_GLOB"
  exit 1
fi

FASE_DIR="$PROJ_DIR/fase_${N_PAD}"

if [ ! -d "$FASE_DIR" ]; then
  echo "[FAIL] Pasta da fase nao encontrada: $FASE_DIR"
  exit 1
fi

FAIL_COUNT=0
WARN_COUNT=0
PASS_COUNT=0

check_pass() { PASS_COUNT=$((PASS_COUNT + 1)); echo "  [PASS] $1"; }
check_fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); echo "  [FAIL] $1"; }
check_warn() { WARN_COUNT=$((WARN_COUNT + 1)); echo "  [WARN] $1"; }

echo "=== Tuninho QA — audit-fase Op $NN Fase $N ==="
echo "Pasta: $FASE_DIR"
echo ""

# ============================================================
# 6 arquivos obrigatorios
# ============================================================

# Helper para contar matches sem o bug grep|echo (Antipadrao Op 23)
grep_count() {
  local pattern="$1"
  local file="$2"
  local extended="${3:-}"
  local count
  if [ "$extended" = "E" ]; then
    count=$(grep -cE "$pattern" "$file" 2>/dev/null)
  else
    count=$(grep -c "$pattern" "$file" 2>/dev/null)
  fi
  if [ -z "$count" ]; then
    echo 0
  else
    echo "$count"
  fi
}

# 1. plano.md
if [ -f "$FASE_DIR/plano.md" ]; then
  L=$(wc -l < "$FASE_DIR/plano.md" | tr -d ' ')
  P=$(grep_count "^{.*}$" "$FASE_DIR/plano.md")
  if [ "$L" -ge 20 ] && [ "$P" -le 2 ]; then
    check_pass "plano.md ($L linhas, $P placeholders)"
  else
    check_fail "plano.md ($L linhas, $P placeholders — esperado >= 20 linhas e <= 2 placeholders)"
  fi
else
  check_fail "plano.md ausente (Licao #51)"
fi

# 2. checklist.md
if [ -f "$FASE_DIR/checklist.md" ]; then
  L=$(wc -l < "$FASE_DIR/checklist.md" | tr -d ' ')
  PEND=$(grep_count "^- \[ \]" "$FASE_DIR/checklist.md")
  DONE=$(grep_count "^- \[x\]" "$FASE_DIR/checklist.md")

  if [ "$DONE" -ge 1 ] && [ "$PEND" -eq 0 ]; then
    check_pass "checklist.md ($DONE marcadas, $PEND pendentes)"
  elif [ "$DONE" -ge 1 ] && [ "$PEND" -gt 0 ]; then
    check_fail "checklist.md tem $PEND tarefas pendentes (fase nao deveria estar concluida)"
  else
    check_fail "checklist.md sem tarefas marcadas (DONE=$DONE PEND=$PEND)"
  fi
else
  check_fail "checklist.md ausente"
fi

# 3. checkpoints.md
if [ -f "$FASE_DIR/checkpoints.md" ]; then
  L=$(wc -l < "$FASE_DIR/checkpoints.md" | tr -d ' ')
  CONTROL=$(grep_count "CONTROL\|pre-check\|pos-check\|PASS\|FAIL" "$FASE_DIR/checkpoints.md")
  if [ "$L" -ge 20 ] && [ "$CONTROL" -ge 1 ]; then
    check_pass "checkpoints.md ($L linhas, $CONTROL referencias a CONTROL)"
  else
    check_warn "checkpoints.md ($L linhas, $CONTROL CONTROL refs — esperado >= 20 linhas e >= 1 CONTROL)"
  fi
else
  check_fail "checkpoints.md ausente"
fi

# 4. aprendizados.md
if [ -f "$FASE_DIR/aprendizados.md" ]; then
  L=$(wc -l < "$FASE_DIR/aprendizados.md" | tr -d ' ')
  if [ "$L" -ge 5 ]; then
    check_pass "aprendizados.md ($L linhas)"
  else
    check_warn "aprendizados.md ($L linhas — esperado >= 5)"
  fi
else
  check_fail "aprendizados.md ausente"
fi

# 5. review.md (CRITICO — Licao #51)
if [ -f "$FASE_DIR/review.md" ]; then
  L=$(wc -l < "$FASE_DIR/review.md" | tr -d ' ')
  P=$(grep_count "^{.*}$" "$FASE_DIR/review.md")
  SECOES=$(grep_count "^## (Periodo|Visao Produto|Visao Tecnica|Evidencias|Metricas)" "$FASE_DIR/review.md" "E")

  if [ "$L" -ge 30 ] && [ "$P" -le 2 ] && [ "$SECOES" -ge 4 ]; then
    check_pass "review.md ($L linhas, $P placeholders, $SECOES secoes obrigatorias)"
  else
    check_fail "review.md ($L linhas, $P placeholders, $SECOES secoes — esperado >= 30 linhas, <= 2 placeholders, >= 4 secoes obrigatorias) — Licao #51"
  fi
else
  check_fail "review.md AUSENTE — Licao #51 (sistematicamente esquecido)"
fi

# 6. evidencias/
if [ -d "$FASE_DIR/evidencias" ]; then
  PNG_COUNT=$(ls "$FASE_DIR/evidencias"/*.png 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PNG_COUNT" -ge 1 ]; then
    check_pass "evidencias/ ($PNG_COUNT screenshots)"
  else
    check_fail "evidencias/ existe mas sem screenshots PNG"
  fi
else
  check_fail "evidencias/ ausente"
fi

echo ""

# ============================================================
# Cross-check: screenshots referenciados em review.md
# ============================================================
if [ -f "$FASE_DIR/review.md" ] && [ -d "$FASE_DIR/evidencias" ]; then
  PNG_COUNT=$(ls "$FASE_DIR/evidencias"/*.png 2>/dev/null | wc -l | tr -d ' ')
  REF_COUNT=$(grep -c "evidencias/" "$FASE_DIR/review.md" 2>/dev/null || echo 0)

  if [ "$PNG_COUNT" -ge 1 ]; then
    if [ "$REF_COUNT" -ge 1 ]; then
      check_pass "review.md referencia evidencias/ ($REF_COUNT mencoes)"
    else
      check_fail "review.md NAO referencia nenhum screenshot de evidencias/"
    fi
  fi
fi

echo ""

# Resumo
echo "=== RESUMO Op $NN Fase $N ==="
echo "PASS: $PASS_COUNT"
echo "WARN: $WARN_COUNT"
echo "FAIL: $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "VEREDITO: FAIL — gate BLOQUEADO"
  exit 1
fi

echo "VEREDITO: PASS"
exit 0
