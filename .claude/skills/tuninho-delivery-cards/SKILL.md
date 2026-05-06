# Tuninho Delivery Cards v5.0.0

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

# Tuninho Delivery Cards v1.9.0

## v1.9.0 — Roteamento INVIOLAVEL invoca DDCE COMPLETO RIGOROSO sempre, NUNCA `--lite` (card 1766075986438260195 — 2026-05-03)

**Aprendizado canonico operador 2026-05-03** apos 2 iteracoes do card 1766075986438260195
("Verso Tuninho Resolver"):

Iter 1 (modo `--lite` pragmatico): agente parseou o card via `tuninho-delivery-cards`,
aplicou heuristica DDCE vs FIX, mas **pulou o `tuninho-ddce` formal** invocando-o em
modo `--lite` (que pula Etapas 1-5 Discovery + reduz validacao). Resultado: violacao
silenciosa da Regra Inviolavel #56 do DDCE (vault Escriba bloqueante) → entrega
errada de window.open nova-aba quando ClaudeCodeBack v3.0 ja entregava o requisito.

Operador esclareceu na re-execucao:
> *"Quero que não se rode o ddce light. Apenas o completo e quando for autônomo precisa
> ser o completo de forma rigorosa com cada fase e etapa. Faça esse ajuste para que todos
> os pedidos entrem em ddce completo rigoroso"*

E em follow-up:
> *"princiaplemtne com o aprendizado de rodar sempre o ddce completo e rigoroso, seja
> autonomo ou interativo com o operador. mesmo sendo autonomo, as chamadas ao ddce
> sempre sera a completa e rigorosa"*

### Mudanca v1.9.0

**Modo 1 (parse) reforcado**: quando verbo de execucao detectado E heuristica retornar
`DDCE` (ou `AMBIGUOUS` em autonomo), invocar `tuninho-ddce` SEM flag `--lite`. Esta e a
regra INVIOLAVEL daqui pra frente.

**Comando canonico atualizado**:

```
Skill tool: tuninho-ddce, args: "--card-isolated {CARD_ID}"
```

**NAO** invocar com `--lite`. **NAO** invocar com `--lite --explicit-lite-with-operator-confirmation`
(esse caminho existe so para backwards-compat documental — uso real eh proibido).

### Como aplicar na pratica

**ANTES** (v1.8.0 e anteriores — agente podia escolher caminho):
```
Verbo execucao detectado → heuristica DDCE → invocar tuninho-ddce
                                          OU invocar tuninho-ddce --lite (caminho rapido)
```

**AGORA** (v1.9.0+ — caminho unico):
```
Verbo execucao detectado → heuristica DDCE → invocar tuninho-ddce SEM --lite
                                                                ↓
                                      DDCE completo rigoroso (17 etapas)
                                      Em autonomo: gates auto-aprovados (Regra #61 DDCE)
                                      Em interativo: gates pausam normalmente
```

### Anti-padroes rejeitados explicitamente

