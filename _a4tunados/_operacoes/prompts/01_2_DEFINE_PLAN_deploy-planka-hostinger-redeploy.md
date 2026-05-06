---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: define_plan
versao: "1.0"
modo: DDCE_EXPANSIVO_MULTI_SESSOES (sessao 1 — DEFINE encadeado pos-DISCOVER)
operador: victorgaudio
modelo: claude-opus-4-7[1m]
modo_execucao: AUTONOMO_CRITERIOSO
---

# Plano de Execução — Op 01: deploy-planka-hostinger-redeploy

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Fases** | 3 |
| **Tarefas totais** | 22 |
| **Sessões estimadas** | 1 (DEFINE+EXECUTION nesta sessão se tokens permitirem; senão handoff pra sessão 2 EXECUTION) |
| **Ratio adaptação vs novo** | 18 ADAPTAÇÃO / 4 NOVO (~82% adaptação) |
| **Risco geral** | MÉDIO (deploy em staging com outros projetos críticos no mesmo servidor) |
| **Modo execução** | AUTÔNOMO CRITERIOSO (Regras #61 + #42) |

## Mapping Requisitos → Tarefas (Regra #43)

| # | Card/Demanda | Requisito (literal do prompt + entrevista) | Tarefas |
|---|---|---|---|
| 1 | Prompt original | "atualizar deploy do projeto através dessa branch" | T1.1, T1.2, T1.3, T1.4, T1.5 |
| 2 | Prompt original | "deixar projeto no link e deployado online, com todas as suas funções" | T1.5, T1.6, T1.7 |
| 3 | Entrevista Q1 | "atualizar e implantar esse projeto [pdview_erp_staging]" | T1.* + T2.* |
| 4 | Entrevista Q3 | "ticket-form faz parte do escopo" | T2.1, T2.2, T2.3, T2.4, T2.5, T2.6 |
| 5 | Mensagem 14 | "branch deploy/staging que ao ser commitada atualize o deploy" | T3.1, T3.2, T3.3, T3.4, T3.5 |
| 6 | Mensagem 14 | "passar acessos para o dev usar staging em ciclo de desenvolvimento" | T3.6, T3.7 |
| 7 | Mensagem 14 | "mínimo impacto possível no projeto dele" | restrição transversal — `.env` preservado em todas tarefas, branch separada |
| 8 | Mensagem 14 | "sem impactar os demais projetos que já rodam nesse servidor" | restrição transversal — porta 1338 isolada, nginx do host não tocado, volumes preservados |

---

## Fase 1: Bootstrap deploy seguro

### Objetivo

Atualizar a imagem Docker `planka-custom:latest` no servidor hostinger-beta com o código da branch `develop` atual, fazer restart preservando volumes do DB, e validar staging acessível em https://pdviewerp-stagging.fourtuna.com.br/ com todas as 5 features novas do dev funcionando.

### Tarefas

- [ ] **T1.1: Backup preventivo pg_dump do DB atual**
  - **Tipo**: NOVO (tarefa de segurança, nunca rodada antes)
  - **Base existente**: N/A — primeira execução
  - **Onde**: SSH ao servidor B; `docker exec planka-postgres-1 pg_dump -U postgres planka > /opt/hostinger-beta/backups/planka-pre-redeploy-$(date +%Y%m%d-%H%M%S).sql`
  - **Validação**: arquivo > 1KB (mesmo DB vazio tem schema que ocupa)
  - **Requisitos cobertos**: 7, 8 (segurança/reversibilidade)

- [ ] **T1.2: rsync código local → /opt/hostinger-beta/planka/**
  - **Tipo**: ADAPTAÇÃO (substituir arquivos existentes preservando estado)
  - **Base existente**: `/opt/hostinger-beta/planka/` (already populated)
  - **Onde**: do workspace local (servidor A) → servidor B
  - **Comando**: `rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='_a4tunados' --exclude='.claude' --exclude='.mcp.json' --exclude='.vscode' /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/planka/ root@76.13.239.198:/opt/hostinger-beta/planka/`
  - **CRÍTICO**: `--exclude='.env'` (preservar credentials do server) e `--exclude='_a4tunados'` (não enviar artefatos do DDCE pro servidor)
  - **Validação pós-sync**: `ssh root@76.13.239.198 "ls /opt/hostinger-beta/planka/ && cat /opt/hostinger-beta/planka/package.json | grep version"` — confirmar version 2.1.0 + .env intacto
  - **Requisitos cobertos**: 1, 7, 8

- [ ] **T1.3: Validar override compose**
  - **Tipo**: ADAPTAÇÃO (config check)
  - **Base existente**: docker-compose.prod.yml + docker-compose.hostinger-beta.yml
  - **Onde**: SSH servidor B
  - **Comando**: `docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env config 2>&1 | head -100`
  - **Validação**: zero erros de parsing, ports mapeadas corretamente
  - **Requisitos cobertos**: 1, 8

- [ ] **T1.4: Rebuild imagem planka-custom:latest**
  - **Tipo**: ADAPTAÇÃO (rebuild com novo código)
  - **Base existente**: imagem atual de 2026-04-30
  - **Onde**: SSH servidor B em /opt/hostinger-beta/planka/
  - **Comando**: `docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env build planka 2>&1 | tail -50`
  - **Validação**: imagem nova com timestamp recente; `docker images planka-custom:latest --format '{{.CreatedAt}}'` deve mostrar agora
  - **Riscos**: build pode falhar (npm ci, lockfile mismatch, missing deps)
  - **Tempo estimado**: 5-10 min (cached layers)
  - **Requisitos cobertos**: 1, 2

- [ ] **T1.5: Restart `planka` preservando volume postgres-data**
  - **Tipo**: ADAPTAÇÃO (force-recreate só do container planka)
  - **Base existente**: container atual UP healthy
  - **Onde**: SSH servidor B
  - **Comando**: `docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env up -d --force-recreate planka`
  - **CRÍTICO**: `--force-recreate planka` (NÃO usar `--force-recreate` sem nome — recriaria postgres também e perderia DB)
  - **Validação**: `docker ps --filter name=planka-planka-1 --format '{{.Status}}'` mostra UP healthy
  - **Downtime esperado**: 30-60 segundos
  - **Requisitos cobertos**: 1, 2

- [ ] **T1.6: Smoke + healthcheck pós-deploy**
  - **Tipo**: ADAPTAÇÃO (test pattern)
  - **Validações**:
    - `curl -fsSL https://pdviewerp-stagging.fourtuna.com.br/ | head -20` — HTML retornado tem `<title>Planka</title>`
    - `curl -fsSL -o /dev/null -w "%{http_code}\n" https://pdviewerp-stagging.fourtuna.com.br/api/config` — 200 OK
    - `docker logs --tail 50 planka-planka-1 2>&1 | grep -iE "error|fatal" | head -5` — zero erros novos
    - `docker exec planka-planka-1 curl -fsS http://localhost:1337/api/config | head -3` — internal healthcheck OK
  - **Requisitos cobertos**: 2

- [ ] **T1.7: Validação E2E real Playwright (Regras #19/#44/#53)**
  - **Tipo**: ADAPTAÇÃO (validação canônica DDCE)
  - **Multi-viewport** (Regra #44): desktop 1366x800 + mobile 375x667
  - **Multi-feature** (5 commits do dev a validar):
    1. Login admin com credentials do .env
    2. Verificar página inicial — UI carrega sem erros
    3. Criar/abrir um Board → testar **drag-and-drop intra-coluna** (commit `dc9f6cc4`)
    4. Testar **3 opções de altura de linha** na view planilha (commit `de1eb9d7`)
    5. Testar **coluna colapsada** — collapse/expand (commit `0eb2a53e`)
    6. Verificar **log do board** — abrir histórico (commit `9fae494b`)
    7. Verificar **seed coluna 'Falar com o cliente'** em board Design (commit `25a49d8a`) — pode requer reset DB ou criação manual
  - **Capturar screenshots** + INTERPRETAR cada um via Read tool (Licão #31)
  - **browser_console_messages** = zero erros críticos
  - **Salvar evidências** em `fase_01/evidencias/`
  - **Requisitos cobertos**: 2

### Validação Humana

Após T1.7 PASS, apresentar ao operador screenshots dos 5 features funcionando + URL acessível. Operador valida e aprova transição para Fase 2.

### Aprendizados esperados

- Tempo real de build da imagem (cache hit ratio)
- Comportamento de migrations entre versions (se houver schema change)
- Comportamento do nginx do host com proxy_buffer config quando recebe upload de arquivo grande

---

## Fase 2: Ticket-form fix (PLANKA_LIST_ID + boards iniciais)

### Objetivo

Diagnosticar a ausência/invalidade de `PLANKA_LIST_ID` e `PLANKA_CHAMADOS_LIST_ID` no `.env`, criar boards/lists necessários no Planka recém-deployado, capturar os IDs corretos, atualizar `.env`, e fazer ticket-form rodar healthy servindo `https://form-pdviewerp-stagging.fourtuna.com.br/`.

### Tarefas

- [ ] **T2.1: Inspecionar .env atual no servidor B**
  - **Tipo**: ADAPTAÇÃO (diagnóstico)
  - **Comando**: `ssh root@76.13.239.198 "grep -E 'PLANKA_LIST_ID|PLANKA_CHAMADOS_LIST_ID|PRIORITY_LABELS|CONTACT_REASONS' /opt/hostinger-beta/planka/.env"`
  - **Validação**: descobrir se valores são vazios, placeholders, ou IDs de outro Planka
  - **Requisitos cobertos**: 4

- [ ] **T2.2: Login admin + criar boards iniciais via Playwright autônomo**
  - **Tipo**: NOVO (criação inicial do conteúdo)
  - **Onde**: https://pdviewerp-stagging.fourtuna.com.br/
  - **Steps**:
    1. Login com ADMIN_USERNAME / ADMIN_PASSWORD do .env
    2. Criar Project "PDView ERP Staging" (ou nome do .env)
    3. Criar Board "Design" com lista "Demanda" (e outras conforme `.env.example` indica)
    4. Criar Board "Técnicos" com lista "Em Espera" + outras
    5. Criar 8 Labels com cores e nomes do PRIORITY_LABELS template
  - **Capturar IDs**: via DevTools Network tab durante criação OU via API `GET /api/projects` e `GET /api/boards/{id}/lists`
  - **Requisitos cobertos**: 4

- [ ] **T2.3: Capturar IDs gerados (Lists + Labels)**
  - **Tipo**: NOVO
  - **Comando**: `curl -fsSL -H "Authorization: Bearer <token>" https://pdviewerp-stagging.fourtuna.com.br/api/projects` (token via login API)
  - **Output esperado**: JSON com listIds dos boards + labelIds com nomes
  - **Salvar**: em `fase_02/evidencias/planka-ids-capturados.json`
  - **Requisitos cobertos**: 4

- [ ] **T2.4: Atualizar .env no servidor B**
  - **Tipo**: ADAPTAÇÃO (preservar outras keys, atualizar 4)
  - **Comando**: SSH + `sed` ou edit direto
  - **Keys a atualizar**: PLANKA_LIST_ID, PLANKA_CHAMADOS_LIST_ID, PRIORITY_LABELS, CONTACT_REASONS
  - **Backup**: `cp .env .env.pre-ticket-form-fix-$(date +%s)`
  - **Validação**: `grep PLANKA_LIST_ID .env` retorna valor real
  - **Requisitos cobertos**: 4

- [ ] **T2.5: Restart ticket-form**
  - **Tipo**: ADAPTAÇÃO
  - **Comando**: `docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env up -d --force-recreate ticket-form`
  - **Validação**: `docker ps --filter name=ticket-form` shows UP (não EXITED)
  - **Logs**: `docker logs --tail 30 planka-ticket-form-1` sem `Missing required environment variable`
  - **Requisitos cobertos**: 4

- [ ] **T2.6: Validação E2E ticket-form**
  - **Tipo**: ADAPTAÇÃO (validação canônica)
  - **Onde**: https://form-pdviewerp-stagging.fourtuna.com.br/
  - **Validações**:
    - Página carrega sem 502/timeout
    - Form é renderizado com campos (assunto, descrição, prioridade, etc)
    - **NÃO submeter form com dados de teste** (Regra #51 — write em DB prod) sem confirmar com operador
    - Se operador autorizar: submeter com `[TEST] Ticket de validação automática` e verificar que aparece no board "Demanda" do Planka
  - **Capturar evidências** em `fase_02/evidencias/`
  - **Requisitos cobertos**: 4

### Validação Humana

Operador valida ticket-form acessível + (opcional) submit de teste.

### Aprendizados esperados

- Estrutura padrão de boards/lists pra ticket integration
- Comportamento do ticket-form quando vars válidas
- Eventual race condition Planka boot vs ticket-form start

---

## Fase 3: CI/CD via branch `deploy/staging` + entrega ao dev

### Objetivo

Implementar mecanismo onde **`git push origin deploy/staging`** automaticamente atualiza o staging em produção, sem intervenção manual. Documentar fluxo pro dev (GGhiaroni). Atualizar sidecars devops.

### Estratégia escolhida: GitHub Actions + SSH rsync

**Por quê GitHub Actions:**
- Zero infrastructure adicional (workflow file no próprio repo)
- Audit trail visual em github.com/.../actions
- Secrets gerenciados pelo GitHub (SSH key, host)
- Dev usa flow normal de git (push branch)
- Rollback via reverter commit + push novamente

**Alternativas descartadas**:
- **Webhook + endpoint custom no servidor**: complexidade adicional (precisa daemon HTTP próprio)
- **Polling via cron**: delay de até N min entre push e deploy (pior UX)
- **Watchtower + image registry**: precisa CI separado pra build da imagem (custo + complexidade)
- **Self-hosted runner**: roda processo extra no servidor (descartado pelo "mínimo impacto")

### Tarefas

- [ ] **T3.1: Gerar SSH key dedicada para deploy**
  - **Tipo**: NOVO
  - **Comando**: `ssh-keygen -t ed25519 -C "deploy-actions-planka" -f /tmp/deploy_planka_key -N ""`
  - **Output**: `/tmp/deploy_planka_key` (private) + `/tmp/deploy_planka_key.pub` (public)
  - **Segurança**: chave dedicada apenas para esse deploy — restrita por `command=` no `authorized_keys`
  - **Requisitos cobertos**: 5, 7

- [ ] **T3.2: Adicionar pub key no servidor B com restrição**
  - **Tipo**: ADAPTAÇÃO
  - **Comando**: `cat /tmp/deploy_planka_key.pub | ssh root@76.13.239.198 'cat >> /root/.ssh/authorized_keys'`
  - **Idealmente** restringir por `command=`, `from=`, `no-port-forwarding` no `authorized_keys`. Mas pra simplicidade da v1, adicionar key full e restringir depois.
  - **Validação**: SSH com nova key funciona (`ssh -i /tmp/deploy_planka_key root@76.13.239.198 "echo OK"`)

- [ ] **T3.3: Criar script `scripts/deploy.sh` no repo**
  - **Tipo**: NOVO
  - **Path no repo**: `scripts/deploy.sh` (vai pra todos os branches via `develop`)
  - **Funções**:
    - `set -euo pipefail`
    - Backup pg_dump preventivo automático
    - rsync interno (copia próprio /opt/hostinger-beta/planka recente — ou usado como hook)
    - `docker compose build planka`
    - `docker compose up -d --force-recreate planka`
    - Smoke test
    - Rollback automático se smoke test falha (volta imagem anterior tagged)
  - **Idempotente**: pode rodar 2x sem efeito colateral
  - **Logs**: tudo via stdout pra Actions capturar

- [ ] **T3.4: Criar `.github/workflows/deploy-staging.yml`**
  - **Tipo**: NOVO
  - **Trigger**: `push` em `deploy/staging`
  - **Steps**:
    1. checkout
    2. setup SSH (key from secret)
    3. backup remoto pg_dump
    4. rsync arquivos pro servidor (excluindo `.git`, `node_modules`, `.env`)
    5. ssh + run `scripts/deploy.sh`
    6. smoke test (curl HTTPS)
    7. notify (echo no log do action)

- [ ] **T3.5: Adicionar secrets no GitHub repo**
  - **Tipo**: NOVO
  - **Secrets**:
    - `STAGING_DEPLOY_SSH_KEY` (private key gerada em T3.1)
    - `STAGING_DEPLOY_HOST` = `76.13.239.198`
    - `STAGING_DEPLOY_USER` = `root` (ou usuário deploy dedicado se criarmos depois)
  - **Onde**: github.com/GGhiaroni/planka/settings/secrets/actions
  - **AÇÃO MANUAL DO OPERADOR**: precisa adicionar via UI do GitHub (eu não tenho acesso ao Settings sem que operador autorize)

- [ ] **T3.6: Criar branch `deploy/staging` + primeiro deploy via Actions**
  - **Tipo**: NOVO
  - **Comando local**:
    1. `git checkout develop`
    2. `git checkout -b deploy/staging`
    3. `git push -u origin deploy/staging`
  - **Resultado**: workflow dispara, rsync + build + restart automático
  - **Validação**: action passa green em github.com/GGhiaroni/planka/actions
  - **Idempotência**: o primeiro push triggera novo deploy (já que servidor já está atualizado pela Fase 1) — deve ser noop em termos de diff visível

- [ ] **T3.7: Documentação `DEPLOY-STAGING.md` para o dev**
  - **Tipo**: NOVO
  - **Path**: na raiz do repo
  - **Conteúdo**:
    - Visão geral (1 parágrafo)
    - Como deployar atualização: `git push origin deploy/staging`
    - Como verificar status: link para Actions
    - Como acessar logs do servidor (se necessário)
    - Como fazer rollback manual (revert commit + push)
    - Onde estão os secrets configurados
    - Troubleshooting comum

- [ ] **T3.8: Atualizar sidecars `tuninho-devops-hostinger/projects/hostinger-beta/`**
  - **Tipo**: NOVO
  - **Path**: `.claude/skills/tuninho-devops-hostinger/projects/hostinger-beta/planka/config.md` (criar)
  - **Conteúdo**: stack real, paths, portas, domínios, deploy mode (CI/CD GitHub Actions), backup strategy
  - **Também atualizar**: `.claude/skills/tuninho-devops-env/projects/planka/config.md` + `env-catalog.json` (sair de skeleton para bootstrap completo)

- [ ] **T3.9: Entrega ao dev — abrir issue ou notificar**
  - **Tipo**: NOVO
  - **Mecanismo**: criar PR comment ou issue no repo `GGhiaroni/planka` com instruções
  - **Conteúdo**: link `DEPLOY-STAGING.md` + status atual + acesso ao staging

### Validação Humana

Operador valida fluxo end-to-end: faz commit dummy na branch `deploy/staging`, push, observa workflow rodando, deploy completa, change visível no staging.

### Aprendizados esperados

- Tempo médio de deploy via Actions (de push ao staging atualizado)
- Comportamento de Actions com SSH em servidor com firewall
- Limites de rsync (tamanho de arquivos, timeouts)

---

## Dependências entre Fases

```
Fase 1 (deploy básico funciona)
    ↓
Fase 2 (ticket-form, depende de admin login + boards do staging Fase 1)
    ↓
Fase 3 (CI/CD, depende de tudo já estar funcionando manualmente)
```

Fases NÃO podem ser paralelas — cada uma depende da anterior.

## Riscos e Mitigações

| Risco | Probab | Impacto | Mitigação |
|---|---|---|---|
| Build falha em T1.4 (npm ci, lockfile) | Média | Alto | Backup imagem anterior taggeada (`docker tag planka-custom:latest planka-custom:pre-redeploy`); rollback restart com tag anterior se falha |
| Migrations DB destroem dados | Baixa | Médio | DB já vazio (operador OK); pg_dump T1.1 garante reversibilidade |
| Container restart bate 1338 com PM2 mural 1337 | Baixíssima | Alto | Override `127.0.0.1:1338` é explícito; não muda |
| nginx default cai por algum motivo | Baixa | CRÍTICO | NÃO TOCAR nginx config; só `nginx -t` antes de qualquer edit |
| ticket-form continua crash após .env update | Média | Médio | Logs detalhados; se persistir, comentar service no compose e entregar Fase 3 sem ticket-form |
| GitHub Actions falha por secret mal-configurado | Média | Médio | Operador precisa adicionar secrets via UI; instrução clara em T3.5 |
| Dev faz push descuidado (force, merge errado) | Média | Alto | `deploy/staging` protegido com required reviews? Ou aceito como é (operador valida) |
| Disk space no servidor B (imagens antigas) | Baixa | Baixo | `docker image prune -f` periódico; espaço atual 17% — folga grande |

## Métricas de Sucesso

- ✓ `https://pdviewerp-stagging.fourtuna.com.br/` retorna 200 OK com HTML do Planka **com features dos 5 commits do dev visíveis**
- ✓ `https://form-pdviewerp-stagging.fourtuna.com.br/` retorna 200 OK com form renderizado
- ✓ `git push origin deploy/staging` (com qualquer commit) triggera Actions, rsync, build, restart, e atualiza staging em <10min
- ✓ Outros projetos no servidor B (`a4tunados-mural`, `tuninho-ai`) **não tem nenhum impacto** medido (PM2 status, logs sem erros novos)
- ✓ Sidecars `tuninho-devops-hostinger/projects/hostinger-beta/planka/` e `tuninho-devops-env/projects/planka/` populados com info real
- ✓ `DEPLOY-STAGING.md` no repo com instruções claras
- ✓ Comlurb seal aplicado no encerramento

## Tokens estimados por fase

| Fase | Δ tokens estimado |
|------|-------------------|
| Fase 1 (build + deploy + E2E) | ~40-60k (Playwright pesado) |
| Fase 2 (ticket-form fix) | ~20-30k |
| Fase 3 (CI/CD setup) | ~30-40k |
| **TOTAL EXECUTION** | **~90-130k** |

Atual: 52.4%. Pós-EXECUTION estimado: ~62-66%. Margem confortável para encerramento.

## Notas finais

- Modo execução: **AUTÔNOMO CRITERIOSO** (Regra #61). Gates auto-aprovados pela autorização macro do operador. Mas Regra #51 (write em prod DB) ainda exige GATE — qualquer write em DB do staging será apresentado antes (mesmo que DB esteja zerado).
- Validação humana entre fases é mantida (operador acompanha turno-a-turno mesmo em autonomous).
- Comlurb seal + escriba + git-flow d'a4 ao final (Regra petrea v5.0.2).
- Sync develop pós-merge (Regra petrea v5.0.3).
- README do operação populado com tokens reais a cada fim de fase.
