#!/usr/bin/env bash
# audit-handoff-ddce26.sh — Executa os 8 checks da Regra #26 do tuninho-ddce
# + pendency accounting da REGRA_MASTER_1 petrea do tuninho-qa
#
# Usage: ./audit-handoff-ddce26.sh <NN_operacao> [<NN_sessao>]
#
# Exit codes:
#   0 — HANDOFF CONSISTENTE (pode dar /clear)
#   1 — HANDOFF COM GAPS (warnings — operador decide)
#   2 — HANDOFF INCONSISTENTE (bloqueia /clear)

set -u

OP_NUM="${1:-}"
SESSAO="${2:-}"

if [[ -z "$OP_NUM" ]]; then
  echo "Usage: $0 <NN_operacao> [<NN_sessao>]"
  exit 2
fi

# Localiza pasta da operacao
OP_DIR=$(find _a4tunados/_operacoes/projetos/ -maxdepth 1 -type d -name "${OP_NUM}_*" 2>/dev/null | head -1)

if [[ -z "$OP_DIR" || ! -d "$OP_DIR" ]]; then
  echo "ERROR: Pasta da operacao Op $OP_NUM nao encontrada"
  exit 2
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AUDIT-HANDOFF — Op $OP_NUM                                 ║"
echo "║  (Regra #26 do tuninho-ddce + REGRA_MASTER_1 do tuninho-qa) ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo
echo "Pasta: $OP_DIR"

VEREDITO="CONSISTENTE"
WARN_COUNT=0
FAIL_COUNT=0

fail() {
  echo "  ❌ FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  VEREDITO="INCONSISTENTE"
}

warn() {
  echo "  ⚠️  WARN: $1"
  WARN_COUNT=$((WARN_COUNT + 1))
  if [[ "$VEREDITO" != "INCONSISTENTE" ]]; then
    VEREDITO="COM_GAPS"
  fi
}

pass() {
  echo "  ✅ PASS: $1"
}

# ============================================================
# CATEGORIA 0 — Localizar HANDOFFs (nova estrutura vs legacy)
# ============================================================
echo
echo "── Categoria 0: Estrutura HANDOFF ──"

HANDOFFS_DIR="$OP_DIR/handoffs"

if [[ -d "$HANDOFFS_DIR" ]]; then
  pass "Nova estrutura detectada (handoffs/)"
  HEAD_HANDOFF=$(find "$HANDOFFS_DIR" -maxdepth 1 -name "HANDOFF_*_sessao_*.yaml" 2>/dev/null | sort | tail -1)
  if [[ -n "$HEAD_HANDOFF" ]]; then
    pass "Handoff head atual: $(basename "$HEAD_HANDOFF")"
  else
    fail "Pasta handoffs/ existe mas nao ha HANDOFF_*_sessao_*.yaml"
  fi
elif [[ -f "$OP_DIR/HANDOFF.yaml" ]]; then
  warn "Estrutura legacy detectada (HANDOFF.yaml na raiz — migracao pendente para v3.10.0)"
  HEAD_HANDOFF="$OP_DIR/HANDOFF.yaml"
else
  fail "Nenhum HANDOFF encontrado (nem nova estrutura, nem legacy)"
  HEAD_HANDOFF=""
fi

# ============================================================
# CATEGORIA 1 — Pendency Accounting (REGRA_MASTER_1)
# ============================================================
echo
echo "── Categoria 1: Pendency Accounting (REGRA_MASTER_1) ──"

