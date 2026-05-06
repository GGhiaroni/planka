# Tuninho Mural v5.0.2

## v5.0.2 — Sessão 4 QA EXTREMO bug fix + pattern echo (Card 1768281088850920655 — 2026-05-06)

**2 aprendizados absorvidos**:

### 1. Bug fix: card-result mode `boardResp is not defined`
Em S4 da operação, ao chamar `card-result --mark-validating`, comment foi postado com sucesso (id 1768632963290891676) mas o move pra Validando falhou com `Error: boardResp is not defined`. Workaround usado: `update-card --list <listId>` direto.

**Fix necessário**: revisar variável `boardResp` em `cli/mural-cli.js` modo card-result (provavelmente refactor que removeu variável mas deixou referência).

### 2. Pattern: comment payload echo como auto-validação modo autônomo
Em modo OBL-AUTONOMOUS-MODE-2, validação humana B.9 substituída por API response payload echo (`Comment created: <id>` + JSON echo) em ações idempotentes mural. Suficiente pra ações como pull-in cards (T0.1) sem precisar operador confirmar visualmente.

### Aplicação concreta
- Documentar pattern de auto-validação via response echo nos READMEs
- Bug fix card-result em próximo PR

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

# Tuninho Mural v0.12.0

## v0.12.0 — Modo `get-board-workspace` + método `getBoardClaudeWorkspace` no PlankaClient (card 1762662734295467499 — 2026-05-04)

**Aprendizado canônico Card 1762662734295467499** ("Implementar a mesma integração tuninho mural em outros quadros"):

A operação revelou que `Board.claudeWorkspace` (JSON field nativo do fork a4tunados_mural Planka) é o ponto canônico onde o repo/workspace do board é configurado. O `claude-sessions-service/server/lib/board-workspace-resolver.js` agora consulta esse campo runtime (ADR `board-claudeworkspace-runtime-resolution.md`).

A skill `tuninho-mural` ganha capacidade complementar para **diagnosticar** o estado de configuração de um board.

### Novo modo CLI: `get-board-workspace`

```bash
node cli/mural-cli.js get-board-workspace --board <BOARD_ID> --origin mural-a4tunados --env prod
```

**Output**:
```
[tuninho-mural] origin=mural-a4tunados clientKind=PlankaClient
[tuninho-mural] Board {ID} — claudeWorkspace:
  - primary: /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai
  - secondary (1): /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai-staging
{
  "boardId": "1754040192068486986",
  "claudeWorkspace": [
    "/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai",
    "/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai-staging"
  ],
  "primary": "/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai"
}
```

### Novo método no PlankaClient

```javascript
// clients/planka-client.js
async getBoardClaudeWorkspace(boardId) {
  const res = await this.request('GET', `/api/boards/${encodeURIComponent(boardId)}`);
  const cw = res?.item?.claudeWorkspace;
  if (!cw) return { workspace: null, primary: null };
  if (Array.isArray(cw)) {
    return { workspace: cw, primary: cw.length > 0 ? cw[0] : null };
  }
  return { workspace: [cw], primary: cw };
}
```

Útil para:
- Diagnóstico antes de configurar board novo
- Validar deploy do Card 467499 (resolver multi-source)
- Pre-flight pré-dispatch (auditoria via tuninho-qa v0.21.0+ sub-check `audit-board-workspace-coverage`)

### Smoke (validado durante a propria Op 467499)

Após deploy do Card 467499, este modo permite verificar que a configuração do board está correta antes de tentar dispatch via comment.

### Origem operacional

Card 1762662734295467499 (tuninho.ai, 2026-05-04). Bump MINOR consolidando complemento ao deploy multi-source do dispatcher.

---

## v0.11.0 — Movimentação de cards entre listas vai para o TOPO da lista destino (card 1767551614240949263 — 2026-05-04)

**Aprendizado canônico operador 2026-05-04** durante encerramento do card 1767551614240949263 ("Sessão de Correção 502 bad gateway"):

Ao mover o card `Validando → Done` no fim da operação, ele entrou no FIM da lista "Done" (position 262144 — maior que todas as existentes). Operador detectou que isso atrapalha visibilidade — em uma lista com vários cards finalizados, qual foi o último movido?

Quote operador (verbatim):
> *"sempre que mover de uma coluna para outra o card precisa estar no topo da lista no ato da movimentação, assim ficará claro qual foi o último card movimentado caso tenham outros na mesma lista"*

### Mudança v0.11.0

Novo helper `resolveTopPositionForList(boardResp, targetListId)` em `cli/mural-cli.js`:
- Lista vazia: retorna `65536` (default razoável)
- Lista com cards: retorna `Math.max(1, Math.floor(min(positions) / 2))` — metade da menor position existente, com piso 1 (evita 0/negativo)

Aplicado em 3 modos:

| Modo | Comportamento v0.11.0 | Override manual |
|---|---|---|
| `card-result` (move pra "Validando") | Topo da lista destino | `--position <N>` força valor explícito |
| `card-validated` (move pra "Done") | Topo da lista destino | `--position <N>` força valor explícito |
| `update-card --list <id>` (move genérico) | Topo da lista destino (fetch getBoard inline) | `--position <N>` força valor explícito |

