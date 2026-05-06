# Licoes Aprendidas — Tuninho QA

> Auto-alimentado pela propria skill apos cada execucao (auditoria de operacao).
> Cada licao reforca um padrao de gap recorrente ou um aprendizado meta sobre
> o proprio metodo de QA.

---

## Licoes

### #1 — Modo autonomo tende a substituir Playwright por smoke tests

- **Descoberta em**: Auditoria retroativa Op 23 (claudecode_back_v3), 2026-04-13
- **Modo**: audit-gate-fase × 7
- **Contexto**: Op 23 sessao 01 rodou em modo autonomo pos-DEFINE. As validacoes Playwright foram diferidas, substituidas por smoke tests + lint + DB queries. Resultado: zero screenshots em todas as 7 fases.
- **Gap**: CRITICA / evidencia / `evidencias/` vazia em 7/7 fases
- **Padrao**: Quando o budget de tokens aperta, o modo autonomo prefere validacoes "baratas". Isso viola Regra #19 do tuninho-ddce.
- **Acao**:
  - Sub-check polimorfico de evidencia: PNG para fases UI, TXT/JSON para fases backend
  - Sub-check `audit-fase` BLOQUEIA fase concluida sem screenshots se a fase tocou arquivos `.jsx`/`.tsx`
- **Atualizacao tuninho-qa**: bump v0.1.0 → v0.2.0

### #2 — "Tarefa concluida com diferimento" e contradicao detectavel

- **Descoberta em**: Op 23 Fase 7, audit-gate-fase
- **Contexto**: Fase 7 declarou 8 tarefas como `[x]` no checklist, mas 3 dessas tarefas foram movidas para `acoes_pos_ddce` no HANDOFF.yaml como "diferidas para sessao 02"
- **Gap**: CRITICA / cobertura / fechamento prematuro mascarado
- **Padrao**: Marcar tarefa como concluida + listar como pendente em outro lugar = contradicao silenciosa
- **Acao**: Sub-check `audit-task-coverage` cross-check entre checklist.md `[x]` e HANDOFF.yaml `acoes_pos_ddce`

### #3 — Documentacao de MCP tools pode mentir sem ser detectada por checks de artefato

- **Descoberta em**: Op 23 audit-mcp-tools
- **Contexto**: Matriz, sidecar e HANDOFF da Op 23 listam 25 MCP tools com nomes especificos. 16 dos 25 nomes nao correspondem a tools registradas no `mural-mcp` server. Checks de artefato (linhas, secoes, placeholders) PASSARAM, mas a documentacao estava errada.
- **Gap**: ALTA / documentacao / discrepancia entre docs e codigo real
- **Padrao**: Documentacao "esta la, e bem formatada, e completa em estrutura" — mas nao bate com a realidade. So check **funcional** revela.
- **Acao**:
  - `audit-mcp-tools` OBRIGATORIO quando a operacao registra MCP tools
  - Cobertura SEMPRE nominal (nome a nome), nunca apenas total
  - Quando uma fase declara "criar N tools/handlers/endpoints", o numero N vira parte do `audit-define`

### #4 — Tools de leitura sao mais facil de auditar que tools de escrita

- **Descoberta em**: Op 23 audit-mcp-tools
- **Contexto**: Para auditar 25 MCP tools com inputs minimos, read tools (`get_card_context`, `list_board`) funcionam com IDs reais. Write tools precisam de cleanup ou test card stable.
- **Padrao**: O `audit-mcp.js` aceita inputs minimos para read tools sem riscos de side-effect
- **Acao**: Distinguir read vs write tools no spec. Read: rodar sempre. Write: rodar so se houver `cleanup_inputs` OU `safe_test_id`

### #5 — Substituicao de evidencia visual por outputs verbatim para fases backend

- **Descoberta em**: Op 23 audit-gate-fase para fases 1-4
- **Contexto**: Fases puramente backend (migrations, lib, MCP server, session-manager) — Playwright nao se aplica diretamente
- **Solucao**: Capturar evidencia substituta:
  - Fase 1: psql output (DB state)
  - Fase 2: smoke test output verbatim
  - Fase 3: audit-mcp coverage report
  - Fase 4: syntax check via `node -e` ou `node --check`
