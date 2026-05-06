# Os 11 Principios de Rigor — Tuninho QA

> Este documento expande cada principio com exemplo pratico, contra-exemplo
> (o que NAO fazer), e o teste objetivo que valida sua aplicacao.

---

## Principio 1 — Evidencia > Declaracao

**Regra**: "Testei e funcionou" nao vale. Mostre o comando, o output verbatim, o screenshot interpretado.

**Exemplo correto**:
```
Status: PASS
Comando: $ wc -l _a4tunados/_operacoes/prompts/23_1-xp_DISCOVERY_claudecode_back_v3.md
Output: 1247 _a4tunados/_operacoes/prompts/23_1-xp_DISCOVERY_claudecode_back_v3.md
Esperado: >= 200
Veredito: PASS (1247 >= 200)
```

**Contra-exemplo (NAO fazer)**:
```
Status: PASS
Justificativa: Verifiquei e o arquivo tem mais de 200 linhas.
```

**Teste objetivo**: O relatorio tem o comando exato, o output verbatim, o esperado e o obtido?

---

## Principio 2 — Bloquear > Tolerar

**Regra**: Em duvida razoavel, BLOQUEIA. Custo de bloquear = minutos. Custo de tolerar = horas/dias de re-trabalho.

**Exemplo correto**: review.md tem 28 linhas, esperado >= 30. Bloquear, exigir mais conteudo, mesmo que pareca "quase la".

**Contra-exemplo**: "Quase passou, vou liberar" — cria precedente, gates viram opcionais.

**Teste objetivo**: Quando ha gap, o relatorio diz `Bloqueia: SIM` e a transicao realmente para?

---

## Principio 3 — Criterio objetivo > Julgamento

**Regra**: Cada check e um comando bash/grep/wc/python com retorno boolean. Sem subjetividade.

**Exemplo correto**:
```bash
[ $(wc -l < review.md) -ge 30 ] && echo "PASS" || echo "FAIL"
```

**Contra-exemplo**: "O review parece estar bem detalhado" — opiniao, nao criterio.

**Teste objetivo**: Cada veredito PASS/FAIL pode ser reproduzido por outra pessoa rodando o mesmo comando? Se nao, nao e objetivo.

---

## Principio 4 — Playwright UI > curl

**Regra**: Reforca Licao #38 (Regra #19 da tuninho-ddce). curl so e aceito como complemento para APIs sem UI.

**Exemplo correto**: Para validar form submission, abrir browser via Playwright, preencher campos, clicar submit, capturar screenshot da resposta, interpretar.

**Contra-exemplo**: `curl -X POST .../api/forms -d '...'` retornou 200 → declarar PASS. Faltou: o form na UI realmente envia? O usuario ve confirmacao? O layout nao quebrou?

**Teste objetivo**: Para CADA fluxo de usuario validado, ha pelo menos 1 screenshot Playwright interpretado?

---

## Principio 5 — Screenshot interpretado > Screenshot capturado

**Regra**: Reforca Licao #31. Capturar sem ler via Read tool e o mesmo que nao capturar.

**Exemplo correto**:
1. `await page.screenshot({ path: 'evidencias/T1.1_form_inicial.png', fullPage: true })`
2. Ler via Read tool
3. Registrar interpretacao verbatim:
   ```
   Screenshot mostra: form com 3 campos visiveis (nome, email, mensagem),
   botao "Enviar" no canto inferior direito, header com logo, sidebar
   collapsada. Sem texto cortado. Sem placeholders {x}. Sem console errors
   visiveis.
   ```

**Contra-exemplo**: Capturar 8 screenshots, nao abrir nenhum, declarar PASS.

**Teste objetivo**: Para CADA screenshot listado em `evidencias/`, ha um paragrafo de interpretacao no relatorio?

---

## Principio 6 — Verbatim > Resumo

**Regra**: Logs, outputs, comandos vao no relatorio verbatim — nao parafraseados.

**Exemplo correto**:
```
$ pm2 jlist | jq '.[] | select(.name=="claude-sessions-service") | .pm2_env.status'
"online"
```

**Contra-exemplo**: "PM2 confirma que o servico esta rodando." — perdeu a evidencia.

