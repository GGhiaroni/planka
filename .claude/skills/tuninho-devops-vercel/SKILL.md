# Tuninho DevOps Vercel v5.0.0

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

# Tuninho DevOps Vercel v1.0.1

> **a4tunados-ops-suite** — Esta skill faz parte do pacote de operacoes a4tunados.
> Mantenha-a atualizada via `tuninho-updater`.

> Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

## Resolucao de Contexto do Projeto (OBRIGATORIA)

Antes de iniciar qualquer etapa operacional:

1. **Identificar projeto**: `git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||'`
2. **Verificar vault**: `_a4tunados/docs_{nome}/MOC-Projeto.md` — se existe, ler para contexto. Se nao, alertar operador para rodar escriba.
3. **Carregar sidecar** da skill (se existir em `projects/`)
4. **Carregar env-catalog** de tuninho-devops-env (se existir)

> **REGRA DE OURO:** Nenhum conhecimento sobre o projeto deve ser priorizado para ficar na memoria do Claude Code. Toda informacao relevante deve residir nas skills, sidecars, ou vault. O vault do escriba e a FONTE PRINCIPAL.

---

## Missao

Tres pilares inviolaveis:

1. **DEPLOY CONFIAVEL** — via CLI, sem depender da GitHub integration
2. **IDENTIDADE CORRETA** — CLI autenticado como operacoes4tuna (dono da conta Vercel)
3. **MAXIMO confirmacoes humanas** — gates em pontos criticos

---

## Por Que Esta Skill Existe

O Vercel Hobby plan bloqueia deploys de commits cujo autor nao e o dono da conta.
A integracao GitHub auto-deploy parou de funcionar em marco/2026 para projetos
onde o desenvolvedor (`victorgaudio`) nao e o dono da conta Vercel (`operacoes4tuna`).

**Solucao**: deploy via Vercel CLI (`npx vercel@latest --prod --yes`) com o CLI
autenticado como `operacoes4tuna`. Isso bypassa completamente a integracao GitHub.

**Importante**: Esta skill NAO faz operacoes git (commit, push, branch, PR).
O fluxo git pertence ao **Escriba (Etapa 7)**. Esta skill e invocada APOS
o Escriba ter concluido o git flow.

---

## Contexto Operacional — Vercel operacoes4tuna

| Item | Valor |
|------|-------|
| **Conta Vercel** | operacoes4tuna |
| **Email** | operacoes@4tuna.com.br |
| **Scope/Team** | a4tunados-projects |
| **Plano** | Hobby |
| **CLI** | `npx vercel@latest` (sempre usar @latest) |
| **Login CLI** | `npx vercel@latest login` (OAuth Device Flow) |
| **Whoami** | `npx vercel@latest whoami` → deve retornar `operacoes4tuna` |

### Projetos Ativos

Carregar do sidecar em `projects/{projeto}/config.md` no inicio de cada deploy.
Se o sidecar nao existir → assumir bootstrap (primeiro deploy neste projeto).

### Historico de Deploys

| Deploy | Projeto | Data | Incidentes |
|--------|---------|------|------------|
| CLI direto | orquestravoadoraoficina2026 | 2026-03-30 | Hobby plan bloqueou GitHub integration. Resolvido com CLI deploy. |

---

## Deteccao Bootstrap vs Incremental

### Modo Bootstrap (primeiro deploy do projeto)
Ativado quando:
- NAO existe sidecar em `projects/{projeto}/config.md`
- OU diretorio `.vercel/` nao existe no projeto (projeto nao linkado)

Neste modo: executa Stage 0B (setup completo).

### Modo Incremental (deploys subsequentes)
Ativado quando:
- Sidecar existe e esta preenchido
- `.vercel/project.json` existe com project ID valido

Neste modo: pula Stage 0B, vai direto para Stage 1.

---

## Fluxo de Deploy — 5 Stages com 3 GATES

```
PREFLIGHT → Stage 0 → [Stage 0B] → Stage 1 → Stage 2 → Stage 3 → Stage 4
```

---

### PREFLIGHT — Express Check

> Protocolo identico a todas as skills devops do suite.

