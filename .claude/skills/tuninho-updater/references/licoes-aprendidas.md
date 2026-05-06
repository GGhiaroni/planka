# Licoes Aprendidas — Tuninho Updater

> Atualizado automaticamente apos cada execucao (Retroalimentacao).
> Formato padrao a4tunados: Titulo, Descoberta em, Contexto, Problema, Solucao.

---

## Tabela Resumo

| # | Licao | Validada |
|---|-------|----------|
| 1 | Dois plugins duplicados rodavam hooks em paralelo | Sim |
| 2 | Hook precisa de timeouts e prefixo de interpretador | Sim |
| 3 | Sidecars devem ser sincronizados de forma acumulativa (rev. v4.4.0) | Sim |
| 4 | Merge de hooks exige analise linha-a-linha dos valores | Sim |
| 5 | Projetos com versoes anteriores acumulam artefatos legados | Sim |
| 6 | Repo com auto-merge: todos os commits devem estar no PR antes do push | Sim |
| 7 | Auto-update do updater deve rodar e re-invocar antes de continuar | Sim |
| 8 | Push deve consolidar PRs abertas para evitar conflitos e perda de trabalho | Sim |
| 9 | Modificacoes em skills sem track se perdem no proximo sync | Sim |
| 10 | 3-way merge com snapshot resolve conflitos entre projetos | Sim |
| 11 | Claude como merge engine para conflitos semanticos em skills | Sim |
| 12 | Hooks no plugin NAO sao carregados sem registro no settings.json | Sim |
| 13 | Plugin global fica defasado silenciosamente sem verificacao ativa | Sim |
| 14 | README manual fica desatualizado em pushes — deve ser auto-gerado | Sim |
| 15 | Manifest pode regredir versoes quando PRs usam bases desatualizadas | Sim |
| 16 | Hooks editados fora do fluxo = deriva silenciosa entre plugin e repo | Sim |
| 17 | Hooks legados no projeto (.claude/hooks/) devem ser detectados e migrados | Sim |
| 18 | Hooks faltantes (cards-mural, guardiao) devem ser instalados automaticamente | Sim |
| 19 | op-novo/op-continuar sao deprecated — detectar e remover dos hooks | Sim |
| 20 | Verify deve checar AMBOS: plugin global (~/.claude/) E projeto local (.claude/) | Sim |
| 21 | CLAUDE_MODEL env var NAO esta disponivel em hooks — default deve ser Opus 1M | Sim |
| 22 | CLAUDE.md com secao A4tunados legada deve ser atualizada em pull/bootstrap | Sim |
| 23 | `cd` em script de push infecta cwd da sessao e quebra hook git-flow | Sim |
| 24 | "investigar" nunca implica aplicar — protocolo de smart mode deve parar para nova confirmacao | Sim |
| 25 | Cinco confusoes recorrentes em smart mode — regex H1, estado ORFA, hold sidecar orfa, tipos de divergencia, pull --ff-only | Sim |

---

## Licoes

### #1 — Dois plugins duplicados rodavam hooks em paralelo

- **Descoberta em:** Sessao de criacao do updater (2026-03-24)
- **Contexto:** Plugins `conta-tokens-ops` e `a4tunados-ops-suite` estavam ambos habilitados
- **Problema:** Hooks quase identicos (PreToolUse, UserPromptSubmit, Stop) rodavam duas vezes por evento, desperdicando processamento e gerando feedback duplicado
- **Solucao:** Consolidar em um unico plugin (`a4tunados-ops-suite`). O updater deve verificar e alertar sobre plugins duplicados no bootstrap e no verify.

### #2 — Hook precisa de timeouts e prefixo de interpretador

- **Descoberta em:** Comparacao dos dois plugins (2026-03-24)
- **Contexto:** Plugin `conta-tokens-ops` v2.6.1 nao tinha timeouts no hooks.json, enquanto `ops-suite` v2.4.0 tinha 5s/30s
- **Problema:** Sem timeout, um script travado poderia bloquear indefinidamente o Claude Code. Sem prefixo (`python3`/`bash`), dependia do shebang e permissoes de execucao do sistema
- **Solucao:** hooks.json v3.0.0 usa prefixo explicito + timeouts (5s para Python, 30s para Bash)

