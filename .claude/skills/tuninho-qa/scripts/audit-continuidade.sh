#!/usr/bin/env bash
# tuninho-qa v0.6.0 — audit-continuidade (NOVO)
# Valida pendency-ledger + raw_sessions + briefing forcado + referencias entre artefatos.
#
# Invocado pelo Tuninho da Comlurb durante passo 4 do ritual.
# Exit codes: 0=PASS, 1=FAIL

set -eu

OPERACAO=""
CWD="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --operacao) OPERACAO="$2"; shift 2;;
    *) shift;;
  esac
done

cd "$CWD"

FAILS=0

log_pass() { echo "  [PASS] $1"; }
log_fail() { echo "  [FAIL] $1" >&2; FAILS=$((FAILS + 1)); }
log_warn() { echo "  [WARN] $1"; }

# Localiza diretorio da operacao
if [[ -z "$OPERACAO" ]]; then
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/*/ 2>/dev/null | sort | tail -1)
else
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/${OPERACAO}_*/ 2>/dev/null | head -1)
fi

OP_DIR="${OP_DIR%/}"

if [[ -z "$OP_DIR" ]] || [[ ! -d "$OP_DIR" ]]; then
  log_fail "Operacao nao encontrada"
  exit 1
fi

# Check 1 — pendency-ledger existe ou e aceitavel nao ter (op recem-criada)
LEDGER="$OP_DIR/pendency-ledger.yaml"
if [[ ! -f "$LEDGER" ]]; then
  log_warn "pendency-ledger nao existe (OK se operacao recem-criada)"
else
  LEDGER_LINES=$(wc -l < "$LEDGER")
  log_pass "pendency-ledger presente ($LEDGER_LINES linhas)"
fi

# Check 2 — Nenhuma pendencia silenciosamente_carregada (cross-session miss)
if [[ -f "$LEDGER" ]]; then
  if grep -q "evento: silenciosamente_carregada" "$LEDGER" 2>/dev/null; then
    log_fail "Detectadas pendencias silenciosamente_carregadas no ledger"
  else
    log_pass "Nenhuma pendencia silenciosamente_carregada"
  fi
fi

# Check 3 — raw_sessions/ existe e tem ao menos 1 JSONL
RAW_DIR="$OP_DIR/handoffs/raw_sessions"
if [[ -d "$RAW_DIR" ]]; then
  JSONL_COUNT=$(ls "$RAW_DIR"/*.jsonl 2>/dev/null | wc -l || echo 0)
  if [[ $JSONL_COUNT -gt 0 ]]; then
    log_pass "raw_sessions/ com $JSONL_COUNT JSONL(s)"
  else
    log_warn "raw_sessions/ vazio (OK se operacao recem-criada)"
  fi
else
  log_warn "raw_sessions/ nao existe (OK se operacao recem-criada)"
fi

# Check 4 — HANDOFFs tem integridade sequencial (sessao 01, 02, 03...)
HANDOFFS_DIR="$OP_DIR/handoffs"
if [[ -d "$HANDOFFS_DIR" ]]; then
  HANDOFF_COUNT=$(ls "$HANDOFFS_DIR"/HANDOFF_*_sessao_*.yaml 2>/dev/null | wc -l || echo 0)
  if [[ $HANDOFF_COUNT -gt 0 ]]; then
    # Extrair numeros de sessao e verificar sequencia
    SESSAOS=$(ls "$HANDOFFS_DIR"/HANDOFF_*_sessao_*.yaml 2>/dev/null | sed 's/.*sessao_//;s/\.yaml//' | sort -n)
    EXPECTED=1
    SEQ_OK=true
    for num in $SESSAOS; do
      num_int=$((10#$num))
      if [[ $num_int -ne $EXPECTED ]]; then
        log_warn "Sessao esperada $EXPECTED mas encontrada $num_int — sequencia interrompida"
        SEQ_OK=false
        break
      fi
      EXPECTED=$((EXPECTED + 1))
    done
    if $SEQ_OK; then
      log_pass "HANDOFFs sequenciais (01..$((EXPECTED - 1)))"
    fi
  fi
fi

# Check 5 — briefings/ existe se ha sessao selada anterior
SEALED_COUNT=$(grep -l "^comlurb_sealed: true" "$HANDOFFS_DIR"/HANDOFF_*.yaml 2>/dev/null | wc -l || echo 0)
if [[ $SEALED_COUNT -gt 0 ]]; then
  BRIEFINGS_DIR="$HANDOFFS_DIR/briefings"
  if [[ -d "$BRIEFINGS_DIR" ]]; then
    BRIEFING_COUNT=$(ls "$BRIEFINGS_DIR"/BRIEFING_*.md 2>/dev/null | wc -l || echo 0)
    if [[ $BRIEFING_COUNT -gt 0 ]]; then
      log_pass "briefings/ com $BRIEFING_COUNT briefing(s) (cruza com $SEALED_COUNT seals)"
    else
      log_fail "HANDOFF com seal existe mas briefings/ vazio"
    fi
  else
    log_fail "HANDOFF com seal existe mas briefings/ nao existe"
  fi
else
  log_pass "Nenhum HANDOFF selado (OK — primeira sessao)"
fi

echo ""
if [[ $FAILS -gt 0 ]]; then
  echo "audit-continuidade: $FAILS check(s) FAIL"
  exit 1
fi

echo "audit-continuidade: PASS"
exit 0
