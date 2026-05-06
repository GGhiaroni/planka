#!/usr/bin/env bash
# tuninho-devops-env auto-scan v1.0.0
#
# Scan deterministico de ambiente — cria sidecar SKELETON sem invocar LLM.
# Chamado pelo tuninho-hook-inicio-sessao quando env-catalog.json esta missing/stale.
#
# Uso: auto-scan.sh [<workspace_dir>]
#   workspace_dir: default PWD
#
# Saida: cria/sobrescreve
#   .claude/skills/tuninho-devops-env/projects/<project_name>/env-catalog.json
#   .claude/skills/tuninho-devops-env/projects/<project_name>/config.md  (apenas se nao existir)
#
# IMPORTANTE: scan e CONSERVADOR — captura apenas metadados e CHAVES de env vars.
# NUNCA captura valores de env vars (segurança).
# Marca scan_mode="auto-skeleton" para diferenciar de sidecars manuais (bootstrap/manual).
# Operador deve enriquecer via /tuninho-devops-env quando relevante.

set -e

WORKSPACE_DIR="${1:-$PWD}"
WORKSPACE_DIR="$(cd "$WORKSPACE_DIR" && pwd)"

# ==========================================================
# Derivar project_name (mesma logica do hook inicio-sessao)
# ==========================================================
derive_project_name() {
  local cwd="$1"
  if [[ "$cwd" =~ /opt/[^/]+/([^/]+)/workspaces/ ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi
  if [[ "$cwd" =~ /workspaces/([^/]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi
  basename "$cwd"
}

PROJECT_NAME="$(derive_project_name "$WORKSPACE_DIR")"
SIDECAR_DIR="$WORKSPACE_DIR/.claude/skills/tuninho-devops-env/projects/$PROJECT_NAME"
mkdir -p "$SIDECAR_DIR"

# ==========================================================
# Detectar stack via arquivos presentes
# ==========================================================
STACK_PARTS=()
[ -f "$WORKSPACE_DIR/package.json" ] && STACK_PARTS+=("Node.js (package.json)")
[ -f "$WORKSPACE_DIR/requirements.txt" ] && STACK_PARTS+=("Python (requirements.txt)")
[ -f "$WORKSPACE_DIR/pyproject.toml" ] && STACK_PARTS+=("Python (pyproject.toml)")
[ -f "$WORKSPACE_DIR/Cargo.toml" ] && STACK_PARTS+=("Rust (Cargo.toml)")
[ -f "$WORKSPACE_DIR/go.mod" ] && STACK_PARTS+=("Go (go.mod)")
[ -f "$WORKSPACE_DIR/Gemfile" ] && STACK_PARTS+=("Ruby (Gemfile)")
[ -f "$WORKSPACE_DIR/composer.json" ] && STACK_PARTS+=("PHP (composer.json)")
[ -f "$WORKSPACE_DIR/Dockerfile" ] && STACK_PARTS+=("Docker (Dockerfile)")
[ -f "$WORKSPACE_DIR/docker-compose.yml" ] && STACK_PARTS+=("Docker Compose")
[ -f "$WORKSPACE_DIR/docker-compose.yaml" ] && STACK_PARTS+=("Docker Compose")

if [ ${#STACK_PARTS[@]} -eq 0 ]; then
  STACK="indeterminado"
else
  STACK="$(IFS=" + "; echo "${STACK_PARTS[*]}")"
fi

# ==========================================================
# Coletar chaves de .env files (NUNCA valores)
# ==========================================================
ENV_KEYS_JSON="[]"
ENV_FILES=()
for envfile in .env .env.local .env.development .env.production .env.example; do
  if [ -f "$WORKSPACE_DIR/$envfile" ]; then
    ENV_FILES+=("$envfile")
  fi
done

if [ ${#ENV_FILES[@]} -gt 0 ]; then
  ENV_KEYS_JSON=$(
    for f in "${ENV_FILES[@]}"; do
      grep -E '^[A-Z_][A-Z0-9_]*=' "$WORKSPACE_DIR/$f" 2>/dev/null | sed -E 's/^([A-Z_][A-Z0-9_]*)=.*/\1/'
    done | sort -u | python3 -c "import sys, json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))"
  )
fi

ENV_FILES_JSON=$(printf '%s\n' "${ENV_FILES[@]}" | python3 -c "import sys, json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))")

# ==========================================================
# Extrair scripts de package.json (se existir)
# ==========================================================
PACKAGE_SCRIPTS_JSON="{}"
if [ -f "$WORKSPACE_DIR/package.json" ]; then
  PACKAGE_SCRIPTS_JSON=$(python3 -c "
import json, sys
try:
    with open('$WORKSPACE_DIR/package.json') as f:
        pkg = json.load(f)
    print(json.dumps(pkg.get('scripts', {}), ensure_ascii=False))
except Exception:
    print('{}')
" 2>/dev/null || echo '{}')
fi

# ==========================================================
# Extrair portas de docker-compose
# ==========================================================
DOCKER_PORTS_JSON="[]"
for compose in docker-compose.yml docker-compose.yaml docker-compose.prod.yml docker-compose.dev.yml; do
  if [ -f "$WORKSPACE_DIR/$compose" ]; then
    DOCKER_PORTS_JSON=$(python3 -c "
import re, json, sys
ports = set()
try:
    with open('$WORKSPACE_DIR/$compose') as f:
        content = f.read()
    for m in re.finditer(r'\"?(\d{2,5}):\d{2,5}\"?', content):
        ports.add(int(m.group(1)))
    print(json.dumps(sorted(list(ports))))
except Exception:
    print('[]')
" 2>/dev/null || echo '[]')
    break
  fi
done

# ==========================================================
# Git remote (REDACT credentials embedded in URL)
# ==========================================================
GIT_REMOTE=""
if [ -d "$WORKSPACE_DIR/.git" ]; then
  GIT_REMOTE=$(git -C "$WORKSPACE_DIR" remote get-url origin 2>/dev/null || echo "")
  # Redact embedded tokens/passwords: https://USER:TOKEN@host -> https://REDACTED@host
  # Cobre: gh* tokens, ghp_*, github_pat_*, generic user:pass
  GIT_REMOTE=$(echo "$GIT_REMOTE" | sed -E 's|://[^@/]+@|://REDACTED@|')
fi

# ==========================================================
# Emitir env-catalog.json (skeleton)
# ==========================================================
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

python3 <<EOF > "$SIDECAR_DIR/env-catalog.json"
import json
catalog = {
    "schema_version": "1.0.0",
    "project_name": "$PROJECT_NAME",
    "workspace_path": "$WORKSPACE_DIR",
    "project_path": "AUTO_PENDING",
    "stack": "$STACK",
    "deploy_mode": "AUTO_PENDING",
    "last_scan": "$TIMESTAMP",
    "scan_mode": "auto-skeleton",
    "auto_scan_version": "1.0.0",
    "environments": {
        "production": {
            "port": "AUTO_PENDING",
            "node_env": "production",
            "process_manager": "AUTO_PENDING",
            "tmux_prefix": "AUTO_PENDING",
            "startup_script": "AUTO_PENDING",
            "domain": "AUTO_PENDING",
            "env_vars": {},
            "env_vars_sensitive": []
        },
        "development": {
            "port": "AUTO_PENDING",
            "node_env": "development",
            "tmux_prefix": "AUTO_PENDING",
            "startup_script": "AUTO_PENDING",
            "env_vars": {}
        }
    },
    "isolation_matrix": "AUTO_PENDING",
    "warnings": [],
    "api_keys": {},
    "webhooks": [],
    "external_dependencies": {},
    "particularities": [],
    "co_located_services": [],
    "_auto_scan_findings": {
        "git_remote": "$GIT_REMOTE",
        "env_files_found": $ENV_FILES_JSON,
        "env_keys_detected": $ENV_KEYS_JSON,
        "package_scripts": $PACKAGE_SCRIPTS_JSON,
        "docker_compose_ports": $DOCKER_PORTS_JSON
    }
}
print(json.dumps(catalog, indent=2, ensure_ascii=False))
EOF

# ==========================================================
# Emitir config.md skeleton (apenas se nao existir)
# ==========================================================
if [ ! -f "$SIDECAR_DIR/config.md" ]; then
  cat > "$SIDECAR_DIR/config.md" <<EOF
# $PROJECT_NAME — Environment Config

> **Sidecar skeleton** gerado por auto-scan determinístico em $TIMESTAMP.
> **Operador**: enriqueça com particularidades via \`/tuninho-devops-env\` quando relevante.
> Este sidecar foi marcado com \`scan_mode: auto-skeleton\` no \`env-catalog.json\`.

## Auto-detectado

| Campo | Valor |
|-------|-------|
| **Stack** | $STACK |
| **Workspace** | $WORKSPACE_DIR |
| **Git remote** | ${GIT_REMOTE:-(nenhum)} |
| **Env files** | $(IFS=,; echo "${ENV_FILES[*]:-(nenhum)}") |

## Pendente de enriquecimento manual

- [ ] Porta de produção e desenvolvimento
- [ ] Process manager (PM2/systemd/docker/nenhum)
- [ ] Domain/URL público
- [ ] tmux prefix (se aplicável)
- [ ] Comando de startup dev
- [ ] Matriz de isolamento (recursos compartilhados entre prod/dev)
- [ ] Warnings ativos (ports compartilhados, env vars críticas, etc.)
- [ ] Particularidades de stack (build steps, ESM, bundler, etc.)

## Como enriquecer

\`\`\`
/tuninho-devops-env
\`\`\`

A skill guia o LLM a popular cada campo com base no contexto real do projeto.
EOF
fi

# ==========================================================
# Output
# ==========================================================
echo "ENV: scan auto-executado para '$PROJECT_NAME' — sidecar skeleton criado."
echo "Stack: $STACK"
echo "Path: $SIDECAR_DIR"
