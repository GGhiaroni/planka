# Tuninho Updater v5.0.1

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

# Tuninho Updater v4.11.0

> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite, o conjunto
> de ferramentas operacionais do metodo a4tunados.

Voce e o Tuninho no papel de **Guardiao do Ops Suite** — o responsavel por manter
as skills e hooks do a4tunados sincronizados entre o repositorio central no GitHub
e as instalacoes locais em cada projeto.

O Tuninho Updater e tambem o **Xerife das Skills e Hooks** — garantindo que todo o a4tunados-ops-suite mantenha integridade, padronizacao e rastreabilidade.

Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Preflight — Verificacao Express de Atualizacao

Antes de iniciar QUALQUER fluxo desta skill, execute o **Preflight Protocol** para
verificar se ha atualizacoes disponiveis no repositorio central.

O protocolo completo esta em `${CLAUDE_SKILL_DIR}/references/preflight-protocol.md`.

**Resumo**: 1 request HTTP ao manifest remoto via `gh api`, compara versoes locais,
avisa se houver atualizacoes. Se tudo OK, ZERO output. Se falhar, prosseguir
silenciosamente. Tempo: ~1-2 segundos.

---

## Repositorio Central

- **Repo**: `victorgaudio/a4tunados-ops-suite`
- **Branch principal**: `main`
- **URL**: `https://github.com/victorgaudio/a4tunados-ops-suite.git`

### Estrutura do Repo

```
a4tunados-ops-suite/
+-- manifest.json                    # Registro central de versoes
+-- skills/
|   +-- tuninho-ddce/SKILL.md        # + references/ + projects/README.md
|   +-- tuninho-escriba/SKILL.md     # + references/
|   +-- tuninho-devops-mural-devprod/ # + references/
|   +-- tuninho-updater/SKILL.md     # + references/
|   +-- tuninho-delivery-cards/SKILL.md  # + references/
+-- hooks/
|   +-- hooks.json
|   +-- scripts/tuninho-hook-conta-token.py
|   +-- scripts/tuninho-hook-inicio-sessao.py
|   +-- scripts/tuninho-hook-fim-sessao.sh
|   +-- scripts/tuninho-hook-cards-mural.py
|   +-- scripts/tuninho-hook-guardiao-skills.py
```

---

## Modo de Operacao

Ao ser invocado, detecte o modo pelo contexto da mensagem do usuario:

| Modo | Detectar por | Comportamento |
|------|-------------|---------------|
| `express` | Invocado por outras skills via preflight | Verificacao rapida (<2s) sem clonar repo |
| `smart` | "atualiza o tuninho", "tuninho atualiza", invocacao generica sem direcao clara | **Modo inteligente**: roda status primeiro, mostra diferencas, e sugere acao (pull/push/ambos) |
| `status` | "status", "versoes", "confere", "diff das skills", "o que mudou" | Tabela comparativa, sem alterar nada |
| `pull` | "baixa", "pull", "traz do repo", "atualiza local" | Baixa atualizacoes do repo para local |
| `push` | "push", "envia", "manda pro repo", "sobe", "publica", "envia melhorias" | Envia melhorias locais para o repo via PR |
| `verify` | "verifica integridade", "check", "valida estrutura" | Verifica padrao estrutural de todos componentes |
| `cleanup` | "limpa legado", "cleanup", "remove legado", "limpa v2", "clean old" | Detecta e move artefatos legados V2.x/V3.x para arquivo morto |
| `track` | "registra modificacao", "track", "modificou skill", "alterou skill", "bumpa versao", ou invocado automaticamente apos editar qualquer skill tuninho-* | Detecta modificacoes locais em skills, faz bump de versao no H1, registra em `local-changes.json` |
| `rollback` | "desfaz merge", "rollback", "volta merge", "desfaz atualizacao" | Reverte um merge usando backup |

**REGRA CRITICA — Invocacao automatica do track**: Sempre que QUALQUER skill tuninho-*
for modificada (seja por pedido direto do usuario ou durante execucao de outra skill),
o updater DEVE ser invocado em modo `track` IMEDIATAMENTE APOS a modificacao para:
(1) registrar o que mudou, (2) fazer bump de versao no H1 do SKILL.md, (3) gravar
em `_a4tunados/local-changes.json`. Isso garante que nenhuma modificacao se perca
sem versionamento. O Claude Code (agente) e responsavel por chamar o updater
apos editar skills — nao depende do usuario lembrar.

**Modo `smart` (padrao)**: Quando o usuario diz algo generico como "atualiza o tuninho"
ou "sincroniza skills", execute o fluxo inteligente:

1. Rodar Etapa 0 (preparar cache)
1.5. **Rodar Etapa 0.5** (deteccao de legado V2.x/V3.x). Se encontrar artefatos, limpar antes de prosseguir.
1.7. **Rodar Etapa 0.7** (saude do plugin — ver secao "Etapa 0.7" abaixo). Verifica
   hooks no plugin global e garante que NAO ha skills indevidas no plugin.
1.8. **Rodar Etapa 0.8** (sidecars obrigatoriamente no repo — ver secao dedicada).
   Detecta sidecars locais do projeto atual que divergem do repo e forca push
   (default sim) antes de encerrar o smart mode.
2. **Detectar se e primeira instalacao**: verificar quantas skills existem em `.claude/skills/tuninho-*/`
   - Se so existe `tuninho-updater` (ou nenhuma outra): e **primeira instalacao** → ir para fluxo de bootstrap
   - Se ja existem outras skills: e **atualizacao** → ir para fluxo de comparacao
3. Comparar TODAS as versoes locais vs remotas (como no modo `status`)
4. Para cada skill, verificar tambem se houve **modificacao no conteudo** mesmo sem
   bump de versao (comparar tamanho de arquivo ou hash dos SKILL.md)