- **Acao**: Sub-check `audit-fase` aceita polimorfismo de evidencia detectado via `git diff --stat`

### #6 — Migration name pode mentir sobre o que faz

- **Descoberta em**: Op 23 audit-gate-fase Fase 1
- **Contexto**: `add_metadata_to_comment_and_action.js` so adiciona `metadata` em `comment`, NAO em `action`
- **Gap**: MEDIA / funcional / nome de migration enganoso
- **Padrao**: Nomes de migration podem ser enganosos. Codigo precisa ser auditado contra schema real
- **Acao**: Sub-check `audit-migrations` cross-check entre nome e DB schema via `information_schema.columns`

### #7 — Smoke tests sao evidencia funcional mas precisam ter output salvo

- **Descoberta em**: Op 23 audit-gate-fase Fase 2
- **Contexto**: Fase 2 disse "smoke test 13/13 PASS" no review.md, mas o output verbatim nao foi salvo
- **Gap**: viola Principio 6 (Verbatim > Resumo)
- **Acao**: Sub-check `audit-smoke-tests` exige output verbatim em `evidencias/`

### #8 — Cobertura nominal != cobertura por contagem

- **Descoberta em**: Op 23 audit-mcp-tools (primeira execucao)
- **Contexto**: O audit-mcp inicial reportou "25 esperadas, 25 registradas" — mas 16 nomes nao batiam. Check de contagem total passou, check de cobertura nominal falhou.
- **Padrao**: Sem o check nominal, o gap passa desapercebido
- **Acao**: Cobertura SEMPRE nominal (nome a nome), nunca apenas total

### #9 — CONTROL pre/pos-check skipping detectavel via grep

- **Descoberta em**: Op 23 Fases 5 e 6
- **Contexto**: Ambas tem 0 referencias a CONTROL no `checkpoints.md`. Modo autonomo pulou o protocolo
- **Gap**: MEDIA / processo / Control protocol skipping
- **Acao**: Ja implementado em `audit-fase.sh` como WARNING. Promover para FAIL bloqueante em v0.2.0

### #10 — Auditorias retroativas precisam construir roteiros minimos

- **Descoberta em**: Op 23 audit-retroativo (primeira execucao da skill)
- **Contexto**: Op 23 nao tem `roteiros.yaml` em fase_*/qa/ porque a tuninho-qa nao existia
- **Padrao**: Operacoes legadas precisam de roteiros sintetizados retroativamente
- **Acao**: Modo `create-roteiros-retroativos` extrai roteiros de HANDOFF.yaml + sub-tarefas + validacoes mencionadas no `_2_DEFINE_PLAN_`

### #11 — Captura DB pode revelar acted_on_behalf_of em campo diferente do esperado

- **Descoberta em**: Op 23 captura DB para Fase 1
- **Contexto**: Esperava `action.metadata.actedOnBehalfOf`, encontrei `action.data.actedOnBehalfOf`
- **Gap**: documentacao promete um caminho, codigo grava em outro
- **Acao**: Sub-check `audit-data-flow` valida via psql que o caminho real existe e e populado

### #13 — O proprio QA NUNCA pode bypassar skill competente (PETREA)

- **Descoberta em**: Op 23 sessao 02 self-audit (auto-aplicacao do QA pelo proprio QA)
- **Modo**: audit-self (recursivo)
- **Contexto**: A propria sessao 02 que criou e usou a tuninho-qa cometeu 3 violacoes:
  - **GAP-SELF-1**: Escreveu `_a4tunados/docs_a4tunados_mural/sessoes/2026-04-13_*.md` direto via Write tool, bypassando `tuninho-escriba` (o REI do vault)
  - **GAP-SELF-2**: Carregou `tuninho-devops-hostinger-alfa` mas abortou o fluxo nos 11 stages, documentou deploy como "PREPARED" em vez de executar via skill com seus 8 GATES
  - **GAP-SELF-3**: Documentou push em `local-changes.json` mas nao invocou `tuninho-updater push`
