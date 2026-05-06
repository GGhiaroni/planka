#!/bin/bash
# audit-session-resumption.sh — Modo 15 do tuninho-qa
#
# Cold-start integrity check: valida que a sessao atual recuperou tudo do
# HANDOFF anterior selado, com EVIDENCIAS objetivas, antes de iniciar trabalho.
#
# Conceito: equivalente do "checkpoint de saude" da DDCE Regra #22 mas pos-/clear.
# Garante que retomada de sessao e "como se nao tivesse sido interrompida".
#
# Versao: v0.10.0 (introduzido em tuninho-qa v0.10.0)
#
# Uso:
#   ./audit-session-resumption.sh [<operacao_NN>]
#
# Se NN omitido, detecta operacao mais recente em _a4tunados/_operacoes/projetos/
#
# Exit codes:
#   0 — READY (todas evidencias validadas, retomada integra)
#   1 — DEGRADED (algumas evidencias faltando, retomada possivel mas com gaps)
#   2 — UNAVAILABLE (HANDOFF anterior nao encontrado ou nao selado)

set -uo pipefail

OPERACAO_NN="${1:-}"

# Detectar operacao se nao informada
if [ -z "$OPERACAO_NN" ]; then
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/*/ 2>/dev/null | sort | tail -1)
  if [ -z "$OP_DIR" ]; then
    echo "UNAVAILABLE — nenhuma operacao DDCE encontrada em _a4tunados/_operacoes/projetos/"
    exit 2
  fi
  OPERACAO_NN=$(basename "$OP_DIR" | grep -oE '^[0-9]+')
else
  OP_DIR=$(ls -d _a4tunados/_operacoes/projetos/${OPERACAO_NN}_*/ 2>/dev/null | head -1)
  if [ -z "$OP_DIR" ]; then
    echo "UNAVAILABLE — operacao $OPERACAO_NN nao encontrada"
    exit 2
  fi
fi

OP_NAME=$(basename "$OP_DIR" | sed "s/^${OPERACAO_NN}_//")
HANDOFFS_DIR="${OP_DIR}handoffs"

# Localizar HANDOFF mais recente (sessao N-1 sera retomada como sessao N)
LAST_HANDOFF=$(ls -t ${HANDOFFS_DIR}/HANDOFF_*_sessao_*.yaml 2>/dev/null | head -1)

if [ -z "$LAST_HANDOFF" ]; then
  echo "UNAVAILABLE — nenhum HANDOFF encontrado em $HANDOFFS_DIR"
  exit 2
fi

LAST_SESSAO=$(basename "$LAST_HANDOFF" | grep -oE 'sessao_[0-9]+' | grep -oE '[0-9]+')

# ================================
# CHECKS DE INTEGRIDADE DE RETOMADA
# ================================

PASS=0
WARN=0
FAIL=0
EVIDENCES=""

# Check 1: HANDOFF anterior selado
SEAL_STATUS=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$LAST_HANDOFF'))
    sealed = d.get('comlurb_sealed', False)
    seal_mode = d.get('seal_mode', 'unknown')
    seal_ts = d.get('seal_timestamp', d.get('encerramento_timestamp', '?'))
    if sealed:
        print(f'SEALED|{seal_mode}|{seal_ts}')
    else:
        print(f'NOT_SEALED|-|-')
except Exception as e:
    print(f'ERR|{e}|-')
" 2>/dev/null)

IFS='|' read -r status mode ts <<< "$SEAL_STATUS"
if [ "$status" = "SEALED" ]; then
  EVIDENCES="$EVIDENCES\n  ✓ HANDOFF anterior selado: $LAST_HANDOFF"
  EVIDENCES="$EVIDENCES\n      Modo seal: $mode | Timestamp: $ts"
  PASS=$((PASS + 1))
else
  EVIDENCES="$EVIDENCES\n  ✗ HANDOFF anterior NAO selado ($status) — retomada degradada"
  FAIL=$((FAIL + 1))
fi

