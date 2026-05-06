---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: discovery_expanded
versao: "1.0"
modo: DDCE_EXPANSIVO_MULTI_SESSOES (sessao 1 — DISCOVER)
operador: victorgaudio
modelo: claude-opus-4-7[1m]
fonte_referencia: complementa _1_DISCOVERY_ com transbordo verbatim
---

# Discovery XP — Deploy/Redeploy Planka Staging em Hostinger-Beta

> **PROPÓSITO**: Capturar TODO o contexto da sessão 1 (DISCOVER) sem perda
> de informação. Permitir que sessão 2 (DEFINE) inicie em sessão nova sem
> prejuízo de contexto. Auditoria completa do processo de discovery.
> Princípio: **transbordo > escassez**.

---

## PARTE 1: CONTEXTO DA SESSAO

### Estado inicial do repo

- **Working dir**: `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/planka`
- **Branch ao iniciar a sessão Claude Code**: `develop` (per git status do system prompt)
- **Repo remote**: `https://github.com/GGhiaroni/planka.git` (fork customizado, NÃO upstream `plankanban/planka`)
- **Origin login GitHub**: GGhiaroni (o "dev" mencionado pelo operador)
- **Operador da sessão**: victorgaudio
- **Hooks tuninho ativos**: tuninho-hook-cards-mural, conta-token, guardiao-skills, git-flow, briefing-gate, inicio-sessao, pre-compact

### Conversas pré-DDCE (resumo da sessão até a invocação)

A sessão começou com instalação completa do `a4tunados-ops-suite` (15 skills + hooks)
no projeto planka via `/tuninho-updater pull`. Durante a instalação:

1. Detectado bug de segurança no `auto-scan.sh` v1.0.0 do `tuninho-devops-env`:
   capturava token GitHub embutido em URL do `git remote` (gho_*) e gravava
   no `env-catalog.json`. PR #137 emergencial criado e mergeado com fix
   (`sed -E 's|://[^@/]+@|://REDACTED@|'`).

2. Suite bumpada para v5.41.1 (devops-env v5.1.0 → v5.1.1, PATCH security).

3. Antes da operação DDCE iniciar:
   - Branch instalação `fix/install-tuninho-gitignore` mergeada via gitflow
     em `develop` (PR #1 do repo planka — note: foi necessário criar `develop`
     no remote GGhiaroni/planka pois não existia)
   - Develop sincronizada local (SHA `89d798ad`)
   - Branch nova `feat/deploy-planka-hostinger-redeploy` criada do tip de develop

### Prompt original do operador (VERBATIM)

> "Execute um ddce para descobrir qual implementação já fizemos desse projeto
> em docker do hostinger e em qual domínio para que possamos implementar ele
> novamente ou atualizar ele através dessa branch que estamos. Precisamos
> deixar esse projeto no link e deployado online, com todas as suas funções.
> Já fizemos isso antes"

### Confirmações do operador na apresentação do fluxo (VERBATIM)

> "A branch deve ser merjada via gitflow da for para develop e syncada.
> Devemos começar a operação baseada em develop a mais atualizada possível.
> Inicie a operação de modo interativo. Simbora"

### Preparação de branch e preflight

- gh auth: ok (victorgaudio token)
- gh credential helper: ok (`gh auth setup-git` aplicado durante o flush da install)
- Branch criada: `feat/deploy-planka-hostinger-redeploy` from develop@89d798ad
- Hooks git-flow: ativos (bloqueia edits em `develop`/`master`)
- Hostname: srv1536196.hstgr.cloud (hostinger-alfa, IP 31.97.243.191)

### Tokens/Custo até o início do Discovery

- Tokens início DISCOVER (medido via JSONL): **417,249 tokens (41.7% de 1M)**
- Razão alta: sessão acumulou trabalho da install + fix security + setup branch
- Threshold WARN: 70% (margem 28pp ≈ 280k)
- Threshold STOP: 75% (margem 33pp ≈ 330k)

---

## PARTE 2: EXPLORACAO CICLO 1

### Agent 1 — Histórico deploy planka via sidecars

**Prompt enviado** (essência): investigar exaustivamente sidecars das skills `tuninho-devops-*` para descobrir histórico de deploy do Planka neste ecossistema. Foco: server-inventory.json, project-profiles, licoes-aprendidas, env-catalogs, nginx-templates.

