---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: discovery
versao: "1.0"
modo: DDCE_EXPANSIVO_MULTI_SESSOES (sessao 1 — DISCOVER)
operador: victorgaudio
modelo: claude-opus-4-7[1m]
---

# Discovery — Deploy/Redeploy Planka Staging em Hostinger-Beta

## Resumo Executivo

Operação para **atualizar o staging do Planka customizado** rodando em
`https://pdviewerp-stagging.fourtuna.com.br` (servidor Hostinger-beta,
IP 76.13.239.198, hostname srv1590899) com o **código da branch `develop`
do fork `github.com/GGhiaroni/planka`** (5 commits recentes May 4-6 com
features do dev: log do board, drag-and-drop intra-coluna, line-height
planilha, seed coluna "Falar com o cliente", coluna colapsada).

O staging atual foi deployado em **2026-04-30** com a branch `master` do
mesmo fork — ou seja, está **6 dias atrás** do que o dev está produzindo.
A imagem Docker `planka-custom:latest` precisa ser **rebuildada** com o
código atualizado, com **mínimo impacto** no servidor (que tem outros
projetos críticos rodando: a4tunados-mural via PM2, tuninho-ai via Next.js
Next port 3100) e **mínimo impacto no trabalho do dev** (ele continua
trabalhando em outro ambiente local).

Adicionalmente, o serviço **`ticket-form` está crashado** desde o deploy
inicial — falta `PLANKA_LIST_ID` (provavelmente o board nunca foi criado
no Planka inicializado). Operador confirmou que o ticket-form **faz parte
do escopo** desta operação.

## Escopo

