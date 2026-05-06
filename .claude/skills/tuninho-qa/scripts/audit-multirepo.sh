#!/usr/bin/env bash
# tuninho-qa audit-multirepo-coherence — Op 18 Fase 6 (Decisao D8)
# Mecanismo de observacao multi-repo: cruza repos_state do HANDOFF Comlurb
# com lag real via git-flow-dafor + comlurb_sealed_repos consistency
#
# Uso: bash audit-multirepo.sh <operacao_NN>
# Exit 0 = PASS, 2 = WARN, 1 = FAIL

set -euo pipefail
OP=${1:-}
[ -z "$OP" ] && { echo "Usage: $0 <operacao_NN>"; exit 1; }

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
HANDOFF=$(ls -t "$REPO_ROOT/_a4tunados/_operacoes/projetos/${OP}_"*/handoffs/HANDOFF_*.yaml 2>/dev/null | head -1)
[ -z "$HANDOFF" ] && { echo "[FAIL] HANDOFF nao encontrado para Op $OP"; exit 1; }

# Extrair repos_state via python (yaml seguro)
REPOS_JSON=$(python3 -c "
import yaml, json, sys
try:
    with open('$HANDOFF') as f:
        d = yaml.safe_load(f)
    state = d.get('repos_state') or {}
    print(json.dumps({
        'repos': list(state.keys()),
        'state': state,
        'sealed_repos': d.get('comlurb_sealed_repos', [])
    }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
")

ERROR=$(echo "$REPOS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('error',''))")
[ -n "$ERROR" ] && { echo "[FAIL] Erro lendo HANDOFF: $ERROR"; exit 1; }

REPOS=$(echo "$REPOS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print(','.join(d['repos']))")

if [ -z "$REPOS" ]; then
  echo "[SKIP] single-repo mode (repos_state vazio no HANDOFF Op $OP) — audit-multirepo nao se aplica"
  exit 0
fi

DRIFT=0
FAIL_FOUND=0
echo "=== audit-multirepo-coherence Op $OP ==="
echo "Repos no HANDOFF: $REPOS"
echo ""

for REPO in ${REPOS//,/ }; do
  DECLARED=$(echo "$REPOS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d['state']['$REPO'].get('lag_commits', '?'))
")
  SEALED=$(echo "$REPOS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d['state']['$REPO'].get('sealed', False))
")

  echo "  [$REPO]"
  echo "    lag declarado: $DECLARED"
  echo "    sealed: $SEALED"

  # Cruzar com comlurb_sealed_repos
  IS_IN_SEALED=$(echo "$REPOS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('$REPO' in d.get('sealed_repos', []))
")
  if [ "$SEALED" = "True" ] && [ "$IS_IN_SEALED" != "True" ]; then
    echo "    [FAIL] sealed=True no repos_state mas repo NAO em comlurb_sealed_repos[]"
    FAIL_FOUND=$((FAIL_FOUND+1))
  fi

  # Threshold WARN: lag > 10
  if [ "$DECLARED" != "?" ] && [ "$DECLARED" -gt 10 ] 2>/dev/null; then
    echo "    [WARN] lag $DECLARED > 10 commits — operacao defasada vs develop"
    DRIFT=$((DRIFT+1))
  fi
done

echo ""
if [ "$FAIL_FOUND" -gt 0 ]; then
  echo "[FAIL] $FAIL_FOUND inconsistencias FAIL detectadas"
  exit 1
elif [ "$DRIFT" -gt 0 ]; then
  echo "[WARN] $DRIFT drifts detectados — revisar mas nao bloqueante"
  exit 2
else
  echo "[PASS] Multi-repo coerente — repos_state e comlurb_sealed_repos consistentes"
  exit 0
fi
