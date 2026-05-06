# Licoes Aprendidas — Tuninho DDCE

> Atualizado automaticamente apos cada operacao (Etapa 16: Retroalimentacao).
> Formato baseado no padrao do tuninho-devops-mural-devprod.

---

## Licoes

### #1 — Compactacao de contexto causa perda de estado

- **Descoberta em:** Operacoes legadas V2.x (2026-01 a 2026-03)
- **Contexto:** CP3 nao manteve Playwright aberto apos compactacao automatica do Claude
- **Problema:** Ao atingir ~95% de contexto, compactacao automatica descartou estado da sessao
- **Solucao:** Token management agora e responsabilidade do hook `token-monitor.py`, nao do fluxo DDCE. O hook bloqueia a >=65%.

### #2 — Playwright screenshots via browser_run_code

- **Descoberta em:** Operacoes legadas V2.x
- **Contexto:** `browser_take_screenshot` causa erro 400 de incompatibilidade de tipo de imagem
- **Problema:** API rejeita a imagem com "Image does not match the provided media type"
- **Solucao:** SEMPRE usar `browser_snapshot` (preferivel) ou `browser_run_code` com `await page.screenshot({ path: 'file.png', fullPage: true })`

### #3 — Validacao humana nao pode ser pulada

- **Descoberta em:** Operacoes legadas V2.x
- **Contexto:** Playwright pode passar em testes automaticos mas perder nuances visuais
- **Problema:** Automatizacao 100% sem humano no loop causou bugs visuais em producao
- **Solucao:** Validacao humana e GATE obrigatorio. Playwright valida funcionalidade, humano valida experiencia.

### #4 — Handoff deve ser compacto

- **Descoberta em:** Operacoes legadas V2.x
- **Contexto:** Handoffs longos (>2000 tokens) causavam sobrecarga ao retomar sessao
- **Problema:** Claude gastava contexto significativo apenas lendo o handoff
- **Solucao:** HANDOFF.yaml compacto com painel resumido. Detalhes ficam nos artefatos (_1_, _2_).

### #5 — Plano completo antes de executar

- **Descoberta em:** Operacao 04 (tabela_view_xp) e 10 (exportacao_importacao)
- **Contexto:** Operacoes que comecaram sem plano completo tiveram retrabalho significativo
- **Problema:** Sem plano, tarefas eram descobertas durante a execucao, causando desvios
- **Solucao:** GATE DEFINE obrigatorio. NUNCA executar sem plano completo aprovado.

### #6 — Ciclos de descoberta economizam retrabalho

- **Descoberta em:** Analise retrospectiva das 12 operacoes legadas
- **Contexto:** Operacoes com melhor discovery tiveram menos desvios na execucao
- **Problema:** Discovery superficial = plano incompleto = execucao com surpresas
- **Solucao:** 3 ciclos de exploracao + 2 ciclos de entrevista obrigatorios no DISCOVER.

---

## Tabela Resumo

| # | Licao | Categoria | Status |
|---|-------|-----------|--------|
| 1 | Compactacao causa perda de estado | Tokens | Mitigado (hook) |
| 2 | Screenshots via browser_run_code | Playwright | Regra ativa |
| 3 | Validacao humana obrigatoria | Validacao | GATE ativo |
| 4 | Handoff compacto (<2000 tokens) | Handoff | Padrao ativo |
| 5 | Plano completo antes de executar | Define | GATE ativo |
| 6 | Ciclos de descoberta economizam | Discover | Padrao ativo |
| 7 | Etapa 11 (Playwright) nunca pode ser pulada | Validacao | Regra ativa |
| 8 | Controle de tempo obrigatorio por fase | Controle | Regra ativa |
| 9 | Documentacao completa por fase (5 arquivos) | Documentacao | Regra ativa |
| 10 | Changelog do projeto deve ser verificado (sidecar ou varredura) | Changelog | Regra ativa |
| 11 | Captura de tokens deve ser aplicada na propria operacao | Tokens | Ativo |
| 12 | Adaptacao como abordagem padrao | Discover/Define | Regra #15 ativa |
| 13 | Modo autonomo NAO justifica pular etapas | Controle | Regra reforçada |
| 14 | Model ID deve ser validado com chamada real antes de integrar | Integracao | Regra nova |
| 15 | Estimativa de custo obrigatoria por operacao | Custos | Regra ativa |
| 16 | Operador e modelo devem constar em toda operacao | Rastreabilidade | Regra ativa |
| 17 | Manter Playwright e dev server abertos para validacao | Validacao | Regra ativa |
| 18 | DDCE nao sugere commit, sugere escriba | Fluxo | Regra ativa |
| 19 | Perguntas com numeracao N/total + divisor visual | Entrevista | Regra nova |
| 20 | Socket.io obrigatorio para API calls autenticadas | Frontend | Regra nova |
| 21 | Position obrigatoria ao criar card via helper | Backend | Regra nova |
| 22 | Checkpoint de saúde a cada 20% de tokens | Tokens | Regra ativa |
| 23 | Auditorias via Playwright com regras de somente-leitura | Playwright | Regra ativa |
| 25 | Schema completo upfront para greenfield | Define | Regra ativa |
| 26 | Prisma 7 incompatível com seed simples SQLite | Stack | Regra ativa |
| 27 | Checkpoint de pausa com análise de cenários reais | Tokens | Regra ativa |
| 28 | Modo autônomo: doc de fases é gate obrigatório | Documentação | Regra nova |
| 29 | Ações pós-DDCE devem ser registradas formalmente | Fluxo | Regra nova |
| 30 | Evidencia visual Playwright obrigatoria | Validacao/Playwright | Regra nova |
| 31 | Screenshots devem ser LIDOS e INTERPRETADOS, nao apenas capturados | Validacao | Regra nova |
| 32 | page.goto() vs SPA navigation geram sessoes diferentes no analytics | Playwright/Testing | Conhecimento |
| 33 | Sidebar filtrada por role deve espelhar middleware | UX/Seguranca | Regra nova |
| 34 | Race condition em hooks async — usar queue de pendentes | Frontend | Padrao novo |
| 35 | Dashboard deve exibir nomes humanos, nunca IDs tecnicos | UX/Analytics | Regra nova |
| 36 | tmux mouse mode: ON para nativos, Shift+drag para web terminals | Terminal | Regra ativa |
| 37 | Validacao humana detecta bugs que Playwright nao pega | Validacao | Regra ativa |
| 38 | curl NAO substitui Playwright UI — Regra de Ouro | Validacao | Regra #19 |
| 39 | fetch vs axios: response structure muda ao migrar | Migracao | Regra ativa |
| 40 | Opus 1M permite op DDCE completa (5 fases + deploy) em 1 sessao | Tokens | Regra ativa |
| 41 | sshpass com PreferredAuthentications=password para chave com passphrase | Deploy | Regra ativa |
| 42 | Web research obrigatoria no DISCOVER evita decisoes baseadas apenas em visao interna | Discovery | Regra ativa |
| 43 | Discovery XP para handoff entre sessoes | Handoff | Regra ativa |
| 44 | Tuninhos devops sao fonte de verdade para infra — nao re-perguntar ao operador | Discovery/Infra | Regra ativa |
| 45 | Verificacao de consistencia do handoff obrigatoria | Handoff | Regra ativa |
| 46 | SSH com passphrase bloqueia modo autonomo — preparar deploy scripts como fallback | Deploy/Autonomo | Regra nova |
| 47 | selectors/index.js usa default export (spread), nao named exports — import como default | Frontend/PLANKA | Regra nova |
| 48 | Agent SDK V2 unstable ignora includePartialMessages — usar V1 query() para streaming real | SDK/Streaming | Regra ativa |
| 49 | Workspaces sem git sao edge case real — validar infraestrutura de dados no DISCOVER | Discovery/Infra | Regra ativa |
| 50 | Matriz central no vault e essencial para projetos multi-operacao — criar no inicio | Documentacao | Padrao ativo |
| 51 | review.md sistematicamente esquecido — confusao com checkpoints.md, falta de stub no template, falta de gate bloqueante | Documentacao/Fluxo | Regra #13 atualizada v3.9.0 |
| 52 | Modo autonomo substitui Playwright por smoke tests quando budget aperta | Validacao/Autonomo | tuninho-qa v0.2.0 detecta |
| 53 | Tarefa concluida com diferimento e contradicao silenciosa | Cobertura/Processo | tuninho-qa v0.2.0 detecta |
| 54 | Documentacao de MCP tools pode mentir sem ser detectada por checks de artefato | Documentacao/Funcional | tuninho-qa audit-mcp-tools obrigatorio |
| 55 | Migration name pode mentir sobre o que faz | Funcional/Backend | tuninho-qa audit-migrations planejado |
| 56 | Memoria local do Claude PROIBIDA como destino de aprendizado operacional (Principio 11) | Memoria/Knowledge | tuninho-qa Principio 11 rigido |
| 57 | Skill competente NUNCA bypassada — nem pelo proprio QA, nem por economia de tokens (PETREA) | Metodo/SkillBypass | tuninho-qa Principio 12 + Regra #16 |

### #7 — Etapa 11 (Playwright) nunca pode ser pulada

