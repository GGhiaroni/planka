# Tuninho DevOps Env v5.1.1

## v5.0.0 — DDCE_EXPANSIVO_MULTI_SESSOES integration (Card 1768281088850920655 — 2026-05-05)

**Bump canonico de toda ops-suite** absorvendo 4 Regras Inviolaveis novas do tuninho-ddce v4.20.0+:

- **#68** — Card mural canal espelhado equivalente em TODAS interacoes (nao so inputs).
  Operador pode escolher seguir pela sessao Claude OU pelo card mural — ambos canais
  devem ter as mesmas informacoes em tempo real (resumo de progresso, perguntas,
  aprovacoes, atualizacoes de status, blockers).

- **#69** — Modo DDCE_EXPANSIVO_MULTI_SESSOES + sub-etapa S1.6.5 Confirmacao Final
  pre-artefatos. Para operacoes complexas autorizadas pelo operador: 4 sessoes
  dedicadas (1 por fase DDCE: DISCOVER + DEFINE + EXECUTION + QA+FINAL). Cada sessao
  inteira saturada na fase atual maximiza profundidade. Handoff e checklist exclusivos
  por operacao em `cards/{cardId}_*/`. Sub-etapa S1.6.5 obrigatoria antes de produzir
  artefatos finais ou executar gate-guard-full Comlurb.

- **#70** — Modalidades LLM dual (SDK Claude Code assinatura vs OpenRouter API key)
  com contabilizacao petrea. SDK = usa cota assinatura, contabiliza tokens "como se"
  mas NAO bills via API. OpenRouter = paga por token via API real. Operacoes anteriores
  tiveram problemas confundindo as duas modalidades — esta regra documenta petreamente.

- **#71** — Branding tuninho.ai oficial. tu.ai eh APELIDO INTERNO/CARINHOSO apenas
  (operacoes/cards/comunicacao dev). Branding em UI/marketing/copy oficial = SEMPRE
  tuninho.ai. Razao raiz: tu.ai NAO eh nosso dominio.

### Por que v5.0.0 (independente da versao anterior)?

Operador autorizou explicitamente:
> *"info IMPORTANTE para toda skill que sofrer essa atualização o bump deverá ser 5.x.x
> independente de qual ela venha, para regularizar que é compativel com esse novo metodo
> a partir de agora."*

Razao: regularizar toda ops-suite num novo bloco de versionamento que sinaliza
compatibilidade com DDCE_EXPANSIVO_MULTI_SESSOES + as 4 regras novas.

### O que muda nesta skill especificamente

(detalhamento por-skill sera adicionado em proximas releases v5.0.x conforme uso real
das 4 regras evidenciar necessidades de adaptacao especifica para esta skill)

### Origem operacional

Card 1768281088850920655 "Estabilizacao Chat Tuninho.ai" — sessao 1 DISCOVER EXPANSIVO
(2026-05-05). Bump aplicado em batch a 15 skills + 3 hooks da ops-suite + remocao
da skill deprecated `tuninho-mandapr`. Cooperacao com tuninho-ddce v4.20.0+ que
formaliza Regras #68-#71 + sub-etapa S1.6.5.

### Backward compat

Operacoes em curso pre-v5.0.0 podem completar sem mudancas. v5.0.0 aplica daqui em
diante para alinhamento canonico. Sub-checks QA novos (audit-card-mirror-coverage,
audit-modality-tracking, audit-multi-session-handoff, audit-branding-tuninho-ai)
serao adicionados em tuninho-qa v5.x.x para validar conformidade.

---

# Tuninho DevOps Env v1.2.0

> **a4tunados-ops-suite** — Esta skill faz parte do pacote de operacoes a4tunados.
> Mantenha-a atualizada via `tuninho-updater`.

> Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Resolucao de Contexto do Projeto (OBRIGATORIA)

Antes de iniciar qualquer etapa operacional:

1. **Identificar projeto**: `git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||'`
2. **Verificar vault**: `_a4tunados/docs_{nome}/MOC-Projeto.md` — se existe, ler para contexto. Se nao, alertar operador para rodar escriba.
3. **Carregar sidecar** da skill (se existir em `projects/`)