1. Verificar versoes remotas: `gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d`
2. Comparar com versoes locais (H1 de cada SKILL.md)
3. Se atualizacoes disponiveis: perguntar ao operador
4. Se curl falhar: prosseguir silenciosamente

---

### Stage 0 — Contexto + Identificacao do Projeto

**GATE 0** — Operador confirma antes de prosseguir.

**Acoes obrigatorias:**

1. **Ler licoes aprendidas**: `references/licoes-aprendidas.md` (OBRIGATORIO antes de qualquer deploy)
2. **Identificar projeto**: pelo diretorio atual (cwd) ou perguntar ao operador
3. **Carregar sidecar**: `projects/{projeto}/config.md`
   - Se NAO existir: marcar para Bootstrap (Stage 0B)
4. **Verificar estado git**:
   - Branch atual: `git branch --show-current`
   - Commits nao-pushed: `git log origin/main..HEAD --oneline`
   - Arquivos nao-commitados: `git status --short`
   - **ALERTA** se houver mudancas nao-commitadas: "Ha mudancas locais nao-commitadas. O deploy via CLI usa os arquivos locais, nao o que esta no git. Confirma?"
5. **Apresentar resumo**:
   - Projeto identificado
   - Dominio de producao
   - Ultimo deploy (do sidecar)
   - Mudancas desde ultimo deploy
   - Riscos identificados

---

### Stage 0B — Bootstrap (condicional)

**GATE 0B** — Operador confirma que quer fazer o setup inicial.

Executado apenas no primeiro deploy de um projeto nesta skill.

**Sub-etapas:**

#### 0B.1 — Verificar Vercel CLI
```bash
npx vercel@latest --version
```
Se falhar: instruir `npm i -g vercel@latest`.

#### 0B.2 — Verificar Login
```bash
npx vercel@latest whoami
```
Deve retornar `operacoes4tuna`. Se retornar outro usuario ou erro:
```bash
npx vercel@latest login
```
Instruir o operador a logar com `operacoes@4tuna.com.br` no browser.

#### 0B.3 — Listar Projetos no Scope
```bash
npx vercel@latest projects ls --scope a4tunados-projects
```
Identificar se o projeto ja existe no Vercel ou precisa ser criado.

#### 0B.4 — Linkar Projeto
Se `.vercel/project.json` nao existe:
```bash
npx vercel@latest link --project {nome_projeto} --yes --scope a4tunados-projects
```

#### 0B.5 — Verificar vercel.json
Confirmar que `vercel.json` existe e esta configurado corretamente.
Se nao existir, alertar o operador.

#### 0B.6 — Verificar Dominio
```bash
npx vercel@latest domains ls --scope a4tunados-projects
```
Confirmar que o dominio do projeto esta configurado.

#### 0B.7 — Detectar Framework e Config
Analisar o projeto para preencher o sidecar:
- `vercel.json` → build config, routes
- `package.json` → framework (Next.js, React, etc.)
- `requirements.txt` → Python/Flask
- Env vars necessarias (listar NOMES, nunca valores)

#### 0B.8 — Criar Sidecar
Criar `projects/{projeto}/config.md` com os dados descobertos.
Seguir o template em `projects/README.md`.

#### 0B.9 — Deploy de Teste
```bash
npx vercel@latest --prod --yes
```
Verificar que o deploy funciona antes de considerar o bootstrap completo.

---

### Stage 1 — Verificacao de Identidade

**GATE 1** — Operador confirma identidade correta.

Esta e a etapa mais critica desta skill. Um deploy com a identidade errada
sera bloqueado pelo Vercel Hobby.

```bash
npx vercel@latest whoami
```

**Resultado esperado:** `operacoes4tuna`

Se retornar outro usuario:
1. Informar o operador: "Vercel CLI esta autenticado como {usuario}. Para deploy, precisa ser operacoes4tuna."
2. Instruir: `npx vercel@latest login` → logar como operacoes@4tuna.com.br
3. Re-verificar apos login

**NAO prosseguir** para Stage 2 sem identidade confirmada.

---

### Stage 2 — Deploy

Sem gate — o deploy e executado e o resultado e imediato.

```bash
npx vercel@latest --prod --yes
```