- **Descoberta em:** Operacao 13 (importacao_md_fixes), 2026-03-22
- **Contexto:** Implementei 4 fases sequencialmente e fui direto para validacao humana (Etapa 12) sem rodar validacao Playwright (Etapa 11)
- **Problema:** Operador detectou a omissao e exigiu correcao. Sem Playwright: sem evidencias automaticas, sem deteccao precoce de bugs, sem documentacao para o artefato de resultados
- **Solucao:** Apos concluir Etapa 10, SEMPRE executar Etapa 11 antes de Etapa 12. Quando fases sao implementadas na mesma sessao, a validacao Playwright pode ser consolidada mas NUNCA omitida.

### #8 — Controle de tempo obrigatorio por fase

- **Descoberta em:** Operacao 13 (importacao_md_fixes), 2026-03-22
- **Contexto:** Operador solicitou que cada fase e a operacao completa tenham periodo registrado (inicio, fim, duracao)
- **Problema:** Sem controle de tempo, nao ha visibilidade sobre eficiencia e estimativas futuras
- **Solucao:** Registrar timestamp de inicio/fim de cada fase na Etapa 9/13. Manter tabela de tempo no README da operacao. Regra #12 adicionada.

### #9 — Documentacao completa por fase (5 arquivos)

- **Descoberta em:** Operacao 13 (importacao_md_fixes), 2026-03-22
- **Contexto:** Operador identificou que checklists, checkpoints e aprendizados ficavam com templates nao preenchidos. Faltava review.md por fase.
- **Problema:** Fases concluidas sem documentacao adequada perdem contexto e evidencias
- **Solucao:** Etapa 13 agora verifica 5 arquivos obrigatorios: checklist.md, checkpoints.md, aprendizados.md, review.md (novo) e aprendizados_operacao.md. Control na transicao valida todos. Regra #13 adicionada.

### #10 — Changelog do projeto deve ser verificado e atualizado

- **Descoberta em:** Operacao 13 (importacao_md_fixes), 2026-03-22
- **Contexto:** Ao final de operacoes, o changelog do projeto deve ser verificado e atualizado para que as alteracoes fiquem visiveis para stakeholders.
- **Problema:** Sem atualizar o changelog, as alteracoes nao ficam visiveis ou rastreáveis
- **Solucao:** Etapa 15 verifica sidecar do projeto (`projects/{nome}/config.md`) para paths de changelog/version file. Se nao existir sidecar, faz varredura automatica e configura na primeira vez. Regra #14.

> **Nota:** Detalhes especificos de cada projeto (ex: paths exatos) ficam no
> modulo sidecar correspondente em `projects/{nome_projeto}/config.md`.

### #11 — Captura de tokens deve ser aplicada na propria operacao que a implementa

- **Descoberta em:** Operacao 14 (ddce_updates), 2026-03-22
- **Contexto:** Implementamos captura de tokens por fase na skill, mas nao aplicamos durante a propria operacao. Resultado: apenas 2 pontos de captura (inicio Fase 1 e fim geral) quando deveriamos ter ~8
- **Problema:** Sem captura granular, o `_3_RESULTS_` ficou com estimativa agrupada em vez de deltas reais por fase
- **Solucao:** Ao implementar mecanismos de monitoramento na skill, aplicar imediatamente na operacao em curso. O metodo DDCE deve ser seguido mesmo quando esta sendo modificado.

### #12 — Adaptacao de funcionalidade existente como abordagem padrao

- **Descoberta em:** Analise retrospectiva + feedback do operador, 2026-03-23
- **Contexto:** Demanda para "congelar quadro" poderia ter criado sistema novo de bloqueio. Descobriu-se que o sistema de permissoes "somente leitura" ja existia — bastou criar override que forca view-only.
- **Problema:** Sem busca sistematica por funcionalidades adaptaveis, a tendencia e criar codigo novo — mais complexidade, logica duplicada, mais bugs.
- **Solucao:** DISCOVER busca candidatos a adaptacao (Etapa 2 eixo b). Entrevista pergunta sobre funcionalidades similares (Etapa 3). Ciclo 2 valida viabilidade (Etapa 4). Discovery documenta comparacao (Etapa 5). Plano tipifica ADAPTACAO/NOVO (Etapa 6). Control valida preservacao de funcionalidade original. Regra #15 proibe codigo novo sem justificativa.

### #13 — Modo autonomo NAO justifica pular etapas do DDCE

- **Descoberta em:** Operacao 08 (sonnet_resumo_playground), 2026-03-23
- **Contexto:** Operacao executada em modo 100% autonomo (sem interacao humana). As Etapas 11-16 foram puladas ou feitas superficialmente, resultando em: zero evidencias Playwright, zero aprendizados por fase, zero review por fase, zero retroalimentacao, zero control de transicao.
- **Problema:** Um bug critico (model ID errado — plataforma 100% quebrada) passou despercebido. Sem Playwright, sem evidencias, a operacao foi declarada "100% completa" com a plataforma inoperante. Somente uma auditoria posterior detectou o problema.
- **Solucao:** Modo autonomo significa que o AGENTE responde as entrevistas — NAO que etapas sao eliminadas. Todas as 16 etapas DDCE sao obrigatorias independente do modo de operacao. O Control deve BARRAR transicao de fase se evidencias e documentacao estiverem ausentes.

### #14 — Model ID de APIs externas deve ser validado com chamada real

- **Descoberta em:** Operacao 08 (sonnet_resumo_playground), 2026-03-23
- **Contexto:** O model ID `claude-sonnet-4-6-20250514` foi usado mas NAO existe na API Anthropic. O correto era `claude-4-sonnet-20250514`.
- **Problema:** Build do Next.js passa sem erros (verificacao de tipo nao valida strings de model ID). Sem teste funcional, o bug so aparece em runtime com erro 404.
- **Solucao:** Ao integrar com APIs externas, SEMPRE fazer uma chamada de teste minima (ex: max_tokens=20, mensagem simples) para validar credenciais e model ID antes de prosseguir com a implementacao. Incluir este teste como primeiro passo da validacao Playwright (Etapa 11).

### #15 — Estimativa de custo obrigatoria por operacao

- **Descoberta em:** Operacao 01 (cronograma_e_ajustes_fluxos), 2026-03-24
- **Contexto:** Operador solicitou estimativa de custo por fase e total da operacao para ter visibilidade financeira
- **Problema:** Sem estimativa de custo, operador nao consegue avaliar ROI de cada operacao nem prever custos futuros
- **Solucao:** Junto com tokens e tempo, calcular e registrar custo estimado em USD e BRL por fase. Usar pricing do modelo (Opus: input $15/M, cache read $1.50/M, cache creation $18.75/M, output $75/M). Incluir breakdown por tipo de token. Registrar modelo utilizado e operador (login GitHub) no README e _3_RESULTS. Formula: custo_fase = (input * $15 + cache_read * $1.50 + cache_creation * $18.75 + output * $75) / 1M

### #16 — Operador e modelo devem constar em toda operacao

- **Descoberta em:** Operacao 01 (cronograma_e_ajustes_fluxos), 2026-03-24
- **Contexto:** Operador pediu para registrar quem operou e qual modelo foi usado
- **Problema:** Sem identificacao de operador e modelo, nao ha rastreabilidade de quem executou e com qual recurso
- **Solucao:** Registrar no README da operacao e no _3_RESULTS: (1) Operador = login GitHub do usuario que esta operando o projeto, (2) Modelo = ID do modelo Claude utilizado (ex: claude-opus-4-6). Perguntar ao operador seu login na primeira operacao do projeto ou inferir de git config.

### #17 — Manter Playwright e dev server abertos para validacao humana

- **Descoberta em:** Operacao 01 (cronograma_e_ajustes_fluxos), 2026-03-24
- **Contexto:** Ao solicitar validacao humana (Etapa 12), o agente parava o servidor e instruia o operador a iniciar manualmente
- **Problema:** Operador precisa validar visualmente no browser. Parar o servidor e pedir para o operador startar manualmente adiciona friccao desnecessaria e quebra o fluxo de validacao
- **Solucao:** Na Etapa 12 (Validacao Humana), MANTER o dev server rodando e o Playwright aberto na pagina relevante. Nao parar o servidor ate o operador confirmar aprovacao. Apresentar ao operador que o browser esta aberto para conferencia direta. So parar o servidor apos aprovacao expressa.

### #18 — DDCE nao sugere commit, sugere escriba — e so apos todos os ajustes

- **Descoberta em:** Operacao 01 (cronograma_e_ajustes_fluxos), 2026-03-24
- **Contexto:** Apos validacao final, o agente sugeriu "quer que eu faca o commit?" ao inves de invocar escriba. Alem disso, o operador trouxe 3 rodadas extras de ajustes apos a "finalizacao" — esses ajustes nao foram incorporados na documentacao DDCE antes de encerrar
- **Problema:** (1) Commit nao e responsabilidade do DDCE — o operador decide quando e como commitar. (2) Sugerir commit prematuramente quebra o fluxo, pois o operador pode ter mais ajustes. (3) Ajustes pos-validacao nao foram documentados nos artefatos DDCE. (4) Escriba nao foi invocado para documentacao geral do projeto
- **Solucao:** (1) NUNCA sugerir commit no DDCE. (2) Apos validacao do operador, perguntar: "Tem mais algum ajuste ou observacao?" (3) Se sim: executar ajustes, re-documentar nos artefatos DDCE (_3_RESULTS, README), e perguntar novamente. (4) Somente quando o operador confirmar que NAO tem mais nada: sugerir rodar tuninho-escriba para documentacao geral. (5) Encerrar DDCE apos escriba. Commit fica por conta do operador.

