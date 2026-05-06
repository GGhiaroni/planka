# Ritual Completo — Tuninho da Comlurb

Detalhamento passo-a-passo do que o Tuninho faz quando invocado. Serve como
referencia tecnica para o agente seguir o script e para auditoria do QA.

## Pre-condicoes

1. **Operacao DDCE ativa**: deve existir ao menos um diretorio em
   `_a4tunados/_operacoes/projetos/{NN}_*/`. Se nao: skill roda em modo degraded
   (sync JSONL + aviso, sem HANDOFF update).
2. **Modo declarado**: operador ou hook que invoca deve passar `--mode=<modo>`
   como argumento. Default: `faxina-pre-clear`.
3. **Tuninho-qa instalada**: `.claude/skills/tuninho-qa/SKILL.md` existe.

## Passo 1 — Sincronizar JSONL da sessao atual

**Script:** `scripts/sync-jsonl-final.sh`

**Fluxo:**
1. Derivar `slug` do projeto a partir do `cwd`: substitui `/` por `-`, remove
   leading `-`. Exemplo: `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai`
   → `-opt-hostinger-alfa-workspaces-tuninho-ide-victorgaudio-tuninho-ai` (nota: `.` vira `-`).
2. Listar JSONLs em `~/.claude/projects/{slug}/`:
   ```bash
   ls -t ~/.claude/projects/{slug}/*.jsonl 2>/dev/null | head -1
   ```
3. O JSONL mais recente e o da sessao atual (sendo escrito).
4. Destino: `_a4tunados/_operacoes/projetos/{NN}_*/handoffs/raw_sessions/{data}_sessao_{NN}_{uuid8}_partial.jsonl`
5. Copiar com `cp` (nao `mv`) — o JSONL original continua vivo em `~/.claude/projects/`.
6. Registrar bytes copiados + timestamp.
7. Copiar tambem plan files em `~/.claude/plans/` e `~/.claude/todos/` se houver
   (reutilizar logica do `tuninho-portas-em-automatico/scripts/coletar-plan-files.sh`).

**Edge cases:**
- JSONL nao existe (sessao nova sem prompts): skip silenciosamente.
- Destino ja existe com mesmo nome: gerar `_v2`, `_v3`, etc.
- FS lento (cp demora): timeout 30s, warning, continuar.

## Passo 2 — Atualizar HANDOFF incrementalmente

**Script:** `scripts/atualizar-handoff.py`

**Fluxo:**
1. Detectar sessao atual: ler `_a4tunados/_operacoes/projetos/{NN}_*/handoffs/` e
   pegar o arquivo com `updated_at` mais recente (ou ultimo por data no nome).
2. Se nao existir HANDOFF da sessao atual: criar usando template (ver abaixo).
3. Carregar YAML.
4. Atualizar campos (merge, nao overwrite — preservar decisoes ja registradas):
   - `encerramento_timestamp`: agora
   - `raw_sessions_coletadas.local`: adicionar path do JSONL sincronizado no passo 1
   - `arquivos_modificados`: listar via `git status --short`
   - `decisoes_tomadas`: manter existentes + adicionar novas se passadas como arg
   - `pendencias_declaradas`: ler do YAML passado como input (agente declara)
   - `proximos_passos_sessao_N+1`: agente informa via arg ou stdin
   - `briefing_proxima_sessao.content_path`: gerar e salvar em `handoffs/briefings/`
5. Salvar YAML de volta.

**Template de HANDOFF (se criar novo):**
```yaml
---
operacao: "{NN}_{nome}"
sessao: {NN}
branch_git: "{branch}"
inicio_timestamp: "{ISO-8601}"
encerramento_timestamp: null         # preenchido pelo Comlurb
status: "em_andamento"                # em_andamento | concluida

ddce:
  fase_metodo: null
  etapa_atual: null
  fase_execucao: null
  tarefa_atual: null

contexto:
  objetivo: ""
  progresso: ""

painel_resumido:
  fases_concluidas: []
  fase_atual: ""
  fases_pendentes: []

raw_sessions_coletadas:
  local: []
  outros_environments: []
  plan_files: []
  coletado_em: ""
  coletado_por: ""

decisoes_tomadas: []
arquivos_modificados: []
riscos_ativos: []

pendencias_declaradas:
  fechadas_nesta_sessao: []
  abertas_nesta_sessao: []
  deferidas: []

tokens:
  inicio: 0
  fim: 0
  delta: 0
  custo_usd: 0

proximos_passos_sessao_N_mais_1: []

briefing_proxima_sessao:
  length_words: 0
  key_points: []
  content_path: null

comlurb_sealed: false                 # aplicado por aplicar-seal.py
```