> **REGRA DE OURO:** Nenhum conhecimento sobre o projeto deve ser priorizado para ficar na memoria do Claude Code. Toda informacao relevante deve residir nas skills, sidecars, ou vault. O vault do escriba e a FONTE PRINCIPAL.

---

## Missao

Tres pilares inviolaveis:

1. **CATALOGAR** — manter registro completo de todas as configuracoes de ambiente de cada projeto
2. **ISOLAR** — garantir que dev, staging e producao NUNCA compartilhem recursos conflitantes
3. **PREVENIR** — detectar e alertar sobre conflitos ANTES que causem problemas

---

## Contexto Operacional

Esta skill opera em qualquer servidor que hospede multiplos projetos ou ambientes.
O cenario mais critico e o **self-hosting**: quando a aplicacao esta sendo desenvolvida
no mesmo servidor onde roda em producao (ex: Tuninho IDE Web editando a si mesmo).

### Servidor Hostinger Alfa (referencia)

| Item | Valor |
|------|-------|
| **Nome** | hostinger-alfa |
| **Provider** | Hostinger VPS |
| **IP** | 31.97.243.191 |
| **Base path** | `/opt/hostinger-alfa/` |
| **OS** | Ubuntu 25.10 |
| **Node.js** | v22.22.0 |
| **PM2** | 6.0.14 |
| **Nginx** | 1.28.0 |
| **tmux** | 3.5a |

### Projetos Ativos

Carregar de `projects/server-inventory.json` no inicio de cada scan.

---

## PREFLIGHT — Express Check

> Protocolo padrao de verificacao de versao.

1. Verificar versao remota: `gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d`
2. Comparar com versao local (H1 deste arquivo: `v1.0.1`)
3. Se atualizacao disponivel: informar ao operador
4. Se curl/gh falhar: prosseguir silenciosamente

---

## Deteccao Bootstrap vs Incremental

### Modo Bootstrap (primeiro scan do projeto)
Ativado quando:
- NAO existe `projects/{projeto}/env-catalog.json`
- OU `env-catalog.json` nao tem o campo `project_name`

Neste modo: executa scan completo (Stage 1 inteiro) e cria catalogo do zero.

### Modo Incremental (scans subsequentes)
Ativado quando:
- `projects/{projeto}/env-catalog.json` existe e esta valido
- E `last_scan` tem menos de 24 horas

Neste modo: verifica se houve mudancas (portas novas, servicos novos), atualiza campos alterados.

### Modo Forcado
Quando o operador pede explicitamente "scan completo" ou "recatalogar": ignora cache e executa Bootstrap.

---

## Stage 0 — Detect + Decide

### 0.1 — Identificar projeto

Derivar nome do projeto a partir do `cwd`:

```bash
# Se estamos em um workspace
if [[ "$PWD" =~ /workspaces/([^/]+) ]]; then
  PROJECT_NAME="${BASH_REMATCH[1]}"
# Se estamos na raiz do projeto
else
  PROJECT_NAME=$(basename "$PWD")
fi
```

### 0.2 — Carregar catalogo existente

```bash
CATALOG_FILE=".claude/skills/tuninho-devops-env/projects/${PROJECT_NAME}/env-catalog.json"
if [ -f "$CATALOG_FILE" ]; then
  echo "Catalogo encontrado. Modo: Incremental"
else
  echo "Catalogo NAO encontrado. Modo: Bootstrap"
fi
```

### 0.3 — Detectar tipo de ambiente

```bash
# Self-hosting: dev dentro do servidor de producao
if [[ "$PWD" =~ ^/opt/hostinger-alfa/.*/workspaces/ ]]; then
  ENV_TYPE="self-hosting"
  echo "ATENCAO: Self-hosting detectado. Isolamento CRITICO."
# Servidor de producao (sem workspace)
elif [[ "$PWD" =~ ^/opt/ ]]; then
  ENV_TYPE="server-prod"
# Maquina local
else
  ENV_TYPE="local-dev"
fi
```