**Monitorar output:**
- `Uploading` → arquivos sendo enviados
- `Building` → build em progresso
- `Production: https://...` → URL do deploy
- `readyState: READY` → deploy concluido com sucesso
- `Error:` → falha, diagnosticar

**Se falhar:**
- Capturar mensagem de erro completa
- Verificar se e erro de identidade (→ voltar ao Stage 1)
- Verificar se e erro de build (→ reportar ao operador, provavelmente problema no codigo)
- Verificar se e erro de scope (→ `--scope a4tunados-projects`)

---

### Stage 3 — Verificacao Pos-Deploy

Sem gate — verificacao automatica.

1. **HTTP check no dominio de producao** (do sidecar):
```bash
curl -s -o /dev/null -w "%{http_code}" https://{dominio}/
```
Esperado: `200`

2. **Verificacoes adicionais** (se configuradas no sidecar):
   - Health endpoint
   - Funcionalidade critica (descrita no sidecar)

3. **Se HTTP != 200**:
   - Aguardar 10 segundos e tentar novamente (propagacao DNS/CDN)
   - Se persistir: alertar operador, sugerir rollback

---

### Stage 4 — Report + Atualizacao do Sidecar

Sem gate — finalizacao automatica.

1. **Atualizar historico de deploys no sidecar**:
   - Data do deploy
   - Commits incluidos (resumo)
   - Incidentes (se houve)

2. **Reportar ao operador**:
   ```
   Deploy concluido com sucesso.

   Projeto: {nome}
   URL: https://{dominio}/
   Status: HTTP {status_code}
   Tempo: {duracao}

   Sidecar atualizado em projects/{projeto}/config.md
   ```

3. **Se houver licoes aprendidas**: registrar em `references/licoes-aprendidas.md`

---

## Rollback de Emergencia

Disponivel a qualquer momento apos um deploy:

```bash
npx vercel@latest rollback --yes --scope a4tunados-projects
```

Isso reverte instantaneamente para o deploy anterior. O Vercel mantem
historico de deploys e o rollback e atomico.

Alternativa via dashboard: Vercel → Project → Deployments → deploy anterior → "..." → "Promote to Production"

---

## Regras

1. **NUNCA fazer operacoes git** — git pertence ao Escriba (Etapa 7)
2. **SEMPRE verificar identidade** antes de deployar (Stage 1)
3. **SEMPRE usar `npx vercel@latest`** — nunca `vercel` diretamente (pode estar desatualizado)
4. **NUNCA expor tokens ou credentials** no output
5. **SEMPRE atualizar o sidecar** apos cada deploy
6. **SEMPRE ler licoes-aprendidas** antes de cada deploy (Stage 0)
7. **NUNCA deployar com mudancas nao-commitadas** sem confirmacao explicita do operador

---

## Tratamento de Erros

### Vercel CLI nao autenticado
```
Error: No current user found
```
Solucao: `npx vercel@latest login` → logar como operacoes@4tuna.com.br

### Projeto nao linkado
```
Error: Project not found
```
Solucao: `npx vercel@latest link --project {nome} --yes --scope a4tunados-projects`

### Scope errado
```
Error: missing_scope
```
Solucao: adicionar `--scope a4tunados-projects` ou relinkar com scope correto

### Nome do diretorio invalido
```
Error: Project names must be lowercase...
```
Solucao: linkar explicitamente com `--project {nome_correto}`

### Build falhou
Capturar logs do build e reportar. Geralmente e problema no codigo, nao na infra.
O operador deve corrigir o codigo e re-deployar.

### Versao antiga do CLI
```
Error: legacy authentication flow is disabled
```
Solucao: `npm i -g vercel@latest` ou usar `npx vercel@latest`

---

## Versionamento

### Versionamento da Skill
A versao desta skill segue semver e esta no titulo deste arquivo.
- **Patch** (0.0.x): Ajustes no fluxo, correcoes de texto, novas licoes
- **Minor** (0.x.0): Novas funcionalidades, novos cenarios suportados
- **Major** (x.0.0): Mudanca fundamental no fluxo de deploy

### Historico

- **v1.0.1** (2026-03-30): Criacao. Deploy via CLI para contornar restricao Hobby plan.

---

*Tuninho DevOps Vercel v1.0.1 — a4tunados-ops-suite*