# Check 2: raw_sessions/ populado com JSONLs
RAW_DIR="${HANDOFFS_DIR}/raw_sessions"
JSONL_COUNT=$(ls ${RAW_DIR}/*.jsonl 2>/dev/null | wc -l)
JSONL_SIZE=$(du -sh "$RAW_DIR" 2>/dev/null | cut -f1)
if [ "$JSONL_COUNT" -gt 0 ]; then
  EVIDENCES="$EVIDENCES\n  ✓ raw_sessions: $JSONL_COUNT JSONLs ($JSONL_SIZE total)"
  PASS=$((PASS + 1))
else
  EVIDENCES="$EVIDENCES\n  ! raw_sessions: vazio — sem auditoria cruzada possivel"
  WARN=$((WARN + 1))
fi

# Check 3: Discovery XP disponivel (se DISCOVER ja foi)
XP_DISCOVERY=$(ls _a4tunados/_operacoes/prompts/${OPERACAO_NN}_1-xp_*.md 2>/dev/null | head -1)
if [ -n "$XP_DISCOVERY" ]; then
  XP_LINES=$(wc -l < "$XP_DISCOVERY")
  if [ "$XP_LINES" -ge 200 ]; then
    EVIDENCES="$EVIDENCES\n  ✓ Discovery XP: $XP_LINES linhas (>= 200 ✓)"
    PASS=$((PASS + 1))
  else
    EVIDENCES="$EVIDENCES\n  ! Discovery XP: apenas $XP_LINES linhas (< 200 esperado)"
    WARN=$((WARN + 1))
  fi
else
  EVIDENCES="$EVIDENCES\n  - Discovery XP: nao aplicavel (ainda em DISCOVER)"
fi

# Check 4: Define XP disponivel (se DEFINE ja foi)
XP_DEFINE=$(ls _a4tunados/_operacoes/prompts/${OPERACAO_NN}_2-xp_*.md 2>/dev/null | head -1)
if [ -n "$XP_DEFINE" ]; then
  XP_LINES=$(wc -l < "$XP_DEFINE")
  EVIDENCES="$EVIDENCES\n  ✓ Define XP: $XP_LINES linhas"
  PASS=$((PASS + 1))
fi

# Check 5: briefing populado
BRIEFING_LEN=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$LAST_HANDOFF'))
    b = d.get('briefing_proxima_sessao', '')
    print(len(b) if isinstance(b, str) else 0)
except:
    print(0)
" 2>/dev/null)

if [ "$BRIEFING_LEN" -ge 100 ] 2>/dev/null; then
  EVIDENCES="$EVIDENCES\n  ✓ Briefing populado: $BRIEFING_LEN chars (>= 100 ✓)"
  PASS=$((PASS + 1))
else
  EVIDENCES="$EVIDENCES\n  ✗ Briefing degradado: $BRIEFING_LEN chars (< 100)"
  FAIL=$((FAIL + 1))
fi

# Check 6: Pendencias do HANDOFF anterior (lista pra retomada)
PENDENCIES_OPEN=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$LAST_HANDOFF'))
    novas = d.get('pendencias_novas_criadas', []) or []
    abertas = [p for p in novas if isinstance(p, dict) and 'CLOSED' not in str(p.get('status', '')).upper() and 'ABERTA' in str(p.get('status', '')).upper()]
    print(len(abertas))
except:
    print(0)
" 2>/dev/null)

EVIDENCES="$EVIDENCES\n  → Pendencias abertas a retomar: $PENDENCIES_OPEN"

# Check 7: branch git correta
EXPECTED_BRANCH=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$LAST_HANDOFF'))
    print(d.get('branch_git', '?'))
except:
    print('?')
" 2>/dev/null)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [ "$EXPECTED_BRANCH" = "$CURRENT_BRANCH" ]; then
  EVIDENCES="$EVIDENCES\n  ✓ Branch git: $CURRENT_BRANCH (match HANDOFF)"
  PASS=$((PASS + 1))
else
  EVIDENCES="$EVIDENCES\n  ! Branch git: $CURRENT_BRANCH (HANDOFF esperava $EXPECTED_BRANCH)"
  WARN=$((WARN + 1))
fi

# Check 8: Contratos QA ativos
CONTRACT_PATH="${OP_DIR}contracts/qa-contract.yaml"
if [ -f "$CONTRACT_PATH" ]; then
  CONTRACT_STATUS=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$CONTRACT_PATH'))
    st = d.get('contract', {}).get('status', '?')
    pending = d.get('summary', {}).get('blocking_pending', 0)
    print(f'{st}|{pending}')
except:
    print('?|?')
" 2>/dev/null)

  IFS='|' read -r cstatus cpending <<< "$CONTRACT_STATUS"
  EVIDENCES="$EVIDENCES\n  ✓ Contrato QA: $cstatus (bloqueantes pendentes: $cpending)"
  PASS=$((PASS + 1))
else
  EVIDENCES="$EVIDENCES\n  - Contrato QA: nao encontrado (operacao pode ser pre-Etapa 7)"
fi

# ================================
# VEREDITO + PAINEL
# ================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🔄 SESSION RESUMPTION CHECK — Op $OPERACAO_NN $(printf '%-30s' "$OP_NAME") ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║ Sessao anterior selada: $(printf '%-37s' "sessao_$LAST_SESSAO ($mode)") ║"
echo "║ Sessao atual sera:     $(printf '%-38s' "sessao_$((LAST_SESSAO + 1))")║"
echo "║                                                              ║"
echo "║ EVIDENCIAS OBJETIVAS:                                        ║"
echo -e "$EVIDENCES" | sed 's/^/║ /' | awk '{printf "%-66s║\n", $0}' | head -16
echo "║                                                              ║"
echo "║ Score: $(printf '%-2d' $PASS) PASS | $(printf '%-2d' $WARN) WARN | $(printf '%-2d' $FAIL) FAIL$(printf '%-30s' '') ║"
if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
  echo "║                                                              ║"
  echo "║ STATUS: ✅ READY — retomada integra, sem perda de contexto  ║"
elif [ $FAIL -eq 0 ]; then
  echo "║                                                              ║"
  echo "║ STATUS: 🟡 READY_COM_GAPS — retomada possivel, ler warnings ║"
else
  echo "║                                                              ║"
  echo "║ STATUS: 🔴 DEGRADED — gaps criticos, investigar antes seguir║"
fi
echo "╚══════════════════════════════════════════════════════════════╝"

if [ $FAIL -eq 0 ]; then
  exit 0
else
  exit 1
fi