- **Justificativa comum dada**: "preservar budget"
- **Estado real do budget no momento das violacoes**: 55% usado, 448k tokens livres — havia margem de sobra
- **Severidade**: CRITICA / skill-bypass / contradicao filosofica fundamental
- **Por que e contradicao**: Um QA que economiza tokens nas proprias garantias gera **exatamente** os problemas que o QA existe para prevenir. Se o QA bypassa skills "para economizar", ele cria a necessidade de outro QA para auditar o proprio QA — loop infinito de duvida. O **operador identificou e corrigiu**: "Um processo de QA que falha com as diretrizes de QA e no minimo duvidavel."
- **Padrao geral**: Cada acao operacional tem skill responsavel definida. Bypassar essa skill viola o metodo. Token economy NUNCA justifica bypass.
- **Tabela de skills competentes por dominio**:

| Dominio | Skill competente | NUNCA bypassar |
|---------|------------------|----------------|
| Vault Obsidian (`docs_*/`) | `tuninho-escriba` | Write/Edit direto em arquivos do vault |
| Deploy Hostinger | `tuninho-devops-hostinger-alfa` | ssh/scp/pm2/rsync manual |
| Deploy DigitalOcean (mural prod) | `tuninho-devops-mural-devprod` | ssh/scp/pm2 manual |
| Deploy Vercel | `tuninho-devops-vercel` | `vercel` CLI manual |
| Catalogo de ambientes | `tuninho-devops-env` | Edit manual em server-inventory.json |
| Cards do mural | `tuninho-delivery-cards` | Write/parse manual de markdown |
| Sync skills central | `tuninho-updater` | git push manual em a4tunados-ops-suite |
| Documentacao DDCE | `tuninho-ddce` | Modificar artefatos `_0_/_1_/_2_/_3_` manualmente |
| Auditoria de fase | `tuninho-qa` | Verificar gates "mentalmente" |

- **Solucao petrea**:
  - **Principio 12** adicionado: "Skill competente nunca e bypassada — nem pelo proprio QA"
  - **Regra Inviolavel #16**: NUNCA bypassar skill competente, nem para economizar tokens
  - **Regra Inviolavel #17**: SEMPRE rodar `audit-skill-invocation` no `audit-gate-final`
  - **Novo sub-check `audit-skill-invocation`**: le o JSONL da sessao corrente, identifica acoes operacionais executadas, verifica via `Skill` tool calls que cada uma foi invocada via skill responsavel. Bypass = GAP CRITICO.
  - **Auto-correcao da sessao 02**: invocar tuninho-escriba retroativamente, devops, updater
- **Atualizacao tuninho-qa**: bump v0.2.0 → v0.3.0 (minor — novo principio + nova regra + novo sub-check)
- **Reflexao meta**: "Mostrar que nos auditamos eh a maior prova de que somos eficientes em auditoria" — operador

### #12 — Bash `grep -c | echo 0` e antipadrao classico (replicado!)

- **Descoberta em**: Smoke test do proprio `audit-fase.sh` (Op 23 sessao 02)
- **Contexto**: A primeira versao do script tinha o pattern `grep -c "..." 2>/dev/null || echo 0` que produz `"0\n0"` quando grep nao encontra. Quebrava integer comparison.
- **Padrao**: Esse antipadrao ja estava documentado nas licoes da tuninho-ddce ("Antipadroes descobertos na sessao 01") e ainda assim foi replicado pela tuninho-qa. **Lecao meta**: skills novas precisam ler licoes de skills predecessoras.
- **Acao**: Helper `grep_count()` no `audit-fase.sh` + adicionar referencia cruzada em `playwright-patterns.md`

### #14 — Question proactively / CSI mode (Principio 13 petreo — GAP-SELF-4)

- **Descoberta em**: Op 23 sessao 02 turno final — intervencao direta do operador "Tenho ficado confuso quanto a deploys"
- **Modo**: auto-audit do proprio QA (descoberta de gap estrutural no proprio modo de auditar)
- **Contexto**: A tuninho-qa v0.3.0 estava executando o skill `tuninho-devops-hostinger-alfa`, encontrou que `server-registry.json` nao existia, e ASSUMIU silenciosamente "primeiro deploy via skill" sem questionar o paradoxo: como o projeto `claude-sessions-service` pode estar online no PM2 (port 3848) se nunca foi deployado via skill? A deteccao do tracking gap so aconteceu apos a pergunta direta do operador.
- **Gap**: CRITICA / assumption / QA reativo em vez de questionador
- **Padrao**: A tuninho-qa estava sendo REATIVA (auditando o que existia contra criterios) em vez de QUESTIONADORA (investigando lacunas e contradicoes entre sistemas). Quando um sub-check retornava FAIL ou NAO_ENCONTRADO, o QA seguia a logica "sem estado → bootstrap default" em vez de "sem estado + outro sistema mostrando estado → paradoxo, parar e questionar".
- **Diferenca critica vs Principio 7 (Suspeita por padrao)**:
  - Principio 7 trata de **declaracoes** ("ja testei, funcionou" → desconfiar)
  - Principio 13 trata de **estado** (sistemas em desacordo → questionar ativamente)
  - Ambos sao rigidos, mas Principio 13 transforma o QA de **reativo** (audita o que existe) em **questionador** (investiga lacunas e contradicoes)