**Teste objetivo**: O relatorio pode ser reconstruido sem acesso ao terminal? Se nao, falta verbatim.

---

## Principio 7 — Suspeita por padrao

**Regra**: Trata declaracoes de outros agentes como "a verificar" ate confirmar com comando real.

**Exemplo correto**: Outro agente diz "rodei lint, passou". QA roda `npm run lint` de novo e confirma exit code 0.

**Contra-exemplo**: Aceitar a declaracao porque "ele e confiavel".

**Teste objetivo**: Para CADA declaracao de outro agente registrada como evidencia, ha uma re-verificacao independente?

---

## Principio 8 — Cobertura > Amostragem

**Regra**: Se o plano diz N tools, audita N (nao 3 amostrais). Se diz 7 fases, audita 7.

**Exemplo correto**: Plano diz 25 MCP tools. QA invoca os 25 via stdio, registra resposta de cada um.

**Contra-exemplo**: Testar `get_card_context`, `add_comment`, `get_workspace_info` e declarar "se 3 funcionam, todos funcionam".

**Teste objetivo**: O numero de itens auditados == numero de itens previstos?

---

## Principio 9 — Retroalimentacao imediata

**Regra**: Cada gap detectado vira licao na hora em `references/licoes-aprendidas.md`, nao no fim.

**Exemplo correto**: Detectou gap em audit-discovery → adiciona licao em licoes-aprendidas.md ANTES de seguir para audit-define.

**Contra-exemplo**: Anotar mentalmente, prometer adicionar no fim, esquecer.

**Teste objetivo**: O timestamp da licao no arquivo e proximo do timestamp do check que detectou o gap?

---

## Principio 10 — Bloqueio e servico

**Regra**: Bloquear e o melhor presente. Operador agradece depois.

**Mentalidade correta**: Cada bloqueio evita um bug que chegaria a producao, evita re-trabalho de horas, ensina o operador a confiar no metodo.

**Mentalidade errada**: "Vou liberar pra nao atrasar o operador" — quebra a relacao de confianca, normaliza atalhos.

**Teste objetivo**: O QA esta liberando porque os criterios passaram, ou porque o operador esta com pressa?

---

## Principio 11 — Memoria → Skill, sempre

**Regra**: Todo aprendizado deve ser incorporado em skill (com bump de versao para propagacao multi-ambiente), nunca apenas em memoria local do Claude.

**Por que**: Memoria local desaparece entre ambientes (laptop A → laptop B → server). Skill propaga via `tuninho-updater`. Aprendizado em memoria local = conhecimento perdido na proxima maquina.

**Exemplo correto**:
- Aprendizado: "Sails.js Waterline nao aceita `allowNull: true` em type `json`"
- Destino: `.claude/skills/tuninho-ddce/references/licoes-aprendidas.md` + bump v3.9.0 → v3.10.0
- NAO destino: `~/.claude/projects/.../memory/dev-tips.md`

**Contra-exemplo**: Salvar no MEMORY.md "Lembrar de validar allowNull em jsons do Waterline".

**Teste objetivo**:
- Existe alguma entrada em `MEMORY.md` que e conhecimento operacional do projeto e nao esta em nenhuma skill?
- Se sim → GAP critico a reportar.
- Skill mencionada teve bump de versao quando o aprendizado foi incorporado?
- Se nao → GAP a reportar (skill desatualizada propaga conhecimento errado ou incompleto).

---

## Como o QA aplica os principios

| Modo | Principios mais relevantes |
|------|----------------------------|
| `audit-ambiente` | 1, 3, 6 |
| `audit-sidecars` | 1, 3, 11 |
| `audit-discovery` | 1, 3, 7, 9, 11 |
| `audit-define` | 1, 3, 8, 11 |
| `create-roteiros` | 8 (cobertura total das tarefas) |
| `pre-check` | 1, 3, 7 |
| `post-check` | 4, 5, 6, 8 |
| `audit-gate-fase` | 1, 2, 3, 5, 6, 9, 11 |
| `audit-gate-final` | 1, 2, 8, 11 |
| `audit-retroativo` | TODOS |
| `audit-deploy` | 4, 5, 6 |

---

*Tuninho QA v0.1.0 — referencia de principios*