Planka usa position ascendente: menor = topo, maior = fim. Antes da v0.11.0, todos os modos usavam `Number(args.position) || 65536`, fazendo cards moverem pro fim (já que listas existentes têm positions >= 65536 tipicamente).

### Caso canônico (raiz da v0.11.0)

Card 1767551614240949263 entrou em "Done" position 262144 (último). Lista tinha cards em 32768 e 65536. Após v0.11.0, próximo card movido pra "Done" terá position = `floor(32768/2) = 16384` (topo).

### Anti-padrões rejeitados explicitamente

- ❌ Usar `position: 0` — Planka aceita mas comportamento estranho com float positions futuras
- ❌ Hardcode `position: 1` — funciona 1x; se mover 2 cards consecutivos pra mesma lista, ambos em position 1, ordem indefinida
- ❌ Buscar TODOS os cards da board sem filtro — desperdício; filtro por `listId` é barato e correto

### Sub-check QA futuro

Proposta tuninho-qa v0.21.0+: `audit-card-move-position`. Cruza JSONL com chamadas `updateCard` que mudam `listId` e valida que a position resultante é menor que a menor existente da lista destino. WARN se ficou no fim/meio (provável regressão).

### Backward compat

`--position <N>` continua funcionando exatamente como antes (override explícito). Só o DEFAULT mudou. Operações pre-v0.11.0 que dependiam de "card vai pro fim" precisam passar `--position 9999999` daqui pra frente.

### Origem operacional

Card 1767551614240949263 (a4tunados_web_claude_code, 2026-05-04) — pedido pós-encerramento da operação card-isolated DDCE rigoroso autônomo "Sessão de Correção 502 bad gateway". Bump MINOR aditivo. Cooperação esperada com `tuninho-qa` v0.21.0+ (sub-check `audit-card-move-position`).

---

## v0.10.0 — Attachments support (card 1766766663711065657 — 2026-05-03)

**Card mural "Trabalhar com anexos do mural"** (board "tuninho IDE", fluxo card-isolated DDCE) pediu que operacoes a4tunados pudessem (1) buscar anexos de cards e (2) postar evidencias/prints como comentarios durante operacoes — analogamente ao fluxo de feedback textual.

### 3 modos novos no CLI

#### `fetch-attachments` — listar (e opcionalmente baixar) anexos de um card

```bash
node cli/mural-cli.js fetch-attachments --card <ID> [--download-to <folder>] [--env dev|stage|prod]
```

Delega à `client.attachments.listAttachments(cardId)` (mural-api-client v0.2.0+) que internamente chama `getCard().included.attachments`. Output JSON com `count` + `items[]` (id, name, type, url, sizeInBytes, mimeType).

Com `--download-to`, baixa cada arquivo. Lib envia Bearer header + cookie fallback automaticamente — funciona com bot INTERNAL_ACCESS_TOKEN apos a4tunados_mural PR #6 (paridade Bearer em /attachments/*) deployado. Cooperacao com `tuninho-delivery-cards@>=1.8.0` que usa este modo automaticamente quando card mural tem anexos (subpasta `cards/{id}_*/attachments/`).

#### `attach-evidence` — upload single + comment vinculado

```bash
node cli/mural-cli.js attach-evidence --card <ID> --file <path> [--text <markdown>] [--env ...]
```

Lê arquivo, detecta mimeType pela extensão, faz upload via `client.attachments.uploadFile`, cria comment com `attachmentIds=[<id>]` referenciando o anexo. Texto é opcional — se omitido, posta `📎 Evidência: filename`.

#### `card-evidence` — batch upload de pasta inteira + 1 comment markdown

```bash
node cli/mural-cli.js card-evidence --card <ID> --folder <path> \
  [--text <md header>] [--filter <regex>] [--concurrency <n>] [--env ...]
```

Varre pasta, filtra por regex (default `\.(png|jpe?g|gif|webp|svg|pdf|md|txt|log|json|ya?ml)$`), faz upload paralelo (cap 3 simultâneos por default — `--concurrency` configurável), cria 1 comment markdown listando todos com seus `attachment_id`. Pensado para integração no fluxo DDCE Etapa 11/15.X com `--folder fase_NN/evidencias/`.

### Cooperação com mural-api-client v0.2.0+