### 0.4 — Apresentar decisao

Exibir ao operador:
- Nome do projeto detectado
- Tipo de ambiente (self-hosting / server-prod / local-dev)
- Modo de scan (Bootstrap / Incremental / Forcado)
- Se Incremental: data do ultimo scan

---

## Stage 1 — Environment Scan

> Scan completo do ambiente. Cada sub-scan e independente e pode falhar sem afetar os outros.

### 1.1 — Process Scan

Identificar todos os servicos rodando no servidor.

```bash
# PM2 processes
pm2 jlist 2>/dev/null | python3 -c "import sys,json; [print(f'{p[\"name\"]}|{p[\"pm2_env\"][\"status\"]}|{p[\"pid\"]}') for p in json.load(sys.stdin)]"

# systemd services relevantes
systemctl list-units --type=service --state=running | grep -E "gunicorn|nginx|node|python"

# Todos os processos Node.js
ps aux | grep -E "node|next-server" | grep -v grep
```

### 1.2 — Port Scan

Mapear todas as portas em uso.

```bash
# Portas TCP escutando
ss -tlnp | grep LISTEN

# Portas ocupadas por cada servico
ss -tlnp | awk '/LISTEN/ {print $4, $6}' | sort -t: -k2 -n
```

### 1.3 — Nginx Scan

Mapear dominos, reverse proxies e SSL.

```bash
# Listar sites habilitados
ls -la /etc/nginx/sites-enabled/

# Extrair domain → port de cada config
for conf in /etc/nginx/sites-enabled/*; do
  domain=$(grep server_name "$conf" | head -1 | awk '{print $2}' | tr -d ';')
  port=$(grep proxy_pass "$conf" | head -1 | grep -oP ':\K\d+')
  echo "$domain → $port ($conf)"
done
```

### 1.4 — Database Scan

Encontrar bancos de dados e seus caminhos.

```bash
# SQLite databases
find /opt/hostinger-alfa/ -name "*.db" -not -path "*/node_modules/*" 2>/dev/null

# Prisma schemas (indica uso de ORM)
find /opt/hostinger-alfa/ -name "schema.prisma" -not -path "*/node_modules/*" 2>/dev/null

# .env com DATABASE_URL
grep -r "DATABASE_URL" /opt/hostinger-alfa/*/. --include=".env*" 2>/dev/null
```

### 1.5 — Environment Variables

Coletar env vars de todas as fontes.

```bash
# ecosystem.config.cjs / ecosystem.config.js
find /opt/hostinger-alfa/ -name "ecosystem.config.*" -not -path "*/node_modules/*" 2>/dev/null

# .env files
find /opt/hostinger-alfa/ -name ".env*" -not -path "*/node_modules/*" -not -name ".env.example" 2>/dev/null

# dev.sh scripts
find /opt/hostinger-alfa/ -name "dev.sh" -not -path "*/node_modules/*" 2>/dev/null

# process.env references no codigo
grep -r "process\.env\." server.js server/*.js 2>/dev/null | grep -oP 'process\.env\.\K\w+' | sort -u
```

### 1.6 — tmux/Session Prefixes

Identificar prefixos de sessao tmux em uso.

```bash
# Sessoes tmux ativas
tmux list-sessions 2>/dev/null

# Prefixos unicos
tmux list-sessions -F "#{session_name}" 2>/dev/null | sed 's/_[0-9]*_.*//' | sort -u

# Prefixos configurados no codigo
grep -r "SESSION_PREFIX\|tuninho_\|tundev_" server/ dev.sh 2>/dev/null
```

### 1.7 — SSL/TLS Scan

Listar certificados e validades.

```bash
# Certificados Let's Encrypt
certbot certificates 2>/dev/null

# Ou manualmente
for cert in /etc/letsencrypt/live/*/; do
  domain=$(basename "$cert")
  expiry=$(openssl x509 -enddate -noout -in "${cert}fullchain.pem" 2>/dev/null | cut -d= -f2)
  echo "$domain expires $expiry"
done
```

