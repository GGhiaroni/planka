#!/bin/bash
# audit-escriba-coverage.sh — sub-check do tuninho-qa Modo 9 (audit-gate-final)
#
# Implementa REGRA_MASTER_5 (Op 05): valida mecanicamente que tuninho-escriba
# rodou completo na operacao antes de aplicar comlurb_sealed: true (selo final).
#
# Verifica cumulativamente:
#   (a) sessoes/{data}_NN_*.md no vault menciona a operacao
#   (b) >= 1 ADR em decisoes/ se houve decisao tecnica significativa
#   (c) >= 1 doc em implementacao/ se a operacao TOCOU CODIGO
#   (d) report-executivo.md atualizado com sessao da operacao
#   (e) MOC-Projeto.md atualizado (WARN — nao bloqueia)
#   (f) escriba_completo_em no HANDOFF da operacao
#
# Versao: v0.10.0 (introduzido em tuninho-qa v0.10.0 — JA documentado em v0.9.0,
#                  mas script bash criado agora pra invocacao mecanica)
#
# Uso:
#   ./audit-escriba-coverage.sh <operacao_NN>
#
# Exit codes:
#   0 — PASS (escriba completo)
#   1 — FAIL (uma ou mais etapas faltando — bloqueia seal)
#   2 — ERR (operacao nao encontrada)

set -uo pipefail

OPERACAO_NN="${1:-}"

if [ -z "$OPERACAO_NN" ]; then
  echo "ERR: uso: $0 <operacao_NN>" >&2
  exit 2
fi

OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/${OPERACAO_NN}_*/ 2>/dev/null | head -1)
if [ -z "$OP_DIR" ]; then
  echo "ERR: operacao $OPERACAO_NN nao encontrada" >&2
  exit 2
fi

OP_NAME=$(basename "$OP_DIR" | sed "s/^${OPERACAO_NN}_//")

# Detectar projeto (vault path)
PROJ=$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||')
[ -z "$PROJ" ] && PROJ=$(basename "$PWD")
VAULT="_a4tunados/docs_${PROJ}"

if [ ! -d "$VAULT" ]; then
  echo "FAIL: vault $VAULT nao existe — escriba nunca rodou neste projeto" >&2
  exit 1
fi

FAIL=0
WARN=0
REPORT=""