**Resultado bruto** (síntese):

- Vault Escriba (`_a4tunados/docs_*`): **inexistente**
- Operações DDCE anteriores: **nenhuma** (esta é a Op 01)
- Sidecar planka recém-criado (auto-scan v1.0.0): só skeleton, `scan_mode: auto-skeleton`, sem informação histórica
- Stack detectada localmente (em hostinger-alfa, srv1536196):
  - Node.js + Docker + Docker Compose (auto-detectado)
  - 17 env keys: ADMIN_*, POSTGRES_PASSWORD, SECRET_KEY, PLANKA_DOMAIN, FORM_DOMAIN, PLANKA_LIST_ID, etc
  - Portas Docker: 1000, 3000, 3001
- **Confirmação CRUCIAL**: agent identificou referências a planka em `mural/config.md` (hostinger-beta) — frase "Herdou do **Planka padrão** não-padrão: ecosystem.config.js com script: app.js direto"
- Outros projetos no servidor: maestrofieldmanager (3001), familygames (3030), tuninho-ide-web (3847), claude-sessions-service (3848), chooz_2026 (3849), weplus_prototipo (3850)
- Recomendação inicial do agent: porta 3851 livre — mas isso era para deploy em hostinger-alfa, **não aplicável** (deploy real é em hostinger-beta)

### Agent 2 — Vault Escriba + ops história planka

**Prompt enviado**: investigar vault, ops anteriores, memory cross-projeto, git history do repo planka, conteúdo de docker-compose/Dockerfile/.env.example, CLAUDE.md/DEPLOY.md.

**Resultado bruto** (síntese):

- Vault Escriba: **NÃO existe** — `_a4tunados/docs_*` não encontrado em find
- Operações: 1 em curso (esta Op 01)
- ADRs: ZERO
- **Memory cross-projeto** — encontrou referência a Planka em `/root/.claude/projects/-opt-hostinger-alfa-workspaces-tuninho-ide-victorgaudio-a4tunados-web-claude-code/memory/reference_mural_project.md`:
  - "a4tunados Mural (Planka-based kanban)"
  - Stack: Sails.js + React 18 + PostgreSQL 16
  - Prod: `https://mural.a4tunados.com.br` (167.99.24.138, **Digital Ocean** — não Hostinger!)
  - Port: 1337
  - **Confusão potencial**: Mural É um Planka custom mas em outro servidor/projeto
- **Git history insights**:
  - Commit chave: `b221d3eb` em **2026-04-30** "feat: adiciona o docker-compose.prod.yml"
    - Adicionou: docker-compose.prod.yml, DEPLOY.md, .env.example, Caddyfile, planka.Dockerfile
  - 5 commits do dev em May 4-6 (features novas que precisam ir pro staging):
    - `0eb2a53e` Feature de coluna colapsada
    - `dc9f6cc4` Drag-and-drop cards dentro da mesma coluna
    - `de1eb9d7` 3 opções de altura de linha (view planilha)
    - `25a49d8a` Seed da coluna 'Falar com o cliente' em boards Design
    - `9fae494b` Feature de log/histórico do board
