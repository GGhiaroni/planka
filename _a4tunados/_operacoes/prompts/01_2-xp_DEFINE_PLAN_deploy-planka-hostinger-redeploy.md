---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: define_plan_expanded
versao: "1.0"
modo: DDCE_EXPANSIVO_MULTI_SESSOES
operador: victorgaudio
modelo: claude-opus-4-7[1m]
modo_execucao: AUTONOMO_CRITERIOSO
---

# Define Plan XP — Op 01 deploy-planka-hostinger-redeploy

> **Propósito**: capturar TODO contexto do DEFINE para auditoria, retomada cross-session
> e margem de manobra do EXECUTION. Princípio: **transbordo > escassez**.

---

## PARTE 1: ENTRADA DO DEFINE

Operador autorizou continuação na mesma sessão (não criou sessão 2 fresh) com mensagem (verbatim):

> "segue define aqui. precisamos saber como fazer esse deploy e quais instrucoes daremos para que o desenvolvedor passe a atualizar o deploy por la tb. mas primeiro precisamos fazer deploy com sucesso. se for possivel termosuma branch deploy/staging que ao ser commitada atualize o deploy nesse docker que estará no server será otimo. assim deixamos de forma muito pratica a instrucao para o dev fazer deploy, é só ele pushar pressa branch as atualizacoes que queira deployar. conseguimos? faça tudo de forma criteriosa mas autonoma. precisamos desse deploy logo no ar com essas configuracoes, porem com extremo cuidado e atencao para nao prejudicar outros servicos e projetos que ja estao rodando nesse server"