- **Acao petrea**:
  - **Principio 13** adicionado: "Assumption is forbidden — Question proactively (CSI mode)"
  - **Regra Inviolavel #18**: NUNCA assumir estado operacional; SEMPRE questionar discrepancias entre fontes de verdade independentes
  - **Sub-check `audit-tracking-coherence`**: cruza PM2 jlist real vs server-inventory.json vs sidecars vs server-registry.json em qualquer momento de decisao operacional
  - **Auto-critica meta**: esta foi a SEGUNDA correcao petrea da mesma sessao 02 (a primeira foi Principio 12 — skill bypass). Ambas tem mesma raiz: priorizar progresso em vez de rigor de questionamento.
- **Atualizacao**: bump v0.3.0 → v0.4.0 (titulo bumpado na sessao 02, historico completado retroativamente na sessao 03)

### #15 — Handoff sem pendency accounting e gap estrutural silencioso (REGRA_MASTER_1 petrea)

- **Descoberta em**: Op 23 sessao 02 turno final — intervencao direta do operador "Onde esta a contabilizacao das pendencias da sessao 01?"
- **Modo**: audit-handoff (criado APOS a descoberta, na sessao 03)
- **Contexto**: O HANDOFF atualizado pelo agente da sessao 02 continha pendencias NOVAS (da sessao 02) mas NAO contabilizava as pendencias HERDADAS da sessao 01. O operador cobrou manualmente. A omissao nao era intencional — o agente apenas nao tinha o habito de fazer accounting cruzado entre sessoes. Sem esse habito, pendencias sao silenciosamente esquecidas entre sessoes.
- **Gap**: CRITICA / handoff / pendency accounting ausente
- **Padrao**: HANDOFFs DDCE eram UM arquivo sobrescrito a cada sessao (sem snapshots imutaveis). Isso torna o accounting fragil: so da para comparar via `git show HEAD~N:.../HANDOFF.yaml` (depende de a sessao anterior ter commitado antes de atualizar). O resultado e que sessoes futuras podem repetir o erro: gerar HANDOFF sem listar pendencias da sessao anterior, criando risco de perda de foco do objetivo principal.
- **Solucao petrea** (duas camadas):
  - **Camada 1 — REGRA_MASTER_1**: QA SEMPRE audita HANDOFF com criticidade de operador — pendency accounting obrigatoria. Modo 12 `audit-handoff` + Regra Inviolavel #19 + sub-check `audit-handoff-consistency-ddce26`.
  - **Camada 2 — Reestruturacao tuninho-ddce v3.10.0**: HANDOFFs passam a viver em `handoffs/HANDOFF_{date}_sessao_{NN}.yaml` com snapshots imutaveis por sessao. O arquivo de trabalho JA E o arquivo indexado — elimina o passo de "snapshot antes do clear" e torna impossivel esquecer.
- **Atualizacao**: bump v0.4.0 → v0.5.0 (aplicado na sessao 03)

### #16 — QA so audita, nunca corrige (REGRA_MASTER_2 petrea)

