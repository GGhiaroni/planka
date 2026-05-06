---
title: "Card 377530 — Validar fluxo de deploy automatico do staging"
aliases:
  - "Card 377530"
  - "Validar deploy staging"
tags:
  - a4tunados
  - tuninho/escriba
  - type/session
  - status/active
  - card-isolated
  - planka
  - staging
  - ci-cd
date: 2026-05-06
version: "1.0"
related:
  - "[[../../implementacao/staging-deploy-flow]]"
  - "[[../../decisoes/ADR-001-deploy-staging-cicd]]"
  - "[[../decisoes]]"
  - "[[../aprendizados]]"
  - "[[../report-executivo]]"
---

# Card 377530 — Validar fluxo de deploy automatico do staging

## Contexto

**Operador**: @victorgaudio
**Card no mural**: https://mural.a4tunados.com.br/cards/1769151526032377530
**Branch**: `card/feat/validar-fluxo-de-deploy-automa-377530`
**Modo**: pragmatico/conversacional (nao DDCE expansivo, nao fix-suporte). Card foi
delivery-cards sem parsing formal — _a4tunados/_operacoes/cards/ inexistente,
contrato YAML nao iniciado.

**Stack alvo**: Planka customizado (fork GGhiaroni) + ticket-form (Express + 2 forms)
deployado em hostinger-beta (76.13.239.198) sob domain `pdviewerp-stagging.fourtuna.com.br`.

**Origem**: Op 01 (`feat/deploy-planka-hostinger-redeploy`, merge a427d40b 2026-05-06)
deixou o staging configurado mas com 3 gaps que so apareceram quando o operador
tentou usar os formularios:

1. Workflow GitHub Actions documentado em `docs/deploy-staging.workflow.yml.template`
   mas nao instalado em `.github/workflows/` — push em `deploy/staging` nao triggava nada.
2. `ticket-form/src/planka.js` enviava `description: ""` (string vazia) em todas as
   chamadas POST `/api/lists/:listId/cards`, e o Planka recente rejeita com
   `E_MISSING_OR_INVALID_PARAMS`.
3. Board "Chamados" nao tinha as 8 labels de prioridade pre-criadas, e o `.env`
   tinha `PRIORITY_LABELS=BAIXA PRIORIDADE:,...` com IDs vazios apos o `:`.

## Plano Original

Operador comentou no card mural pedindo investigacao + fix + redeploy via
`deploy/staging` + validacao end-to-end dos forms. Sem plano DDCE formal —
investigacao guiada por evidencia + transparencia continua via mural.

## Prompts Utilizados

Registro completo: [[../prompts/2026-05-06_01_prompts]]

Resumo dos prompts do operador (4 turnos principais):

1. *"qual e a senha do admin para acessar a plataforma?"*
   → puxei `ADMIN_PASSWORD` do `.env` real do servidor staging via SSH e
     respondi no card mural.
2. *"os formularios nao estao funcionando corretamente, provavelmente pq
   precisam dos respectivos quadros e colunas criados [...]"*
   → investigacao multi-frente: codigo do ticket-form, .env do servidor,
     estado do Planka via API, reproducao da falha. Diagnostico postado
     no card com 2 root causes + plano de fix de 6 passos.
3. *"crie tudo que precisa ser criado [...] faca o deploy novamente pela
   branch deploy/staging e confira se esta funcionando"*
   → execucao das 7 acoes (boards, labels, .env, fix planka.js, fix deploy.sh,
     deploy via SSH-rsync, smoke E2E via Playwright).
4. *"como faco isso de ativar o workflow?"* + *"fiz pela UI e commitei"* +
   *"chama o escriba e devolve pra develop via gitflow d'a4"*
   → guidance de ativacao do workflow + monitoramento do primeiro deploy
     automatico real + trigger desta documentacao.

## Acoes Executadas

### Infraestrutura no Planka staging (via API REST como admin)

| # | Acao | Recurso | ID gerado |
|---|------|---------|-----------|
| 1 | Criar lista "Em Execucao" no board Demanda | `POST /api/boards/1769129205750039580/lists` | `1769175039879414836` |
| 2 | Criar lista "Concluido" no board Demanda | idem | `1769175040500171829` |
| 3 | Criar lista "Em Execucao" no board Chamados | `POST /api/boards/1769129206974776352/lists` | `1769175041297089590` |
| 4 | Criar lista "Executados" no board Chamados | idem | `1769175042253390903` |
| 5 | Criar label "BAIXA PRIORIDADE" (fresh-salad) | `POST /api/boards/1769129206974776352/labels` | `1769175262076863544` |
| 6 | Criar label "MEDIA GRAVIDADE" (egg-yellow) | idem | `1769175263628756025` |
| 7 | Criar label "URGENCIA" (pumpkin-orange) | idem | `1769175264635388986` |
| 8 | Criar label "EM TRATAMENTO" (lagoon-blue) | idem | `1769175265591690299` |
| 9 | Criar label "ATUALIZACAO DO TRATAMENTO" (antique-blue) | idem | `1769175266464105532` |
| 10 | Criar label "PENDENCIAS DE INSTALACAO" (desert-sand) | idem | `1769175267277800509` |
| 11 | Criar label "EM ESPERA" (muddy-grey) | idem | `1769175268074718270` |
| 12 | Criar label "MAXIMA PRIORIDADE" (berry-red) | idem | `1769175268947133503` |

### Configuracao no servidor (hostinger-beta:/opt/hostinger-beta/planka)