### Incluído
- Atualizar imagem Docker `planka-custom:latest` no servidor B com código de `develop` atual
- Restart do container `planka-planka-1` preservando volume `planka_postgres-data` (DB)
- Diagnóstico e correção do `ticket-form` (crash loop por env vars)
- Validação E2E real (Playwright + multi-viewport — Regras #19/#44/#53) em `https://pdviewerp-stagging.fourtuna.com.br/`
- Documentar fluxo de redeploy (entregar instruções pro dev usar o staging em ciclo de desenvolvimento)
- Atualizar sidecars `tuninho-devops-hostinger/projects/hostinger-beta/` e `tuninho-devops-env/projects/planka/` com info real do staging deployado

### Excluído
- Migração de dados (DB do staging atual está praticamente vazio: schema OK mas zero dados úteis — operador confirmou "não há dados relevantes")
- Mudanças no fork upstream (não vamos contribuir pra plankanban/planka)
- Mudanças no servidor A (hostinger-alfa, srv1536196) onde existe um stack `pdview_erp_stagging` rodando isolado e quebrado — operador confirmou que **não é o staging real** (foi confusão) e pode ser ignorado/limpo em outra op
- Caddy do compose (já não estava rodando no B; nginx do host serve via reverse proxy)

## Servidores envolvidos

| Servidor | IP | Hostname | Função | Acesso desta sessão |
|---|---|---|---|---|
| **Servidor A** (hostinger-alfa) | 31.97.243.191 | srv1536196.hstgr.cloud | Workspace dev (onde estamos rodando Claude Code) | local |
| **Servidor B** (hostinger-beta) | 76.13.239.198 | srv1590899.hstgr.cloud | **Staging real do Planka** | SSH root key configurada (testado UP) |

Servidor A tem container Planka próprio em `/docker/pdview_erp_stagging/` mas é tentativa paralela quebrada (Caddyfile virou diretório, ticket-form crash, nginx default redireciona pra a4tunados.com.br) — **fora de escopo desta op**.

## Paisagem Técnica — Estado Atual do Servidor B

### Stack rodando

```
Containers (docker compose ls -a):
  planka-planka-1            planka-custom:latest      UP healthy 5d   127.0.0.1:1338→1337
  planka-postgres-1          postgres:16-alpine         UP healthy 5d   127.0.0.1:5432
  planka-ticket-form-1       planka-ticket-form         EXITED (1) 5d   (crash loop)

PM2 (outros projetos):
  a4tunados-mural            cluster, 20D uptime, port 1337 (PM2-native, NÃO container)
  tuninho-ai                 fork, 6h uptime, Next.js port 3100
```

### Compose files (em `/opt/hostinger-beta/planka/`)

- `docker-compose.prod.yml` — Planka + Postgres + ticket-form + Caddy (Caddy desativado pelo override)
- `docker-compose.hostinger-beta.yml` — **override documentado** que mapeia 127.0.0.1:1338→1337 (Planka) e 127.0.0.1:3002→3001 (ticket-form), Caddy não sobe
- Comando canônico: `docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env up -d --build planka postgres`

### Nginx (do host) configs

- **`/opt/hostinger-beta/nginx/sites/planka.conf`** (linkado em `/etc/nginx/sites-enabled/planka.conf`):
  - `server_name pdviewerp-stagging.fourtuna.com.br`
  - `proxy_pass http://127.0.0.1:1338`
  - `client_max_body_size 100M`, websocket headers, redirect 80→443
  - SSL via Let's Encrypt: `/etc/letsencrypt/live/pdviewerp-stagging.fourtuna.com.br/`
- **`/opt/hostinger-beta/nginx/sites/formularios.conf`** (linkado):
  - `server_name form-pdviewerp-stagging.fourtuna.com.br`
  - `proxy_pass http://127.0.0.1:3002`
  - SSL via Let's Encrypt (cert separado)
  - **Mas backend (ticket-form) está EXITED** — domínio retorna 502/timeout

### .env (chaves apenas — valores são segredos)

```
PLANKA_DOMAIN=<SET>
FORM_DOMAIN=<SET>
LETSENCRYPT_EMAIL=<SET>
POSTGRES_PASSWORD=<SET>
SECRET_KEY=<SET>
ADMIN_EMAIL=<SET>
ADMIN_PASSWORD=<SET>
ADMIN_NAME=<SET>
ADMIN_USERNAME=<SET>
PLANKA_FORM_EMAIL=<SET>
PLANKA_FORM_PASSWORD=<SET>
PLANKA_LIST_ID=<SET>      # provavelmente vazio — causa crash do ticket-form
PLANKA_CHAMADOS_LIST_ID=<SET>
PRIORITY_LABELS=<SET>
CONTACT_REASONS=<SET>
```

### Volumes

```
planka_postgres-data       9.3 MB (DB com schema parcial — relation 'users' não existe; pode ser nome diferente em Planka 2.1.x ou DB não inicializado)
planka_planka-data         (uploads/avatars/attachments — não verificado tamanho)
```

### Pasta do deploy

`/opt/hostinger-beta/planka/` (owner 501:staff — UID 501 sem usuário system, indica que arquivos foram **rsync ou scp** do dev local, NÃO `git clone`)

**Sem `.git/` na pasta** — não é repo git, é cópia de arquivos. Implicação importante: para atualizar não dá `git pull` lá; tem que **rsync ou re-extract** dos arquivos.

### Imagem custom

```
planka-custom:latest
  Built:    2026-04-30T21:00:02 UTC
  Source:   GGhiaroni/planka @ master (na época)
  Base:     ghcr.io/plankanban/planka:2.1.1 (commit a8dcd7cef base)
  Overlays: backend (logging, table view, custom fields) + client (UI patches)
```

## Análise de Adaptação (Reuse-First)

### Candidatos identificados

| # | Funcionalidade Existente | O que já faz | Gap | Adapt | Novo | Recomendação |
|---|---|---|---|---|---|---|
| 1 | Stack `/opt/hostinger-beta/planka/` | Tudo: compose, nginx, SSL, env, volumes | Apenas atualizar código (rebuild image) | P (~30min) | G (refazer setup completo) | **ADAPTAR** |
| 2 | docker-compose.hostinger-beta.yml | Override pronto, documentado | Nenhum | — | — | **REUSAR como está** |
| 3 | Nginx sites (planka.conf + formularios.conf) | Routing + SSL pronto | Nenhum | — | — | **REUSAR como está** |
| 4 | SSL certs Let's Encrypt | Pdviewerp + form-pdviewerp já emitidos e renovados auto | Nenhum | — | — | **REUSAR** |
| 5 | DB postgres (volume planka_postgres-data) | Schema 9.3MB, dados zerados | Pode resetar (operador OK) ou manter | P | — | **MANTER** (zero impacto) |
| 6 | Imagem `planka-custom:latest` | Build baseada em master | Rebuild com develop atual | M (5-10min) | — | **REBUILD** |

### Abordagem recomendada

**Adaptação total** — não criar nada novo. Toda infra está pronta. O trabalho é:
1. Sincronizar código de `develop` atual para `/opt/hostinger-beta/planka/` no servidor B (via rsync ou tar+scp)
2. Rebuild da imagem `planka-custom:latest`
3. Restart preservando volumes
4. Diagnosticar `PLANKA_LIST_ID` ausente e criar o board no Planka
5. Restart ticket-form
6. Validar E2E

### Decisão do operador

Operador autorizou Q4 ("começar do zero ou restaurar de backup") com **"não há dados relevantes"** — então mesmo se DB precisar ser resetado durante migrações, sem problema.

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Rebuild de imagem demora >5min, downtime do staging | Alta | Baixo (staging) | Tolerar; avisar dev antes |
| Build falha por dependência node ausente | Baixa | Alto | Validar `npm install --prefix server` localmente antes de buildar no server |
| DB corrompe na migration | Baixa | Médio | Backup `pg_dump` antes do rebuild (já documentado em licoes-aprendidas) |
| Conflito de porta com a4tunados-mural (port 1337) | Já mitigado | — | Override usa porta 1338 (documentado no compose) |
| Crash do ticket-form persiste | Alta | Baixo (staging) | Criar board no Planka primeiro, popular `PLANKA_LIST_ID`, restart |
| nginx config quebra outros projetos | Baixa | Alto | Não tocar em outros sites; validar com `nginx -t` antes de reload |
| SSL cert expira durante a operação | Baixíssima | Alto | Certbot já renova auto (cert válido por 90 dias) |

## Web Research

**Status**: parcial. Web research da Etapa 2 (2 buscas: Planka deploy 2026 + breaking changes) feita pelo Agent 4.

**Achados principais** (incorporados):
- Planka v2.1.1 atual (estamos em v2.1.0 — uma patch atrás)
- v2.0 mudou volumes consolidados (`/app/data`) — fork em v2.1.0 já tem isso, sem risco
- Backup official: `docker-backup.sh` consolidado
- Nginx canônico para Planka: keepalive, websocket headers, X-Forwarded-* (já presentes no `planka.conf` do host)
- Custom forks pattern: master mirror + develop com customizações (exatamente como fork GGhiaroni/planka faz)

**Pendências de web research** (Etapa 5 — 4+ buscas):
- Estratégias de hot-reload de imagem Docker em produção sem downtime (zero-downtime deploy)
- Padrões de `pg_dump` em containers Postgres + restore validation
- Padrões de notificação ao dev quando staging é atualizado (webhook? email?)
- Edge cases de Planka 2.1.0 → 2.1.1 (apenas upstream — pode ser patch sem impacto)

A sessão 2 (DEFINE) deve completar essas pesquisas adicionais antes de finalizar o plano.

## Decisões do Operador (Entrevistas)

### Apresentação inicial
- **Modo**: DDCE COMPLETO RIGOROSO (Regra #62) interativo
- **Tipo**: DDCE convencional (não card-isolated)
- **Branch base**: `feat/deploy-planka-hostinger-redeploy` criada do tip de `develop` pós-merge PR #1
- **Modo handoff**: DDCE_EXPANSIVO_MULTI_SESSOES — esta sessão é DISCOVER, sessão 2 será DEFINE

### Q1 — Cenário do "deploy anterior"
- **Resposta**: cenário (a)+(c) — staging existe, é em hostinger-beta (76.13.239.198), domínio `pdviewerp-stagging.fourtuna.com.br`. Não tem relação com Mural.
- O stack `pdview_erp_stagging` em hostinger-alfa (servidor A) é cópia paralela quebrada — pode ser ignorada.

### Q2 — Domínio
- **Mantido**: `https://pdviewerp-stagging.fourtuna.com.br/`
- **Form domain**: `https://form-pdviewerp-stagging.fourtuna.com.br/` (já configurado no nginx, cert SSL emitido)

### Q3 — Caddy + compose
- **Resposta**: "o que for mais seguro" — recomendação validada: nginx do host como reverse proxy + Caddy do compose desligado. Já é o estado atual do servidor B.

### Q4 — Política de dados
- **Resposta**: não há dados relevantes; git é fonte de verdade; pode zerar DB se necessário.

### Q5 — Stack pdview_erp_staging em hostinger-alfa
- **Resposta**: cenário (c) — investigar antes. Investigado: é cópia paralela quebrada, **NÃO é o staging real**. Pode ser limpo em outra op.

### Q6 — Email Let's Encrypt
- **Resposta**: o que causar menos impacto, manter como está. Estado: cert atual válido (auto-renew via certbot), nenhuma mudança necessária.

## Restrições e Premissas

- **Acesso SSH ao servidor B**: confirmado funcionando como root via key SSH já configurada
- **Outros projetos no servidor B**: a4tunados-mural (PM2, port 1337) e tuninho-ai (Next.js, port 3100) — **NÃO TOCAR**
- **Backups Hostinger**: pasta `/opt/hostinger-beta/backups/` tem snapshots regulares — pode-se confiar nelas para rollback
- **Repo no servidor B sem .git** — atualização via rsync/scp dos arquivos da branch local
- **DEPLOY.md** existe no repo (222 linhas) com instruções históricas — usar como referência para validação do procedimento
- **Premissa**: o dev (GGhiaroni) tem ciclo de dev local independente; staging hostinger-beta é onde **outros usuários** validam o trabalho dele

## Pendências para sessão 2 (DEFINE)

1. Web research adicional (4+ buscas — Etapa 5 da Regra #21)
2. Vault Escriba: **NÃO existe** — não há ADRs históricos pra consultar (Regra #56 não aplica em projeto sem vault — registrar como skip justificado)
3. `tuninho-qa audit-discovery` — pendente (não rodado nesta sessão para preservar tokens)
4. `tuninho-qa audit-ambiente` + `audit-sidecars` — pendente
5. Mapping requisito → tarefa (Regra #43): criar formalmente no DEFINE com base nos requisitos extraídos do prompt original
6. **Detalhamento técnico do "como" do rebuild com mínimo impacto** — fica como decisão da Fase 1 do plano (rsync vs git clone fresh, downtime tolerável, ordem de operações)

## Próximos passos imediatos (sessão 2)

A sessão 2 deve:
1. Ler `_1-xp_DISCOVERY_` (próximo artefato a gerar) integralmente
2. Ler este `_1_DISCOVERY_` para sintese
3. Ler `handoffs/HANDOFF_2026-05-06_sessao_01.yaml` para estado e pendências
4. Completar Web research pendente (Etapa 5)
5. Iniciar DEFINE (Etapas 6-8): plano com fases, contrato QA, mapping requisitos
6. GATE DEFINE com aprovação do operador
7. Decidir se segue EXECUTION na sessão 2 ou abre sessão 3

A operação foi planejada para 4 sessões (modo DDCE_EXPANSIVO_MULTI_SESSOES) mas pode condensar em menos sessões dependendo do progresso de tokens.