# (a) Sessao no vault menciona a operacao
SESSION_FOUND=$(grep -lr "op-${OPERACAO_NN}\|${OP_NAME}\|operacao: ${OPERACAO_NN}\b" ${VAULT}/sessoes/*.md 2>/dev/null | head -1)
if [ -n "$SESSION_FOUND" ]; then
  REPORT="$REPORT\n  ✓ (a) Sessao no vault: $(basename $SESSION_FOUND)"
else
  REPORT="$REPORT\n  ✗ (a) FAIL: nenhuma sessao em $VAULT/sessoes/ menciona Op $OPERACAO_NN"
  FAIL=$((FAIL + 1))
fi

# (b) ADRs em decisoes/
ADR_COUNT=$(grep -lr "operacao: ${OPERACAO_NN}\b\|op-${OPERACAO_NN}\b\|Op ${OPERACAO_NN}\b" ${VAULT}/decisoes/*.md 2>/dev/null | wc -l)
if [ "$ADR_COUNT" -ge 1 ]; then
  REPORT="$REPORT\n  ✓ (b) ADRs em decisoes/: $ADR_COUNT arquivo(s) referenciam Op $OPERACAO_NN"
else
  # Verificar se houve decisao tecnica significativa (heuristica: aprendizados_operacao mencionar "decis")
  if [ -f "${OP_DIR}aprendizados_operacao.md" ] && grep -qi "decis" "${OP_DIR}aprendizados_operacao.md"; then
    REPORT="$REPORT\n  ✗ (b) FAIL: 0 ADRs em decisoes/ mas aprendizados_operacao menciona decisoes — esperado >= 1 ADR"
    FAIL=$((FAIL + 1))
  else
    REPORT="$REPORT\n  - (b) Skip: nenhuma decisao tecnica significativa (sem ADR esperado)"
  fi
fi

# (c) Docs em implementacao/ se tocou codigo
# Heuristica: se ha commits da op em src/ ou app/ ou lib/
CODE_TOUCHED=$(git log --all --name-only --pretty=format: 2>/dev/null | grep -E "^(src|app|lib|components)/" | head -1)
if [ -n "$CODE_TOUCHED" ]; then
  IMPL_COUNT=$(grep -lr "operacao: ${OPERACAO_NN}\b\|op-${OPERACAO_NN}\b\|Op ${OPERACAO_NN}\b" ${VAULT}/implementacao/*.md 2>/dev/null | wc -l)
  if [ "$IMPL_COUNT" -ge 1 ]; then
    REPORT="$REPORT\n  ✓ (c) Docs em implementacao/: $IMPL_COUNT arquivo(s) referenciam Op $OPERACAO_NN"
  else
    REPORT="$REPORT\n  ✗ (c) FAIL: 0 docs em implementacao/ mas operacao tocou codigo (src/app/lib)"
    FAIL=$((FAIL + 1))
  fi
else
  REPORT="$REPORT\n  - (c) Skip: operacao nao tocou codigo (sem doc esperado)"
fi

# (d) report-executivo.md atualizado
REPORT_MD="${VAULT}/report-executivo.md"
if [ -f "$REPORT_MD" ]; then
  if grep -q "Op ${OPERACAO_NN}\b\|sessoes/.*op-${OPERACAO_NN}" "$REPORT_MD" 2>/dev/null; then
    REPORT="$REPORT\n  ✓ (d) report-executivo.md menciona Op $OPERACAO_NN"
  else
    REPORT="$REPORT\n  ✗ (d) FAIL: report-executivo.md nao menciona Op $OPERACAO_NN"
    FAIL=$((FAIL + 1))
  fi
else
  REPORT="$REPORT\n  ✗ (d) FAIL: report-executivo.md nao existe em $VAULT"
  FAIL=$((FAIL + 1))
fi

# (e) MOC-Projeto.md atualizado (WARN)
MOC="${VAULT}/MOC-Projeto.md"
if [ -f "$MOC" ]; then
  if grep -q "Op ${OPERACAO_NN}\b\|op-${OPERACAO_NN}" "$MOC" 2>/dev/null; then
    REPORT="$REPORT\n  ✓ (e) MOC-Projeto.md referencia Op $OPERACAO_NN"
  else
    REPORT="$REPORT\n  ! (e) WARN: MOC-Projeto.md nao referencia Op $OPERACAO_NN"
    WARN=$((WARN + 1))
  fi
fi

# (f) escriba_completo_em no HANDOFF
LAST_HANDOFF=$(ls -t ${OP_DIR}handoffs/HANDOFF_*_sessao_*.yaml 2>/dev/null | head -1)
if [ -n "$LAST_HANDOFF" ]; then
  COMPLETO=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$LAST_HANDOFF'))
    ts = d.get('escriba_completo_em', '')
    print(ts if ts else 'AUSENTE')
except:
    print('AUSENTE')
" 2>/dev/null)

  if [ "$COMPLETO" != "AUSENTE" ] && [ -n "$COMPLETO" ]; then
    REPORT="$REPORT\n  ✓ (f) escriba_completo_em: $COMPLETO"
  else
    REPORT="$REPORT\n  ✗ (f) FAIL: escriba_completo_em ausente no HANDOFF"
    FAIL=$((FAIL + 1))
  fi
fi

# Veredito
echo "=== audit-escriba-coverage Op $OPERACAO_NN ($OP_NAME) ==="
echo "Vault: $VAULT"
echo -e "$REPORT"
echo ""
echo "Score: $((6 - FAIL - WARN)) PASS | $WARN WARN | $FAIL FAIL"

if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: PASS — escriba completo, seal liberado"
  exit 0
else
  echo "STATUS: FAIL — $FAIL etapa(s) faltando — SEAL BLOQUEADO (Regra Inviolavel SEAL-003)"
  echo ""
  echo "Acao corretiva: invocar /tuninho-escriba pra completar etapas faltantes"
  exit 1
fi