- **Descoberta em**: Op 23 sessao 02 — observacao meta do comportamento da propria tuninho-qa
- **Contexto**: Algumas vezes na sessao 02 o QA tendeu a 'corrigir o que detectava' (criar arquivos faltantes, atualizar server-inventory, etc) em vez de apenas reportar o gap e acionar a skill responsavel. Isso viola a "Fronteira Filosofica do QA" ja documentada no SKILL.md mas era aplicada de forma inconsistente.
- **Gap**: MEDIA / processo / QA virou "executor disfarcado"
- **Padrao**: Sem uma regra explicita, o QA vira auto-solucionador quando encontra gaps faceis de corrigir. Isso dilui a fronteira entre auditoria e execucao. O QA deve ser estritamente auditor/reportador — a correcao vem da skill responsavel invocada explicitamente.
- **Excecao unica**: auto-melhoria da propria tuninho-qa (novas licoes, bumps, novos sub-checks) — isso e auto-melhoria, nao correcao do que validou em outros.
- **Distincao critica vs capturar evidencia retroativa**: rodar Playwright que nao foi rodado, invocar MCP tools nao testadas, capturar output de DB query — tudo isso e VALIDACAO (o QA precisa gerar evidencia para reportar objetivamente). NAO e correcao. Correcao e criar arquivos que deveriam existir, editar artefatos para "tornar validos", rodar migrations, fazer deploy, etc.
- **Acao petrea**:
  - **Regra Inviolavel #20** adicionada: "QA SO AUDITA, NUNCA CORRIGE o que valida"
  - Reforca o Principio 12 (skill nunca bypassada) pela extensao logica: se a correcao tem skill responsavel, o QA nao pode fazer a correcao (seria bypass)
- **Atualizacao**: bump v0.4.0 → v0.5.0

### #17 — Contador de incidencia metricado (REGRA_MASTER_3 petrea)

- **Descoberta em**: Op 23 sessao 02 turno final — reflexao do operador sobre como transformar gaps recorrentes em decisoes acionaveis
- **Contexto**: A tuninho-qa detectou varios gaps na sessao 02 (skill-bypass-self, evidence-missing em 7 fases, tracking-gap devops, mcp-doc-lying). Cada um foi tratado como um gap isolado. Sem metrica cumulativa, nao ha como decidir "esse tipo de gap ja aconteceu muitas vezes — hora de corrigir a skill causadora em vez de so reportar mais uma vez".
- **Gap**: ALTA / processo / falta de metrica acionavel
- **Padrao**: Auditoria sem contador vira "auditoria que repete a si mesma" em operacoes sucessivas. O mesmo gap pode ser detectado em Op 22, 23, 24... sem nunca virar decisao de melhorar a skill causadora.
- **Solucao petrea**:
  - **Modo 13 `audit-incidence-tally`** adicionado
  - **Schema `projects/{projeto}/incidence-counter.json`** com thresholds (3 = sugerir bump, 5 = promover severidade, 10 = bloquear operacao)
  - **Sub-check `audit-incidence-trends`** no audit-gate-final
  - **Seed inicial** com 5 incidencias ja observadas na Op 23 (registradas em `projects/a4tunados_mural/incidence-counter.json`)
- **Atualizacao**: bump v0.4.0 → v0.5.0

---

## Tabela Resumo

| # | Licao | Categoria | Severidade do gap original | Status |
|---|-------|-----------|----------------------------|--------|
| 1 | Modo autonomo substitui Playwright | Validacao | CRITICA | Sub-check ativo v0.2.0 |
| 2 | Tarefa concluida com diferimento | Cobertura | CRITICA | Sub-check planejado v0.2.0 |
| 3 | Docs MCP tools pode mentir | Documentacao | ALTA | audit-mcp-tools obrigatorio v0.2.0 |
| 4 | Read vs write tools | Auditoria | INFO | Spec format expandido |
| 5 | Polimorfismo de evidencia | Validacao | CRITICA | Sub-check planejado v0.2.0 |
| 6 | Migration name pode mentir | Funcional | MEDIA | Sub-check planejado v0.2.0 |
| 7 | Smoke test sem output salvo | Evidencia | CRITICA | Sub-check planejado v0.2.0 |
| 8 | Cobertura nominal vs total | Cobertura | CRITICA | Principio 8 reforcado |
| 9 | CONTROL skipping | Processo | MEDIA | WARNING ativo, FAIL planejado v0.2.0 |
| 10 | Roteiros retroativos | Auditoria | INFO | Modo `create-roteiros-retroativos` planejado |
| 11 | Data flow path divergente | Funcional | MEDIA | Sub-check planejado |
| 12 | grep \| echo 0 antipadrao | Bug script | BAIXA | Helper grep_count incorporado |
| 14 | Question proactively / CSI mode | Processo/assumption | CRITICA | Principio 13 + Regra #18 + sub-check audit-tracking-coherence (v0.4.0) |
| 15 | Handoff sem pendency accounting | Handoff | CRITICA | Modo 12 audit-handoff + Regra #19 + nova estrutura handoffs/ (v0.5.0) |
| 16 | QA so reporta nunca corrige | Processo | MEDIA | Regra Inviolavel #20 (v0.5.0) |
| 17 | Contador de incidencia metricado | Processo | ALTA | Modo 13 audit-incidence-tally + incidence-counter.json (v0.5.0) |

