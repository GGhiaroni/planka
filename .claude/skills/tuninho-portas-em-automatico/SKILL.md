# Tuninho Portas em Automatico v5.0.1

## v5.0.1 — Sessão 2 DEFINE EXPANSIVO diretivas petreas (Card 1768281088850920655 — 2026-05-05)

**Bump preventivo absorvendo 3 diretivas petreas** que afetam comportamento desta skill em modo DDCE_EXPANSIVO:

- **NUNCA comprimir output do preflight** quando operação em modo `DDCE_EXPANSIVO_MULTI_SESSOES_*`. Apresentar diagnóstico INTEGRAL (skills outdated, env, branch state, working tree, recent commits).

- **Sempre medir tokens via JSONL no início do preflight** — apresentar baseline % ao operador junto com diagnóstico inicial.

- **Branch sync check** OBRIGATÓRIO no preflight: `git fetch origin develop + git status` e avisar se branch da operação está atrás. Se atrás, sugerir `git rebase origin/develop` ANTES de avançar (Regra Inviolavel candidata #72).

### Por que patch v5.0.1?

Operador autorizou Q-FINAL-1=(c) bumps preventivos S2 durante S2.6.5 do Card 1768281088850920655.

### Aplicação concreta

- Preflight em modo expansivo apresenta diagnóstico INTEGRAL
- Token baseline reportado é medido via JSONL
- Branch sync check faz parte do preflight padrão pra card-isolated

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

# Tuninho Portas em Automatico v0.5.1

## v0.5.1 — Resp 11 multi-repo lag validation (Op 18 Fase 5, 2026-05-02)

**Aprendizado canonico Op 18 (a4tunados_web_claude_code, 2026-05-02 Fase 5)**: cooperacao com `tuninho-git-flow-dafor v0.2.1` que ganhou schema `repos: []` no state.yaml. Resp 11 estende detecta multi-repo automaticamente e valida lag em modo multi-repo.

### Resp 11 v0.5.1 — comportamento multi-repo

```
Resp 11 (Git Flow State Check)
  -> Le sidecar tuninho-git-flow-dafor/projects/{nome}/state.yaml
  -> Se state.yaml tem `repos: []` populado (>1 entrada):
       MODO MULTI-REPO ATIVO
       Loop por repo:
         git-flow-dafor audit-lag --repo {nome}
         Adicionar linha na tabela multi-repo do painel
  -> Senao:
       MODO SINGLE-REPO (comportamento v0.5.0 inalterado)
       audit-lag (single)
```

### Painel pre-flight estendido (multi-repo)

```
=== PRE-FLIGHT — Multi-repo detectado (Op 18) ===
| Repo                          | Branch                              | Lag | Status              |
|-------------------------------|-------------------------------------|-----|---------------------|
| a4tunados_web_claude_code     | feat/op18-tester-user-multirepo-ddce|   0 | branch_ahead_clean  |
| a4tunados-ops-suite           | main                                |   0 | pr_merged           |
=================================================
```

### Backwards compat

Sidecars `state.yaml` sem `repos: []` (operacoes pre-Op 18) continuam funcionando em modo single-repo identico ao v0.5.0.

### Origem operacional

Op 18 Fase 5 (a4tunados_web_claude_code, 2026-05-02). Bump PATCH cooperativo com git-flow-dafor v0.2.1.

---

# Tuninho Portas em Automatico v0.5.0

## v0.5.0 — Responsabilidade 10 (Test Credentials Check) + Responsabilidade 11 (Git Flow State Check) (Op 17 F5, 2026-05-02)

**Aprendizado canônico Op 17 (a4tunados_web_claude_code, 2026-05-02)**: novas skills `tuninho-tester` v0.1.0 (test users por projeto) e `tuninho-git-flow-dafor` v0.1.0 (gitflow d'a4 manager) precisam ser invocadas no pre-flight pra detectar gaps antes da operação começar.

### Responsabilidade 10 — Test Credentials Check (NOVO)

**Quando**: pre-flight de toda sessão Claude Code em projeto com sidecar tuninho-tester.

**Comando**:
```bash
.claude/skills/tuninho-tester/scripts/validate-credentials.sh
# OU se skill local desatualizada, fallback no plugin:
~/.claude/plugins/a4tunados-ops-suite/skills/tuninho-tester/scripts/validate-credentials.sh
```

**Output esperado**:
- ✓ Sidecar existe + credentials decifráveis + test users registrados → PASS
- ⚠ Sidecar ausente → WARN ("Run: tuninho-tester register-project --project {nome} --auth-strategy {strategy}")
- ⚠ credentials.sops.yaml ausente → WARN ("Run: tuninho-tester register-test-users")
- ⚠ encryption_pending → WARN ("Run: sops -e credentials.yaml > credentials.sops.yaml")
- ✗ sops decifra falhou → FAIL ("Verifique chave Age em ~/.config/age/a4tunados-master.key")

**Severidade**: WARN-first (alinha B3 do Discovery Op 17 — respeita autonomia do operador).

**Bloqueante**: NÃO. Apenas WARN. Operador decide se oficializa antes de continuar.

### Responsabilidade 11 — Git Flow State Check (NOVO)

**Quando**: pre-flight de toda sessão.

**Comando**:
```bash
~/.claude/plugins/a4tunados-ops-suite/skills/tuninho-git-flow-dafor/scripts/audit-lag.sh
```

**Output esperado**:
- ✓ branch atual derivada de develop + develop atualizada + lag < 5 commits → PASS
- ⚠ develop defasada com merges pendentes → WARN ("Op X, Y, Z não merged ainda")
- ⚠ branch atual não vem de develop → WARN ("Considere rebase ou explicação consciente")
- ⚠ N branches paralelas stale → INFO ("N branches feat/* sem PR aberto há >30d")
- ✗ working tree dirty + branch protegida + intent-modify → FAIL (BLOCK)

**Severidade**: WARN-first; FAIL apenas em condição clara de dano (dirty + protected + modify).

**Bloqueante**: SIM em condição FAIL específica. Caso contrário, WARN/INFO apenas.

### Painel atualizado

O painel de pre-flight ganha 2 novas seções (entre as 9 existentes):

```
═══════════════════════════════════════════════════════════
🛬 TUNINHO PORTAS EM AUTOMÁTICO — Pre-Flight v0.5.0
═══════════════════════════════════════════════════════════
... (Resp 1-9 existentes) ...

▶ 10. Test Credentials Check (Op 17 v0.5.0+)
   Project: {nome_projeto}
   ✓ Sidecar tuninho-tester: oficializado
   ✓ Credentials decifráveis (SOPS+Age OK)
   ✓ 2 test users registrados (admin + member)
   Status: PASS

▶ 11. Git Flow State Check (Op 17 v0.5.0+)
   Branch atual: feat/op17-tester-gitflow-mural (active_op)
   develop head: 181001a (last commit: 2026-04-29)
   Lag deste branch → develop: +6 commits
   ⚠ develop DEFASADA: 13 branches feat/* pending_merge
   Status: WARN — operador prossegue consciente
```

### Cooperação com outras skills

- `tuninho-tester` v0.1.0+ (Resp 10)
- `tuninho-git-flow-dafor` v0.1.0+ (Resp 11)
- `tuninho-qa` v0.16.0+ (sub-check `audit-test-credentials` + `audit-gitflow-state` — versão validável)

### Backward compat

Sem `tuninho-tester` ou `tuninho-git-flow-dafor` instalados: Resp 10 e 11 retornam INFO ("skill ausente — instale via tuninho-updater pull"). Não bloqueia pre-flight.

---

# Tuninho Portas em Automatico v0.4.1

> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite, o
> conjunto de ferramentas operacionais do metodo a4tunados. Mantenha-a
> atualizada via `tuninho-updater`.

Voce e o Tuninho no papel de **Controlador de Pre-Voo** — o ultimo check
antes da decolagem da sessao Claude Code. Sua missao e garantir que:

1. O contexto de sessoes anteriores esta coletado e disponivel
2. O ambiente esta em estado conhecido e consistente
3. O operador (ou agente) comeca a sessao com painel claro do que herda

A metafora **"portas em automatico"** vem da autorizacao de inicio de viagem
que um piloto de aviao recebe da torre apos todos os checks iniciais passarem.
No avioneta: "cintos afivelados, portas em automatico, motores prontos".
Aqui: "raw sessions coletadas, pre-flight OK, painel apresentado — LIBERADO
PARA INICIO".

Toda comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Quando e invocada

### Automaticamente (via hook)

O hook `tuninho-hook-inicio-sessao.py` (v4.2.0+) detecta:
1. **UserPromptSubmit** com padrao de operacao DDCE (`/ddce`, `/ddce-continuar`, etc)
2. OU primeira interacao de uma sessao nova em projeto que tem operacao DDCE ativa

Quando detecta, o hook invoca `scripts/portas-em-automatico.sh` via subprocess
e injeta o output como `additionalContext` no UserPromptSubmit.

### Manualmente

O operador pode invocar diretamente:
- `/tuninho-portas-em-automatico` — executa o fluxo completo
- `"Valida ambiente"` — acionamento informal
- `"Pre-flight"` — acionamento informal
- `"Coletar raw sessions"` — para re-popular handoffs/raw_sessions/

---

## 9 Responsabilidades

### 1. Coletar raw sessions locais

**Descricao**: copiar JSONLs de sessoes Claude Code anteriores deste projeto para
`_a4tunados/_operacoes/projetos/{NN_operacao_corrente}/handoffs/raw_sessions/`.

**Origem**: `~/.claude/projects/-{path-slug-do-projeto}/*.jsonl`

**Destino**: `_a4tunados/_operacoes/projetos/{NN}_*/handoffs/raw_sessions/`

**Criterio de copia**: para cada JSONL em `~/.claude/projects/{slug}/`:
1. Verificar se ja foi copiado (por nome unico com uuid curto)
2. Se nao, copiar com nome padronizado: `{YYYY-MM-DD}_sessao_{NN}_{uuid_curto}.jsonl`
3. A sessao corrente tambem e copiada (como `_partial` suffix) para auditoria em vivo

**Naming**: `{YYYY-MM-DD}_sessao_{NN_inferido}_{primeiros_8_chars_uuid}.jsonl`

Onde:
- `YYYY-MM-DD` e a data de ultima modificacao do JSONL
- `NN_inferido` e inferido cronologicamente (1 para o mais antigo, 2 para o seguinte, etc)
- `primeiros_8_chars_uuid` sao os primeiros 8 caracteres do UUID do arquivo original

**Imutabilidade**: copias sao marcadas read-only via convencao (nao via chmod para permitir overwrite em edge cases).

**Script**: `scripts/coletar-raw-sessions.sh`

---

### 2. Coletar raw sessions de outros environments

**Descricao**: verificar se ha JSONLs de outras maquinas usando o mesmo projeto.

**Problema**: o operador usa multiplos computadores para o mesmo projeto. Cada
maquina tem suas sessoes Claude Code locais em `~/.claude/projects/`. Ao fazer
`git pull` de um ambiente para outro, os JSONLs do ambiente anterior ficam
indisponiveis sem sync explicito.

**Estrategia v0.1.0 (minima)**:
- Verificar se existe arquivo `_a4tunados/local-machine.json` ou similar que
  declara o nome da maquina corrente (ex: `macbook-vcg`)
- Criar/verificar subpasta `handoffs/raw_sessions/env-{nome_local}/` para manter
  separacao entre ambientes
- **NAO** faz sync entre maquinas via git (JSONLs sao grandes — 5-10MB cada —
  e podem conter informacao sensivel)
- Apenas mantem index local

**Estrategia v0.2.0 (futura)**: convencao de sync via git para projetos que
decidem aceitar o custo de tamanho, OU lista de referencia (index.md) com paths
absolutos em outras maquinas para consulta manual.

**Script**: `scripts/coletar-raw-sessions.sh` (mesmo script — separa por env dir)

---

### 3. Coletar plan files do Claude

**Descricao**: copiar plan files que o Claude Code guarda fora da pasta do projeto.

**Possiveis origens**:
- `~/.claude/plans/`
- `~/.claude/todos/`
- `~/.claude/projects/{slug}/plans/` (se existir)
- `~/.claude/projects/{slug}/todos/` (se existir)

**Destino**: `_a4tunados/_operacoes/projetos/{NN}/handoffs/raw_sessions/plan_files/`

**Naming**: `{YYYY-MM-DD}_plan_{nome_original}.{ext}`

**Criterio**: copiar apenas arquivos recentes (< 30 dias) que sejam relacionados
a esta operacao (heuristica baseada em nome e mtime).

**Nota**: Em testes da Op 23 sessao 03, o diretorio `~/.claude/plans/` tinha
plan files antigos (Apr 11) nao relacionados a operacao, e `~/.claude/todos/`
continha apenas arquivos 2-byte vazios. A skill deve ser tolerante a essa
realidade e nao assumir que esses arquivos existem.

**Script**: `scripts/coletar-plan-files.sh`

---

### 4. Referenciar coleta no HANDOFF

**Descricao**: atualizar o HANDOFF da sessao corrente com referencias aos
arquivos coletados.

**Campo no HANDOFF**:
```yaml
raw_sessions_coletadas:
  local:
    - "handoffs/raw_sessions/2026-04-13_sessao_01_{uuid}.jsonl (5.2 MB)"
    - "handoffs/raw_sessions/2026-04-13_sessao_02_{uuid}.jsonl (4.8 MB)"
    - "handoffs/raw_sessions/2026-04-13_sessao_03_{uuid}_partial.jsonl (578 KB)"
  outros_environments: []
  plan_files: []
  coletado_em: "ISO timestamp"
  coletado_por: "tuninho-portas-em-automatico v0.1.0"
```

**Modo operacional**: o script `apresentar-painel.sh` apresenta os dados
coletados ao agente via stdout (inject no additionalContext), que entao pode
atualizar o HANDOFF via Edit tool. A skill NAO edita o HANDOFF diretamente
porque o operador/agente e quem decide se e apropriado escrever no arquivo.

---

### 5. Verificacao Pre-Flight (7 checks essenciais)

**Descricao**: antes de liberar "portas em automatico", verificar pre-requisitos
da sessao.

**Checks**:
1. **Branch git correta** — compara com o que o HANDOFF anterior declarava
2. **Working tree** — limpo OU consistente com pendencias documentadas no HANDOFF
3. **Skills tuninho-* atualizadas** — chama `tuninho-updater status` (modo nao-interativo)
4. **Hook tuninho-hook-conta-token ativo** — verifica em `.claude/settings.json`
5. **Sentinel `.escriba-bypass-active` inativo** — ou removido se ainda existir
6. **tuninho-qa instalada e na versao esperada** — `.claude/skills/tuninho-qa/SKILL.md` existe
7. **Cards manifest consistente com cards-manifest** — (se aplicavel — so em projetos com mural)

**Acao em caso de FAIL**: NAO bloqueia a sessao automaticamente (a skill nao
deve impedir o operador de trabalhar). Em vez disso:
- Emite WARNING no painel
- Lista os checks que falharam
- Sugere acao corretiva (mas nao executa)

**Acao em caso de PASS**: libera com mensagem "🛬 PORTAS EM AUTOMATICO — pre-flight OK".

**Script**: `scripts/preflight-checks.sh`

**Referencia detalhada**: `references/preflight-checklist.md`

---

### 6. Verificacao de Retomada de Sessao (NOVO em v0.2.0 — REGRA_MASTER_6)

**Descricao**: invocar `tuninho-qa Modo 15 audit-session-resumption` para
confirmar com EVIDENCIAS OBJETIVAS que a sessao atual recuperou tudo que
precisava da sessao anterior selada — antes de liberar trabalho.

**Diferenca crucial vs responsabilidades 1-5**: aquelas focam em **coletar e
validar ambiente** (raw sessions, branch git, hooks, skills). Esta foca em
**validar retomada** — confirma que o seal pre-/clear da sessao anterior
realmente entrega tudo necessario pra continuidade.

**Quando roda**: SEMPRE que ha HANDOFF anterior selado em alguma operacao
DDCE ativa. Se nao ha (sessao standalone, sem operacao DDCE em andamento ou
operacao nova sem sessao anterior), pula silenciosamente.

**Como invoca**:

```bash
SESSION_RESUMPTION_SCRIPT="${HOME}/.claude/skills/tuninho-qa/scripts/audit-session-resumption.sh"
# OU path do projeto
PROJ_SCRIPT=".claude/skills/tuninho-qa/scripts/audit-session-resumption.sh"
SCRIPT="${PROJ_SCRIPT}"
[ ! -x "$SCRIPT" ] && SCRIPT="${SESSION_RESUMPTION_SCRIPT}"

if [ -x "$SCRIPT" ]; then
  RESUMPTION_OUTPUT=$("$SCRIPT" 2>&1)
  RESUMPTION_EXIT=$?
fi
```

**Output formato**: painel ASCII formatado (8 evidencias objetivas:
HANDOFF selado, raw_sessions, XPs, briefing chars, pendencias abertas,
branch git, contrato QA — ver Modo 15 spec do tuninho-qa).

**Acao em caso de FAIL** (exit code 1):
- Inclui o painel COM gaps marcados ✗ no painel principal de pre-voo
- NAO bloqueia sessao (mantem regra inviolavel #2 de portas-em-automatico)
- Operador ve gap explicito e decide acao corretiva antes de iniciar trabalho

**Acao em caso de UNAVAILABLE** (exit code 2):
- Pula silenciosamente — nao ha operacao DDCE com HANDOFF anterior

**Acao em caso de PASS** (exit code 0):
- Inclui painel "READY" no painel principal
- Operador comeca sessao com confirmacao explicita de integridade

**Motivacao**: Op 06 sessao 10 (tuninho.ai, 2026-04-23) operador requisitou:
"queria tb que da mesma forma que temos a seguranca para dar o clear, termos
a confirmacao com evidencias na nova sessao de que ela resgatou tudo que
precisava resgatar para comecar como se nao tivesse sido interrompida a
sessao anterior". Sem esse passo, a continuidade pos-/clear era 'fe' — agora
e mecanicamente validada.

**Script**: invoca `tuninho-qa/scripts/audit-session-resumption.sh` (criado
em tuninho-qa v0.10.0).

---

### 7. ack-working primeira interacao em sessao card-isolated (v0.3.0)

**Descricao**: quando hook detecta que a sessao Claude e card-isolated
(branch `card/feat/*` + worktree em `CARD_WORKTREES_DIR/`) E e a primeira
interacao do agente nesta sessao, postar comentario `ack-working` no card
mural confirmando que o prompt foi recebido e o trabalho comecou.

**Detecao** (no script entry-point):
- Branch git matches `^card/feat/[a-z0-9-]+-\d{6}$`
- Diretorio atual contem `_a4tunados/_operacoes/cards/{cardId}_*/` com
  `last_status: EM_EXECUCAO` no manifest
- Arquivo sentinel `_a4tunados/_operacoes/cards/{cardId}_*/contracts/
  card-isolated-contract.yaml` existe e tem `status: ACTIVE`

**Acao**: invocar `tuninho-mural comment` com texto:
```
🎯 Tuninho ack-working: prompt recebido, contexto carregado, fluxo
card-isolated DDCE iniciado. Vou postar checkpoints proativos a cada
gate (DISCOVER, DEFINE, FASE, encerramento) — Regra Inviolavel #47 do
tuninho-ddce.
```

**Idempotencia**: ler `cards-manifest.json` — se card ja tem status
diferente de `EM_EXECUCAO` (ja ha resultado, em validacao, concluido),
NAO postar (sessao retomada — nao confunde com primeira interacao).

**Best-effort**: erros de postagem sao logados mas nao bloqueiam o pre-flight.

> **Motivacao**: cobertura de R5 (multi-stage feedback Op 08). Os 3 acks
> anteriores (ack-webhook, ack-session-ready, ack-prompt-injected) sao
> infra (postados pelo claude-sessions-service e tuninho-ide-web). O
> 4o ack (ack-working) e RESPONSABILIDADE DO CLAUDE — confirma que o
> prompt foi parseado e o agente comecou a trabalhar. Sem isso, o
> operador nao tem certeza se o prompt chegou intacto. Esta skill ja
> roda no inicio de toda sessao DDCE; adicionar a postagem ack-working
> e custo zero.

---

### 8. Apresentar Painel de Pre-Voo (com bloco de Retomada — v0.2.0+)

**Descricao**: formatar tudo que foi coletado e verificado em um painel visual
claro para o operador.

**Formato**:
```
╔══════════════════════════════════════════════════════════╗
║   🛬 PORTAS EM AUTOMATICO — Inicio Sessao {NN}           ║
╠══════════════════════════════════════════════════════════╣
║ Operacao:    {NN}_{nome}                                  ║
║ Sessao:      {NN}                                         ║
║ Anterior:    sessao {N-1} ({date})                        ║
║ Branch:      {branch_git}                                 ║
║                                                          ║
║ Raw sessions coletadas:                                   ║
║   • Local: N JSONLs                                       ║
║   • Outros envs: M (se houver)                            ║
║   • Plan files: K                                         ║
║                                                          ║
║ Pre-flight checks:                                        ║
║   ✓ Branch correta                                         ║
║   ✓ Working tree consistente                               ║
║   ✓ Skills atualizadas                                     ║
║   ✓ Hook conta-token ativo                                 ║
║   ✓ Sem sentinel residual                                  ║
║   ✓ tuninho-qa instalada (v0.5.0)                          ║
║                                                          ║
║ HANDOFF anterior: handoffs/HANDOFF_{date}_sessao_{N-1}.yaml║
║ HANDOFF atual:    handoffs/HANDOFF_{date}_sessao_{NN}.yaml ║
║                                                          ║
║ STATUS: ✅ LIBERADO PARA INICIO                           ║
╠══════════════════════════════════════════════════════════╣
║ 🔄 RETOMADA DE SESSAO (Modo 15 do qa, NOVO v0.2.0):       ║
║   Score: 8 PASS | 0 WARN | 0 FAIL                         ║
║   ✓ HANDOFF sessao_{N-1} selado ({mode}, {ts})             ║
║   ✓ raw_sessions: N JSONLs ({size}MB)                      ║
║   ✓ Discovery XP: {N} linhas                               ║
║   ✓ Briefing: {chars} chars (>= 100)                       ║
║   → Pendencias abertas: {K}                                ║
║   ✓ Branch git match HANDOFF                               ║
║   ✓ Contrato QA: ACTIVE                                    ║
║                                                          ║
║ STATUS RETOMADA: ✅ READY — sem perda de contexto        ║
╚══════════════════════════════════════════════════════════╝
```

**Se nao houver operacao DDCE ativa**: painel simplificado sem dados de operacao
nem bloco de retomada (so pre-flight checks).

**Se ha operacao DDCE mas sessao corrente e a primeira (sessao_01)**: bloco
de retomada exibe "🆕 PRIMEIRA SESSAO — sem retomada aplicavel".

**Script**: `scripts/apresentar-painel.sh`

---

### 9. Verificacao de settings.json (allowlist baseline) — v0.4.0

**Descricao**: validar que `.claude/settings.json` (project-level) e
`~/.claude/settings.json` (user-level) tem `permissions.defaultMode: acceptEdits`
e `permissions.allow` com baseline minimo (>= 50 entries no user-level, >= 30 no
project-level). Se restritivo, alertar operador no painel pre-flight e oferecer
restaurar baseline a4tunados (template embutido).

**Motivacao (Card 170 tuninho.ai, 2026-05-01)**: operador autorizou explicitamente
allowlist amplo permissivo (memo `feedback_permissoes_amplas_autorizadas.md`)
sobrepondo defaults conservadores da skill nativa `fewer-permission-prompts`
(Claude Code). Settings.json e versionado via git, mas se for resetado/deletado
em outro environment ou se alguem der pull em branch antiga, prompts voltam
silenciosamente. Esta responsabilidade detecta divergencia em tempo de pre-flight
e mantem decisao do operador petrificada entre environments.

**Algoritmo**:

```bash
#!/bin/bash
# scripts/check-permissions-baseline.sh

PROJ_SETTINGS=".claude/settings.json"
USER_SETTINGS="$HOME/.claude/settings.json"
BASELINE_USER_MIN=50
BASELINE_PROJ_MIN=30

check_settings() {
  local path=$1
  local min=$2
  local label=$3

  if [ ! -f "$path" ]; then
    echo "WARN: $label settings.json nao existe ($path)"
    return 1
  fi

  local mode=$(python3 -c "
import json
with open('$path') as f: s = json.load(f)
print(s.get('permissions', {}).get('defaultMode', 'NONE'))
" 2>/dev/null)

  local count=$(python3 -c "
import json
with open('$path') as f: s = json.load(f)
print(len(s.get('permissions', {}).get('allow', [])))
" 2>/dev/null)

  if [ "$mode" != "acceptEdits" ]; then
    echo "WARN: $label defaultMode=$mode (esperado: acceptEdits)"
    return 1
  fi

  if [ "${count:-0}" -lt "$min" ]; then
    echo "WARN: $label allow=$count entries (esperado: >= $min)"
    return 1
  fi

  echo "OK: $label permissions={mode:$mode, allow:$count}"
  return 0
}

check_settings "$USER_SETTINGS" "$BASELINE_USER_MIN" "user-level"
check_settings "$PROJ_SETTINGS" "$BASELINE_PROJ_MIN" "project-level"
```

**Output esperado no painel pre-flight** (parte do bloco "Pre-flight checks"):

```
🔐 Permissoes/settings:
   ✓ user-level: defaultMode=acceptEdits, allow=238 entries
   ✓ project-level: defaultMode=acceptEdits, allow=97 entries
```

**Em caso de divergencia** (settings.json restritivo detectado):

```
🔐 Permissoes/settings:
   ⚠ project-level: defaultMode=plan (esperado: acceptEdits)
   ⚠ project-level: allow=11 entries (esperado: >= 30)

   Operador autorizou allowlist amplo — ver memo
   feedback_permissoes_amplas_autorizadas.md.

   Restaurar baseline a4tunados? (s/N)
   [Se s: aplicar template + commit em develop com mensagem
    "chore(claude): restore allowlist baseline a4tunados"]
```

**Bloqueante**: NAO. Apenas WARN no painel. Operador decide se aceita
restritivo (ex: projetos compartilhados com terceiros) ou restaura baseline.

**Script**: `scripts/check-permissions-baseline.sh` (criado em v0.4.0)

**Integra com**: sub-check `audit-permissions-policy` do tuninho-qa v0.15.1+
(audit-ambiente). Ambos olham o mesmo arquivo; portas-em-automatico alerta
em pre-flight, qa alerta em gates DDCE.

---

## Integracao com o hook tuninho-hook-inicio-sessao

### Como o hook invoca a skill

Em **UserPromptSubmit** quando detecta operacao DDCE OU primeira interacao da
sessao, o hook executa:

```python
# Em tuninho-hook-inicio-sessao.py (apos v4.2.0)
portas_script = project_dir / ".claude" / "skills" / "tuninho-portas-em-automatico" / "scripts" / "portas-em-automatico.sh"
if portas_script.exists():
    result = subprocess.run([str(portas_script)], capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        context_parts.append(result.stdout)
```

A saida do script e entao injetada no `additionalContext` do hook, que o Claude
le automaticamente.

### Timeout

Se os scripts demorarem mais de 30 segundos (ex: cp de JSONL gigante em FS
lento), o hook faz fallback gracioso: emite warning mas nao bloqueia a sessao.

### Idempotencia

A skill deve ser idempotente — chamar 2 vezes no mesmo dia nao deve duplicar
arquivos. O criterio de copia verifica se o JSONL ja existe no destino antes
de copiar (por nome + tamanho).

---

## Estrutura da Skill

```
.claude/skills/tuninho-portas-em-automatico/
├── SKILL.md                                    (este arquivo)
├── scripts/
│   ├── portas-em-automatico.sh                 (entry-point — orquestra os 4 abaixo)
│   ├── coletar-raw-sessions.sh                 (responsabilidade 1 + 2)
│   ├── coletar-plan-files.sh                   (responsabilidade 3)
│   ├── preflight-checks.sh                     (responsabilidade 5)
│   └── apresentar-painel.sh                    (responsabilidade 6)
├── references/
│   ├── raw-sessions-naming.md                  (convencao de naming)
│   ├── preflight-checklist.md                  (lista detalhada dos 7 checks)
│   └── licoes-aprendidas.md                    (vazia inicialmente)
└── projects/
    └── a4tunados_mural/
        └── config.md                           (sidecar — paths especificos)
```

---

## Regras Inviolaveis

| # | Regra |
|---|-------|
| 1 | **NUNCA editar HANDOFF diretamente** — apenas reportar o que foi coletado. O agente decide se escreve no HANDOFF. |
| 2 | **NUNCA bloquear sessao por pre-flight FAIL** — emite WARNING, deixa operador decidir |
| 3 | **NUNCA copiar JSONL que ja existe** no destino (idempotencia) |
| 4 | **NUNCA assumir** que plan files ou diretorios existem — ser tolerante a ausencia |
| 5 | **SEMPRE emitir painel** mesmo quando nao ha operacao DDCE ativa (para pre-flight ambiente) |
| 6 | **SEMPRE respeitar timeout** de 30s — fallback gracioso se scripts demorarem |
| 7 | **SEMPRE preservar imutabilidade** dos JSONLs copiados — convencao, nao chmod |

---

## Versionamento

### Politica

- **Patch** (0.0.x): bug fixes nos scripts, ajustes de texto do painel
- **Minor** (0.x.0): novas responsabilidades, novos checks, ajustes estruturais
- **Major** (x.0.0): mudanca fundamental no escopo (ex: orquestracao deixa de
  ser pre-sessao e vira pos-sessao)

### Historico

- **v0.4.1** (2026-05-01): PATCH — **Fix coleta raw_sessions/plan_files em fluxo card-isolated** (Card 170 tuninho.ai follow-up). Tres bugs corrigidos: (1) `coletar-raw-sessions.sh:25` — slug `$PWD` -> `~/.claude/projects/{slug}/` so normalizava `/` para `-`, ignorando `.` e `_`. Resultado: em worktree `tuninho.ai/card-170_revisar...` o script procurava em pasta inexistente e reportava "0 JSONLs" silenciosamente. Fix: `sed 's|[^a-zA-Z0-9-]|-|g'` espelha exatamente a normalizacao do Claude Code. (2) `portas-em-automatico.sh:48` — detectava operacao ativa apenas em `_operacoes/projetos/`, ignorando `_operacoes/cards/`. Em fluxo card-isolated capturava Op antiga aleatoria. Fix: detecta branch `card/...`, extrai card_id, valida `_operacoes/cards/{id}_*/`, seta `OPERACAO="card-{id}"`. (3) `coletar-raw-sessions.sh:34` + `coletar-plan-files.sh:26` — destino fixo em `_operacoes/projetos/{op}_*/handoffs/raw_sessions/`. Em card-isolated grava no card errado ou pula. Fix: detecta card-isolated e usa `_operacoes/cards/{id}_*/raw_sessions/` (sem `handoffs/` no meio porque cards ja sao handoff por natureza). **Motivacao real**: Card 170 v0.5.36 ja foi selado (Comlurb), mas a sessao seguinte abriu sem JSONL anterior em `raw_sessions/`, violando REGRA_MASTER_1 do tuninho-qa. Auditoria cruzada entre sessoes ficou cega no encerramento de operacao card-isolated. Bloqueante: NAO (mantida advisory). Compat: fluxo Op normal (sem branch `card/`) inalterado — mesmo destino de antes.

- **v0.4.0** (2026-05-01): MINOR — **Responsabilidade 9 NOVA: verificacao de settings.json baseline** (Card 170 tuninho.ai post-allowlist). Valida que `.claude/settings.json` (project) tem >= 30 entries em `permissions.allow` e `~/.claude/settings.json` (user) tem >= 50, ambos com `defaultMode: acceptEdits`. Se restritivo: WARN no painel pre-flight + oferece restaurar baseline a4tunados. Motivacao: operador autorizou allowlist amplo permissivo (memo `feedback_permissoes_amplas_autorizadas.md`) sobrepondo defaults conservadores da skill nativa `fewer-permission-prompts`. Sem essa validacao, settings.json resetado/deletado em outro environment faz prompts voltarem silenciosamente. Integra com sub-check `audit-permissions-policy` do tuninho-qa v0.15.1+. Script novo: `scripts/check-permissions-baseline.sh`. Bloqueante: NAO (advisory).

- **v0.3.0** (2026-04-26): MINOR — **Responsabilidade 7 NOVA: ack-working primeira interacao em sessao card-isolated** (Op 08 follow-up R5). Quando branch matches `card/feat/*` + worktree em `CARD_WORKTREES_DIR/` + manifest mostra `last_status: EM_EXECUCAO`, postar `ack-working` no card mural via tuninho-mural CLI. Fecha a Regra Inviolavel #41 do tuninho-ddce (toda comunicacao card-isolated DEVE estar no mural). Idempotente — sessoes retomadas (status nao-EM_EXECUCAO) NAO postam. Best-effort, nao bloqueia pre-flight. Renomeada Responsabilidade 7 antiga para 8.

- **v0.2.0** (2026-04-23): MINOR — **Responsabilidade 7 NOVA**: Verificacao de
  Retomada de Sessao (REGRA_MASTER_6). Invoca `tuninho-qa Modo 15
  audit-session-resumption` (script bash criado em qa v0.10.0). Adiciona bloco
  de retomada ao painel de pre-voo com 8 evidencias objetivas (HANDOFF selado,
  raw_sessions, XPs, briefing chars, pendencias abertas, branch git, contrato
  QA). Operador agora tem confirmacao mecanica que retomada e integra ANTES
  de iniciar trabalho. **Motivacao**: Op 06 sessao 10 (tuninho.ai, 2026-04-23)
  — operador requisitou simetria entre seal pre-/clear (ja existe via Comlurb)
  e validacao de retomada pos-/clear (ate v0.1.0 era 'fe'). Resolve gap
  conceitual: "como saber que comecei como se nao tivesse interrompido?".

- **v0.1.0** (2026-04-13): Versao inicial. Criada na sessao 03 da Op 23
  (claudecode_back_v3) como parte da "virada de chave" estrutural multi-sessao.
  6 responsabilidades + 4 scripts bash + integracao com hook tuninho-hook-inicio-sessao
  v4.2.0+. Descoberta do gap na sessao 02 quando o operador perguntou "os
  handoffs sao organizados como?" — a resposta levou a reestruturacao
  `handoffs/` por sessao + populacao automatica via esta skill.
  **Ainda pendente em v0.1.0**:
  - Sync multi-machine de JSONLs (v0.2.0)
  - Lista de referencia para plan files em outros envs (v0.2.0)
  - Integracao com tuninho-qa Modo 12 audit-handoff (chamar apos apresentar painel)

---

## Integracao com ops-suite

- Registrada em `_a4tunados/local-changes.json` para sync via tuninho-updater
- Convencao de nome: `tuninho-portas-em-automatico` (kebab-case)
- Push para repo central: `Skill tool: skill: "tuninho-updater", args: "push"`
- Manifest: incluir em `manifest.json` do repo central na proxima sincronizacao

---

*Tuninho Portas em Automatico v0.2.0 — a4tunados-ops-suite | Criada na Op 23 sessao 03 (claudecode_back_v3) | Responsabilidade 7 (audit-session-resumption) adicionada na Op 06 sessao 10 (tuninho.ai)*
