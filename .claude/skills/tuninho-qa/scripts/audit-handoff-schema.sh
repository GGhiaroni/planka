#!/bin/bash
# audit-handoff-schema.sh — sub-check do tuninho-qa Modo 12 (audit-handoff)
#
# Valida que campos-chave do HANDOFF estao populados (nao vazios/null/[]).
# Resolve Licao L0.7 do tuninho-da-comlurb v0.1.0 (multi-edit YAML duplica
# keys silenciosamente) detectando briefings/decisoes vazios apos edit.
#
# Versao: v0.10.0 (introduzido em tuninho-qa v0.10.0)
#
# Uso:
#   ./audit-handoff-schema.sh <path/HANDOFF_*.yaml>
#
# Exit codes:
#   0 — PASS (todos campos-chave populados)
#   1 — FAIL (algum campo-chave vazio/null)
#   2 — ERR (HANDOFF nao encontrado ou yaml invalido)

set -uo pipefail

HANDOFF="${1:-}"

if [ -z "$HANDOFF" ] || [ ! -f "$HANDOFF" ]; then
  echo "ERR: HANDOFF nao encontrado: $HANDOFF" >&2
  exit 2
fi

# Campos-chave que DEVEM estar populados
REQUIRED_FIELDS=(
  "operacao"
  "sessao"
  "branch_git"
  "contexto.objetivo"
  "contexto.status"
  "briefing_proxima_sessao"
)

# Campos que devem ser arrays/objects nao-vazios (se presentes)
NON_EMPTY_LISTS=(
  "decisoes_tomadas"
  "decisoes_tomadas_sessao_02"
  "pendencias_fechadas"
  "pendencias_novas_criadas"
)

FAIL=0
REPORT=""

# 1. Required fields populados
for field in "${REQUIRED_FIELDS[@]}"; do
  # Usar python pra parse YAML robusto (yq pode nao estar disponivel)
  value=$(python3 -c "
import yaml, sys
try:
    d = yaml.safe_load(open('$HANDOFF'))
    keys = '$field'.split('.')
    v = d
    for k in keys:
        if isinstance(v, dict):
            v = v.get(k)
        else:
            v = None
            break
    if v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, (list, dict)) and not v):
        print('EMPTY')
    else:
        print('OK')
except Exception as e:
    print(f'ERR: {e}')
" 2>/dev/null)

  if [ "$value" != "OK" ]; then
    REPORT="$REPORT\n  ✗ $field: $value"
    FAIL=$((FAIL + 1))
  fi
done

# 2. Lists nao-vazias quando presentes
for list_field in "${NON_EMPTY_LISTS[@]}"; do
  status=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$HANDOFF'))
    v = d.get('$list_field')
    if v is None:
        print('ABSENT')
    elif isinstance(v, list) and len(v) == 0:
        print('EMPTY_LIST')
    elif isinstance(v, dict) and not v:
        print('EMPTY_DICT')
    else:
        print('OK')
except:
    print('ERR')
" 2>/dev/null)

  if [ "$status" = "EMPTY_LIST" ] || [ "$status" = "EMPTY_DICT" ]; then
    REPORT="$REPORT\n  ! $list_field: $status (presente mas vazio)"
    FAIL=$((FAIL + 1))
  fi
done

# 3. briefing_proxima_sessao: minimo 100 chars
briefing_len=$(python3 -c "
import yaml
try:
    d = yaml.safe_load(open('$HANDOFF'))
    b = d.get('briefing_proxima_sessao', '')
    print(len(b) if isinstance(b, str) else 0)
except:
    print(0)
" 2>/dev/null)

if [ "$briefing_len" -lt 100 ] 2>/dev/null; then
  REPORT="$REPORT\n  ! briefing_proxima_sessao: $briefing_len chars (esperado >= 100)"
  FAIL=$((FAIL + 1))
fi

# Output
if [ "$FAIL" -eq 0 ]; then
  echo "PASS — audit-handoff-schema: todos campos-chave populados"
  echo "  HANDOFF: $HANDOFF"
  echo "  Required fields: ${#REQUIRED_FIELDS[@]} OK"
  echo "  Non-empty lists: validados"
  echo "  Briefing: $briefing_len chars"
  exit 0
else
  echo "FAIL — audit-handoff-schema: $FAIL gap(s) detectado(s)"
  echo "  HANDOFF: $HANDOFF"
  echo -e "  Detalhes:$REPORT"
  echo ""
  echo "  Acao corretiva: re-popular campos vazios antes de selar"
  exit 1
fi