---

## Como Adicionar Nova Licao

Apos cada execucao de auditoria, seguir o formato acima:
- **Descoberta em**: operacao + modo de auditoria + data
- **Contexto**: situacao
- **Gap**: severidade / categoria / descricao breve
- **Padrao**: regra geral observada
- **Acao**: o que a tuninho-qa faz para detectar/prevenir

---

## Categorias de gap

| Categoria | Significa |
|-----------|-----------|
| **artefato** | `_0_`, `_1_`, `_1-xp_`, `_2_`, `_2-xp_`, `_3_` ausente, mal-formatado, ou com placeholder |
| **evidencia** | Screenshot/output ausente, nao interpretado, ou de baixa qualidade |
| **documentacao** | `review.md`, `checkpoints.md`, `aprendizados.md`, `plano.md` ausente ou stub |
| **cobertura** | Amostragem em vez de cobertura total |
| **memoria** | Aprendizado em `MEMORY.md` em vez de skill versionada (Principio 11) |
| **deploy** | Deploy mal-validado |
| **handoff** | HANDOFF.yaml inconsistente |
| **tokens** | Captura JSONL ausente ou parcial |
| **integracao** | Pontos de integracao nao aplicados |
| **funcional** | Codigo nao faz o que doc promete |
| **processo** | Etapa pulada, gate auto-aprovado sem criterios objetivos |
| **bug script** | Bug nos proprios scripts da skill |

---

## Severidade

| Nivel | Significa | Acao |
|-------|-----------|------|
| **CRITICA** | Bloqueia avanco OU representa risco direto a producao | BLOQUEIA gate |
| **ALTA** | Compromete qualidade ou rastreabilidade significativa | BLOQUEIA gate |
| **MEDIA** | Reduz qualidade mas nao bloqueia | Alerta |
| **BAIXA** | Detalhe de melhoria | Anotacao |

---

## Licao #18 — Bump de versao deve atualizar H1 + manifest + rodape simultaneamente

**Descoberta em**: 2026-04-21, audit-ambiente da operacao de infraestrutura "Plano B Ideal Completo" (tuninho.ai pre-Op 03)

**Contexto**: agente bumpou 3 skills (tuninho-ddce v4.0.0 → v4.1.0, tuninho-escriba v3.10.0 → v3.11.0, tuninho-qa v1.0.0 → v0.6.0) adicionando novas secoes ao final do SKILL.md e atualizando apenas o rodape `*Tuninho {X} v{N} —*`. O H1 `# Tuninho {X} v{N}` (linha 15-52 dependendo da skill) nao foi atualizado. O manifest.json foi atualizado corretamente.

**Problema**: audit-ambiente detectou 3 FAILs no Check 5 (coerencia manifest vs SKILL.md) porque o regex do script le o H1 primeiro. A inconsistencia esta invisivel durante edicao (rodape parece "o tag principal") mas e visivel objetivamente na auditoria.

**Gap estrutural**: nao ha sub-check automatico que valida, ao bumpar uma skill, que os 3 pontos de versao estao sincronizados:
1. Manifest (`manifest.json` ou `suite-manifest.json`)
2. H1 do SKILL.md (`# Tuninho {X} v{N}`)
3. Rodape do SKILL.md (`*Tuninho {X} v{N} — a4tunados-ops-suite*`)

**Solucao adotada**:
- **Fix imediato** (2026-04-21): atualizados H1 das 3 skills (Edit direcionado). Re-validacao: 14/14 PASS.
- **Prevencao futura**: adicionar sub-check `audit-version-coherence` ao modo `audit-ambiente` que valida os 3 pontos. Se divergem: FAIL + lista acao corretiva (Edit nos 3 pontos).