### 1.8 — External Dependencies

Versoes de ferramentas criticas.

```bash
node --version 2>/dev/null
npm --version 2>/dev/null
pm2 --version 2>/dev/null
tmux -V 2>/dev/null
nginx -v 2>&1
python3 --version 2>/dev/null
claude --version 2>/dev/null
```

### 1.9 — API Keys & Webhooks

Identificar credenciais e integracoes externas.

```bash
# OAuth configs
find /opt/hostinger-alfa/ -name ".github-oauth" -o -name ".oauth-*" 2>/dev/null

# JWT secrets
find /opt/hostinger-alfa/ -name ".jwt-secret" -o -name "*.secret" 2>/dev/null

# Webhook URLs em configs
grep -ri "webhook\|callback.*url\|GITHUB_CLIENT" /opt/hostinger-alfa/*/. --include=".env*" --include="*.json" 2>/dev/null | grep -v node_modules
```

---

## Stage 2 — Catalog Write

### 2.1 — Gerar env-catalog.json

Escrever o catalogo completo em `projects/{projeto}/env-catalog.json` com o schema:

```json
{
  "schema_version": "1.0.0",
  "project_name": "{nome}",
  "project_path": "{path absoluto prod}",
  "workspace_path": "{path workspace se existir}",
  "stack": "{descricao da stack}",
  "last_scan": "{ISO-8601}",
  "scan_mode": "bootstrap|incremental",
  "environments": {
    "production": {
      "port": 0,
      "node_env": "production",
      "process_manager": "pm2|systemd|manual",
      "pm2_service": "{nome}",
      "tmux_prefix": "{prefix}_",
      "cdp_port_start": 0,
      "db_path": "{path}",
      "db_engine": "{sqlite|prisma|etc}",
      "domain": "{domain}",
      "nginx_config": "{path}",
      "ssl": { "status": "active|none", "expiry": "{date}" },
      "health_endpoint": "http://localhost:{port}/",
      "env_vars": { "VAR": "value_or_placeholder" },
      "env_vars_sensitive": ["VAR1", "VAR2"],
      "data_dirs": ["data/"],
      "log_dirs": ["logs/"],
      "startup_config": "{ecosystem.config path}"
    },
    "development": {
      "port": 0,
      "node_env": "development",
      "tmux_prefix": "{prefix}_",
      "cdp_port_start": 0,
      "db_path": "{path relativo}",
      "startup_script": "dev.sh",
      "env_vars": { "VAR": "value" }
    }
  },
  "isolation_matrix": {
    "ports": { "http": { "prod": 0, "dev": 0 } },
    "tmux": { "prefix": { "prod": "{}_", "dev": "{}_" } },
    "database": { "path": { "prod": "{}", "dev": "{}" } },
    "shared_state_risks": []
  },
  "api_keys": {},
  "webhooks": [],
  "external_dependencies": {}
}
```

### 2.2 — Gerar config.md (human-readable)

Criar sidecar Markdown com resumo visual:

```markdown
# {Projeto} — Environment Config

## Produção
- **Porta**: {port}
- **Domínio**: {domain}
- **PM2**: {service}
...

## Desenvolvimento
- **Porta**: {port}
- **Startup**: `bash dev.sh`
...

## Matriz de Isolamento
| Recurso | Produção | Dev |
|---------|----------|-----|
| Porta   | {x}      | {y} |
...
```

### 2.3 — Validar schema

```bash
python3 -c "import json; d=json.load(open('env-catalog.json')); assert d.get('schema_version'); print('OK')"
```

---

## Stage 3 — Isolation Report

Apresentar ao operador uma matriz clara de isolamento:

