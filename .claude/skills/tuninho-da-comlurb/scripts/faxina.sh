#!/usr/bin/env bash
# tuninho-da-comlurb v0.1.0 — entry point
# Orquestra os 5 passos do ritual de faxina antes de /clear.
#
# Uso:
#   faxina.sh --mode <modo> [--cwd <path>] [--operacao <NN>]
#
# Modos:
#   faxina-pre-clear      (manual, default)
#   pre-compact           (via hook PreCompact)
#   gate-guard-light      (via DDCE apos gate, sem seal completo)
#   gate-guard-full       (via DDCE apos gate, com seal)
#   selo-final-operacao   (via DDCE Etapa 17 apos escriba)
#   emergencial-85pct     (via hook conta-token)
#
# Exit codes:
#   0 = ritual OK, seal aplicado (ou gate-guard-light sem seal mas OK)
#   1 = ritual FAIL, gaps detectados, NAO aplicou seal
#   2 = erro tecnico (dependencia faltando, permissao, etc)

set -eu

MODE="faxina-pre-clear"
CWD="$(pwd)"
OPERACAO=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2;;
    --cwd) CWD="$2"; shift 2;;
    --operacao) OPERACAO="$2"; shift 2;;
    *) echo "Arg desconhecido: $1" >&2; exit 2;;
  esac
done

cd "$CWD" || { echo "ERRO: cwd invalido: $CWD" >&2; exit 2; }

SKILL_DIR="$(dirname "$(readlink -f "$0")")/.."
SCRIPTS_DIR="$SKILL_DIR/scripts"

# v0.2.0 (2026-04-22, L-REV-7): flag de escape para hook conta-token v5.1.0.
# Enquanto este flag existe, o hook libera TODAS as tools mesmo em 85%+ —
# permite que o ritual execute edits/writes sem bloqueio. Removido on EXIT.
FLAG_ACTIVE="$CWD/.claude/.comlurb-active"
mkdir -p "$(dirname "$FLAG_ACTIVE")"
touch "$FLAG_ACTIVE"
trap 'rm -f "$FLAG_ACTIVE"' EXIT

# Detectar operacao ativa se nao passou
if [[ -z "$OPERACAO" ]]; then
  OPERACAO=$(ls -d _a4tunados/_operacoes/projetos/*/ 2>/dev/null | sort | tail -1 | sed 's|.*/projetos/||;s|/$||' | head -c 2)
  if [[ -z "$OPERACAO" ]]; then
    echo "AVISO: Nenhuma operacao DDCE detectada. Rodando em modo degraded." >&2
    OPERACAO="DEGRADED"
  fi
fi

OP_DIR="_a4tunados/_operacoes/projetos/$(ls -d _a4tunados/_operacoes/projetos/${OPERACAO}_*/ 2>/dev/null | head -1 | sed 's|_a4tunados/_operacoes/projetos/||;s|/$||')"

echo "═══════════════════════════════════════════════════════════════"
echo "  🧹 TUNINHO DA COMLURB v0.1.0 — Iniciando faxina"
echo "═══════════════════════════════════════════════════════════════"
echo "  Modo:      $MODE"
echo "  Operacao:  $OPERACAO"
echo "  CWD:       $CWD"
echo "─────────────────────────────────────────────────────────────"

# ===================================================================
# PASSO 1 — Sincronizar JSONL da sessao atual
# ===================================================================
echo ""
echo "▶ PASSO 1/5 — Sincronizar JSONL + plan files"
if ! bash "$SCRIPTS_DIR/sync-jsonl-final.sh" --cwd "$CWD" --op-dir "$OP_DIR"; then
  echo "✗ Passo 1 falhou" >&2
  exit 1
fi

# Gate-guard-light para aqui (sem HANDOFF update nem seal)
if [[ "$MODE" == "gate-guard-light" ]]; then
  echo ""
  echo "✅ GATE-GUARD-LIGHT completo — JSONL sincronizado, sem seal"
  exit 0
fi

if [[ "$OPERACAO" == "DEGRADED" ]]; then
  echo ""
  echo "⚠️  Modo degraded: sem operacao DDCE, parando apos passo 1"
  exit 0
fi

# ===================================================================
# PASSO 2 — Atualizar HANDOFF
# ===================================================================
echo ""
echo "▶ PASSO 2/5 — Atualizar HANDOFF"
if ! python3 "$SCRIPTS_DIR/atualizar-handoff.py" --cwd "$CWD" --op-dir "$OP_DIR" --mode "$MODE"; then
  echo "✗ Passo 2 falhou" >&2
  exit 1
fi

# ===================================================================
# PASSO 3 — Reconciliar pendency-ledger
# ===================================================================
echo ""
echo "▶ PASSO 3/5 — Reconciliar pendency-ledger"
if ! python3 "$SCRIPTS_DIR/reconciliar-pendency-ledger.py" --cwd "$CWD" --op-dir "$OP_DIR"; then
  echo "✗ Passo 3 falhou" >&2
  exit 1
fi

# ===================================================================
# PASSO 4 — Invocar tuninho-qa (audit-handoff + audit-continuidade)
# ===================================================================
echo ""
echo "▶ PASSO 4/5 — Validacao QA"

QA_OK=1
QA_SKILL="$CWD/.claude/skills/tuninho-qa/scripts"

# Se QA scripts existem, invocar. Senao, warn e continuar (graceful degradation).
if [[ -x "$QA_SKILL/audit-handoff.sh" ]]; then
  if ! bash "$QA_SKILL/audit-handoff.sh" --operacao "$OPERACAO" --modo-comlurb 2>&1; then
    QA_OK=0
    echo "  ✗ audit-handoff: FAIL" >&2
  else
    echo "  ✓ audit-handoff: PASS"
  fi
else
  echo "  ⚠ audit-handoff: script nao encontrado (tuninho-qa v0.6.0+ necessario)"
fi

if [[ -x "$QA_SKILL/audit-continuidade.sh" ]]; then
  if ! bash "$QA_SKILL/audit-continuidade.sh" --operacao "$OPERACAO" 2>&1; then
    QA_OK=0
    echo "  ✗ audit-continuidade: FAIL" >&2
  else
    echo "  ✓ audit-continuidade: PASS"
  fi
else
  echo "  ⚠ audit-continuidade: script nao encontrado (tuninho-qa v0.6.0+ necessario)"
fi

if [[ $QA_OK -eq 0 ]]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║   🚨 FAXINA INCOMPLETA — NAO DE /clear AGORA                   ║"
  echo "╠════════════════════════════════════════════════════════════════╣"
  echo "║ QA reportou gaps. Corrija os itens acima e invoque             ║"
  echo "║ /tuninho-da-comlurb novamente. NAO aplicarei seal enquanto     ║"
  echo "║ houver gaps — isso e proposital.                               ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  exit 1
fi

# ===================================================================
# PASSO 5 — Aplicar seal + apresentar painel
# ===================================================================
echo ""
echo "▶ PASSO 5/5 — Aplicar seal + briefing"
if ! python3 "$SCRIPTS_DIR/aplicar-seal.py" --cwd "$CWD" --op-dir "$OP_DIR" --mode "$MODE"; then
  echo "✗ Passo 5 falhou" >&2
  exit 1
fi

# Painel final
python3 "$SCRIPTS_DIR/apresentar-painel.py" --cwd "$CWD" --op-dir "$OP_DIR" --mode "$MODE"

exit 0
