#!/bin/bash
# audit-artefatos.sh — Tuninho QA
#
# Verifica que os 7 artefatos DDCE de uma operacao existem e tem conteudo real:
# _0_PROMPT_ORIGINAL, _1_DISCOVERY, _1-xp_DISCOVERY, _2_DEFINE_PLAN,
# _2-xp_DEFINE_PLAN, _3_RESULTS, e os arquivos da pasta da operacao
# (README, HANDOFF.yaml, PLANO_GERAL, aprendizados_operacao).
#
# Uso: ./audit-artefatos.sh {NN}
# Ex:  ./audit-artefatos.sh 23

set -e

NN="${1:-}"
if [ -z "$NN" ]; then
  echo "Uso: $0 {NN}"
  echo "Ex:  $0 23"
  exit 2
fi

# Padding para 2 digitos
NN_PAD=$(printf "%02d" "$NN")

PROMPTS_DIR="_a4tunados/_operacoes/prompts"
PROJ_GLOB="_a4tunados/_operacoes/projetos/${NN_PAD}_*"

FAIL_COUNT=0
WARN_COUNT=0
PASS_COUNT=0

log() { echo "$1"; }
check_pass() { PASS_COUNT=$((PASS_COUNT + 1)); echo "  [PASS] $1"; }
check_fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); echo "  [FAIL] $1"; }
check_warn() { WARN_COUNT=$((WARN_COUNT + 1)); echo "  [WARN] $1"; }

log "=== Tuninho QA — audit-artefatos Op $NN ==="
log ""

# ============================================================
# Artefatos em prompts/
# ============================================================
log "## Artefatos em $PROMPTS_DIR/"

# _0_PROMPT_ORIGINAL
A0=$(ls $PROMPTS_DIR/${NN_PAD}_0_PROMPT_ORIGINAL*.md 2>/dev/null | head -1)
if [ -n "$A0" ]; then
  L=$(wc -l < "$A0" | tr -d ' ')
  if [ "$L" -ge 1 ]; then
    check_pass "_0_PROMPT_ORIGINAL: $A0 ($L linhas)"
  else
    check_fail "_0_PROMPT_ORIGINAL existe mas vazio"
  fi
else
  check_fail "_0_PROMPT_ORIGINAL nao encontrado"
fi

# _1_DISCOVERY
A1=$(ls $PROMPTS_DIR/${NN_PAD}_1_DISCOVERY_*.md 2>/dev/null | head -1)
if [ -n "$A1" ]; then
  L=$(wc -l < "$A1" | tr -d ' ')
  SECOES=$(grep -c "^## " "$A1" 2>/dev/null || echo 0)
  if [ "$L" -ge 50 ] && [ "$SECOES" -ge 5 ]; then
    check_pass "_1_DISCOVERY: $L linhas, $SECOES secoes"
  else
    check_warn "_1_DISCOVERY: $L linhas, $SECOES secoes (esperado >= 50 linhas e >= 5 secoes)"
  fi
else
  check_fail "_1_DISCOVERY nao encontrado"
fi

# _1-xp_DISCOVERY (BLOQUEANTE — Regra #20 tuninho-ddce)
A1XP=$(ls $PROMPTS_DIR/${NN_PAD}_1-xp_DISCOVERY_*.md 2>/dev/null | head -1)
if [ -n "$A1XP" ]; then
  L=$(wc -l < "$A1XP" | tr -d ' ')
  PARTES=$(grep -c "^## PARTE" "$A1XP" 2>/dev/null || echo 0)
  if [ "$L" -ge 200 ]; then
    check_pass "_1-xp_DISCOVERY: $L linhas, $PARTES partes"
  else
    check_fail "_1-xp_DISCOVERY: $L linhas (esperado >= 200 — Regra #20)"
  fi
  if [ "$PARTES" -lt 8 ]; then
    check_warn "_1-xp_DISCOVERY tem $PARTES partes (esperado >= 8 — template tem 10)"
  fi