```
╔══════════════════════════════════════════════════════════════╗
║          ISOLATION REPORT — {PROJETO}                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Recurso          │ Producao        │ Desenvolvimento        ║
║  ─────────────────┼─────────────────┼───────────────────     ║
║  Porta HTTP       │ 3847            │ 3848                   ║
║  tmux prefix      │ tuninho_        │ tundev_                ║
║  CDP ports        │ 9222+           │ 19222+                 ║
║  Database         │ /opt/.../data/  │ workspace/data/        ║
║  PM2              │ tuninho-ide-web │ N/A (node direto)      ║
║  Domain           │ tuninhoideweb...│ localhost               ║
║                                                              ║
║  ⚠ RISCOS DE ESTADO COMPARTILHADO:                          ║
║  - GitHub OAuth credentials (copiado de prod)                ║
║  - Claude CLI (instalacao global compartilhada)              ║
║                                                              ║
║  ✓ STARTUP DEV: bash dev.sh                                  ║
║  ✗ NUNCA: node server.js (usa defaults de prod)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Se houver conflitos detectados (mesma porta, mesmo prefix), ALERTAR com destaque vermelho.

---

## Stage 4 — Cross-Project Sync

### 4.1 — Atualizar server-inventory.json

Consolidar dados de TODOS os projetos no servidor:

```json
{
  "schema_version": "1.0.0",
  "server_name": "hostinger-alfa",
  "server_ip": "31.97.243.191",
  "last_scan": "ISO-8601",
  "projects": { ... },
  "port_registry": { "porta": "servico", ... },
  "next_available_port": 3850,
  "port_ranges": {
    "http_services": "3000-3999",
    "cdp_prod": "9222-9299",
    "cdp_dev": "19222-19299"
  }
}
```

### 4.2 — Detectar conflitos cross-project

Verificar:
- Nenhuma porta duplicada entre projetos
- Nenhum dominio duplicado
- Nenhum servico PM2 com mesmo nome
- tmux prefixes unicos

Se conflito detectado: reportar imediatamente com sugestao de correcao.

---

## Auto-Invocacao via Hook

O hook `tuninho-hook-inicio-sessao.py` (v4.1.0+) verifica automaticamente:

1. Se a skill `tuninho-devops-env` esta instalada no projeto
2. Se existe catalogo para o projeto atual
3. Injeta contexto resumido no inicio de cada sessao:
   - Se catalogo NAO existe: sugere executar scan
   - Se catalogo existe e esta fresco: injeta one-liner com portas e prefixes
   - Se catalogo esta stale (>24h): sugere atualizar

**A partir de v5.1.0 (hook v4.7.0+)**: quando o catalogo e missing/stale/corrupt, o
hook **invoca o auto-scan deterministico** (`scripts/auto-scan.sh`) antes de avisar.
Ver secao "Auto-Scan Deterministico" abaixo.

---

## Auto-Scan Deterministico (v5.1.0+)

`scripts/auto-scan.sh` cria sidecar SKELETON sem invocar LLM, em <3 segundos.
Complementa (nao substitui) o scan completo guiado pela skill.

### Quando roda

- **Automatico**: chamado pelo `tuninho-hook-inicio-sessao` quando detecta `env-catalog.json`
  missing, corrupted ou idade > 24h.
- **Manual**: operador pode rodar diretamente: `bash .claude/skills/tuninho-devops-env/scripts/auto-scan.sh`.

### O que detecta

| Item | Como |
|------|------|
| `project_name` | Mesma derivacao do hook (path, basename) |
| `stack` | Presença de arquivos: `package.json` (Node), `requirements.txt`/`pyproject.toml` (Python), `Cargo.toml` (Rust), `go.mod` (Go), `Gemfile` (Ruby), `composer.json` (PHP), `Dockerfile`, `docker-compose.yml` |
| Env keys | Le `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.example` e extrai **CHAVES** (NUNCA valores) |
| `package_scripts` | `scripts.{dev,start,build,...}` de `package.json` |
| `docker_compose_ports` | Portas mapeadas (`HOST:CONTAINER`) em `docker-compose*.yml` |
| `git_remote` | URL de `git remote get-url origin` |

### Limitacoes

O auto-scan **NUNCA** captura:
- Valores de env vars (apenas chaves) — segurança
- Estado runtime (PM2 services, ports em uso, processos rodando)
- Domain/URL público
- Particularidades do projeto (warnings, isolation matrix, co-located services)

Tudo isso fica como `"AUTO_PENDING"` no `env-catalog.json` e o `config.md` lista o que o operador precisa enriquecer com `/tuninho-devops-env`.

### Marcacao no JSON

```json
{
  "schema_version": "1.0.0",
  "scan_mode": "auto-skeleton",
  "auto_scan_version": "1.0.0",
  "_auto_scan_findings": { ... }
}
```

`scan_mode: "auto-skeleton"` permite que o `audit-version-coherence` do `tuninho-qa`
diferencie sidecars skeleton (precisam enriquecimento) de sidecars manuais
(`bootstrap`/`manual`).

### Failsafe

- Timeout de 10s no hook. Se o script demora mais, hook cai no warning original.
- Se script ausente ou nao-executavel: hook usa o warning original.
- Se script erra (exit != 0): hook usa o warning original.
- Hook **nunca quebra a sessao** — falhas silenciam, comportamento pre-v5.1.0 e preservado como fallback.

---

## Atualizacao Automatica do Catalogo

O catalogo deve ser atualizado quando:

1. **Novo deploy** — apos `tuninho-devops-hostinger-alfa` completar deploy
2. **Nova env var** — quando qualquer operacao adicionar/modificar env var
3. **Novo projeto no servidor** — detectado via `pm2 list` ou `ss -tlnp`
4. **Manualmente** — quando operador invocar `/tuninho-devops-env`
5. **Stale check** — hook detecta catalogo com mais de 24h

Para integracoes futuras (v1.1.0+): devops-hostinger-alfa pode chamar devops-env apos Stage 8 (pos-deploy) para atualizar o catalogo automaticamente.

---

## Regras Criticas

1. **NUNCA armazenar valores de secrets** — catalogar apenas nomes de variaveis (ex: `JWT_SECRET: "[auto-generated]"`, nunca o valor real)
2. **NUNCA modificar o ambiente** — esta skill SOMENTE LE e cataloga. Modificacoes sao responsabilidade das skills de devops
3. **SEMPRE validar JSON** antes de escrever — catalogo corrompido e pior que inexistente
4. **SEMPRE manter server-inventory.json** atualizado com TODOS os projetos, mesmo os que nao tem catalogo detalhado
5. **NUNCA assumir portas livres** — sempre verificar via `ss -tlnp` antes de sugerir
6. **SEMPRE recomendar dev.sh** (ou equivalente) para rodar dev — nunca `node server.js` direto que usa defaults de producao
7. **OBRIGATORIO** incluir `isolation_matrix` em todo catalogo — e a secao mais critica
8. **NUNCA sincronizar sidecars** via updater — catalogos sao locais por projeto/servidor (analogia: devops-hostinger-alfa usa `has_sidecar: true, sidecar_dir: "projects"`)

---

## Tratamento de Erros

| Erro | Diagnostico | Solucao |
|------|-------------|---------|
| `pm2 jlist` falha | PM2 nao instalado ou sem processos | Usar `ps aux` como fallback |
| `ss -tlnp` permission denied | Falta sudo | Tentar `ss -tln` (sem -p) |
| `certbot certificates` falha | certbot nao instalado | Verificar certs manualmente em `/etc/letsencrypt/` |
| JSON parse error no catalogo | Catalogo corrompido | Renomear para `.bak`, executar Bootstrap |
| Porta conflitante detectada | Dois servicos na mesma porta | Alertar operador, NAO tentar corrigir |
| Projeto nao identificado | cwd ambiguo | Perguntar ao operador |

---

## Gotchas por Ambiente (v1.1.0)

Conhecimento persistente sobre pegadinhas especificas de orgs, servidores e
ambientes que afetam o scan ou warnings a emitir. Adicionado por Op 03 go-live
do tuninho.ai (L3.1, L3.2).

### GCP Org `4tuna.com.br` — Firebase Service Account Keys bloqueadas

**Problema**: ao gerar service account JSON em qualquer projeto Firebase sob a
org `4tuna.com.br`, a geracao falha com policy violation mesmo apos desativar
a policy no nivel do projeto.

**Causa**: ha DUAS Org Policies que precisam estar desativadas simultaneamente:

1. `iam.managed.disableServiceAccountApiKeyCreation` (policy atual, projeto)
2. `iam.disableServiceAccountKeyCreation` (policy **legada no nivel da ORG**
   `4tuna.com.br`)

A policy legada sobrescreve a do projeto — por isso mesmo apos desativar no
projeto, a geracao continua bloqueada. A policy de org precisa ser desativada
temporariamente, gerar o JSON, e entao ser reativada.

**Escopo**: afeta TODOS os projetos Firebase sob a org `4tuna.com.br`.

**Como `tuninho-devops-env` aplica**: ao detectar no scan qualquer
`NEXT_PUBLIC_FIREBASE_PROJECT_ID` ou referencia a Firebase Admin SDK, emitir
warning na `config.md` gerada:

> **Warning GCP-ORG-1**: Este projeto usa Firebase. Se for gerar service
> account JSON pela primeira vez, verifique que AMBAS as policies estejam
> desativadas (projeto + org legada). Ver _a4tunados/memory ou pendency-ledger
> do projeto 03_go-live tuninho.ai para reproducao.

### SHELL-PORT-1 — Shell `PORT` colide com `.env*` PORT (v1.2.0, L2.2 Op 05)

**Sintoma**: `npm run dev` tenta subir na porta errada (ex: 3847) mesmo
com `PORT=3000` em `.env.local` — retorna `EADDRINUSE`. Motivo: Next.js
dev reads `process.env.PORT` do shell **antes** de `.env.local` ser
processado, entao o valor do shell vence.

**Contexto onde aparece**: workspaces compartilhados com Claude Code
onde o IDE host (ex: tuninho-ide-web) exporta `PORT=3847` no ambiente
pai. Todas sessoes Claude filhas herdam esse PORT.

**Detecao no scan** (tuninho-devops-env v1.2.0):
```bash
SHELL_PORT="${PORT:-}"
ENV_PORT=$(grep -E "^PORT=" .env.local 2>/dev/null | cut -d= -f2 | head -1)
ENV_PROD_PORT=$(grep -E "^PORT=" .env.production 2>/dev/null | cut -d= -f2 | head -1)
if [ -n "$SHELL_PORT" ] && [ -n "$ENV_PORT" ] && [ "$SHELL_PORT" != "$ENV_PORT" ]; then
  echo "[SHELL-PORT-1] WARN: shell PORT=$SHELL_PORT colide com .env.local PORT=$ENV_PORT"
  echo "                     Use 'next dev -p $ENV_PORT' explicito em scripts/dev.sh"