- Backup pre-edicao: `.env.bak-card377530-1746557998`
- Substituida linha `PRIORITY_LABELS=` com 8 IDs reais
- Restart `ticket-form` via `docker compose ... up -d --force-recreate ticket-form`

### Codigo (commits na branch `card/feat/validar-fluxo-de-deploy-automa-377530`)

| Commit | Mensagem | Arquivo |
|--------|----------|---------|
| `121c571d` | fix(ticket-form): omit empty description from Planka POST body | `ticket-form/src/planka.js` |
| `4acd9359` | fix(deploy): rebuild ticket-form on every deploy | `scripts/deploy.sh` |

(O `4acd9359` foi cherry-picked de `4029bfb2`/`48ec0cb7` que estavam em `deploy/staging`.)

### Workflow de CI/CD

- Tentativa minha de instalar `.github/workflows/deploy-staging.yml` foi BLOQUEADA pelo
  GitHub: token `gh` (scope `repo, gist, read:org`) sem `workflow` scope.
- Operador instalou via UI do GitHub: commit `310d47e2 Add GitHub Actions workflow for
  staging deployment` em `deploy/staging`.
- Push triggou run `25457526463` automaticamente.
- 9/9 steps completed/success em ~1m: Setup → Checkout → SSH → Rsync → deploy.sh →
  Smoke runner → Notify → Cleanup.
- URL: https://github.com/GGhiaroni/planka/actions/runs/25457526463

### Smoke validation

**API direto (post-deploy):**
- `POST /api/gforms` → `{"ok":true}` HTTP 200
- `POST /api/manutencao` → `{"ok":true,"os":"260506195206-017"}` HTTP 200

**E2E via Playwright:**
- Pedido de Artes: 13 campos preenchidos, submit, "Pedido enviado!" + card `TROCA DE ARTE`
  (`1769178564176905334`) com 14 custom field values em 4 groups.
- Chamado Tecnico: 8 campos preenchidos, submit, "Chamado aberto! OS Nº 260506190229-017"
  + card `Cliente Smoke E2E 377530` (`1769178818460779686`) com 12 custom fields no
  group "Dados do Chamado" + label "BAIXA PRIORIDADE" (`1769175262076863544`) aplicada.

**Prints**: 5 screenshots em `.playwright-mcp/0[1-5]-*.png`.

## Arquivos Modificados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `ticket-form/src/planka.js` | modificado | Omitir `description` do body quando vazia |
| `scripts/deploy.sh` | modificado | Rebuild ticket-form (`--build`) sempre |
| `.github/workflows/deploy-staging.yml` | criado (pelo operador via UI) | Workflow Actions ativado |
| `_a4tunados/env/.env` (servidor) | modificado | `PRIORITY_LABELS` com 8 IDs reais |

## Decisoes Tomadas

Documentadas em [[../decisoes]]:

- **D1** — Modo pragmatico conversacional aceitavel pra investigacao + fix em servico em
  producao staging (operador presente, plano comunicado no mural a cada passo).
- **D2** — Cores das 8 labels: paleta padrao Planka mapeada por intuicao
  (verde/amarelo/laranja/azul/etc). Sem solicitar input do operador.
- **D3** — Fix `description` vazia: omitir campo quando vazio em vez de mandar `null`
  (mais defensivo).
- **D4** — Atualizar `scripts/deploy.sh` pra rebuild ticket-form sempre. Sem `--build`,
  fixes em `ticket-form/src/` nunca chegariam ao container.
- **D5** — Cherry-pick em vez de merge no fluxo de fixes pra `deploy/staging` (mais
  cirurgico, evita arrastar Op 01 vault/sidecar pra staging branch).
- **D6** — Deploy manual via SSH+rsync+`deploy.sh` enquanto workflow Actions estava
  inativo (reproduz exato o que Actions faria — primeira validacao end-to-end).

## Resultado

✅ **Fluxo de deploy automatico validado end-to-end:**
- Push em `deploy/staging` → GitHub Actions detecta → rsync → `deploy.sh` (build+restart+
  healthcheck+smoke+rollback) → smoke runner → notify success.
- Run real `25457526463` rodou em 1m02s, 9/9 steps success.

✅ **Forms funcionando:**
- Pedido de Artes: cria card no board "Demanda" / lista "A Fazer" com 14 custom fields
  em 4 groups.
- Chamado Tecnico: cria card no board "Chamados" / lista "Em Espera" com 12 custom
  fields + label de prioridade aplicada.

✅ **Boards estruturados pro workflow tecnico:**
- Demanda: A Fazer → Em Execucao → Concluido
- Chamados: Em Espera → Em Execucao → Executados

## Proximos Passos

- [ ] Operador valida humanamente os forms em prod (mover card "Validando" → "Done")
- [ ] PR `develop → master` com os 2 fixes preservados (escriba sugere ao operador
      no fluxo git-flow d'a4 a seguir)
- [ ] Considerar arquivar/limpar os 4 cards de smoke test criados pelos forms
      durante validacao

## Consumo de Tokens

| Modelo | Tokens (delta) | Custo USD est. | Custo BRL est. |
|--------|----------------|----------------|----------------|
| `claude-opus-4-7[1m]` | 238.062 | $3.57 | R$20.35 |

> Metodologia: blended rate ~$15/MTok para Opus 4.7 (mix 70% cache read + 20% input +
> 10% output). Cambio: R$5,70/USD. Formula: `delta * 15 / 1_000_000`.