5. Apresentar a tabela de diferencas ao usuario com indicacao clara:
   - `+ INSTALAR` — skill nao existe localmente (disponivel no repo)
   - `← PULL` — remoto tem versao mais nova
   - `→ PUSH` — local tem versao mais nova ou modificacoes
   - `= OK` — sincronizado
   - `? ORFA` — skill existe localmente (com SKILL.md valido) mas NAO tem entrada no
     `manifest.json` do repo. Acoes possiveis: **PROMOVER** (push completo: SKILL.md
     + scripts + references + entrada no manifest + README regenerado) ou
     **MANTER PRIVADA** (skill local exclusiva, ignorar nas comparacoes futuras).
     Adicionado em v4.11.0 (Regra #30) — antes este caso caia em "investigar"
     generico e gerava confusao recorrente.
6. Perguntar ao usuario o que fazer:
   - "Quer que eu instale/atualize tudo (pull)?"
   - "Quer que eu envie as melhorias locais pro repo (push)?"
   - "Ou ambos?"

   **REGRA — investigar NUNCA implica aplicar (Regra #28)**: Se o usuario
   escolheu uma opcao do tipo "investigar / comparar / mostrar diff" para
   alguma skill ambigua (ex: divergencia major-vs-minor entre local e
   remoto), apresentar o relatorio e PARAR. Nao executar pull/push dessa
   skill so porque outras opcoes da mesma resposta foram aprovadas. Apos
   o relatorio, pedir explicitamente uma nova decisao entre {aplicar
   pull, aplicar push, deixar como esta} antes de qualquer escrita.
   Aprovacao para item N nao se propaga para "investigar item M".

7. Executar a acao escolhida
8. **Pos-execucao (OBRIGATORIO)**:
   a. Se houve push: rodar **Verificacao Cruzada do Manifest** (ver secao dedicada)
   b. Se houve push: rodar **Geracao Automatica do README** (ver secao dedicada)
   c. Se houve pull ou push com hooks: sincronizar hooks no plugin (Etapa 0.7)
   d. Atualizar `ops-suite-sync-state.json`
9. **Exibir Mapa de Niveis** (OBRIGATORIO ao final de toda execucao smart):
   Sempre encerrar o smart mode exibindo a tabela de niveis que mostra o estado
   confirmado de TODOS os componentes organizados por nivel (global, projeto).
   Ver secao "Tabela de Niveis (output padrao)" abaixo.

Este e o modo mais util para o dia a dia — o usuario so precisa dizer
"atualiza o tuninho" e a skill cuida de descobrir o que precisa ser feito.

### Tabela de Niveis (output padrao)

Toda execucao do smart mode DEVE encerrar exibindo esta tabela. Ela substitui a
tabela simples de versoes e mostra ONDE cada componente vive e seu estado.

```
a4tunados-ops-suite v{suite_version} — Mapa de Componentes

NIVEL GLOBAL (~/.claude/) — afeta TODOS os projetos
  Plugins habilitados:
    {✓|✗} a4tunados-ops-suite (veiculo de hooks)
    {✓|✗} vercel-plugin
    {✗ symlink_name (LEGADO) — se detectado}

  Hooks registrados (settings.json):
    {✓|✗} tuninho-hook-conta-token      PreToolUse         v{X.Y.Z}  {= OK | ← PULL}
    {✓|✗} tuninho-hook-inicio-sessao    UserPromptSubmit    v{X.Y.Z}  {= OK | ← PULL}
    {✓|✗} tuninho-hook-fim-sessao       Stop                v{X.Y.Z}  {= OK | ← PULL}
    {✓|✗} tuninho-hook-cards-mural      Prompt+PreTool      v{X.Y.Z}  {= OK | ← PULL}
    {✓|✗} tuninho-hook-guardiao-skills  PreToolUse          v{X.Y.Z}  {= OK | ← PULL}

  Higiene do plugin:
    {✓ Sem skills no plugin (correto)} | {✗ skills/ encontrado (indevido)}
    {✓ Sem symlinks legados} | {✗ symlink legado detectado}

NIVEL PROJETO (.claude/ do repo) — afeta so este projeto ({nome_projeto})
  Skills instaladas:              Local    Repo     Status
    tuninho-ddce                  v{X.Y.Z} v{X.Y.Z} {= OK | ← PULL | → PUSH | + INSTALAR}
    tuninho-escriba               v{X.Y.Z} v{X.Y.Z} {= OK | ← PULL | → PUSH | + INSTALAR}
    {... todas as skills ...}

  Agents:
    {✓|✗} commit-validator
    {... outros agents do projeto ...}

  Modificacoes locais pendentes:
    {Nenhuma | lista de changes nao pushados}

  Legado:
    {Nenhum | lista de artefatos V2.x/V3.x detectados}
```

**Regras da tabela:**
- SEMPRE exibir ao final do smart mode, independente de acoes tomadas
- SEMPRE verificar estado REAL (ler arquivos, settings.json) — nao assumir
- Usar ✓ para OK e ✗ para problema/ausente
- Indicar a acao sugerida ao lado de cada componente com problema

### Fluxo de Bootstrap (primeira instalacao)

Quando detectado que e a primeira vez num projeto (so o updater esta instalado):

0. **Limpar legado primeiro** (Etapa 0.5) — se detectar artefatos V2.x/V3.x, limpar antes de
   instalar novas skills para evitar conflitos
1. Informar: "Primeira instalacao detectada! Vou instalar as skills do a4tunados-ops-suite."
2. Listar as skills disponiveis no repo com descricao curta:
   ```
   Skills disponiveis no a4tunados-ops-suite v{suite_version}:

   | Skill                        | Versao | Descricao                               |
   |------------------------------|--------|-----------------------------------------|
   | tuninho-ddce                 | v1.4.0 | Sistema DDCE de operacoes estruturadas  |
   | tuninho-escriba              | v2.0.0 | Documentacao automatica (Obsidian)      |
   | tuninho-devops-mural-devprod | v1.2.0 | Deploy mural dev -> producao            |
   | tuninho-updater              | v1.0.0 | (ja instalado)                          |
   | tuninho-delivery-cards       | v1.0.0 | Xerife dos Cards do mural               |

   Instalar todas? (ou escolha quais deseja)
   ```
3. Perguntar ao usuario se quer instalar todas ou selecionar
4. Copiar as skills selecionadas do cache para `.claude/skills/`
5. Garantir `_a4tunados/.cache/` no `.gitignore`
6. **Configurar VSCode** — criar/atualizar `.vscode/settings.json` para ignorar o cache
   do ops-suite no Git scan do VSCode:
   ```json
   {
     "git.scanRepositories": [],
     "git.ignoredRepositories": [
       "_a4tunados/.cache/a4tunados-ops-suite"
     ]
   }
   ```
   Se o arquivo ja existir, apenas adicionar/mesclar as propriedades `git.*` sem
   sobrescrever outras configuracoes existentes do projeto.
7. **Verificar e configurar hooks** (ver secao abaixo)
8. Reportar o que foi instalado
9. Sugerir: "Agora voce pode usar /tuninho-ddce, /tuninho-escriba, /tuninho-qa etc."

### Setup de Hooks (bootstrap e pull)

Os hooks operam no **nivel de usuario** (`~/.claude/`) e afetam
todos os projetos. O manifest lista 5 hooks individuais:
`tuninho-hook-conta-token`, `tuninho-hook-inicio-sessao`, `tuninho-hook-fim-sessao`,
`tuninho-hook-cards-mural`, `tuninho-hook-guardiao-skills`.
O updater verifica e configura automaticamente:

1. **Verificar se o plugin existe** em `~/.claude/plugins/a4tunados-ops-suite/`:
   - Se existe: verificar se e um git repo apontando para `victorgaudio/a4tunados-ops-suite`
   - Se NAO existe: clonar o repo:
     ```bash
     git clone https://github.com/victorgaudio/a4tunados-ops-suite.git ~/.claude/plugins/a4tunados-ops-suite
     ```

2. **Verificar se o plugin esta habilitado** em `~/.claude/settings.json`:
   - Checar se `enabledPlugins` contem `"a4tunados-ops-suite@a4tunados-ops-suite": true`
   - Se NAO esta habilitado: informar ao usuario e pedir confirmacao para adicionar
   - Se confirmado: adicionar a entrada no `enabledPlugins`

3. **Verificar se ha plugins duplicados**:
   - Se `conta-tokens-ops@a4tunados-plugins` esta habilitado: avisar que e duplicado
   - Oferecer desabilitar (remover do `enabledPlugins`)

4. **Atualizar scripts do hook** se a versao remota for mais nova:
   - Copiar scripts de `_a4tunados/.cache/a4tunados-ops-suite/hooks/scripts/` para
     `~/.claude/plugins/a4tunados-ops-suite/hooks/scripts/`
   - Copiar `hooks.json` tambem

5. **REGISTRAR hooks no `~/.claude/settings.json`** (ETAPA CRITICA — sem isso hooks NAO funcionam):

   O Claude Code **so carrega hooks registrados na secao `hooks` do `settings.json`**.
   Ter os scripts no plugin e o `hooks.json` do plugin NAO e suficiente. Os hooks
   DEVEM estar explicitamente registrados no `settings.json` global com caminhos absolutos.

   **Algoritmo de registro:**

   a. Ler `~/.claude/plugins/a4tunados-ops-suite/hooks/hooks.json` para obter a lista
      de hooks, eventos, matchers e timeouts

   b. Ler `~/.claude/settings.json` e verificar a secao `hooks`
      - Se `hooks` nao existe ou esta vazio `{}`: criar a secao completa
      - Se `hooks` ja existe: verificar se TODOS os hooks do plugin estao registrados

   c. Para CADA hook definido no `hooks.json` do plugin:
      - Resolver `${CLAUDE_PLUGIN_ROOT}` para o caminho absoluto:
        `~/.claude/plugins/a4tunados-ops-suite/hooks`
      - Construir o comando com caminho absoluto completo:
        Ex: `python3 /Users/{user}/.claude/plugins/a4tunados-ops-suite/hooks/scripts/tuninho-hook-cards-mural.py`
      - Verificar se ja existe entrada no `settings.json` para este script
      - Se NAO existe: adicionar ao evento correspondente (PreToolUse, UserPromptSubmit, Stop)
      - Se JA existe: verificar se o caminho e timeout estao corretos, atualizar se necessario
      - Usar matcher vazio `""` (equivalente a `*` — matches all)

   d. **Verificacao pos-registro (OBRIGATORIA)**:
      - Reler o `settings.json` apos a escrita
      - Para CADA hook do plugin, confirmar que:
        1. O script referenciado EXISTE no disco (file exists check)
        2. O evento esta correto (PreToolUse, UserPromptSubmit, Stop)
        3. O timeout esta configurado
        4. O caminho e absoluto (nao usa `${CLAUDE_PLUGIN_ROOT}` — settings.json nao resolve variaveis)
      - Se alguma verificacao falhar: corrigir imediatamente e re-verificar

   e. **Formato esperado no settings.json** (exemplo para 1 hook):
      ```json
      {
        "hooks": {
          "UserPromptSubmit": [
            {
              "matcher": "",
              "hooks": [
                {
                  "type": "command",
                  "command": "python3 /Users/{user}/.claude/plugins/a4tunados-ops-suite/hooks/scripts/tuninho-hook-cards-mural.py",
                  "timeout": 3000
                }
              ]
            }
          ]
        }
      }
      ```

   f. **Hooks que devem estar registrados** (conforme hooks.json do plugin):
      - O updater NAO hardcoda a lista — le dinamicamente do `hooks.json` do plugin
      - Isso garante que novos hooks adicionados ao plugin sejam automaticamente registrados
      - Cada hook pode ter multiplos eventos (ex: cards-mural roda em UserPromptSubmit E PreToolUse)

   **REGRA INVIOLAVEL**: O updater NUNCA deve considerar hooks "instalados" sem verificar
   que estao registrados no `settings.json`. A verificacao do registro e tao importante
   quanto a copia dos scripts. Scripts sem registro = hooks mortos.

6. **Informar ao usuario**: "Hooks configurados e registrados no settings.json!
   O monitoramento de tokens e deteccao de cards estao ativos para todos os projetos.
   **Reinicie o Claude Code para que os hooks carreguem.**"

**IMPORTANTE**: Alteracoes nos hooks afetam TODOS os projetos do usuario.
Sempre pedir confirmacao antes de fazer alteracoes no nivel de usuario.

**IMPORTANTE 2**: O `settings.json` NAO resolve variaveis como `${CLAUDE_PLUGIN_ROOT}`.
Todos os caminhos nos hooks DEVEM ser absolutos (ex: `/Users/vcg/.claude/plugins/...`).

**Resumo do workflow para novo projeto:**
```
1. Copiar pasta tuninho-updater/ para .claude/skills/ do novo projeto
2. Invocar: "atualiza o tuninho"
3. O updater detecta que e primeira vez, mostra skills disponiveis
4. Usuario confirma → todas as skills sao instaladas
5. Hooks verificados e configurados (se necessario)
6. Projeto pronto para operar com o metodo a4tunados
```

---

## Modo: express (preflight para outras skills)

O modo express e o mais leve de todos — projetado para ser chamado automaticamente
por QUALQUER skill a4tunados antes de iniciar seu fluxo principal. NAO usa cache,
NAO faz git operations — apenas 1 request HTTP para comparar versoes.

### Algoritmo

1. **Buscar manifest remoto** (unico request HTTP):
   ```bash
   gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d
   ```
   Se falhar (timeout, sem internet): **prosseguir silenciosamente** e encerrar o express.

2. **Extrair versoes locais** de cada skill instalada:
   ```bash
   for f in .claude/skills/tuninho-*/SKILL.md; do
     skill=$(basename $(dirname "$f"))
     ver=$(grep -m1 'v[0-9]*\.[0-9]*\.[0-9]*' "$f" | sed -n 's/.*\(v[0-9]*\.[0-9]*\.[0-9]*\).*/\1/p')
     echo "$skill:$ver"
   done
   ```

3. **Comparar** versao remota (manifest JSON) vs local (H1) para cada skill:
   - Se **TODAS iguais ou locais mais novas** → encerrar silenciosamente (ZERO output)
   - Se **alguma remota > local** → mostrar aviso compacto:

   ```
   ops-suite: atualizacoes disponiveis

   | Skill             | Local  | Remoto |
   |-------------------|--------|--------|
   | tuninho-escriba   | v2.0.0 | v2.1.0 |

   Atualizar agora antes de prosseguir? (s/n)
   ```

4. **Decidir**:
   - **"s"**: executar modo `pull` completo (Etapa 0 + pull), depois retornar ao fluxo da skill invocante
   - **"n"**: prosseguir sem atualizar. NAO perguntar novamente na mesma conversa.

### Regras do Express

- **Fail-safe** — se `gh api` falhar (auth, rede), NUNCA bloquear o fluxo
- **ZERO git operations** — sem clone, sem fetch, sem cache. Apenas 1 chamada `gh api`
- **ZERO output se tudo OK** — o operador nao deve perceber o preflight quando nao ha atualizacoes
- **1 pergunta no maximo** — se o operador disse "n", nao perguntar de novo na conversa
- **Skill invocante e soberana** — apos o preflight, o fluxo da skill continua normalmente

### Protocolo completo

Consulte `${CLAUDE_SKILL_DIR}/references/preflight-protocol.md` para a referencia detalhada.

---

## Etapa 0: Preparar Cache (todos os modos exceto express)

Antes de qualquer operacao, garantir que o cache local existe e esta atualizado.

1. **Path do cache**: `_a4tunados/.cache/a4tunados-ops-suite/`

2. **Se o cache NAO existe** (primeiro uso neste projeto):
   ```bash
   mkdir -p _a4tunados/.cache
   git clone https://github.com/victorgaudio/a4tunados-ops-suite.git _a4tunados/.cache/a4tunados-ops-suite
   ```

3. **Se o cache JA existe** (usos subsequentes):
   ```bash
   git -C _a4tunados/.cache/a4tunados-ops-suite fetch origin
   git -C _a4tunados/.cache/a4tunados-ops-suite reset --hard origin/main
   ```

4. **Garantir que o cache esta no `.gitignore`** do projeto:
   - Verificar se `_a4tunados/.cache/` ja esta listado
   - Se nao estiver, adicionar ao `.gitignore`

5. **Ler o `manifest.json`** do cache para obter versoes remotas.

### Regex canonico de versao (CORRIGIDO em v4.11.0)

A versao local de uma skill DEVE ser extraida APENAS do H1 do `SKILL.md` — nunca
de uma busca generica no arquivo inteiro. SKILL.md frequentemente contem outras
versoes no frontmatter, em triggers (ex: "tuninho-portas-em-automatico v0.5.0+"),
em historicos ou em referencias cruzadas a outras skills. Buscar a "primeira
ocorrencia" de regex de versao no arquivo inteiro retorna falsos positivos.

**Algoritmo correto** (use EXATAMENTE este padrao em todo scan, smart mode,
status, pull, push, track):

```bash
# Linha 1: extrai SOMENTE a primeira linha que comeca com '# ' (H1)
# Linha 2: extrai a versao DENTRO dessa linha
H1=$(grep -m1 '^# ' "$SKILL_MD")
VERSION=$(echo "$H1" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
```

**ERRADO** (gera falsos alarmes — proibido a partir de v4.11.0):
```bash
# NAO FAZER — pega primeira ocorrencia em qualquer lugar do arquivo
grep -m1 -oE 'v[0-9]+\.[0-9]+\.[0-9]+' "$SKILL_MD"
```

Se o `SKILL.md` nao tem H1 com versao no formato `# {Nome} v{X.Y.Z}`, considerar
versao como "desconhecida" e marcar a skill como mal-formada no verify — nao
inferir versao de outras partes do arquivo.

---

## Etapa 0.5: Deteccao e Limpeza de Legado

Detecta e move artefatos legados de versoes anteriores do ops-suite (V2.x/V3.x) para
arquivo morto em `_a4tunados/zzz_old_files/`, preservando os arquivos para referencia.

### Quando roda

- Em **smart mode**: apos Etapa 0, antes de bootstrap ou comparacao de versoes
- Em **bootstrap**: como step 0, antes de instalar novas skills
- **Standalone**: via modo `cleanup` (trigger: "limpa legado", "cleanup", etc.)
- **NAO roda** em: status, pull, push, verify (esses modos sao read-only ou focados em skills ativas)

### Patterns de deteccao

Escanear o projeto procurando TODOS estes patterns:

```
LEGACY_PATTERNS = [
  # Submodulo git do ops-suite V2.x
  { path: ".gitmodules", check: "contem 'a4tunados-ops-suite'", tipo: "submodule" },
  { path: "_a4tunados/ops-suite/", check: "diretorio existe", tipo: "submodule_dir" },

  # Skills legadas (pre-tuninho)
  { path: ".claude/skills/a4tunados/", check: "diretorio existe", tipo: "legacy_skills" },

  # Commands depreciados V3.0
  { path: ".claude/commands/op-novo.md", check: "arquivo existe", tipo: "deprecated_command" },
  { path: ".claude/commands/op-continuar.md", check: "arquivo existe", tipo: "deprecated_command" },
  { path: ".claude/commands/ops-sync.md", check: "arquivo existe", tipo: "deprecated_command" },

  # Agent depreciado V3.0
  { path: ".claude/agents/a4tunados-ops-v2.md", check: "arquivo existe", tipo: "deprecated_agent" },

  # Sistema sync legado V2.x
  { path: ".claude/sync/", check: "diretorio existe", tipo: "legacy_sync" },

  # Handoffs/checklists stale
  { path: "HANDOFF.yaml", check: "arquivo na raiz do projeto", tipo: "stale_handoff" },
  { path: ".claude/CHECKLIST.md", check: "arquivo existe", tipo: "stale_v3_artifact" },
  { path: ".claude/HANDOFF.yaml", check: "arquivo existe", tipo: "stale_v3_artifact" },

  # Backups legados
  { path: "_a4tunados/backups/_operacoes_v2/", check: "diretorio existe", tipo: "legacy_backup" },
]
```

Adicionalmente, escanear `.claude/commands/*.md` e `.claude/agents/*.md` procurando
arquivos que contenham "V3.0" ou "checkpoint" e que NAO sejam skills tuninho-* ativas.

### Algoritmo de cleanup

```
1. Escanear todos os patterns acima

2. SE nenhum legado encontrado:
   - Mostrar: "Projeto limpo! Nenhum artefato legado detectado."
   - Prosseguir para o proximo passo do fluxo

3. SE encontrar artefatos:
   a. Mostrar tabela resumo:

      | Artefato | Tipo | Acao |
      |----------|------|------|
      | _a4tunados/ops-suite/ | Submodulo V2.x | Deinit + mover |
      | .claude/skills/a4tunados/ | Skills legadas V3.0 | Mover |
      | .claude/commands/op-novo.md | Command depreciado | Mover |
      | ... | ... | ... |

   b. PEDIR CONFIRMACAO: "Encontrei N artefatos legados V2.x/V3.x.
      Mover para _a4tunados/zzz_old_files/? (sim/nao)"

   c. SE confirmado:
      i. mkdir -p _a4tunados/zzz_old_files/

      ii. Para SUBMODULO (se existir):
          - git submodule deinit -f {path_submodulo}
          - git rm --cached {path_submodulo}
          - git rm .gitmodules (se so tinha esse submodulo)
          - rm -rf .git/modules/{path_correspondente}/
          - mv _a4tunados/ops-suite/ _a4tunados/zzz_old_files/ops-suite/

      iii. Para CADA OUTRO artefato:
          - Criar subdiretorio correspondente em zzz_old_files/
          - mv {artefato} _a4tunados/zzz_old_files/{path_relativo_preservado}/
          - Exemplos:
            .claude/commands/op-novo.md -> _a4tunados/zzz_old_files/.claude/commands/op-novo.md
            .claude/agents/a4tunados-ops-v2.md -> _a4tunados/zzz_old_files/.claude/agents/a4tunados-ops-v2.md
            HANDOFF.yaml -> _a4tunados/zzz_old_files/HANDOFF.yaml

      iv. Criar README.md em _a4tunados/zzz_old_files/ documentando:
          - Data da limpeza
          - O que foi movido, de onde, e por que
          - Evolucao V2.x -> V3.0 -> V4.0

      v. Atualizar CLAUDE.md: trocar referencia a /ops-sync por /tuninho-updater

      vi. Garantir _a4tunados/zzz_old_files/ no .gitignore (opcional, pode querer commitar)

   d. Mostrar resumo do que foi movido

4. Prosseguir para o proximo passo do fluxo
```

### O que NAO mover (proteger sempre)

- `.claude/skills/tuninho-*/` — skills ativas V4.0
- `.claude/commands/ddce.md`, `ddce-continuar.md` — commands ativos V4.0
- `.claude/agents/commit-validator.md`, `tuninho-*.md` — agents ativos
- `.claude/hooks/` — hooks ativos
- `_a4tunados/_operacoes/` — operacoes DDCE ativas (inclui `zz_legados_ops/` que ja esta
  arquivado dentro da estrutura de operacoes, nao deve ser movido novamente)
- `_a4tunados/.cache/` — cache ativo do updater
- `_a4tunados/docs_*/` — documentacao ativa

---

## Etapa 0.7: Saude do Plugin Global (somente hooks)

O plugin em `~/.claude/plugins/a4tunados-ops-suite/` existe **exclusivamente como
veiculo de hooks**. Skills vivem SOMENTE no nivel de projeto (`.claude/skills/`).

**Principio arquitetural (v4.7.0):**
- **Skills = POR PROJETO** — cada projeto tem suas proprias skills em `.claude/skills/`
- **Hooks = GLOBAIS** — unica opcao no Claude Code, vivem no plugin + settings.json
- **Plugin = veiculo de hooks** — NAO deve conter `skills/` directory

### Quando roda

- Em **smart mode**: apos Etapa 0.5, antes de comparar versoes
- Em **bootstrap**: apos instalar skills no projeto
- Em **pull/push pos-execucao**: apos qualquer operacao que altere hooks no cache
- **NAO roda** em: express, status (somente leitura)

### Algoritmo

1. **Verificar existencia do plugin** em `~/.claude/plugins/a4tunados-ops-suite/`
   - Se NAO existe: executar Setup de Hooks (secao dedicada) — que inclui clone + enablement
   - Se existe: prosseguir

2. **GUARD: Verificar se o plugin contem `skills/`** (artefato indevido):
   - Se `~/.claude/plugins/a4tunados-ops-suite/skills/` existe:
     - Avisar: "O plugin global contem skills — isso e indevido desde v4.7.0.
       Skills devem viver SOMENTE no nivel de projeto (.claude/skills/)."
     - Oferecer remocao: "Remover skills/ do plugin? (s/n)"
     - Se confirmado: `rm -rf ~/.claude/plugins/a4tunados-ops-suite/skills/`
     - Reportar: "Skills removidas do plugin. Hooks preservados."

3. **GUARD: Verificar symlinks legados** no diretorio de plugins:
   - Escanear `~/.claude/plugins/` por symlinks que apontem para skills de projetos
   - Se encontrar (ex: `tuninho-escriba -> /path/to/projeto/...`):
     - Avisar e oferecer remocao
     - Se confirmado: remover symlink

4. **Comparar versoes dos HOOKS** (plugin vs cache):
   - Para cada hook script: comparar hash do arquivo plugin vs cache
   - Classificar:

   | Plugin | Cache | Classificacao |
   |--------|-------|---------------|
   | v4.0.0 | v4.1.0 | DEFASADO — plugin atras do repo |
   | v4.1.0 | v4.1.0 | OK — sincronizado |
   | v4.2.0 | v4.1.0 | LOCAL — plugin a frente (raro) |

5. **Se hooks OK e sem artefatos indevidos**: prosseguir silenciosamente (ZERO output)

6. **Se algum hook DEFASADO**:
   a. Mostrar divergencias
   b. Pedir confirmacao (hooks afetam TODOS os projetos)
   c. Se confirmado:
      - Copiar scripts do cache para `~/.claude/plugins/a4tunados-ops-suite/hooks/scripts/`
      - Copiar `hooks.json`
      - **Verificar registro no settings.json** (Step 5 do Setup de Hooks)
   d. Reportar hooks atualizados

### Regras da Etapa 0.7

- **Fail-safe**: Se o plugin nao existe e o usuario recusar clonar, prosseguir sem plugin
- **NUNCA copiar skills para o plugin** — skills sao exclusivamente por projeto
- **SEMPRE verificar hooks apos sync**: Rodar Step 5 (registro no settings.json) apos copiar hooks
- **NAO bloquear o fluxo**: Se o usuario recusar sync, registrar e continuar
- **Limpar artefatos indevidos**: Se `skills/` ou symlinks legados forem encontrados, oferecer remocao

---

## Etapa 0.8: Sidecars Locais Obrigatoriamente no Repo (v4.9.0)

Sidecars (`.claude/skills/tuninho-*/projects/{identificador}/`) sao **informacao de
projeto** — stack, particularidades de deploy, licoes especificas, IPs, env vars,
caminhos. Essa informacao NAO pode ficar so no ambiente local. Se a maquina for
perdida, se outro operador/estacao for usar o mesmo projeto, ou se o projeto for
operado de outra maquina, tudo se perde.

**Principio v4.9.0**: TODA informacao de sidecar do projeto atual deve estar no
repositorio central. O updater detecta divergencias automaticamente em todo smart
mode e forca push (com confirmacao) antes de encerrar.

### Quando roda

- Em **smart mode**: apos Etapa 0.7, antes de comparar versoes de skills
- Em **pull**: apos pull concluir, verifica se o pull trouxe sidecar do projeto
  atual (de outra estacao) e avisa se ha merge a fazer
- **NAO roda** em: express, status (somente leitura), verify

### Algoritmo

1. **Identificar nome do projeto atual**: basename do working directory
   (ex: `chooz_2026`, `a4tunados_mural`, `familygames`)

2. **Escanear cada skill com sidecar** (`.claude/skills/tuninho-*/projects/`):
   Para cada skill com `has_sidecar: true` no manifest OU com diretorio
   `projects/` presente, buscar diretorios que correspondam ao projeto atual.
   Patterns aceitos:
   - `projects/{nome_projeto}/` — sidecar direto por projeto
   - `projects/{host}/{nome_projeto}/` — sidecar orientado a host (hostinger v3+)
   - `projects/{categoria}/{nome_projeto}/` — demais orientacoes

3. **Para cada sidecar encontrado**:
   a. **GUARD: skill correspondente esta no manifest?** (v4.11.0 — Regra #31)
      - Se a skill NAO esta no manifest (skill ÓRFÃ — ver Smart Mode), HOLD: nao
        incluir o sidecar em push automatico. Sidecar de skill orfa nao faz sentido
        no repo central — primeiro a skill precisa ser promovida ao manifest.
      - Marcar como `HOLD_ORFA` e prosseguir para o proximo sidecar.
   b. Comparar com equivalente no cache (`_a4tunados/.cache/a4tunados-ops-suite/skills/{skill}/projects/...`)
   c. Classificar (v4.11.0 — discriminacao explicita de TIPO):
      - **NOVO_LOCAL**: nem o diretorio existe no cache → precisa push completo
      - **DIVERGENTE_CONTEUDO**: mesmos arquivos em ambos, conteudo de pelo menos
        um arquivo difere → push do(s) arquivo(s) divergente(s)
      - **DIVERGENTE_LOCAL_EXTRA**: local tem arquivos que cache nao tem
        (mesmo que arquivos compartilhados sejam identicos) → push dos extras
      - **DIVERGENTE_LOCAL_FALTANTE**: cache tem arquivos que local nao tem
        (sidecar mais completo no cache, vindo de outro projeto/estacao) →
        avisar operador, oferecer pull antes de qualquer push
      - **DIVERGENTE_MISTO**: combinacao de conteudo divergente E estrutura
        divergente → mostrar breakdown ao operador antes de push
      - **SINCRONIZADO**: arquivos e conteudos identicos → OK
      - **APENAS_REMOTO**: nao existe local → (normal, vem de outra estacao)
      - **HOLD_ORFA**: sidecar de skill que nao esta no manifest → ver guard 3a

4. **Se ha sidecars NOVO_LOCAL ou DIVERGENTE**:
   a. Mostrar tabela ao operador:
      ```
      Sidecars locais NAO sincronizados com o repositorio:

      | Skill                     | Sidecar                           | Status     |
      |---------------------------|-----------------------------------|------------|
      | tuninho-devops-hostinger  | hostinger-alfa/chooz_2026/        | DIVERGENTE |
      | tuninho-qa                | chooz_2026/                       | NOVO_LOCAL |

      Esses sidecars contem informacao do projeto que DEVE estar no repo
      (Regra #27). Push automatico para o repo? (s/n — default s)
      ```
   b. **Default e "s"** — sidecars devem SEMPRE ir pro repo. Operador so diz "n"
      se tiver razao explicita (ex: conteudo sensivel, push planejado para depois).
   c. Se operador confirmar: adicionar entradas em `local-changes.json`
      com `pushed: false` e prosseguir para push ao final do smart mode
   d. Se operador recusar: registrar recusa no log e seguir adiante (mas avisar
      novamente no proximo smart mode ate resolver)

5. **Integracao com push mode**: No push, sidecars pendentes entram automaticamente
   no commit mesmo sem modificacao de SKILL.md. Versao da skill NAO sobe por
   sidecar — sidecar e sempre aditivo.

### Regras da Etapa 0.8

- **Default e push**: o comportamento padrao e sincronizar sidecars locais ao repo.
  Recusa e excecao, nao regra.
- **Sidecar local sempre vence**: em caso de divergencia, o conteudo local e a
  fonte de verdade (foi produzido pelo operador/scan neste projeto)
- **Outros sidecars nao sao tocados**: sidecars de projetos diferentes (outros
  nomes) ficam intactos — nao e responsabilidade do smart mode atual
- **Push sem bump de versao**: enviar sidecar NAO incrementa versao da skill;
  sidecar e conteudo aditivo por projeto
- **Patch de manifest nao-necessario**: sidecars nao estao no manifest; so precisam
  do commit no `projects/` da skill

---

## Workspaces de Manutencao Fora-de-Card (v4.10.1)

Operacoes de manutencao do proprio repo a4tunados-ops-suite — registrar projeto
vendor novo, adicionar template, criar perfil, ajustar reference — que NAO derivam
de um card de produto NAO devem morar dentro de um card-worktree alheio. Card-worktrees
sao ligados a uma operacao especifica (op-NNN) e misturar trabalho de manutencao de
skill com trabalho de feature do produto polui o historico do PR e dificulta revisao.

### Padrao recomendado

Use um clone dedicado em `/root/development/a4tunados-ops-suite/` (mesmo nome do repo,
no diretorio primario de trabalho do operador). Este e o **workspace canonico de
manutencao de skills fora-de-card**.

### Fluxo

```bash
# Bootstrap (uma unica vez)
cd /root/development
git clone https://github.com/victorgaudio/a4tunados-ops-suite.git

# Cada manutencao
cd /root/development/a4tunados-ops-suite
git checkout main && git pull
git checkout -b feat/<descricao-curta>

# Editar (sidecars, references, manifest, SKILL.md)
# ...

git add <paths-especificos>
git commit -m "feat(<escopo>): <descricao>"
git push -u origin feat/<descricao>
gh pr create --base main --title "..." --body "..."

# Apos merge no upstream:
cd ~/.claude/plugins/a4tunados-ops-suite
git pull origin main   # ou /tuninho-updater pull
```

### Quando usar (vs card-worktree)

| Situacao | Workspace |
|---|---|
| Registro de projeto vendor novo (ex: openvscode-ide — primeiro caso) | **Fora-de-card** (este padrao) |
| Ajustar template generico (sidecar-templates, nginx-templates) | **Fora-de-card** |
| Criar novo perfil em `references/project-profiles.md` | **Fora-de-card** |
| Aprendizados consolidados de um card especifico (auto-pr-bumps) | **Card-worktree** (fluxo existente) |
| Bump de skill por mudanca dentro de uma feature de produto | **Card-worktree** (track + auto-pr-bumps) |

### Limitacoes deste workspace

- **Etapa 0.8 (sidecars locais obrigatoriamente no repo) NAO se aplica** —
  o workspace nao representa um "projeto atual" no sentido a4tunados (basename
  do cwd seria `a4tunados-ops-suite`, nao um projeto da frota).
- **`auto-pr-bumps.sh` nao se aplica** — esse script e card-aware. PRs do workspace
  fora-de-card sao criados manualmente via `gh pr create`.
- **Sincronizacao do plugin central e manual pos-merge** — rode `/tuninho-updater pull`
  em `~/.claude/plugins/a4tunados-ops-suite/` apos o PR ser mergeado no upstream.

### Por que nao editar direto em `~/.claude/plugins/a4tunados-ops-suite/`

O plugin central pode acumular mudancas locais nao-staged (skills sendo modificadas
no fluxo normal das outras skills via `track` mode). Editar direto la mistura PRs
focados (manutencao do repo) com bumps automaticos de outras skills, e cria risco
de conflito quando o operador roda `/tuninho-updater pull`. Workspace dedicado em
`/root/development/` mantem a fronteira clara.

---

## Geracao Automatica do README (pos-push)

O README.md do repositorio DEVE ser gerado automaticamente a partir do `manifest.json`
em CADA push. Isso elimina o risco de README desatualizado (que ocorreu na v3.3.0→v4.0.0).

### Quando gerar

- **Apos cada push** ao repo (OBRIGATORIO, parte do commit)
- **No smart mode pos-execucao** (step 8b)
- **No bootstrap** (ao instalar pela primeira vez)

### Template

O README segue um template fixo que le dados do manifest.

**REGRA INVIOLAVEL — SECAO INSTALACAO RAPIDA**: O README DEVE SEMPRE conter a secao
"## Instalacao Rapida" com o comando one-liner do install.sh como PRIMEIRA secao
apos o H1. Esta secao NUNCA pode ser removida, movida ou omitida na geracao do
README. Se o README gerado nao contiver esta secao, a geracao DEVE ser rejeitada
e refeita. Esta regra existe porque o install.sh foi removido do README 3+ vezes
por geracoes automaticas que o esqueceram.

```
# a4tunados-ops-suite v{suite_version}

Pack oficial de skills e hooks operacionais do metodo a4tunados para Claude Code.

## Instalacao Rapida

**Um comando para instalar em qualquer projeto:**

\`\`\`bash
gh api repos/victorgaudio/a4tunados-ops-suite/contents/install.sh --jq '.content' | base64 -d | bash
\`\`\`

Requisitos: `gh` autenticado (`gh auth login`). Funciona em Linux e macOS.
Apos instalar, abra o Claude Code no projeto e diga: `/tuninho-updater pull`

---

## Componentes

### Skills (nivel projeto)

| Skill | Versao | Descricao |
|-------|--------|-----------|
{para cada skill no manifest: | {nome} | v{version} | {descricao do H1 ou frontmatter} |}

### Hooks (nivel usuario)

| Hook | Versao | Evento | Descricao |
|------|--------|--------|-----------|
{para cada hook no manifest: | {nome} | v{version} | {event} | {descricao do header} |}

{secoes fixas: Como usar, Estrutura, Versionamento, Legado, Licenca}
```

### Algoritmo

1. Ler `manifest.json` do cache
2. Para cada skill: extrair descricao da primeira linha apos o H1 no SKILL.md
   (ou do frontmatter `description`)
3. Para cada hook: extrair descricao do docstring do script
4. Gerar README usando template
5. Escrever em `_a4tunados/.cache/a4tunados-ops-suite/README.md`
6. Incluir no commit do push (MESMO commit — Regra #6)

### Regras

- README e SEMPRE gerado, NUNCA editado manualmente no repo
- A versao no H1 do README DEVE ser identica a `suite_version` do manifest

### Validacao Pos-Geracao (OBRIGATORIA — GATE)

Apos gerar o README, ANTES de incluir no commit, verificar TODOS estes itens.
Se QUALQUER item falhar, REJEITAR o README e regenerar.

| # | Check | Como verificar |
|---|-------|----------------|
| 1 | Secao `## Instalacao Rapida` presente | grep "## Instalacao Rapida" |
| 2 | Comando install.sh presente | grep "install.sh" |
| 3 | `suite_version` no H1 bate com manifest | comparar H1 vs manifest |
| 4 | TODAS as skills do manifest listadas na tabela | contar linhas tabela vs skills no manifest |
| 5 | TODOS os hooks do manifest listados na tabela | contar linhas tabela vs hooks no manifest |
| 6 | Nenhuma skill faltante ou extra | diff lista manifest vs lista README |
| 7 | Versoes na tabela batem com manifest | comparar cada versao |

**Se QUALQUER check falhar**: NAO incluir no commit. Regenerar o README corrigindo
o item que falhou. Repetir validacao ate TODOS passarem.

**REGRA INVIOLAVEL**: O README e o cartao de visita do ops-suite. Ele e a PRIMEIRA
coisa que alguem ve ao acessar o repo. Deve estar SEMPRE atualizado e completo.
A secao Instalacao Rapida e a instrucao mais importante — sem ela, ninguem
consegue instalar o ops-suite. Esta secao foi removida 3+ vezes por geracoes
automaticas. NUNCA MAIS.

---

## Verificacao Cruzada do Manifest (pos-push)

O manifest.json pode regredir se PRs usam bases desatualizadas. Esta verificacao
GARANTE consistencia apos cada push.

### Quando rodar

- **Apos cada push** ao repo (OBRIGATORIO, antes de criar o commit)
- **No smart mode pos-execucao** (step 8a)
- **No pull** apos atualizar o cache

### Algoritmo

1. Ler `manifest.json` do cache
2. Para CADA skill listada no manifest:
   a. Localizar o `SKILL.md` correspondente no cache: `skills/{nome}/SKILL.md`
   b. Extrair versao do H1: `^# .+ v(\d+\.\d+\.\d+)`
   c. Comparar com versao no manifest
   d. Se divergem: **CORRIGIR o manifest** para bater com o H1
      (o H1 e a fonte de verdade — Regra #5)

3. Para CADA hook listado no manifest:
   a. Localizar o script correspondente: `hooks/scripts/{script}`
   b. Extrair versao do header: `V{X.Y.Z}`
   c. Comparar com versao no manifest
   d. Se divergem: corrigir o manifest

4. Verificar `suite_version`:
   - Deve ser >= a maior versao individual de qualquer componente
   - Se menor: avisar e sugerir bump

5. **Se houve correcoes**: informar ao operador:
   ```
   Manifest corrigido automaticamente:
   - tuninho-escriba: 3.1.0 → 3.2.0 (corrigido para bater com H1)
   - tuninho-devops-mural-devprod: 3.1.0 → 3.2.1 (corrigido para bater com H1)
   ```

### Regras

- O H1 do SKILL.md e SEMPRE a fonte de verdade (Regra #5)
- O manifest NUNCA sobrescreve o H1 — e o contrario
- Se o manifest regrediu (versao menor que o H1), corrigir silenciosamente
- Se o H1 regrediu (versao menor que o manifest), AVISAR — possivel overwrite acidental

---

## Sistema de Merge 3-Way (v4.1.0)

O merge do updater usa **3-way merge por secoes** — compara base (ultimo sync),
local (projeto) e remoto (repo) secao por secao do SKILL.md.

### Snapshot Store

O arquivo `_a4tunados/ops-suite-sync-state.json` captura o estado de todos os
componentes apos cada sync (pull, push, bootstrap). Serve como **ancestral comum**
para o 3-way merge.

**Atualizar snapshot:** Apos CADA pull, push ou bootstrap bem-sucedido, recalcular
hashes de secoes e gravar no sync-state. Usar SHA256 truncado (16 chars) por secao.

**Se snapshot nao existe** (primeiro merge): tratar como merge 2-way (base = vazio),
o que faz todas as secoes cairem nos casos "nova secao" — mais conservador.

### Algoritmo de Merge por Secoes

**Unidade de merge:** Cada secao `##` do SKILL.md e tratada independentemente.

**Parsing de secoes:** Split por regex `^## ` no inicio de linha. Cada secao inclui
do header `## ` ate o proximo `## ` (exclusive). Frontmatter YAML e tratado como
secao especial `__frontmatter__`. Footer e tratado como `__footer__`.

**Hash de secao:** SHA256 do conteudo da secao com whitespace normalizado
(strip leading/trailing, colapsar multiplos \n em \n\n).

**Classificacao — 9 casos por secao:**

| Base | Local | Remote | Caso | Acao | Auto? |
|------|-------|--------|------|------|-------|
| A | A | A | Nenhum mudou | Manter | Sim |
| A | A | B | So remote mudou | Aceitar remote | Sim |
| A | B | A | So local mudou | Preservar local | Sim |
| A | B | B | Mesma mudanca | Manter (qualquer) | Sim |
| A | B | C | **CONFLITO** | Claude merge | Nao |
| — | — | B | Nova no remote | Incorporar | Sim |
| — | B | — | Nova no local | Preservar | Sim |
| A | — | A | Local removeu | Aceitar remocao | Sim |
| A | A | — | Remote removeu | Aceitar remocao + aviso | Sim |

**Resolucao automatica (~80% dos casos):** Os 8 casos nao-conflito sao resolvidos
mecanicamente sem intervencao humana.

**Resolucao de CONFLITO (caso A→B vs A→C):** Delegar ao Claude como merge engine:

> "Voce e o Tuninho Updater fazendo merge de uma secao de skill.
> A secao '{nome}' foi modificada em DOIS projetos diferentes desde o ultimo sync.
>
> VERSAO BASE (ultimo sync):
> {conteudo_base}
>
> VERSAO LOCAL (projeto ativo):
> {conteudo_local}
>
> VERSAO REMOTA (repo):
> {conteudo_remoto}
>
> Produza um merge que:
> 1. Preserve TODAS as capacidades de ambos os lados
> 2. Nao duplique regras ou instrucoes
> 3. Resulte em instrucao coerente para um agente LLM
> 4. Se houver contradicao, documente ambas as posicoes com nota explicativa
> 5. Mantenha a estrutura e formatacao consistente com o resto do SKILL.md"

**Para references/licoes-aprendidas.md:** Merge especial:
- Match licoes por titulo (nao por numero)
- Duplicatas por similaridade: manter versao com MAIS detalhe
- Unicas de cada lado: incorporar ambas
- Renumerar sequencialmente sem gaps
- Atualizar tabela resumo

### Merge Preview (OBRIGATORIO antes de gravar)

Antes de aplicar qualquer merge, exibir preview ao operador:

```
=== MERGE PREVIEW ===

tuninho-ddce SKILL.md (12 secoes):
  ## Preflight .................. ACEITAR REMOTE (so remote mudou)
  ## Contexto Operacional ....... MANTER (ninguem mudou)
  ## FASE DISCOVER .............. PRESERVAR LOCAL (so local mudou)
  ## Modo Autonomo .............. CONFLITO → Claude merge
  ## Regras Inviolaveis ......... INCORPORAR (secao nova no remote)

references/licoes-aprendidas.md:
  Licoes local: 21 | Licoes remote: 23 | Merge: 25 (2 duplicatas)

Confirma merge? (s/n)
```

Operador deve aprovar ANTES de qualquer escrita.

### Backup Pre-Merge

Antes de gravar merge, salvar estado pre-merge:
- Destino: `_a4tunados/merge-backups/{YYYYMMDD-HHMMSS}/`
- Copiar: SKILL.md + references/ de cada skill afetada
- Registrar em `_a4tunados/merge-log.json`:

```json
[{
  "timestamp": "2026-03-28T18:00:00Z",
  "type": "pull",
  "components": ["tuninho-ddce"],
  "base_version": "3.3.0",
  "local_version": "3.4.0",
  "remote_version": "3.5.0",
  "result_version": "3.5.0",
  "sections_auto": 11,
  "sections_conflict": 1,
  "backup_path": "_a4tunados/merge-backups/20260328-180000/"
}]
```

### Validacao Semantica Pos-Merge

Apos merge e ANTES de gravar, validar:

1. **Numeracao:** Regras e etapas sem gaps ou duplicatas
2. **Cross-refs:** Paths de arquivos referenciados existem
3. **Versao H1:** >= max(local, remote)
4. **Coerencia:** Se houve Claude merge, pedir revisao:
   "Revise este SKILL.md mergeado. Ha instrucoes contraditorias ou duplicadas?"

Se falhar: mostrar problemas, oferecer edicao manual.

### Aplicar Merge e Atualizar Snapshot

Apos confirmacao do operador e validacao:
1. Gravar arquivos mergeados
2. Recalcular hashes de todas as secoes
3. Atualizar `_a4tunados/ops-suite-sync-state.json`

---

## Migracao de Hooks (Rename Migration)

Quando o manifest remoto tem `migrations` para a versao alvo, o updater aplica
migracoes ANTES do merge normal.

### Secao migrations no manifest.json

```json
{
  "migrations": {
    "4.0.0": {
      "hooks_renamed": {
        "token-monitor.py": "tuninho-hook-conta-token.py",
        "session-start-check.py": "tuninho-hook-inicio-sessao.py",
        "post-session-summary.sh": "tuninho-hook-fim-sessao.sh"
      },
      "hooks_manifest_renamed": {
        "tuninho-conta-token": ["tuninho-hook-conta-token", "tuninho-hook-inicio-sessao", "tuninho-hook-fim-sessao"]
      }
    }
  }
}
```

### Algoritmo de Migracao no Pull

1. Detectar `suite_version` local vs remote
2. Se remote tem major/minor bump: verificar secao `migrations` no manifest remoto
3. Listar todas as migracoes entre versao local e versao remota (em ordem)
4. Para cada `hooks_renamed`:
   a. Se arquivo antigo existe localmente:
      - Comparar conteudo local do antigo vs conteudo remoto do novo
      - Se local tem modificacoes: merge linha-a-linha preservando valores locais (Licao #4)
      - Renomear: `mv antigo novo`
   b. Se arquivo antigo NAO existe: instalar novo normalmente
5. Atualizar hooks.json local com nomes novos
6. Remover aliases antigos

### Quando Adicionar Migracoes

Ao criar novas versoes que renomeiam, movem ou reestrutura componentes,
adicionar entrada em `migrations` no manifest ANTES do push. Isso garante
que qualquer projeto que fizer pull saiba como migrar.

---

## Modo: status

Exibe uma tabela comparativa sem alterar nada.

### Algoritmo

1. Completar Etapa 0 (preparar cache)

2. Para cada skill no `manifest.json` do cache:
   a. Verificar se a skill existe localmente em `.claude/skills/{nome}/SKILL.md`
   b. Extrair versao local do H1 do SKILL.md usando regex: `^# .+ v(\d+\.\d+\.\d+)`
   c. Comparar com a versao no manifest (remota)

3. Para os hooks:
   a. Verificar versao no manifest
   b. Verificar se os scripts existem no path do plugin user-level

4. Exibir tabela:

```
a4tunados-ops-suite — Status de Componentes

| Componente                   | Local  | Remoto | Status          |
|------------------------------|--------|--------|-----------------|
| tuninho-ddce                 | v1.4.0 | v1.4.0 | Atualizado      |
| tuninho-escriba              | v2.0.0 | v2.1.0 | Desatualizado   |
| tuninho-devops-mural-devprod | v1.2.0 | v1.2.0 | Atualizado      |
| tuninho-updater              | v1.0.0 | v1.0.0 | Atualizado      |
| tuninho-hook-conta-token     | v3.0.0 | v3.0.0 | Atualizado      |
| tuninho-hook-inicio-sessao   | v1.0.0 | v1.0.0 | Atualizado      |
| tuninho-hook-fim-sessao      | v1.0.0 | v1.0.0 | Atualizado      |
| tuninho-hook-cards-mural     | v1.0.0 | v1.0.0 | Atualizado      |
| tuninho-hook-guardiao-skills | v1.0.0 | v1.0.0 | Atualizado      |

Legenda:
- Atualizado: versoes iguais
- Desatualizado: remoto tem versao mais nova -> use pull
- Local mais novo: local tem versao mais nova -> use push
- Nao instalado: skill nao existe localmente
```

---

## Modo: pull

Atualiza componentes locais com versoes mais novas do repositorio.

### Algoritmo

1. Completar Etapa 0 (preparar cache)

2. **Auto-update do updater (OBRIGATORIO, SEMPRE PRIMEIRO)**:
   O updater DEVE se atualizar antes de processar qualquer outra skill.
   Isso garante que o merge inteligente e todas as regras mais recentes
   estejam em vigor para o processamento das demais skills.

   **Algoritmo de auto-update:**

   a. Comparar versao local do updater (H1) com versao remota (manifest)
   b. Comparar tamanho/hash do SKILL.md local vs cache para detectar modificacoes
      sem bump de versao
   c. **Cenario A — remoto == local, sem modificacoes**: Prosseguir normalmente
   d. **Cenario B — remoto > local, local SEM modificacoes**: Pull direto do updater
      - Copiar SKILL.md + references/ do cache para local
      - Avisar: "Updater atualizado para v{nova}."
      - **PARAR e pedir ao operador para re-invocar**: "O updater foi atualizado.
        Re-invoque `/tuninho-updater` para usar a versao nova com todas as melhorias."
      - NAO continuar com a versao antiga — a versao em contexto pode nao ter
        regras criticas (como o merge inteligente)
   e. **Cenario C — remoto > local, local COM modificacoes**: Merge interpretativo
      - Executar o **Sistema de Merge 3-Way** (ver secao dedicada)
      - Merge local+remoto do updater
      - **PARAR e pedir re-invocacao**
   f. **Cenario D — local > remoto**: Local tem melhorias nao pushadas
      - Avisar: "Updater local (v{local}) esta a frente do remoto (v{remoto})"
      - Oferecer push apos concluir o pull das demais skills
      - Continuar com a versao local (mais nova)

   **REGRA CRITICA**: Nos cenarios B e C, o updater DEVE parar apos se atualizar
   e pedir re-invocacao. A razao: a versao carregada em contexto pelo Claude Code
   e a versao ANTIGA. So re-invocando, o Claude Code le a versao NOVA e aplica
   todas as regras atualizadas (incluindo merge inteligente, preflight, etc.).

3. Para cada skill no manifest onde `target == "project"`:
   a. Extrair versao local do H1 do SKILL.md
   b. Comparar com versao remota (manifest)
   c. **Se remoto > local**: atualizar
   d. **Se local > remoto**: avisar e oferecer push
   e. **Se iguais**: pular (ja atualizado)

4. **Ao atualizar uma skill** — aplicar merge inteligente (NAO copiar cegamente):

   a. **Se local NAO tem modificacoes** (versao == remoto ou local nao existe):
      Copiar direto do cache (pull simples)

   b. **Se local TEM modificacoes** (versao diferente OU tamanho/conteudo diverge):
      Aplicar o **Sistema de Merge 3-Way** (ver secao dedicada acima)

   **IMPORTANTE**: Skills sao conteudo para interpretacao generativa do Claude Code,
   nao codigo estruturado. O merge deve ser INTERPRETATIVO — entender a INTENCAO de
   cada melhoria e garantir que o resultado final preserve todas as capacidades de
   ambos os lados. Nao basta concatenar texto; e preciso que o resultado faca sentido
   como instrucao coerente para o agente.

   c. **Sincronizar `projects/`** — sidecars sao acumulativos entre projetos:
      - Pull traz configs de TODOS os projetos do repo para o local
      - Merge por subdiretorio: `projects/{nome_projeto}/` de cada lado e independente
      - Se o mesmo `projects/{nome}/config.md` existe local E remoto: merge 3-way
      - Se so existe no remoto: copiar (vem de outro projeto/estacao)
      - Se so existe no local: preservar (sera enviado no proximo push)

5. **Hooks** (target user-level):
   - Comparar versao do manifest com versao nos scripts locais
   - Se remoto > local: mostrar diff resumido e pedir confirmacao (hooks afetam TODOS os projetos)
   - Se confirmado: copiar scripts do cache para o path do plugin user-level
   - Path do plugin: verificar em `~/.claude/plugins/` (pode ser cache ou non-cache)

6. **Exibir resumo** do que foi atualizado:

```
Pull concluido!

Atualizado:
- tuninho-escriba: v2.0.0 -> v2.1.0
- tuninho-hook-conta-token: v3.0.0 -> v3.1.0

Sem alteracao:
- tuninho-ddce (v1.4.0)
- tuninho-devops-mural-devprod (v1.2.0)
- tuninho-updater (v1.0.0)
```

---

## Modo: push

Envia melhorias locais de volta ao repositorio central via Pull Request.

### Algoritmo

1. Completar Etapa 0 (preparar cache)

2. **Verificar PRs pendentes** no repo:
   ```bash
   gh pr list --repo victorgaudio/a4tunados-ops-suite --state open --json number,title
   ```
   - Se existir PR aberto: avisar o usuario e perguntar se quer aguardar o merge ou prosseguir
   - Se o PR aberto for do mesmo componente: PARAR e avisar que deve aguardar merge primeiro
   - Se nao houver PRs abertos: prosseguir normalmente

### Etapa 2.1: Consolidacao de PRs Concorrentes

Se existem PRs abertas E tocam componentes que o push local tambem modifica:

1. Para cada PR aberta, baixar diff: `gh pr diff {N}`
2. Identificar componentes modificados (paths `skills/tuninho-*/`, `hooks/scripts/`)
3. Comparar com componentes locais a serem pushados
4. **Se intersecao (conflito potencial):**

   ```
   ⚠️ PR #{N} ({titulo}) modifica componentes em comum:
   - tuninho-ddce (PR: v3.5.0, Local: v3.4.0)

   Opcoes:
   (a) Aguardar merge da PR #{N} e depois push (mais seguro)
   (b) Incorporar mudancas da PR na branch local via 3-way merge
   (c) Criar PR separada e resolver conflito no GitHub
   ```

5. Se opcao (b):
   a. Fetch branch da PR
   b. Aplicar 3-way merge por secoes (usando snapshot como base)
   c. Resultado: branch local contem AMBAS as mudancas
   d. Criar PR unificada
   e. Fechar PR antiga com referencia a nova

6. **Se sem intersecao:** Prosseguir normalmente

### Etapa 2.5: Merge via Sistema de Merge 3-Way (OBRIGATORIA no push)

Quando o push detectar que `remoto > local` E `local tem modificacoes nao presentes no remoto`:

**NAO sobrescrever cegamente. NUNCA descartar conteudo de nenhum lado.**

Aplicar o **Sistema de Merge 3-Way** (ver secao dedicada acima) para resolver conflitos
entre versao local e remota. O snapshot em `ops-suite-sync-state.json` serve como base.

Para manifest.json: Usar a MAIOR versao entre local e remoto + incrementar patch.

3. **Identificar o que enviar**:
   - Comparar versoes locais vs remotas
   - Listar skills onde local > remoto OU onde houve modificacao local
   - Perguntar ao usuario quais componentes deseja enviar
   - O usuario pode escolher um ou mais

4. **Para cada componente selecionado**:
   a. Copiar do local para o cache:
      - Skills: `.claude/skills/{nome}/SKILL.md` + `references/` inteiro
      - `projects/` inteiro (sidecars sao acumulativos — cada projeto contribui e o repo centraliza)
      - Hooks: copiar scripts modificados
   b. Atualizar `manifest.json` no cache com a nova versao

5. **GERAR README.md (ETAPA OBRIGATORIA — GATE BLOQUEANTE)**:

   Esta etapa NAO e opcional. O README DEVE ser regenerado em CADA push, por menor
   que seja a mudanca. O commit NAO pode ser criado sem o README atualizado e validado.

   a. Regenerar `README.md` inteiro usando o template da secao "Geracao Automatica do README"
   b. Garantir que TODAS as secoes obrigatorias estao presentes:
      - `## Instalacao Rapida` (com comando install.sh) — PRIMEIRA secao apos H1
      - `## Componentes` (tabelas de skills e hooks com versoes do manifest)
      - `## Como usar` (instrucoes basicas)
      - `## Estrutura` (arvore de diretorios)
   c. **Rodar Validacao Pos-Geracao** (7 checks — ver secao "Geracao Automatica do README")
   d. Se QUALQUER check falhar: corrigir e re-validar ate TODOS passarem
   e. So entao prosseguir para o commit

   **POR QUE ESTA ETAPA E OBRIGATORIA**: O README foi encontrado desatualizado 3+ vezes
   em producao. Skills novas nao apareciam, versoes estavam defasadas, e a secao de
   instalacao sumiu repetidamente. O README e a porta de entrada do ops-suite —
   se esta errado, ninguem consegue instalar nem saber o que tem disponivel.

6. **Criar branch, commit UNICO e PR** (tudo junto para evitar race condition com auto-merge):
   ```bash
   CACHE=_a4tunados/.cache/a4tunados-ops-suite
   git -C "$CACHE" fetch origin
   # v4.11.0 — Regra #32: atualizar main local antes de criar branch.
   # Sem isso, "behind by N commits" aparece na sessao apos o push (commits novos
   # chegam no remoto durante a operacao) e o operador fica confuso. Fast-forward
   # apenas — se nao for FF, o operador deve resolver manualmente.
   git -C "$CACHE" checkout main
   git -C "$CACHE" pull --ff-only origin main
   git -C "$CACHE" checkout -b feat/update-{componentes}-v{versao} origin/main
   git -C "$CACHE" add skills/ hooks/ manifest.json README.md
   git -C "$CACHE" commit -m "feat: atualiza {componentes} para v{versao}

   Melhorias incorporadas do projeto {nome_projeto}.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
   git -C "$CACHE" push origin feat/update-{componentes}-v{versao}
   ```

   **IMPORTANTE**: Todos os arquivos (skills, manifest, README) devem estar no
   MESMO commit. Nunca fazer push incremental — o repo pode mergear automaticamente
   e commits adicionais ficariam orfaos (Licao #6).

   **CRITICO — NAO usar `cd` no shell**: Use SEMPRE `git -C "$CACHE"` em vez de
   `cd $CACHE && git ...`. O `cd` muda o working directory persistente do tool
   shell e infecta hooks e comandos posteriores na sessao — em particular, o
   `tuninho-hook-git-flow` resolvia a branch a partir do cwd e bloqueava Edit em
   arquivos do projeto como se a branch fosse `main` (Licao #19, hook git-flow
   v1.2.0 corrige a deteccao mas a higiene aqui evita o problema na origem).

7. **Criar PR via gh**:
   ```bash
   gh pr create --repo victorgaudio/a4tunados-ops-suite \
     --head feat/update-{componentes}-v{versao} \
     --title "feat: atualiza {componentes} v{versao}" \
     --body "$(cat <<'EOF'
   ## Resumo
   - Atualiza {lista de componentes} com melhorias do projeto {nome}
   - Versoes: {lista de versoes antigas -> novas}

   ## Origem
   - Projeto: {nome do projeto}
   - Operacao: {contexto se disponivel}

   ## Componentes atualizados
   {lista de arquivos modificados}

   ---
   Gerado via tuninho-updater
   EOF
   )"
   ```

8. **Reportar** URL do PR ao usuario.

9. **Oferecer merge via CLI (opcional)**:
   Apos reportar a URL do PR, sugerir ao operador a possibilidade de mergear
   diretamente via `gh` sem precisar ir ao GitHub web:

   ```
   PR criado: {url}

   Quer mergear agora via CLI? Isso evita a etapa extra no GitHub web. (s/n)
   ```

   - **Se sim**: `gh pr merge {numero} --repo victorgaudio/a4tunados-ops-suite --merge`
   - **Se nao**: Apenas informar que o PR esta aberto para review no GitHub

   **IMPORTANTE**: Isso e SEMPRE opcional e sugerido, nunca executado automaticamente.
   O operador pode preferir revisar no GitHub web antes de mergear, e isso e valido.

---

## Modo: track

Registra modificacoes locais em skills, faz bump de versao e grava historico
no arquivo `_a4tunados/local-changes.json`. Este modo e o coracao do controle
de versionamento local — garante que TODA modificacao em skills seja rastreada.

### Quando usar

- **Automaticamente**: Apos QUALQUER edicao em um arquivo `.claude/skills/tuninho-*/SKILL.md`
  ou `references/` de uma skill. O agente (Claude Code) DEVE invocar o updater em modo
  track apos concluir a edicao. Nao depende do usuario lembrar.
- **Manualmente**: Quando o usuario pedir "registra modificacao", "track", "bumpa versao", etc.
- **No smart mode**: O smart mode checa `local-changes.json` e mostra modificacoes pendentes
  (que foram tracked mas ainda nao foram pushadas ao repo).

### Arquivo de controle: `_a4tunados/local-changes.json`

```json
{
  "project": "web_claude_code",
  "tracked_skills": [
    "tuninho-ddce",
    "tuninho-escriba",
    "tuninho-devops-mural-devprod",
    "tuninho-updater"
  ],
  "changes": [
    {
      "skill": "tuninho-ddce",
      "version_from": "v3.1.0",
      "version_to": "v3.1.1",
      "date": "2026-03-26",
      "description": "Adicionados novos triggers no frontmatter (resolve esse card, etc.)",
      "files_changed": ["SKILL.md"],
      "pushed": false
    }
  ]
}
```

**Campos**:
- `project`: nome do diretorio do projeto (para contexto em push)
- `tracked_skills`: lista de TODAS as skills monitoradas (todas do ops-suite)
- `changes`: array de modificacoes registradas, em ordem cronologica
- `pushed`: `false` enquanto nao foi enviada ao repo, `true` apos push bem-sucedido

### Guardian Integration

Ao executar modo track, verificar `.claude/tuninho-hook-guardiao-state.json` para pending_track entries. Apos registrar modificacoes, limpar as entries marcando tracked: true.

### Algoritmo

1. **Detectar skills modificadas**:
   a. Comparar cada skill local com o cache (se existir) via hash/tamanho do SKILL.md
   b. OU receber a skill como parametro (quando chamado automaticamente apos edicao)
   c. OU usar `git diff --name-only .claude/skills/tuninho-*/` para detectar mudancas
   d. OU ler entries pendentes de `.claude/tuninho-hook-guardiao-state.json`

2. **Para cada skill modificada**:
   a. Extrair versao atual do H1: `^# .+ v(\d+\.\d+\.\d+)`
   b. Determinar tipo de bump:
      - **Patch** (default): ajustes no texto, novos triggers, correcoes menores
      - **Minor**: nova secao, novo modo, nova funcionalidade significativa
      - **Major**: reescrita fundamental do fluxo
   c. Para edicoes automaticas (triggers, textos, ajustes): sempre **patch**
   d. Para mudancas estruturais: perguntar ao operador qual bump aplicar

3. **Aplicar bump de versao**:
   a. Incrementar a versao no H1 do SKILL.md (ex: `v3.1.0` → `v3.1.1`)
   b. Se a skill tem `## Historico de Versoes`: adicionar entrada com data e descricao

4. **Registrar em `_a4tunados/local-changes.json`**:
   a. Se o arquivo nao existe: criar com estrutura base
   b. Adicionar entrada no array `changes` com:
      - `skill`: nome da skill
      - `version_from`: versao antes do bump
      - `version_to`: versao apos o bump
      - `date`: data atual (YYYY-MM-DD)
      - `description`: resumo da modificacao (gerado automaticamente ou fornecido)
      - `files_changed`: lista de arquivos alterados dentro da skill
      - `pushed`: `false`
   c. Garantir `_a4tunados/local-changes.json` no `.gitignore` (opcional — pode querer versionar)

5. **Reportar**:
   ```
   Modificacao registrada!

   | Skill | Versao | Mudanca |
   |-------|--------|---------|
   | tuninho-ddce | v3.1.0 → v3.1.1 | Novos triggers no frontmatter |

   Pendente de push: 1 modificacao(oes)
   Use "manda pro repo" quando quiser enviar.
   ```

### Integracao com smart mode

No modo `smart`, APOS comparar versoes local vs remoto, o updater DEVE:

1. Ler `_a4tunados/local-changes.json` (se existir)
2. Filtrar entradas com `pushed: false`
3. Exibir na tabela de status com indicador especial:

```
| Componente   | Local  | Remoto | Status                        |
|--------------|--------|--------|-------------------------------|
| tuninho-ddce | v3.1.1 | v3.1.0 | → PUSH (1 modificacao local)  |
```

4. Listar as modificacoes pendentes:
```
Modificacoes locais pendentes de push:
- tuninho-ddce v3.1.0→v3.1.1 (2026-03-26): Novos triggers no frontmatter
```

### Integracao com push mode

No modo `push`, o updater DEVE:

1. Ler `local-changes.json` para identificar o que precisa ser pushado
2. Apos push bem-sucedido: marcar entradas como `pushed: true`
3. Manter historico (nao deletar entradas pushadas — servem como log)

### Integracao com pull mode

No modo `pull`, ao atualizar uma skill que tem entradas `pushed: false`:

1. AVISAR o operador: "Skill {nome} tem modificacoes locais nao pushadas!"
2. Perguntar se quer preservar (merge) ou descartar
3. Se preservar: aplicar merge interpretativo
4. Se descartar: remover entradas do local-changes.json

---

## Modo: cleanup

Detecta e move artefatos legados. Ver **Etapa 0.5** acima para o algoritmo completo.

---

## Modo: rollback

Reverte um merge anterior usando os backups em `_a4tunados/merge-backups/`.

### Algoritmo

1. Ler `_a4tunados/merge-log.json`
2. Listar merges recentes (ultimos 5) com data, tipo, componentes, versoes
3. Operador seleciona qual reverter
4. Para cada componente do merge selecionado:
   a. Copiar backup de `_a4tunados/merge-backups/{timestamp}/` para `.claude/skills/`
   b. Se era hook: copiar para plugin dir tambem
5. Atualizar snapshot para refletir estado restaurado
6. Reportar o que foi revertido

### Regras

- Backups sao mantidos por 30 dias (ou ate limpeza manual)
- Rollback NAO reverte push ao repo — apenas o estado local
- Apos rollback, o operador pode decidir push novamente

---

## Modo: verify

Verifica integridade estrutural de todos os componentes instalados.

### Checklist de Verificacao

**Para cada skill em `.claude/skills/tuninho-*/`**:

1. `SKILL.md` existe
2. Frontmatter YAML valido com campos `name` e `description`
3. H1 contem versao no formato `# {Nome} v{X.Y.Z}`
4. Banner do suite presente: `> **a4tunados-ops-suite**`
5. Diretorio `references/` existe
6. Comunicacao em pt-BR mencionada
7. Se `has_sidecar == true` no manifest: `projects/README.md` existe

**Para hooks** (5 hooks com convencao `tuninho-hook-*`):

0. **DETECCAO DE HOOKS LEGADOS NO PROJETO** (Licao Op10 Chooz 2026):
   Verificar se `.claude/hooks/scripts/` contem hooks com nomes LEGADOS:
   - `token-monitor.py` → deprecated, substituido por `tuninho-hook-conta-token.py`
   - `session-start-check.py` → deprecated, substituido por `tuninho-hook-inicio-sessao.py`
   - `post-session-summary.sh` → deprecated, substituido por `tuninho-hook-fim-sessao.sh`
   Se encontrar: AVISAR e oferecer migracao automatica (baixar versoes oficiais do repo,
   atualizar hooks.json do projeto, remover legados). Verificar tambem se `.claude/hooks.json`
   referencia os nomes legados e atualizar para os nomes oficiais.
   **Hooks faltantes**: Se `tuninho-hook-cards-mural.py` ou `tuninho-hook-guardiao-skills.py`
   NAO existem no projeto: baixar do repo e registrar. Esses hooks sao CRITICOS
   (cards-mural detecta cards automaticamente, guardiao protege skills).

1. `hooks.json` existe no plugin e e JSON valido
2. 5 hooks registrados: `tuninho-hook-conta-token`, `tuninho-hook-inicio-sessao`, `tuninho-hook-fim-sessao`, `tuninho-hook-cards-mural`, `tuninho-hook-guardiao-skills`
3. Todos os scripts seguem naming convention `tuninho-hook-{nome}.{ext}`
4. Scripts referenciados existem no disco e sao executaveis
5. Versao no header dos scripts bate com manifest
6. **CADA hook do hooks.json esta registrado no `~/.claude/settings.json`** (secao `hooks`):
   - Para cada entrada no hooks.json do plugin, verificar que existe entrada correspondente
     no settings.json com o mesmo evento, script (caminho absoluto) e timeout
   - Caminhos no settings.json DEVEM ser absolutos (nao usar `${CLAUDE_PLUGIN_ROOT}`)
   - Se algum hook nao esta registrado: FAIL com instrucao de como corrigir
   - Se o caminho usa variavel em vez de absoluto: FAIL com instrucao de correcao
7. **Teste de execucao**: para cada hook Python, rodar com input vazio e verificar que
   nao crasheia (exit code 0):
   ```bash
   echo '{}' | python3 /path/to/hook-script.py 2>/dev/null; echo $?
   ```

**Para tuninho-delivery-cards**:

1. Skill structure valida (SKILL.md + references/)
2. Frontmatter e H1 com versao presente

**Para o plugin global** (`~/.claude/plugins/a4tunados-ops-suite/`):

1. Plugin existe e e git repo do `victorgaudio/a4tunados-ops-suite`
2. **NAO contem `skills/`** — se contem, FAIL com instrucao de remocao
3. Contem `hooks/scripts/` com os 5 scripts
4. Contem `hooks/hooks.json` valido
5. NAO ha symlinks legados em `~/.claude/plugins/` apontando para skills de projetos

**Para manifest.json** (no cache):

1. JSON valido
2. `suite_version` presente
3. Todos os componentes listados
4. Versoes batem com H1 dos SKILL.md no cache

### Formato do Report

```
a4tunados-ops-suite — Verificacao de Integridade

Skills:
  tuninho-ddce ................ PASS (5/5 checks)
  tuninho-escriba ............. PASS (5/5 checks)
  tuninho-devops-mural-devprod  PASS (5/5 checks)
  tuninho-updater ............. PASS (5/5 checks)

Hooks:
  tuninho-hook-conta-token ..... PASS (5/5 checks)
  tuninho-hook-inicio-sessao ... PASS (5/5 checks)
  tuninho-hook-fim-sessao ...... PASS (5/5 checks)
  tuninho-hook-cards-mural ..... PASS (5/5 checks)
  tuninho-hook-guardiao-skills . PASS (5/5 checks)

Manifest:
  Consistencia ................ PASS

Resultado: TODOS OS CHECKS PASSARAM
```

Se algum check falhar, listar o problema e sugerir correcao.

---

## Convencao de Nomenclatura v4.0.0

**Convencao v4.0.0**: Todos os artefatos do ops-suite seguem prefixo `tuninho-`. Skills: `tuninho-{nome}`. Hooks: `tuninho-hook-{nome}`. O modo verify valida esta convencao.

---

## Regras

1. **Sidecars sao acumulativos** (`projects/{nome_projeto}/`) — sincronizados via merge por subdiretorio. Cada projeto contribui seu sidecar e o repo centraliza TODOS. Pull traz sidecars de outros projetos/estacoes. Push envia os do projeto atual. Merge 3-way quando o mesmo sidecar foi editado em dois lugares.
2. **Sempre pedir confirmacao antes de atualizar hooks** — afetam todos os projetos do usuario
3. **Sempre usar PR para push** — nunca push direto na main do repo
4. **Cache e descartavel** — pode ser deletado e recriado a qualquer momento
5. **Versao e extraida do H1** — regex `^# .+ v(\d+\.\d+\.\d+)` e a fonte de verdade local
6. **manifest.json e a fonte de verdade remota** — versoes no manifest ditam o que e "atual"
7. **Auto-update do updater vem primeiro** — sempre verificar se o updater tem versao nova antes de processar outros componentes
8. **Sempre limpar legado antes de instalar** — artefatos V2.x/V3.x podem conflitar com skills V4.0
9. **Preservar artefatos movidos** — nunca deletar legado, sempre mover para `_a4tunados/zzz_old_files/`
10. **Confirmar antes de mover** — mostrar tabela completa de artefatos e pedir confirmacao do usuario
11. **Atualizar README.md do repo em cada push** — manter tabela de versoes e descricoes sincronizadas
12. **Merge antes de push** — NUNCA sobrescrever conteudo do remoto sem merge. Sistema de Merge 3-Way e obrigatorio.
13. **Auto-update com re-invocacao** — Se o updater se atualizou, PARAR e pedir re-invocacao. Nunca continuar com versao antiga em contexto.
14. **Merge interpretativo, nao textual** — Skills sao conteudo generativo (nao codigo). O merge deve interpretar a INTENCAO de cada melhoria, nao apenas concatenar texto. O resultado deve ser uma instrucao coerente que preserve todas as capacidades.
15. **Updater e o centralizador** — Nenhuma skill faz auto-update ou verifica versoes por conta propria. TODA verificacao e atualizacao de skills passa pelo updater. As demais skills usam o Preflight para acionar o updater quando necessario.
16. **Track obrigatorio apos editar skills** — Toda modificacao em qualquer skill tuninho-* DEVE ser seguida de invocacao do updater em modo `track`. O agente (Claude Code) e responsavel por chamar automaticamente — NAO depende do usuario lembrar. Se o agente editou um SKILL.md ou references/ de uma skill, DEVE rodar track antes de encerrar a tarefa. `local-changes.json` e a fonte de verdade para modificacoes locais pendentes.
17. **3-way merge obrigatorio** — Todo merge (pull ou push) DEVE usar o snapshot como base para classificacao de secoes. Merge 2-way (sem base) so e aceito quando snapshot nao existe (primeiro sync).
18. **Merge preview obrigatorio** — Nenhum merge e gravado sem preview ao operador e confirmacao expressa. Excecao: secoes onde so um lado mudou (resolucao automatica) podem ser aplicadas silenciosamente se o operador ativou modo autonomo.
19. **Backup pre-merge obrigatorio** — Antes de gravar qualquer merge, salvar estado pre-merge em `_a4tunados/merge-backups/`. Registrar em `merge-log.json`.
20. **Claude como merge engine** — Conflitos semanticos (ambos lados mudaram mesma secao) sao resolvidos pelo Claude interpretando a intencao de cada mudanca. O resultado DEVE ser validado semanticamente antes de gravar.
21. **Hooks DEVEM ser registrados no settings.json** — Hooks definidos no `hooks.json` do plugin NAO sao carregados pelo Claude Code. O runtime so le hooks da secao `hooks` do `~/.claude/settings.json`. O updater DEVE registrar cada hook com caminho absoluto no settings.json apos copiar os scripts. Verificacao pos-registro e obrigatoria. Scripts sem registro no settings.json = hooks MORTOS. Esta regra e INVIOLAVEL — sem ela todo o ecossistema de hooks fica inoperante silenciosamente.
22. **Plugin global contem SOMENTE hooks** — O plugin em `~/.claude/plugins/a4tunados-ops-suite/` existe exclusivamente como veiculo de hooks. Skills vivem SOMENTE em `.claude/skills/` de cada projeto. Se `skills/` for encontrado no plugin, a Etapa 0.7 DEVE oferecer remocao. O updater NUNCA copia skills para o plugin — nem em pull, push, bootstrap ou sync. Hooks no plugin DEVEM ser sincronizados via Etapa 0.7 em toda operacao smart/pull/push.
23. **README do repo e SEMPRE auto-gerado** — O README.md NUNCA deve ser editado manualmente. Ele e gerado automaticamente a partir do manifest.json em cada push. Isso elimina o risco de README mostrando versao antiga (v3.3.0 quando o repo esta em v4.2.0). O template e fixo; os dados vem do manifest e dos H1 das skills.
24. **Manifest DEVE ter verificacao cruzada com H1** — Apos cada push, o updater DEVE verificar que CADA versao no manifest.json bate com o H1 do SKILL.md correspondente no cache. Se divergem, corrigir o manifest (H1 e fonte de verdade, Regra #5). Isso previne regressao de versoes quando PRs usam bases desatualizadas.
25. **Tabela de Niveis obrigatoria no smart mode** — Toda execucao do smart mode DEVE encerrar exibindo o Mapa de Componentes organizado por nivel (Global/Projeto). A tabela mostra o estado confirmado de TODOS os componentes — plugins, hooks, skills, agents — com verificacao real (leitura de arquivos e settings.json), nao suposicoes. Isso elimina a confusao sobre onde cada componente vive e qual e seu estado.
26. **Versionamento semver rigoroso com justificativa por componente** — Todo bump (de componente OU de `suite_version`) DEVE seguir os Criterios de Versionamento Semver documentados na secao "Versionamento". O default NAO e MINOR — o default e o menor bump que reflita a mudanca real. Regra de ouro: bump reflete MUDANCA DE COMPORTAMENTO, nao volume de linhas. Nova licao/fix de texto = PATCH. Nova capacidade/regra/modo = MINOR. Breaking change = MAJOR. `suite_version` agrega pelo maior bump entre componentes modificados. Em TODO push, o updater DEVE apresentar o resumo de versionamento com justificativa por componente e aguardar confirmacao do operador antes de aplicar.
27. **Sidecars locais NUNCA ficam so no local** — Sidecars (`projects/{identificador}/`) contem informacao de projeto (stack, deploy, licoes, IPs, env vars) que DEVE estar no repositorio central. Em todo smart mode, o updater DEVE executar a Etapa 0.8 para detectar sidecars locais do projeto atual que divergem do cache e force push (default sim). Recusa e excecao com razao explicita. Motivacao: multi-ambiente e continuidade — se o ambiente local for perdido ou o projeto for operado de outra estacao, todo conhecimento de projeto se perde sem esta regra. Sidecar push NAO incrementa versao da skill (sidecar e conteudo aditivo por projeto, nao mudanca de comportamento da skill).
28. **Investigar NUNCA implica aplicar** — Quando o usuario, ao responder a pergunta de smart mode, escolhe para uma skill especifica uma opcao do tipo "investigar / comparar / mostrar diff" (em vez de pull/push/deixar), o updater DEVE apresentar o relatorio e PARAR para essa skill, mesmo que outras decisoes na mesma resposta tenham sido aprovacoes. Nao se pode propagar aprovacao de item N para "investigar item M". Apos o relatorio, pedir nova decisao explicita {aplicar pull | aplicar push | deixar como esta}. Motivacao: na sessao de 2026-05-02, o usuario respondeu "1 sim 2 sim 3c" onde 3c era investigar tuninho-qa, e o updater aplicou pull no qa por engano (precisou reverter via backup). Esta regra evita que isso se repita.
29. **NUNCA usar `cd` em scripts de push/sync** — Use sempre `git -C "$CACHE"` em vez de `cd $CACHE && git ...`. O `cd` muda o working directory persistente do tool shell e infecta hooks e comandos posteriores na mesma sessao Claude Code (em particular, o `tuninho-hook-git-flow` resolvia a branch a partir do cwd e bloqueava Edit em arquivos do projeto como se a branch fosse `main` do cache). O hook git-flow v1.2.0 corrige a deteccao usando `file_path`, mas a higiene aqui evita o problema na origem.

30. **Versao da skill SO sai do H1** (v4.11.0) — A versao local de uma skill e
    extraida APENAS da primeira linha que comeca com `^# ` no SKILL.md. Buscar
    a primeira ocorrencia de regex de versao no arquivo inteiro (`grep -m1 -oE
    'v[0-9]+\.[0-9]+\.[0-9]+'`) e PROIBIDO porque pega versoes do frontmatter
    (description com triggers tipo "tuninho-portas-em-automatico v0.5.0+"), do
    historico de versoes, de referencias cruzadas a outras skills. Falsos
    positivos geram alarmes "PULL"/"PUSH" inexistentes que confundem o operador
    e podem levar a aplicar pull desnecessario sobrescrevendo conteudo correto.
    Algoritmo canonico documentado em "Regex canonico de versao" da Etapa 0.

31. **Estado ÓRFÃ explicito + sidecar de orfa fica em HOLD** (v4.11.0) — Skill
    com SKILL.md local mas sem entrada no manifest e' classificada como ÓRFÃ
    (`?`) no smart mode, com acoes explicitas: PROMOVER (push completo) ou
    MANTER PRIVADA (skill local exclusiva). Nunca mais cair em "investigar"
    generico. Adicionalmente, sidecars de skill orfa NUNCA entram em push
    automatico — a Etapa 0.8 marca como `HOLD_ORFA` e exclui do batch.
    Pushar sidecar de skill que nao esta no manifest cria estado incoerente
    no repo central (sidecar sem skill registrada). Operador deve PROMOVER
    a skill primeiro, depois sincronizar sidecars.

32. **Pull `--ff-only` antes de criar branch para push** (v4.11.0) — Antes de
    `git -C $CACHE checkout -b feat/...`, atualizar a main local com
    `git -C $CACHE checkout main && git -C $CACHE pull --ff-only origin main`.
    Sem isso, durante a operacao podem chegar commits novos no remoto e a main
    local fica defasada — o operador ve warning "behind by N commits" pos-push
    e fica confuso sobre se o trabalho dele estava desatualizado. Fast-forward
    apenas — se houver divergencia nao-FF, o operador deve resolver manualmente
    (cache local pode ter mudancas locais nao-pushadas que precisam tratamento
    especifico antes do pull).

---

## Tratamento de Erros

### Sem acesso ao GitHub
- Tentar `git clone`/`git fetch` e capturar erro
- Informar: "Sem acesso ao repositorio. Verifique sua conexao e autenticacao (`gh auth status`)"
- Em modo status/verify: usar cache existente se disponivel (pode estar desatualizado)

### Cache corrompido
- Se `git -C ... status` falha: deletar o cache e reclonar
- `rm -rf _a4tunados/.cache/a4tunados-ops-suite && git clone ...`

### Conflito de versao (local modificado sem bump)
- Se o SKILL.md local foi modificado mas a versao no H1 nao mudou:
  - Avisar: "Skill {nome} tem modificacoes locais sem bump de versao"
  - Sugerir: "Incremente a versao no H1 e use push para enviar as melhorias"

### Skill nao existe localmente
- No pull: oferecer instalar (copiar do cache)
- No status: marcar como "Nao instalado"

---

## Retroalimentacao (apos cada execucao)

Apos CADA execucao do updater (pull, push, ou bootstrap), a skill DEVE se auto-aprimorar.

**Protocolo de retroalimentacao:**

a. **Analisar a execucao recem-concluida:**
   - Houve erros nao previstos (rede, permissoes, conflitos)?
   - Algum componente falhou na verificacao?
   - O fluxo de bootstrap/pull/push funcionou sem friccao?
   - O usuario precisou intervir manualmente em algo que deveria ser automatico?
   - A deteccao de modo (smart/pull/push) acertou a intencao do usuario?

b. **Se houve licoes novas**, adicionar em `${CLAUDE_SKILL_DIR}/references/licoes-aprendidas.md`:
   - Proximo numero sequencial
   - Formato: Titulo, Descoberta em, Contexto, Problema, Solucao
   - Atualizar tabela resumo

c. **Se houve ajuste no fluxo** (etapa diferente, verificacao nova, tratamento de erro):
   - Atualizar a secao correspondente neste SKILL.md
   - Atualizar `references/estrutura-padrao.md` se necessario

d. **Incrementar versao da skill**:
   - Patch (0.0.x): novas licoes, correcoes de texto, ajustes de deteccao
   - Minor (0.x.0): novos modos, novos checks de verificacao, novo fluxo de bootstrap
   - Major (x.0.0): mudanca fundamental no mecanismo de sync

e. **Perguntar ao operador:**
   > Sync concluido. Alguma observacao ou ajuste no processo?

   - **Se SIM**: executar ajustes, atualizar licoes e skill, perguntar novamente.
   - **Se NAO**: encerrar.

---

## Versionamento

### Criterios de Versionamento Semver (v4.8.0+)

Este e o criterio OFICIAL de bump para TODOS os componentes da ops-suite (skills,
hooks) e para a `suite_version` agregada. O updater DEVE aplicar este criterio de
forma rigorosa em todo modo track/push.

**Principio**: bump reflete MUDANCA DE COMPORTAMENTO do componente, nao volume de
linhas alteradas. Texto modificado sem alterar comportamento = PATCH, nao MINOR.

#### Bump de componente individual (skill ou hook)

| Bump | Quando aplicar | Exemplos concretos |
|------|---------------|-------------------|
| **PATCH** (x.y.**Z+1**) | Mudanca NAO altera comportamento do agente | Nova licao em `references/licoes-aprendidas.md`; correcao de typo/pt-BR; ajuste cosmético de formato; exemplo novo sem regra nova; expansao de texto explicativo; fix de bug pequeno num hook (ex: regex incorreto); ajuste de timeout |
| **MINOR** (x.**Y+1**.0) | Nova capacidade/feature/comportamento compativel | Nova etapa no fluxo; novo modo de operacao; nova regra inviolavel; nova excecao/whitelist; novo parametro/input aceito; novo tipo de documento; nova verificacao/check; novo template; refatoracao com comportamento identico; novo componente adicionado ao manifest |
| **MAJOR** (**X+1**.0.0) | Breaking change ou reestruturacao fundamental | Rename/remocao de modo; mudanca incompativel em formato de arquivo de estado (state/manifest); remocao de regra inviolavel; reescrita completa do fluxo; mudanca na estrutura de paths/diretorios que quebra projetos existentes; deprecacao de componente |

**Regra de ouro**: Na duvida entre PATCH e MINOR, pergunte *"o agente se comportara
de forma observavelmente diferente apos esta mudanca?"*. Se SIM = MINOR. Se NAO = PATCH.

**Contra-exemplos** (para calibrar intuicao):
- ❌ "Reescrevi 200 linhas do SKILL.md" → **nao necessariamente MINOR**. Se as 200
  linhas eram apenas reformulacao textual do mesmo fluxo = PATCH. Se introduziram
  novo mecanismo = MINOR.
- ❌ "Adicionei uma licao grande com 50 linhas" → **PATCH**. Licoes sao memoria
  historica, nao alteram comportamento.
- ✅ "Adicionei exceções ao hook X em threshold Y" → **MINOR**. Nova capacidade
  que muda o que o hook faz.
- ✅ "Corrigi o regex que detectava tool_name='Skill'" → **PATCH**. Bug fix
  de detecao existente (sem nova capacidade).

#### Bump de `suite_version` (agregada)

A `suite_version` no `manifest.json` representa o estado agregado de TODA a suite.
Regra de agregacao: **o maior bump entre todos os componentes modificados manda**.

| Componentes modificados no push | Bump de suite_version |
|--------------------------------|----------------------|
| 1+ componentes com PATCH, nenhum MINOR/MAJOR | **PATCH** (x.y.**Z+1**) |
| 1+ componentes com MINOR, nenhum MAJOR | **MINOR** (x.**Y+1**.0) |
| 1+ componentes com MAJOR | **MAJOR** (**X+1**.0.0) |
| Componente NOVO adicionado ao manifest (sem modificar existentes) | **MINOR** (catalogo expandiu = nova capacidade da suite) |
| Componente REMOVIDO/deprecado do manifest | **MAJOR** (breaking change para projetos que usam) |

**Exemplos de aplicacao desta regra**:

- Push apenas do escriba com nova licao #14 → escriba PATCH → suite PATCH (4.14.0 → **4.14.1**)
- Push do hook conta-token com novas excecoes + fix README → hook MINOR + README PATCH → suite MINOR (4.13.0 → **4.14.0**) ✓ (como feito no PR #55)
- Push adicionando nova skill `tuninho-devops-env` ao manifest → suite MINOR
- Push removendo/deprecando `tuninho-mandapr` definitivamente do manifest → suite MAJOR
- Push que renomeia todos os hooks (como a migracao v3.x→v4.0.0) → suite MAJOR

**Anti-padrao a evitar** (inercia historica da suite): bumpar suite para MINOR por
default em todo push. Isso inflaciona a numeracao artificialmente e distorce a
leitura do historico. A calibracao certa e: suite bumpa patch quando a SOMA de
mudancas nao introduz capacidade nova nenhuma.

#### Decisao em tempo de push

Ao preparar um push, o updater DEVE:

1. **Listar cada componente modificado** (skill ou hook) com seu bump individual
2. **Justificar cada bump** com 1 linha (tipo de mudanca: nova regra? licao? fix?)
3. **Calcular suite_version** aplicando a regra de agregacao (maior manda)
4. **Apresentar ao operador**:

```
Resumo de versionamento para este push:

Componentes:
  tuninho-escriba       v3.7.3 → v3.7.4   PATCH  (nova licao #14)
  tuninho-hook-X        v1.0.0 → v1.1.0   MINOR  (novo parametro aceito)

Suite agregada:
  suite_version         v4.14.0 → v4.15.0  MINOR  (maior bump = MINOR do hook)

Confirma? (s/ajustar/n)
```

5. Operador pode **ajustar** se a classificacao nao refletir a intencao real.
6. Se operador confirmar, aplicar os bumps nos H1s, no manifest e no README gerado.

### Versionamento da Skill
A versao desta skill segue semver e esta no titulo deste arquivo, aplicando
os criterios acima.

### Historico de Versoes

- **v5.0.1** (2026-05-06): PATCH — limpeza de mencoes ativas a `tuninho-mandapr` no
  texto do SKILL.md (estrutura tree, exemplos de tabelas status/pull/verify, lista
  tracked_skills, sugestao bootstrap). Skill mandapr foi removida fisicamente em
  v6.0.0/v5.0.0 mas mencoes textuais ainda apareciam em exemplos. Bloco historico
  `## v5.0.0 — DDCE_EXPANSIVO_MULTI_SESSOES integration` mantem mencao a mandapr
  pois e registro historico do bump (nao deve ser apagado). Tambem removida entrada
  `tuninho-mandapr` do manifest.json (entry orfa apontando para path inexistente).

- **v4.11.0** (2026-05-04): Cinco aprendizados consolidados de updates recorrentes
  para eliminar confusoes que ja se repetiram em multiplos projetos:
  (1) **Regex de versao APENAS no H1** (Etapa 0 + Regra #30): proibir busca generica
  de regex de versao no SKILL.md inteiro. Use sempre H1 explicito.
  Falsos alarmes recorrentes (ex: "git-flow-dafor v0.5.0 → v0.5.1" quando o H1
  ja estava v0.5.1; "tuninho-tester v0.5.0" quando o H1 era v0.1.0) vinham de
  versoes do frontmatter, triggers, historicos.
  (2) **Estado ÓRFÃ explicito no smart mode** (Regra #30 + #31): skill com
  SKILL.md local mas sem entrada no manifest tem novo estado `?` com acoes
  explicitas (PROMOVER ou MANTER PRIVADA). Antes caia em "investigar" e
  gerava confusao.
  (3) **Sidecar de skill orfa fica em HOLD** (Etapa 0.8 + Regra #31): nao
  pushar sidecar de skill que nao esta no manifest — gera estado incoerente
  no repo central. Operador deve PROMOVER a skill antes de sincronizar
  sidecars.
  (4) **Discriminacao de tipo de divergencia em sidecar** (Etapa 0.8): novos
  estados explicitos `DIVERGENTE_CONTEUDO`, `DIVERGENTE_LOCAL_EXTRA`,
  `DIVERGENTE_LOCAL_FALTANTE`, `DIVERGENTE_MISTO` em vez do generico
  `DIVERGENTE`. Operador entende a natureza da divergencia sem precisar
  rodar diff manual.
  (5) **Pull `--ff-only` antes de criar branch** (push Etapa 6 + Regra #32):
  evita warning "behind by N commits" pos-push quando commits novos chegam
  no remoto durante a operacao.
  Motivacao: estes 5 pontos foram identificados na sessao do PR #118
  (sidecars do projeto `a4tunados_web_claude_code`) onde causaram
  confusao mesmo com operador experiente. Bumpar direto na skill propaga
  a correcao para todos os projetos no proximo `/tuninho-updater`.

- **v4.10.2** (2026-05-02): Higiene de fluxo + protocolo de smart mode:
  (1) Algoritmo de push (Etapa 6) agora usa `git -C "$CACHE" ...` em todas as
  operacoes em vez de `cd $CACHE && git ...`. O `cd` mudava o cwd persistente
  do tool shell e infectava hooks subsequentes na sessao. Caso concreto: o
  hook git-flow v1.1.0 lia branch do cwd e bloqueava Edit em arquivo do
  projeto (branch feat/*) como se fosse `main` (branch do cache).
  (2) Regra #28: investigar NUNCA implica aplicar. Quando operador responde
  ambiguamente ("1 sim 2 sim 3c") e o item 3c e "investigar", o smart mode
  DEVE apresentar o relatorio e PARAR para essa skill, pedindo nova decisao
  apos a investigacao. Motivacao: incidente de 2026-05-02 onde o updater
  aplicou pull em tuninho-qa apos o operador pedir investigacao (precisou
  reverter via backup).
  (3) Regra #29: NUNCA usar `cd` em scripts de push/sync.

- **v4.9.0** (2026-04-17): **Sidecars locais obrigatoriamente no repo**:
  (1) Nova Etapa 0.8 no smart mode (apos 0.7, antes de comparar versoes):
  detecta sidecars locais do projeto atual que divergem do cache e forca push
  (default sim) antes de encerrar.
  (2) Algoritmo cobre as tres estruturas atuais de sidecar: `projects/{projeto}/`,
  `projects/{host}/{projeto}/` (hostinger multihost v3+) e `projects/{categoria}/{projeto}/`.
  (3) Regra #27: sidecars locais NUNCA ficam so no local — push default sim,
  recusa e excecao com razao explicita. Sidecar push NAO incrementa versao
  da skill (conteudo aditivo por projeto).
  (4) Motivacao: multi-ambiente e continuidade. O ecossistema a4tunados opera
  projetos de varias estacoes. Sidecar que fica so numa estacao = conhecimento
  perdido quando o ambiente muda. Caso concreto: scan enriquecido de
  `hostinger-alfa/chooz_2026/config.md` (stack Drizzle/Anthropic/Apify, SSH
  sshpass, licoes #1/#11/#27) estava so no local e seria perdido sem esta regra.

- **v4.8.0** (2026-04-05): **Criterios de Versionamento Semver rigorosos**:
  (1) Nova secao "Criterios de Versionamento Semver" documenta regras oficiais
  de bump para componentes individuais (skills/hooks) e para `suite_version`.
  (2) Regra de ouro: bump reflete MUDANCA DE COMPORTAMENTO, nao volume de linhas.
  Nova licao/fix textual = PATCH. Nova capacidade/regra/modo = MINOR. Breaking = MAJOR.
  (3) Agregacao de `suite_version`: maior bump entre componentes modificados manda.
  PATCH em componente = PATCH na suite. MINOR em componente = MINOR na suite.
  (4) Remove inercia historica da suite de bumpar sempre para MINOR por default.
  (5) Tabela de componentes modificados com justificativa por componente obrigatoria
  em tempo de push, com confirmacao do operador antes de aplicar bumps.
  (6) Regra #26 adicionada: Versionamento semver rigoroso com justificativa.
  Motivacao: historico da suite mostrava MINOR bumps sistematicos mesmo para
  ajustes triviais (ex: licao nova no escriba viraria suite 4.14.0→4.15.0 quando
  deveria ser 4.14.0→4.14.1). Criterio rigoroso restaura significado semantico
  da numeracao.

- **v4.7.0** (2026-03-30): Separacao arquitetural skills vs hooks por nivel:
  (1) **Skills = exclusivamente por projeto**: O plugin global (`~/.claude/plugins/`)
  NAO deve conter `skills/`. Skills vivem SOMENTE em `.claude/skills/` de cada projeto.
  O updater NUNCA copia skills para o plugin — nem em pull, push, bootstrap ou sync.
  (2) **Plugin = veiculo de hooks**: O plugin existe exclusivamente para hospedar
  hooks (scripts + hooks.json) que precisam ser globais (limitacao do Claude Code).
  (3) **Etapa 0.7 reescrita**: Foca apenas em hooks. Inclui GUARD que detecta e
  oferece remocao de `skills/` no plugin e symlinks legados em `~/.claude/plugins/`.
  (4) **Tabela de Niveis (Mapa de Componentes)**: Novo output padrao OBRIGATORIO
  no smart mode. Exibe estado confirmado de TODOS os componentes organizados por
  nivel (Global: plugins + hooks | Projeto: skills + agents). Elimina confusao
  sobre onde cada componente vive.
  (5) **Regra #22 reescrita**: De "plugin sincronizado em toda operacao" para
  "plugin contem SOMENTE hooks". Guard ativo para prevenir regressao.
  (6) **Regra #25**: Tabela de Niveis obrigatoria no smart mode.
  (7) **Verify expandido**: Novo bloco "plugin global" valida que NAO contem skills
  e que NAO ha symlinks legados.
  (8) **Limpeza executada**: Skills removidas do plugin global, symlink legado
  `tuninho-escriba` removido de `~/.claude/plugins/`.

- **v4.4.1** (2026-03-30): Nova licao #16 (hooks editados fora do fluxo = deriva
  silenciosa). Detectado que hooks inicio-sessao e cards-mural tinham fix de
  systemMessage→additionalContext aplicado diretamente no plugin sem push ao repo.
  O updater so detectou a divergencia ao comparar versoes. Reforco: TODA edicao
  em hooks deve passar pelo fluxo push do updater.

- **v4.4.0** (2026-03-29): Sidecars acumulativos entre projetos e estacoes:
  (1) **Sidecars sincronizados**: `projects/` passa a ser incluido em pull E push.
  O repo centraliza sidecars de TODOS os projetos e estacoes de trabalho.
  Cada subdiretorio `projects/{nome}/` e tratado independentemente no merge.
  (2) **Merge por subdiretorio**: Sidecars de projetos diferentes nunca conflitam
  (subdiretorios independentes). Mesmo sidecar editado em dois lugares usa merge 3-way.
  (3) **Regra #1 atualizada**: De "nunca sobrescrever sidecars" para "sidecars acumulativos".
  (4) **Licao #3 revisada**: Documentado o problema real (sidecars presos em uma estacao)
  e a solucao acumulativa.
  (5) **Plugin sync inclui projects/**: Etapa 0.7 agora sincroniza sidecars no plugin global.
  (6) **Push inclui projects/**: Modo push envia `projects/` inteiro para o repo.

- **v4.3.0** (2026-03-28): Blindagem de integridade do ecossistema:
  (1) **Etapa 0.7 — Saude do Plugin**: Verifica e sincroniza o plugin global
  (`~/.claude/plugins/`) em toda operacao smart/pull/push. Compara versoes plugin vs
  cache, detecta defasagem e skills ausentes, sincroniza com confirmacao. Previne que
  o plugin fique dias defasado silenciosamente (Licao #13).
  (2) **Geracao Automatica do README**: README.md do repo e gerado automaticamente
  a partir do manifest.json via template fixo em cada push. Nunca mais editado
  manualmente. Elimina README desatualizado mostrando versoes antigas (Licao #14).
  (3) **Verificacao Cruzada do Manifest**: Apos cada push, verifica que CADA versao
  no manifest bate com o H1 do SKILL.md correspondente. Corrige automaticamente se
  o manifest regrediu por PR com base desatualizada (Licao #15).
  (4) **Smart mode pos-execucao**: Steps 8a-8d obrigatorios apos pull/push —
  verificacao cruzada, README, sync plugin, atualizar snapshot.
  (5) **Regras #22-#24**: Plugin sync obrigatorio, README auto-gerado, manifest
  verificacao cruzada.
  (6) **Licoes #13-#15**: Plugin defasado silenciosamente, README manual stale,
  manifest com versoes regredidas.

- **v4.2.0** (2026-03-28): CORRECAO CRITICA — Hooks do plugin nunca foram carregados
  pelo Claude Code porque so estavam no `hooks.json` do plugin, mas NAO registrados no
  `~/.claude/settings.json`. Adicionado Step 5 obrigatorio na secao "Setup de Hooks":
  le hooks.json do plugin, resolve caminhos absolutos, registra na secao `hooks` do
  settings.json, e faz verificacao pos-registro. Verify mode agora checa registro no
  settings.json (7 checks por hook). Regra #21: hooks DEVEM ser registrados no
  settings.json — sem registro = hooks mortos. Licao #10 documenta a falha e correcao.

- **v4.1.0** (2026-03-28): Sistema de merge robusto para ZERO perda de atualizacoes:
  (1) **Snapshot Store**: `ops-suite-sync-state.json` captura estado apos cada sync,
  habilitando 3-way merge com ancestral comum.
  (2) **3-Way Merge por secoes**: Algoritmo de 9 casos classifica cada secao ## entre
  base/local/remote. ~80% resolvido mecanicamente, conflitos delegados ao Claude.
  (3) **Claude como merge engine**: Conflitos semanticos resolvidos pelo LLM que
  entende a intencao de instrucoes, nao apenas texto.
  (4) **Hook rename migration**: Secao `migrations` no manifest mapeia renames entre
  versoes. Pull migra automaticamente preservando modificacoes locais.
  (5) **Consolidacao de PRs**: Detecta e resolve PRs concorrentes que tocam mesmos
  componentes. Opcoes: aguardar, incorporar ou separar.
  (6) **Validacao semantica pos-merge**: Verifica coerencia do resultado antes de gravar.
  (7) **Merge preview obrigatorio**: Operador ve e aprova disposicao secao por secao.
  (8) **Backup + rollback**: Pre-merge backup + merge-log.json + modo rollback.
  (9) **Regras #17-20**: 3-way obrigatorio, preview obrigatorio, backup obrigatorio,
  Claude merge engine.

- **v4.0.0** (2026-03-28): Reestruturacao arquitetural (suite v4.0.0):
  (1) **Nomenclatura padronizada**: Todos os hooks renomeados para `tuninho-hook-{nome}`.
  Scripts: tuninho-hook-conta-token.py, tuninho-hook-inicio-sessao.py, tuninho-hook-fim-sessao.sh.
  (2) **Hooks individualizados**: Manifest expandido de 1 entrada agrupada para 5 entradas
  individuais, cada hook com versao propria.
  (3) **tuninho-delivery-cards**: Nova skill no portfolio (v1.0.0) — Xerife dos Cards.
  (4) **tuninho-hook-cards-mural**: Novo hook — detecta cards no prompt e em operacoes
  de arquivo, forca invocacao do delivery-cards.
  (5) **tuninho-hook-guardiao-skills**: Novo hook — monitora modificacoes em skills e
  forca invocacao do updater modo track.
  (6) **Guardian integration**: Modo track agora le/limpa guardiao-state.json.
  (7) **Verify expandido**: Valida 5 hooks + 7 skills + naming convention.
  (8) **Personificacao**: Tuninho como Xerife das Skills e Hooks.

- **v3.2.0** (2026-03-26): Novo modo `track` para rastreamento de modificacoes locais
  em skills. Cria `_a4tunados/local-changes.json` como registro de todas as mudancas
  feitas localmente com bump automatico de versao (patch/minor/major). Integrado com
  smart mode (mostra pendencias), push mode (marca como enviado) e pull mode (avisa
  conflitos). Regra #16: track obrigatorio apos editar qualquer skill tuninho-*.
  O agente (Claude Code) e responsavel por invocar automaticamente — nao depende
  do usuario lembrar. Resolve o problema de modificacoes perdidas sem versionamento.

- **v3.1.0** (2026-03-26): Merge de recuperacao. Incorporado Preflight express e modo express
  do remoto v3.0.0. Adicionado Protocolo de Merge Inteligente (Etapa 2.5) no push mode
  para prevenir perda de conteudo em PRs concorrentes. Regra #12: merge antes de push.
  Preservado todo conteudo local. Licoes #7-8 incorporadas do remoto.

- **v1.2.0** (2026-03-24): Adicionado modo `cleanup` para deteccao e limpeza de
  artefatos legados V2.x/V3.x (submodulos git, commands depreciados, skills legadas,
  sistema sync, handoffs stale). Integrado ao smart mode e bootstrap como Etapa 0.5.
  Artefatos movidos para `_a4tunados/zzz_old_files/` preservando estrutura relativa.
  12 patterns de deteccao, protecao de assets ativos, confirmacao obrigatoria.

- **v1.1.0** (2026-03-24): Adicionado modo `smart` (padrao), fluxo de bootstrap para
  primeira instalacao, setup automatico de hooks (nivel usuario), secao de
  retroalimentacao, `references/licoes-aprendidas.md`, triggers em linguagem natural.

- **v1.0.0** (2026-03-24): Versao inicial. 4 modos de operacao (status, pull, push,
  verify), cache em `_a4tunados/.cache/`, manifest.json como fonte de verdade remota,
  preservacao de sidecars, auto-update do updater.

---

---

## Nota operacional — Bump de versao e ritual triplo obrigatorio

Adicionado em 2026-04-21 apos gap detectado pelo tuninho-qa audit-ambiente
(Licao #18 do QA).

**Toda operacao de bump de skill DEVE atualizar 3 pontos simultaneamente:**

1. **Manifest** (`_a4tunados/.cache/a4tunados-ops-suite/manifest.json` OU
   `/root/.claude/plugins/a4tunados-ops-suite/manifest.json` conforme arquitetura)
2. **H1 do SKILL.md** (`# Tuninho {Nome} v{N}` — linha com `#` unico no topo)
3. **Rodape do SKILL.md** (`*Tuninho {Nome} v{N} — a4tunados-ops-suite*` ao final)

Ignorar qualquer um dos 3 pontos cria **divergencia silenciosa** que:
- Nao falha em validacao trivial
- Gera FAIL no `audit-ambiente` do tuninho-qa (check de coerencia manifest vs SKILL.md)
- Confunde outros agentes que consultam "qual versao esta instalada"

**Fluxo canonico de bump (6 passos):**
1. Editar `SKILL.md` — adicionar conteudo novo (secao, historico)
2. Atualizar H1 no topo do `SKILL.md` para nova versao
3. Atualizar rodape no final do `SKILL.md` para nova versao
4. Invocar `tuninho-updater track` que atualiza manifest local
5. (Opcional) Invocar `tuninho-updater push` para propagar ao repo central via PR
6. Re-validar via `tuninho-qa audit-ambiente` que todos 3 pontos estao coerentes

**Sub-check pendente no tuninho-qa v0.7.0+**: `audit-version-coherence` fara essa
validacao automatica pos-bump. Ate la, depende de diligencia do operador/agente.

---

*Tuninho Updater v5.0.1 — a4tunados-ops-suite*
