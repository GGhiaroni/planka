# Licoes Aprendidas — Tuninho Escriba

> Atualizado automaticamente apos cada execucao (Etapa 8: Retroalimentacao).
> Formato baseado no padrao do tuninho-ddce.

---

## Licoes

### #1 — Bootstrap precisa varrer documentacao ANTES do codebase

- **Descoberta em:** Projeto chooz_2026, 2026-03-23
- **Modo:** Bootstrap
- **Contexto:** Primeira execucao do Escriba em projeto existente. Inicialmente os agents Explore foram lancados direto para o codebase.
- **Problema:** Documentacao existente (PRD, CLAUDE.md, escopo original) continha decisoes e contexto que o codebase sozinho nao revela — por exemplo, por que Gemini Pro foi planejado mas Flash implementado, ou quais features do PRD ainda nao foram feitas.
- **Solucao:** Etapa B1 criada: varrer TODA documentacao existente (README, PRD, CLAUDE.md, .cursorrules, changelogs, specs) ANTES de lancar os agents Explore. Isso alimenta os agents com contexto e permite identificar gaps entre documentado vs implementado.

### #2 — Decisoes arquiteturais podem ser inferidas do codebase

- **Descoberta em:** Projeto chooz_2026, 2026-03-23
- **Modo:** Bootstrap
- **Contexto:** Durante a consolidacao (Etapa B3), varias decisoes tecnicas relevantes nao estavam documentadas explicitamente mas eram claras pelo codigo — ex: sessionStorage ao inves de banco, formulario ao inves de chat, btoa() ao inves de Buffer.
- **Problema:** Sem registrar essas decisoes, futuros desenvolvedores podem reverter choices sem entender o contexto original (ex: tentar usar Buffer no Vercel serverless).
- **Solucao:** Etapa B3 agora inclui "Identificacao de Decisoes Implicitas". Cada ADR inferido recebe tag `status/inferred` para transparencia. O formato inclui contexto, alternativas e consequencias mesmo quando inferidos.

### #3 — Documentos devem ser autossuficientes

- **Descoberta em:** Projeto chooz_2026, 2026-03-23
- **Modo:** Bootstrap
- **Contexto:** Primeiras versoes dos docs de API route tinham apenas referencia "ver codigo em route.ts" sem detalhar request/response.
- **Problema:** Leitor precisava abrir o codigo para entender a API, derrotando o proposito da documentacao.
- **Solucao:** Regra #6 adicionada: cada documento deve ser compreensivel sem ler o codigo-fonte. Docs de API incluem request/response completos, docs de componentes incluem props e estados.

### #4 — Codigo legado deve ser documentado separadamente

- **Descoberta em:** Projeto chooz_2026, 2026-03-23
- **Modo:** Bootstrap
- **Contexto:** Projeto tinha fluxo ativo (/corre) e fluxo legado (/chat, /onboarding, /resultado) coexistindo no codebase.
- **Problema:** Misturar documentacao de codigo ativo com legado confunde sobre o que e o estado atual do projeto.
- **Solucao:** Criar `componentes-legado.md` separado com callout `> [!warning]` explicando que nao faz parte do fluxo ativo. Permite referencia futura sem confundir.

### #5 — Paralelismo de agents acelera bootstrap significativamente

