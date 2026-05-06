# Tuninho DevOps Hostinger v5.0.1

## v5.0.1 — Sessão 4 QA EXTREMO patch deploy pattern (Card 1768281088850920655 — 2026-05-06)

**Bump pos-mortem absorvendo 2 aprendizados**:

### 1. Patch deploy intra-versão (sem bump número)
Padrão usado em S3: deploy v0.6.0 + 2 polish detectados em E2E + redeploy patch (mesma versão 0.6.0). Deploy patch é tarball + SCP + extract + npm install --include=dev + npm run build + npm ci --production + pm2 restart. PM2 restart obrigatório (não reload — Lição #L1.1 db.ts migration). Não muda versão usuário-facing.

### 2. NODE_ENV=production no ambiente herdado bloqueia devDeps
`env -u NODE_ENV npm install --include=dev` é workaround necessário no servidor PROD pra build (TypeScript/devDeps). Sem isso, build falha por dependências ausentes. Documentar no sidecar `projects/hostinger-beta/tuninho-ai/config.md`.

### Aplicação concreta
- Sub-check `audit-devdeps-installed-pre-build` — confirma typescript + outras devDeps presentes antes de `npm run build`
- Patch deploy doc explícito em SKILL.md (workflow alternativo ao deploy versão completo)

---

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

# Tuninho DevOps Hostinger v3.5.2

## v3.5.2 — Reincidencia L-OP07-1 + 4 fontes do board Dev tuninho.ai + dev-bypass redirect (Card 134 — 2026-04-29)

**3 aprendizados consolidados do Card 134 (tuninho.ai, 2026-04-29):**

### L-OP07-1 reincidente — `pm2 restart --update-env` deve ser banido em projetos da hostinger-alfa

A v3.4.1 ja registrava que `pm2 restart --update-env` nao e confiavel em services cluster com env no `ecosystem.config.cjs` — o restart herda env do parent PM2 daemon em vez de recarregar do file. Eu reincidi nessa armadilha no card 134: `pm2 restart claude-sessions-service --update-env` derrubou o servico com `EADDRINUSE :3847` (porta antiga, nao a 3848 do ecosystem). Custo: ~5min de debug + corrupcao do estado PM2. Fix: `pm2 delete + pm2 start ecosystem.config.cjs` (sem `--update-env`).

**Reforco:** Em qualquer fluxo onde o agente faz restart de service via PM2 nesta skill (Stage 5.13, hotfixes pos-deploy, etc), DEVE usar **`pm2 delete + pm2 start ecosystem.config.cjs`** como padrao em vez de `pm2 restart --update-env`. A exceptio (`pm2 restart` sem --update-env) so vale quando o env do file NAO mudou.

### 4 fontes de conteudo do board Dev tuninho.ai (Licao L-CARD134-1)

Card do board Dev (`boards.kind = 'dev'` em tuninho.ai) tem **4 fontes** de conteudo, nao 2. Investigacao ou debug de card deve cobrir as 4:

1. `chats.title` — titulo do card (header H1 do card UI)
2. `chats.description` — descricao livre (campo TEXT, ate 2000 chars; setado via API `setCardDescription` ou pelo proprio admin/user na UI)
3. `messages` — historico do chat com Claude (pode estar vazio em cards "puramente declarativos")
4. `dev_card_comments` — thread de comentarios admin/tuninho (e onde o `@tuninho` mention dispara o webhook outbound pro CSS)

**Sidecar do tuninho-ai atualizado** com nota dessa estrutura — ver
`projects/hostinger-beta/tuninho-ai/config.md`. Util pra qualquer agente
que va investigar bugs no board Dev a partir do servidor (via SSH+SQL).

**Bug do payload v2 do webhook resolvido na mesma operacao**: payload outbound `tuninho.ai → claude-sessions-service` agora inclui `chatTitle + chatDescription + recentMessages` (v0.5.28+), entao a partir de agora a sessao Claude remota chega com contexto completo do card, sem precisar buscar via SSH+SQL no servidor.

### Hotfix pattern: `dev-bypass` atras de nginx exige `x-forwarded-host`

Quando ha endpoint dev-bypass em projetos hostinger-beta (template em `references/dev-bypass-template.md`), o redirect deve usar `req.headers.get('x-forwarded-host')` + `x-forwarded-proto` em vez de `req.url`. Atras do nginx reverse proxy, `req.url` retorna `https://localhost:3100/{redirect}` em vez do dominio externo, causando `ERR_CONNECTION_REFUSED` no browser do operador. Aprendizado documentado pra atualizar o `references/dev-bypass-template.md` (TODO: bumpar essa reference em proxima manutencao).

---

## v3.5.1 — Modo `audit-data-integrity` + multi-conta como falsa percepcao conhecida (Card 1762659275664000472 — 2026-04-27)

**Aprendizado canonico L-CARD1762-3** (card 1762659275664000472, Mural de Dev — tuninho.ai):

Operador apos o segundo deploy (v0.6.1) reportou:

> "os cards no meu quadro pessoal de admin nao estao aparecendo. nao é a primeira
> vez que isso acontece e muito me preocupa pois algum fluxo de backup está
> causando essa incosistencia. investigue por favor para resolvermos e analise
> criteriosamente se algum usuaruo nao foi afetado por isso tb."

Apos investigacao forense (DB current vs 4 backups de hoje), confirmou-se:
- **Zero perda de dados** em todos os 6 users do tuninho.ai
- Operador estava logado com `victorgaudio@4tuna.com.br` (user_id=2, 3 colunas/6 cards) em vez de `victorgaudio@gmail.com` (user_id=1, 5 colunas/43 cards)
- A diferenca de tamanho do board entre as 2 contas dele gerou falsa percepcao de "perda"

### Novo modo `audit-data-integrity` (complementa Stage 9.5 da v3.5.0)

**Diferenca vs Stage 9.5**: Stage 9.5 dispara automaticamente em rollback durante deploy
quando ha suspeita de regressao do DB. **`audit-data-integrity`** e invocacao MANUAL/
proativa quando operador relata suspeita de "perda de dados", "cards sumiram", "boards
inconsistentes" pos-deploy — antes mesmo de pensar em rollback.

**Procedimento OBRIGATORIO antes de qualquer acao corretiva**:

1. SSH no servidor e rodar SELECT comparativo entre DB current + N backups recentes:
   ```bash
   for BK in $(ls -td /opt/hostinger-{beta,alfa}/backups/{projeto}-pre-* | head -5); do
     [ -f "$BK/{db_path}" ] || continue
     echo "--- $(basename $BK) ---"
     sqlite3 "$BK/{db_path}" "
       SELECT u.email, u.id, COUNT(DISTINCT b.id) bds, COUNT(DISTINCT col.id) cols,
              COUNT(DISTINCT c.id) cards
       FROM users u
       LEFT JOIN boards b ON b.user_id = u.id
       LEFT JOIN columns col ON col.board_id = b.id
       LEFT JOIN cards c ON c.column_id = col.id
       WHERE u.role IN ('admin','user')
       GROUP BY u.id ORDER BY u.id;"
   done
   echo "--- ATUAL ---"
   sqlite3 {APP}/data/{db} "SELECT u.email, u.id, COUNT(DISTINCT b.id) bds, COUNT(DISTINCT col.id) cols, COUNT(DISTINCT c.id) cards FROM users u LEFT JOIN boards b ON b.user_id = u.id LEFT JOIN columns col ON col.board_id = b.id LEFT JOIN cards c ON c.column_id = col.id WHERE u.role IN ('admin','user') GROUP BY u.id ORDER BY u.id;"
   ```

2. Apresentar tabela ao operador:
   - Linhas: cada user com role admin/user
   - Colunas: contagens em cada backup + atual
   - **Destacar divergencias** (cell colorida/marcador `⚠️`)

3. **AGUARDAR confirmacao do operador** antes de qualquer acao corretiva. Sub-checks
   adicionais possiveis:
   - "Em qual conta voce esta logado?" (cenario multi-conta — ver abaixo)
   - "Compare o que voce esta vendo com qual board especifico?"
   - "Voce trocou de board (kind=user vs kind=dev) recentemente?"

4. **SO** apos diagnostico claro + confirmacao do operador: executar acao corretiva
   (com GATE — em modo `--autonomous`, ainda exige confirmacao no card mural ou
   sessao Claude Code, conforme Regra Inviolavel #51 do tuninho-ddce v4.6.0).

### Cenarios de falsa percepcao conhecidos

| Cenario | Sintoma | Diagnostico |
|---------|---------|-------------|
| **Multi-conta** (ex: gmail + 4tuna do mesmo operador) | "Sumiu cards" mas backups identicos | Operador logou com conta secundaria que tem menos dados que a primaria |
| **Multi-board** (ex: kind=user vs kind=dev no mesmo user) | "Board com menos colunas que esperado" | Operador trocou pra board Dev (4 colunas default) achando que era o pessoal |
| **Cache do navegador** | "Cards sumiram apos deploy" | Bundle client antigo + API nova — hard reload (Ctrl+Shift+R) resolve |
| **Conflito de SSO/Firebase** | "Logo no Google e vou pra waitlist" | Email logado nao bate com email cadastrado como user/admin no DB |

### Anti-padrao classico (cometido pelo agente nesta operacao)

> "Investiguei o DB, encontrei o chat 85 numa coluna 'errada', movi pra coluna
> 'certa' antes do operador confirmar."

O agente moveu o chat 85 do board Dev pro board pessoal do user 2 sem confirmar.
Operador respondeu *"Cara. Esse foi meu chat que contém teste de comentário?
Era pra ser em dev mesmo"* — tive que reverter.

**Caminho correto**: investigar → relatar hipotese + 2-3 cenarios alternativos
no card mural → **aguardar resposta** → executar. Mesmo "achando obvio".
Esta regra esta formalizada na **Regra Inviolavel #51 do tuninho-ddce v4.6.0**
(write em prod DB exige GATE explicito). `audit-data-integrity` e a contraparte
no devops-hostinger: investigacao read-only com tabela comparativa antes de
qualquer fix.

### Sub-check QA futuro

`audit-data-integrity-pre-action`: antes de qualquer UPDATE/DELETE em prod
DB que afete dados do operador, verifica se o agente postou hipotese no card
mural + recebeu confirmacao explicita do operador em ate 5 turnos. Se nao:
FAIL bloqueante.

---

## v3.5.0 — Stage 9.5 NOVO + Regra Inviolavel #42 (Diagnostico de Regressao DB + comparacao OBRIGATORIA de IDs em restore) (2026-04-25)

**Aprendizado canonico do Card 1761271429099161009 (Anexos, tuninho.ai, 2026-04-25):**

> Operador: "PUTA MERDA. Se recuperou o BD em estado de antes, pode ter recuperado
> algo desatualizado OU ENTAO PERDIDO DADO de algum user teste que esta usando essa
> plataforma simulando producao. PELAMOR" + "Fizemos varias operacoes hj tb. Perder
> algum trabalho delas tb vai ser foda de aceitar"

Durante a janela de validacao do card, foi detectada uma regressao do DB causada
por operacao paralela. O agente fez restore de backup mas NAO comparou explicitamente
IDs presentes/ausentes ANTES de declarar SUCCESS — operador teve que pedir 2x
confirmacao explicita de zero perda. Comparacao foi feita corretamente apos pedido,
mas devia ter sido OBRIGATORIA na primeira passagem.

### Mudancas v3.5.0

**1. Nova Stage 9.5 — Diagnostico de Regressao DB** (entre Stage 9 Level 1 e Level 2):
protocolo formal pre-restore que compara contagens em TODOS os backups disponiveis
para identificar QUANDO a regressao ocorreu, antes de qualquer acao destrutiva.

```bash
SSH="ssh -i {ssh_key} root@{server_ip}"
DB=/opt/hostinger-{host}/{projeto}/data/{db_filename}

echo "=== Tabela cronologica de contagens ==="
for backup in /opt/hostinger-{host}/backups/{projeto}-*; do
  BDB=$backup/{db_filename}
  if [ -f $BDB ]; then
    echo "## $(basename $backup)"
    for t in {tabelas_principais}; do
      c=$(sqlite3 $BDB "SELECT count(*) FROM $t;" 2>/dev/null)
      echo "  $t: $c"
    done
  fi
done
```

Saida obrigatoria: tabela cronologica destacando o ponto de inflexao da regressao.

**2. Nova Regra Inviolavel #42 — Comparacao OBRIGATORIA de IDs em todo restore**:

ANTES de qualquer `mv` de backup_target para DB ativo (em Stage 9 Levels 1-3):

```bash
for t in {tabelas_principais}; do
  sqlite3 $SAFETY 'SELECT id FROM '$t > /tmp/safety_$t.txt
  sqlite3 $TARGET 'SELECT id FROM '$t > /tmp/target_$t.txt
  PERDIDO=$(comm -23 <(sort /tmp/safety_$t.txt) <(sort /tmp/target_$t.txt))
  if [ -n "$PERDIDO" ]; then
    echo "[BLOCK] $t: IDs PERDIDOS no restore: $PERDIDO"
  fi
done
```

- Se houver QUALQUER ID perdido sem confirmacao explicita do operador → BLOQUEAR
- Apresentar tabela "perdido vs ganho" no autonomous-report
- Em modo autonomo: ABORTAR restore e gravar `data_loss_blocked.log` se houver
  IDs perdidos > 0 sem `accepted_data_loss: true` no contrato

**3. Sub-check QA `audit-restore-data-integrity`** (delegacao para tuninho-qa v0.10+):
cruza safety_backup vs target_backup vs DB atual e BLOQUEIA seal de restore se
detectar IDs unicos no DB atual que sumiriam.

> **a4tunados-ops-suite** — Esta skill faz parte do pacote de operacoes a4tunados.
> Mantenha-a atualizada via `tuninho-updater`.

> Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Multi-Host Support (v3.0.0 — Op 25)

A partir de v3.0.0, esta skill suporta **multiplos servidores Hostinger** via parametrizacao.
O nome anterior era `tuninho-devops-hostinger-alfa` (v2.x) e foi renomeado para
`tuninho-devops-hostinger` (v3.x) como parte do refactor que introduz multi-host.

### Servidores suportados (2026-04-15)

| Servidor | IP | Status | Role (atual) | Role (futuro) |
|---|---|---|---|---|
| **hostinger-alfa** | 31.97.243.191 | active | multi_project_primary | dev/staging/homologacao |
| **hostinger-beta** | 76.13.239.198 | bootstrapping | new_prod_bootstrap | producao |

### Como a skill resolve o servidor alvo

**Fonte da verdade**: `_a4tunados/deploys/servers-registry.yaml` (schema v2.0.0)

**Stage 0** de cada operacao de deploy resolve estas variaveis a partir do registry:
- `${SERVER_NAME}` — `hostinger-alfa` ou `hostinger-beta`
- `${SERVER_IP}` — resolvido via `servers.{name}.ip`
- `${SSH_KEY}` — resolvido via `servers.{name}.ssh.key_path_local`
- `${SSH_USER}` — resolvido via `servers.{name}.ssh.user` (padrao: root)
- `${BASE_PATH}` — resolvido via `servers.{name}.paths.base`
- `${NGINX_SITES}` — resolvido via `servers.{name}.paths.nginx_sites`
- `${BACKUPS_PATH}` — resolvido via `servers.{name}.paths.backups`

Operador deve responder no inicio de cada operacao **qual servidor alvo** — se ambiguo,
perguntar explicitamente. Para `tuninho-devops-hostinger-alfa` (nome antigo), manter
compatibilidade: o trigger resolve `SERVER_NAME=hostinger-alfa` automaticamente.

### Sidecars por servidor + projeto

A partir de v3.0.0, sidecars sao organizados por servidor:

```
.claude/skills/tuninho-devops-hostinger/projects/
├── hostinger-alfa/
│   ├── tuninho-ide-web/config.md
│   ├── maestrofieldmanager/config.md
│   ├── chooz_2026/config.md
│   ├── claude-sessions-service/config.md
│   ├── familygames/config.md
│   ├── weplus_prototipo/config.md
│   └── orquestravoadora/config.md
├── hostinger-beta/
│   └── mural/config.md    # primeiro projeto do beta (Op 25)
└── README.md
```

### Referencias adicionadas em v3.0.0

- `references/project-profiles.md` — 4 perfis estruturais (light, static, systemd_flask, full-stack)
- `references/sidecar-templates/full-stack.md` — template para projetos com DB externo + runtime externo + uploads

### Compatibilidade retroativa

Arquivos historicos em `_a4tunados/_operacoes/` e `_a4tunados/docs_*/` continuam referenciando
`tuninho-devops-hostinger-alfa` (nome antigo) — nao foram atualizados. Esses arquivos sao
snapshots imutaveis do momento em que foram criados. Para referencias vivas (outras skills,
scripts, codigo), use o nome atual `tuninho-devops-hostinger`.

---

---

## Resolucao de Contexto do Projeto (OBRIGATORIA)

Antes de iniciar qualquer etapa operacional:

1. **Identificar projeto**: `git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||'`
2. **Verificar vault**: `_a4tunados/docs_{nome}/MOC-Projeto.md`
   - Se existe: ler para entender stack, integracoes, decisoes, historico
   - Se NAO existe: alertar operador para rodar escriba primeiro
3. **Carregar sidecar** da skill (se existir em `projects/`)
4. **Carregar env-catalog** de tuninho-devops-env (se existir)

> **REGRA DE OURO:** Nenhum conhecimento sobre o projeto deve ser priorizado para
> ficar na memoria do Claude Code. Toda informacao relevante deve residir nas skills
> (SKILL.md + references/), sidecars (projects/), ou vault (docs_{projeto}).
> O vault do escriba e a FONTE PRINCIPAL de informacoes sobre o projeto.

---

## Missao

Quatro pilares inviolaveis:

1. **ZERO perda de dados** — triple verification em cada etapa
2. **MINIMO downtime** — janela de deploy otimizada
3. **MAXIMO confirmacoes humanas** — gates em pontos criticos
4. **ZERO impacto cross-project** — deploy do projeto X NUNCA deve afetar projeto Y

---

## Contexto Operacional — Servidor Hostinger Alfa

| Item | Valor |
|------|-------|
| **Nome** | hostinger-alfa |
| **Provider** | Hostinger VPS |
| **IP** | 31.97.243.191 |
| **SSH** | `ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191` |
| **Base path** | `/opt/hostinger-alfa/` |
| **Nginx configs** | `/opt/hostinger-alfa/nginx/sites/` |
| **Backups** | `/opt/hostinger-alfa/backups/` |

### Projetos Ativos

Carregar de `_a4tunados/deploys/hostinger-alfa/server-registry.json` no inicio de cada deploy.
Se o arquivo nao existir → assumir bootstrap (primeiro deploy neste projeto).

### Historico de Deploys

| Deploy | Projeto | Data | Versao | Downtime | Incidentes |
|--------|---------|------|--------|----------|------------|
| Bootstrap | batutamanager | 2026-03-28 | v0.1.0 | N/A | 4 (resolvidos) |
| Incremental | maestrofieldmanager | 2026-03-29 | v0.2.0 | ~30s | 5 (resolvidos) |
| Bootstrap | tuninho-ide-web | 2026-03-30 | v0.1.0 | N/A | 2 (resolvidos) |
| Bootstrap | familygames | 2026-04-04 | v2.0.0 | N/A | 0 |

---

## Credenciais e Acesso

As credenciais de acesso ao servidor ficam em `_a4tunados/env/hostinger/` dentro de cada projeto:

- `.env.hostinger` — IP, senha root, tipo de chave SSH
- `id_ed25519` — chave privada SSH (DEVE ter permissao 600)
- `id_ed25519.pub` — chave publica SSH

**REGRA CRITICA**: Antes de qualquer conexao SSH, verificar:
```bash
chmod 600 _a4tunados/env/hostinger/id_ed25519
```

**Comando SSH padrao:**
```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 -o StrictHostKeyChecking=accept-new root@31.97.243.191
```

---

## Deteccao Bootstrap vs Incremental

A skill opera em dois modos:

### Modo Bootstrap (primeiro deploy do projeto)
Ativado quando:
- NAO existe sidecar em `projects/{projeto}/config.md`
- OU NAO existe `_a4tunados/deploys/hostinger-alfa/server-registry.json`
- OU projeto nao consta no server-registry

Neste modo: executa Stage 0B (setup completo do servidor e projeto).

### Modo Incremental (deploys subsequentes)
Ativado quando:
- Sidecar existe e esta preenchido
- Projeto consta no server-registry com status `deployed`

Neste modo: pula Stage 0B, vai direto para Stage 1.

---

## Deteccao de Modo: REMOTE vs SELF-DEPLOY

A skill opera em dois modos de transferencia, detectados **automaticamente**:

### Modo REMOTE (padrao)
Ativado quando o cwd NAO esta dentro de `/opt/hostinger-alfa/*/workspaces/`,
OU o sidecar tem `deploy_mode: REMOTE`.

Neste modo: tarball + SCP + SSH (fluxo original completo).

### Modo SELF-DEPLOY
Ativado quando o cwd esta dentro de `/opt/hostinger-alfa/*/workspaces/`
(ex: IDE editando a si mesma no servidor), E o sidecar tem `deploy_mode: SELF_DEPLOY`
ou `deploy_mode: AUTO`.

Neste modo: rsync incremental + PM2 restart local (sem SSH, sem tarball).

### Deteccao automatica

```bash
if [[ "$PWD" =~ ^/opt/hostinger-alfa/.*/workspaces/ ]]; then
  DEPLOY_MODE="SELF_DEPLOY"
else
  DEPLOY_MODE="REMOTE"
fi
```

### Override via sidecar

O campo `deploy_mode` no sidecar (`projects/{projeto}/config.md`) pode forcar o modo:
- `SELF_DEPLOY` — forca self-deploy (mesmo se detectado como remoto)
- `REMOTE` — forca remoto (mesmo se detectado como self)
- `AUTO` — usa auto-deteccao (padrao)
- Campo ausente — comportamento identico a `AUTO`, default REMOTE

### Tabela comparativa

| Aspecto | REMOTE | SELF-DEPLOY |
|---------|--------|-------------|
| Transferencia | tarball + SCP | rsync incremental |
| Execucao | comandos via SSH | bash local |
| Restart | pm2 stop + start | pm2 restart (graceful) |
| Build | Sempre no servidor | Condicional (se fontes mudaram) |
| npm install | Sempre no servidor | Condicional (se package.json mudou) |
| Backup DB | SSH cp + sqlite3 dump | local sqlite3 .backup (WAL-safe) |
| Downtime | ~30-60s | ~3-5s |
| Impacto sessao | N/A (remoto) | Auto-reconnect WebSocket obrigatorio |

---

## Modo `--autonomous` (v3.2.0+)

> **🚨 PRINCIPIO MASTER — LEIA ANTES DE TUDO (v3.2.2)**
>
> **Modo autonomo NAO e pra ser agil nem rapido. E o oposto — precisa ser
> MAIS rigoroso do que modo interativo.** Em interativo, o operador esta
> vivo na sessao e serve como ultimo check: ele vai pegar um smoke test
> insuficiente, um screenshot nao interpretado, uma rota nao exercida,
> uma mensagem de SUCCESS enganosa. Em autonomo nao tem ninguem — so o
> proprio agente e a disciplina codificada nesta skill.
>
> Se o deploy autonomo foi "rapido", foi mal-feito. Se passou sem
> Playwright real exercido em URL publica, foi mal-feito. Se declarou
> SUCCESS baseado so em `curl` de endpoint server-side, foi mal-feito.
>
> **Incidente Op 05 (2026-04-23) provou**: bundle client compilado sem
> `.env.local` gera HTTP 200 no SSR mas browser do usuario quebra com
> `auth/invalid-api-key`. `curl` nao pegou. Playwright em DEV local
> tambem nao. So Playwright contra URL publica + click no botao
> principal + console check pegaria.
>
> **Regra pratica**: em autonomo, cada passo que voce faria em
> interativo deve ser feito + 1 verificacao adicional objetiva. Se o
> resultado for mais lento, e esperado. Se for mais rapido, ha bug no
> modo — pare e revise. Esta skill atende Regra Inviolavel #38.

> **WARNING**: modo para contextos nao-interativos (sessao Claude em /loop,
> cron, agent SDK headless). NAO use interativamente — os GATES humanos
> existem por boa razao (economia com o L-REV-4 da Op 03 custou meio dia).

### Ativacao

Tres formas de ativar:

1. **Explicita via argumento**: operador invoca a skill com `--autonomous`
   na args da Skill tool. Ex: `Skill: tuninho-devops-hostinger, args: "deploy
   hostinger-beta --autonomous"`.

2. **Via sidecar**: campo `autonomous: true` em
   `projects/{host}/{projeto}/config.md` frontmatter. Util para projetos
   cujo deploy e frequente e idempotente (ex: hotfix de conteudo estatico
   em repetibilidade alta).

3. **Via detecao de branch card-isolated (v3.2.1)**: se
   `git rev-parse --abbrev-ref HEAD` retorna padrao
   `card/(feat|fix)/[a-z0-9-]+-\d{6}`, forcar `--autonomous` automaticamente
   E injetar `--card-id {cardId}` no run (derivado do 6-dig suffix da branch
   cruzado com `cards-manifest.json`). Isso permite que DDCE v4.4.0 /
   fix-suporte v2.1.0 invoquem esta skill sem precisar passar `--autonomous`
   explicitamente — o ato de estar em branch `card/*` ja assume intencao
   de deploy autonomo. Log do deploy e gravado em
   `_a4tunados/deploys/{host}/autonomous-{ts}-card{cardId}.log` (nome
   inclui cardId para rastreabilidade). Relatorio final inclui secao
   "Card Reference" com link para `_a4tunados/_operacoes/cards/{cardId}_*/`.

**Cumulativo e precedencia**:
- `--interactive` explicito no argumento SEMPRE vence (opt-out explicito respeitado)
- Argumento `--autonomous` > sidecar `autonomous: true` > detecao de branch card/*
- Se branch e `card/*` E operador passou `--interactive`: deploy interativo normal
  (raro, so usado em debugging do fluxo card-isolated)

### Comportamento dos 8 GATES humanos

Quando `--autonomous` esta ativo, cada GATE e substituido por
**auto-aprovacao condicional com pre-check endurecido**:

| GATE | Comportamento autonomo |
|------|-----------------------|
| GATE 0 (risk analysis) | Auto-aprova se `risk_level <= MEDIUM`. Se `HIGH`: abortar com log estruturado. |
| GATE 0.5 (branch/merge flow) | Auto-aprova se working tree clean + branch != main. Senao: abortar. |
| GATE 0B (bootstrap completo) | Auto-aprova apos TODOS os sub-checks 0B.1-0B.8 passarem. |
| GATE 1 (pre-flight local) | Auto-aprova apos `npm run build` + `tsc --noEmit` + `npm run lint` OK local. |
| GATE 2 (saude do servidor) | Auto-aprova se cross-project check (Stage 2) reporta todos projetos `online`. |
| GATE 3 (transferencia) | Auto-aprova (sem acao destrutiva ainda). |
| GATE 4 (pre-build confirmacao) | Auto-aprova apos checkpoint de backup registrado. |
| GATE 6 (validacao) | Auto-aprova **APENAS** se TODOS: (a) curl HTTPS externo 200 no root; (b) `grep -rlE 'AIza[A-Za-z0-9_-]{35}' .next/static` retorna >=1 arquivo quando projeto usa Firebase (Regra #39); (c) Playwright REAL navega a URL publica, clica no botao principal (login/CTA), tira snapshot, le `browser_console_messages`, confirma zero `FirebaseError\|auth/invalid-api-key\|Application error\|500` no console; (d) screenshot salvo em `fase_05/evidencias/`. Senao: dispara Stage 9 (rollback). `curl` sozinho NUNCA libera GATE 6 — Op 05 provou que SSR pode retornar 200 enquanto bundle client esta quebrado (Licao #46). |

### Auto-rollback em FAIL

Se qualquer stage retornar FAIL (curl 5xx, pm2 errored, Playwright timeout,
SSL check failed), o modo autonomous **dispara Stage 9 automaticamente**:

1. `pm2 delete {projeto}` (Regra #34)
2. `mv /opt/hostinger-*/{projeto}_pre_v{VERSION} /opt/hostinger-*/{projeto}` (swap atomic)
3. `pm2 start /opt/hostinger-*/{projeto}/ecosystem.config.*`
4. Validar via curl que rollback voltou ao estado funcional
5. Registrar em `_a4tunados/deploys/{host}/autonomous-rollback-{YYYYMMDD-HHMMSS}.log`
6. **Notificar operador no proximo inicio de sessao** via
   `.claude/session-tracker.json` campo `autonomous_rollback_pending`. O hook
   `tuninho-hook-inicio-sessao` deve ler esse campo e exibir banner vermelho
   no briefing: "Deploy autonomo revertido em {timestamp}. Revise logs antes
   de novo deploy."

### Logging obrigatorio

Em modo autonomous, TODA saida de comandos deve ser capturada:

```bash
# Prefixar todos comandos com tee para log estruturado
LOG=_a4tunados/deploys/{host}/autonomous-{YYYYMMDD-HHMMSS}.log
{
  comando1
  comando2
} 2>&1 | tee -a "$LOG"
```

O log completo e o unico audit trail — sem operador presente para ver output.

### Relatorio final obrigatorio

Ao final do deploy autonomo (success ou rollback), gerar relatorio em
`_a4tunados/deploys/{host}/autonomous-report-{YYYYMMDD-HHMMSS}.md`:

- Modo: autonomous
- Trigger: (argumento | sidecar | cron)
- Risk level computado: (LOW | MEDIUM)
- Stages executados + duracao cada
- Resultado: SUCCESS | ROLLBACK
- Se ROLLBACK: motivo + log completo do FAIL
- Metricas: downtime, versao deployada, versao anterior

O proximo `tuninho-hook-inicio-sessao` do operador deve listar relatorios
nao lidos.

### Limitacoes e anti-padroes

- **NAO usar autonomous em deploy inicial (bootstrap)** — bootstrap tem muitas
  decisoes que exigem operador (escolher dominio, configurar DNS, aprovar SSL).
  Autonomous so faz sentido em deploys **subsequentes** em projeto ja estabelecido.
- **NAO usar autonomous em mudancas de schema DB** (migrations irreversiveis)
  — autonomous faz rollback de codigo, mas nao desfaz ALTER TABLE.
- **NAO usar autonomous sem ter rodado ao menos 1 deploy interativo antes** no
  projeto — auditoria exige baseline de referencia.

---

## Fluxo de Deploy — 11 Stages com 8 GATES

```
PREFLIGHT → Stage 0 → Stage 0.5 → [Stage 0B] → Stage 1 → Stage 2
→ Stage 3* → Stage 4* → Stage 5* → Stage 6* → Stage 7 → Stage 8
                                                    ↕
                                               Stage 9* (emergencia)

* = comportamento varia por DEPLOY_MODE (REMOTE vs SELF-DEPLOY)
```

---

### PREFLIGHT — Express Check

> Protocolo identico ao tuninho-devops-mural-devprod.

1. Verificar versoes remotas: `gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d`
2. Comparar com versoes locais (H1 de cada SKILL.md)
3. Se atualizacoes disponiveis: perguntar ao operador
4. Se curl falhar: prosseguir silenciosamente

---

### Stage 0 — Risk Analysis + Identificacao do Projeto

**Acoes obrigatorias:**

1. **Ler licoes aprendidas**: `references/licoes-aprendidas.md` (OBRIGATORIO antes de qualquer deploy)
2. **Identificar projeto**: pelo diretorio atual (cwd) ou perguntar ao operador
3. **Carregar sidecar**: `projects/{projeto}/config.md`
   - Se NAO existir: marcar para Bootstrap (Stage 0B)
4. **Carregar server-registry**: `_a4tunados/deploys/hostinger-alfa/server-registry.json`
5. **Coletar escopo**:
   - Commits desde ultimo deploy: `git log --oneline {last_deploy_hash}..HEAD`
   - Arquivos modificados: `git diff --stat {last_deploy_hash}..HEAD`
   - Migrations pendentes: `ls prisma/migrations/`
   - Mudancas em dependencies: `git diff {last_deploy_hash}..HEAD -- package.json`
6. **Detectar rename** (Licao #17): Comparar nome do projeto no sidecar (`projects/{projeto}/config.md` campo "Projeto") com o `pm2_service` no server-registry. Se diferem: ativar flag `RENAME_DEPLOY=true` e registrar nomes antigo/novo.
7. **Apresentar matriz de risco**:

```
╔══════════════════════════════════════════════════╗
║         RISK ANALYSIS — {PROJETO}                ║
╠══════════════════════════════════════════════════╣
║ Commits:      {N}                                ║
║ Files changed: {N}                               ║
║ Migrations:   {N} novas                          ║
║ Dependencies: {alteradas/inalteradas}             ║
║ Risk level:   {LOW/MEDIUM/HIGH}                  ║
║ Mode:         {BOOTSTRAP/INCREMENTAL}            ║
║ Rename:       {SIM nome_antigo→nome_novo / NAO}  ║
║ Deploy mode:  {REMOTE/SELF_DEPLOY}               ║
║ Cross-proj:   {N} projetos ativos no servidor    ║
╚══════════════════════════════════════════════════╝
```

6b. **Detectar deploy mode** (v2.0.0):
   - Verificar se cwd esta dentro de `/opt/hostinger-alfa/*/workspaces/`
   - Carregar `deploy_mode` do sidecar (se existir) — sidecar override > auto-deteccao
   - Se SELF_DEPLOY: carregar `workspace_path`, `prod_path`, `rsync_excludes`,
     `conditional_triggers`, `cross_projects` do sidecar
   - Se SELF_DEPLOY: verificar pre-requisitos (Regras #24-27):
     - Auto-reconnect WebSocket implementado no projeto?
     - `workspaces/` e `data/` nos rsync_excludes?
     - `graceful_restart: true` no sidecar?

**🔒 GATE 0**: Operador confirma "GO" ou aborta.

---

### Stage 0.5 — Branch Verification + Merge Flow

**Gitflow para Hostinger Alfa:**

A branch de deploy e `deploy/hostinger-alfa`. Independente de qual branch esteja, o merge segue:

```
{branch_atual} → deploy/hostinger-alfa (--no-ff)
```

**Procedimento:**

1. **Verificar gitignore** (Licao #16): Confirmar que arquivos de sessao Claude estao no .gitignore:
   ```
   .claude/session-tracker.json
   .claude/tuninho-hook-guardiao-state.json
   .claude/tuninho-hook-cards-state.json
   ```
   Se NAO estiverem: adicionar e `git rm --cached` para cada um.

2. **Verificar remote URL** (Licao #37 — OBRIGATORIA, SEM GATE):
   Tokens OAuth (`gho_*`, `ghp_*`) hardcoded na remote URL expiram e causam falhas
   recorrentes de `git push`. Verificar e corrigir ANTES de qualquer push:
   ```bash
   REMOTE_URL=$(git remote get-url origin 2>/dev/null)
   if echo "$REMOTE_URL" | grep -qE '(gho_|ghp_|x-access-token)'; then
     CLEAN_URL=$(echo "$REMOTE_URL" | sed -E 's|https://[^@]+@|https://|')
     git config --global credential.helper '!gh auth git-credential'
     git remote set-url origin "$CLEAN_URL"
   fi
   ```

3. **Verificar branch limpa** (Licao #9): OBRIGATORIO antes de qualquer merge.
   ```bash
   git status  # deve retornar working tree clean
   git log origin/{branch}..HEAD --oneline  # deve retornar vazio
   ```
   - Se houver alteracoes nao commitadas: commit + push ANTES de prosseguir
   - Se houver commits nao pushados: push ANTES de prosseguir
   - **BLOQUEAR merge ate branch limpa e pushada**

3. Verificar branch atual: `git branch --show-current`
4. Verificar se `deploy/hostinger-alfa` existe: `git branch -a | grep deploy/hostinger-alfa`
5. Se NAO existir: criar a partir de main
   ```bash
   git checkout main
   git checkout -b deploy/hostinger-alfa
   git push -u origin deploy/hostinger-alfa
   git checkout {branch_original}
   ```
6. Apresentar opcoes:
   ```
   Branch atual: {branch_atual}
   Deploy branch: deploy/hostinger-alfa

   Opcoes:
   (1) Executar merge: {branch_atual} → deploy/hostinger-alfa (--no-ff)
   (2) Deploy direto da branch atual (deploy/hostinger-alfa nao tera o codigo)
   (3) Cancelar
   ```

7. Se opcao 1:
   ```bash
   git checkout deploy/hostinger-alfa
   git merge --no-ff {branch_atual} -m "Merge branch '{branch_atual}' into deploy/hostinger-alfa"
   # NAO fazer push ainda — push sera feito apos deploy com sucesso
   ```

**🔒 GATE 0.5**: Operador confirma opcao.

---

### Stage 0B — Bootstrap (condicional, primeiro deploy do projeto)

> Este stage so executa quando o projeto NAO tem sidecar configurado.

**Sub-etapas:**

#### 0B.1 — Reconhecimento do Servidor

```bash
# Conectar
ssh -i _a4tunados/env/hostinger/id_ed25519 -o StrictHostKeyChecking=accept-new root@31.97.243.191

# OS
cat /etc/os-release

# Runtimes instalados
node -v 2>/dev/null || echo "Node: NAO INSTALADO"
npm -v 2>/dev/null || echo "npm: NAO INSTALADO"
pm2 -v 2>/dev/null || echo "PM2: NAO INSTALADO"
nginx -v 2>/dev/null || echo "Nginx: NAO INSTALADO"
certbot --version 2>/dev/null || echo "Certbot: NAO INSTALADO"

# Disco
df -h /

# Portas em uso
ss -tlnp | grep LISTEN

# Firewall
ufw status 2>/dev/null || iptables -L -n 2>/dev/null

# Build tools (Licao #19 — obrigatorio para modulos nativos)
dpkg -l build-essential 2>/dev/null | grep -q "^ii" && echo "build-essential: OK" || echo "build-essential: NECESSARIO"
```

#### 0B.2 — Instalar Runtimes Faltantes

Instalar APENAS o que falta. Para cada runtime:

**Node.js 22.x LTS:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v && npm -v
```

**PM2:**
```bash
npm install -g pm2
pm2 -v
```

**Nginx:**
```bash
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v
```

**Certbot + plugin Nginx:**
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --version
```

#### 0B.3 — Criar Estrutura no Servidor

```bash
mkdir -p /opt/hostinger-alfa/{projeto}
mkdir -p /opt/hostinger-alfa/nginx/sites
mkdir -p /opt/hostinger-alfa/backups
```

#### 0B.4 — Verificar DNS

```bash
# Local (do mac)
dig +short {dominio}
# Deve retornar 31.97.243.191
```

Se DNS nao estiver configurado:
```
⚠️  DNS NAO CONFIGURADO

O dominio {dominio} nao aponta para 31.97.243.191.
Voce precisa configurar o DNS antes de prosseguir.

Instrucoes:
1. Acesse o painel do registrador do dominio
2. Crie um registro A:
   - Host: {subdominio} (ex: batutamanager)
   - Tipo: A
   - Valor: 31.97.243.191
   - TTL: 300 (5 min)
3. Aguarde propagacao (5-30 min)
4. Execute novamente esta skill

Deseja continuar sem SSL? (y/n)
```

#### 0B.5 — Configurar Nginx Reverse Proxy

Criar arquivo de configuracao usando template de `references/nginx-templates.md`:

```bash
# No servidor, criar config
# v3.1.0: buffers aumentados por padrao — Firebase/Auth0/OAuth session cookies
# podem chegar a 3-4KB, excedendo o proxy_buffer_size default 4k e causando
# 502 upstream sent too big header (L-REV-6 Op 03 go-live tuninho.ai).
# Buffers tambem sao criticos pra Next.js App Router Set-Cookie (RSC state).
cat > /opt/hostinger-alfa/nginx/sites/{projeto}.conf << 'NGINX'
server {
    listen 80;
    server_name {DOMINIO};

    # Buffers ampliados — session cookies de Firebase/Auth podem chegar a ~4KB
    # e estourar proxy_buffer_size default 4k, causando 502 na primeira login.
    proxy_buffer_size       16k;
    proxy_buffers           8 16k;
    proxy_busy_buffers_size 32k;

    location / {
        proxy_pass http://127.0.0.1:{PORTA};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 365d;
        access_log off;
    }
}
NGINX

# Symlink para sites-enabled
ln -sf /opt/hostinger-alfa/nginx/sites/{projeto}.conf /etc/nginx/sites-enabled/{projeto}.conf

# Testar config
nginx -t

# Reload
systemctl reload nginx
```

#### 0B.6 — Configurar SSL (certbot)

```bash
# Pre-check DNS (v3.1.0, L-REV Op 03 F6.1): confirmar que cada dominio
# resolve para UM unico IP. Multi-IP faz certbot --expand falhar pois
# Let's Encrypt tenta validar ACME em todos e so UM hospeda o desafio.
for d in {dominio_apex} {dominio_www}; do
  ips=$(dig +short "$d" A | sort -u | wc -l)
  if [ "$ips" -gt 1 ]; then
    echo "[BLOCK] $d resolve para $ips IPs — certbot vai falhar"
    echo "        Remova registros A extras antes de prosseguir"
    exit 1
  fi
done

certbot --nginx -d {dominio} --non-interactive --agree-tos --email victorgaudio@4tuna.com.br

# Verificar certificado
certbot certificates | grep {dominio}

# Configurar auto-renovacao (certbot ja faz via timer, mas confirmar)
systemctl status certbot.timer
```

#### 0B.7 — Criar .env.production no Servidor

```bash
cat > /opt/hostinger-alfa/{projeto}/.env.production << 'ENV'
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_SECRET="{GERAR_COM_openssl_rand_-base64_32}"
NEXTAUTH_URL="https://{dominio}"
NODE_ENV="production"
PORT={PORTA}
ENV
```

Gerar secret: `openssl rand -base64 32`

#### 0B.8 — Criar ecosystem.config.js

```bash
cat > /opt/hostinger-alfa/{projeto}/ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: '{projeto}',
    script: 'node_modules/.bin/next',
    args: 'start -p {PORTA}',
    cwd: '/opt/hostinger-alfa/{projeto}',
    env: {
      NODE_ENV: 'production',
      PORT: {PORTA}
    },
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/opt/hostinger-alfa/{projeto}/logs/pm2-error.log',
    out_file: '/opt/hostinger-alfa/{projeto}/logs/pm2-out.log'
  }]
}
PM2

mkdir -p /opt/hostinger-alfa/{projeto}/logs
```

# NOTA (Licao #22): Se package.json tem "type": "module", renomear para .cjs:
# mv ecosystem.config.js ecosystem.config.cjs

#### 0B.9 — Deploy Inicial

Seguir Stages 3, 4 (sem backup pois nao ha versao anterior), 5.

#### 0B.10 — Verificacao Inicial

```bash
# HTTP local
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:{PORTA}/

# HTTPS externo
curl -s -o /dev/null -w "%{http_code}" https://{dominio}/
```

#### 0B.11 — Criar Sidecar e Server Registry

Ao final do bootstrap com sucesso:
1. Criar `projects/{projeto}/config.md` com todos os dados descobertos
2. Criar/atualizar `_a4tunados/deploys/hostinger-alfa/server-registry.json`

**🔒 GATE 0B**: Operador confirma que bootstrap foi concluido com sucesso.

---

### Stage 1 — Pre-flight Local

**Acoes por stack (ler do sidecar):**

Para **Next.js + Prisma** (BatutaManager):

```bash
# Branch correta
git branch --show-current  # deve ser deploy/hostinger-alfa

# Lint
npm run lint  # 0 erros

# Prisma generate
npx prisma generate

# Build
npm run build  # deve gerar .next/

# Verificar output
ls .next/  # confirmar que existe

# Migrations pendentes
ls prisma/migrations/ | wc -l

# Verificar package.json
cat package.json | grep '"version"'
```

**🔒 GATE 1**: Operador confirma pre-flight local OK.

---

### Stage 2 — Cross-Project Pre-Deploy Check

> Verifica TODOS os projetos no servidor ANTES de iniciar o deploy.

**Se SELF_DEPLOY** (execucao local, sem SSH):

```bash
# Execucao direta no servidor (ja estamos nele)
echo "=== DISCO ===" && df -h / | tail -1
echo "=== PM2 ===" && pm2 status
echo "=== NGINX ===" && nginx -t 2>&1
# Para cada projeto em cross_projects do sidecar:
for proj_info in "${CROSS_PROJECTS[@]}"; do
  IFS='|' read -r svc port domain <<< "$proj_info"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/")
  # Suporte a PM2 e systemd
  if [[ "$svc" == systemd:* ]]; then
    status=$(systemctl is-active "${svc#systemd:}")
  else
    status=$(pm2 describe "$svc" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | grep "│ status" | head -1 | sed 's/.*│[[:space:]]*//' | sed 's/[[:space:]]*│.*//')
  fi
  echo "$svc: $status HTTP $http_code"
done
```

**Se REMOTE** (fluxo original via SSH):

```bash
# SSH no servidor
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'

echo "=== DISCO ==="
df -h / | tail -1

echo "=== PM2 STATUS ==="
pm2 status

echo "=== NGINX ==="
nginx -t 2>&1

echo "=== PORTAS ==="
ss -tlnp | grep LISTEN

REMOTE
```

Para CADA projeto no server-registry (exceto o que esta sendo deployado):
```bash
curl -s -o /dev/null -w "%{http_code}" https://{dominio_projeto}/
# DEVE retornar 200
```

Apresentar tabela:
```
╔═══════════════════════════════════════════════╗
║     CROSS-PROJECT HEALTH CHECK                ║
╠════════════╦════════╦═══════╦════════════════╣
║ Projeto    ║ Status ║ HTTP  ║ PM2            ║
╠════════════╬════════╬═══════╬════════════════╣
║ {proj1}    ║ ✅ OK  ║ 200   ║ online         ║
║ {proj2}    ║ ✅ OK  ║ 200   ║ online         ║
╠════════════╬════════╬═══════╬════════════════╣
║ Disco      ║ {X}GB livre                     ║
║ Nginx      ║ syntax ok                       ║
╚═══════════════════════════════════════════════╝
```

Se algum projeto estiver com problema ANTES do deploy:
```
⚠️  ATENCAO: {projeto} nao esta respondendo (HTTP {code})
Isso NAO foi causado pelo deploy atual (ainda nao comecou).
Deseja prosseguir mesmo assim? (s/n)
```

**🔒 GATE 2**: Operador confirma saude do servidor.

---

### Stage 3 — Package + Transfer (REMOTE) / Diff Analysis (SELF-DEPLOY)

**Se SELF_DEPLOY** — substituido por analise rsync dry-run:

```bash
# Carregar rsync_excludes do sidecar
RSYNC_EXCLUDES=($(cat sidecar_excludes))  # cada pattern como --exclude='pattern'

# Dry-run: mostrar diferencas
CHANGED_FILES=$(rsync -avn --delete "${RSYNC_EXCLUDES[@]}" \
  "{workspace_path}/" "{prod_path}/" 2>&1 \
  | grep -v "^sending\|^total\|^$\|^\./$")
CHANGED_COUNT=$(echo "$CHANGED_FILES" | grep -c "." || echo "0")

if [ "$CHANGED_COUNT" -eq 0 ]; then
  echo "Nenhuma diferenca encontrada. Nada a deployar."
  exit 0
fi

# Detectar triggers condicionais do sidecar
PACKAGE_CHANGED=0
diff -q "{workspace_path}/package.json" "{prod_path}/package.json" || PACKAGE_CHANGED=1

BUNDLES_CHANGED=0
# Verificar cada trigger do conditional_triggers do sidecar
for src in {lista_conditional_triggers}; do
  diff -q "{workspace_path}/$src" "{prod_path}/$src" || { BUNDLES_CHANGED=1; break; }
done
```

Apresentar diferencas ao operador: quantos arquivos, quais, e que triggers condicionais foram ativados.

**Se REMOTE** — tarball + SCP (fluxo original):

**Criar tarball localmente:**

```bash
COPYFILE_DISABLE=1 tar -czf /tmp/{projeto}_deploy_v{VERSION}.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env*' \
  --exclude='._*' \
  --exclude='.DS_Store' \
  --exclude='_a4tunados' \
  --exclude='.claude' \
  --exclude='.playwright-mcp' \
  --exclude='dev.db' \
  --exclude='*.tsbuildinfo' \
  --exclude='next-env.d.ts' \
  --exclude='.next/cache' \
  --exclude='public/uploads/*' \
  --exclude='!public/uploads/.gitkeep' \
  .
```

**Validar tarball:**
```bash
tar -tzf /tmp/{projeto}_deploy_v{VERSION}.tar.gz | head -20
tar -tzf /tmp/{projeto}_deploy_v{VERSION}.tar.gz | grep "prisma/schema.prisma"
tar -tzf /tmp/{projeto}_deploy_v{VERSION}.tar.gz | grep "package.json"
tar -tzf /tmp/{projeto}_deploy_v{VERSION}.tar.gz | wc -l
ls -lh /tmp/{projeto}_deploy_v{VERSION}.tar.gz
```

**Transferir via SCP:**
```bash
scp -i _a4tunados/env/hostinger/id_ed25519 \
  /tmp/{projeto}_deploy_v{VERSION}.tar.gz \
  root@31.97.243.191:/tmp/
```

**Verificar transferencia:**
```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 \
  "ls -lh /tmp/{projeto}_deploy_v{VERSION}.tar.gz"
```

---

### Stage 4 — Backup em Producao

> **PONTO DE NAO RETORNO** — apos este stage, alteracoes no servidor sao feitas.

**Se SELF_DEPLOY** (backup local, sem SSH):

```bash
BACKUP_DIR="/opt/hostinger-alfa/backups/{projeto}-pre-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# SQLite backup WAL-safe (Licao #31 — NUNCA cp direto em DB com WAL mode)
if [ -f "{prod_path}/{db_path}" ]; then
  sqlite3 "{prod_path}/{db_path}" ".backup '$BACKUP_DIR/{db_name}'"
  # Registrar contagem de registros
  for table in $(sqlite3 "{prod_path}/{db_path}" \
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"); do
    count=$(sqlite3 "{prod_path}/{db_path}" "SELECT count(*) FROM \"$table\";")
    echo "$table: $count" >> "$BACKUP_DIR/contagem_registros.txt"
  done
fi

# Backup de secrets (do sidecar: lista de arquivos em data/)
for secret in {lista_secrets_do_sidecar}; do
  [ -f "{prod_path}/$secret" ] && cp "{prod_path}/$secret" "$BACKUP_DIR/"
done

# Backup ecosystem.config
[ -f "{prod_path}/ecosystem.config.cjs" ] && cp "{prod_path}/ecosystem.config.cjs" "$BACKUP_DIR/"

# Backup codigo (excluindo pesados)
rsync -a --exclude='node_modules/' --exclude='workspaces/' --exclude='.git/' --exclude='data/' \
  "{prod_path}/" "$BACKUP_DIR/code/"
```

**🔒 GATE 4**: Operador confirma backup OK e entende que downtime sera ~3-5s (SELF-DEPLOY) ou ~30-60s (REMOTE).

**Se REMOTE** (backup via SSH — fluxo original):

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'

# Verificar disco
df -h /

# Criar diretorio de backup
BACKUP_DIR="/opt/hostinger-alfa/backups/{projeto}-pre-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup do banco SQLite (se existir)
if [ -f /opt/hostinger-alfa/{projeto}/prisma/production.db ]; then
  cp /opt/hostinger-alfa/{projeto}/prisma/production.db $BACKUP_DIR/production.db
  # Dump SQL para redundancia
  sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db .dump > $BACKUP_DIR/dump.sql
  echo "DB backup: OK ($(du -h $BACKUP_DIR/production.db | cut -f1))"
else
  echo "DB backup: SKIP (primeiro deploy, sem DB existente)"
fi

# Backup .env.production
if [ -f /opt/hostinger-alfa/{projeto}/.env.production ]; then
  cp /opt/hostinger-alfa/{projeto}/.env.production $BACKUP_DIR/env.production.bak
fi

# Backup ecosystem.config.js
if [ -f /opt/hostinger-alfa/{projeto}/ecosystem.config.js ]; then
  cp /opt/hostinger-alfa/{projeto}/ecosystem.config.js $BACKUP_DIR/
fi

# Backup uploads
if [ -d /opt/hostinger-alfa/{projeto}/public/uploads ]; then
  tar -czf $BACKUP_DIR/uploads_backup.tar.gz \
    -C /opt/hostinger-alfa/{projeto} public/uploads/
fi

# Registro de baseline (contagem de registros)
if [ -f /opt/hostinger-alfa/{projeto}/prisma/production.db ]; then
  sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
    > $BACKUP_DIR/tables_list.txt

  # Contar registros de cada tabela
  for table in $(cat $BACKUP_DIR/tables_list.txt); do
    count=$(sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
      "SELECT count(*) FROM \"$table\";")
    echo "$table: $count" >> $BACKUP_DIR/contagem_registros.txt
  done
  cat $BACKUP_DIR/contagem_registros.txt
fi

# Listar migrations aplicadas
if [ -f /opt/hostinger-alfa/{projeto}/prisma/production.db ]; then
  sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
    "SELECT migration_name FROM _prisma_migrations ORDER BY started_at;" \
    > $BACKUP_DIR/migrations_pre.txt 2>/dev/null || echo "Sem tabela de migrations"
fi

echo ""
echo "Backup completo em: $BACKUP_DIR"
ls -la $BACKUP_DIR/

REMOTE
```

**🔒 GATE 4 (PONTO DE NAO RETORNO)**: Operador confirma backup OK e entende que downtime comecara.

---

### Stage 5 — Deploy (Minimizar Downtime)

> **SEM GATES neste stage** — executar rapidamente para minimizar downtime.

**Se SELF_DEPLOY** (rsync + restart local — downtime ~3-5s):

```bash
# 5.1 — Sync arquivos (rsync incremental com --delete)
echo "SYNC START: $(date -u)"
rsync -av --delete "${RSYNC_EXCLUDES[@]}" \
  "{workspace_path}/" "{prod_path}/" 2>&1 | tail -5

# 5.2 — npm install CONDICIONAL (Licao #31 — so se package.json mudou)
if [ "$PACKAGE_CHANGED" -eq 1 ]; then
  cd "{prod_path}" && npm install --production 2>&1 | tail -3
fi

# 5.2b — Platform-specific binary handling (Licao #44, L-REV-4 Op 03 go-live)
# npm ci/install nao preserva +x em binarios de pacotes AI (claude-agent-sdk, etc)
# e pode baixar variante musl em host glibc. Sempre corrigir pos-install.
if [ "$PACKAGE_CHANGED" -eq 1 ]; then
  cd "{prod_path}"
  # (a) Restaurar exec bit em binarios `claude` (musl e glibc)
  find node_modules -path '*/claude*/claude' -type f -exec chmod +x {} \; 2>/dev/null || true
  # (b) Purgar binarios musl se host e glibc (Ubuntu/Debian padrao)
  if ldd --version 2>&1 | grep -qi 'glibc\|GNU libc'; then
    find node_modules -path '*linux-x64-musl*/claude' -type f -delete 2>/dev/null || true
  fi
  # (c) Validar que binario resultante executa
  if [ -x node_modules/@anthropic-ai/claude-agent-sdk/vendor/claude-code/cli.js ]; then
    echo "[OK] claude-agent-sdk binary executavel"
  fi
fi

# 5.3 — Build CONDICIONAL (so se fontes de bundle mudaram)
if [ "$BUNDLES_CHANGED" -eq 1 ]; then
  cd "{prod_path}" && npm run build 2>&1 | tail -5
fi

# 5.4 — PM2 restart GRACEFUL (Licao #32 — NUNCA stop+start, NUNCA tmux kill-server)
echo "DOWNTIME START: $(date -u)"
pm2 restart {projeto} 2>&1 | tail -3
echo "DOWNTIME END: $(date -u)"
# tmux sessions sobrevivem ao restart
# WebSocket reconecta automaticamente (~2-3s com backoff)

# 5.5 — pm2 save
pm2 save
```

**NOTAS SELF-DEPLOY:**
- NAO fazer pm2 stop + start (mata PTY attachments — Licao #32)
- NAO fazer mv de diretorio (rsync incremental e superior)
- NAO precisar restaurar .env, ecosystem.config, etc (excluidos do rsync)
- NAO precisar limpar artefatos macOS (estamos no Linux)
- Auto-reconnect WebSocket acontece automaticamente

**REGRA CRITICA — Migracao de diretorio durante SELF-DEPLOY (Licao #34):**
Quando o deploy envolve migracao de estrutura de diretorios (ex: mover workspaces
para subdir per-user), NUNCA mover (mv) ANTES de atualizar o codigo. A ordem segura e:
1. **COPIAR** (cp -al para hardlinks, zero espaco extra) para a nova estrutura
2. **rsync** do codigo novo para producao
3. **PM2 restart** (codigo novo resolve a nova estrutura)
4. **Verificar** que tudo funciona com a nova estrutura
5. **SO ENTAO remover** os originais da estrutura antiga
Mover antes de atualizar o codigo cria estado intermediario: codigo antigo espera
estrutura antiga que nao existe mais → servico quebrado. Em SELF-DEPLOY isso e
ainda pior: o agente perde o CWD (Bash bloqueado) e nao consegue nem reverter.

**Se REMOTE** (SSH deploy — fluxo original):

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'

# 5.1 — Parar aplicacao (Licao #43: delete em vez de stop para re-deploys no mesmo dia)
# Motivo: pm2 stop + mv(cwd) + pm2 start pode deixar PM2 em state stale
# (status=stopped, restarts nao zera, HTTP 502, logs vazios). pm2 delete limpa o entry
# completamente e o start subsequente cria entry com id fresh.
pm2 delete {projeto} 2>/dev/null || true
echo "DOWNTIME INICIO: $(date -u)"

# 5.2 — Preservar versao atual (rollback disponivel)
if [ -d /opt/hostinger-alfa/{projeto} ]; then
  mv /opt/hostinger-alfa/{projeto} /opt/hostinger-alfa/{projeto}_pre_v{VERSION}
fi

# 5.3 — Extrair nova versao
mkdir -p /opt/hostinger-alfa/{projeto}
cd /opt/hostinger-alfa/{projeto}
tar -xzf /tmp/{projeto}_deploy_v{VERSION}.tar.gz

# 5.4 — Limpar artefatos macOS (OBRIGATORIO)
find /opt/hostinger-alfa/{projeto} -name '._*' -delete
find /opt/hostinger-alfa/{projeto} -name '.DS_Store' -delete

# 5.5 — Restaurar configuracoes (env files + ecosystem)
# IMPORTANTE (Licao #46 / Regra #39): restaurar TODOS os .env* do PREV,
# nao apenas .env.production. Motivo: Next.js inline NEXT_PUBLIC_* no
# bundle client no momento do `npm run build`. Projetos podem ter o
# client config em `.env.local` (pattern historico) e se o build rodar
# sem essas keys, o bundle compila com `undefined` → browser quebra em
# runtime com `auth/invalid-api-key` mesmo que SSR responda 200 OK.
# Este bug (Op 05 go-live 2026-04-23) passou silenciosamente por curl
# de homepage e so foi detectado quando operador abriu o browser.
PREV_DIR="/opt/hostinger-alfa/{projeto}_pre_v{VERSION}"
# Se RENAME_DEPLOY: a versao anterior esta no nome antigo
# PREV_DIR="/opt/hostinger-alfa/{nome_antigo}_pre_rename"
for envfile in .env.production .env.local .env .env.preview; do
  if [ -f "$PREV_DIR/$envfile" ]; then
    cp "$PREV_DIR/$envfile" "/opt/hostinger-alfa/{projeto}/$envfile"
    echo "[restore] $envfile restored from PREV"
  fi
done
# .env.example NAO e restaurado — deve vir do tarball (versionado no repo)

# 5.5a — Criar symlink .env (Licao #12: Prisma CLI so le .env)
# So cria symlink se .env nao foi restaurado como arquivo concreto acima
if [ ! -f /opt/hostinger-alfa/{projeto}/.env ]; then
  ln -sf .env.production /opt/hostinger-alfa/{projeto}/.env
fi

# 5.5b — Verificar DATABASE_URL usa path absoluto (Licao #15)
# Se relativo: corrigir para absoluto
sed -i 's|DATABASE_URL="file:\./prisma/production.db"|DATABASE_URL="file:/opt/hostinger-alfa/{projeto}/prisma/production.db"|' \
  /opt/hostinger-alfa/{projeto}/.env.production

# ecosystem.config.js (usar o do servidor, nao o do repo)
# Se existir versao anterior: copiar. Senao: criar novo com TODAS as vars (Licao #18)
if [ -f $PREV_DIR/ecosystem.config.js ]; then
  cp $PREV_DIR/ecosystem.config.js /opt/hostinger-alfa/{projeto}/ecosystem.config.js
  # Atualizar nome do servico se RENAME_DEPLOY
  # sed -i "s|name: '{nome_antigo}'|name: '{projeto}'|" ecosystem.config.js
fi

# 5.6 — Restaurar uploads (rsync -a, NUNCA cp -r)
if [ -d /opt/hostinger-alfa/{projeto}_pre_v{VERSION}/public/uploads ]; then
  mkdir -p /opt/hostinger-alfa/{projeto}/public/uploads
  rsync -a /opt/hostinger-alfa/{projeto}_pre_v{VERSION}/public/uploads/ \
           /opt/hostinger-alfa/{projeto}/public/uploads/
fi

# 5.7 — Restaurar banco SQLite
if [ -f /opt/hostinger-alfa/{projeto}_pre_v{VERSION}/prisma/production.db ]; then
  cp /opt/hostinger-alfa/{projeto}_pre_v{VERSION}/prisma/production.db \
     /opt/hostinger-alfa/{projeto}/prisma/production.db
fi

# 5.8 — Instalar dependencias
# Licao #11: NUNCA usar --omit=dev se projeto usa Tailwind (necessario no build)
cd /opt/hostinger-alfa/{projeto}
npm install

# 5.8b — Platform-specific binary handling (Licao #44, L-REV-4 Op 03 go-live)
# Binarios de pacotes AI (@anthropic-ai/claude-agent-sdk, etc) perdem +x apos
# npm ci/install e podem vir em variante musl num host glibc. Sempre corrigir.
find node_modules -path '*/claude*/claude' -type f -exec chmod +x {} \; 2>/dev/null || true
if ldd --version 2>&1 | grep -qi 'glibc\|GNU libc'; then
  find node_modules -path '*linux-x64-musl*/claude' -type f -delete 2>/dev/null || true
fi

# 5.9 — Gerar Prisma client (OBRIGATORIO — arquitetura Linux vs macOS)
npx prisma generate

# 5.10 — Aplicar migrations
npx prisma migrate deploy

# 5.10a — Seed check (Licao #14): Se DB vazio, rodar seed
USER_COUNT=$(sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db "SELECT count(*) FROM User;" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ] && [ -f prisma/seed.ts ]; then
  echo "⚠️  DB vazio (0 users). Executando seed..."
  npx tsx prisma/seed.ts
fi

# 5.11 — Build Next.js
npm run build

# 5.11a — Validacao pos-build: NEXT_PUBLIC_* inlined no bundle client
# (Licao #46 / Regra #39 — Op 05 go-live 2026-04-23)
# Next.js inline NEXT_PUBLIC_* no build. Se .env.local / .env.production
# faltava no momento do build, o bundle vai ter valores vazios/undefined
# e o SSR pode responder 200 enquanto o browser quebra.
# Validacao: fazer grep por pattern conhecido das envs criticas do projeto.
# Para Firebase: grep por API key pattern (AIza...)
# Para Stripe: pk_live_* ou pk_test_*
# Para outros: definir no sidecar em `required_public_env_patterns`
if [ -f node_modules/firebase/package.json ] || grep -q '"firebase"' package.json 2>/dev/null; then
  INLINED=$(grep -rlE 'AIza[A-Za-z0-9_-]{35}' .next/static 2>/dev/null | head -1)
  if [ -z "$INLINED" ]; then
    echo "[FAIL] Build terminou SEM Firebase API key inlined no bundle client."
    echo "       Isso significa que NEXT_PUBLIC_FIREBASE_* nao estava disponivel"
    echo "       no momento de 'npm run build'. Verifique .env.local no PREV"
    echo "       e no diretorio atual. Bundle quebrado — abortando deploy."
    exit 1
  fi
  echo "[OK] Firebase API key inlined em: $INLINED"
fi
# Projetos podem adicionar checks similares via patterns do sidecar.

# 5.12 — Criar diretorios de log
mkdir -p /opt/hostinger-alfa/{projeto}/logs

# 5.13 — Iniciar aplicacao
# IMPORTANTE (L5.4 Op 05, v3.2.3): se `.env.local` ou `.env.production`
# mudou entre o `pm2 delete` e este start, use `pm2 restart tuninho-ai
# --update-env` em operacoes subsequentes no mesmo processo. Para start
# fresh como aqui (pos-delete), basta `pm2 start` — o processo sobe
# lendo o ambiente atual do shell + arquivos .env.
pm2 start ecosystem.config.js
echo "DOWNTIME TECNICO FIM: $(date -u)"
echo "ATENCAO (Regra #40): downtime TECNICO != downtime FUNCIONAL."
echo "Downtime funcional so encerra em Stage 6 quando Playwright em URL"
echo "publica confirma caminho do usuario funcionando."

# 5.14 — Salvar config PM2
pm2 save

# 5.15 — Configurar PM2 startup (se ainda nao configurado)
pm2 startup 2>/dev/null || true

REMOTE
```

---

### Stage 6 — Verificacao Automatizada + Cross-project

**Se SELF_DEPLOY** (verificacao local — aguardar ~3s):

```bash
sleep 3

# PM2 status (Licao #33 — strip ANSI antes de parsear)
PM2_STATUS=$(pm2 describe {projeto} 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' \
  | grep "│ status" | head -1 | sed 's/.*│[[:space:]]*//' | sed 's/[[:space:]]*│.*//')
echo "PM2: $PM2_STATUS"

# HTTP local
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:{porta}/")
echo "HTTP: $HTTP_CODE"

# DB integrity
if [ -f "{prod_path}/{db_path}" ]; then
  sqlite3 "{prod_path}/{db_path}" "PRAGMA integrity_check;"
fi

# Cross-project re-verificacao (mesma logica do Stage 2, local)
for proj_info in "${CROSS_PROJECTS[@]}"; do
  IFS='|' read -r svc port domain <<< "$proj_info"
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/"
done
```

Se qualquer projeto retornar erro apos deploy: ALERTAR que pode ser impacto do deploy,
sugerir rollback (Stage 9).

**Se REMOTE** (verificacao via SSH — aguardar ~10s):

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'

echo "=== PM2 STATUS ==="
pm2 status

echo "=== PM2 LOGS (ultimas 30 linhas) ==="
pm2 logs {projeto} --nostream --lines 30

echo "=== HTTP LOCAL ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:{PORTA}/

echo "=== HTTPS EXTERNO ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://{dominio}/

REMOTE
```

**Verificacao de dados (se DB existia antes):**
```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'

# Contar registros pos-deploy
for table in $(sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"); do
  count=$(sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
    "SELECT count(*) FROM \"$table\";")
  echo "$table: $count"
done

# Migrations aplicadas
sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db \
  "SELECT migration_name FROM _prisma_migrations ORDER BY started_at;" 2>/dev/null

REMOTE
```

**Cross-project re-verificacao (OBRIGATORIA — multiplos projetos):**

> O servidor Hostinger Alfa hospeda MULTIPLOS projetos. Um deploy do projeto X
> NUNCA deve afetar o projeto Y. Esta verificacao e INVIOLAVEL.

Para CADA projeto no server-registry (incluindo o deployado):
```bash
# 1. HTTP/HTTPS check
curl -s -o /dev/null -w "%{http_code}" https://{dominio_projeto}/

# 2. PM2 status check
pm2 describe {pm2_service} | grep status

# 3. Se projeto tem DB: verificar integridade basica
sqlite3 /opt/hostinger-alfa/{projeto}/prisma/production.db "PRAGMA integrity_check;" 2>/dev/null
```

Apresentar tabela comparativa (TODOS os projetos do servidor):
```
╔══════════════════════════════════════════════════════════╗
║     VERIFICACAO POS-DEPLOY — TODOS OS PROJETOS          ║
╠════════════════╦════════╦═══════╦════════╦══════════════╣
║ Projeto        ║ PM2    ║ HTTPS ║ DB OK  ║ Porta        ║
╠════════════════╬════════╬═══════╬════════╬══════════════╣
║ {deployado} *  ║ online ║ 200   ║ ok     ║ {porta}      ║
║ {proj2}        ║ online ║ 200   ║ ok     ║ {porta}      ║
║ {proj3}        ║ online ║ 200   ║ ok     ║ {porta}      ║
╠════════════════╬════════╬═══════╬════════╬══════════════╣
║ Disco          ║ {X}GB livre                            ║
║ Nginx          ║ syntax ok                              ║
║ Default redir. ║ → a4tunados.com.br                     ║
╚════════════════╩════════════════════════════════════════╝
* = projeto deployado nesta operacao
```

Se QUALQUER projeto (incluindo o deployado) retornar erro:
```
🚨 ALERTA: {projeto} retornou HTTP {code}
Verificar se o deploy impactou outro projeto:
1. Conflito de porta? (ss -tlnp | grep {porta})
2. Nginx config sobrescreveu outro? (ls /etc/nginx/sites-enabled/)
3. PM2 restart acidental? (pm2 status)
Recomendacao: executar ROLLBACK (Stage 9)
Deseja executar rollback? (s/n)
```

**Validacao Playwright UI (OBRIGATORIA — Licao #10):**

Apos as verificacoes de infra acima, executar validacao Playwright contra a URL de PRODUCAO (HTTPS).
Roteiro minimo obrigatorio para projetos com interface web:

1. `browser_navigate` para `https://{dominio}/` — verificar que pagina carrega
2. `browser_snapshot` — capturar estado da pagina inicial
3. Se ha login: preencher credenciais e submeter
4. `browser_snapshot` apos login — verificar dashboard/pagina principal
5. Navegar para 2-3 rotas criticas do projeto
6. `browser_snapshot` em cada rota
7. Se o deploy envolveu mudancas visuais: validar elementos especificos (textos, logos, layouts)
8. Salvar screenshots via `browser_run_code` com `await page.screenshot({ path: 'evidencias/deploy_tela.png', fullPage: true })`

Todos os screenshots devem ser referenciados no relatorio de deploy (Stage 8).
Se Playwright detectar QUALQUER erro (pagina nao carrega, login falha, 500, etc): **BLOQUEAR Stage 7** e sugerir rollback.

**🔒 GATE 6**: Operador confirma verificacao automatizada + Playwright OK.

---

### Stage 7 — Validacao Funcional (Manual)

Instruir operador:

```
╔══════════════════════════════════════════════════╗
║     VALIDACAO FUNCIONAL — {PROJETO}              ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Abra no navegador:                              ║
║  https://{dominio}                               ║
║                                                  ║
║  Checklist:                                      ║
║  □ Pagina carrega sem erros                      ║
║  □ SSL valido (cadeado verde)                    ║
║  □ Login funciona                                ║
║  □ Dashboard carrega dados                       ║
║  □ Funcionalidades principais operam             ║
║  □ Console do DevTools: 0 erros                  ║
║  □ Uploads funcionam (se aplicavel)              ║
║  □ Exportacoes funcionam (se aplicavel)          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

**🔒 GATE 7 (FINAL)**: Operador confirma validacao funcional completa.

---

### Stage 8 — Documentacao + Retroalimentacao

#### 8.1 — Push da branch de deploy

```bash
git checkout deploy/hostinger-alfa
git push origin deploy/hostinger-alfa
```

#### 8.2 — Criar relatorio de deploy

Criar em `_a4tunados/deploys/hostinger-alfa/operacoes/`:

Formato: `{NNN}_{tipo}_{projeto}_v{VERSION}_{DATA}.md`

Conteudo:
- Versao deployada
- Data e hora
- Commits incluidos
- Migrations (antes → depois)
- Downtime medido
- Incidentes
- Licoes aplicadas de deploys anteriores
- Licoes NOVAS aprendidas
- Contagem de registros (baseline vs pos-deploy)
- Localizacao dos backups
- Comandos de rollback

#### 8.3 — Atualizar server-registry.json

```json
{
  "status": "deployed",
  "last_deploy": "2026-03-28T...",
  "last_deploy_version": "0.1.0",
  "ssl_status": "active",
  "ssl_expiry": "..."
}
```

#### 8.4 — Retroalimentacao (OBRIGATORIA)

Apos CADA deploy, a skill DEVE se auto-melhorar:

1. **Analisar**: houve algum incidente novo? comando falhou? etapa lenta demais?
2. **Se nova licao**: adicionar a `references/licoes-aprendidas.md` (proximo numero sequencial)
3. **Se novo erro**: adicionar secao "Error Handling" no SKILL.md
4. **Se fluxo ajustado**: atualizar stage correspondente
5. **Se rollback ocorreu**: adicionar a `references/rollback-procedures.md`
6. **Incrementar versao da skill**:
   - Patch (v1.0.0 → v1.0.1): novas licoes, ajustes de texto
   - Minor (v1.0.0 → v1.1.0): novos gates, novas fases, mudancas estruturais
   - Major (v1.0.0 → v2.0.0): redesign fundamental do fluxo
7. **Atualizar tabela de historico** no Contexto Operacional
8. **Perguntar ao operador**:
   ```
   Deploy documentado. Houve algo que voce observou que eu deveria
   incorporar como licao para proximos deploys? (feedback livre ou 'nao')
   ```
   - Se feedback: adicionar como nova licao imediatamente
   - Marcar como contribuicao do operador

#### 8.5 — Invocar tuninho-escriba

Apos documentacao do deploy, invocar escriba para alimentar a documentacao geral do projeto com informacoes de deploy seguindo todas as diretrizes do tuninho.

---

### Stage 9 — Rollback de Emergencia

> Pode ser acionado a QUALQUER momento se o operador disser "abort", "rollback", "reverter".

#### Level 1 — Quick Rollback (sem migrations)

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'
pm2 delete {projeto} 2>/dev/null || true   # Licao #43: delete em vez de stop
rm -rf /opt/hostinger-alfa/{projeto}
mv /opt/hostinger-alfa/{projeto}_pre_v{VERSION} /opt/hostinger-alfa/{projeto}
cd /opt/hostinger-alfa/{projeto} && pm2 start ecosystem.config.js
pm2 save
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://{dominio}/
REMOTE
```

#### Level 2 — Migration Rollback

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'
pm2 delete {projeto} 2>/dev/null || true   # Licao #43
# Restaurar DB do backup
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/{projeto}-pre-deploy-* | head -1)
cp $BACKUP_DIR/production.db /opt/hostinger-alfa/{projeto}/prisma/production.db
# Swap dirs
rm -rf /opt/hostinger-alfa/{projeto}
mv /opt/hostinger-alfa/{projeto}_pre_v{VERSION} /opt/hostinger-alfa/{projeto}
# Restaurar DB no dir restaurado
cp $BACKUP_DIR/production.db /opt/hostinger-alfa/{projeto}/prisma/production.db
cd /opt/hostinger-alfa/{projeto} && pm2 start ecosystem.config.js
pm2 save
REMOTE
```

#### Level 3 — Nuclear Rollback

```bash
ssh -i _a4tunados/env/hostinger/id_ed25519 root@31.97.243.191 << 'REMOTE'
pm2 delete {projeto} 2>/dev/null || true   # Licao #43
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/{projeto}-pre-deploy-* | head -1)
rm -rf /opt/hostinger-alfa/{projeto}
mv /opt/hostinger-alfa/{projeto}_pre_v{VERSION} /opt/hostinger-alfa/{projeto}
cp $BACKUP_DIR/production.db /opt/hostinger-alfa/{projeto}/prisma/production.db
cp $BACKUP_DIR/env.production.bak /opt/hostinger-alfa/{projeto}/.env.production
# Restaurar uploads
if [ -f $BACKUP_DIR/uploads_backup.tar.gz ]; then
  cd /opt/hostinger-alfa/{projeto}
  tar -xzf $BACKUP_DIR/uploads_backup.tar.gz
fi
pm2 flush {projeto}
cd /opt/hostinger-alfa/{projeto} && pm2 start ecosystem.config.js
pm2 save
REMOTE
```

**Apos QUALQUER rollback**: re-verificar TODOS os projetos no servidor (cross-project check).

---

## Regras Criticas

### Seguranca de Dados (1-4)
1. **NUNCA** deletar backups sem autorizacao explicita do operador
2. **NUNCA** prosseguir sem confirmacao do GATE
3. **NUNCA** auto-executar git commits sem gate
4. **NUNCA** sobrescrever .env.production com valores do repositorio

### Comandos Proibidos (5-8)
5. **NUNCA** `cp -r dir/ dest/` — causa nesting (usar `rsync -a`)
6. **NUNCA** `localhost` em URLs de DB ou config — usar `127.0.0.1`
7. **NUNCA** fazer deploy direto na main/master
8. **NUNCA** deletar diretorio pre_version antes de confirmar deploy OK

### Comandos Obrigatorios (9-15)
9. **SEMPRE** `COPYFILE_DISABLE=1` no tar em macOS
10. **SEMPRE** `chmod 600` na chave SSH antes de usar
11. **SEMPRE** `find . -name '._*' -delete` apos extract no servidor
12. **SEMPRE** `nginx -t` antes de `systemctl reload nginx`
13. **SEMPRE** `pm2 save` apos qualquer mudanca no PM2
14. **SEMPRE** `npx prisma generate` no servidor (arquitetura Linux ≠ macOS)
15. **SEMPRE** verificar cross-project apos deploy E apos rollback

### Auto-melhoria (16-20)
16. **SEMPRE** ler licoes aprendidas no inicio do deploy
17. **SEMPRE** atualizar skill apos cada deploy
18. **SEMPRE** perguntar feedback ao operador
19. **NUNCA** repetir erros ja documentados
20. **SEMPRE** documentar novos aprendizados imediatamente

### Deploy (21-23)
21. **NUNCA** fazer hotfix direto no servidor (SCP de arquivo individual). SEMPRE editar local, commitar, tarball completo.
22. **SEMPRE** verificar se `build-essential` esta instalado antes de `npm install` em projetos com modulos nativos (node-pty, better-sqlite3, sharp, etc.)
23. **SEMPRE** verificar `"type"` no package.json: se `"module"`, usar `ecosystem.config.cjs` (nao .js)

### Self-Deploy (24-27) — v2.0.0
24. **SEMPRE** editar no workspace (git-tracked) primeiro, deploy depois — o workspace no servidor e o "local" em self-deploy, producao e o alvo
25. **NUNCA** usar `tmux kill-server` durante self-deploy — mata a sessao do IDE/Claude Code que esta executando o deploy
26. **SEMPRE** garantir auto-reconnect WebSocket implementado ANTES do primeiro self-deploy de qualquer projeto — pre-requisito inviolavel
27. **SEMPRE** incluir `workspaces/`, `data/`, `.claude/`, `_a4tunados/` nos rsync_excludes de self-deploy — NUNCA sincronizar dados de workspace para producao
28. **ACEITAR HTTP 200, 302 e 304** como respostas validas em health checks — 304 (Not Modified) indica cache ativo e nao e erro
29. **VALIDAR PRE-FLIGHT explicitamente** antes de qualquer deploy SELF-DEPLOY: (a) `pm2 describe {app}` deve retornar sucesso, (b) diretorio de producao deve existir. Se qualquer falhar, ABORTAR com mensagem clara
30. **npm install SELF-DEPLOY usa `--production`** (ou `--omit=dev`) para manter node_modules leve em producao — exceto quando devDependencies sao necessarias para build (ex: Tailwind, esbuild)
31. **ESTA SKILL E O UNICO PONTO DE DEPLOY** — scripts avulsos de deploy (deploy.sh, deploy-*.sh) NAO devem ser usados diretamente. Todo deploy, independente do modo (REMOTE ou SELF-DEPLOY), DEVE passar por esta skill. Scripts avulsos devem ser desabilitados com header de aviso redirecionando para esta skill. Isso garante: gates de confirmacao, cross-project checks, backup automatico, catalogacao de env, e rastreabilidade
32. **APOS cada deploy bem-sucedido**, atualizar o catalogo de ambiente (`tuninho-devops-env`) com informacoes de versao, data do deploy e estado pos-deploy. O catalogo e a fonte de verdade para isolamento dev/prod
33. **NUNCA mover (mv) diretorios ANTES de atualizar o codigo em SELF-DEPLOY**. Mover cria estado intermediario fatal: codigo antigo + estrutura nova = servico quebrado + agente com Bash bloqueado (CWD inexistente). Ordem segura: copiar (cp -al) → rsync → restart → verificar → so entao remover originais
34. **REMOTE deploys e rollbacks usam `pm2 delete`, nao `pm2 stop`** (Licao #43). Em Stage 5 e Stage 9, substituir `pm2 stop {projeto}` por `pm2 delete {projeto} 2>/dev/null || true` antes do mv(dir). Motivo: PM2 mantem entries internas apontando para o `cwd`. Quando o diretorio e movido, o entry fica com state stale e `pm2 start ecosystem` posterior falha silenciosamente (status=stopped, HTTP 502, logs vazios). `pm2 delete` limpa o entry completamente; o `start` subsequente cria entry fresh. Para SELF-DEPLOY, manter `pm2 restart` graceful (nao se aplica pois nao ha mv).
35. **Platform-specific binaries apos npm ci/install exigem fix automatico** (Licao #44, L-REV-4). Pacotes AI (`@anthropic-ai/claude-agent-sdk`, etc) empacotam binarios per-platform (`linux-x64` glibc vs `linux-x64-musl`) e o `npm ci/install` nao preserva `+x` na extracao. Em TODO Stage 5 (SELF-DEPLOY 5.2b ou REMOTE 5.8b), pos-`npm install`, rodar: `find node_modules -path '*/claude*/claude' -type f -exec chmod +x {} \;` e, se `ldd --version` reporta glibc, `find node_modules -path '*linux-x64-musl*/claude' -type f -delete`. Sintoma: app Next.js sobe no PM2 mas endpoints que spawnam o binario retornam erro runtime ou quebram SSE.
36. **Nginx reverse proxy com session cookies >4KB exige buffers ampliados** (Licao #45, L-REV-6). Projetos que usam Firebase Auth, Auth0, ou qualquer OAuth com session cookies assinados (tipicamente 3-4KB) devem incluir no `server` block do template `proxy_buffer_size 16k; proxy_buffers 8 16k; proxy_busy_buffers_size 32k;`. Sem isso, a primeira login de qualquer conta nova retorna 502 Bad Gateway com mensagem `upstream sent too big header`. Stage 0B.5 ja inclui esses buffers no template padrao a partir de v3.1.0. Em projetos legados, adicionar manualmente e `systemctl reload nginx`.
37. **Modo `--autonomous` exige pre-checks endurecidos + auto-rollback + relatorio** (v3.2.0). Quando deploy roda sem operador presente (cron, /loop, agent SDK), cada GATE humano e substituido por auto-aprovacao CONDICIONAL: cada gate tem regra objetiva que DEVE passar (ex: GATE 0 aprova se `risk_level <= MEDIUM`, GATE 2 aprova se todos projetos do servidor estao `online`, GATE 6 aprova se Playwright + curl smoke tests passam). Em FAIL de qualquer stage, dispara Stage 9 (rollback) AUTOMATICAMENTE + registra em `_a4tunados/deploys/{host}/autonomous-rollback-*.log` + notifica proxima sessao via `session-tracker.json` campo `autonomous_rollback_pending`. TODA saida de comando deve ser capturada em log estruturado via tee. Relatorio final em `autonomous-report-{ts}.md` e obrigatorio com: modo/trigger/risk/stages/duracao/resultado. Anti-padroes: NAO usar em bootstrap (muitas decisoes humanas), NAO usar em migrations irreversiveis, NAO usar sem baseline de deploy interativo previo. Motivacao: Op 03 teve deploys inline em modo autonomo que violaram Regra #24; formalizar o modo fecha a lacuna sem forcar degradacao de seguranca em deploys normais.

38. **🚨 Modo autonomo exige MAIS rigor que modo interativo, nao menos** (v3.2.2 — Op 05 go-live 2026-04-23). **NAO VIOLAVEL**. Em modo interativo, o operador serve como ultimo check contra smoke insuficiente, screenshot nao interpretado, mensagem de SUCCESS enganosa. Em autonomo nao tem ninguem — so o codigo desta skill. Por isso cada passo feito em interativo deve ser feito + 1 verificacao adicional objetiva em autonomo. Regra heuristica: **se o deploy autonomo foi mais rapido que o equivalente interativo, foi mal-feito**. Causa raiz do incidente Op 05: eu (agente) tratei modo autonomo como "modo agil" e pulei Playwright em URL publica. Resultado: bundle client quebrado em prod declarado SUCCESS. Nunca mais. Esta regra aplica a qualquer skill `tuninho-devops-*` que implemente `--autonomous`.

39. **Restaurar TODOS os `.env*` do PREV ANTES do build + validar inlining pos-build** (v3.2.2 — Licao #46). Stage 5.5 DEVE iterar sobre `.env.production .env.local .env .env.preview` restaurando do PREV dir (pattern bash em loop — codigo atualizado). Stage 5.11a DEVE validar que variables `NEXT_PUBLIC_*` estao inlined no bundle client (`.next/static/*`) via grep de pattern conhecido do projeto. Se grep vazio num projeto que usa Firebase/Stripe/outros SDKs client-config: FAIL bloqueante → Stage 9 rollback. Motivo: Next.js inline no build time — bundle compilado sem env config e client-broken mesmo que SSR retorne 200. Foi o que matou Op 05 go-live e passou por 4 gates do meu proprio fluxo. Projetos podem declarar patterns adicionais via sidecar em `required_public_env_patterns`.

40. **Downtime tecnico != downtime funcional — medir e reportar AMBOS** (v3.2.3 — Licao #47, Op 05). Downtime tecnico (entre `pm2 delete` e primeiro `curl /` 200) e so a superficie. Downtime funcional (tempo durante o qual usuario real nao consegue usar o produto) pode ser 10x maior se o bundle client estiver quebrado ou um fluxo E2E falhar. Autonomous-report DEVE incluir ambos: `downtime_tecnico_segundos` (mensurado por timestamp delete → curl 200) E `downtime_funcional_segundos` (mensurado por timestamp delete → Playwright click no CTA principal sem console error). Se so tecnico for registrado, o relatorio **mente por omissao** — foi o que aconteceu na Op 05 (relatorio declarou ~90s, realidade foi ~22min ate browser real funcionar). Em autonomous, downtime_funcional e a metrica canonica de sucesso do deploy.

41. **Addendum ao autonomous-report quando ha intervencao pos-SUCCESS** (v3.2.3 — QA-retro Op 05). Se o relatorio autonomous foi gerado declarando SUCCESS e posteriormente houve hotfix (manual ou via nova invocacao da skill), o relatorio ORIGINAL DEVE ganhar um arquivo-irmao `autonomous-report-{ts}-addendum.md` documentando: (a) quando o incidente foi detectado e por quem (operador vs skill), (b) root cause, (c) o que o relatorio original disse que estava OK e nao estava, (d) fix aplicado, (e) nova validacao E2E. Nunca editar o relatorio original — ele e snapshot do que a skill afirmou naquele momento; addendum e honestidade historica. O `tuninho-hook-inicio-sessao` apos seal deve listar addendums nao-lidos junto com os reports originais.

---

## Error Handling

| Erro | Causa Provavel | Solucao |
|------|---------------|---------|
| `Permission denied (publickey)` | Chave SSH sem permissao 600 | `chmod 600 _a4tunados/env/hostinger/id_ed25519` |
| `Connection refused` | Servidor desligado ou SSH desativado | Verificar no painel Hostinger, usar console web |
| `nginx: [emerg] duplicate listen` | Porta/server_name conflitante | Verificar `/etc/nginx/sites-enabled/` por duplicatas |
| `certbot: DNS problem` | DNS nao propagado | Aguardar propagacao ou verificar registro A |
| `ENOSPC` | Disco cheio | `df -h /` + limpar `/tmp/` e backups antigos |
| `pm2 restart` falha (self-deploy) | Processo crashed no restart | `pm2 logs {projeto} --lines 30`, rsync rollback do backup |
| WebSocket nao reconecta (self-deploy) | Auto-reconnect nao implementado | Verificar client-side reconnect, refresh browser |
| rsync --delete remove arquivo necessario | Exclude list incompleta | Adicionar pattern ao rsync_excludes do sidecar, restaurar backup |
| ANSI codes em PM2 output | PM2 colore output no terminal | `sed 's/\x1b\[[0-9;]*m//g'` antes de parsear (Licao #33) |
| `SQLITE_BUSY` | DB travado por processo | `pm2 stop` antes de operar no DB |
| `prisma migrate deploy` falha | Schema incompativel | Verificar migrations, considerar rollback |
| `pm2 start` mas HTTP 502 | App crashando | `pm2 logs {projeto}` para diagnosticar |
| `ERR_SSL_PROTOCOL_ERROR` | Certbot nao configurou SSL | Re-executar certbot, verificar Nginx config |

---

## Versionamento

| Versao | Data | Mudanca |
|--------|------|---------|
| v1.0.0 | 2026-03-28 | Versao inicial — bootstrap + deploy flow completo |
| v1.1.0 | 2026-03-28 | 8 licoes do primeiro bootstrap, correcoes: build no servidor (nao standalone), AUTH_SECRET, AUTH_TRUST_HOST |
| v1.2.0 | 2026-03-29 | Licoes #9-13: commit antes de merge, Playwright UI obrigatorio no Stage 6, npm sem --omit=dev (Tailwind), symlink .env, SSL cert antes de Nginx HTTPS |
| v1.3.0 | 2026-03-29 | Licoes #14-18: seed auto DB vazio, DATABASE_URL absoluto, sessao Claude no .gitignore, rename sub-fluxo, ecosystem.config.js completo. Stage 0 detecta rename. Stage 0.5 verifica branch limpa + gitignore. Stage 5 com symlink .env + seed check + npm install sem --omit=dev. Stage 6 cross-project reforçado para multi-projeto. |
| v1.4.0 | 2026-03-30 | Licoes #19-22: build-essential para modulos nativos (node-pty, better-sqlite3), envStr vazio em bash, Claude CLI global no servidor, ESM requer ecosystem.config.cjs. Primeiro deploy nao-Next.js (Express+WS+tmux). Historico atualizado com 3 deploys. |
| v1.5.0 | 2026-03-30 | Licoes #23-26: postinstall cross-platform, deploy local-first OBRIGATORIO (nunca hotfix direto), tmux mouse off para web terminals, multi-viewer terminal (1 PTY N WebSockets). |
| v1.6.0 | 2026-03-30 | Regras #21-23 formalizadas (local-first, build-essential, ESM .cjs). Stage 0B.1 verifica build-essential. Stage 0B.8 nota sobre ESM .cjs. Licoes promovidas a regras no fluxo. |
| v1.7.0 | 2026-03-30 | Licoes #27-30 (chooz_2026): sshpass, Drizzle ORM, Next.js sem Prisma, diretorios writable. |
| v3.4.2 | 2026-04-25 | PATCH — Stage 6.5 NOVO (Validacao prod E2E via dev-bypass) + template de endpoint dev-bypass para projetos com auth real (Firebase/Auth0). Aprendizado da Op 04 card-isolated tuninho.ai card 1760885350227510504: agente nao conseguia validar fluxos pos-login em prod sem bypass, e operador teve que pedir explicitamente *"Cara precisamos resolver o auth para prod pra vc testar o que esta deployado. Está em prod controlado, portanto não é grave. Faça isso pf"*. Solucao virou template reusavel: (1) endpoint `/api/auth/dev-bypass?secret=XXX` que retorna 307 + Set-Cookie httpOnly secure 1h quando match com env `DEV_BYPASS_SECRET`; (2) middleware aceita cookie `x-dev-bypass`; (3) ativo so se `DEV_BYPASS_SECRET` + `DEV_BYPASS_USER_ID` setadas (fail-safe — endpoint retorna 404 sem envs); (4) Stage 6.5 invoca via Playwright `addCookies` + `goto /app` para rodar smoke E2E pos-login. Para revogar: unset envs + restart pm2. Cookie expira sozinho 1h. Template completo em `references/dev-bypass-template.md`. |
| v3.4.1 | 2026-04-24 | PATCH — Reforco L-OP07-1 (PM2 env contamination reincidente na Op 07 card-isolated). `pm2 restart --update-env` NAO e confiavel pra services cluster com env no ecosystem.config.cjs — herda env do parent PM2 daemon em vez de recarregar do file. Evidencia: durante desenvolvimento da feature card-isolated, restart --update-env matou o `claude-sessions-service` silenciosamente com EADDRINUSE (herdou PORT=3847 em vez de 3848 do file). **Fix enforced**: toda documentacao + exemplos de hotfix agora mostram `pm2 delete + pm2 start ecosystem.config.cjs` (sem --update-env) como padrao. Adicionada nota explicita na Error Handling table. Regra #34 ja dizia isso mas foi violada repetidamente durante dev da feature Op 07 — reforco reduz probabilidade de reincidencia. |
| v3.4.0 | 2026-04-23 | **MINOR — Reclassificacao Regra #26 (era v3.2.3 PATCH).** Licao #47 + QA-retro Op 05: 2 novas Regras Inviolaveis + 1 stage novo. **(1) Regra Inviolavel #40**: autonomous-report mede `downtime_tecnico` E `downtime_funcional` separadamente — primeiro e timestamp `pm2 delete`→`curl /` 200, segundo e timestamp `pm2 delete`→Playwright click no CTA sem console error. Op 05 declarou 90s tecnico enquanto funcional foi ~22min. **(2) Regra Inviolavel #41**: mecanismo de addendum ao autonomous-report quando ha hotfix pos-SUCCESS. Cria arquivo-irmao `{ts}-addendum.md` com root cause + o que relatorio mentiu + fix + nova validacao. **(3) Stage 5.13 NOVO sobre `pm2 restart --update-env`** (L5.4): apos mudanca de env em processo ja rodando, usar `--update-env` explicito; para start fresh pos-delete nao e necessario. Prepara pro `tuninho-hook-inicio-sessao` futuro listar addendums nao-lidos no briefing (propagacao cruzada com hook na v3.3.0+). |
| v3.3.0 | 2026-04-23 | **MINOR — Reclassificacao Regra #26 (era v3.2.2 PATCH critico). Licao #46 (L-REV-5 Op 05 go-live tuninho.ai): 2 novas Regras Inviolaveis + 1 stage novo + GATE 6 reescrito.** Incidente: deploy autonomo v0.4.0 declarou SUCCESS apos GATE 6 baseado em `curl /` → 200. Realidade: bundle client compilado SEM `NEXT_PUBLIC_FIREBASE_*` porque Stage 5.5 so restaurava `.env.production` e as Firebase keys viviam em `.env.local`. SSR respondia 200 (runtime le env), browser do usuario quebrava com `auth/invalid-api-key` silenciosamente. Operador detectou "URL nao navegando" em prod. **Mudancas de comportamento**: (1) Stage 5.5 agora itera `.env.production .env.local .env .env.preview` do PREV e restaura TODOS antes do `npm run build` (nao so `.env.production`); (2) Stage 5.11a NOVO: valida pos-build que Firebase API key (pattern `AIza[A-Za-z0-9_-]{35}`) esta inlined em `.next/static/*` quando projeto usa Firebase — FAIL bloqueante se vazio; (3) GATE 6 autonomo reescrito: curl SOZINHO nunca libera — exige grep de env inlined + Playwright REAL em URL publica + `browser_console_messages` sem FirebaseError/Application error + screenshot salvo. **Novas Regras Inviolaveis**: #38 (autonomo = mais rigor, nao menos) e #39 (restore todos `.env*` + validate inlining). Principio master adicionado no topo da secao `--autonomous`. |
| v3.2.1 | 2026-04-22 | PATCH — 3a forma de ativacao do `--autonomous`: detecao de branch `card/(feat\|fix)/[a-z0-9-]+-\d{6}`. Quando runtime detecta padrao, forca `--autonomous` + injeta `--card-id` derivado do suffix da branch. Log e relatorio incluem cardId para rastreabilidade com fluxo card-isolated (DDCE v4.4.0 / fix-suporte v2.1.0). Operador pode forcar interativo via `--interactive` (opt-out explicito sempre respeitado). |
| v3.2.0 | 2026-04-22 | **Modo `--autonomous`** (MINOR): formaliza deploy sem operador presente (cron, /loop, agent SDK). Ativacao via argumento `--autonomous` OU sidecar `autonomous: true`. Cada um dos 8 GATES humanos ganha regra objetiva de auto-aprovacao condicional (ex: GATE 0 `risk_level <= MEDIUM`, GATE 6 `Playwright+curl OK`). FAIL em qualquer stage dispara Stage 9 (rollback) AUTOMATICAMENTE + log em `_a4tunados/deploys/{host}/autonomous-rollback-*.log` + notificacao ao proximo `tuninho-hook-inicio-sessao` via `session-tracker.json` campo `autonomous_rollback_pending`. Log estruturado via tee obrigatorio. Relatorio final em `autonomous-report-{ts}.md` obrigatorio. Nova Regra Inviolavel #37. Anti-padroes: NAO em bootstrap, NAO em migrations irreversiveis, NAO sem baseline interativo previo. Resolve violacao de Regra #24 (deploy inline) observada na Op 03 go-live tuninho.ai. |
| v3.1.0 | 2026-04-22 | Licoes #44-45 + Regras #35-36 (L-REV-4, L-REV-6 da Op 03 go-live tuninho.ai). **Stage 5 (REMOTE 5.8b + SELF-DEPLOY 5.2b)**: pos-`npm install`, `chmod +x` em binarios `claude*` + `find -delete` de variantes musl em host glibc — resolve chat SSE quebrado em prod por `EACCES` ou ELF mismatch. **Stage 0B.5 (Nginx template)**: buffers ampliados por padrao (`proxy_buffer_size 16k / proxy_buffers 8 16k / proxy_busy_buffers_size 32k`) — evita 502 `upstream sent too big header` em primeira login com Firebase/Auth0. **Stage 0B.6 (certbot)**: pre-check DNS single-IP antes de `certbot --nginx` — multi-IP faz Let's Encrypt falhar validacao ACME. Modo `--autonomous` (sem gates) fica para v3.2.0 — separado por ser mudanca arquitetural maior. |
| v3.0.3 | 2026-04-18 | Licao #43 + Regra #34: Em deploys/rollbacks REMOTE, usar `pm2 delete` em vez de `pm2 stop` antes do mv(dir). Evita state stale que causa HTTP 502 com logs vazios no segundo deploy do mesmo dia. Stage 5.1 e Stage 9 (Levels 1-3) atualizados. Descoberta no Deploy 002 chooz_2026 (fix UX pos-Op18). |
| v2.2.1 | 2026-04-04 | Licao #35: Sidecar deve ser atualizado quando operacao muda paths estruturais. Sidecars stale com paths antigos podem causar rsync para origem errada. |
| v2.2.0 | 2026-04-03 | Licao #34 + Regra #33: **NUNCA mover diretorios antes de atualizar codigo em SELF-DEPLOY**. Mover cria estado intermediario fatal (codigo antigo + estrutura nova = servico quebrado + agente com Bash bloqueado). Ordem segura: copiar (cp -al) → rsync → restart → verificar → remover originais. Nota SELF-DEPLOY no Stage 5 atualizada. |
| v2.1.0 | 2026-04-03 | Regras #28-32: aceitar HTTP 304, pre-flight explicito PM2/PROD_DIR, npm --production em self-deploy, **centralizacao de deploy** (scripts avulsos desabilitados), integracao pos-deploy com tuninho-devops-env para catalogacao. |
| v2.0.0 | 2026-04-02 | **SELF-DEPLOY mode** (major): auto-deteccao REMOTE vs SELF-DEPLOY baseada no cwd e sidecar. Stages 2, 3, 4, 5, 6, 9 com variantes condicionais por modo. SELF-DEPLOY usa rsync incremental (sem tarball), PM2 restart graceful (sem stop+start), backup SQLite WAL-safe, npm install/build condicionais. Downtime ~3-5s vs ~30-60s. Sidecar estendido com campos self-deploy (deploy_mode, workspace_path, rsync_excludes, conditional_triggers, cross_projects). Regras #24-27. Licoes #31-33. Backward compatible — sidecars sem deploy_mode defaultam para REMOTE. |

---

*Tuninho DevOps Hostinger v3.5.2 — a4tunados-ops-suite | Reincidencia L-OP07-1 (pm2 restart --update-env banido) + 4 fontes do board Dev tuninho.ai documentadas + hotfix dev-bypass redirect com x-forwarded-host (Card 134, 2026-04-29)*