### #19 — Perguntas da entrevista DDCE devem ter numeracao e divisor visual

- **Descoberta em:** Operacao 15 (new_demand), 2026-03-25
- **Contexto:** Operador solicitou que perguntas tenham formato "Pergunta N/total" e um divisor visual (---) separando do conteudo textual anterior
- **Problema:** Sem numeracao, operador nao sabe quantas perguntas faltam. Sem divisor, a pergunta se mistura com o texto acima
- **Solucao:** Nas Etapas 3 e 4 (entrevistas), cada pergunta deve: (1) ser precedida por uma linha `---` como divisor visual, (2) ter formato `**Pergunta N/total:**` antes do texto da pergunta. Exemplo: `---\n\n**Pergunta 2/5:** texto da pergunta`

### #20 — Socket.io obrigatorio para API calls autenticadas no frontend

- **Descoberta em:** Operacao 15 (new_demand), 2026-03-25
- **Contexto:** FormBuilderStep usava `fetch()` HTTP para chamar a API. O botao "Create Form" nao fazia nada (falha silenciosa)
- **Problema:** `fetch()` HTTP nao inclui o JWT token de autenticacao. No PLANKA, todas as chamadas autenticadas passam por Socket.io com header `Authorization: Bearer ${accessToken}`
- **Solucao:** NUNCA usar `fetch()` para chamadas autenticadas. Sempre usar o modulo `api/socket.js`. Ao chamar de componentes React (fora de sagas), obter `accessToken` via `useSelector(selectors.selectAccessToken)` e passar como header

### #21 — Position obrigatoria ao criar card via helper

- **Descoberta em:** Operacao 15 (new_demand), 2026-03-25
- **Contexto:** Controller de submit do form chamava `cards.createOne` sem `position`. Submissao falhava com erro silencioso
- **Problema:** O helper `cards/createOne` exige `position` para listas "finite" (ACTIVE, CLOSED). Sem position, lanca `positionMustBeInValues`
- **Solucao:** Antes de criar card, calcular posicao: `const maxPosition = existingCards.reduce((max, c) => (c.position > max ? c.position : max), 0); position: maxPosition + 65536`

---

## Como Adicionar Nova Licao

Ao final de cada operacao (Etapa 16), seguir este formato:

```markdown
### #22 — Checkpoint de saúde de sessão a cada 20% de tokens

- **Descoberta em:** Operação 01 (EsportePelaVidaSaudavelAdmin) — 2026-03-27
- **Contexto:** Operação de auditoria longa (~355k tokens, ~1h44min) com risco de perda de contexto
- **Problema:** Sem checkpoints periódicos, o operador não tem visibilidade sobre risco de compressão ou necessidade de handoff
- **Solução:** A cada 20% do limite de tokens (150k, 300k, 450k, 600k em sessão de 750k), avaliar automaticamente: tokens consumidos vs restantes, risco de compressão, custo de handoff, e apresentar 3 cenários ao operador (continuar / handoff agora / handoff no próximo ponto natural)

### #23 — Operações de auditoria/mapeamento via Playwright

- **Descoberta em:** Operação 01 (EsportePelaVidaSaudavelAdmin) — 2026-03-27
- **Contexto:** Primeira operação DDCE para auditoria de sistema externo (não desenvolvimento de código)
- **Problema:** O DDCE assume desenvolvimento/código, mas auditoria é navegação+coleta. Riscos específicos: traces de login, analytics, formulários perigosos
- **Solução:** Para operações de auditoria: (1) mapear riscos de rastreamento ANTES do login, (2) documentar cookie na íntegra, (3) navegar em blocos para eficiência, (4) sessão única para evitar re-login, (5) regras de somente leitura revalidadas a cada ação

### #{N} — {Titulo descritivo}

- **Descoberta em:** Operacao {NN} ({nome}), {data}
- **Contexto:** {Situacao em que ocorreu}
- **Problema:** {O que deu errado ou poderia dar}
- **Solucao:** {O que foi feito para resolver/prevenir}
```

### #25 — Schema completo upfront para projetos greenfield

- **Descoberta em:** Operação 02 BatutaManager (2026-03-27)
- **Contexto:** Projeto do zero com 30+ models. Opção era criar schema incrementalmente (por fase) ou tudo de uma vez.
- **Problema:** Migrations incrementais por fase geram 10+ arquivos de migration e risco de conflitos. Seeds precisam ser reescritos a cada migration.
- **Solução:** Definir TODAS as entidades no schema desde a Fase 1. Uma migration "init", um seed completo. Agents de CRUD posteriores já encontram todas as tabelas prontas. Trade-off aceito: schema grande upfront, mas zero retrabalho de migration/seed.

### #26 — Prisma 7 incompatível com seed simples em SQLite

- **Descoberta em:** Operação 02 BatutaManager (2026-03-27)
- **Contexto:** Prisma 7 mudou para adapter-based client, removeu `datasource url` do schema, e exige `PrismaClientOptions` no constructor.
- **Problema:** `new PrismaClient()` sem options falha. Seeds com `tsx` não conseguem resolver o import path do generated client. Incompatível com workflow simples de SQLite dev.
- **Solução:** Downgrade para Prisma 6 que mantém o padrão clássico (`prisma-client-js`, `url = env("DATABASE_URL")`). Para projetos com SQLite em dev, Prisma 6 é mais prático até que Prisma 7 estabilize o workflow.

### #27 — Checkpoint de pausa deve incluir análise de cenários com tokens reais

- **Descoberta em:** Operação 04 BatutaManager (2026-03-28)
- **Contexto:** Ao sugerir handoff após Fase 3/8, a sugestão veio sem dados concretos de tokens consumidos vs janela disponível. O operador pediu análise fundamentada antes de decidir.
- **Problema:** A Lição #22 define checkpoints a cada 20% de tokens, mas o formato era apenas "apresentar 3 cenários". Sem dados concretos (tokens atuais, estimativa por fase restante, % da janela), o operador não tem base para decidir. Sugerir pausa prematuramente desperdiça contexto valioso e força re-exploração cara na próxima sessão.
- **Solução:** Todo checkpoint de pausa DEVE incluir:
  1. **Dados reais**: tokens consumidos (via JSONL), % da janela usada, timestamp
  2. **Estimativa por fase restante**: baseada na complexidade (código mecânico ~40-60k, QA Playwright ~100-150k)
  3. **3 cenários com prós/contras reais**:
     - (A) Continuar tudo: risco de compressão? qual % projetado?
     - (B) Handoff agora: custo de re-exploração (~50-80k), risco de inconsistência de padrão
     - (C) Ponto natural de corte: onde dividir para minimizar perda de contexto (ex: código vs QA)
  4. **Recomendação fundamentada** com a razão principal
  Nunca sugerir pausa sem esses dados. A decisão é do operador, mas os dados são responsabilidade do DDCE.

### #28 — Modo autônomo deve tratar documentação de fases como gate obrigatório

- **Descoberta em:** Operação 05 maestrofieldmanager (rebrand_maestro), 2026-03-29
- **Contexto:** Operação DDCE 05 executada em modo AUTÔNOMO. Código 100% funcional e validado (Playwright + build). Porém a documentação estruturada das fases (plano.md, checklist.md, checkpoints.md, aprendizados.md, review.md) e evidências NÃO foram geradas — 18+ arquivos faltantes.
- **Problema:** O modo autônomo prioriza execução e avança para a próxima tarefa assim que o código passa na validação. A documentação de fases não é bloqueante para o avanço, então foi pulada. Resultado: operação "concluída" mas sem rastreabilidade documental, exigindo sessão extra dedicada apenas para retroalimentação.
- **Solução:** O DDCE deve tratar a documentação de fases como gate obrigatório na transição entre fases. Uma fase só é CONCLUÍDA quando: (1) código implementado + build OK, (2) validação Playwright OK, (3) 5 arquivos de documentação gerados (plano.md, checklist.md, checkpoints.md, aprendizados.md, review.md), (4) evidências coletadas na pasta evidencias/. Reforça Lição #13 (modo autônomo ≠ pular etapas) com foco específico em documentação.

### #29 — Ações pós-DDCE devem ser previstas ou registradas formalmente

- **Descoberta em:** Operação 05 maestrofieldmanager (rebrand_maestro), 2026-03-29
- **Contexto:** Após o DDCE formal (3 fases), foram executadas ações adicionais: rename do repo GitHub, vault merge (legado + maestro), fix delivery-cards skill, evolução do escriba. Essas ações representaram ~60% do trabalho total (~153k tokens dos ~251k).
- **Problema:** O DDCE encerra formalmente após Etapa 16, mas o trabalho continua. Essas ações extras não têm documentação estruturada, ficando apenas no HANDOFF.yaml e no escriba.
- **Solução:** (1) Se ações pós-DDCE forem previsíveis, incluí-las como fase adicional no plano. (2) Se surgirem durante a execução, registrar no HANDOFF.yaml como seção "acoes_pos_ddce" com status e detalhes. (3) A sessão de retroalimentação (Etapa 16) deve cobrir tanto as fases formais quanto as ações pós-DDCE.

### #30 — Evidencia visual Playwright obrigatoria mesmo em modo autonomo