**Análise da mensagem**:
- Modo: AUTÔNOMO CRITERIOSO (Regra #61 ativa — gates auto-aprovados pela autorização macro)
- Requisito novo NÃO previsto no Discovery: branch `deploy/staging` que **atualiza deploy automaticamente quando recebe push**
- Restrições mantidas: "extremo cuidado" + "não prejudicar outros serviços e projetos"
- Urgência: "precisamos desse deploy logo no ar"

Tokens início DEFINE: **524,171 (52.4%)**

## PARTE 2: ALTERNATIVAS DE ARQUITETURA CI/CD CONSIDERADAS

| # | Estratégia | Prós | Contras | Decisão |
|---|---|---|---|---|
| A | **GitHub Actions + SSH rsync** | Zero infra extra, audit trail, gerenciamento de secrets, dev usa fluxo normal de git | Precisa secret SSH key configurado pelo operador via UI GitHub | **ESCOLHIDA** |
| B | Webhook custom + endpoint no servidor | Self-contained, controle total | Precisa daemon HTTP próprio, mais complexo, segurança crítica | descartada (complexidade) |
| C | Polling cron no servidor | Simples, zero secrets externos | Delay de minutos entre push e deploy, processo extra rodando | descartada (UX ruim) |
| D | Self-hosted runner | Velocidade máxima, sem cold-start | Daemon extra no servidor (viola "mínimo impacto") | descartada |
| E | Watchtower + image registry | Padrão moderno, decoupled | Precisa CI separado para build da imagem, complexidade extra | descartada |

**Por que A é a melhor**:
- Cumpre "mínimo impacto" (zero processo extra no servidor)
- Cumpre "logo no ar" (deploy em ~3-5 min do push)
- Cumpre "instrução pro dev" (`git push origin deploy/staging`)
- Reversível (revert commit + push)
- Auditável (Actions UI mostra histórico)

## PARTE 3: DETALHAMENTO TÉCNICO POR TAREFA

### Fase 1 detalhada

**T1.1 — pg_dump preventivo**
```bash
ssh root@76.13.239.198 "
  mkdir -p /opt/hostinger-beta/backups
  docker exec planka-postgres-1 pg_dump -U postgres -Fc planka > /opt/hostinger-beta/backups/planka-pre-redeploy-\$(date +%Y%m%d-%H%M%S).dump
  ls -lh /opt/hostinger-beta/backups/ | tail -3
"
```

**T1.2 — rsync local→servidor**
```bash
# CRÍTICO: --exclude='.env' preserva credentials
# CRÍTICO: --exclude='_a4tunados' não envia artefatos DDCE
# CRÍTICO: --delete remove arquivos que sumiram (importante pra refletir branch desenvolveu)

rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='_a4tunados' \
  --exclude='.claude' \
  --exclude='.mcp.json' \
  --exclude='.vscode' \
  --exclude='.dockerignore' \
  /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/planka/ \
  root@76.13.239.198:/opt/hostinger-beta/planka/
```

Validação após:
```bash
ssh root@76.13.239.198 "
  cd /opt/hostinger-beta/planka
  ls .env  # deve EXISTIR (preservado)
  cat package.json | grep version  # deve mostrar 2.1.0
  ls -la docker-compose*.yml  # deve mostrar 4 arquivos
  ls -la scripts/ 2>/dev/null  # checar se rsync trouxe novos scripts
"
```

**T1.4 — build da imagem** (riscos críticos detalhados)

Passos internos do build:
1. `docker compose ... build planka` lê `Dockerfile`
2. Multi-stage: client builder → backend overlay
3. `npm ci --omit=dev` no server (espera package-lock.json válido)
4. Copia `client/dist` build artifacts pra `/app/public`

**Riscos**:
- npm ci pode falhar se `package-lock.json` divergiu de `package.json` (raro mas possível em fork)
- `node-gyp` pode falhar para deps nativas (bcrypt, sharp) — se acontecer, precisa instalar build-essential no contexto
- Tempo: 5-10 min se cache hit; 15-25 min cold

**Mitigação se falhar**:
- Tag imagem atual antes: `docker tag planka-custom:latest planka-custom:pre-redeploy`
- Se build OK mas restart falha, voltar imagem: `docker tag planka-custom:pre-redeploy planka-custom:latest && docker compose up -d --force-recreate planka`

**T1.5 — restart preservando volumes**

`--force-recreate planka` recria SOMENTE container `planka`, não toca `postgres-data` volume nem `planka-data` volume. Postgres permanece rodando, o que evita reset de DB.

**Downtime esperado**: 30s-1min (tempo de container parar e novo subir healthcheck)

**T1.7 — Validação E2E multi-feature**

Os 5 commits do dev a validar (resgatar do `_1-xp_` PARTE 4 ou git log local):
- `0eb2a53e` Funcionalidade de coluna colapsada
- `dc9f6cc4` Drag-and-drop cards dentro da mesma coluna
- `de1eb9d7` 3 opções de altura de linha (view planilha)
- `25a49d8a` Seed coluna 'Falar com o cliente' em boards Design
- `9fae494b` Feature de log/histórico do board

Como validar cada um:
1. **Coluna colapsada**: criar board com listas, clicar no botão de colapse de uma coluna, verificar que ela colapsa e o conteúdo desaparece
2. **Drag intra-coluna**: criar 3 cards, arrastar um pra cima/baixo dentro da mesma coluna, verificar nova ordem
3. **3 opções altura linha**: ir para view planilha, alternar entre as 3 opções, verificar mudança visual
4. **Seed coluna 'Falar com o cliente'**: criar board com tipo "Design", verificar que coluna aparece automaticamente (pode requer re-seed via `npm run db:seed` se tiver script novo)
5. **Log do board**: abrir histórico do board, verificar lista de eventos (criação de cards, moves, etc)

Multi-viewport:
- Desktop 1366x800: drag-and-drop funcional, log visível
- Mobile 375x667: tap+hold pra drag (Regra #44 caso (a) hover-controles)

### Fase 2 detalhada

**T2.2 — Login admin via Playwright**

Steps Playwright:
```python
await page.goto('https://pdviewerp-stagging.fourtuna.com.br/')
await page.fill('input[name="emailOrUsername"]', os.getenv('ADMIN_USERNAME'))
await page.fill('input[name="password"]', os.getenv('ADMIN_PASSWORD'))
await page.click('button[type="submit"]')
await page.wait_for_url('**/dashboard')
# screenshot
```

Como obter credentials: `ssh root@76.13.239.198 "grep -E 'ADMIN_USERNAME|ADMIN_PASSWORD' /opt/hostinger-beta/planka/.env"` → expor no log do agent só pra essa tarefa, não persistir.

**T2.3 — Captura de IDs**

Usar Planka API:
```bash
TOKEN=$(curl -fsSL -X POST https://pdviewerp-stagging.fourtuna.com.br/api/access-tokens \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.item')

curl -fsSL -H "Authorization: Bearer $TOKEN" https://pdviewerp-stagging.fourtuna.com.br/api/projects | jq
```

Salvar JSON com IDs em `fase_02/evidencias/planka-ids-capturados.json`.

**T2.4 — Atualizar .env**

Comando idempotente:
```bash
ssh root@76.13.239.198 "
  cd /opt/hostinger-beta/planka
  cp .env .env.pre-ticket-form-fix-\$(date +%s)
  # usar python ou sed para atualizar specific keys
  python3 -c \"
import re
with open('.env','r') as f: c = f.read()
c = re.sub(r'^PLANKA_LIST_ID=.*$', 'PLANKA_LIST_ID=$NEW_LIST_ID', c, flags=re.M)
# ... outros
with open('.env','w') as f: f.write(c)
\"
"
```

### Fase 3 detalhada

**T3.1 — SSH key dedicada**

```bash
# No servidor B (não no workspace local — chave gerada lá)
ssh root@76.13.239.198 "
  ssh-keygen -t ed25519 -C 'github-actions-deploy-planka-staging' -f /root/.ssh/deploy_planka_actions -N ''
  cat /root/.ssh/deploy_planka_actions.pub >> /root/.ssh/authorized_keys
  echo 'PRIVATE KEY:'
  cat /root/.ssh/deploy_planka_actions
"
```

Output captured: private key vai pra GitHub Secret. Idealmente, restringir authorized_keys com `command="..."`, `from="*.actions.githubusercontent.com"`, mas isso é v2.

**T3.3 — Script `scripts/deploy.sh`**

```bash
#!/usr/bin/env bash
# Script de deploy invocado pelo GitHub Actions via SSH.
# Roda no servidor hostinger-beta dentro de /opt/hostinger-beta/planka/

set -euo pipefail

cd /opt/hostinger-beta/planka

LOG_PREFIX="[deploy.sh $(date +%Y-%m-%dT%H:%M:%S)]"
log() { echo "$LOG_PREFIX $*"; }

log "1/6 Backup pg_dump preventivo"
mkdir -p /opt/hostinger-beta/backups
BACKUP="/opt/hostinger-beta/backups/planka-pre-deploy-$(date +%Y%m%d-%H%M%S).dump"
docker exec planka-postgres-1 pg_dump -U postgres -Fc planka > "$BACKUP" || {
  log "BACKUP FAILED — aborting"
  exit 1
}
log "Backup OK: $BACKUP ($(du -h $BACKUP | cut -f1))"

log "2/6 Tag imagem atual como pre-deploy (rollback safety)"
docker tag planka-custom:latest planka-custom:pre-deploy 2>/dev/null || log "(no current image — first deploy?)"

log "3/6 Build nova imagem"
docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env build planka

log "4/6 Restart planka container"
docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env up -d --force-recreate planka

log "5/6 Wait for healthcheck"
for i in $(seq 1 60); do
  STATUS=$(docker inspect planka-planka-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  [ "$STATUS" = "healthy" ] && { log "Container healthy after ${i}s"; break; }
  sleep 1
  [ $i -eq 60 ] && { log "TIMEOUT — container nao ficou healthy em 60s"; exit 2; }
done

log "6/6 Smoke test HTTP"
HTTP_CODE=$(curl -fsSL -o /dev/null -w "%{http_code}" https://pdviewerp-stagging.fourtuna.com.br/ || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  log "SMOKE FAILED: HTTP $HTTP_CODE"
  log "Rolling back: tagging pre-deploy as latest and restarting"
  docker tag planka-custom:pre-deploy planka-custom:latest
  docker compose ... up -d --force-recreate planka
  exit 3
fi

log "DEPLOY OK ✓"
```

**T3.4 — Workflow `.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy Staging
on:
  push:
    branches: [deploy/staging]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.STAGING_DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.STAGING_DEPLOY_HOST }} >> ~/.ssh/known_hosts 2>/dev/null

      - name: Rsync code
        run: |
          rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            --exclude='_a4tunados' \
            --exclude='.claude' \
            --exclude='.mcp.json' \
            --exclude='.vscode' \
            -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            ./ ${{ secrets.STAGING_DEPLOY_USER }}@${{ secrets.STAGING_DEPLOY_HOST }}:/opt/hostinger-beta/planka/

      - name: Run deploy script
        run: |
          ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
            ${{ secrets.STAGING_DEPLOY_USER }}@${{ secrets.STAGING_DEPLOY_HOST }} \
            "bash /opt/hostinger-beta/planka/scripts/deploy.sh"

      - name: Smoke test from runner
        run: curl -fsSL -o /dev/null -w "Smoke %{http_code}\n" https://pdviewerp-stagging.fourtuna.com.br/

      - name: Notify on failure
        if: failure()
        run: echo "Deploy failed! Check logs above."
```

## PARTE 4: SECRETS NECESSÁRIOS

Operador precisa adicionar via UI do GitHub (`https://github.com/GGhiaroni/planka/settings/secrets/actions`):

| Secret | Valor | Como obter |
|---|---|---|
| `STAGING_DEPLOY_SSH_KEY` | private key gerada em T3.1 | output do `cat ~/.ssh/deploy_planka_actions` |
| `STAGING_DEPLOY_HOST` | `76.13.239.198` | conhecido |
| `STAGING_DEPLOY_USER` | `root` (v1) ou usuário deploy dedicado (v2) | escolha do operador |

## PARTE 5: TESTES E2E DE EXECUTION (per-fase)

Já detalhados em PARTE 3 + plano formal. Princípios:
- Multi-viewport (desktop + mobile)
- Multi-feature (5 commits do dev)
- Interpretação visual de TODOS screenshots (Read tool — Licão #31)
- Console messages limpos
- Evidências em fase_NN/evidencias/

## PARTE 6: ESTADO ATUAL DO REPO E COMPOSE

### Branch local (workspace)
- branch: `feat/deploy-planka-hostinger-redeploy`
- base: `develop@89d798ad`
- features pendentes (não-pushed ainda): só os artefatos DDCE em `_a4tunados/_operacoes/projetos/01_*` (nada de código de produto)

### Pasta no servidor B
- `/opt/hostinger-beta/planka/` — owner 501:staff
- 4 docker-compose files
- `.env` populado (mas PLANKA_LIST_ID provavelmente vazio/inválido)
- DEPLOY.md (222 linhas)

## PARTE 7: PENDÊNCIAS QUE A EXECUTION VAI RESOLVER

1. Por que `users` não existe no DB? — investigar via `\dt` na T1.5 ou T2.2
2. Como handle migrations entre versions? — Planka tem `npm run db:migrate` documented em DEPLOY.md
3. PLANKA_LIST_ID exato no .env atual — investigar em T2.1
4. Tempo real do build — observar T1.4
5. Comportamento dos features dev em mobile — observar T1.7 viewport mobile

## PARTE 8: CONFIGURAÇÃO FINAL DE INFRA

| Componente | Estado pós-Fase 3 |
|---|---|
| Imagem Docker | rebuildada com develop atual |
| Container planka | UP healthy 127.0.0.1:1338 |
| Container postgres | UP (volume preservado) |
| Container ticket-form | UP healthy 127.0.0.1:3002 (apos T2.5) |
| nginx do host | NÃO TOCADO (configs já corretas) |
| SSL certs | NÃO TOCADO (auto-renew) |
| Branch `deploy/staging` | criada no remote, primeira push triggera deploy |
| GitHub Actions workflow | configurado, testado em primeiro deploy |
| Script `scripts/deploy.sh` | no repo, executável |
| `DEPLOY-STAGING.md` | docs completas pro dev |
| Sidecars devops | atualizados com info real |

## PARTE 9: CRITÉRIOS DE ENCERRAMENTO

A operação só vai pra Comlurb seal quando:
1. Staging acessível e funcional (Fase 1 GATE PASS)
2. Ticket-form funcional (Fase 2 GATE PASS)
3. CI/CD funcional end-to-end testado (Fase 3 GATE PASS)
4. Validação humana operador
5. tuninho-qa audit-gate-final PASS
6. tuninho-escriba executado (gera vault `_a4tunados/docs_planka/`)
7. tuninho-git-flow-dafor executado (PR feat → develop, merge, sync)

## PARTE 10: PROMPT DO OPERADOR SOBRE ESTE PLANO

Operador autorizou modo autônomo criterioso. Plano será apresentado e perguntado apenas sobre pontos críticos específicos antes da execução (ex: confirmar autorização para rsync que sobrescreve pasta no servidor, confirmar SSH key generation pra Actions). Demais decisões serão tomadas autonomamente com amendment registrado no contrato.

---

## APENDICE: REFERÊNCIAS

### Comandos canônicos compactos

```bash
# Acesso ao servidor B
ssh root@76.13.239.198

# Compose com override
cd /opt/hostinger-beta/planka
docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env <CMD>

# Backup
docker exec planka-postgres-1 pg_dump -U postgres -Fc planka > backup.dump

# Restore (em emergência)
docker exec -i planka-postgres-1 pg_restore -U postgres -d planka < backup.dump

# Logs
docker logs --tail 100 -f planka-planka-1
```

### Decisões de autorização macro

Operador autorizou:
- ✓ Acessar servidor B via SSH como root
- ✓ Modificar arquivos em `/opt/hostinger-beta/planka/` via rsync
- ✓ Modificar `.env` para corrigir PLANKA_LIST_ID
- ✓ Criar/modificar `/opt/hostinger-beta/planka/scripts/`
- ✓ Rebuild imagem Docker
- ✓ Restart container planka
- ✓ Push branch `deploy/staging` no repo
- ✓ Criar arquivos `.github/workflows/deploy-staging.yml` no repo
- ✓ Criar `DEPLOY-STAGING.md` no repo
- ✓ Atualizar sidecars devops

Operador NÃO autorizou ainda (Regra #51 — write em DB prod):
- ✗ INSERT/UPDATE/DELETE em DB do staging com dados de exemplo (precisa GATE explícito)
- ✗ Modificar configs de outros projetos no servidor B (proibido)
- ✗ Tocar `/etc/nginx/` do servidor B (preservar)
- ✗ Modificar SSH keys de outros usuários (preservar `/root/.ssh/authorized_keys` existente — só adicionar)