- `AttachmentsEndpoint.listAttachments(cardId)` (delegado a getCard, não rota direta)
- `AttachmentsEndpoint.uploadFile` com fix bug Planka [#1352](https://github.com/plankanban/planka/issues/1352) (ordem multipart `name` antes de `file` para arquivos >64KB)
- `requestForm` timeout multipart ≥60s
- Cache invalidation `attachments:${cardId}` sincronizada

### Anti-padrões e limitações documentadas

- **Servidor sem PR #6 deployado**: bot Bearer retorna 401 em downloads. Lib v0.2.0 envia cookie accessToken automaticamente — para CLIs que ainda precisam baixar antes do deploy, usar `client.login(emailOrUsername, password)` para gerar session JWT real (cookie funciona independente do PR).
- **mimeType incorreto = ícone genérico**: Planka usa mimeType do upload para escolher thumbnail/ícone. Sempre passar mimeType correto para PNG/JPG/PDF (default `application/octet-stream` mostra genérico).
- **Concurrency alta pode rate-limit**: cap default 3 simultâneos é seguro. Aumentar só se servidor tem capacidade documentada.

### Reference

Ver `references/attachments-howto.md` para exemplos completos de uso, troubleshooting e snippets de invocação a partir de operações DDCE.

### Smoke test cooperativo (com lib v0.2.0 + servidor PR #6 deployado)

```
=== 7/7 PASS ===  (mural.a4tunados.com.br dev, 2026-05-03 pos-deploy)
✓ listAttachments (initial) — count=N
✓ uploadFile (10KB)
✓ uploadFile (>64KB Planka #1352)
✓ listAttachments (after uploads) — count grew
✓ downloadFile (Bearer + cookie) — len=10240 bytes_match=true   ← REAL bytes!
✓ createComment with attachmentIds
✓ createLink
```

**Pre-PR #6** (registro historico): a linha `downloadFile` retornava `expected 401 (Planka session-bound)` porque o middleware `/attachments/*` so lia cookie. Pos-PR #6 + lib v0.2.0 com cookie fallback = funciona com bot e session.

---

## v0.9.0 — CLI implementation gap fechado: card-result, card-validated, move-card + repos_mapping multi-repo (Op 18 Card 1+2, 2026-05-02)

**Aprendizado canônico Op 18 (a4tunados_web_claude_code, 2026-05-02)**: SKILL.md v0.8.0 documentou modos `card-result`, `card-validated`, `discover-board`, `register-board` mas o CLI `cli/mural-cli.js` ainda estava em v0.1.0 (8 modos básicos apenas). Gap conhecido v0.2.1. Op 18 Card 1 (movimento auto cards mural em todos gates DDCE) + Card 2 (multi-repo) força fechamento do gap.

### Modos novos implementados em v0.9.0

#### `move-card` — DDCE Etapa 15.X em todos os gates (D4)

```bash
node cli/mural-cli.js move-card --card <ID> --to <todo|doing|validando|done> --project <nome>
```

Resolve `--to` via sidecar `lists_mapping`. Aceita uuid direto se for numérico. Implementa Decisão D4 da Op 18.

#### `card-result` — DDCE Etapa 15.5 (Mural Export tecnico)

```bash
node cli/mural-cli.js card-result --card <ID> --results <path> \
  --pr-url <URL> --contract-path <PATH> --mark-validating --project <nome>
```

Posta resultado técnico + opcional move pra "validando" + header com PR + contract refs. healthCheck fail-fast.

#### `card-validated` — DDCE Etapa 18 (Mural Export final)

```bash
node cli/mural-cli.js card-validated --card <ID> --summary "..." \
  --escriba-ref <path> --seal-ref <path> --project <nome>
```

Posta comment final referenciando escriba + Comlurb seal + move pra "done".

#### `discover-board` + `register-board` — implementação real (v0.8.0 docs)

`register-board` automaticamente extrai listas canônicas (`todo`, `doing`, `validando`, `done`) via heurística de nome e escreve sidecar em `projects/{project}/config.md` com `lists_mapping` populado. `repos_mapping` adicionado como template comentado para multi-repo.

### Schema sidecar v0.9.0 — `repos_mapping` opcional (Op 18 Card 2)

```yaml
repos_mapping:
  a4tunados_web_claude_code:
    comment_prefix: "[ide]"
    link_branch_prefix: "https://github.com/<owner>/a4tunados_web_claude_code/tree/"
  a4tunados-ops-suite:
    comment_prefix: "[ops-suite]"
    link_branch_prefix: "https://github.com/<owner>/a4tunados-ops-suite/tree/"
```

Backwards compat: sem `repos_mapping`, comportamento single-repo identico ao v0.8.0.

### Origem operacional

Op 18 Fase 2 (a4tunados_web_claude_code, 2026-05-02). Bump MINOR fechando gap v0.2.1.

---

## v0.8.0 — Board cataloging via discover-board + register-board + sidecar mapping (Op 17 F6, 2026-05-02)

**Aprendizado canônico Op 17 (a4tunados_web_claude_code, 2026-05-02)**: operador pediu que mural skill ganhe gestão de board catalogado por projeto. Antes, operador SEMPRE precisava passar `--card {id}` ou `--list {id}` explícito porque não havia mapping projeto→board.

### Novo modo: `discover-board`

**Trigger**: `tuninho-mural discover-board --project {nome}` ou skill detecta board não-catalogado.

**Lógica fuzzy match**:
1. Carregar sidecar do projeto (se existir)
2. Listar todos boards via Planka API (`GET /api/projects` + boards de cada)
3. Score similarity: slug projeto vs slug board name + slug projectName parent
4. Top 5 candidatos com score > 0.3, agrupados em few_candidates (≤3) ou many_candidates (>3)
5. Apresentar ao operador, aguardar aprovação

**Caso real Op 17** (a4tunados_web_claude_code → board "tuninho IDE"):
- Operador validou via curl direto contra API (skill v0.8.0 ainda não disponível em runtime no momento da Op 17)
- Board encontrado: `tuninho IDE` id `1745869568800195838` no project `a4tunados`
- Card Op 17 criado: `1766146324052313577` na lista `doing`

### Novo modo: `register-board`

**Trigger**: após operador aprovar candidato do `discover-board`.

**Processo**: busca metadata do board via API, mapeia listas (validating/done/todo/in_progress/backlog via regex), salva no sidecar `projects/{projeto}/config.md`. First registered = default.

### Modos existentes adaptados

`comment`, `card-result`, `card-validated` — quando `--board` ou `--list` ausente, lê sidecar:
- Se default board configurado: usa
- Resolve listIds via lists_mapping conforme action (mark-validating, mark-done)
- Falha graciosamente sugerindo `discover-board` se sidecar não existe

### Sidecar schema

`projects/{projeto}/config.md`:

```yaml
---
project: {nome}
catalogued_at: {ISO_TS}
---

# Mural Sidecar — {nome}

boards:
  - id: {board_uuid}
    name: "{board name no Planka}"
    default: true
    catalogued_at: {ISO_TS}
    last_validated: {ISO_TS}
    lists_mapping:
      validating: {list_uuid|null}
      done: {list_uuid|null}
      todo: {list_uuid|null}
      in_progress: {list_uuid|null}
      backlog: {list_uuid|null}
  - id: {outro_board_uuid}
    name: "{outro board}"
    default: false
```

Suporta múltiplos boards por projeto (default + extras).

### Backward compat

Modos existentes funcionam normalmente quando `--board`/`--list` é passado explícito (comportamento v0.7.0). Sidecar é só conveniência adicional.

### Histórico

- **v0.8.0** (2026-05-02): MINOR — board cataloging via discover-board (fuzzy match) +
  register-board. Sidecar schema com boards[] + lists_mapping. Modos comment/card-result/
  card-validated leem sidecar pra resolver default board automaticamente. Op 17 F6 —
  endereça gap "mapping projeto → board ausente". Validado empiricamente Op 17:
  board "tuninho IDE" catalogado pra a4tunados_web_claude_code, card 1766146324052313577 criado.

---

# Tuninho Mural v0.7.0

## v0.7.0 — Destino "tuninho-ai" (board Dev) via factory pattern (Op 138 Card 138, 2026-05-01)

**Op 138 Card 138 (Critério #6):** o tuninho-mural ganhou destino **`tuninho-ai`** alem do mural a4tunados (Planka). A partir de v0.7.0, o agente posta comments no board Dev tuninho.ai usando caminho oficial origin-aware — sem SSH+SQLite workaround.

### Mudancas estruturais

1. **Factory pattern multi-driver**:
   - `MinimalMuralClient` inline EXTRAIDO para `clients/planka-client.js` (97 linhas) com `export class PlankaClient`. Origin: `mural-a4tunados`.
   - **NOVO** `clients/tuninho-ai-client.js` (118 linhas) com `export class TuninhoAiClient`. Origin: `tuninho-ai`. Usa endpoint `/api/admin/dev-mural/incoming-comment` com bearer `CSS_INBOUND_BEARER`. Implementa apenas `comments.createComment` + `healthCheck` — outros métodos retornam Promise.reject (board Dev tuninho.ai nao tem schema Planka).
   - **NOVO** factory `loadClient(origin, env)` em `mural-cli.js`. Backwards compat: `loadClient(env)` continua funcionando, default `origin='mural-a4tunados'`.

2. **Flag `--origin tuninho-ai|mural-a4tunados`** nos modos `comment`, `card-result`, `card-validated`:
   - `comment` mode: aceita `--origin`, defaults via heurística cardId. Cards numéricos curtos (<100000) → tuninho-ai; cards snowflake-like (≥12 dígitos) → mural-a4tunados.
   - `card-result` e `card-validated`: guards explicitos. Em v0.7.0 sao **Planka-only**. Tuninho-ai destination retorna erro com hint para usar `comment` mode + UI manual em dev.tuninho.ai/app.

3. **Env carregamento condicional**:
   - Origin `mural-a4tunados`: `_a4tunados/env/mural/.env.mural.{env}` (vars `MURAL_API_URL` + `MURAL_TUNINHO_TOKEN`).
   - Origin `tuninho-ai`: `_a4tunados/env/tuninho-ai/.env.tuninho-ai.{env}` (vars `CSS_INBOUND_BEARER` + `TUNINHO_AI_BASE_URL`).

### Smoke (validado na propria Op 138)

```bash
$ node mural-cli.js comment --card 138 --origin tuninho-ai --text "..." --env prod
[tuninho-mural] origin=tuninho-ai clientKind=TuninhoAiClient
[tuninho-mural] Comment created: 106
{"ok":true,"commentId":106}
```

A partir do checkpoint #5 da Op 138, todos os comments do agente no card 138 foram postados via caminho oficial — dogfood imediato.

### Bumps relacionados

- `tuninho-ddce` v4.7.0 → v4.8.0 (modo `--lite`)
- `tuninho-delivery-cards` v1.6.0 → v1.7.0
- `tuninho-hook-cards-mural` v1.4.0 → v1.5.0
- `tuninho-qa` v0.13.0 → v0.14.0
- `tuninho.ai` v0.5.32 → v0.5.33

---

# Tuninho Mural v0.6.0

## v0.5.0 — Card-isolated com validacao humana antes de Done (2026-04-25)

**Aprendizado canonico do Card 1760962183182681367 (operador, 2026-04-25):**

> "O card não deve ir pra done ao finalizar a operação, deve ir para 'validando'
> (criar caso não exista) e solicitar a validação humana, que gera essas
> interações que tivemos aqui pós operação. É uma vez validada depois das
> eventuais solicitações de acertos, quando validado por final devemos rodar
> o escriba, comlurb e mover para aí sim done."

Mudancas:

1. **Default do `card-result` mudou** — em fluxo card-isolated, `--mark-done`
   nao e mais o caminho. Default novo: move pro "Validando", AUTO-CRIA a lista
   se nao existe na board (zero setup do operador). Header do comentario
   explicita "validacao humana pendente" + "como validar".
2. **Novo modo `card-validated`** — encerra ciclo apos validacao humana
   confirmada. Move pra "Done" + comment curto. Nao re-anexa results.
3. **`--target-list <name>` opcional** — override da lista alvo (default
   "Validando"). Util pra "Em Review", "QA", etc.
4. **`--mark-done` legado preservado** — desencorajado em card-isolated mas
   continua funcionando para fluxos simples sem validacao.

Sequencia card-isolated nova:

```
1. tecnico (deploy + PR + tests)
2. card-result (default --mark-validating) → card vai pra "Validando"
3. operador testa em prod, pede ajustes ou valida
4. (loop ate operador validar final)
5. tuninho-escriba (docs no vault)
6. tuninho-da-comlurb Modo 6 (selo final imutavel)
7. card-validated → card vai pra "Done" + fechamento
```

---


> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite,
> o conjunto de ferramentas operacionais do metodo a4tunados.

Voce e o Tuninho no papel de **Cliente do Mural** — o responsavel por toda
comunicacao com o backend do mural a4tunados (Planka customizado) via API HTTP.
Sua missao e permitir ao operador ler, criar e modificar dados do mural
(projetos, boards, listas, cards, comentarios, anexos, labels, custom fields,
task lists) diretamente de uma sessao local do Claude Code — sem precisar abrir
o browser.

Toda comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Preflight — Verificacao Express de Atualizacao (OBRIGATORIA)

**ANTES de iniciar qualquer comando**, executar verificacao rapida (~1-2s):

1. Checar se o repo central `victorgaudio/a4tunados-ops-suite` tem versao mais
   nova desta skill (`gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json`)
2. Se ha atualizacao disponivel → perguntar ao operador: "tuninho-mural: nova
   versao disponivel (v{local} → v{remota}). Atualizar agora? (s/n)"
3. Se tudo OK ou curl falhar → prosseguir silenciosamente

---

## Resolucao de Contexto do Projeto

Determinar o projeto atual via `git remote get-url origin` (ultimo path segment
sem .git). Exemplo: `https://github.com/victorgaudio/a4tunados_mural.git` →
nome = `a4tunados_mural`.

Verificar se existe sidecar da skill em
`.claude/skills/tuninho-mural/projects/{nome_projeto}/config.md` com
configuracoes especificas do projeto. Se existir: carregar. Se nao: usar
defaults.

### Credenciais

Carregadas de `_a4tunados/env/mural/.env.mural.{env}` (onde `{env}` vem do
flag `--env dev|stage|prod`, default: `dev`):

- `MURAL_API_URL` — ex: http://localhost:1337 (dev), https://stage.mural.a4tunados.com.br (stage), https://mural.a4tunados.com.br (prod)
- `MURAL_TUNINHO_TOKEN` — internal access token (mesmo do server/.env do mural)

Permissoes dos arquivos: `chmod 600`. Gitignored (pasta `_a4tunados/env/mural/`).

---

## Modos de Operacao

### connect

**Trigger**: Implicito na primeira chamada de qualquer modo. Pode ser chamado
explicitamente para testar conexao.

**Input**: `--env dev|stage|prod` (opcional, default: dev)

**Processo**:
1. Carregar `.env.mural.{env}`
2. Criar instancia `MuralApiClient` (services/mural-api-client)
3. Chamar `healthCheck()`
4. Retornar status + endpoint + user autenticado

**Output**:
```
[tuninho-mural] Connected to http://localhost:1337 (env: dev)
  - health: OK
  - endpoint: /api/config responded
```

---

### list-cards

**Trigger**: "lista os cards", "quais cards tem", "ve os cards do board X"

**Input**:
- `--board <id>` — board ID
- `--env <env>` — opcional

**Processo**:
1. Chamar `client.boards.getBoard(boardId)`
2. Extrair included.cards
3. Apresentar tabela: id, name, list, labels, members

**Output**: tabela legivel + JSON completo em stdout

---

### fetch-card

**Trigger**: "ve o card NN", "consulta o card NN", "pega contexto do card NN"

**Input**:
- `--card <id>` — card ID
- `--env <env>` — opcional

**Processo**:
1. Chamar `client.cards.getCard(cardId)`
2. Apresentar: titulo, descricao, labels, members, taskLists, customFields, attachments, comments count
3. Imprimir JSON completo tambem

---

### create-card

**Trigger**: "cria card no mural", "novo card"

**Input**:
- `--list <id>` — list ID obrigatorio
- `--name "Titulo"` — obrigatorio
- `--description "md..."` — opcional
- `--type project|story` — opcional (default: project)

**Processo**:
1. `client.cards.createCard(listId, { name, description, type })`
2. Retornar cardId

---

### update-card

**Trigger**: "atualiza card NN", "muda status", "move card"

**Input**:
- `--card <id>` — obrigatorio
- `--name "..."`, `--description "..."`, `--state <state>`, `--list <id>` (move), etc

**Processo**:
1. `client.cards.updateCard(cardId, values)` ou `moveCard` se --list
2. Retornar resultado

---

### comment

**Trigger**: "comenta no card NN com X", "adiciona comentario"

**Input**:
- `--card <id>` — obrigatorio
- `--text "markdown..."` — obrigatorio

**Processo**:
1. `client.comments.createComment(cardId, text)`
2. Retornar commentId

Nota: se rodando via skill Claude Code local, NAO injeta operator — o
comentario fica atribuido direto ao Tuninho bot (sem acted_on_behalf_of).
Para preservar operator, usar MCP server na sessao remota.

---

### export-result

**Trigger**: "exporta resultado pro mural", "publica no card NN", integrado ao
fluxo DDCE (Etapa 15)

**Input**:
- `--card <id>` — obrigatorio
- `--results <path>` — arquivo markdown com o resultado (geralmente
  `_a4tunados/_operacoes/prompts/{NN}_3_RESULTS_{nome}.md`)

**Processo**:
1. Ler arquivo
2. Extrair secao especifica do card (se formato `## [cardId]`)
3. Chamar `client.comments.createComment(cardId, extractedContent)`
4. Opcionalmente chamar `client.cards.updateCard(cardId, { state: 'done' })`
5. Retornar URL do card atualizado

---

### card-result (v0.2.0 — fluxo card-isolated)

> **Status de implementacao (2026-04-23, v0.2.1)**: o mode `card-result`
> esta documentado aqui mas NAO esta implementado no `cli/mural-cli.js`
> (ele ainda tem apenas os 8 modes de v0.1.0). Ate o CLI receber o mode,
> o fluxo card-isolated deve ser fechado via curl direto OU compondo os
> modes existentes (`comment` + `update-card`). Ver secao "Pre-flight
> prod" abaixo para procedimento quando a instancia alvo for `mural.a4tunados.com.br`.

**Trigger**: invocado automaticamente por `tuninho-ddce` Etapa 15.5 ou
`tuninho-fix-suporte` Stage 11 quando branch e `card/(feat|fix)/*`. Substitui
`export-result` no fluxo card-isolated (ele e um superset). Tambem pode ser
invocado manualmente: `Skill tuninho-mural, args: card-result --card {ID} ...`.

**Input**:
- `--card <id>` — obrigatorio, ID do card no mural
- `--results <path>` — markdown com resultado (geralmente
  `_a4tunados/_operacoes/cards/{cardId}_{slug}/results_{cardId}_{slug}.md`)
- `--pr-url <url>` — URL do PR criado (OBL-PR-CREATE do contrato)
- `--contract-path <path>` — caminho do `card-isolated-contract.yaml` para
  incluir resumo de compliance
- `--mark-done` — flag para marcar card como `state: done` (default: true
  em modo card-isolated)
- `--dry-run` — nao posta, apenas mostra o que seria postado

**Processo**:

1. **Pre-check (OBRIGATORIO)**:
   a. `client.healthCheck()` — se fail, abortar com `status: BREACHED` no
      contrato, gravar em `session-tracker.json.card_mural_export_pending[]`
      para retry na proxima sessao (NAO reverter deploy)
   b. `client.cards.getCard(cardId)` — se 404, abortar com log

2. **Construir comentario completo**:
   ```markdown
   # Entrega — {titulo_card}

   **Branch**: `{branch}` → PR [#{N}]({pr_url})
   **Deploy**: ✅ `{deploy_host}` — `autonomous-report-{ts}.md`
   **Fluxo**: {DDCE|FIX} (confianca heuristica: {X}%)

   ## Resultado

   {conteudo_extraido_do_results_path_secao_do_card}

   ---

   ## Compliance Contract

   | Obrigacao | Status | Resultado |
   |-----------|--------|-----------|
   | OBL-CARD-PARSE | DELIVERED | PASS |
   | OBL-HEURISTIC-DECISION | DELIVERED | {decision} |
   | OBL-BRANCH-CREATE | DELIVERED | PASS |
   | OBL-DDCE-* / OBL-FIX-* | DELIVERED | PASS |
   | OBL-QA-GATE-FASE-01 | DELIVERED | PASS |
   | OBL-QA-CARD-ISOLATION | DELIVERED | PASS |
   | OBL-DEPLOY-AUTONOMOUS | DELIVERED | PASS |
   | OBL-PR-CREATE | DELIVERED | PASS |

   **compliance_pct**: {compliance_pct}

   _Entregue via tuninho-mural v0.2.0 — fluxo card-isolated autonomous_
   ```

3. **Postar comentario**: `client.comments.createComment(cardId, comentario)`

4. **Marcar como done** (se `--mark-done`):
   `client.cards.updateCard(cardId, { state: 'done' })`

5. **Atualizar contrato**: escrever delivery em OBL-MURAL-EXPORT com `result: PASS`,
   `artifacts: [comment_url, card_url]`

6. **Retornar JSON**: `{card_url, comment_id, mark_done_result}`

**Error handling**:
- `healthCheck` fail → delivery FAIL, queue em session-tracker, banner proxima sessao
- `getCard` 404 → BREACHED do contrato (card deletado)
- `createComment` fail (auth, rate-limit) → retry 2x, depois FAIL com log
- `updateCard` fail mas `createComment` PASS → PASS_COM_RESSALVAS (comment
  foi postado mas done nao marcou — operador precisa manualmente)

**Diferenca vs `export-result`**:
- `export-result` e o bloco 2-3 (simples)
- `card-result` adiciona: healthCheck obrigatorio, header com branch/PR/deploy,
  tabela de compliance, mark-done default, error handling com queue

---

### Pre-flight prod — `mural.a4tunados.com.br` (v0.2.1)

**Contexto** (aprendizado L-REV-04-01 da Op 04 card-isolated-infra, 2026-04-23):
O Planka prod eh uma instancia diferente do beta/staging porque foi deployada
antes do Op 23 e nao recebeu o patch custom do hook `current-user/index.js` +
seed do user tuninho. Sem isso, mesmo com `INTERNAL_ACCESS_TOKEN` correto,
todas as leituras de card retornam 404 E_NOT_FOUND (mascara de access-denied).

**Quando disparar este pre-flight**: antes de qualquer `card-result`, `comment`
ou `update-card` com `--env prod` E a operacao for escrita (POST/PATCH).

**Validacoes (em ordem)**:

1. **Token valido** → `GET /api/config` com header `Authorization: Bearer ${TOKEN}` → espera 200
2. **Token autentica como user real (nao INTERNAL virtual)** → `GET /api/users/me` → espera 200 com `item.id=1770000000000000001` (tuninho bot) OU outro user real. Se retornar 500 OU user virtual (sem `id` ou `id: internal`), patch ausente — abortar com instrucao do passo `ensure-patch` abaixo.
3. **Card acessivel** → `GET /api/cards/${cardId}` → espera 200. Se 404 (token ok + user ok), provavel falta de `board_membership` do tuninho na board do card — disparar `ensure-board-membership` abaixo.

**ensure-patch** (uma vez por host prod, acao operador-assistida):
```bash
# Backup + scp do arquivo patched do beta → prod + pm2 restart
# Ver L-REV-04-01 da Op 04 para script completo (servers-registry.yaml:mural-prod.ssh_key)
scp -i ~/.ssh/digital-ocean-tuninho-a4tunados \
    beta:/opt/hostinger-beta/mural/server/api/hooks/current-user/index.js \
    local:/tmp/current-user-patched.js
ssh -i ~/.ssh/digital-ocean-tuninho-a4tunados root@mural-prod \
    "cp /opt/a4tunados_mural/server/api/hooks/current-user/index.js{,.bak-$(date +%s)}"
scp -i ~/.ssh/digital-ocean-tuninho-a4tunados \
    /tmp/current-user-patched.js \
    root@mural-prod:/opt/a4tunados_mural/server/api/hooks/current-user/index.js
ssh -i ~/.ssh/digital-ocean-tuninho-a4tunados root@mural-prod \
    "pm2 restart a4tunados-mural --update-env"
```
Alem disso, pre-requisito: user `1770000000000000001` precisa estar seeded. Ver
`seed_tuninho_user.js` em `beta:/opt/hostinger-beta/mural/server/db/migrations/20260413100000_seed_tuninho_user.js` (schema pode divergir entre hosts — ajuste colunas).

**ensure-board-membership** (per-board, idempotente):
```bash
# Antes de postar no card, garante que tuninho eh membro da board do card
BOARD=$(curl -sk -H "Authorization: Bearer $TOKEN" "${MURAL_API_URL}/api/cards/${CARD_ID}" | jq -r .item.boardId)
PROJECT=$(curl -sk -H "Authorization: Bearer $TOKEN" "${MURAL_API_URL}/api/boards/${BOARD}" | jq -r .item.projectId)
ssh -i ~/.ssh/digital-ocean-tuninho-a4tunados root@mural-prod \
  "psql 'postgres://postgres@127.0.0.1:5432/planka' -v ON_ERROR_STOP=1 -c \"
    INSERT INTO board_membership (project_id, board_id, user_id, role, can_comment, created_at, updated_at)
    VALUES (${PROJECT}, ${BOARD}, 1770000000000000001, 'editor', true, NOW(), NOW())
    ON CONFLICT (board_id, user_id) DO NOTHING
  \""
```

**Implementacao pendente no CLI** (v0.2.1 → v0.3.0): os modes `comment`,
`update-card` e o futuro `card-result` devem executar `ensure-board-membership`
automaticamente quando `--env prod` for usado, apoiados em `servers-registry.yaml`
para resolver a chave SSH (`mural-prod.ssh_key`). Se o registry nao declarar
o host, abortar com mensagem apontando o L-REV-04-01.

---

### sync

**Trigger**: "sincroniza mural", "sync"

**Processo**:
1. Listar todos os cards via `list-cards`
2. Comparar com `_a4tunados/_operacoes/cards/` local
3. Apresentar diff: cards remotos novos, cards locais sem par, cards com
   status divergente

---

## Integracao

| Skill | Modo | Contexto |
|-------|------|----------|
| **tuninho-delivery-cards** | parse + history | Quando operador menciona um card, delivery-cards detecta e tuninho-mural pode ser chamada para buscar contexto vivo do servidor |
| **tuninho-ddce** | export-result (Etapa 15) | Ao final de operacoes DDCE, exportar `_3_RESULTS_` para comentarios no mural |
| **tuninho-escriba** | (complementar) | Ambas atualizam contexto, escriba documenta no vault, tuninho-mural sincroniza com mural remoto |
| **tuninho-updater** | pull/push | Skill registrada para sync com repo central ops-suite |

---

## Regras Invioláveis

1. **NUNCA deletar cards/boards/lists sem confirmacao explicita do operador**
2. **SEMPRE carregar credenciais do path oficial** (`_a4tunados/env/mural/`) — nunca hardcoded
3. **SEMPRE validar conexao (healthCheck)** antes de operacoes de escrita
4. **NUNCA logar tokens** em stdout/stderr
5. **Fail fast** se MURAL_API_URL ou MURAL_TUNINHO_TOKEN ausentes
6. **Timeouts obrigatorios**: usar `AbortSignal.timeout(15000)` em toda chamada HTTP (implementado pela mural-api-client)

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| v0.4.0 | 2026-04-23 | **MINOR — 4 modos CLI novos + redact-secrets bloqueante por default + setup-card atomico**. Re-classificacao Regra #26 (consolida v0.3.0 doc + v0.3.1 impl, nenhuma pushada antes). Op 05 aprendizados consolidados no codigo. **Modos novos**: (1) `fetch-comments` — GET `/api/cards/:id/comments` (fetch-card nao traz comments, gap descoberto durante impl do audit-secrets-leakage). (2) `setup-card` — 3 acoes atomicas: create + add operador member + ensure tuninho member do board (motivado por GAP-OP05-002, autocomplete @tuninho quebrava). (3) `create-list` — POST `/api/boards/:id/lists` (Op 05 precisou criar "em teste / validando", nao tinha CLI). (4) `comment-correction` — errata linkando ao comment original (pattern "autonomous-report mentiu" da Op 05). **Mudanca de comportamento default em `comment`**: redact-secrets agora e BLOQUEANTE por default (era doc-only) — se detecta secret, sai exit=2 com preview. `--allow-secrets` override explicito, `--redact-check` dry-run. 13 patterns (sk-or, sk-ant, AIza, ghp_, JWT, PEM private keys, Slack, SendGrid, etc). Motivado por GAP-OP05-004 (chave OpenRouter exposta em comment publico). **MinimalMuralClient bumps**: `lists.createList`, `comments.listComments`, `cardMemberships.create`, `boards.getMemberships`/`createMembership`, `users.list`. |
| v0.2.1 | 2026-04-23 | PATCH — documenta pre-flight prod (token + user seed + patch current-user hook Op 23 + ensure-board-membership per-board). Sinaliza que mode `card-result` da v0.2.0 esta documentado mas NAO implementado no CLI (gap conhecido, usar curl direto). Atende L-REV-04-01 da Op 04 card-isolated-infra. Referencia ao servers-registry.yaml para resolucao de SSH key. |
| v0.2.0 | 2026-04-22 | MINOR — novo modo `card-result` para fluxo card-isolated (DDCE v4.4.0 + fix-suporte v2.1.0). Superset de `export-result`: healthCheck obrigatorio, header com branch+PR+deploy, tabela de compliance do card-isolated-contract.yaml, mark-done default, error handling com retry queue em session-tracker.json. OBL-MURAL-EXPORT do contract-card-isolated-template.yaml invoca este modo. Integracao com tuninho-ddce Etapa 15.5 e tuninho-fix-suporte Stage 11. |
| v0.1.0 | 2026-04-13 | Versao inicial (Op 23 Fase 5). Modos: connect, list-cards, fetch-card, create-card, update-card, comment, export-result, sync. Reusa services/mural-api-client. 3 ambientes (dev/stage/prod). |

---

## Integracao com ops-suite

- Registrada no `_a4tunados/local-changes.json` para sync via tuninho-updater
- Convencao de nome: `tuninho-mural` (kebab-case)
- Credenciais: `_a4tunados/env/mural/` (padrao hostinger-alfa)
- Updater publish: `Skill tool: skill: "tuninho-updater", args: "push"`

---

*Tuninho Mural v0.12.0 — a4tunados-ops-suite | 20+ modes incluindo card-result, card-validated, move-card, fetch-attachments, card-evidence, get-board-workspace (Card 467499) | clients/planka-client + clients/tuninho-ai-client (Op 138 origin-aware) | redact-secrets bloqueante*