- **Descoberta em:** Operacao 05 maestrofieldmanager (rebrand_maestro), 2026-03-29
- **Contexto:** Modo autonomo executou codigo corretamente e declarou validacao Playwright "OK", mas NAO capturou evidencias visuais (screenshots, snapshots). A Etapa 11 foi considerada concluida baseada apenas em build success e verificacoes de texto via seletores, sem artefatos visuais comprobatorios.
- **Problema:** Sem evidencia visual, nao ha como provar que a UI renderizou corretamente. Build passing nao garante que componentes visuais estao corretos (CSS, layout, hierarquia visual, dados exibidos). Rebrand visual (Maestro + field manager com hierarquia de tamanho/cor) so pode ser verificado visualmente. Reforca Licoes #2, #7, #13, #28 com foco especifico em ARTEFATO DE EVIDENCIA.
- **Solucao:** Na Etapa 11, a validacao Playwright DEVE produzir artefatos visuais MESMO em modo autonomo: (1) `browser_snapshot` para cada tela validada, (2) screenshots via `browser_run_code` com `await page.screenshot({ path: 'evidencias/fase_NN_tela_descritiva.png', fullPage: true })` (per Licao #2 — NUNCA `browser_take_screenshot`), (3) os arquivos de evidencia devem ser salvos na pasta `evidencias/` da fase correspondente, (4) o artefato _3_RESULTS deve referenciar cada evidencia com descricao. **Sem evidencia visual = Etapa 11 NAO CONCLUIDA.** Esta regra e inviolavel e se aplica igualmente aos modos autonomo e interativo.

### #31 — Screenshots devem ser LIDOS e INTERPRETADOS, não apenas capturados

- **Descoberta em:** Operação 06 maestrofieldmanager (logineasy_mobile_analytics), 2026-03-30
- **Contexto:** Fase 2 (Mobile Responsivo) — primeira rodada de validação capturou 6 screenshots e declarou "PASS". Operador pediu revisão criteriosa. Segunda rodada com 30+ screenshots revelou 9 tabelas com colunas cortadas e 12 reports com overflow-hidden.
- **Problema:** Capturar screenshot sem LER e INTERPRETAR o conteúdo visual é inútil. A Lição #30 exige captura de evidência, mas não exige análise do conteúdo. O agente capturou e "passou" sem verificar se todas as informações estavam visíveis.
- **Solução:** Na Etapa 11, após capturar cada screenshot, o agente DEVE usar Read tool para abrir a imagem e interpretar visualmente: (1) todas as informações estão visíveis? (2) há texto cortado ou sobreposto? (3) layout está adequado ao viewport? (4) ações/botões estão acessíveis? Só declarar PASS após interpretação positiva de CADA screenshot. Reforça #30 com foco em INTERPRETAÇÃO, não apenas captura.

### #32 — page.goto() vs SPA navigation geram sessões diferentes

- **Descoberta em:** Operação 06 maestrofieldmanager (logineasy_mobile_analytics), 2026-03-30
- **Contexto:** Testando analytics com Playwright. `page.goto()` (full reload) cria nova sessão analytics a cada navegação. `page.click('a[href=...]')` (SPA) mantém a mesma sessão com múltiplos pageviews.
- **Problema:** Testes com `page.goto()` mostraram sessões com 0-1 pageviews, enquanto em uso real (SPA) seria 5-10+ pageviews por sessão. Métricas pareciam incorretas quando na verdade o método de teste estava errado.
- **Solução:** Para validar features que dependem de estado client-side (analytics, sessões, hooks React): usar navegação SPA (click em links) para simular uso real. Reservar `page.goto()` apenas para primeira página ou reset de estado.

### #33 — Sidebar filtrada por role deve espelhar middleware

- **Descoberta em:** Operação 06 maestrofieldmanager (logineasy_mobile_analytics), 2026-03-30
- **Contexto:** Role "school" tinha acesso restrito a 6 páginas (enforced pelo middleware), mas a sidebar exibia TODOS os ~40 itens de menu. Usuário via links para páginas inacessíveis.
- **Problema:** Grave problema de UX — usuário clica em link visível, é redirecionado para dashboard sem explicação. Confuso e frustrante.
- **Solução:** Filtro de sidebar por role implementado (~25 linhas) sincronizado com as mesmas paths do middleware. A prop `userRole` é passada do layout para o Sidebar. Regra: sempre que middleware restringe acesso, sidebar DEVE esconder os itens correspondentes.

### #34 — Race condition em hooks async — usar queue de pendentes

- **Descoberta em:** Operação 06 maestrofieldmanager (logineasy_mobile_analytics), 2026-03-30
- **Contexto:** Hook useAnalytics inicializa sessão via fetch async. O useEffect de pageview dispara no mount, antes da sessão ser criada. Primeiro pageview perdido.
- **Problema:** `sessionIdRef.current` é null quando o primeiro pathname change dispara. O fetch de pageview falha silenciosamente (400 — no sessionId).
- **Solução:** Implementar queue (`pendingQueue`) de chamadas pendentes. Quando sessão não está pronta, enfileirar a função. Quando sessão fica pronta (`sessionReadyRef = true`), esvaziar a queue executando tudo. Padrão genérico aplicável a qualquer hook que depende de inicialização async.

### #35 — Dashboard deve exibir nomes humanos, nunca IDs técnicos

- **Descoberta em:** Operação 06 maestrofieldmanager (logineasy_mobile_analytics), 2026-03-30
- **Contexto:** Dashboard de analytics exibia userId (cuid como "cmnbvc6a...") na lista de sessões. Inútil para o operador identificar quem navegou.
- **Problema:** IDs técnicos não comunicam nada a não-desenvolvedores. O operador precisa ver "Administrador" ou "Carlos Mendes", não um hash.
- **Solução:** API de dados deve resolver IDs para nomes humanos antes de retornar ao frontend. No caso: JOIN com tabela User para obter name/email/role. Regra geral: toda UI administrativa deve exibir nomes humanos. IDs técnicos são para logs de debug, não para dashboards.

### #36 — tmux mouse mode: ON para nativos, Shift+drag para web terminals

- **Descoberta em:** Operacao 06 (deploy hostinger, tuninho-ide-web) — 2026-03-30
- **Contexto:** Terminal xterm.js conectado a sessao tmux via node-pty em web IDE deployada no Hostinger.
- **Problema:** tmux mouse ON impede selecao de texto no browser (tmux captura eventos). tmux mouse OFF quebra scroll em alternate screen (claude CLI). Nenhuma opcao funciona isoladamente.
- **Solucao:** Manter tmux mouse ON (scroll funciona). Selecao de texto via Shift+arraste — comportamento padrao em todos os terminais com mouse support. Para terminais nativos (iTerm, Terminal.app): mouse ON normal. Para web terminals (xterm.js): mouse ON + Shift+drag.
- **NOTA:** Revisa e substitui a antiga licao #24 (que recomendava mouse on sem qualificacao).

### #37 — Validacao humana detecta bugs que Playwright nao pega

- **Descoberta em:** Operacao 05 (sessoes_auth, tuninho-ide-web) — 2026-03-28
- **Contexto:** DDCE pulou validacao humana e foi direto para encerramento.
- **Problema:** 3 bugs so foram detectados pelo operador: (1) layout quebrado na altura por falta de flex no #app-container, (2) admin panel nao criava usuarios por campo password bloqueado pelo browser, (3) scroll do terminal acionava historico. Playwright nao detectou nenhum deles.
- **Solucao:** NUNCA pular Etapa 12 (validacao humana). Manter server + Playwright abertos e fornecer passo-a-passo detalhado para o operador testar. Bugs visuais e de UX so sao pegos por humano.

### #38 — Validacao por curl NAO substitui validacao Playwright UI

- **Descoberta em:** Operacao 10 (Sprint #01 Chooz 2026) — 2026-03-30
- **Contexto:** Fase 1 (Auth) foi validada inicialmente apenas via curl (HTTP status codes, JSON responses). O operador exigiu que validacao fosse refeita via Playwright com screenshots interpretados.
- **Problema:** curl testa APIs mas nao detecta bugs visuais — texto cortado, layout quebrado, botoes inacessiveis, z-index conflicts, animacoes quebradas. Nesta operacao, Playwright detectou 3 bugs que curl jamais pegaria: (1) UserMenu bottom sheet interceptando cliques apos fechar (Fragment vs div), (2) campo nome em /conta nao populando (useState timing), (3) botao excluir atras do avatar (z-index overlap).
- **Solucao:** Promovida a Regra #19 e bloco REGRA DE OURO na Etapa 11. curl so e aceito como COMPLEMENTO para APIs sem UI. TODA validacao de fase DEVE usar Playwright. Esta licao reforca #7, #30, #31 e fecha o ciclo: capturar (#30) + interpretar (#31) + NUNCA substituir por curl (#38).

### #39 — RapidAPI response parsing: fetch vs axios wrapper

- **Descoberta em:** Operacao 10 (Sprint #01 Chooz 2026, Fase 3) — 2026-03-30
- **Contexto:** Pipeline de scrap Instagram migrado de Express (axios) para Next.js API routes (fetch). Ao portar o codigo, os campos de resposta nao foram encontrados — API retornava "perfil nao encontrado" para perfis que existiam.
- **Problema:** O projeto original usava axios, que wrappeia a resposta em `{ data: ... }`. O codigo portado esperava `data.data` mas com fetch nativo o JSON ja e o root. Resultado: `data.data` retornava `undefined`, pipeline falhava silenciosamente.
- **Solucao:** Ao migrar de axios para fetch, SEMPRE verificar a estrutura de resposta. Usar fallback duplo: `data?.posts || data?.data?.posts` para compatibilidade. Testar com chamada real (nao mock) antes de declarar migracao concluida. Aplicavel a TODA migracao de HTTP client.

### #40 — Sessao unica Opus 1M permite operacao DDCE completa (5 fases + deploy)

- **Descoberta em:** Operacao 10 (Sprint #01 Chooz 2026) — 2026-03-30
- **Contexto:** Sessao inteira com Opus 4.6 (1M context) executou DISCOVER + DEFINE + 5 fases EXECUTION + deploy Hostinger + escriba + git flow em uma unica sessao (~560k tokens, 56% da janela).
- **Problema:** O hook token-monitor estava calibrado para 200k (Sonnet), sugerindo handoff prematuramente. O DDCE tambem sugeria handoff baseado em intuicao, nao em dados reais.
- **Solucao:** (1) Token monitor atualizado para detectar modelo (Opus 1M vs Sonnet 200k). (2) Checkpoints de saude a cada 20% com analise de cenarios (Licao #22/#27 implementadas no hook). (3) Com Opus 1M, operacoes de ate ~600k tokens (60%) sao viaveis em sessao unica — handoff so apos analise fundamentada. (4) Cache read alto (~96%) indica boa eficiencia — contexto reutilizado, nao desperdicado.

### #41 — Deploy Hostinger: sshpass com PreferredAuthentications=password

- **Descoberta em:** Operacao 10 (Sprint #01 Chooz 2026, Fase 5) — 2026-03-30
- **Contexto:** Chave SSH ed25519 criptografada com passphrase. sshpass com a chave falhava. ssh-add requer interacao manual (passphrase).
- **Problema:** Em ambiente nao-interativo (Claude Code), nao e possivel digitar passphrase para ssh-add. sshpass tenta a chave primeiro e falha antes de tentar password.
- **Solucao:** Forcar `PreferredAuthentications=password` no SSH: `sshpass -p 'SENHA' ssh -T -o PreferredAuthentications=password root@IP "comando"`. Isso ignora a chave e usa direto a senha root. Funciona em todos os contextos nao-interativos. Registrar no sidecar do projeto para futuros deploys.

### #42 — Web research obrigatoria na Discovery evita viés interno

- **Descoberta em:** Operacao 10 (Isolamento Workspaces, Etapa 5) — 2026-04-03
- **Contexto:** IDE Tuninho Web com workspaces dentro do diretório da IDE. Claude Code herdava CLAUDE.md da IDE ao trabalhar em projetos filhos. Suspeita inicial era problema de git ou CWD.
- **Problema:** Sem pesquisa web, a equipe teria investido tempo tentando soluções internas (workarounds no CLAUDE.md, .claudeignore hipotético, etc.) que não existem. A web research encontrou Issue #26944 do claude-code confirmando que o problema é conhecido, sem solução nativa, e que mover workspaces para fora da árvore é a única abordagem viável.
- **Solucao:** Web research obrigatória na Discovery (mínimo 6 pesquisas: 2 na Etapa 2, 4 na Etapa 5). Cobrir: problema no ecossistema externo, melhores práticas, alternativas técnicas, riscos documentados. Fontes com URLs. Integrada como Regra #21 e Lição #42.

### #43 — Discovery XP: contexto completo para handoff entre sessões

- **Descoberta em:** Operacao 10 (Isolamento Workspaces, Etapa 5) — 2026-04-03
- **Contexto:** Operações anteriores perdiam contexto entre sessões. O Define começava sem conhecer explorações descartadas, lógica de decisões, ou incertezas levantadas na Discovery.
- **Problema:** O artefato _1_DISCOVERY_ sintetiza os achados mas descarta o "como chegamos aqui" — explorações verbatim, opções descartadas com motivos, suspeitas investigadas, lógica de decisão, prompts e respostas da entrevista na íntegra. Informação descartada na síntese pode ser relevante para o Define tomar decisões de borda.
- **Solucao:** Novo artefato obrigatório _1-xp_DISCOVERY_ (versão expandida) com TODO o contexto da sessão em 10 partes: contexto inicial, explorações verbatim, entrevistas verbatim, opções descartadas, web research, incertezas, paisagem técnica completa. Princípio: transbordo > escassez. Integrada como Regra #20 e Lição #43.

### #44 — Deploy para produção SEMPRE via tuninho-devops

- **Descoberta em:** Operacao 10 (Isolamento Workspaces, Fase 5) — 2026-04-03
- **Contexto:** Deploy da Op 10 envolvia rsync + PM2 restart + migração de diretórios. Operador levantou preocupação sobre impacto em outros serviços (maestro, chooz, orquestra) e sobre perder acesso à IDE durante deploy (IDE deployando a si mesma).
- **Problema:** Deploys manuais (rsync direto, PM2 restart manual) não têm: backup automático, gates de confirmação, cross-project health checks, documentação, nem atualização do env catalog. Risco de impacto silencioso em outros serviços, falta de rollback, e divergência entre código e documentação.
- **Solucao:** Todo deploy para produção DEVE ser executado via tuninho-devops-hostinger-alfa (ou skill equivalente). A skill garante backup, gates, health checks, documentação e env catalog. NUNCA fazer deploy manual sem a skill. Integrada como Regra #24 e Lição #44.

### #45 — Firebase localhost nao autorizado por padrao (projetos pos-abril 2025)

- **Descoberta em:** Operacao 11 (Firebase Auth, Fase 3) — 2026-04-03
- **Contexto:** Login via Firebase signInWithEmailAndPassword retornava erro 400 no Playwright durante validacao local.
- **Problema:** Projetos Firebase criados apos abril 2025 NAO incluem localhost nos dominios autorizados. O Firebase rejeita chamadas de autenticacao de dominios nao autorizados com status 400 sem mensagem clara.
- **Solucao:** Sempre adicionar localhost manualmente no Firebase Console > Authentication > Settings > Authorized domains ANTES de testar localmente. Documentar na Discovery de qualquer operacao Firebase.

### #46 — Service Account Key vs Web API Key — esclarecer na Discovery

- **Descoberta em:** Operacao 11 (Firebase Auth, Fase 1) — 2026-04-03
- **Contexto:** Operador confundiu Web API Key (AIzaSy..., client-side) com Service Account Key (JSON com private key, server-side).
- **Problema:** Sao credenciais diferentes para propositos diferentes. Web API Key e publica (frontend). Service Account Key e secreta (backend). Sem a Service Account, o firebase-admin nao funciona.
- **Solucao:** Na Discovery, sempre perguntar sobre AMBAS as credenciais separadamente e explicar a diferenca. Verificar que o operador gerou a Service Account Key (Firebase Console > Project Settings > Service Accounts > Generate New Private Key).

### #47 — Tuninhos devops devem ser consultados ANTES das entrevistas no Discovery

- **Descoberta em:** Operacao 01 weplus_prototipo (migracao Vercel → Hostinger) — 2026-04-07
- **Contexto:** Na Etapa 3 (entrevista), o DDCE perguntou ao operador onde colocar os arquivos e como configurar Nginx. Essas informacoes ja estavam definidas nos sidecars do tuninho-devops-hostinger-alfa (padrao `/opt/hostinger-alfa/{projeto}/`, template Nginx para static sites) e no server-inventory.json do tuninho-devops-env (portas alocadas, projetos vizinhos).
- **Problema:** Perguntas desnecessarias ao operador, que corretamente apontou que "os tuninhos devops devem ser sempre quem administra e centraliza isso". O Discovery gastou tokens e tempo com perguntas cujas respostas os tuninhos ja tinham.
- **Solucao:** Regra #25 + Eixo (g) na Etapa 2: OBRIGATORIO ler sidecars e referencias dos tuninhos devops ANTES das entrevistas. Decisoes de infra que os tuninhos ja definem (paths, portas, Nginx, SSL, deploy mode) nao devem ser re-perguntadas — usar o padrao estabelecido e apenas confirmar na entrevista. Os tuninhos sao a fonte de verdade para infraestrutura.

### #48 — Agent SDK V2 unstable ignora includePartialMessages — usar V1 query() para streaming

- **Descoberta em:** Operacao 21 claudecode_back_v2 (a4tunados_mural) — 2026-04-12
- **Contexto:** O session-manager passava `includePartialMessages: true` ao `unstable_v2_createSession`, mas a opcao NAO existe no tipo `SDKSessionOptions` do V2. O V2 aceita silenciosamente a opcao e ignora — nenhum `stream_event` e emitido. As mensagens chegam completas (`assistant` + `result`), sem deltas incrementais.
- **Problema:** O front-end tinha toda a infraestrutura pronta para text-delta (handler no hook, streaming indicator, etc) mas nunca recebia os eventos. Descoberto apenas lendo o sdk.d.ts e confirmando via web research.
- **Solucao:** Migrar para V1 `query()` com `includePartialMessages: true` e `resume: sessionId` para multi-turn. O V1 emite `stream_event` com `content_block_start/delta/stop` — os MESMOS eventos que o stream-adapter ja parseava. Migracao foi ~50 linhas no session-manager. Tambem ganhou: `interrupt()` (stop button), `getSessionMessages()` (historico), `canUseTool` (tool approval).

### #49 — Workspaces sem git sao edge case real — validar infraestrutura de dados no DISCOVER

- **Descoberta em:** Operacao 21 claudecode_back_v2 (a4tunados_mural) — 2026-04-12
- **Contexto:** Os repo/branch pills no Composer dependem de `getWorkspaceInfo()` que extrai dados de `git remote get-url origin` e `git branch --show-current`. O workspace de teste no Hostinger (`a4tunados_web_claude_code`) NAO era um repo git — era um diretorio avulso. Os pills retornavam null e nao apareciam.
- **Problema:** O DISCOVER nao verificou o estado real dos workspaces no servidor. A validacao E2E so revelou o problema no final.
- **Solucao:** No DISCOVER, ao trabalhar com features que dependem de dados de infraestrutura (git, env vars, configs), verificar o estado REAL dos dados no servidor — nao apenas o codigo que os le. Neste caso, criar um workspace git de teste (`git clone --depth 1`) resolveu imediatamente.

### #50 — Matriz central no vault e essencial para projetos multi-operacao

- **Descoberta em:** Operacao 21 claudecode_back_v2 (a4tunados_mural) — 2026-04-12
- **Contexto:** O ClaudeCodeBack ja estava na 5a operacao (Ops 17-21) e o tracking de funcionalidades era feito apenas no HANDOFF.yaml da operacao anterior. A cada nova operacao, era necessario re-ler todo o HANDOFF para entender o estado de cada feature.
- **Problema:** Sem documento central, o estado acumulado se perde entre operacoes. HANDOFFs sao por operacao, nao por feature.
- **Solucao:** Criar `funcionalidades/claudecode-back-matrix.md` no vault do Escriba com TODAS as funcionalidades, status, prioridade, e rastreabilidade por operacao. Toda operacao futura DEVE consultar e atualizar a matriz. Instrucoes no footer do documento.

### #51 — review.md sistematicamente esquecido (auditoria pos-Op 22)

- **Descoberta em:** Operacao 22 claudecode_back_p2 (a4tunados_mural) — 2026-04-12
- **Contexto:** Operador solicitou ao final da Fase 2 que verificassemos se review.md estava sendo criado consistentemente. Auditoria revelou padrao alarmante:
  - Op 13: 4/4 fases (100%)
  - Op 15: 0/6
  - Op 16: 0/3
  - Op 17: 1/5 (20%)
  - Op 19: 0/7
  - Op 20: 0/5
  - Op 21: 0/5
  - Op 22: 0/2 ate o handoff (criados retroativamente apenas durante a verificacao)
- **Problema causa raiz:**
  1. Template `TEMPLATE_DDCE/fase_NN/` NAO incluia stub de `review.md` nem de `plano.md` — agentes nao tinham referencia visual obvia para criar
  2. Etapa 13 falava de "5 arquivos" mas agentes confundiam `checkpoints.md` (log incremental cronologico) com `review.md` (relatorio final consolidado)
  3. GATE FASE (Etapa 14) tinha checklist "mental" — agentes marcavam "review.md criado?" como OK sem verificar de fato
  4. Tambem `_2-xp_DEFINE_PLAN_` foi pulado em Op 21 e Op 22 apesar da skill exigir desde v3.6.0
- **Solucao (v3.9.0):**
  1. Adicionados stubs `TEMPLATE_DDCE/fase_NN/plano.md` e `TEMPLATE_DDCE/fase_NN/review.md`
  2. Etapa 7 reescrita com lista explicita dos 6 arquivos por fase (referenciando o template)
  3. Etapa 8 reforcada com verificacao bloqueante do `_2-xp_` antes de prosseguir para Etapa 9
  4. Etapa 13 reescrita com distincao explicita entre checkpoints.md (log) e review.md (relatorio)
  5. Etapa 14 reescrita com **script bash de verificacao automatica** (wc/grep) que BLOQUEIA gate se review.md tem placeholders nao preenchidos
  6. Regra #13 atualizada com referencia ao gap historico e ao novo gate bloqueante
- **Impacto:** A partir da Op 23, review.md nao podera mais ser esquecido — o gate bloqueia transicao de fase ate o arquivo existir e estar preenchido.

### #52 — Modo autonomo substitui Playwright por smoke tests quando o budget aperta

- **Descoberta em:** Op 23 (claudecode_back_v3) sessao 02 — primeira execucao da tuninho-qa em modo audit-retroativo
- **Contexto:** Op 23 sessao 01 rodou em modo INTERATIVO DISCOVER+DEFINE + AUTONOMO EXECUTION. As validacoes Playwright das 7 fases foram diferidas para a sessao 02, substituidas por smoke tests via `@modelcontextprotocol/sdk/client/stdio` + DB queries + lint. Resultado: zero screenshots em todas as 7 fases.
- **Problema:** O modo autonomo, quando enfrenta restricao de tokens, **prefere validacoes baratas** (smoke tests funcionais) em vez de Playwright UI. Isso viola a Regra de Ouro #19 (Validacao SEMPRE via Playwright UI). Smoke tests sao OK como **complemento**, NAO como substituto.
- **Detectado por:** A nova skill `tuninho-qa` modo `audit-fase` (sub-check P17 — `evidencias/ tem >= 1 PNG`). Todas as 7 fases retornaram FAIL no smoke test inicial.
- **Solucao:** Reforcar Regra #19 com referencia explicita: "modo autonomo NAO autoriza substituicao de Playwright por smoke tests". A `tuninho-qa` v0.2.0 ja implementa a deteccao via sub-check polimorfico de evidencia (PNG para fases UI, TXT/JSON para backend). Quando a integracao tuninho-ddce v3.10.0 for aplicada, esse check vira BLOQUEANTE no GATE FASE.
- **Acao corretiva da sessao 02:** Tuninho-qa rodou Playwright pela primeira vez (5 de 7 roteiros executados), capturou screenshots em `qa/evidencias/`, interpretou cada via Read tool, e validou que toda a UI da Fase 6 funciona (R1 ClaudeWorkspace multi-repo, R2 ClaudeCodeBack verso, R3 effort slider, R5 DiffOverlay sem botoes, R6 CiStatusBar oculto).

### #53 — "Tarefa concluida com diferimento" e contradicao silenciosa

- **Descoberta em:** Op 23 sessao 02 audit-retroativo Fase 7
- **Contexto:** Op 23 Fase 7 declarou 8 tarefas como `[x]` no checklist.md, mas 3 dessas tarefas foram listadas em `acoes_pos_ddce` no HANDOFF.yaml como "diferidas para sessao 02".
- **Problema:** Marcar tarefa como concluida + listar como pendente em outro lugar e contradicao que escapa de auditoria simples. A fase fica "verdadeiramente parcial" mas declarada "completa".
- **Solucao:** A `tuninho-qa` v0.2.0 implementa sub-check `audit-task-coverage`: para cada tarefa marcada `[x]` em `checklist.md`, verifica que NAO aparece em `HANDOFF.yaml acoes_pos_ddce` como pendente. Se aparece em ambos, GAP critico. Tambem nova regra de processo: se ha `acoes_pos_ddce`, a fase que gerou cada acao deve ser DESMARCADA do checklist.md ate a acao ser executada.

### #54 — Documentacao de MCP tools (e similares) pode mentir sem ser detectada por checks de artefato

- **Descoberta em:** Op 23 sessao 02 audit-mcp-tools (primeira execucao do sub-modo)
- **Contexto:** A matriz `claudecode-back-matrix.md`, o sidecar `claude-sessions-service/config.md`, e o `HANDOFF.yaml` da Op 23 listam **25 MCP tools com nomes especificos** (ex: `list_projects`, `get_project`, `delete_card`). Mas 16 dos 25 nomes nao correspondem a nenhuma tool registrada no `mural-mcp` server real. As tools registradas tem outros nomes (ex: `list_board`, `list_project_boards`, `archive_list`, `switch_workspace`).
- **Problema:** Os checks de artefato da `tuninho-qa` (linhas, secoes, placeholders) PASSARAM porque a documentacao "esta la, e bem formatada, e completa em estrutura". Mas o conteudo nao bate com a realidade. So um check **funcional** (invocar as tools via stdio) revela. Os 25 tools registrados PASSARAM 25/25 quando a spec foi corrigida com os nomes reais — o MCP funciona, so a doc esta errada.
- **Solucao:** A `tuninho-qa` v0.2.0 implementa Principio 8 (Cobertura > Amostragem) com nuance: cobertura SEMPRE nominal (nome a nome), nunca apenas total. O modo `audit-mcp-tools` e obrigatorio quando uma operacao registra MCP tools. E quando uma fase declara "criar N tools/handlers/endpoints", o numero N (e os nomes!) viram parte do `audit-define`.

### #55 — Migration name pode mentir sobre o que faz

- **Descoberta em:** Op 23 sessao 02 captura DB para Fase 1
- **Contexto:** A migration `20260413120000_add_metadata_to_comment_and_action.js` da Op 23 tem nome enganoso: o `up()` so adiciona `metadata jsonb` em `comment`, NAO em `action`. O `actedOnBehalfOf` em actions e gravado em `action.data` (ja existia como jsonb).
- **Problema:** Cross-check via `psql information_schema.columns` revelou que `action.metadata` nao existe. A funcionalidade esta correta (action.data armazena actedOnBehalfOf), mas o nome da migration e a documentacao prometiam algo diferente.
- **Solucao:** Sub-check `audit-migrations` na `tuninho-qa` v0.2.0: para fases que rodam migrations, validar que o `up()` realmente faz o que o nome sugere via `information_schema.columns` cross-check. Documentacao deve ser atualizada para clarificar que comment usa `metadata` mas action usa `data.actedOnBehalfOf`.

### #57 — Skill competente NUNCA e bypassada, nem pelo proprio QA, nem por economia de tokens (PETREA — Principio 12 da tuninho-qa)

- **Descoberta em**: Op 23 sessao 02 — auto-audit recursivo (QA auditando o proprio QA)
- **Contexto**: A propria sessao 02 (que criou e usou a tuninho-qa) cometeu 3 violacoes estruturais. Bypassou `tuninho-escriba` ao escrever vault file via Write tool. Bypassou `tuninho-devops-hostinger-alfa` ao documentar deploy como "PREPARED" sem invocar os 11 stages com 8 gates. Bypassou `tuninho-updater` ao registrar push em `local-changes.json` sem invocar.
- **Justificativa dada**: "preservar budget"
- **Estado real do budget**: 55% usado (448k tokens livres)
- **Problema**: Cada acao operacional do metodo a4tunados tem skill responsavel definida. Bypassar essa skill destroi o metodo. **Token economy NUNCA justifica bypass de skill** — economizar tokens em QA gera os problemas que o QA existe para prevenir. O proprio operador identificou e formalizou: "Um processo de QA que falha com as diretrizes de QA e no minimo duvidavel. Nao ha manipulacao do vault sem envolver o escriba, ele e o REI do vault e nunca deve ser by passado. Idem os devops, env, e etc..."
- **Solucao no nivel da tuninho-ddce**: Para CADA fase de execucao, o protocolo pre-tarefa do Control deve verificar: "Esta tarefa tem skill responsavel definida? Se sim, a skill foi/sera invocada via Skill tool?". Se nao, BLOQUEAR a tarefa ate a skill ser invocada. Isso reforca a Regra #24 (deploy via tuninho-devops) e estende para TODAS as skills competentes.
- **Solucao no nivel da tuninho-qa**: Principio 12 adicionado, sub-check `audit-skill-invocation` no `audit-gate-final` (le o JSONL da sessao para detectar bypasses), Regra Inviolavel #16 (NUNCA bypassar skill competente, nem para economizar tokens), Regra #17 (SEMPRE rodar audit-skill-invocation).
- **Tabela de "skills competentes por dominio"** (ver `tuninho-qa/references/licoes-aprendidas.md` #13)
- **Bumps**: tuninho-qa v0.2.0 → v0.3.0, tuninho-ddce v3.9.1 → v3.9.2

### #56 — Memoria local do Claude e PROIBIDA como destino de aprendizado operacional (Principio 11)

- **Descoberta em:** Op 23 sessao 02 — design da tuninho-qa
- **Contexto:** Antes da tuninho-qa, alguns aprendizados sobre o projeto (padroes PLANKA, deploy notes, recovery procedures) ficavam em `~/.claude/projects/.../memory/MEMORY.md`. Esse arquivo desaparece entre ambientes (laptop A → laptop B → server). Quando o operador trocava de ambiente, perdia conhecimento.
- **Problema:** Memoria local nao propaga via `tuninho-updater`. Resultado: ops-suite fica inconsistente entre instalacoes, conhecimento se perde, e o operador re-aprende as mesmas licoes em ambientes diferentes.
- **Solucao:** Principio 11 da `tuninho-qa` (rigido): "Memoria → Skill, sempre". Todo aprendizado operacional do projeto deve ser incorporado em alguma `tuninho-*` ou skill projetada com bump de versao para propagacao. Memoria local so para conhecimento user-specific (preferencias pessoais, contas, atalhos individuais). O sub-check `licoes-skills-bump` no `audit-gate-final` da tuninho-qa BLOQUEIA encerramento de operacao se ha aprendizados detectados que nao foram incorporados em skill.

### #58 — Question proactively / CSI mode — Principio 13 da tuninho-qa (cross-reference)

- **Descoberta em:** Op 23 sessao 02 — operador cobrou tracking gap do claude-sessions-service
- **Contexto:** Durante a sessao 02, o QA estava auditando o deploy via skill `tuninho-devops-hostinger-alfa`. Encontrou que `server-registry.json` nao existia. Em vez de questionar a discrepancia (projeto online no PM2 port 3848 sem nenhum tracking em sistema de deploy), o QA ASSUMIU "primeiro deploy via skill" e seguiu em frente. So parou quando o operador perguntou "Tenho ficado confuso quanto a deploys, esses projetos aqui sao todos deployados via skills?"
- **Problema:** O QA era **reativo** (auditava o que existia contra criterios) em vez de **questionador** (investigava lacunas e contradicoes entre sistemas). Esse e um modo de falha sutil: o QA nao faz nada errado dentro do proprio escopo, mas nao detecta contradicoes entre sistemas que deveriam estar sincronizados.
- **Diferenca critica vs Principio 7 do QA (Suspeita por padrao)**:
  - Principio 7 trata de **declaracoes** ("ja testei, funcionou" → desconfiar)
  - Principio 13 trata de **estado** (sistemas em desacordo → questionar ativamente)
- **Solucao na tuninho-qa (PETREA)**:
  - **Principio 13** adicionado: "Assumption is forbidden — Question proactively (CSI mode)"
  - **Regra Inviolavel #18** do tuninho-qa: NUNCA assumir estado operacional; SEMPRE questionar discrepancias
  - **Sub-check `audit-tracking-coherence`**: cruza PM2 jlist real vs server-inventory.json vs sidecars vs server-registry.json em qualquer momento de decisao operacional
- **Relacao com tuninho-ddce:** A Etapa 10 (pre-tarefa CONTROL) e Etapa 14 (transicao de fase) devem invocar audit-tracking-coherence quando a tarefa/fase envolve infraestrutura, deploy, ou qualquer estado multi-sistema. Sem isso, operacoes DDCE podem progredir com state-gaps invisiveis ate o operador descobrir manualmente.
- **Bumps**: tuninho-qa v0.3.0 → v0.4.0 (titulo bumpado na sessao 02, conteudo parcial; v0.5.0 completa na sessao 03), tuninho-ddce v3.9.2 → v3.10.0

### #59 — 4 Regras Petreas Master do QA — handoff validation, audit-only, contador, absorcao Regra #26

- **Descoberta em:** Op 23 sessao 02 turno final — operador formalizou apos cobrar contabilizacao de pendencias ausente do HANDOFF
- **Contexto:** Ao longo da sessao 02, o operador fez 4 intervencoes diretas que revelaram 4 camadas de correcoes estruturais petreas no proprio metodo de auditar do QA. Cada intervencao virou uma Regra Master:
  1. **"Onde esta a contabilizacao de pendencias?"** → REGRA_MASTER_1 (handoff validation com pendency accounting)
  2. **"QA tendeu a corrigir o que detectava, nao so auditar"** → REGRA_MASTER_2 (QA so audita, nunca corrige)
  3. **"Como transformar gaps recorrentes em decisao acionavel?"** → REGRA_MASTER_3 (contador de incidencia metricado)
  4. **"O handoff ja tem Regra #26, precisamos aplicar"** → REGRA_MASTER_4 (absorcao Regra #26 do tuninho-ddce como sub-check)
- **Problema:** As 4 correcoes compartilham uma raiz comum: o QA precisa ser mais proativo e metricado, nao apenas reativo. Sem as 4 regras, o QA pode ser tecnicamente correto em cada check individual mas falhar estruturalmente em garantir continuidade e acionabilidade.
- **Solucao na tuninho-qa v0.5.0:**
  - **Regra Inviolavel #19**: Handoff validation petrea (audit-handoff em toda criacao/atualizacao/apresentacao de HANDOFF)
  - **Regra Inviolavel #20**: QA so audita, nunca corrige (excecao unica: auto-melhoria)
  - **Modo 12 `audit-handoff`**: combina REGRAS_MASTER_1 + 4 — aplica pendency accounting + 8 checks da Regra #26
  - **Modo 13 `audit-incidence-tally`**: implementa REGRA_MASTER_3 com schema incidence-counter.json
  - **Scripts**: `audit-handoff-ddce26.sh`, checklist `gate-handoff.md`
- **Relacao com tuninho-ddce:** A Regra #26 do ddce (Verificacao de Consistencia do Handoff) continua valida e obrigatoria — mas agora pode (e deve) ser DELEGADA ao Modo 12 `audit-handoff` da tuninho-qa, que aplica os 8 checks automaticamente + pendency accounting cruzado (funcionalidade que a Regra #26 sozinha nao tinha). A Regra #26 foi complementada na v3.10.0 para referenciar o modo audit-handoff da tuninho-qa.
- **Bumps:** tuninho-qa v0.4.0 → v0.5.0, tuninho-ddce v3.9.2 → v3.10.0

### #60 — Virada de chave estrutural: handoffs/ por sessao + raw_sessions/ + tuninho-portas-em-automatico

- **Descoberta em:** Op 23 sessao 02 turno final — operador perguntou "Os handoffs sao organizados como? Se sobrescrevem ou sao acumulativos?"
- **Contexto:** A analise honesta revelou que o metodo DDCE ate v3.9.x SOBRESCREVIA HANDOFF.yaml a cada sessao sem versionamento nativo. A sessao 01 da Op 23 criou HANDOFF_SESSAO_01.md como solucao ad-hoc em markdown. O operador refinou a proposta inicial (snapshots em handoffs/ + head na raiz) para algo mais elegante: "TODO handoff vive dentro de handoffs/ desde o inicio". Eliminou a dualidade e impossibilitou o esquecimento.
- **Problema estrutural:** Sem versionamento nativo por sessao, o pendency accounting entre sessoes depende de git history (fragil — depende de a sessao anterior ter commitado antes de atualizar). Sessoes futuras podem repetir o erro: gerar HANDOFF sem listar pendencias da anterior.
- **Solucao estrutural petrea v3.10.0:**
  1. **Nova estrutura `handoffs/`**: `handoffs/HANDOFF_{YYYY-MM-DD}_sessao_{NN}.yaml` — UM unico arquivo canonical por sessao
  2. **Nova pasta `handoffs/raw_sessions/`**: JSONLs + plan files + JSONLs de outros environments
  3. **Nova Regra Inviolavel #27 do ddce**: HANDOFFs vivem em handoffs/
  4. **Nova Regra Inviolavel #28 do ddce**: raw_sessions via tuninho-portas-em-automatico (hook de inicio de sessao)
  5. **Nova skill `tuninho-portas-em-automatico v0.1.0`**: 6 responsabilidades (pre-flight checks + coleta raw sessions local + outros envs + plan files + referenciar no HANDOFF + apresentar painel pre-voo)
  6. **Etapa 7 do ddce reescrita**: cria handoffs/raw_sessions/ + handoffs/HANDOFF_{date}_sessao_01.yaml em vez de HANDOFF.yaml na raiz
  7. **TEMPLATE_DDCE reestruturado**: remove HANDOFF.yaml, adiciona handoffs/raw_sessions/.gitkeep + handoffs/README.md
  8. **Migracao retroativa**: a Op 23 foi o primeiro caso de uso — migrada na sessao 03 como teste da nova estrutura
- **Impacto meta:** Esta foi a TERCEIRA correcao estrutural petrea descoberta via intervencao direta do operador na sessao 02 (apos Principios 12 e 13). Padrao confirmado: "o agente prioriza progresso, o operador detecta lacunas estruturais invisiveis ao agente". A solucao petrea e dar ao QA (via Principio 13 + REGRAS_MASTER_1-4) a atitude critica do operador — mas tambem ferramentas auxiliares como snapshots imutaveis que tornam a auditoria possivel.
- **Bumps:** tuninho-ddce v3.9.2 → v3.10.0, criacao de tuninho-portas-em-automatico v0.1.0
### #61 — Validacao visual estatica NUNCA substitui happy path E2E em pipeline async (L-OP-CARD170-1)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — operador detectou e cobrou apos agente declarar "validacao concluida" duas vezes consecutivas (v0.5.34 e v0.5.35) com screenshots estaticos do dashboard.
- **Contexto:** Card 170 mexeu em pipeline async (insights → LLM streaming). Agente capturou 7 screenshots estaticos do dashboard renderizado e considerou "validado" — mas NUNCA clicou "Atualizar agora" para exercitar o pipeline real. Erro 400 do Claude API persistiu porque o caminho do bug (LLM call com payload invalid) nao foi exercitado.
- **Problema:** Modelo mental "renderizacao com dados reais = feature validada" eh INCORRETO em pipeline async. O caminho fix do bug eh o pipeline que dispara o LLM — nao a UI estatica.
- **Solucao petrea v4.8.0:** Nova **Etapa 11.6 BLOQUEANTE** (Auto-Test Happy Path E2E) entre Etapa 11 e Etapa 12, mesmo em modo pragmatico. Checklist mecanico por tipo de card (pipeline async, admin auth-gated, componente novo, DB schema). Nova Regra Inviolavel #53. Sub-check `audit-happy-path-e2e` no tuninho-qa v0.14.0+.
- **Bumps:** tuninho-ddce v4.7.1 → v4.8.0

### #62 — Defesa em profundidade ao sanitizar payload de pipeline externo (L-OP-CARD170-2)

- **Descoberta em:** Card 170 v0.5.35 → v0.5.36 (2026-05-01).
- **Contexto:** Erro 400 do Claude API ("no low surrogate in string") — UTF-16 surrogate orfao em payload. Primeiro fix v0.5.35 cobriu 3 fontes via queries.ts (sample messages, error_samples, chat titles). Erro persistiu porque havia 2+ fontes nao cobertas: `previousReports[].content_md` (markdown de report anterior salvo no DB com surrogate ja quebrado, propagando como contexto incremental), `previousReports[].summary`, `operations[].titulo` do manifest.
- **Problema:** Fix por-fonte expoe o agente a "esquecer alguma fonte". Sem mapping completo do fluxo de dados antes de propor o fix, eh facil deixar passar.
- **Solucao petrea:** Para fix de bug em pipeline com multiplas fontes de input, aplicar sanitize **em duas camadas**: (a) por-fonte na origem (queries) — defesa preventiva, e (b) na ponte final antes do envio (userPrompt completo em generate.ts) — defesa em profundidade. Custo: zero (regex unica em ~50KB string = milisegundos). Beneficio: garante que NENHUM caractere unicode quebrado chega a API, independente da fonte.
- **Sub-check correspondente:** `audit-fix-source-coverage` (tuninho-qa v0.14.0+) — para fix de bug em pipeline async, exigir que o PR description liste TODAS as fontes possiveis do bug + escolha onde aplicar fix com justificativa (origem vs ponte final).
- **Bumps:** tuninho-qa v0.13.0 → v0.14.0

### #63 — Wishful interpretation de validacao parcial do operador eh anti-padrao (L-OP-CARD170-3)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01).
- **Contexto:** Operador disse "Pode seguir" sobre o mini dashboard E na MESMA mensagem perguntou "Vc reparou o erro que ocorreu em insights? Em alguma etapa sera enderecado?". Agente interpretou "Pode seguir" como autorizacao de fechamento total e tratou erro 400 como follow-up colateral. Mas erro 400 estava no escopo explicito do card ("revisar instabilidades de insights"). 
- **Problema:** Quando operador valida peca X e cobra Y na mesma mensagem, "Pode seguir" autoriza X — nao autoriza fechar X+Y+Z. Wishful interpretation explicita: agente quer fechar, le o "Pode seguir" como mais amplo do que e.
- **Solucao petrea:** Sub-check `audit-card-scope-coverage` (tuninho-qa v0.14.0+) — para card-isolated, cruzar itens explicitamente listados na descricao do card mural com entregas; se ha item nao tratado E nao ha justificativa de "fora de escopo" no resultado: GAP bloqueante.
- **Bumps:** tuninho-qa v0.13.0 → v0.14.0

### #64 — Modo pragmatico do DDCE v4.7.1 tem 6 condicoes ESTRITAS (L-OP-CARD170-4)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — pasta `qa/` inexistente ate auditoria retroativa, pasta `_a4tunados/docs_*/sessoes/{op-170}` inexistente.
- **Contexto:** DDCE v4.7.1 reconhece modo "card-isolated pragmatico" como valido SE 6 condicoes presentes: (1) worktree, (2) operador presente, (3) plano comunicado, (4) comunicacao no card, (5) escriba+comlurb invocados, (6) PR --base develop. Card 170 cumpriu 4 (1-4 + 6) e falhou 2 (escriba e tuninho-qa nao invocados). Resultado: sem auditor independente, agente "auto-validou" cada gate e quebrou Regra #49 do DDCE duas vezes.
- **Problema:** Cumprir 4 nao autoriza pular as outras 2. Token economy NUNCA justifica bypass de skill (Principio 12 do tuninho-qa). Sem QA, nao ha auditor independente.
- **Solucao petrea:** Sub-check `audit-skill-invocation` enforcement OBRIGATORIO em modo pragmatico (nao so formal). Le JSONL da sessao e identifica acoes operacionais sem skill responsavel (escriba bypassed, qa bypassed). Em pragmatico, BLOQUEIA antes de aceitar declaracao de "validado".
- **Bumps:** tuninho-qa v0.13.0 → v0.14.0

### #65 — Para fix de bug, exigir reproducao pre-fix + verificacao pos-fix com mesmo comando (L-OP-CARD170-5)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — agente fez fix v0.5.35 sem testar empiricamente que o erro sumiu.
- **Contexto:** Operador deu o erro exato (API Error 400 invalid_request_error). Agente diagnosticou causa (UTF-16 surrogate quebrado), aplicou fix em 3 fontes, declarou "fix aplicado" — sem rodar refresh manual e ver se erro sumiu. Operador rodou refresh empiricamente e erro persistiu (column 59145 / 59428 nos logs PM2 11:25:20 / 11:25:25, depois do deploy v0.5.35 11:18:58). Foi obrigado a fazer v0.5.36.
- **Problema:** Sem template "exercitar fix com mesmo comando", agente fica em raciocinio dedutivo sem feedback loop empirico. "Diagnostiquei → propus fix" nao eh suficiente — falta "→ exercitei caminho do bug com fix → confirmei que erro sumiu".
- **Solucao petrea:** Sub-check `audit-fix-validation-coherence` (tuninho-qa v0.14.0+) — para PR de fix de bug, exigir template:
  ```
  - Reproducao pre-fix: timestamp + comando + erro observado
  - Aplicacao do fix: commit hash + diff
  - Verificacao pos-fix: timestamp + MESMO comando + erro NAO observado
  ```
  "Mesmo comando" = exercicio EXATO do caminho onde o bug ocorria. BLOQUEIA mural-export Validating se padrao nao cumprido.
- **Bumps:** tuninho-qa v0.13.0 → v0.14.0