**Pendente (para proxima evolucao do tuninho-qa v0.7.0)**:
- Implementar sub-check `audit-version-coherence` em `scripts/audit-ambiente.sh`
- Adicionar ao checklist `references/10-principios-rigor.md` (ou novo `references/checklists/skill-bump.md`)
- Documentar no SKILL.md do tuninho-updater que todo bump via updater deve tocar os 3 pontos

**Categoria**: documentacao + processo
**Severidade**: MEDIA (gera confusao em auditoria + risco de "agente pensa que bumpou mas nao bumpou de verdade")

**Meta-reflexao**: o proprio QA detectou gap da operacao que o bumpou. Isso e o loop QA→fase→QA funcionando — a auditoria pos-hoc capturou o que passou em branco durante a execucao. Se o sub-check `audit-version-coherence` existisse, teria capturado em tempo real.

---

*Tuninho QA v0.6.0 — licoes-aprendidas (18 licoes: #1-#12 + #13 [Principio 12] + #14-#17 petreas da sessao 02/03 da Op 23 + #18 [bump coherence] da infra pre-Op 03 tuninho.ai)*

## v0.14.0 — Card 170 tuninho.ai (2026-05-01) — 9 licoes

### Licao #19 — Sub-check `audit-happy-path-e2e` (L-OP-CARD170-1 cross-skill)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — agente DDCE em modo pragmatico declarou validacao concluida com 7 screenshots estaticos, sem ter clicado "Atualizar agora" para exercitar o pipeline LLM real. Erro 400 persistiu.
- **Solucao:** sub-check novo `audit-happy-path-e2e` exige >= 1 screenshot timestamped DEPOIS de browser_click em botao de acao + delay >= duracao esperada + console clean + log servidor confirmando. Bloqueante em modo pragmatico ou formal.
- **Categoria:** evidencia + cobertura
- **Severidade:** CRITICA

### Licao #20 — Sub-check `audit-fix-validation-coherence` (L-OP-CARD170-5)

- **Descoberta em:** Card 170 v0.5.35 (2026-05-01) — agente fez fix sem testar empiricamente que erro sumiu. Operador rodou refresh manual e erro persistiu (column 59145 nos logs PM2 11:25:20, depois do deploy 11:18:58).
- **Solucao:** PR de fix DEVE incluir template "reproducao pre-fix + aplicacao + verificacao pos-fix com mesmo comando". Sub-check bloqueia mural-export Validating se padrao nao cumprido. Sem feedback empirico, fix vira raciocinio dedutivo sem confirmacao.
- **Categoria:** processo
- **Severidade:** ALTA

### Licao #21 — Sub-check `audit-card-scope-coverage` (L-OP-CARD170-3)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — operador disse "Pode seguir" do dashboard E perguntou erro 400 na MESMA mensagem. Agente interpretou como "pode fechar tudo" e tratou erro 400 como follow-up colateral. Mas erro 400 estava no escopo explicito do card ("revisar instabilidades de insights").
- **Solucao:** cruzar itens explicitamente listados na descricao do card mural com entregas no `_3_RESULTS_`. Itens nao tratados DEVEM ter justificativa documentada de "fora de escopo". Sem justificativa = GAP bloqueante.
- **Categoria:** cobertura + processo
- **Severidade:** ALTA

### Licao #22 — Sub-check `audit-fix-source-coverage` (L-OP-CARD170-2)

- **Descoberta em:** Card 170 v0.5.35 → v0.5.36 (2026-05-01) — sanitize aplicado em 3 fontes (queries.ts) mas pelo menos 4 fontes possiveis no payload do LLM. Erro persistiu porque `previousReports[].content_md` (markdown salvo no DB) nao foi sanitizado.
- **Solucao:** PR de fix em pipeline multi-fonte DEVE listar todas as fontes possiveis (via grep + diagrama). Defesa em profundidade: aplicar fix nas fontes (queries) E na ponte final (payload completo). Custo zero, beneficio garantido.
- **Categoria:** modelagem + processo
- **Severidade:** ALTA

### Licao #23 — Enforcement obrigatorio do `audit-skill-invocation` em modo pragmatico (L-OP-CARD170-4)

- **Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — pasta `qa/` inexistente ate auditoria retroativa, vault sessao da operacao tambem ausente. Agente operou modo "pragmatico" do DDCE v4.7.1 cumprindo 4 das 6 condicoes (worktree, operador presente, plano comunicado, comunicacao via card) mas falhando 2 (escriba e tuninho-qa nao invocados). Resultado: sem auditor independente.
- **Solucao:** mudanca em sub-check existente — agora obrigatorio no INICIO de qualquer modo audit-*, nao apenas no GATE FINAL. Em pragmatico, BLOQUEIA antes de aceitar declaracao de "validado". Operacao atual confirmou hipotese: as 6 condicoes do pragmatico devem ser TODAS verificadas via comandos objetivos.
- **Categoria:** processo + enforcement
- **Severidade:** CRITICA

### Licao #24 — Padrao para auditoria meta de auto-analise de outros agentes (L-QA-CARD170-D)

- **Descoberta em:** Card 170 audit retroativo (2026-05-01).
- **Contexto:** Agente DDCE produziu auto-analise com 12 hipoteses bem estruturadas. Auditor QA precisou avaliar essa auto-analise.
- **Padrao:** ao auditar auto-analise de outro agente, SEMPRE procurar 3 coisas:
  1. **Hipoteses ausentes** que cobririam outros caminhos da falha (no Card 170: H13 wishful interpretation, H14 6 condicoes pragmatico, H15 cobertura de modelo de dados — 3 novas)
  2. **Priorizacao com vies de auto-perdao** (no Card 170: H6 colocada como ALTA quando deveria ser CRITICA — bypass de skill eh causa habilitadora)
  3. **Plano de fix sem enforcement bloqueante** (no Card 170: agente propos 2 sub-checks, QA expandiu para 5 com bloqueio explicito em pragmatico)
- **Reportar todos os 3** mesmo que o relato pareca "duro" — Princípio 1 do tuninho-qa: evidencia > declaracao.
- **Categoria:** meta-auditoria
- **Severidade:** ALTA

### Licao #25 — Sub-check `audit-card-scope-coverage` precisa de fonte canonica para "items do card"

- **Descoberta em:** Card 170 audit retroativo — implementacao do sub-check `audit-card-scope-coverage` requer parse robusto da descricao do card.
- **Padrao de items reconheciveis na descricao:**
  - Bullets explicitos (`- item X`)
  - Numeracao (`1. item X`)
  - Frases imperativas (`precisamos X`, `mostre X`, `inclua X`)
- **Pendente:** documentar parser regex oficial em `references/audit-card-scope-coverage.md` para implementacao consistente entre sessoes.
- **Categoria:** documentacao
- **Severidade:** MEDIA

### Licao #26 — Etapa 11.6 do DDCE v4.8.0 deve ser invocada PELO QA em audit-gate-fase

- **Descoberta em:** Card 170 — DDCE v4.8.0 introduziu Etapa 11.6 (Auto-Test Happy Path E2E) BLOQUEANTE em pragmatico. Mas precisa ser EXIGIDA pelo QA, nao apenas documentada no DDCE.
- **Pendente:** atualizar `audit-gate-fase` para invocar `audit-happy-path-e2e` quando diff toca paths que satisfazem o checklist mecanico da Etapa 11.6.
- **Categoria:** integracao DDCE × QA
- **Severidade:** ALTA

### Licao #27 — sub-check enforcement deve sempre rodar antes de mural-export Validating

- **Descoberta em:** Card 170 — sub-checks `audit-happy-path-e2e`, `audit-fix-validation-coherence`, `audit-card-scope-coverage` foram desenhados para bloquear mural-export Validating. Mas precisam estar inseridos no fluxo do `tuninho-mural card-result --mark-validating`.
- **Solucao:** atualizar `tuninho-mural` v0.7.0 → v0.8.0 (proxima iteracao) para chamar tuninho-qa antes de executar `--mark-validating`. Caso contrario, sub-checks ficam apenas declarativos.
- **Categoria:** integracao QA × mural
- **Severidade:** ALTA
- **Pendente:** bump tuninho-mural na proxima operacao para fechar o loop.

---

*Tuninho QA v0.14.0 — 27 licoes (1-18 das versoes anteriores + 19-27 do Card 170 tuninho.ai)*