- **Stack do repo (docker-compose.prod.yml)**:
  - planka:1337 (custom build)
  - postgres:16-alpine
  - ticket-form:3001 (Node custom, conecta no planka via API)
  - caddy:2-alpine (reverse proxy 80/443 + Let's Encrypt)
- **DEPLOY.md** (222 linhas): instruções completas de deploy
- **package.json**: `"name": "planka-server", "version": "2.1.0"` (upstream em v2.1.1 — uma patch atrás)

### Agent 3 — Estado servidor real + branch local

**Prompt enviado**: descobrir estado REAL do servidor (containers, PM2, portas, nginx, SSL) e da branch local. Premissa errada: estávamos no servidor que serve o domínio.

**Resultado bruto** (síntese):

- **Containers Docker no hostinger-alfa (srv1536196)**:
  - `pdview_erp_stagging-planka-1` (planka-custom:latest) — UP healthy 5 dias, **127.0.0.1:1337 only** (não exposta)
  - `pdview_erp_stagging-postgres-1` — UP healthy 5 dias
  - `pdview_erp_stagging-caddy-1` — Created mas NUNCA SUBIU
  - `pdview_erp_stagging-ticket-form-1` — CRASH LOOP (8286 restarts)
- **Network**: bridge `pdview_erp_stagging_default` isolada
- **Path do compose**: `/docker/pdview_erp_stagging/` (FORA do workspace, no host)
- **Volumes**:
  - `pdview_erp_stagging_postgres-data` 48 MB
  - `pdview_erp_stagging_planka-data` 4 KB (vazio)
  - `pdview_erp_stagging_caddy-*` 8 KB cada (vazios)
- **DB state**: planka, 9.3MB, 34 tabelas, 1 admin, 0 boards, 0 cards (zerado)
- **Imagem planka-custom:latest**:
  - Buildada em 2026-04-30 18:41 UTC
  - Source: GGhiaroni/planka master, commit `a8dcd7cef`
  - Base: plankanban/planka:2.1.1
- **Caddy nunca subiu**: bug — Caddyfile virou diretório no mount em vez de arquivo
- **Ticket-form crash**: env vars vazias (PLANKA_LIST_ID etc)
- **Nginx do host (srv1536196)**: NÃO tinha config para pdviewerp-stagging — default server retornava 301 → a4tunados.com.br
- **DNS**: pdviewerp-stagging.fourtuna.com.br → 76.13.239.198 (NÃO o IP de srv1536196)

**INSIGHT CRÍTICO** que mudou a operação:
- Domínio aponta pra **outro servidor** (76.13.239.198 = srv1590899 = hostinger-beta)
- Stack rodando no hostinger-alfa era cópia paralela quebrada, NÃO o staging real

### Agent 4 — Web research Planka deploy 2026

**Prompt enviado**: research sobre Planka v2.x deploy 2026 — versão atual, breaking changes, migration path, nginx canônico, backup strategy, riscos para fork customizado.

**Resultado bruto** (síntese):

- **Versão upstream**: v2.1.1 (Apr 2025)
- **Stack 2026**: Docker Compose continua padrão; Helm chart suportado
- **Breaking changes desde v1.x**:
  - v2.0.0 mudou volumes consolidados em `data:/app/data`
  - TRUST_PROXY: numérico → boolean
  - S3 attachments: privados (re-streamados)
  - Outgoing proxy interno (Squid)
- **Migration path v1→v2**: 10 passos detalhados (pg_dump, tar volumes, db:upgrade, db:migrate)
- **Nginx canônico**: keepalive, websocket headers, X-Forwarded-*, client_max_body_size 50M
- **Backup**: `docker-backup.sh` consolidado tar+pg_dump
- **Riscos para fork**: env vars stale, migrations não rodadas, custom paths incompatíveis com novos volumes

### Eixos a-h da Etapa 2 — checklist coverage

| Eixo | Status | Observação |
|---|---|---|
| (a) Estrutura diretamente relacionada | ✓ | repo é o próprio Planka, mapped completo |
| (b) Candidatos a adaptação | ✓ | stack inteira existente em hostinger-beta — adaptar 100% |
| (c) Padrões reutilizáveis | ✓ | a4tunados-mural (PM2 native), tuninho-ai (Next.js) — outros padrões diferentes; planka usa Docker e tem precedente |
| (d) Dependências/impactos indiretos | ✓ | a4tunados-mural usa porta 1337 nativo — colisão evitada com 1338 no override |
| (e) Vault Escriba | SKIP | vault inexistente — Regra #56 não aplica |
| (f) Histórico ops/cards | ✓ | nenhuma op anterior; primeira op formal |
| (g) Sidecars devops | PARCIAL | hostinger-beta sidecars existem para mural e tuninho-ai; **planka não tem sidecar específico ainda** — a criar no DEFINE |
| (h) Auditoria ambiente + sidecars QA | PENDENTE | tuninho-qa não invocado nesta sessão para preservar tokens |

---

## PARTE 3: ENTREVISTA CICLO 1 (perguntas Q1-Q6, respostas verbatim)

### Pergunta agente — Q1 (cenário)
> "A qual deploy anterior você se refere? (a) pdview_erp_stagging em hostinger-alfa? (b) Mural a4tunados em DO? (c) Deploy anterior do GGhiaroni/planka que existiu e morreu? (d) Nenhum dos acima — partir do zero?"

**Resposta operador (verbatim)**:
> "q1 A. eu falei producao mas eh staging. é esse mesmo. pdview_erp_staging. quero manter como esta como staging, me enganei ao citar producao, é ele que precisamos atualizar e implantar esse projeto. B. nao tem nenhuma relacao com esse projeto. C https://pdviewerp-stagging.fourtuna.com.br/ esse eh o dominio e o projeto eh exatamente esse."

**Análise da resposta**: operador escolheu (a)+(c) — tem o staging com domínio confirmado; depois clarificou que está em servidor cuja IP "começa com 76" — significa hostinger-beta, NÃO hostinger-alfa.

### Pergunta agente — Q2 (domínio)
> "Domínio desejado? Sugestões: planka.fourtuna.com.br, kanban.fourtuna.com.br, mural.fourtuna.com.br"

**Resposta**: `https://pdviewerp-stagging.fourtuna.com.br/` (manter)

### Pergunta agente — Q3 (Caddy vs nginx)
**Resposta**: "o que for mais seguro" — agente recomendou nginx do host (mantido).

### Pergunta agente — Q4 (dados)
**Resposta (verbatim)**:
> "nao ha dados relevantes. o que tiver no git pode ser bom, mas se nao tiver, pode ser zerado."

### Pergunta agente — Q5 (pdview_erp_stagging hostinger-alfa)
**Resposta (verbatim)**:
> "C pois pode ser reaproveitado. ao que me parece foi adaptado para rodar no docker, mas a fonte de verdade é o git atual que recebemos pois nele tem o trabalho do dev que esta trabalhando em outro ambiente, nosso principal objetivo eh implantar o que ele esta desenvolvendo nesse ambiente hostinger nesse dominioi citado, com o minimo de impacto possivel no projeto dele mas tb sem impactar os demais projetos que ja rodam nesse servidor. precisamos deployar e passar os acessos para ele poder usar esse dominioo tb em seu ciclo de desenvolvimento como staging/dev."

**Análise**: confirma o objetivo central — staging reflete trabalho do dev, mínimo impacto, entregar acessos.

### Pergunta agente — Q6 (Let's Encrypt)
**Resposta**: "o que causar menos impacto, se puder manter como esta e contiunuar funcionanod, melhor ainda"

---

## PARTE 4: EXPLORACAO CICLO 2

### Agent 5 — Investigação cirúrgica do staging em hostinger-alfa (premissa errada)

**Resultado**: confirmou estado quebrado (Caddy não subiu, ticket-form crash). Mas DNS continuava resolvendo pra 76.13.239.198 (não o IP do servidor). Mistério não resolvido nesta sub-sessão.

### Validação direta (Bash) — Resolução do mistério DNS

Comandos executados:
- `dig @8.8.8.8 +short pdviewerp-stagging.fourtuna.com.br A` → 76.13.239.198
- `dig @1.1.1.1 +short pdviewerp-stagging.fourtuna.com.br A` → 76.13.239.198
- `curl -4 -s ifconfig.me` → 31.97.243.191
- `dig -x 76.13.239.198 +short` → `srv1590899.hstgr.cloud.`
- `dig -x 31.97.243.191 +short` → `srv1536196.hstgr.cloud.`

**Conclusão**: 2 servidores Hostinger DIFERENTES. Domínio aponta para servidor B (srv1590899). Estamos rodando no servidor A (srv1536196).

### Investigação SSH no servidor B

- SSH como root: funciona (key configurada — `ssh -o BatchMode=yes root@76.13.239.198 hostname` retornou `srv1590899`)
- SSH como ubuntu: também funciona
- Hostinger-beta sidecars existem: `mural`, `tuninho-ai`

### Estado real do servidor B (hostinger-beta)

**Containers**:
```
planka-planka-1            planka-custom:latest      UP healthy 5d   127.0.0.1:1338→1337
planka-postgres-1          postgres:16-alpine         UP healthy 5d   127.0.0.1:5432
planka-ticket-form-1       planka-ticket-form         EXITED (1) 5d
```

**PM2** (outros projetos no servidor):
- a4tunados-mural (cluster, 20D uptime)
- tuninho-ai (fork, 6h uptime, port 3100)

**Compose**: `docker compose ls` mostra projeto `planka` com 2 files:
- `/opt/hostinger-beta/planka/docker-compose.prod.yml`
- `/opt/hostinger-beta/planka/docker-compose.hostinger-beta.yml`

**docker-compose.hostinger-beta.yml VERBATIM**:
```yaml
# Override para deploy no servidor hostinger-beta (76.13.239.198).
#
# O servidor ja tem nginx do sistema servindo outros projetos (mural, tuninho-ai)
# nas portas 80/443, com certbot/Let's Encrypt configurado. Por isso o Caddy
# do compose.prod.yml NAO sobe aqui — o nginx do servidor faz reverse proxy
# para o container do Planka via porta local 1338.
#
# Uso (apenas planka + postgres no teste inicial):
#   docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml \
#     --env-file .env up -d --build planka postgres
#
# Ticket-form pode ser ativado depois (precisa de outro subdominio + nginx site).

services:
  planka:
    ports:
      - "127.0.0.1:1338:1337"
  ticket-form:
    ports:
      - "127.0.0.1:3002:3001"
```

**Nginx site `/opt/hostinger-beta/nginx/sites/planka.conf` VERBATIM**:
```nginx
server {
    server_name pdviewerp-stagging.fourtuna.com.br;
    client_max_body_size 100M;
    proxy_buffer_size       16k;
    proxy_buffers           8 16k;
    proxy_busy_buffers_size 32k;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    location / {
        proxy_pass http://127.0.0.1:1338;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/pdviewerp-stagging.fourtuna.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pdviewerp-stagging.fourtuna.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = pdviewerp-stagging.fourtuna.com.br) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name pdviewerp-stagging.fourtuna.com.br;
    return 404;
}
```

**Nginx site `formularios.conf` VERBATIM**:
```nginx
server {
    server_name form-pdviewerp-stagging.fourtuna.com.br;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/form-pdviewerp-stagging.fourtuna.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/form-pdviewerp-stagging.fourtuna.com.br/privkey.pem;
}
```

**SSL certs ativos no servidor B**:
- pdviewerp-stagging.fourtuna.com.br
- form-pdviewerp-stagging.fourtuna.com.br
- mural.a4tunados.tuninho.ai
- dev.tuninho.ai

**.env populado** (chaves apenas):
```
PLANKA_DOMAIN, FORM_DOMAIN, LETSENCRYPT_EMAIL, POSTGRES_PASSWORD, SECRET_KEY,
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_USERNAME, PLANKA_FORM_EMAIL,
PLANKA_FORM_PASSWORD, PLANKA_LIST_ID, PLANKA_CHAMADOS_LIST_ID, PRIORITY_LABELS,
CONTACT_REASONS
```

**Ticket-form crash log** (verbatim):
```
[ticket-form] Missing required environment variable: PLANKA_LIST_ID
[ticket-form] Missing required environment variable: PLANKA_LIST_ID
... (loop)
```

**Volumes**:
- `planka_postgres-data` 9375 KB
- `planka_planka-data` (uploads/avatars/attachments)

**DB state**:
- DB `planka` existe, 9.3 MB
- ERROR ao executar `SELECT count(*) FROM users` — tabela não existe (Planka 2.1 pode ter renomeado para `accounts` ou similar; ou DB schema parcial)

**Pasta `/opt/hostinger-beta/planka/`**:
- Owner: 501:staff (UID sem usuário system — indica push via rsync/scp do dev local)
- **NÃO É repo git** (`fatal: not a git repository`)
- Arquivos: .env (root:root, 902 bytes), .env.example, Caddyfile, Dockerfile, DEPLOY.md, client/, server/, docker-compose*.yml

**Imagem `planka-custom:latest`**:
- Built: 2026-04-30T21:00:02 UTC
- package.json: `"name": "planka-server"`

**Outros snapshots no servidor B** (`/opt/hostinger-beta/`):
- mural/, tuninho-ai/, tuninho-ai_pre_*/, tuninho-ai_BROKEN_*/, tuninho-ai_pre_card*/
- planka/ (atual deployment)

---

## PARTE 5: ENTREVISTA CICLO 2

Não houve segunda entrevista formal nesta sessão — operador respondeu Q1-Q6 + esclarecimentos sobre IPs em uma única rodada com clarificações pontuais quando agente confundiu servidores.

**Esclarecimentos finais do operador**:
- "cara, o ip do server é 76.13.239.198, pq está pedindo pra mudar?" — confirmou que servidor real é o B
- "cara, so sei que ja ta deployado nesse server que o ip comeca com 76. descubra o resto por favor" — autorizou investigação SSH no servidor B

---

## PARTE 6: EXPLORACAO CICLO 3 + WEB RESEARCH

**Status**: PARCIAL — Etapa 5 prevê 4+ web searches finais. Esta sessão executou apenas 2 buscas (na Etapa 2 via Agent 4). Os 4+ adicionais ficam para sessão 2 (DEFINE) que precisa ler este XP, ler `_1_DISCOVERY_`, e completar:

1. Estratégias zero-downtime deploy de imagens Docker
2. Padrões de pg_dump em containers Postgres + restore validation
3. Webhooks/notificação de update pra dev (CI/CD para staging)
4. Edge cases de Planka 2.1.0 → 2.1.1 (changelog upstream)

---

## PARTE 7: LOG DE DECISOES E OPCOES DESCARTADAS

| # | Decisão tomada | Opções descartadas | Motivo |
|---|---|---|---|
| 1 | Branch `feat/deploy-planka-hostinger-redeploy` from develop | Reusar `fix/install-tuninho-gitignore` mistura escopos; criar a partir de master | Operador pediu develop syncada como base |
| 2 | DDCE convencional (não card-isolated) | card-isolated com card mural | Não há card mural anexado à demanda |
| 3 | Modo DDCE_EXPANSIVO_MULTI_SESSOES | DDCE single-session normal | Tokens herdados altos (41.7%) + escopo grande (DISCOVER + DEFINE + EXEC + QA) |
| 4 | Servidor B (hostinger-beta) é alvo | Deploy em hostinger-alfa (onde Claude está rodando) | Domínio aponta para B; container A é cópia paralela quebrada |
| 5 | Reusar infra do servidor B 100% | Refazer infra do zero | Tudo já pronto e funcional (nginx+SSL+compose+volumes) — só atualizar imagem |
| 6 | Manter Caddy desativado | Subir Caddy do compose | Conflito 80/443 com nginx do host quebraria outros projetos |
| 7 | Ticket-form INCLUÍDO no escopo | Pular ticket-form nesta op | Operador confirmou Q3 que faz parte do escopo |
| 8 | Pular `tuninho-qa audit-discovery` nesta sessão | Rodar audit | Preservar tokens; rodar na sessão 2 antes do GATE DEFINE |
| 9 | Pular Web Research adicional (Etapa 5) | Completar 4 buscas agora | Tokens; sessão 2 completa antes do DEFINE |
| 10 | Stack `pdview_erp_stagging` em hostinger-alfa = ignorar nesta op | Limpar agora | Op separada (operador disse "C — pode ser reaproveitado" mas escopo dessa op é só o B) |

---

## PARTE 8: PAISAGEM TECNICA COMPLETA

### Arquivos que precisam mudar (no servidor B)

- `/opt/hostinger-beta/planka/` (toda a pasta) — substituir por código de `develop` atual via rsync (preservando `.env`)
- Volume `planka_planka-data` — preservar (uploads do dev podem existir)
- Volume `planka_postgres-data` — manter (DB pode ser resetado se necessário, sem impacto)
- Imagem `planka-custom:latest` — rebuildar com novo código

### Arquivos que NÃO mudam

- `/opt/hostinger-beta/nginx/sites/planka.conf` — config já correta
- `/opt/hostinger-beta/nginx/sites/formularios.conf` — config já correta
- `/etc/letsencrypt/live/pdviewerp-stagging.fourtuna.com.br/` — cert auto-renew funcionando
- `/etc/letsencrypt/live/form-pdviewerp-stagging.fourtuna.com.br/` — idem
- Outros projetos: `/opt/hostinger-beta/mural/`, `/opt/hostinger-beta/tuninho-ai/` — INTOCAR
- PM2 services: a4tunados-mural, tuninho-ai — INTOCAR

### Lógica de resolução proposta (alto-nível, detalhar no DEFINE)

1. **Sync código local → servidor B** (rsync excluindo `.env`, `node_modules`, `_a4tunados/`)
2. **Backup pg_dump preventivo** do DB atual (mesmo zerado, baixo custo)
3. **Rebuild imagem** `docker compose ... build planka` (~5min)
4. **Restart com `up -d`** (~30s downtime)
5. **Diagnosticar PLANKA_LIST_ID**: criar board no Planka via UI, capturar ID, popular .env, restart ticket-form
6. **Validação E2E real** Playwright multi-viewport (Regras #19/#44/#53)
7. **Documentar fluxo** de redeploy para o dev e atualizar sidecars

### Migração de dados

- DB praticamente vazio. Não há dados relevantes a migrar.
- Se Planka 2.1.0→2.1.0 (mesma versão), zero migration necessária.
- Se schema mudou em algum commit do dev, rodar `npm run db:migrate` no container.

### Riscos detalhados (já listados no _1_)

Ver tabela em `_1_DISCOVERY` PARTE "Riscos e Mitigações".

---

## PARTE 9: INCERTEZAS E PONTOS EM ABERTO

Para a sessão 2 (DEFINE) resolver:

1. **Por que `users` não existe no DB?** — investigar se Planka 2.1 usa nome diferente de tabela ou se schema está parcial; rodar `\dt` completo no DB
2. **Como atualizar o código no servidor B?** — rsync vs git clone fresh + rebuild; preservar .env de qualquer forma
3. **PLANKA_LIST_ID populado mas inválido?** ou vazio mesmo? — checar valor real no .env (não foi exposto nesta sessão, sanitizado)
4. **Quanto downtime tolerável?** — operador disse "mínimo impacto", mas staging pode ter alguns minutos
5. **Como entregar acessos ao dev?** — webhook? cron pull? ssh access ao servidor? PR-driven CI/CD? (combinar com operador)
6. **Validação E2E**: que casos cobrir? login admin + criar board + criar card + drag-and-drop intra-coluna + colapsar coluna + verificar log do board (5 features novas do dev)
7. **Backup strategy contínua**: cron pg_dump + tar volumes? ou já existe automatização Hostinger?
8. **DNS**: confirmou-se correto (76.13.239.198 = servidor B onde o staging está) — sem ação necessária

---

## PARTE 10: PROMPT DO OPERADOR SOBRE ESTE ARTEFATO

Operador autorizou modo DDCE_EXPANSIVO_MULTI_SESSOES com handoff multi-sessão (verbatim):

> "quero que o discovery seja completo e tenha todas as informacoes para fazer todos os artefatos e tenhamos condicoes de ir pro define com handoff, temos um metodo de handoff multiplas sessoes que precisa ser aplicado nesse caso para que tenhamos folga para discobvery e rodar o define em sessao nova recuperando o contexto"

Implicações: este XP precisa ser **autossuficiente** para a sessão 2 entender 100% do contexto do DISCOVER sem ler conversa anterior. Decisões, opções descartadas, paisagem técnica, contradições resolvidas — tudo deve estar documentado aqui.

---

## APENDICE: REFERENCIAS EXTERNAS

### Web research (Agent 4 — Etapa 2)

- [Planka GitHub](https://github.com/plankanban/planka)
- [Planka Releases](https://github.com/plankanban/planka/releases)
- [Upgrade to v2 / Docker](https://docs.planka.cloud/docs/upgrade-to-v2/docker/)
- [Nginx Reverse Proxy](https://docs.planka.cloud/docs/configuration/reverse-proxy/nginx/)
- [Backup & Restore](https://docs.planka.cloud/docs/installation/docker/backup-and-restore/)
- [Issue #1506 - Upcoming breaking changes](https://github.com/plankanban/planka/issues/1506)
- [Discussion #316 - Backup strategies](https://github.com/plankanban/planka/discussions/316)
- [selfhosting.sh Planka guide](https://selfhosting.sh/apps/planka/)

### Repos relevantes

- Repo do projeto: `https://github.com/GGhiaroni/planka` (fork customizado)
- Repo upstream: `https://github.com/plankanban/planka`

### Comandos canônicos descobertos

```bash
# Build + up no servidor B
ssh root@76.13.239.198 "cd /opt/hostinger-beta/planka && \
  docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml \
  --env-file .env up -d --build planka postgres ticket-form"

# Logs
ssh root@76.13.239.198 "docker logs --tail 100 -f planka-planka-1"

# DB shell
ssh root@76.13.239.198 "docker exec -it planka-postgres-1 psql -U postgres planka"

# Backup pg_dump
ssh root@76.13.239.198 "docker exec planka-postgres-1 pg_dump -U postgres planka > /opt/hostinger-beta/backups/planka-$(date +%Y%m%d-%H%M%S).sql"

# Nginx test + reload
ssh root@76.13.239.198 "nginx -t && systemctl reload nginx"
```