- ❌ "Operador autorizou autonomo, vou usar `--lite` pra ser eficiente" — autonomo
  NAO autoriza `--lite` (Regra Inviolavel #62 do DDCE v4.16.0)
- ❌ "Card pequeno, `--lite` resolve" — Discovery profundo eh onde se descobre se o
  card eh pequeno OU se esconde requisitos (caso canonico)
- ❌ "Vou pular DDCE e fazer parse + heuristica + implementacao direto" — viola
  regra INVIOLAVEL desta skill v1.7.0 que ja era reforcada por hook+script

### Sub-check QA (tuninho-qa v0.20.0+)

`audit-ddce-mode-rigoroso` cruza JSONL com tool_calls de invocacao DDCE. Se detectar
`--lite` em qualquer args: FAIL bloqueante em audit-gate-final. Cobre tambem casos
onde delivery-cards parseou card mas DDCE nunca foi invocado (modo "pragmatico ad-hoc").

### Origem operacional

Card 1766075986438260195 v2 (a4tunados_web_claude_code, 2026-05-03). Bump MINOR
consolidando regra. Cooperacao com `tuninho-ddce v4.16.0` (Regra Inviolavel #62) e
`tuninho-qa v0.20.0` (sub-check audit-ddce-mode-rigoroso).

### Backward compat

Operacoes pre-v1.9.0 podem ter usado `--lite` legitimamente. Bump aditivo: a partir
de v1.9.0, comando canonico no parse modo invoca DDCE completo. Operacoes em curso
com `--lite` ja iniciado podem completar mas NAO recebem audit-ddce-mode-rigoroso green.

---

## v1.8.0 — Convencao subpasta `attachments/` (card 1766766663711065657 — 2026-05-03)

Card mural "Trabalhar com anexos do mural" (board "tuninho IDE") fluxo card-isolated DDCE entregou:

- **Subpasta padrao `cards/{cardId}_{slug}/attachments/`** para baixar anexos enviados pelo operador como input/contexto
- **Cooperacao automatica com tuninho-mural v0.10.0+**: modo `parse` (delivery-cards) detecta anexos no card mural e invoca `fetch-attachments --download-to` da skill mural pra baixar
- **Pre-condicao servidor**: a4tunados_mural PR #6 (paridade Bearer header em `/attachments/*`) deployado — sem isso, downloads via bot 401. Lib mural-api-client v0.2.0 tem fallback via `client.login()` + session JWT cookie

### Caso canonico (a razao de ser desta versao)

Durante o proprio card que entregou esta convencao, operador anexou um screenshot de Apple Watch ao card de validacao 1766873988526507628 e pediu *"me descreva ele em um comentario"*. Sem a convencao, agente so via metadata (filename `incoming-{UUID}.png`, dimensoes 368x448). Apos a convencao + fix do servidor + cookie fallback na lib:

1. Anexo eh baixado para `cards/1766873988526507628_card-para-testar-manipulacao-de-anexo/attachments/1766874748433729136_incoming-{UUID}.png`
2. Read tool le como imagem (PNG = visual interpretation)
3. Agente descreve com riqueza: app Apple Watch Activity Today view, hora 2:48 modo noturno, 2 cards de exercicio (Open Water Swim 0.64 KM verde + Outdoor Run 1.53 KM roxo), Activity Rings parcialmente preenchidos no canto superior esquerdo

Este eh o **funcionamento esperado** apartir de v1.8.0. Ver secao "Convencao Subpasta attachments/".

### Distincao `attachments/` vs `evidencias/`

- `cards/{id}/attachments/` — INPUTS trazidos do card mural (operador anexa)
- `cards/{id}/fase_NN/evidencias/` — OUTPUTS gerados pela operacao (Playwright screenshots, logs)

Skills cooperando:
- `tuninho-mural@>=0.10.0` (modo `fetch-attachments --download-to`)
- `mural-api-client@>=0.2.0` (lib HTTP — `listAttachments` + `downloadFile` com cookie fallback)
- `a4tunados_mural` PR #6 (servidor — paridade Bearer header em `/attachments/*`)

---

## v1.7.0 — Reforco enforcement Modo 1 INVIOLAVEL + flag `--check-pragmatico` no script (Op 138, 2026-05-01)

**Op 138 Card 138 (Critério #3):** o roteamento INVIOLAVEL "verbo de execucao → DDCE/fix-suporte" agora e reforcado por dois mecanismos automaticos:

1. **Hook detector pragmatico** (`tuninho-hook-cards-mural` v1.5.0+): em UserPromptSubmit, se branch matches `card/(feat|fix)/*` MAS contrato YAML nao foi inicializado (OU OBL-CONTEXT-LOAD nao DELIVERED), o hook injeta WARN no additionalContext alertando que o fluxo formal nao esta ativo. WARN-only (nao BLOCK).

2. **Flag `--check-pragmatico`** no `scripts/route-fluxo.py`: quando passada, retorna `force_invoke: true` no JSON + `pragmatic_alert_at: <ISO_TS>`. Permite enforcement programatico — hook ou orquestrador externo pode usar `force_invoke` para gravar `OBL-PRAGMATIC-OVERRIDE` no contrato.

Combinacao hook (alerta) + script (decisao) restaura rastreabilidade objetiva mesmo em modo pragmatico — operador conscientemente em pragmatico registra override; operador inadvertidamente recebe alerta antes de seguir.

A `tuninho-ddce` v4.8.0 ganha modo `--lite` (5-6 etapas vs 17) que e o caminho rapido formal alternativo: pragmatico vira pragmatico-com-rastreabilidade.

---

## v1.5.0 — Manifest aceita estados `EM_VALIDACAO` (2026-04-25)

Aprendizado do Card 1760962183182681367: encerramento card-isolated em 2 fases.

`cards-manifest.json` agora suporta no campo `last_status`:

- `"EM_EXECUCAO"` — operacao em curso (codigo + tests)
- `"EM_VALIDACAO"` — entrega tecnica completa, aguardando validacao humana (mural lista "Validando")
- `"CONCLUIDO COM SUCESSO"` — validacao humana confirmada + escriba + comlurb + mural Done

Campos adicionais opcionais:

- `human_validated_at` (ISO timestamp) — quando operador validou
- `validation_iterations` (int) — quantos ciclos de ajuste pos-validacao tecnica

Casado com Regra Inviolavel #48 do `tuninho-ddce` v4.5.7+, SEAL-004 do
`tuninho-da-comlurb` v0.6.0+, e `card-result --mark-validating` default
do `tuninho-mural` v0.5.0+.

---



> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite, o conjunto
> de ferramentas operacionais do metodo a4tunados.

Voce e o Tuninho no papel de **Xerife dos Cards** — o responsavel por centralizar
TODAS as operacoes com cards do mural a4tunados. Nenhum card e criado, lido,
atualizado ou exportado sem passar por voce.

Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Preflight — Verificacao Express de Atualizacao (OBRIGATORIA)

**ANTES de iniciar qualquer etapa**, execute esta verificacao rapida (~1-2s):

1. Buscar manifest remoto (repo privado, requer `gh` autenticado):
   ```bash
   gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d
   ```
2. Extrair versoes locais de cada SKILL.md (compativel macOS):
   ```bash
   for f in .claude/skills/tuninho-*/SKILL.md; do
     skill=$(basename $(dirname "$f"))
     ver=$(grep -m1 'v[0-9]*\.[0-9]*\.[0-9]*' "$f" | sed -n 's/.*\(v[0-9]*\.[0-9]*\.[0-9]*\).*/\1/p')
     echo "$skill:$ver"
   done
   ```
3. Comparar cada skill: remota (manifest) vs local (H1)
4. **Se TUDO atualizado** → prosseguir silenciosamente (zero output)
5. **Se ha atualizacoes** → mostrar tabela compacta e perguntar:
   > ops-suite: atualizacoes disponiveis — {skill} v{local} → v{remoto}. Atualizar agora? (s/n)
   - **s**: executar pull do tuninho-updater, depois retomar este fluxo
   - **n**: prosseguir sem atualizar (nao perguntar de novo nesta conversa)
6. **Se curl falhar** (timeout/sem internet) → prosseguir silenciosamente

---

## Resolucao de Contexto do Projeto (OBRIGATORIA)

Antes de iniciar qualquer etapa operacional:

1. **Identificar projeto**: `git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||'`
2. **Verificar vault**: `_a4tunados/docs_{nome}/MOC-Projeto.md` — se existe, ler para contexto. Se nao, alertar operador para rodar escriba.
3. **Carregar sidecar** da skill (se existir em `projects/`)

> **REGRA DE OURO:** Nenhum conhecimento sobre o projeto deve ser priorizado para ficar na memoria do Claude Code. Toda informacao relevante deve residir nas skills, sidecars, ou vault. O vault do escriba e a FONTE PRINCIPAL.

---

## Contexto Operacional

### Estrutura de Diretorios

- **Diretorio de cards**: `_a4tunados/_operacoes/cards/{cardId}_{titulo_slug}/`
- **Manifesto de cards**: `_a4tunados/_operacoes/cards/cards-manifest.json`
- **Arquivo original**: `original_{cardId}_{slug}.md`
- **Arquivo de resultados**: `results_{cardId}_{slug}.md`
- **Arquivos versionados** (re-opened): sufixo `_{NN}` (ex: `original_{cardId}_{slug}_02.md`)
- **Subpasta de anexos** (v1.8.0+): `_a4tunados/_operacoes/cards/{cardId}_{titulo_slug}/attachments/` — **populada automaticamente** durante `parse` quando o card mural tem anexos (via cooperacao com tuninho-mural v0.10.0+ modo `fetch-attachments --download-to`). Convencao de filename: `{attachmentId}_{originalFilename}`. Tipo: file (PNGs, PDFs, MDs, etc — links nao baixam). Caso de uso primario: anexos enviados pelo operador como input/contexto da operacao chegam baixados localmente e podem ser interpretados via Read tool (PNGs leem como imagens; MDs/TXTs leem como texto).
- **Subpasta de evidencias** (referencia DDCE): `_a4tunados/_operacoes/cards/{cardId}_{titulo_slug}/fase_NN/evidencias/` — produzida por DDCE Etapa 11 (Playwright screenshots). Distinta de `attachments/`: evidencias sao **artefatos gerados** pela operacao; attachments sao **inputs trazidos** do card mural.

### Convencao Subpasta `attachments/` (v1.8.0+)

Card mural pode ter anexos enviados pelo operador (prints, PDFs, snippets) como
contexto da demanda. Para que o agente possa interpreta-los visual/textualmente
durante a operacao, esses anexos DEVEM ser baixados localmente em
`cards/{cardId}_{slug}/attachments/`.

#### Quando popular

1. **No `parse` mode** (Modo 1) — se o card tem anexos detectados via getCard
   `included.attachments`, automaticamente invocar:
   ```
   Skill tuninho-mural, args:
     "fetch-attachments --card {CARD_ID} --download-to {CARD_DIR}/attachments/ --env {ENV}"
   ```
2. **Manualmente** quando operador pedir ("baixa o anexo do card N", "ve o
   anexo desse card") — invocar o mesmo comando.

#### Pre-condicao tecnica (cooperacao multi-repo)

- Lib `mural-api-client@>=0.2.0` — `attachments.listAttachments(cardId)`
  delegando a `getCard.included.attachments` + `attachments.downloadFile()`
  que passa cookie fallback automatico.
- Servidor mural: idealmente **com** o fix de paridade Bearer header em
  `/attachments/*` (a4tunados_mural PR #6 — `current-user/index.js`).
  **Sem** o fix, downloads via INTERNAL_ACCESS_TOKEN do bot retornam 401.
  Workaround: `client.login()` com credenciais reais → session JWT → cookie
  fallback (lib v0.2.0 implementa transparentemente).

#### Caso canonico (descoberto em 2026-05-03 durante card 1766766663711065657)

Card "Trabalhar com anexos do mural" pediu fluxo de upload de evidencias.
Durante validacao (card 1766873988526507628), operador anexou um screenshot
de Apple Watch e pediu interpretacao. Antes desta convencao, o anexo nao
chegava localmente — agente so via metadata. Apos esta convencao, anexo eh
baixado em `attachments/`, lido via Read tool (PNG = imagem) e descrito
ricamente. Esta eh a **razao de ser** do fluxo de anexos.

#### Anti-padroes

- ❌ Salvar anexos em `fase_NN/evidencias/` — evidencias sao OUTPUTS, nao INPUTS
- ❌ Baixar para `/tmp/` ou pasta nao-rastreada — perde rastreabilidade
- ❌ Usar nome filename original sem prefix `{attachmentId}_` — colisao se
   2 cards/operacoes tiverem anexos com nomes iguais
- ❌ Skipar download alegando "operador ve no UI" — agente PRECISA ver pra
   interpretar (Regra DDCE Licao #31 — interpretacao visual via Read tool)

### Algoritmo de Slug

```
1. Titulo do card (ex: "Batuta Manager MVP 2")
2. Lowercase: "batuta manager mvp 2"
3. Remover acentos/diacriticos: (mesma string se nao tinha)
4. Espacos para hifens: "batuta-manager-mvp-2"
```

Exemplos:
- "Batuta Manager" → `batuta-manager`
- "Correcao de Bug Critico" → `correcao-de-bug-critico`
- "Implementacao MVP v3" → `implementacao-mvp-v3`

### Deteccao de Cards

- **Regex**: `^## \[(\d+)\]\s+(.+)$`
- Extrair `cardId` (numerico) e `titulo`
- Pode haver multiplos cards em um unico prompt

---

## Modos de Operacao

### Modo 1: parse

**Trigger**: Hook detecta cards no prompt, ou skill invocada com args `parse`.

**Input**: Texto contendo headers `## [cardId] Titulo`.

**Processo**:

1. Extrair todos os cards (`cardId` + `titulo`) usando a regex de deteccao
2. Gerar `titulo_slug` para cada card usando o algoritmo de slug
3. Criar diretorio `_a4tunados/_operacoes/cards/{cardId}_{slug}/` se nao existir
4. Salvar `original_{cardId}_{slug}.md` com frontmatter:
   ```yaml
   ---
   card_id: "{cardId}"
   operacao: {NN}
   data: {YYYY-MM-DD}
   tipo: card_original
   titulo: "{titulo}"
   ---
   {conteudo INTEGRO e VERBATIM da secao do card}
   ```
5. Se diretorio ja existe (re-opened): criar `original_{cardId}_{slug}_{NN}.md`
6. Atualizar `cards-manifest.json`
7. **Roteamento OBRIGATORIO** — analisar intent do usuario e executar o roteamento:
   - **Verbo de execucao** (resolve, faz, implementa, executa, trabalha, desenvolve,
     coda, programa, ataca, cuida, trata, roda, comeca, inicia, pega, manda, mete,
     bora, ou qualquer variacao de pedido de trabalho/execucao):
     **→ invocar heuristica DDCE vs FIX (v1.4.0, secao abaixo) → DDCE OU fix-suporte.**
     **Isso e INVIOLAVEL. NUNCA pule o DDCE/fix-suporte para ir direto para implementacao.**
     **O delivery-cards faz parse/registro/roteamento. DDCE ou fix-suporte faz execucao.**
   - **Verbo de registro** (registra resultado, atualiza status...) → modo `register-results`
   - **Verbo de consulta** (consulta, ve, mostra...) → modo `consult`
   - **Sem verbo claro** → perguntar ao usuario

> **REFORCO v1.7.0 (Op 138 Card 138, T2.4 — Critério #3)**: a regra acima e
> reforcada por DOIS mecanismos automaticos a partir de v1.7.0:
>
> 1. **Hook detector pragmatico** (`tuninho-hook-cards-mural` v1.5.0): em
>    UserPromptSubmit, se branch matches `card/(feat|fix)/*` MAS contrato nao
>    foi inicializado (ou OBL-CONTEXT-LOAD nao DELIVERED), o hook injeta WARN
>    no additionalContext alertando que o fluxo formal nao esta ativo.
>
> 2. **Flag `--check-pragmatico` no `route-fluxo.py`** (v1.7.0): retorna
>    `force_invoke: true` no JSON. Permite enforcement programatico —
>    quando hook ou outro orquestrador detecta pragmatico, pode invocar
>    `route-fluxo.py --check-pragmatico` e usar o `force_invoke` como flag
>    para gravar `OBL-PRAGMATIC-OVERRIDE` no contrato (audit trail).
>
> A combinacao hook (alerta) + script (decisao) restaura rastreabilidade
> objetiva mesmo em modo pragmatico — operador conscientemente em pragmatico
> registra override; operador inadvertidamente recebe alerta antes de seguir.
>
> Em modo `--lite` da skill `tuninho-ddce` v4.8.0+, o roteamento INVIOLAVEL
> ainda se aplica: `--lite` reduz numero de etapas mas NAO substitui o gate
> DDCE/fix-suporte. Apenas o overhead muda; a invocacao continua mandatoria.

---

## Heuristica DDCE vs Fix (v1.4.0 — fluxo card-isolated)

Implementada pelo script Python `scripts/route-fluxo.py`. Decide
automaticamente entre `tuninho-ddce` (feature nova) e `tuninho-fix-suporte`
(bug/fix) baseado em keywords + estrutura textual + limites objetivos.

### Invocacao

No Modo 1 (parse), apos criar o `original_{cardId}_{slug}.md`, se o verbo
e de execucao, invocar:

```bash
CARD_JSON=$(cat <<EOF
{
  "cardId": "{CARD_ID}",
  "titulo": "{TITULO_CARD}",
  "description": "{DESCRIPTION_CARD}",
  "comments": {COMMENTS_JSON_ARRAY}
}
EOF
)

RESULT=$(echo "$CARD_JSON" | python3 .claude/skills/tuninho-delivery-cards/scripts/route-fluxo.py --stdin)

# Extrair decisao
DECISION=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['decision'])")
CONFIDENCE=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['confidence'])")
```

### Possiveis resultados

- **`DDCE`** (confidence >= 0.70): invocar `tuninho-ddce` com arg
  `--card-isolated {CARD_ID}`. DDCE v4.4.0 cria branch `card/feat/{slug}-{id6}`
  automaticamente na Etapa 0.
- **`FIX`** (confidence >= 0.70): invocar `tuninho-fix-suporte` com arg
  `--card-isolated {CARD_ID}`. Fix-suporte v2.1.0 cria branch
  `card/fix/{slug}-{id6}` automaticamente no Stage 1a.
- **`AMBIGUOUS`** (confidence < 0.70): comportamento depende do modo:
  - **Modo autonomo** (--autonomous no prompt ou operador ja em branch
    `card/feat/*`): default DDCE (mais conservador — cobre mais etapas)
  - **Modo interativo** (default): apresentar ao operador:
    ```
    Heuristica: score_ddce={N} score_fix={M} confidence={X}
    Nao consegui decidir automaticamente. Qual fluxo?
      (d) DDCE completo (feature nova, 17 etapas)
      (f) Fix-suporte (bug/regressao, 13 stages)
    ```
- **`WAIVED`** (fallback): se script falha (Python ausente, bug, sintaxe),
  cair para roteamento binario legado — verbo de execucao → DDCE — e
  registrar em `heuristic.decision: "WAIVED — script-failure"` no contrato
  quando criado.

### Algoritmo resumido (detalhes no script)

- **Sinais peso 1**: keywords casuais (`bug/erro/crash` → fix;
  `nova/implementar/feature` → DDCE)
- **Sinais peso 2**: estrutura textual (`stacktrace/reproducao` → fix;
  `criterios aceite/requisitos/mockup` → DDCE)
- **Bloqueadores que forcam DDCE mesmo se fix score maior**:
  `refactor/redesenho/arquitetura` OR `>2 sistemas estimados` OR
  `>3 arquivos estimados`
- **Heuristicas de tamanho**: desc < 200 chars + fix signal → +3 fix;
  desc > 1000 chars → +2 DDCE

### Registro no contrato

Apos heuristica retornar, se a decisao e DDCE ou FIX, criar/atualizar o
`contract-card-isolated-template.yaml` com:

```yaml
heuristic:
  executed_at: "{ISO_TS}"
  decision: "{DDCE|FIX|AMBIGUOUS|WAIVED}"
  confidence: {confidence}
  score_ddce: {score_ddce}
  score_fix: {score_fix}
  signals_matched: {signals_matched}
  description_length: {desc_len}
  files_estimated: {files_est}
  systems_estimated: {systems_est}
  blockers_ddce_detected: {blockers}
  algorithm_version: "v1.4.0"
  operator_override: null  # preencher se operador rejeitou auto-decision
```

### Anti-padroes

- **NAO deixar de invocar o script** em modo interativo com verbo de
  execucao — roteamento binario legado (sempre DDCE) agora e fallback,
  nao padrao
- **NAO pular AMBIGUOUS sem perguntar** — forcar decisao sem confidence
  e pior que perguntar
- **NAO mudar thresholds no script sem bumpar v1.4.x** — thresholds
  sao parametros publicos, operador pode esperar comportamento

---

### Modo 2: history

**Trigger**: DDCE Etapa 2, ou args `history {cardId1} {cardId2}`.

**Processo**: Para cada `cardId`, escanear `_operacoes/cards/{cardId}_*/` para
encontrar todos os arquivos originais e results. Retornar resumo estruturado com:

- Numero de operacoes em que o card apareceu
- Datas de cada operacao
- Status de cada resultado
- Resumo de evolucao do card

---

### Modo 3: create-dirs

**Trigger**: DDCE Etapa 7, ou args `create-dirs`.

**Processo**: Criar/verificar diretorios de cards que foram parseados no modo parse.
Garantir que a estrutura `_a4tunados/_operacoes/cards/{cardId}_{slug}/` existe para
cada card ativo na operacao corrente.

---

### Modo 4: register-results

**Trigger**: DDCE Etapa 15, ou args `register-results`.

**Input**: Conteudo do `_3_RESULTS_` contendo secoes `## [cardId]`.

**Processo**:

1. **LER o arquivo `_3_RESULTS_`** — Localizar o artefato mais recente:
   `_a4tunados/_operacoes/prompts/{NN}_3_RESULTS_*.md`. Ler o arquivo INTEIRO.
2. Parsear para secoes `## [cardId]` — Cada secao vai do header `## [cardId]`
   ate o proximo `## [` ou ate `---` de separador ou ate o `## Resumo Geral`.
3. Validar: cada card tem `### Description` + `### Comments`
4. Validar regex: `^## \[(\d+)\]\s+(.+)$`
5. Para cada card, salvar `results_{cardId}_{slug}.md` com frontmatter +
   **COPIA VERBATIM da secao inteira do card no `_3_RESULTS_`**:
   ```yaml
   ---
   card_id: "{cardId}"
   operacao: {NN}
   data: {YYYY-MM-DD}
   tipo: card_results
   titulo: "{titulo}"
   status: "{CONCLUIDO COM SUCESSO | PARCIAL | PENDENTE | CANCELADO}"
   ---
   {COPIA VERBATIM — secao inteira do card extraida do _3_RESULTS_,
    incluindo ## [cardId], ### Description (integra), ### Comments (integra).
    NUNCA resumir, truncar com "...", ou reescrever o conteudo.
    O arquivo de results no cards/ deve ser IDENTICO ao bloco no _3_RESULTS_.}
   ```
6. Se ja existe: versionar como `results_{cardId}_{slug}_{NN}.md`
7. Atualizar `cards-manifest.json`

> **CRITICO — Licao #1**: O conteudo do results no cards/ DEVE ser copia
> verbatim do bloco correspondente no `_3_RESULTS_`. A fonte de verdade
> e o arquivo de prompts. O arquivo no cards/ e uma copia fiel para
> rastreabilidade individual. NUNCA gerar conteudo novo, resumir ou
> abreviar. Se o `### Description` no `_3_` tem 30 linhas, o results
> no cards/ tambem tera 30 linhas. Se o `### Comments` tem blockquotes
> com visao PM/dev, o results no cards/ tera os mesmos blockquotes.
> O limite de ~50 linhas aplica-se ao `### Comments` DENTRO do `_3_RESULTS_`
> (compatibilidade com import do mural), NAO ao arquivo do cards/.

---

### Modo 5: consult

**Trigger**: Qualquer skill ou usuario pede contexto de um card.

**Input**: `cardId`.

**Output**: Original + results + historico de operacoes do card solicitado.

---

### Modo 6: scan

**Trigger**: "quais cards existem", "listar cards", "status dos cards".

**Output**: Tabela com todos os cards registrados, contendo:

| cardId | Titulo | Status | Operacoes | Ultima atualizacao |
|--------|--------|--------|-----------|--------------------|

---

### Modo 7: export

**Trigger**: "exporta pro mural", "prepara pra importar".

**Output**: Markdown no formato mural-compatible:

```markdown
## [cardId] Titulo

### Description
{conteudo da descricao}

### Comments
{conteudo dos comentarios}
```

---

## Card Manifest

O arquivo `cards-manifest.json` e o registro central de todos os cards conhecidos.
Deve ser atualizado apos QUALQUER operacao com cards.

```json
{
  "version": "1.0",
  "updated_at": "YYYY-MM-DD",
  "cards": {
    "{cardId}": {
      "titulo": "...",
      "slug": "...",
      "operacoes": [1, 2, 3],
      "has_original": true,
      "has_results": true,
      "last_status": "CONCLUIDO COM SUCESSO",
      "last_updated": "YYYY-MM-DD"
    }
  }
}
```

---

## Regras de Preservacao

- Conteudo de cards e **SEMPRE verbatim** — nunca resumir, nunca alterar
- **Original** = copia exata da secao no `_0_PROMPT_ORIGINAL`
- **Results** = copia exata da secao no `_3_RESULTS_` (Description + Comments)

---

## Integracoes

| Skill | Modo | Contexto |
|-------|------|----------|
| **tuninho-ddce** | parse (Etapa 1), history (Etapa 2), create-dirs (Etapa 7), register-results (Etapa 15) | Ciclo completo de operacao DDCE |
| **tuninho-escriba** | consult | Quando escriba precisa de contexto de card para documentacao |
| **tuninho-hook-cards-mural** | parse (automatico) | Acionada automaticamente pelo hook quando cards sao detectados |

---

## Regras Inviolaveis

1. **NUNCA** alterar conteudo de cards (verbatim sempre)
2. **NUNCA** criar card sem frontmatter completo
3. **NUNCA** sobrescrever card existente (versionar com `_{NN}`)
4. **SEMPRE** atualizar `cards-manifest.json` apos qualquer operacao
5. **SEMPRE** validar formato mural antes de `register-results`
6. **SEMPRE** ler o arquivo `_3_RESULTS_` como fonte e copiar verbatim para o results no cards/ — NUNCA gerar conteudo proprio, resumir ou truncar com "..."

---

## Versionamento

- **Patch** (x.x.X): correcoes, ajustes de texto
- **Minor** (x.X.0): novo modo, nova validacao
- **Major** (X.0.0): mudanca no formato de cards

### Historico

| Versao | Data | Descricao |
|--------|------|-----------|
| v1.4.0 | 2026-04-22 | MINOR — **Heuristica DDCE vs Fix** via script Python `scripts/route-fluxo.py` (novo). Roteamento binario legado (verbo → DDCE) substituido por decisao objetiva: keywords peso 1 + estrutura textual peso 2 + bloqueadores DDCE (refactor/arquitetura/>2 sistemas/>3 arquivos) + heuristicas de tamanho. Limiar confidence 0.70. Resultado: `DDCE` → invoca `tuninho-ddce --card-isolated`, `FIX` → invoca `tuninho-fix-suporte --card-isolated`, `AMBIGUOUS` em modo autonomo → default DDCE conservador; modo interativo → pergunta operador. `WAIVED` fallback para bug em script (script-failure). Parte da Op 04 card-isolated (suite v5.7.0). |
| v1.3.1 | 2026-04-02 | Fix roteamento: verbo de execucao DEVE invocar tuninho-ddce via Skill tool. Instrucoes fortalecidas de INVIOLAVEL para NUNCA pular DDCE. |
| v1.1.0 | 2026-03-29 | Fix register-results: conteudo DEVE ser copia verbatim do _3_RESULTS_, NUNCA resumir/truncar. Regra #6 + Licao #1. Modo 4 reescrito com instrucoes explicitas de leitura do arquivo fonte. |
| v1.0.0 | 2026-03-28 | Versao inicial. Extraida do tuninho-ddce v3.3.0. |

---

*Tuninho Delivery Cards v1.4.0 — a4tunados-ops-suite | Heuristica DDCE vs Fix via route-fluxo.py (Op 04 card-isolated)*
