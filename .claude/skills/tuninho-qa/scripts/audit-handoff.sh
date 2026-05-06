#!/usr/bin/env bash
# tuninho-qa v0.6.0 — audit-handoff
# Valida consistencia do HANDOFF da sessao corrente.
#
# Invocado pelo Tuninho da Comlurb durante passo 4 do ritual.
# Exit codes: 0=PASS, 1=FAIL

set -eu

OPERACAO=""
MODO_COMLURB=false
CWD="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --operacao) OPERACAO="$2"; shift 2;;
    --modo-comlurb) MODO_COMLURB=true; shift;;
    *) shift;;
  esac
done

cd "$CWD"

FAILS=0

log_pass() { echo "  [PASS] $1"; }
log_fail() { echo "  [FAIL] $1" >&2; FAILS=$((FAILS + 1)); }

# Localiza diretorio da operacao
if [[ -z "$OPERACAO" ]]; then
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/*/ 2>/dev/null | sort | tail -1)
else
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/${OPERACAO}_*/ 2>/dev/null | head -1)
fi

OP_DIR="${OP_DIR%/}"

if [[ -z "$OP_DIR" ]] || [[ ! -d "$OP_DIR" ]]; then
  log_fail "Operacao nao encontrada em _a4tunados/_operacoes/projetos/"
  exit 1
fi

# Verificar handoffs/ existe
HANDOFFS_DIR="$OP_DIR/handoffs"
if [[ ! -d "$HANDOFFS_DIR" ]]; then
  log_fail "Pasta handoffs/ nao existe em $OP_DIR"
  exit 1
fi

# HANDOFF mais recente
LATEST_HANDOFF=$(ls -t "$HANDOFFS_DIR"/HANDOFF_*_sessao_*.yaml 2>/dev/null | head -1 || true)

if [[ -z "$LATEST_HANDOFF" ]]; then
  log_fail "Nenhum HANDOFF_*_sessao_*.yaml encontrado"
  exit 1
fi

log_pass "HANDOFF encontrado: $(basename $LATEST_HANDOFF)"

# Validar linhas minimas (handoff vazio/template)
HANDOFF_LINES=$(wc -l < "$LATEST_HANDOFF")
if [[ $HANDOFF_LINES -lt 15 ]]; then
  log_fail "HANDOFF tem apenas $HANDOFF_LINES linhas — provavelmente vazio/template"
else
  log_pass "HANDOFF com conteudo ($HANDOFF_LINES linhas)"
fi

# Checks de campos obrigatorios via grep (funciona sem PyYAML)
for field in "operacao:" "sessao:" "branch_git:"; do
  if grep -q "^$field" "$LATEST_HANDOFF"; then
    log_pass "Campo '$field' presente"
  else
    log_fail "Campo '$field' ausente"
  fi
done

# raw_sessions_coletadas tem pelo menos 1 entry local
if grep -A 3 "raw_sessions_coletadas:" "$LATEST_HANDOFF" | grep -qE "^\s+-\s"; then
  log_pass "raw_sessions_coletadas.local populado"
else
  if [[ "$MODO_COMLURB" == "true" ]]; then
    # Comlurb esta rodando e vai popular agora — skip este check
    log_pass "raw_sessions_coletadas: skip (Comlurb em execucao)"
  else
    log_fail "raw_sessions_coletadas.local vazio — rode /tuninho-da-comlurb ou portas-em-automatico"
  fi
fi

# Audit-handoff-freshness: timestamp recente
if grep -q "encerramento_timestamp: null" "$LATEST_HANDOFF" 2>/dev/null; then
  if [[ "$MODO_COMLURB" == "true" ]]; then
    log_pass "encerramento_timestamp: sera preenchido pelo Comlurb"
  else
    log_fail "encerramento_timestamp ainda null — HANDOFF nao foi finalizado"
  fi
else
  log_pass "encerramento_timestamp presente"
fi

echo ""
if [[ $FAILS -gt 0 ]]; then
  echo "audit-handoff: $FAILS check(s) FAIL"
  exit 1
fi

echo "audit-handoff: PASS"
exit 0