## Passo 3 — Reconciliar pendency-ledger

**Script:** `scripts/reconciliar-pendency-ledger.py`

**Fluxo:**
1. Ler `_a4tunados/_operacoes/projetos/{NN}_*/pendency-ledger.yaml`. Se nao existe: criar com `pendencies: []`.
2. Ler `handoffs/HANDOFF_{date}_sessao_{NN}.yaml` → campo `pendencias_declaradas`.
3. Aplicar mudancas:
   - Para cada id em `fechadas_nesta_sessao`: setar `status: closed` + popular `fechada_em_sessao` + `fechada_em_timestamp` + `resolucao`
   - Para cada em `abertas_nesta_sessao`: adicionar como nova pendencia com `origem_sessao: sessao_NN`
   - Para cada em `deferidas`: setar `status: deferred` + popular `razao_deferimento`
4. Scan pendencias abertas de sessoes anteriores: se nenhuma mencao nesta sessao,
   marcar como `silenciosamente_carregada`.
5. Recalcular `summary`.
6. Salvar.

## Passo 4 — Invocar tuninho-qa

Em modo headless (sem interacao), invocar 3 modos em sequencia:

### 4.1. audit-handoff

```bash
.claude/skills/tuninho-qa/scripts/audit-handoff.sh --operacao {NN} --sessao {NN}
```

Valida:
- HANDOFF existe e tem todos campos obrigatorios preenchidos
- raw_sessions coletadas nao esta vazio
- arquivos_modificados bate com `git status`
- proximos_passos tem >= 1 item

### 4.2. audit-continuidade (novo em v0.6.0)

```bash
.claude/skills/tuninho-qa/scripts/audit-continuidade.sh --operacao {NN}
```

Valida:
- pendency-ledger existe e eh consistente
- nenhuma pendencia em `silenciosamente_carregada`
- summary.total bate com contagem real de pendencies
- JSONL da sessao atual foi sincronizado (raw_sessions atualizado)

### 4.3. audit-handoff-freshness (sub-check)

Parte de audit-handoff, mas pode ser chamado isolado:
- Timestamp do HANDOFF e mais recente que timestamp do ultimo review.md?
- Proof: `stat -c %Y handoffs/HANDOFF_*.yaml` vs `stat -c %Y fase_*/review.md`.

**Decisao:**
- Todos PASS: prossegue para passo 5
- Algum FAIL: **BLOQUEIA** ritual. Apresenta painel de gaps. NAO aplica seal.

## Passo 5 — Aplicar seal + apresentar painel

**Script:** `scripts/aplicar-seal.py` + `scripts/apresentar-painel.py`

**Fluxo:**
1. Adicionar no HANDOFF os campos `comlurb_sealed: true` + todos campos de seal.
2. Salvar HANDOFF.
3. Gerar o arquivo `handoffs/briefings/BRIEFING_{date}_sessao_{N+1}.md` que a
   proxima sessao vai ler. Conteudo: 150 palavras minimo cobrindo:
   - Estado atual (3 sentencas)
   - Decisoes-chave desta sessao (bullets)
   - Proxima acao concreta (1 sentenca acionavel)
   - Riscos pendentes (bullets)
4. Commit GIT opcional (se operador configurou auto-commit de handoffs).
5. Apresentar painel via stdout para o agente passar ao operador.

## Invocacao direta

O entry-point `scripts/faxina.sh` orquestra os 5 passos:

```bash
/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai/.claude/skills/tuninho-da-comlurb/scripts/faxina.sh \
  --mode faxina-pre-clear \
  --cwd /opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai
```

Output no stdout: painel final (pra agente apresentar ao operador).
Exit codes:
- 0: ritual OK, seal aplicado
- 1: ritual FAIL, gaps detectados
- 2: erro tecnico (script faltando, permissao, etc)
