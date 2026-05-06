# Licoes Aprendidas — Tuninho da Comlurb

Registro de licoes operacionais desta skill. Atualizado apos cada uso real.

## Licoes pre-v0.1.0 (do estudo que gerou a skill)

### L0.1 — `/clear` destroi buffer volatil sem ritual de saida
**Contexto:** Claude Code CLI nao expoe hook SessionEnd bloqueador.
**Problema:** operador pode dar `/clear` a qualquer momento, perdendo decisoes,
pendencias tacitas, e contexto que nao foi materializado em artefatos.
**Solucao adotada:** ritual Comlurb + seal + briefing-forcado na proxima sessao.
**Nao resolve 100%:** se operador dar `/clear` sem rodar Comlurb, perda
acontece. Defesa de segundo nivel: hook inicio-sessao detecta HANDOFF sem seal
e alerta.

### L0.2 — JSONL user-level e "Santo Graal" desperdicado
**Contexto:** `~/.claude/projects/{slug}/*.jsonl` contem toda a cadeia raw.
**Problema:** nenhuma skill do DDCE/escriba le esses JSONLs automaticamente.
**Solucao adotada:** Comlurb sincroniza JSONL da sessao atual no FIM (complementa
tuninho-portas-em-automatico que sincroniza sessoes anteriores no INICIO).
Escriba v3.11.0 ganha modo multi-sessao-audit que le os JSONLs.

### L0.3 — Handoff como documento manual falha historicamente
**Contexto:** auditoria de 52 operacoes mostrou que apenas 1 (Op 02 tuninho.ai)
teve handoffs formalmente escritos entre sessoes.
**Problema:** agente esquece de escrever HANDOFF no fim da sessao.
**Solucao adotada:** HANDOFF vira documento incremental (Living State) atualizado
a cada gate DDCE (via Comlurb em modo gate-guard-light). No fim da sessao, Comlurb
full faz o fechamento.

### L0.4 — Pendencias silenciosamente esquecidas
**Contexto:** REGRA_MASTER_1 do tuninho-qa foi criada justamente pra isso,
mas depende do audit-handoff ser invocado.
**Problema:** se ninguem invoca audit-handoff entre sessoes, pendencias somem.
**Solucao adotada:** pendency-ledger formal + audit-continuidade obrigatorio
em passo 4 do ritual. Pendencias ganham ID estavel + historico.

### L0.5 — PreCompact e o unico hook bloqueador pre-auto-compact
**Contexto:** Claude Code nao tem hook PreClear. Mas tem PreCompact que pode
bloquear auto-compactacao.
**Problema:** auto-compact em ~80% destroi detalhes sem ritual.
**Solucao adotada:** hook PreCompact dispara Comlurb Modo 2. Se ritual OK,
bloqueia auto-compact e recomenda /clear ao operador.
**Ganho:** mesmo se operador esquece de rodar Comlurb, auto-compact dispara.

### L0.6 — Em 15% de contexto (~150k tokens) Comlurb roda confortavel
**Contexto:** calculo de tokens pra cada etapa do ritual.
**Resultado:** estimativa 62-94k tokens. Folga de 56-88k.
**Solucao adotada:** trigger movido de 80% para 85%. Hook conta-token v5.0.0
nao bloqueia mais — vira sinalizador + disparador de Comlurb em 85%.

### L0.7 — Multi-edit em YAML pode duplicar keys silenciosamente (dogfooding 2026-04-21)

**Contexto:** durante enriquecimento do HANDOFF da Op 00 pre-Op 03, o agente usou
3 Edits consecutivos no mesmo YAML — primeiro editou `contexto:` + `painel_resumido:`,
depois substituiu `decisoes_tomadas: []` pelo novo bloco (incluindo inline
`riscos_ativos:` com 4 items), depois substituiu `proximos_passos_sessao_N_mais_1: []`.