else
  check_fail "_1-xp_DISCOVERY nao encontrado (BLOQUEANTE — Regra #20)"
fi

# Web research no _1-xp_
if [ -n "$A1XP" ]; then
  WEB=$(grep -c "https://" "$A1XP" 2>/dev/null || echo 0)
  WEB1=$(grep -c "https://" "$A1" 2>/dev/null || echo 0)
  TOTAL_WEB=$((WEB + WEB1))
  if [ "$TOTAL_WEB" -ge 6 ]; then
    check_pass "Web research: $TOTAL_WEB URLs (Regra #21 — esperado >= 6)"
  else
    check_fail "Web research: $TOTAL_WEB URLs (esperado >= 6 — Regra #21)"
  fi
fi

# _2_DEFINE_PLAN
A2=$(ls $PROMPTS_DIR/${NN_PAD}_2_DEFINE_PLAN_*.md 2>/dev/null | head -1)
if [ -n "$A2" ]; then
  L=$(wc -l < "$A2" | tr -d ' ')
  if [ "$L" -ge 100 ]; then
    check_pass "_2_DEFINE_PLAN: $L linhas"
  else
    check_warn "_2_DEFINE_PLAN: $L linhas (esperado >= 100)"
  fi
else
  check_fail "_2_DEFINE_PLAN nao encontrado"
fi

# _2-xp_DEFINE_PLAN (BLOQUEANTE — Regra #23)
A2XP=$(ls $PROMPTS_DIR/${NN_PAD}_2-xp_DEFINE_PLAN_*.md 2>/dev/null | head -1)
if [ -n "$A2XP" ]; then
  L=$(wc -l < "$A2XP" | tr -d ' ')
  if [ "$L" -ge 200 ]; then
    check_pass "_2-xp_DEFINE_PLAN: $L linhas"
  else
    check_fail "_2-xp_DEFINE_PLAN: $L linhas (esperado >= 200 — Regra #23)"
  fi
else
  check_fail "_2-xp_DEFINE_PLAN nao encontrado (BLOQUEANTE — Regra #23)"
fi

# _3_RESULTS
A3=$(ls $PROMPTS_DIR/${NN_PAD}_3_RESULTS_*.md 2>/dev/null | head -1)
if [ -n "$A3" ]; then
  L=$(wc -l < "$A3" | tr -d ' ')
  STATUS_COUNT=$(grep -c "CONCLUIDO COM SUCESSO\|PARCIAL\|PENDENTE\|CANCELADO" "$A3" 2>/dev/null || echo 0)
  if [ "$L" -ge 50 ] && [ "$STATUS_COUNT" -ge 1 ]; then
    check_pass "_3_RESULTS: $L linhas, $STATUS_COUNT status"
  else
    check_warn "_3_RESULTS: $L linhas, $STATUS_COUNT status"
  fi
else
  check_warn "_3_RESULTS nao encontrado (gerado no GATE FINAL)"
fi

log ""

# ============================================================
# Arquivos da pasta da operacao
# ============================================================
log "## Arquivos da pasta da operacao"

PROJ_DIR=$(ls -d $PROJ_GLOB 2>/dev/null | head -1)
if [ -z "$PROJ_DIR" ]; then
  check_fail "Pasta da operacao nao encontrada: $PROJ_GLOB"
else
  for arq in README.md PLANO_GERAL.md HANDOFF.yaml aprendizados_operacao.md; do
    if [ -f "$PROJ_DIR/$arq" ]; then
      L=$(wc -l < "$PROJ_DIR/$arq" | tr -d ' ')
      check_pass "$arq ($L linhas)"
    else
      check_fail "$arq ausente"
    fi
  done
fi

log ""

# Resumo
log "=== RESUMO ==="
log "PASS: $PASS_COUNT"
log "WARN: $WARN_COUNT"
log "FAIL: $FAIL_COUNT"
log ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  log "VEREDITO: FAIL"
  exit 1
fi

log "VEREDITO: PASS"
exit 0