if [[ -d "$HANDOFFS_DIR" && -n "$HEAD_HANDOFF" ]]; then
  # Detecta sessao atual
  BASENAME=$(basename "$HEAD_HANDOFF")
  CURRENT_SESSAO=$(echo "$BASENAME" | sed -nE 's/.*_sessao_([0-9]+)\.yaml/\1/p')

  if [[ -n "$CURRENT_SESSAO" ]]; then
    pass "Sessao corrente detectada: $CURRENT_SESSAO"

    # Busca snapshot da sessao anterior
    PREV_SESSAO=$(printf "%02d" $((10#$CURRENT_SESSAO - 1)))
    PREV_SNAPSHOT=$(find "$HANDOFFS_DIR" -maxdepth 1 -name "HANDOFF_*_sessao_${PREV_SESSAO}.yaml" 2>/dev/null | head -1)

    if [[ -n "$PREV_SNAPSHOT" ]]; then
      pass "Snapshot sessao $PREV_SESSAO encontrado: $(basename "$PREV_SNAPSHOT")"

      # Conta pendencias no snapshot anterior (busca strings comuns)
      PREV_PEND=$(grep -cE "(pendente|P[12]\.[A-Z]|pendencias|P[0-9]+\.[0-9]+:)" "$PREV_SNAPSHOT" 2>/dev/null | head -1)
      PREV_PEND="${PREV_PEND:-0}"
      CURR_PEND=$(grep -cE "(pendente|P[12]\.[A-Z]|pendencias|P[0-9]+\.[0-9]+:)" "$HEAD_HANDOFF" 2>/dev/null | head -1)
      CURR_PEND="${CURR_PEND:-0}"

      pass "Pendencias no snapshot $PREV_SESSAO: $PREV_PEND linhas (sem parser YAML exato)"
      pass "Pendencias no head atual: $CURR_PEND linhas"

      if [[ "$CURR_PEND" -lt "$PREV_PEND" ]]; then
        warn "Head tem menos referencias a pendencias que o snapshot anterior — revisar manualmente se ha pendencias esquecidas"
      fi
    else
      warn "Snapshot sessao $PREV_SESSAO nao encontrado — primeira sessao OU gap de continuidade"
    fi
  else
    warn "Nao foi possivel detectar numero da sessao no nome do arquivo"
  fi
else
  warn "Pendency accounting nao aplicavel (estrutura legacy ou HANDOFF ausente)"
fi

# ============================================================
# CATEGORIA 2 — Artefatos DDCE
# ============================================================
echo
echo "── Categoria 2: Artefatos DDCE ──"

PROMPTS_DIR="_a4tunados/_operacoes/prompts"

check_artefato() {
  local pattern="$1"
  local min_lines="$2"
  local label="$3"
  local found
  found=$(find "$PROMPTS_DIR" -maxdepth 1 -name "${OP_NUM}_${pattern}*" 2>/dev/null | head -1)
  if [[ -z "$found" ]]; then
    fail "$label ausente (padrao: ${OP_NUM}_${pattern}*)"
    return
  fi
  local lines
  lines=$(wc -l < "$found" 2>/dev/null | tr -d ' ')
  if [[ "$lines" -lt "$min_lines" ]]; then
    warn "$label tem $lines linhas (esperado >= $min_lines)"
  else
    pass "$label ($lines linhas)"
  fi
}

check_artefato "0_PROMPT_ORIGINAL" 20 "_0_PROMPT_ORIGINAL"
check_artefato "1_DISCOVERY_" 100 "_1_DISCOVERY_"
check_artefato "1-xp_DISCOVERY_" 200 "_1-xp_DISCOVERY_"
check_artefato "2_DEFINE_PLAN_" 200 "_2_DEFINE_PLAN_"
check_artefato "2-xp_DEFINE_PLAN_" 200 "_2-xp_DEFINE_PLAN_"

RESULTS=$(find "$OP_DIR" -maxdepth 1 -name "_3_RESULTS_*.md" 2>/dev/null | head -1)
if [[ -n "$RESULTS" ]]; then
  pass "_3_RESULTS_ encontrado em $(basename "$RESULTS")"
else
  warn "_3_RESULTS_ ausente (pode ser operacao nao concluida ainda)"
fi

# ============================================================
# CATEGORIA 3 — Dossie/Output
# ============================================================
echo
echo "── Categoria 3: Dossie/Output ──"

if [[ -d "$OP_DIR/qa" ]]; then
  QA_FILES=$(find "$OP_DIR/qa" -maxdepth 2 -type f 2>/dev/null | wc -l | tr -d ' ')
  pass "qa/ existe com $QA_FILES arquivos"
else
  warn "qa/ nao existe (operacao pode nao ter sido auditada pela tuninho-qa)"
fi

# ============================================================
# CATEGORIA 4 — Documentos Operacao
# ============================================================
echo
echo "── Categoria 4: Documentos Operacao ──"

for doc in README.md PLANO_GERAL.md aprendizados_operacao.md; do
  if [[ -f "$OP_DIR/$doc" ]]; then
    lines=$(wc -l < "$OP_DIR/$doc" 2>/dev/null | tr -d ' ')
    pass "$doc ($lines linhas)"
  else
    fail "$doc ausente"
  fi
done

# ============================================================
# CATEGORIA 5 — Fases Executadas
# ============================================================
echo
echo "── Categoria 5: Fases Executadas ──"

FASES=$(find "$OP_DIR" -maxdepth 1 -type d -name "fase_*" 2>/dev/null | sort)

if [[ -z "$FASES" ]]; then
  warn "Nenhuma pasta fase_* encontrada"
else
  for FASE in $FASES; do
    FASE_NAME=$(basename "$FASE")
    MISSING=""
    for req in plano.md checklist.md checkpoints.md aprendizados.md review.md; do
      if [[ ! -f "$FASE/$req" ]]; then
        MISSING="$MISSING $req"
      fi
    done
    if [[ -n "$MISSING" ]]; then
      fail "$FASE_NAME faltando:$MISSING"
    else
      # Check review.md tem >= 30 linhas e sem placeholders
      REVIEW_LINES=$(wc -l < "$FASE/review.md" 2>/dev/null | tr -d ' ')
      # Patterns de placeholder (v0.8.1 — expandido pos Op 05 QA-retro)
      # Legado: {variavel} | {TITULO_DA_FASE}
      PH_LEGACY=$(grep -cE "^\{[a-zA-Z_ ]+\}$" "$FASE/review.md" 2>/dev/null | head -1)
      # Op 05 patterns que escaparam do audit:
      #   (apos) | (preenchido durante/apos execucao) | (preenchido apos)
      #   status: PENDENTE  — em fase que deveria estar entregue
      PH_OP05=$(grep -cE "^\(apos\)$|\(preenchido (durante|apos)" "$FASE/review.md" 2>/dev/null | head -1)
      # Checklist/aprendizados/checkpoints tambem checam
      PH_CHECKLIST=0
      PH_CHECKPOINTS=0
      PH_APRENDIZADOS=0
      if [[ -f "$FASE/checkpoints.md" ]]; then
        PH_CHECKPOINTS=$(grep -cE "\(preenchido (durante|apos)" "$FASE/checkpoints.md" 2>/dev/null | head -1)
      fi
      if [[ -f "$FASE/aprendizados.md" ]]; then
        PH_APRENDIZADOS=$(grep -cE "\(preenchido (durante|apos)" "$FASE/aprendizados.md" 2>/dev/null | head -1)
      fi
      if [[ -f "$FASE/checklist.md" ]]; then
        # Checklist com TODAS linhas `[ ]` em fase declarada entregue
        # Heuristica: se review.md tem status=ENTREGUE mas checklist so tem `[ ]`
        STATUS_REVIEW=$(grep -oP "^status:\s*\K\w+" "$FASE/review.md" 2>/dev/null | head -1)
        CHECKED=$(grep -cE "^- \[x\]" "$FASE/checklist.md" 2>/dev/null | head -1)
        UNCHECKED=$(grep -cE "^- \[ \]" "$FASE/checklist.md" 2>/dev/null | head -1)
        CHECKED="${CHECKED:-0}"
        UNCHECKED="${UNCHECKED:-0}"
        if [[ "$STATUS_REVIEW" =~ ^(ENTREGUE|CONCLUIDO) ]] && [[ "$CHECKED" -eq 0 ]] && [[ "$UNCHECKED" -gt 0 ]]; then
          PH_CHECKLIST=1
        fi
      fi
      # Status PENDENTE em review.md de fase ja entregue e bug
      STATUS_PENDENTE=$(grep -cE "^status:\s*PENDENTE\s*$" "$FASE/review.md" 2>/dev/null | head -1)
      STATUS_PENDENTE="${STATUS_PENDENTE:-0}"

      PH_LEGACY="${PH_LEGACY:-0}"
      PH_OP05="${PH_OP05:-0}"
      PH_CHECKPOINTS="${PH_CHECKPOINTS:-0}"
      PH_APRENDIZADOS="${PH_APRENDIZADOS:-0}"
      PH_TOTAL=$((PH_LEGACY + PH_OP05 + PH_CHECKPOINTS + PH_APRENDIZADOS + PH_CHECKLIST + STATUS_PENDENTE))

      if [[ "$REVIEW_LINES" -lt 30 ]]; then
        warn "$FASE_NAME/review.md tem $REVIEW_LINES linhas (< 30)"
      elif [[ "$PH_TOTAL" -gt 0 ]]; then
        DETAILS=""
        [[ "$PH_LEGACY" -gt 0 ]] && DETAILS+=" review/legacy=$PH_LEGACY"
        [[ "$PH_OP05" -gt 0 ]] && DETAILS+=" review/op05=$PH_OP05"
        [[ "$PH_CHECKPOINTS" -gt 0 ]] && DETAILS+=" checkpoints=$PH_CHECKPOINTS"
        [[ "$PH_APRENDIZADOS" -gt 0 ]] && DETAILS+=" aprendizados=$PH_APRENDIZADOS"
        [[ "$PH_CHECKLIST" -eq 1 ]] && DETAILS+=" checklist-tudo-vazio"
        [[ "$STATUS_PENDENTE" -eq 1 ]] && DETAILS+=" status=PENDENTE"
        fail "$FASE_NAME placeholders nao preenchidos:$DETAILS"
      else
        pass "$FASE_NAME completo ($REVIEW_LINES linhas review)"
      fi
    fi
  done
fi

# ============================================================
# CATEGORIA 6 — Codigo Modificado
# ============================================================
echo
echo "── Categoria 6: Codigo Modificado ──"

BRANCH=$(git branch --show-current 2>/dev/null)
if [[ -n "$BRANCH" ]]; then
  pass "Branch atual: $BRANCH"
else
  warn "Nao foi possivel detectar branch git"
fi

UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
pass "Arquivos nao commitados: $UNCOMMITTED"

# ============================================================
# CATEGORIA 7 — Contexto Retomada
# ============================================================
echo
echo "── Categoria 7: Contexto Retomada ──"

TOTAL_LINES=0
for f in "$HEAD_HANDOFF" "$OP_DIR/README.md" "$OP_DIR/PLANO_GERAL.md"; do
  if [[ -f "$f" ]]; then
    l=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
    TOTAL_LINES=$((TOTAL_LINES + l))
  fi
done
# Approx 20 tokens por linha
EST_TOKENS=$((TOTAL_LINES * 20))
pass "Contexto total: ~$TOTAL_LINES linhas, ~${EST_TOKENS} tokens cold-start estimados"

if [[ "$EST_TOKENS" -gt 100000 ]]; then
  warn "Contexto cold-start > 100k tokens — handoff pesado"
fi

# ============================================================
# VEREDITO FINAL
# ============================================================
echo
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VEREDITO FINAL                                             ║"
echo "╠════════════════════════════════════════════════════════════╣"
printf "║  Warnings: %-47d  ║\n" "$WARN_COUNT"
printf "║  Fails:    %-47d  ║\n" "$FAIL_COUNT"
printf "║  Veredito: %-47s  ║\n" "$VEREDITO"
echo "╚════════════════════════════════════════════════════════════╝"

case "$VEREDITO" in
  CONSISTENTE)   exit 0 ;;
  COM_GAPS)      exit 1 ;;
  INCONSISTENTE) exit 2 ;;
esac