**Problema:** o segundo Edit adicionou `riscos_ativos:` com 4 items, mas a linha
original `riscos_ativos: []` (que vinha logo apos `decisoes_tomadas: []` no arquivo)
permaneceu no YAML. Resultado: YAML com key `riscos_ativos` DUPLICADA. PyYAML
`safe_load` aplica regra "ultimo ganha" e os 4 riscos sumiram silenciosamente.
Nenhuma validacao normal detectou.

**Sintoma observado:** briefing gerado pelo Comlurb mostrou "Riscos ativos: (nenhum
declarado)" mesmo apos o agente ter editado 4 riscos reais. So foi pego porque o
agente leu o briefing final e viu que nao batia com o HANDOFF esperado.

**Prescricao — 2 opcoes:**
1. **Edit unico** substituindo o bloco inteiro adjacente de uma vez (preferivel para
   keys YAML vizinhas). Ex: substituir `decisoes_tomadas: []\n...riscos_ativos: []` de
   uma vez com os dois blocos populados.
2. **Read entre Edits:** reler o arquivo apos cada Edit antes do proximo. Custo maior
   mas mais defensivo quando as keys estao espalhadas.

**Impacto no Comlurb:** o ritual completou com sucesso (QA PASS em tudo) mas o briefing
resultante nao foi util porque faltava contexto de riscos. Re-seal com HANDOFF corrigido
resolveu. Licao aponta para: **validacao de briefing deveria checar que campos
key (contexto.objetivo, decisoes_tomadas, riscos_ativos) estao populados apos edit
manual do operador entre rodadas de Comlurb.**

**Pendente (para v0.2.0 do Comlurb):**
- Adicionar warning no painel final quando briefing gerado tem secoes vazias que
  o HANDOFF aparentemente deveria ter (ex: riscos = [] mas `## Riscos` no briefing
  resulta em "(nenhum declarado)" apos enrichment manual foi feito).
- Alternativamente, o QA audit-handoff poderia validar consistencia campo-a-campo
  via schema em vez de apenas presenca de keys.

  via schema em vez de apenas presenca de keys.

---

## L-COMLURB-CARD170-1 — Pre-check audit-fix-validation-coherence + audit-happy-path-e2e (v0.7.1)

**Descoberta em:** Card 170 (tuninho.ai, 2026-05-01) — agente declarou mural-export Validating duas vezes (v0.5.34 e v0.5.35) sem ter exercitado happy path E2E. Erro 400 do Claude API persistiu em prod e operador foi forcado a fazer QA manual.

**Contexto:** Regra SEAL-004 (v0.6.0) cobria seal final exigindo `human_validated_at`. Mas a etapa intermediaria de `--mark-validating` ficava sem pre-check. Resultado: operador recebia pedidos de "valida ai" que ainda tinham bug latente — ping-pong desnecessario entre validacao do operador e novas iteracoes.

**Solucao petrea v0.7.1 (Regra SEAL-006):** pre-check obrigatorio invocando tuninho-qa `audit-happy-path-e2e` + `audit-fix-validation-coherence` ANTES de seal final E ANTES de mural-export `--mark-validating`. Bloqueia se qualquer FAIL.

**Sub-checks correspondentes (tuninho-qa v0.14.0+):**
- `audit-happy-path-e2e` — >= 1 screenshot timestamped DEPOIS de browser_click + delay >= duracao + console clean + log servidor
- `audit-fix-validation-coherence` — template reproducao pre-fix + verificacao pos-fix com mesmo comando

**Pendencia (proxima iteracao):**
- bump `tuninho-mural` v0.7.0 → v0.8.0 fazendo `card-result --mark-validating` invocar Comlurb pre-check. Caso contrario, Regra SEAL-006 fica apenas declarativa em projetos que usam mural-cli direto sem passar pelo Comlurb antes.

**Categoria:** processo + integracao QA × Comlurb × mural
**Severidade:** ALTA