### #3 — Sidecars de projeto devem ser sincronizados de forma acumulativa (ATUALIZADA v4.4.0)

- **Descoberta em:** Desenho do tuninho-updater (2026-03-24). **Revisada em:** 2026-03-29
- **Contexto:** A pasta `projects/` do tuninho-ddce contem configs especificas de cada projeto (ex: `a4tunados_mural/config.md` com paths de changelog e versao). Projetos podem ser desenvolvidos de diversas estacoes diferentes.
- **Problema original:** Sincronizar sidecars do projeto A para o repo apagaria configs do projeto B ao fazer pull
- **Solucao original (v1.0-v4.3):** O updater NUNCA tocava em `projects/`.
- **Problema real (descoberto v4.4):** Sem sync, sidecars ficam presos em uma unica estacao. Ao trocar de maquina ou projeto, configs acumuladas se perdem.
- **Solucao atual (v4.4+):** Sidecars sao **acumulativos**. O repo centraliza `projects/` de TODOS os projetos. Merge e feito por subdiretorio (`projects/{nome}/`) — cada projeto e independente, nunca conflita com outro. Quando o mesmo sidecar e editado em dois lugares, aplica-se merge 3-way por secoes.

### #4 — Merge de hooks exige analise linha-a-linha dos valores

- **Descoberta em:** Merge dos hook scripts v3.0.0 (2026-03-24)
- **Contexto:** `conta-tokens-ops` v2.6.1 tinha MAX_CONTEXT_TOKENS=1M e threshold=20%, enquanto `ops-suite` v2.4.0 tinha 200K e 35%
- **Problema:** Nenhum dos dois era "o melhor" — cada um tinha valores corretos para aspectos diferentes (contexto vs formatting)
- **Solucao:** Mergear valor a valor: 1M tokens e 20% threshold do conta-tokens (correto para Opus 4.6) + feedback Unicode/emojis e timeouts do ops-suite (melhor UX)

### #5 — Projetos com versoes anteriores acumulam artefatos legados

- **Descoberta em:** Limpeza do a4tunados_mural (2026-03-24)
- **Contexto:** Projeto migrou de V2.x (submodulos git, commands op-novo/op-continuar/ops-sync, agent a4tunados-ops-v2, sistema sync) para V4.0 (DDCE, tuninho-* skills, cache-based updater). Artefatos das versoes anteriores permaneciam no projeto causando confusao e conflitos potenciais
- **Problema:** 13 artefatos legados identificados: submodulo git ativo em `.gitmodules`, 3 commands depreciados, 1 agent depreciado, skills legadas em `.claude/skills/a4tunados/`, sistema sync completo em `.claude/sync/`, handoffs/checklists stale, backups V2.x. Skills legadas coexistiam com skills ativas, commands depreciados apareciam na lista de skills
- **Solucao:** Criada Etapa 0.5 no updater com 12 patterns de deteccao. Artefatos sao movidos (nunca deletados) para `_a4tunados/zzz_old_files/` preservando estrutura relativa. Para submodulos git: deinit + rm --cached + limpar .git/modules/. Roda automaticamente no smart mode e bootstrap, antes de instalar skills novas. Sempre pede confirmacao do usuario

### #6 — Repo com auto-merge: todos os commits devem estar no PR antes do push

- **Descoberta em:** Push do updater v1.2.0 (2026-03-24)
- **Contexto:** PR #10 criada com 1 commit. Segundo commit (README + regra #11) foi pushado apos o PR ja ter sido auto-mergeado
- **Problema:** O repo `a4tunados-ops-suite` tem auto-merge habilitado. O PR mergeia assim que e criado e o push chega. Commits adicionais na mesma branch apos o merge ficam orfaos e nao entram na main
- **Solucao:** (1) No modo push, preparar TODOS os arquivos (incluindo README.md) ANTES de criar o commit. Um unico commit com tudo, nunca push incremental. (2) Antes de iniciar push, verificar se ha PRs abertos no repo com `gh pr list --state open`. Se houver PR do mesmo componente, parar e avisar. (3) Sempre criar branch a partir de `origin/main` atualizado (`git fetch origin && git checkout -b ... origin/main`)