- **Descoberta em:** Projeto chooz_2026, 2026-03-23
- **Modo:** Bootstrap
- **Contexto:** 3 agents Explore rodaram em paralelo (frontend, backend, infra) e retornaram resultados detalhados em ~2 minutos.
- **Problema:** Sequencial levaria 6+ minutos e consumiria mais contexto do agente principal.
- **Solucao:** Manter obrigatoriedade de 3 agents paralelos no Bootstrap (Regra #4). Definir escopos claros para cada agent evita overlap de trabalho.

---

## Tabela Resumo

| # | Licao | Categoria | Status |
|---|-------|-----------|--------|
| 1 | Varrer docs antes do codebase no Bootstrap | Bootstrap | Etapa B1 criada |
| 2 | Inferir decisoes arquiteturais do codigo | Decisoes | Tag `inferred` adicionada |
| 3 | Documentos devem ser autossuficientes | Qualidade | Regra #6 adicionada |
| 4 | Codigo legado documentado separadamente | Estrutura | Padrao ativo |
| 5 | Paralelismo de agents no Bootstrap | Performance | Regra #4 adicionada |
| 6 | Verificar changelog da plataforma + version file via sidecar DDCE | Changelog | Regra nova |
| 7 | Report Executivo automatico em toda execucao | Report | Etapa RE + Regra #13 |
| 8 | Guia de Comunicacao e Visual obrigatorio | Brand | Etapa B5 + Incremental |
| 9 | Vault legado integrado como subpasta | Estrutura | Padrao ativo |
| 10 | Comando de tokens quebra em paths longos (xargs ARG_MAX) | Tokens | Fix aplicado |
| 11 | Escriba deve verificar completude operacional antes de concluir | Completude | Etapa 5.6 criada |
| 12 | Custos obrigatorios junto a tokens + formato RESULTS padrao mural | Custos/Formato | v3.7.0 |
| 13 | Bump de versao obrigatorio em toda atualizacao de skill | Versionamento | Regra ativa |
| 14 | Resgate forense de sessao bloqueada via JSONL | Recovery | Fluxo novo + hook v4.2.0 |
| 15 | NUNCA pular Etapa 7.0→7.1 (diagnostico de branch) | Git Flow | Regra reforcada v3.8.0 |
| 16 | Token OAuth hardcoded na remote URL | Git Security | Higiene automatica Etapa 7.0 |
| 17 | Operacoes DDCE >2h devem ter escriba split em etapas | Token Budget | Recomendacao ativa |
| 18 | HANDOFF reescrito integralmente nas fases criticas | Continuidade | Padrao ativo |

### #6 — Verificar changelog da plataforma e version file via sidecar DDCE

- **Descoberta em:** Projeto a4tunados_mural, 2026-03-25
- **Modo:** Incremental
- **Contexto:** Apos documentar sessao 09 (Operacao 15), o changelog da plataforma (`CHANGELOG.md` na raiz) e o version file (`A4tunadosVersion.js`) nao foram atualizados. O sidecar DDCE (`projects/a4tunados_mural/config.md`) tinha instrucoes claras para isso na Etapa 15, mas o Escriba nao as verificou
- **Problema:** Changelog da plataforma e exibido na UI para os usuarios. Sem atualiza-lo, as novas features ficam invisiveis. O sidecar DDCE ja documentava esse requisito, mas o Escriba nao consultou o sidecar
- **Solucao:** Na Etapa 5 (Atualizar Indices), o Escriba DEVE verificar se existe sidecar DDCE em `.claude/skills/tuninho-ddce/projects/{nome}/config.md`. Se existir e tiver secao "Changelog e Versionamento", seguir as instrucoes para atualizar os arquivos listados (changelog da plataforma, version file, etc.)

### #7 — Report Executivo deve ser gerado em toda execucao do Escriba

- **Descoberta em:** Projeto BatutaManager, 2026-03-28
- **Modo:** Incremental
- **Contexto:** Apos 5 operacoes completas, o operador precisou pedir manualmente um report executivo consolidado com custos, tokens e tempos. Essa informacao deveria ser gerada automaticamente.
- **Problema:** Sem report executivo automatico, o operador precisa manualmente cruzar dados de todas as operacoes para ter visao macro de custos e progresso.
- **Solucao:** Etapa RE criada como obrigatoria em ambos os modos (Bootstrap e Incremental). Lê READMEs de operacoes, deploys e sessoes para consolidar tokens, custos, tempo bruto/liquido e entregaveis. Gera/atualiza `report-executivo.md` no vault. Regra inviolavel #13 adicionada.

### #8 — Guia de Comunicacao e Visual deve ser documento obrigatorio

- **Descoberta em:** Projeto maestrofieldmanager, 2026-03-29
- **Modo:** Incremental
- **Contexto:** Durante o rebrand do Maestro, o operador solicitou que o escriba SEMPRE crie um "Guia de Comunicação e Visual do Projeto e Marca" como documento separado no vault, servindo como fonte de verdade única para naming, cores, tipografia, tom de comunicação e visual.
- **Problema:** Sem um documento dedicado de brand guide, as regras de marca ficam espalhadas em ADRs, sessões e código — difíceis de consultar e manter atualizadas.
- **Solucao:** O Escriba deve, em TODO projeto: (1) Se não existir `guia-comunicacao-visual.md` no vault, CRIAR durante Bootstrap ou na primeira execução incremental. (2) Se existir, VERIFICAR se está atualizado e INCREMENTAR com mudanças. (3) O guia cobre: naming (regras de caixa, hierarquia), paleta de cores, tipografia, componentes de marca, tom de comunicação, URLs/domínios. (4) Deve ter link no MOC-Projeto em seção própria. (5) É a fonte de verdade — código e designs devem ser consistentes com ele.

### #9 — Vault legado deve ser integrado como subpasta, não mantido separado

- **Descoberta em:** Projeto maestrofieldmanager, 2026-03-29
- **Modo:** Incremental
- **Contexto:** O projeto tinha dois vaults separados (legado LionGest + Maestro). O operador solicitou unificação para ter uma única fonte de documentação.
- **Problema:** Dois vaults fragmentam navegação, dificultam busca no Obsidian, e criam risco de consultar documentação desatualizada do vault errado.
- **Solucao:** Mover vault legado integramente para `legado/` dentro do vault atual. Renomear MOCs para evitar conflito. Prefixar wikilinks com `legado/`. Adicionar seção "Mapeamento Sistema Legado" no MOC-Projeto principal. Quando o Escriba encontrar múltiplos vaults no mesmo projeto, sugerir unificação.

### #10 — Comando de tokens quebra em paths longos (xargs ARG_MAX)

- **Descoberta em:** Projeto a4tunados_web_claude_code, 2026-03-30
- **Modo:** Incremental
- **Contexto:** O comando de coleta de tokens usa `xargs -I{}` com o path do JSONL. Em projetos com paths longos, o path expandido excede o ARG_MAX do xargs, causando erro "command line cannot be assembled, too long".
- **Problema:** Token collection falhava silenciosamente, deixando o campo "Consumo de Tokens" vazio no log da sessao.
- **Solucao:** Substituir `xargs -I{}` por variavel intermediaria: `JSONL=$(ls -t ... | head -1)` seguido de `[ -n "$JSONL" ] && python3 -c "..."`. Elimina a dependencia do xargs e funciona com qualquer tamanho de path.

### #11 — Escriba deve verificar completude operacional antes de concluir

- **Descoberta em:** Projeto chooz_2026, 2026-03-30
- **Modo:** Incremental
- **Contexto:** Op 10 tinha 5 fases. Escriba rodou apos fases 1-4 concluidas mas fase 5 (deploy) ainda em andamento. Gerou docs Obsidian mas nao criou `_3_RESULTS`, card results, nem atualizou README/checklists operacionais. Deploy foi concluido em sessao separada sem re-execucao do escriba.
- **Problema:** Artefatos operacionais ficaram inconsistentes: README com todas as fases PENDENTE, cards sem results, sem arquivo RESULTS. O operador precisou detectar e corrigir manualmente.
- **Solucao:** Criar Etapa 5.6 (Verificacao de Completude Operacional). Antes da verificacao final, o Escriba DEVE: (1) Identificar operacoes DDCE referenciadas na sessao. (2) Verificar se o README tem fases com status correto vs checklists. (3) Verificar se `_3_RESULTS` existe quando operacao tem fases concluidas. (4) Verificar se cards tem results quando mencionados no RESULTS. (5) Se gaps detectados, corrigir antes de prosseguir. Isso funciona como safety net retroativa, complementando a Etapa 5.5 (card validation) que so verifica cards existentes.

### #12 — Custos obrigatorios junto a tokens + formato RESULTS deve seguir padrao mural

- **Descoberta em:** Projeto chooz_2026, 2026-03-30
- **Modo:** Incremental
- **Contexto:** (1) O _3_RESULTS_ da Op 10 foi gerado com formato livre (headers proprios, sem `## [cardId]` + `### Description` + `### Comments`) e nao foi reconhecido pelo sistema do mural. Card results foram criados com nome `result_` ao inves de `results_` e sem frontmatter/verbatim copy. (2) Tokens eram registrados sem custo estimado, dificultando visibilidade financeira do projeto.
- **Problema:** (1) RESULTS ilegivel pelo mural e delivery-cards. Cards com nome/formato errado. (2) Operador precisa calcular custos manualmente quando ha apenas tokens.
- **Solucao:** (1) RESULTS DEVE seguir formato mural: `## [cardId] Titulo` + `### Description` (verbatim do original) + `### Comments` (resultado) + `## Resumo Geral`. Card results: `results_` (nao `result_`) com frontmatter YAML e copia verbatim do RESULTS. (2) Onde ha tokens, DEVE haver custo USD e BRL. Formula: `delta_tokens * 15 / 1M` (blended rate Opus 4.6). Nota de metodologia obrigatoria na primeira ocorrencia.

### #13 — Bump de versao obrigatorio em toda atualizacao de skill

- **Descoberta em:** Projeto a4tunados_web_claude_code, 2026-04-04
- **Modo:** Incremental
- **Contexto:** Feedback do operador armazenado na memory do Claude Code, onde nao replica para outros projetos/estacoes. O tuninho-updater detecta atualizacoes comparando versoes locais vs remotas via manifest.json. Sem bump de versao, mudancas em skills ficam invisiveis para o updater.
- **Problema:** Licoes, feedbacks e atualizacoes de conteudo em skills nao propagavam para outros projetos/ambientes porque a versao nao era incrementada. O updater ignorava as mudancas por nao detectar diferenca de versao.
- **Solucao:** Ao registrar qualquer licao, feedback ou atualizar conteudo de uma skill (mesmo sem mudanca no fluxo), SEMPRE incrementar patch version (vX.Y.Z+1) no H1 do SKILL.md e na tabela de versionamento. Informacoes que precisam replicar entre projetos DEVEM estar na skill (references/), NAO na memory do Claude Code.

### #14 — Resgate forense de sessao bloqueada via JSONL

- **Descoberta em:** Projeto a4tunados_web_claude_code, 2026-04-05
- **Modo:** Incremental
- **Contexto:** A sessao anterior da Op 14 (jsonl `551b797f`) foi bloqueada pelo hook `tuninho-hook-conta-token` em 82.1% de contexto antes do escriba poder rodar. 6 fixes pos-deploy foram aplicados em producao e commitados no git, mas nao documentados no vault Obsidian. O HANDOFF.yaml do DDCE capturou o proximo passo, mas nao o conteudo integral da sessao (prompts verbatim, issues reportadas, timeline de deploys, decisoes tecnicas, bugs descobertos ao vivo).
- **Problema:** Quando uma sessao trava na trava de 80%, nao e possivel rodar o escriba dentro dela. HANDOFF.yaml preserva estado estrutural mas perde o tecido narrativo (o que o operador disse, como o bug foi descoberto, qual foi a decisao). Sem esse material, a documentacao da sessao travada fica rasa ou precisa ser reconstruida de memoria.
- **Solucao:** Novo fluxo de "Resgate Forense". Em nova sessao, o operador invoca o escriba com pedido de resgate. O agente: (1) localiza o JSONL da sessao travada em `~/.claude/projects/{project_hash}/*.jsonl`, (2) lanca um agent Explore com instrucoes forenses para extrair VERBATIM: primeiro prompt, cards/tarefas com IDs exatos, issues reportadas pelo operador (citacoes diretas), decisoes tecnicas, timeline de deploys com timestamps, bugs descobertos ao vivo, tokens finais, (3) consolida um briefing que alimenta o escriba como se nunca tivesse saido da sessao original. Complemento critico: o hook `tuninho-hook-conta-token` v4.2.0 (ops-suite v4.14.0) agora permite excecoes para escriba e operacoes HANDOFF.* apos a trava de 80% — os ~20% restantes (~200k tokens em Opus 1M) existem JUSTAMENTE para documentacao integral, nao devem ser bloqueados.

### #15 — NUNCA pular Etapa 7.0→7.1 (diagnostico de branch) antes de commitar

- **Descoberta em:** Projeto weplus_prototipo, 2026-04-08
- **Modo:** Incremental
- **Contexto:** Na Op 01 (migracao Hostinger), o Escriba pulou as Etapas 7.0 e 7.1 e foi direto para 7.2 (sugestao de commit), commitando diretamente em `main` sem alertar o operador. O projeto nunca teve branch `develop` nem branches `feat/` — 8 commits lineares em `main`.
- **Problema:** O Git Flow a4tunados exige: diagnostico → analise de branch → GATE 7.1 → commit. Pular 7.0/7.1 resultou em commit direto em `main` sem oferecer as opcoes de branch retroativa ou criacao de `develop`. O operador corretamente cobrou que o fluxo dos tuninhos nao foi seguido.
- **Solucao:** Etapa 7.0 e 7.1 sao PRE-REQUISITOS INVIOLAVEIS antes de qualquer commit. Se em `main` direto: DEVE alertar com enfase e oferecer opcoes. Se `develop` nao existe: DEVE sugerir criacao. NUNCA reproduzir padrao errado do historico — o Escriba e responsavel por INSTAURAR o Git Flow, nao por replicar ausencia dele.

### #16 — Token OAuth hardcoded na remote URL causa falhas recorrentes de push

- **Descoberta em:** Projeto weplus_prototipo, 2026-04-08
- **Modo:** Incremental
- **Contexto:** `git push` falhou com `fatal: could not read Password` porque a remote URL tinha um token `gho_*` expirado embutido diretamente (`https://gho_xxx@github.com/...`). A "correção" aplicada na sessao — `git remote set-url` com `$(gh auth token)` — funciona no momento mas recria o mesmo problema na proxima sessao quando o token expirar.
- **Problema:** Tokens `gho_*` sao tokens de sessao do `gh` CLI. Eles expiram. Quando embutidos na URL do remote, criam um ciclo: funciona → expira → push falha → alguem embute novo token → funciona → expira. Isso explica por que o erro "acontece com frequencia".
- **Solucao:** NUNCA embutir token na remote URL. A solucao correta e usar credential helper dinamico: `git config --global credential.helper '!gh auth git-credential'` + URL limpa `https://github.com/org/repo.git`. O credential helper pede o token ao `gh` a cada operacao, sem embutir. Verificacao preventiva adicionada na Etapa 7.0 do Escriba e no Stage 0.5 do devops-hostinger-alfa.

### #17 — Operacoes DDCE longas (>2h) exigem escriba split em etapas intermediarias

- **Descoberta em:** Projeto a4tunados_mural, 2026-04-15 (Op 25)
- **Modo:** Incremental
- **Contexto:** Op 25 (Replicacao Mural Hostinger-Beta) executou 8 fases em ~2h52 na sessao 01. O escriba foi invocado apenas na Fase 8 (final), quando o contexto ja estava em ~80%. Resultado: o hook tuninho-hook-conta-token bloqueou novos tool calls exceto HANDOFF.* e tuninho-escriba, mas mesmo assim o escriba nao conseguiu completar MOC-Sessoes, changelog, report-executivo e git flow 7.0-7.5 — deferidos para nova sessao.
- **Problema:** Quando o escriba roda apenas no fim de operacoes longas, o budget de tokens restante pode ser insuficiente para completar TODAS as suas etapas (documentos + git flow + retroalimentacao + updater push). Isso forca deferimento para nova sessao, aumentando complexidade de retomada e risco de gaps.
- **Solucao:** Para operacoes DDCE com duracao estimada >2h ou >5 fases, recomendar invocacao intermediaria do escriba:
  - **Escriba-parcial** apos metade das fases (ex: apos Fase 4 de 8): salvar sessao + prompts + 1 ADR + MOC-Projeto update. Baixo custo (~5-10k tokens).
  - **Escriba-final** apos ultima fase: restante (changelog, report-executivo, git flow, retroalimentacao).
  - Alternativa: invocar escriba em 3 momentos (inicio, meio, fim) para operacoes extra longas (>4h).
  - Orientacao ao operador: quando a operacao tiver muitas fases, o escriba deveria ser chamado antes do fim para nao arriscar perder o budget.
  - Integracao com DDCE: a skill tuninho-ddce deveria sugerir escriba-intermediario nas transicoes de fase quando o budget ja estiver >60%.

### #18 — HANDOFF deve ser reescrito integralmente (nao apenas incrementado) nas fases criticas

- **Descoberta em:** Projeto a4tunados_mural, 2026-04-15 (Op 25)
- **Modo:** Incremental
- **Contexto:** Durante a Op 25, o HANDOFF.yaml foi sendo incrementado com deltas ao longo das 8 fases. No fim, o arquivo ficou com estrutura inconsistente (secoes antigas misturadas com novas, duplicacoes, ambiguidade sobre o que era o estado final vs historico). Operador precisou pedir uma "reescrita final pos-auditoria" antes da sessao encerrar.
- **Problema:** HANDOFFs incrementais acumulam ruido. Na hora da retomada, a sessao nova tem que filtrar o que e estado atual vs o que e historico irrelevante. Isso aumenta tokens de cold start e risco de interpretacao errada.
- **Solucao:** Em fases criticas (fim de operacao, checkpoint 80%, transicao de fase maior), reescrever o HANDOFF do ZERO com:
  - Secao "estado final" como UNICA fonte de verdade do que ainda esta pendente
  - Secao "cronologico/historico" isolada (se precisar preservar)
  - Verificacao de consistencia obrigatoria antes de considerar o HANDOFF "escrito"
  - Estimativa de tokens de cold start para a proxima sessao
  - Nao depender de HANDOFFs fragmentados — sempre ter ao menos 1 versao "limpa e auto-suficiente".
- **Como aplicar:** Ao invocar escriba no fim de operacoes longas, e responsabilidade do escriba (em conjunto com o DDCE) validar que o HANDOFF final e legivel e consistente. Se nao for, reescrever antes de encerrar a sessao.

### #19 — `origin/HEAD` local pode ser FOSSIL do clone; fonte oficial de tronco e `default_branch` via GitHub API

- **Descoberta em:** Projeto tuninho.ai, 2026-04-19 (investigacao com QA)
- **Modo:** Incremental
- **Contexto:** Operador pediu "criar develop no git flow, merge nele da branch de feature atual, e sync". Estado do repo:
  - `main` no GitHub: `default_branch = "main"` (confirmado via API)
  - `origin/HEAD` local: apontando para `feat/sem_tuninho` (defasado!)
  - Deploys no GitHub: 1 Production (ref `0098428`, branch `main`) + 3 Preview (minhas branches)
  - `feat/sem_tuninho` (ebbcf1e): 4 commits de limpeza Vite, **ZERO production deploys**, branch abandonada
  - Operador me disse depois: ambas `feat/sem_tuninho` e `feat/com_tuninho` ja eram "vencidas"
- **Problema (causa raiz):**
  - **`origin/HEAD` local NAO e fonte de verdade do tronco canonico.** E um symbolic ref estatico definido no `git clone` — aponta para o `default_branch` do repo **no momento do clone**. Se o GitHub mudar o `default_branch` depois, o git local **NUNCA atualiza automaticamente**. Fica um fossil.
  - Neste caso: o repo provavelmente foi clonado quando `default_branch = feat/sem_tuninho`, depois o operador mudou para `main`, mas o `origin/HEAD` do meu ambiente ficou congelado apontando pro nome antigo.
  - Quando fui criar `develop`, olhei `origin/HEAD -> feat/sem_tuninho` e assumi "esse e o tronco". Usei como base. Resultado: `develop` nasceu com 4 commits de feature abandonada no historico, contaminando a linha de desenvolvimento.
  - **Essa confusao e reincidente** em projetos onde `origin/HEAD` foi clonado "ha muito tempo" ou antes de reorganizacoes de branch.
- **Solucao:**
  - **Regra INVIOLAVEL:** a fonte oficial do tronco canonico e o `default_branch` do GitHub (ou GitLab/Bitbucket), obtido via API — NUNCA `origin/HEAD` local.
    ```bash
    # Fonte correta do tronco canonico
    TRUNK=$(gh api repos/{owner}/{repo} --jq '.default_branch')
    # Ou, quando gh nao estiver disponivel, perguntar ao operador
    ```
  - **Sintomas de `origin/HEAD` fossil (checar sempre):**
    - Diverge do `default_branch` real da API
    - Aponta para uma branch que nao esta protegida
    - Aponta para uma feat/* ou fix/* (default branches normalmente sao `main`/`master`/`develop`)
    - Tem commits que nunca foram para production (checar via `gh api repos/.../deployments`)
  - **Correcao local:** atualizar o symbolic ref
    ```bash
    # Automatico (precisa auth)
    git remote set-head origin -a

    # Manual (quando auth esta ruim)
    git remote set-head origin {branch_default}
    ```
  - **Workflow correto para criar `develop` do zero:**
    ```bash
    # 1. Obter tronco canonico da API (nao confiar em origin/HEAD local)
    TRUNK=$(gh api repos/{owner}/{repo} --jq '.default_branch')
    echo "Tronco canonico: $TRUNK"

    # 2. Validar (opcional mas recomendado): ver quais branches tiveram Production deploys
    gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment=="Production") | .ref' | sort -u

    # 3. Sincronizar com o tronco atual e criar develop
    git fetch origin "$TRUNK:refs/remotes/origin/$TRUNK"
    git checkout "$TRUNK"
    git pull
    git checkout -b develop "$TRUNK"

    # 4. Merge da feature ativa
    git merge --no-ff feat/{nome} -m "merge: {descricao}"

    # 5. Push
    git push -u origin develop
    ```
  - **Diagnostico pos-criacao:** rodar `git log --oneline --graph develop {TRUNK} -10` e confirmar que o grafo mostra APENAS `{TRUNK} + merge(feat)`, sem commits de outras feat/*. Se aparecer contaminacao, deletar `develop` (local + remoto) e recriar.
  - **Red flag cognitivo:** quando olhar `git branch -r` e pensar "a branch X tem mais commits, deve ser a tronco" — PARE. Quantidade de commits nao significa autoridade. Branches abandonadas acumulam commits sem nunca serem merged.
- **Como aplicar:** Integrada no SKILL.md Etapa 7.1 do Escriba com bloco "Criacao de `develop` do zero" (Subsecao 7.1.1). Esta Licao e a primeira a tratar **decisao de base** (vs Licao #15 que trata "qual branch executou").

---

## Como Adicionar Nova Licao

Ao final de cada execucao (Etapa 8), seguir este formato:

```markdown
### #{N} — {Titulo descritivo}

- **Descoberta em:** Projeto {nome}, {YYYY-MM-DD}
- **Modo:** Bootstrap | Incremental
- **Contexto:** {Situacao em que ocorreu}
- **Problema:** {O que deu errado ou poderia ter sido melhor}
- **Solucao:** {O que foi feito ou deveria ser feito diferente}
```

Atualizar a tabela resumo com a nova entrada.