fi
```

**Registro no catalogo**: campo `env_vars.shell_port_mismatch: true` no
env-catalog.json, alem de adicionar warning `SHELL-PORT-1` na lista de
avisos. Quando hook de inicio-sessao le o catalogo, exibe o warning
junto dos outros gotchas.

**Mitigacao nos scripts de startup**:
- Criar `scripts/dev.sh` com `exec npx next dev -p ${PORT_OVERRIDE:-3000}`
  (respeita override explicito se o operador quiser outra porta).
- Adicionar nota em CLAUDE.md do projeto: "Use `npm run dev` via
  `scripts/dev.sh` — shell env pode ter PORT conflitante do IDE host."

### NODE_ENV=production herdado da sessao Claude Code

**Problema**: `npm install` em workspace de dev silenciosamente pula
devDependencies (typescript, esbuild, tailwind, etc) porque o shell da sessao
Claude Code tem `NODE_ENV=production` setado globalmente.

**Causa**: `npm` respeita `npm config get omit` que por sua vez respeita
`NODE_ENV=production` → equivale a `--omit=dev`. Sem sinal de erro — o
install completa, mas ao tentar rodar `npx tsc` depois quebra com
"Cannot find module typescript".

**Workarounds possiveis**:

- Em-linha (preferido): `NODE_ENV=development npm install --include=dev`
  OR `env -u NODE_ENV npm install --include=dev`
- Permanente na sessao: `npm config set omit false` (invasivo, afeta outros projetos)
- Sidecar deploy: registrar workaround no `config.md` do sidecar hostinger

**Como `tuninho-devops-env` aplica**: durante `1.5 — Environment Variables`
scan, se detectar `NODE_ENV=production` em workspace **de dev** (nao prod),
emitir warning:

> **Warning NODE-ENV-1**: Sessao tem `NODE_ENV=production` setado globalmente.
> `npm install` neste workspace pode silenciosamente pular devDependencies.
> Use `env -u NODE_ENV npm install --include=dev` ou prefixe com
> `NODE_ENV=development`.

---

## Versionamento

### Convencao (identica ao ops-suite)

- **Patch** (0.0.x): Ajustes de texto, fix de scan commands
- **Minor** (0.x.0): Novo tipo de scan, novo campo no schema, nova integracao
- **Major** (x.0.0): Mudanca breaking no schema do catalogo

### Historico

| Versao | Data | Descricao |
|--------|------|-----------|
| 5.1.1 | 2026-05-06 | **PATCH SECURITY** — `auto-scan.sh` agora redact credenciais embutidas em git remote URLs (`https://USER:TOKEN@host` → `https://REDACTED@host`). Detectado em smoke test no projeto `planka`: token `gho_*` do GitHub apareceu no `env-catalog.json` gerado. Aplicado fix com `sed -E 's\|://[^@/]+@\|://REDACTED@\|'` que cobre: tokens `gho_*`, `ghp_*`, `github_pat_*`, e user:pass genericos. Sidecars locais existentes precisam ser sanitizados manualmente — proximas execucoes ja serao seguras. |
| 5.1.0 | 2026-05-06 | **Auto-scan deterministico** (`scripts/auto-scan.sh`). Quando `tuninho-hook-inicio-sessao` detecta `env-catalog.json` missing/stale/corrupt, invoca este script (timeout 10s) que cria sidecar SKELETON sem LLM. Detecta: stack via arquivos (package.json, requirements.txt, Cargo.toml, go.mod, Dockerfile, docker-compose), CHAVES de `.env*` files (NUNCA valores — segurança), `package.json` scripts, portas docker-compose, git remote. Marca `scan_mode: "auto-skeleton"` para diferenciar de bootstrap manual. Operador enriquece com particularidades reais via `/tuninho-devops-env` quando relevante. Resolve recorrencia do warning "Catalogo NAO encontrado" em projetos novos sem requerer intervencao manual a cada sessao. |
| 1.2.0 | 2026-04-23 | Detecao `SHELL-PORT-1` — shell `PORT` colide com `.env*` PORT (L2.2 Op 05 Fase 2). Warning `SHELL-PORT-1` emitido no scan quando `$PORT` do shell != PORT em `.env.local`/`.env.production`. Registra campo `env_vars.shell_port_mismatch: true` no env-catalog.json. Contexto onde bate: workspaces Claude Code filhos de IDE host com PORT exportado. Incorpora aprendizado Op 05 (PEND-OP05-005 via tuninho-updater push). |
| 1.1.0 | 2026-04-22 | Secao "Gotchas por Ambiente" (L3.1 GCP org policies 4tuna.com.br + L3.2 NODE_ENV=production pula devDeps). Warnings GCP-ORG-1 e NODE-ENV-1 emitidos durante scan. Incorpora aprendizados da Op 03 go-live tuninho.ai (PEND-03-005). |
| 1.0.1 | 2026-04-05 | Ajustes de deteccao incremental |
| 1.0.0 | 2026-04-03 | Release inicial. 9 sub-scans, catalogo JSON, server inventory, hook integration |

---

*Tuninho DevOps Env v5.1.1 — a4tunados-ops-suite | Auto-scan deterministico + Gotchas GCP-ORG-1 + NODE-ENV-1 + SHELL-PORT-1 (L3.1/L3.2 Op 03 + L2.2 Op 05)*