### #7 — Auto-update do updater deve rodar e re-invocar antes de continuar

- **Descoberta em:** Primeira execucao smart apos v1.2.0 no repo (2026-03-24)
- **Contexto:** Updater local estava na v1.1.0, repo tinha v1.2.0 com modo `cleanup` e Etapa 0.5 novos. O updater v1.1.0 nao conhecia esses fluxos
- **Problema:** Se o updater detecta versao nova no repo mas continua executando com a versao antiga, os novos fluxos (cleanup, Etapa 0.5, regras #8-11) nao sao aplicados naquela execucao. O usuario perde funcionalidades que ja estao disponiveis
- **Solucao:** Quando o updater detectar que ele proprio tem versao nova no repo: (1) fazer pull do updater primeiro, (2) informar ao usuario que foi atualizado, (3) pedir que re-invoque ("atualiza o tuninho" novamente) para que a nova versao carregada pelo Claude Code execute o restante do fluxo com todos os novos recursos. NAO continuar o fluxo com a versao antiga

### #8 — Push deve consolidar PRs abertas para evitar conflitos e perda de trabalho

- **Descoberta em:** Push do updater v1.3.0 com PR #13 aberta (2026-03-25)
- **Contexto:** Ao criar PR #14 (express preflight), PR #13 (melhorias do pdview: cards mural, regra #7) estava aberta tocando DDCE e updater — mesmos arquivos. Se ambas fossem mergeadas separadamente, uma sobrescreveria partes da outra
- **Problema:** PRs de projetos diferentes podem tocar os mesmos componentes. Com auto-merge, a primeira a mergear "ganha" e a segunda gera conflitos — e o conteudo da PR perdedora pode ser descartado silenciosamente
- **Solucao:** No modo push (passo 2), ao detectar PRs abertas: (1) fetch das branches de todas as PRs abertas, (2) mergear cada uma na branch local do push, (3) resolver conflitos preservando AMBOS os conteudos, (4) commitar merge, (5) fechar PRs incorporadas com comentario. Resultado: PR unificada com TODO o trabalho de todos os projetos. Regra #12 e nova regra inviolavel

### #9 — Modificacoes em skills sem track se perdem no proximo sync

- **Descoberta em:** Sessao de atualizacao (2026-03-26)
- **Contexto:** DDCE v3.1.0 teve triggers adicionados no frontmatter (resolve esse card, etc.) por pedido direto do usuario, mas sem passar pelo updater. Na proxima execucao do smart mode, as versoes local e remoto apareciam identicas (v3.1.0 = v3.1.0) — a modificacao era invisivel
- **Problema:** Quando uma skill e editada diretamente (fora do fluxo do updater), a versao no H1 nao muda. O updater compara apenas versoes, entao nao detecta a divergencia. No proximo pull, a versao remota pode sobrescrever a local sem aviso. O trabalho se perde silenciosamente
- **Solucao:** Criado modo `track` (v3.2.0) que deve ser invocado AUTOMATICAMENTE pelo agente (Claude Code) apos qualquer edicao em skills tuninho-*. O track: (1) detecta skills modificadas, (2) faz bump de versao no H1, (3) registra em `_a4tunados/local-changes.json`. O smart mode agora consulta local-changes.json para mostrar pendencias. Regra #16: track obrigatorio apos editar skills — responsabilidade do agente, nao do usuario

### #10 — 3-way merge com snapshot resolve conflitos entre projetos

- **Descoberta em**: 2026-03-28 (design v4.1.0)
- **Contexto**: Projeto 1 pushava v4.0.0, projeto 2 tinha mudancas baseadas em v3.x.
  Merge 2-way (local vs remote) nao sabe o que mudou de cada lado.
- **Problema**: Sem ancestral comum, "preservar local" pode perder melhorias do remote,
  e "aceitar remote" pode perder trabalho local. O merge e cego.
- **Solucao**: Snapshot (`ops-suite-sync-state.json`) grava hashes de secoes apos cada
  sync. No merge, compara 3 estados (base/local/remote) secao por secao. 8 dos 9 casos
  sao resolvidos mecanicamente. So o caso "ambos mudaram diferente" precisa de intervencao.

### #11 — Claude como merge engine para conflitos semanticos em skills

- **Descoberta em**: 2026-03-28 (design v4.1.0)
- **Contexto**: Skills sao instrucoes para LLM, nao codigo. Concatenar texto pode gerar
  instrucoes contraditorias que passam validacao textual mas quebram o comportamento.
- **Problema**: Merge textual nao entende se duas regras adicionadas por projetos diferentes
  se complementam ou se contradizem. Ferramentas de diff/merge tradicionais nao servem.
- **Solucao**: Quando ambos os lados modificaram a mesma secao, delegar ao Claude com
  prompt estruturado contendo base+local+remote. O LLM interpreta a intencao e produz
  merge coerente. Validacao semantica pos-merge verifica o resultado.

### #12 — Hooks no plugin NAO sao carregados sem registro no settings.json

- **Descoberta em**: 2026-03-28 (sessao 07 — rebrand BatutaManager)
- **Contexto**: O ecossistema a4tunados-ops-suite v4.0.0 tinha 5 hooks definidos no
  `hooks.json` do plugin em `~/.claude/plugins/a4tunados-ops-suite/hooks/hooks.json`.
  Os scripts estavam fisicamente presentes. O plugin estava habilitado em `enabledPlugins`.
  O updater v4.1.0 verificava plugin, scripts e duplicatas — mas NAO verificava registro
  no settings.json.
- **Problema**: O Claude Code NAO carrega hooks de `hooks.json` de plugins. Ele so
  carrega hooks da secao `hooks` do `~/.claude/settings.json`. O `hooks.json` do plugin
  serve como manifesto, mas NAO e lido pelo runtime. TODOS os hooks (incluindo o critico
  `tuninho-hook-cards-mural`) estavam MORTOS desde a instalacao. O ecossistema inteiro de
  hooks nunca funcionou. A falha foi silenciosa.
- **Solucao**: (1) Step 5 obrigatorio no "Setup de Hooks": ler hooks.json, resolver
  caminhos absolutos, registrar no settings.json com verificacao pos-registro.
  (2) Verify mode checa registro no settings.json. (3) Regra #21 inviolavel.
- **Gravidade**: CRITICA. Comprometeu todo o ecossistema de hooks desde a instalacao.

### #13 — Plugin global fica defasado silenciosamente sem verificacao ativa

- **Descoberta em**: 2026-03-28 (sessao 07 — diagnostico de integridade)
- **Contexto**: O projeto BatutaManager fez 3 pushes ao repo (PRs #25, #26, #27) em uma
  sessao. O cache local foi atualizado via `git fetch + reset`. Mas o plugin em
  `~/.claude/plugins/a4tunados-ops-suite/` NAO foi atualizado — continuou com versoes
  de 2 dias atras (ddce v3.1.1, escriba v3.1.0, updater v4.0.0 vs v4.1.0 no repo).
- **Problema**: O plugin e global e afeta TODOS os projetos. Se outro projeto fosse
  aberto, usaria skills desatualizadas e hooks com versoes antigas. Ninguem percebe
  porque o plugin nao gera erro — simplesmente usa versoes velhas. A defasagem e
  silenciosa e cumulativa. No caso, ficou 2 dias sem ninguem notar.
- **Solucao**: Criada Etapa 0.7 (Saude do Plugin) que roda no smart mode apos Etapa 0.5
  e apos pull/push. Compara versoes plugin vs cache, mostra tabela de divergencias, e
  sincroniza automaticamente com confirmacao. Regra #22: plugin NUNCA deve ficar mais
  de 1 operacao atras do cache.

### #14 — README manual fica desatualizado em pushes

- **Descoberta em**: 2026-03-28 (sessao 07 — diagnostico de integridade)
- **Contexto**: O README.md do repo mostrava v3.3.0 quando o repo ja estava em v4.0.0+.
  Tres PRs foram mergeados (v4.0.0, v4.1.0, bootstrap fix) sem atualizar o README. A
  tabela de skills listava 5 skills com versoes antigas, sem os 5 hooks, sem delivery-cards.
- **Problema**: README e atualizado "manualmente" pelo agente durante o push. Mas se o
  agente esquece (ou se o push foca so no SKILL.md + manifest), o README fica stale.
  Usuarios que consultam o repo veem informacao incorreta. O updater v4.1.0 tinha regra
  #11 ("atualizar README em cada push") mas dependia do agente lembrar — nao havia
  mecanismo automatico.
- **Solucao**: README passa a ser auto-gerado a partir do manifest.json via template
  fixo. O updater gera o README como parte obrigatoria do commit de push — nao depende
  do agente "lembrar". Template le dados do manifest + descricoes dos H1. Regra #23:
  README e SEMPRE gerado, NUNCA editado manualmente.

### #15 — Manifest pode regredir versoes quando PRs usam bases desatualizadas

- **Descoberta em**: 2026-03-28 (sessao 07 — diagnostico de integridade)
- **Contexto**: PR #22 (devops v3.2.1) e PR #24 (escriba v3.2.0) foram mergeadas ao
  repo, atualizando o manifest. Depois, PR #25 (v4.0.0 reestruturacao) foi criada a
  partir de uma base que NAO incluia as versoes de #22/#24. Quando #25 mergeou, o
  manifest regrediu escriba para v3.1.0 e devops-mural para v3.1.0 — mesmo com os
  SKILL.md corretos ja no repo.
- **Problema**: O manifest.json e um arquivo JSON unico. Se duas PRs tocam versoes
  diferentes no manifest, a ultima a mergear SOBRESCREVE a primeira. O auto-merge do
  GitHub nao faz merge inteligente de JSON — apenas aceita a versao mais recente do
  arquivo inteiro. Resultado: versoes corretas no H1 dos SKILL.md mas incorretas no
  manifest, causando confusao no updater de outros projetos.
- **Solucao**: Verificacao Cruzada do Manifest obrigatoria apos cada push. O updater
  compara cada versao no manifest com o H1 do SKILL.md correspondente no cache. Se
  divergem, corrige o manifest automaticamente (H1 e fonte de verdade). Regra #24:
  manifest DEVE ter verificacao cruzada com H1 apos cada push.

### #16 — Hooks editados fora do fluxo = deriva silenciosa entre plugin e repo

- **Descoberta em:** Sync ops-suite no projeto web_claude_code (2026-03-30)
- **Contexto:** Os hooks `tuninho-hook-inicio-sessao` e `tuninho-hook-cards-mural` tinham fix de `systemMessage→additionalContext` aplicado diretamente no plugin global (`~/.claude/plugins/`), sem commitar ou pushar ao repo.
- **Problema:** O plugin local estava em v3.2.0/v1.1.0 enquanto o repo permanecia em v3.1.0/v1.0.0. A divergencia so foi detectada quando o updater comparou versoes no modo smart. Outros projetos que fizessem pull receberiam as versoes antigas (bugadas) do repo.
- **Solucao:** TODA edicao em hooks DEVE passar pelo fluxo push do updater. O modo smart do updater ja detecta quando o plugin esta a frente do repo (mostra → PUSH). Reforco: editar hooks diretamente no plugin e equivalente a hotfix direto no servidor — cria divergencia silenciosa.

### #17 — Hooks legados no nivel de projeto devem ser detectados e migrados

- **Descoberta em:** Op 10 Sprint #01 Chooz 2026 (2026-03-30)
- **Contexto:** Projeto tinha 3 hooks com nomes legados (pre-v4.0.0) em `.claude/hooks/scripts/`: `token-monitor.py`, `session-start-check.py`, `post-session-summary.sh`. O hooks.json referenciava esses nomes. 2 hooks criticos (cards-mural, guardiao-skills) estavam completamente ausentes.
- **Problema:** Os hooks legados nao recebiam atualizacoes do ops-suite (nomes diferentes), e os hooks criticos (cards-mural para deteccao automatica de cards, guardiao para protecao de skills) simplesmente nao existiam no projeto. O operador so descobriu por acaso ao final de uma operacao longa.
- **Solucao:** O updater DEVE, em TODA execucao (pull, verify, status, bootstrap):
  1. Escanear `.claude/hooks/scripts/` por nomes legados: `token-monitor.py`, `session-start-check.py`, `post-session-summary.sh`
  2. Se encontrar: avisar "hooks legados detectados" e oferecer migracao (baixar oficiais, atualizar hooks.json, remover legados)
  3. Verificar que TODOS os 5 hooks oficiais existem no projeto (nao so no plugin global)
  4. Se algum falta: baixar do repo via `gh api` e registrar no hooks.json do projeto
  5. Verificar que hooks.json do projeto NAO referencia nomes legados (`op-novo`, `op-continuar`, nomes sem prefixo `tuninho-hook-`)
  Regra: hooks mortos/faltantes sao tao perigosos quanto skills desatualizadas.

### #18 — Hooks criticos faltantes devem ser instalados proativamente

- **Descoberta em:** Op 10 Sprint #01 Chooz 2026 (2026-03-30)
- **Contexto:** `tuninho-hook-cards-mural.py` e `tuninho-hook-guardiao-skills.py` nao existiam no projeto. O cards-mural e responsavel por detectar cards `## [ID]` automaticamente e acionar delivery-cards. O guardiao protege skills de modificacoes acidentais.
- **Problema:** Sem cards-mural, o delivery-cards so e acionado manualmente (o operador tem que lembrar). Sem guardiao, qualquer edit em SKILL.md passa sem validacao. Ambos sao hooks de seguranca que devem estar SEMPRE ativos.
- **Solucao:** Na verificacao de hooks, tratar a AUSENCIA de cards-mural ou guardiao-skills como FAIL critico (nao warning). Instalar automaticamente se faltantes. Esses 2 hooks sao equivalentes a "firewall" do ops-suite.

### #19 — op-novo e op-continuar sao deprecated — remover referencias

- **Descoberta em:** Op 10 Sprint #01 Chooz 2026 (2026-03-30)
- **Contexto:** O hook `session-start-check.py` legado tinha patterns para `/op-novo` e `/op-continuar` que nao sao mais usados. O fluxo atual usa `/tuninho-ddce`, `/ddce`, ou cards diretos.
- **Problema:** Patterns deprecated causam falsos positivos ou nao detectam o inicio real de operacoes.
- **Solucao:** Remover todas as referencias a `op-novo`/`op-continuar` dos hooks. Substituir por: `/ddce`, `/tuninho-ddce`, e deteccao de cards `## [ID]`. O hook `tuninho-hook-inicio-sessao.py` oficial ja tem os patterns corretos.

### #20 — Verify deve checar hooks tanto no plugin global quanto no projeto local

- **Descoberta em:** Op 10 Sprint #01 Chooz 2026 (2026-03-30)
- **Contexto:** O verify checava hooks no plugin global (`~/.claude/plugins/`) mas nao verificava o `.claude/hooks/` do projeto atual. Projetos podem ter hooks locais (via hooks.json do projeto) que divergem do plugin.
- **Problema:** Um projeto pode ter hooks legados/incompletos no nivel local enquanto o plugin global esta correto. O verify reporta PASS mas o projeto esta desprotegido.
- **Solucao:** O verify deve checar AMBOS os niveis: (1) plugin global ~/.claude/plugins/ (existencia, registro no settings.json), (2) projeto local .claude/hooks/ (existencia, hooks.json atualizado, sem legados). Report deve mostrar ambos separadamente.

### #21 — CLAUDE_MODEL env var NAO esta disponivel em hooks

- **Descoberta em:** Reescrita conta-token v4.0.0 (2026-03-30)
- **Contexto:** O hook conta-token v4.0.0 detectava o modelo via `os.environ.get("CLAUDE_MODEL")` para ajustar a janela de contexto (Opus 1M vs Sonnet 200k). O hook usava 200k como default conservador.
- **Problema:** O Claude Code NAO expoe `CLAUDE_MODEL` como env var para hooks executados via PreToolUse. A variavel retorna vazia, caindo no branch `else` com 200k. Com Opus (1M real), o hook calculava 80% quando na verdade eram ~16%, bloqueando a sessao inteira com `permissionDecision: deny`. O bloqueio era irrecuperavel — nenhuma ferramenta podia ser executada, incluindo a que corrigiria o bug.
- **Solucao:** Default DEVE ser Opus 1M (modelo padrao do Claude Code CLI). Tabela de modelos com dict para manter pricing correto. So ajustar para Sonnet/Haiku se a env var explicitamente indicar. NUNCA usar default conservador que possa bloquear — um falso positivo de bloqueio e pior que um falso negativo de alerta.
- **Gravidade:** CRITICA. Hook bloqueou sessao inteira. Correcao exigiu intervencao manual no terminal.

### #22 — CLAUDE.md com secao A4tunados legada deve ser atualizada em pull/bootstrap

- **Descoberta em:** Varredura de legado pos-reescrita hooks (2026-03-30)
- **Contexto:** O CLAUDE.md de projetos contem secao "A4tunados Ops Suite" que descreve o metodo antigo (checkpoints CP1-CP5, /op-novo, /op-continuar, REGRA ZERO com thresholds VERDE/AMARELO/LARANJA/VERMELHO). O metodo DDCE substituiu tudo isso.
- **Problema:** A secao legada no CLAUDE.md causa confusao no agente — ele ve instrucoes contraditorias entre o CLAUDE.md (metodo antigo) e a skill DDCE (metodo novo). Referencias a /op-novo e /op-continuar confundem deteccao de comandos.
- **Solucao:** O updater DEVE, em pull e bootstrap, verificar se o CLAUDE.md contem patterns legados (op-novo, op-continuar, CP1-CP5, REGRA ZERO, Fase 1/Fase 2 por contagem de tools) e oferecer atualizacao para a secao DDCE v4.x. Template da secao atualizada fica no updater como referencia.

### #23 — `cd` em script de push infecta cwd da sessao e quebra hook git-flow

- **Descoberta em:** Sessao smart mode (2026-05-02), projeto a4tunados_web_claude_code
- **Contexto:** O algoritmo de push do updater v4.10.1 instruia `cd _a4tunados/.cache/a4tunados-ops-suite && git ...`. O `cd` muda o working directory persistente do tool shell do Claude Code (Bash tool reusa o mesmo subprocesso). O cache, apos checkout de branch nova, ficava em `main`.
- **Problema:** Apos o push do sidecar, comandos posteriores na mesma sessao herdaram o cwd do cache. Quando tentei Edit no `.gitignore` do projeto (branch feat/*), o hook `tuninho-hook-git-flow` v1.1.0 leu a branch via `git rev-parse --abbrev-ref HEAD` no cwd (cache) e detectou `main`, bloqueando o Edit com erro de "git flow inegociavel". O problema parece "branch errada" mas e "cwd errado".
- **Solucao:** (1) Updater v4.10.2 troca `cd $CACHE && git ...` por `git -C "$CACHE" ...` em todas as etapas. (2) Hook git-flow v1.2.0 resolve a branch a partir do `dirname(file_path)` do tool_input em vez do cwd, blindando o caso. As duas medidas se reforcam: mesmo que algum lugar ainda use `cd`, o hook ja le a branch correta.
- **Gravidade:** Alta — bloqueia silenciosamente, mensagem do hook nao revela a causa real.

### #24 — "investigar" NUNCA implica aplicar — protocolo de smart mode deve parar

- **Descoberta em:** Sessao smart mode (2026-05-02), tuninho-qa
- **Contexto:** Smart mode apresentou tabela com tres pendencias: (1) PULL geral, (2) PUSH de sidecar, (3) decisao sobre tuninho-qa onde local v1.0.0 era major maior que remoto v0.15.1. A opcao 3c era "investigar" (comparar conteudo antes de decidir). Operador respondeu "1 sim 2 sim 3c".
- **Problema:** O updater interpretou "3c" como aprovacao (conjunto com 1 sim, 2 sim) e aplicou pull no qa. Precisou reverter via backup `_a4tunados/merge-backups/...`.
- **Solucao:** Regra #28 do updater. Investigar nunca implica aplicar — apresentar o relatorio e PARAR para a skill, mesmo quando outras decisoes na mesma resposta foram aprovadas. Pedir nova decisao explicita {pull | push | deixar} apos a investigacao. Nao propagar aprovacao de item N para "investigar item M".
- **Gravidade:** Media — backup salvou. Mas em casos sem backup, ou quando o operador depende da versao local para alguma operacao em curso, o impacto seria maior.

### #25 — Cinco confusoes recorrentes em smart mode (PR #118 — projeto `a4tunados_web_claude_code`)

- **Descoberta em:** Sessao smart mode (2026-05-04), push de sidecars do projeto Tuninho IDE Web
- **Contexto:** Operador rodou `/tuninho-updater` num projeto com 17 skills instaladas. O smart mode mostrou estado para 3 acoes (a/b/c) e teve 5 problemas de UX/correcao que se repetiram em sessoes anteriores em outros projetos:
  1. **Falso alarme de versao**: scan inicial reportou `git-flow-dafor v0.5.0 → v0.5.1` (PULL) e `tuninho-tester v0.5.0` (sem manifest), mas o H1 real do git-flow-dafor era v0.5.1 (sincronizado) e do tester era v0.1.0. O regex `grep -m1 -oE 'v[0-9]+\.[0-9]+\.[0-9]+'` no SKILL.md inteiro pegou primeiras ocorrencias do frontmatter ("tuninho-portas-em-automatico v0.5.0+"), nao do H1.
  2. **Skill orfa caia em "investigar"**: tester existe local mas nao no manifest. Sem estado explicito ÓRFÃ, o smart mode caia em "investigar" generico.
  3. **Sidecar de orfa marcado para push**: Etapa 0.8 oferecia push do sidecar do tester junto com os outros, sem checar que a skill nao esta no manifest. Pushar sidecar de skill nao registrada cria estado incoerente no repo.
  4. **DIVERGENTE generico mascarava natureza real**: tester aparecia como DIVERGENTE no scan, mas o `sidecar.md` era identico — divergencia era so por arquivos extras locais (3 arquivos: credentials.yaml, users-schema.yaml, auth-strategy.md). Operador teve que diff manual para entender.
  5. **"behind by N commits" pos-push**: durante o push do PR #118, 2 commits novos chegaram no remoto (delivery-cards + qa). O cache local ficou defasado e o operador viu warning confuso sobre estar atras.
- **Problema:** Cada um destes 5 pontos ja apareceu em sessoes anteriores em outros projetos. Sem correcao na skill, todo `/tuninho-updater` em projetos novos cai nas mesmas armadilhas. Operador experiente perde tempo investigando algo que deveria ser claro de inicio.
- **Solucao:** Regras inviolaveis #30, #31, #32 + algoritmos atualizados na Etapa 0 (regex H1), Etapa 0.8 (tipos de divergencia + HOLD orfa), smart mode (estado ÓRFÃ explicito) e modo push (pull --ff-only). Tudo bumpado em v4.11.0.
- **Gravidade:** Media — confusao recorrente custa tempo do operador e gera duvida sobre o que e estado real vs falso alarme. Em casos extremos (Licao #24 referenciada), levou a aplicar pull desnecessario sobrescrevendo conteudo correto.
