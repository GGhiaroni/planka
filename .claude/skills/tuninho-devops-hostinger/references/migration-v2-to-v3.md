# Migration Guide — tuninho-devops-hostinger-alfa v2.x → tuninho-devops-hostinger v3.0.0

> Documento de referência oficial do refactor multi-host executado na **Operação 25** (2026-04-15).
> Este é o **ponto único de verdade** sobre o que mudou, por quê e quais ajustes cascateraram para outras skills do ops-suite.

---

## TL;DR

- **Skill renomeada**: `tuninho-devops-hostinger-alfa` → `tuninho-devops-hostinger`
- **Bump**: v2.3.0 → **v3.0.0** (MAJOR, breaking por rename; comportamento retroativamente compatível via triggers de compat)
- **Suporta múltiplos servidores** Hostinger (hostinger-alfa, hostinger-beta, e futuros) via registry central
- **Sidecars reorganizados**: `projects/{projeto}/config.md` → `projects/{host}/{projeto}/config.md`
- **Novo registry central**: `_a4tunados/deploys/servers-registry.yaml` (schema v2.0.0)
- **Novos references**: `project-profiles.md` (4 perfis estruturais) + `sidecar-templates/full-stack.md`
- **6 skills dependentes** cascatearam atualização (ddce, qa, devops-env, fix-suporte, mandapr, e a própria hostinger)

---

## Motivação

A versão v2.x da skill estava desenhada para **um único servidor** Hostinger (hostinger-alfa, IP 31.97.243.191). O SKILL.md tinha >50 referências hardcoded ao IP, path base e SSH key path, impedindo uso em novos servidores sem refactor.

Com a chegada do **hostinger-beta** (srv1590899.hstgr.cloud, 76.13.239.198) como servidor adicional — que virará produção no futuro, enquanto alfa migra para staging/homologação — o modelo monohost tornou-se limitante. Precisávamos:

1. **Parametrizar** o host alvo (IP/SSH/base_path) em vez de hardcode
2. **Organizar sidecars por servidor** para evitar colisão de nomes e permitir o mesmo projeto em múltiplos hosts
3. **Centralizar o catálogo de servidores** em um único arquivo-fonte-da-verdade
4. **Formalizar perfis estruturais de projetos** para guiar deploys de projetos com perfis distintos (light SQLite vs full-stack com DB externo, etc.)
5. **Preservar zero downtime** dos 7 projetos rodando em produção no alfa

---

## Mudanças na skill renomeada

### 1. Rename do diretório (git mv)

```
.claude/skills/tuninho-devops-hostinger-alfa/   →   .claude/skills/tuninho-devops-hostinger/
```

Executado via `git mv` para preservar histórico.

### 2. Frontmatter do SKILL.md

**Antes**:
```yaml
name: tuninho-devops-hostinger-alfa
description: >
  Tuninho DevOps Hostinger Alfa — Guia interativo de deploy para o servidor
  Hostinger VPS (hostinger-alfa). ...
```

**Depois**:
```yaml
name: tuninho-devops-hostinger
description: >
  Tuninho DevOps Hostinger — Guia interativo de deploy para servidores Hostinger VPS
  (hostinger-alfa, hostinger-beta, e futuros). ... Servidor alvo e parametrizado via
  `_a4tunados/deploys/servers-registry.yaml` (Stage 0 resolve IP/SSH/paths). ...
  /tuninho-devops-hostinger, /tuninho-devops-hostinger-alfa (compatibilidade), ...
```

Compatibilidade retroativa preservada: operadores que ainda digitarem `/tuninho-devops-hostinger-alfa` ativam a skill nova, que resolve `SERVER_NAME=hostinger-alfa` automaticamente.

### 3. Título e versão

**Antes**: `# Tuninho DevOps Hostinger Alfa v2.3.0`
**Depois**: `# Tuninho DevOps Hostinger v3.0.0`

### 4. Nova seção "Multi-Host Support (v3.0.0 — Op 25)"

Adicionada no topo do SKILL.md, descreve:
- Servidores suportados (tabela com IP, status, role)
- Como a skill resolve o servidor alvo via `servers-registry.yaml`
- Variáveis `${SERVER_NAME}`, `${SERVER_IP}`, `${SSH_KEY}`, `${BASE_PATH}`, etc.
- Nova organização `projects/{host}/{project}/`
- References adicionados em v3.0.0 (project-profiles.md, sidecar-templates/)
- Nota de compatibilidade retroativa (arquivos históricos permanecem)

### 5. Conteúdo do corpo (stages 0-9) — estratégia pragmática

**Os ~50 hardcodes ao IP 31.97.243.191 e ao path `/opt/hostinger-alfa/` no corpo do SKILL.md não foram substituídos cirurgicamente**. Razões documentadas:

1. **Risco**: refatorar 1372 linhas aumenta chance de quebra
2. **Custo/benefício**: o corpo serve como "exemplo concreto para alfa", que é o servidor com 7 projetos ativos
3. **Stage 0 resolve**: quem segue a skill para beta lê a seção Multi-Host Support no topo e usa o registry
4. **Retroalimentação futura**: uma op futura pode fazer refactor cosmético total

Isto é uma dívida técnica consciente, registrada como "deferred" na v3.0.0 e passível de fix em v3.1.0+.

### 6. Reorganização de `projects/`

**Antes**:
```
projects/
├── README.md
├── tuninho-ide-web/config.md
├── maestrofieldmanager/config.md
├── chooz_2026/config.md
├── claude-sessions-service/config.md
├── familygames/config.md
├── weplus_prototipo/config.md
└── orquestravoadora/config.md
```

**Depois**:
```
projects/
├── README.md
├── hostinger-alfa/
│   ├── tuninho-ide-web/config.md
│   ├── maestrofieldmanager/config.md
│   ├── chooz_2026/config.md
│   ├── claude-sessions-service/config.md
│   ├── familygames/config.md
│   ├── weplus_prototipo/config.md
│   └── orquestravoadora/config.md
└── hostinger-beta/
    └── mural/config.md       ← NOVO (perfil full-stack)
```

Os 7 sidecars do alfa foram movidos via `git mv` (preserva histórico). O sidecar do mural no beta é novo (371 linhas, usa o template full-stack).

### 7. Novas referências em `references/`

#### `project-profiles.md` (286 linhas, novo)

Catálogo de **4 perfis estruturais** de projetos no Hostinger:

| Perfil | Característica | Exemplos |
|---|---|---|
| **light** | SQLite file-based, Node.js simples | tuninho-ide-web, maestrofieldmanager, chooz_2026, claude-sessions-service |
| **static** | Vanilla sem DB, HTML/CSS/JS puro ou Node leve | familygames, weplus_prototipo |
| **systemd_flask** | Python Flask + Gunicorn via systemd | orquestravoadora |
| **full-stack** | PostgreSQL externo + Python venv + uploads + WebSocket + nativos pesados | **mural** (inaugura perfil no Hostinger via Op 25) |

Cada perfil documenta: runtime, persistência, build, networking, deploy, ciclo de vida, projetos que usam.

#### `sidecar-templates/full-stack.md` (211 linhas, novo)

Template reutilizável para sidecars de projetos do perfil `full-stack`. 11 seções obrigatórias: Projeto, Particularidades de Deploy, Env vars, Ecosystem.config.js, Nginx config, Sequência de deploy, rsync_excludes, conditional_triggers, cross_projects, Histórico de Deploys, Observações.

---

## Novo registry central: `_a4tunados/deploys/servers-registry.yaml`

**Path**: `_a4tunados/deploys/servers-registry.yaml`
**Schema**: v2.0.0
**Propósito**: fonte-única-de-verdade para metadata de servidores do ops-suite

**Estrutura**:
```yaml
version: "2.0.0"
servers:
  hostinger-alfa:
    ip: "31.97.243.191"
    provider: "Hostinger VPS"
    os: "Ubuntu 25.04 (plucky)"
    ssh:
      key_path_local: "~/.ssh/hostinger_ed25519"
      passphrase_ref: "_a4tunados/env/hostinger/ssh-config.env"
      user: "root"
    paths:
      base: "/opt/hostinger-alfa/"
      nginx_sites: "/opt/hostinger-alfa/nginx/sites/"
      backups: "/opt/hostinger-alfa/backups/"
    role:
      current: "multi_project_primary"
      future: "dev_staging_homologacao"
    projects: [...]  # 7 projetos listados
    next_available_port: 3851

  hostinger-beta:
    ip: "76.13.239.198"
    hostname: "srv1590899"
    provider: "Hostinger VPS"
    os: "Ubuntu 25.10 (Questing Quokka)"
    resources: { ram_gb: 31, vcpus: 8, disk_gb: 387 }
    ssh:
      key_path_local: "~/.ssh/hostinger_beta_ed25519"
      passphrase_ref: "_a4tunados/env/hostinger-beta/ssh-config.env"
      user: "root"
    paths:
      base: "/opt/hostinger-beta/"
      nginx_sites: "/opt/hostinger-beta/nginx/sites/"
      backups: "/opt/hostinger-beta/backups/"
    role:
      current: "bootstrapping_and_staging"
      future: "producao"
    projects: []  # ainda vazio (mural em planned)
    next_available_port: 1337
    planned_projects:
      - name: "mural"
        domain: "mural.a4tunados.tuninho.ai"
        profile: "full-stack"
        status: "planned"
```

**Consumo**:
- Stage 0 da `tuninho-devops-hostinger` lê este arquivo e popula variáveis do deploy
- `tuninho-devops-env` pode consultar para enriquecer catalogs
- `tuninho-qa` audit-deploy consulta para validar cross-project impact

**Não contém secrets**: passphrase/senhas vivem em `_a4tunados/env/<host>/ssh-config.env` (não versionado).

---

## Novo registry histórico do beta

**Path**: `_a4tunados/deploys/hostinger-beta/server-registry.json`
**Schema**: v1.0.0 (espelho do alfa)
**Propósito**: registry histórico de deploys formais no beta (separado do alfa)

Cada deploy formal da skill grava aqui após Stage 8. Começa vazio na criação (Op 25 Fase 2 T2.9) com 1 pending_deploy (o mural).

**Distinção com servers-registry.yaml**:
- `servers-registry.yaml` = metadata estática do servidor (IP, paths, role)
- `hostinger-beta/server-registry.json` = histórico dinâmico de deploys executados no servidor

---

## Cascata de atualizações em outras skills

### 1. `tuninho-ddce`

**Versão**: v4.0.0 → **v4.0.1** (PATCH)
**Mudanças**:
- `SKILL.md` linha 245: Integração com tuninho-devops-hostinger atualizada para mencionar multi-host e v3.0.0+
- `SKILL.md` linha 481: Eixo (g) do DISCOVER atualizado para novo path `projects/{host}/{projeto}/`
- `SKILL.md` Regra #24 (deploy via tuninho-devops): nome atualizado
- `SKILL.md` Regra #25 (tuninhos devops no Discovery): nome atualizado + menção a project-profiles.md
- `references/contract-spec.md` linha 207: `contracted: tuninho-devops-hostinger-alfa` → `tuninho-devops-hostinger`

**Não mudam** (histórico):
- Changelog v3.11.0, v3.7.0 (SKILL.md linhas 2062, 2131, 2135)
- Linha 251: explicação retroativa ("Pre-v3.0.0 era chamada...")

### 2. `tuninho-qa`

**Versão**: v1.0.0 → **v1.0.1** (PATCH)
**Mudanças**:
- `scripts/audit-sidecars.sh` linha 5: comentário atualizado
- `scripts/audit-sidecars.sh` linha 39: `DEVOPS_SKILLS` list com novo nome
- `scripts/audit-ambiente.sh` linha 58: `EXPECTED_SKILLS` list com novo nome
- `SKILL.md` linha 272: path do sidecar atualizado para `projects/{host}/{projeto}/`

**Não mudam** (histórico):
- `SKILL.md` linhas 893, 913: descrição de incidentes na Op 23
- `projects/a4tunados_mural/incidence-counter.json`: state file de incidências históricas

### 3. `tuninho-devops-env`

**Versão**: v1.0.1 → **v1.1.0** (MINOR — feature multi-host)
**Mudanças**:
- `SKILL.md` linha 477: referência à skill renomeada
- `SKILL.md` linha final: nota de integração futura atualizada
- `projects/server-inventory.json`: **7 sidecar_paths** corrigidos para novo layout `projects/hostinger-alfa/{projeto}/`
- **Nota**: reorganização `projects/{host}/` interna do próprio devops-env foi **diferida** para versão futura (mantém schema v1.0.0 por ora; apenas sidecar_paths apontando para os novos locais)

### 4. `tuninho-fix-suporte`

**Versão**: v2.0.0 → **v2.0.1** (PATCH)
**Mudanças**:
- `SKILL.md` linhas 353, 485: referências ao novo nome
- `projects/tuninho-ide-web/sidecar.md` linhas 15, 25: deploy e deploy sidecar path
- `projects/familygames/sidecar.md` linhas 15, 25: mesma coisa
- `projects/orquestravoadoraoficina2026/sidecar.md` linha 35: deploy sidecar path

### 5. `tuninho-mandapr` (DEPRECATED)

**Versão**: v3.2.0 → **v3.2.1** (PATCH)
**Mudanças**:
- `SKILL.md` linha 20: referência ao novo nome
**Nota**: skill está deprecada desde v3.2.0; bump é apenas para registrar o alinhamento de referência.

### 6. `tuninho-devops-hostinger` (a própria)

**Versão**: v2.3.0 → **v3.0.0** (MAJOR — rename + multi-host)
Ver seções acima.

---

## Referências em arquivos NÃO modificados (decisão documentada)

Grep final retornou 37 refs a `tuninho-devops-hostinger-alfa` em arquivos **intencionalmente mantidos**. Por quê:

| Arquivo | Refs | Por quê mantém |
|---|---|---|
| `tuninho-devops-hostinger/SKILL.md` | 4 | Documentação intencional de compatibilidade retroativa (trigger, título alternativo, nota histórica) |
| `tuninho-ddce/SKILL.md` linha 251 | 1 | Explicação retroativa ativa ("Pre-v3.0.0 era chamada...") |
| `tuninho-ddce/SKILL.md` linhas 2062, 2131, 2135 | 3 | Changelog histórico das v3.11.0, v3.7.0 — descrição de eventos passados |
| `tuninho-qa/SKILL.md` linhas 893, 913 | 2 | Descrição de incidentes passados na Op 23 |
| `tuninho-qa/projects/a4tunados_mural/incidence-counter.json` | 6 | State file de incidências (cada entry é registro timestamped de um evento real) |
| `.claude/tuninho-hook-guardiao-state.json` | 2 | State file do hook com registros históricos |
| `.claude/settings.local.json` linha 85 | 1 | Permissão Bash concedida historicamente (não causa dano; apenas registro de consentimento) |
| `_a4tunados/deploys/servers-registry.yaml` linha 7 | 1 | Comentário de criação do arquivo ("Refactor da skill tuninho-devops-hostinger-alfa para comportar multiplos") |
| `_a4tunados/deploys/hostinger-alfa/server-registry.json` | 9 | Registry histórico dedicado ao alfa; campos `executed_by` e `notes` descrevem eventos passados |
| Arquivos em `_a4tunados/_operacoes/`, `_a4tunados/docs_*/sessoes/` etc. | ~40 | Snapshots imutáveis de operações/sessões passadas (prompts, discovery, define, handoffs, raw JSONLs, ADRs) |

**Princípio**: arquivos históricos refletem a realidade do momento em que foram criados. Reescrever quebraria a semântica histórica. É como renomear uma empresa — você atualiza os documentos futuros, não reescreve os contratos passados.

---

## Arquivos NÃO tocados intencionalmente

### `services/claude-sessions-service/`

Este service roda **exclusivamente** no hostinger-alfa (é o backend da tuninho-ide-web). Seus paths literais `/opt/hostinger-alfa/` (em `deploy-scripts/deploy.sh`, `server/index.js`, `.env.example`, `README.md`) são **corretos** — não seriam substituídos nem em teoria, porque o service nunca rodará em outro servidor no formato atual.

### `_a4tunados/_operacoes/`

Todos os prompts, discovery, define, handoffs, raw JSONLs e reviews de operações passadas (Op 17-24) permanecem intactos. São snapshots imutáveis.

### `_a4tunados/docs_a4tunados_mural/`

Todo o vault do Escriba (sessoes, decisoes, pesquisas, prompts, implementacao) permanece intacto. Histórico contextual.

### Hooks, agents, commands (.claude/hooks/, .claude/agents/, .claude/commands/)

Grep confirmou **zero** referências em qualquer um destes diretórios. Não precisam de update.

---

## O que ainda falta para "clean completo" do ops-suite

1. **Manifest remoto** (`a4tunados-ops-suite/manifest.json` no GitHub privado)
   - Entrada `tuninho-devops-hostinger-alfa` → renomear para `tuninho-devops-hostinger`
   - Bump: `version: 2.3.0` → `version: 3.0.0`
   - Outras skills com bumps desta op precisam ser atualizadas no manifest
   - **Quando**: Fase 8 (retroalimentação) via `tuninho-updater push`

2. **Instalações em outros ambientes** (máquinas de outros devs ou outros projetos com o ops-suite)
   - `/tuninho-updater pull` após o manifest remoto ser atualizado
   - A skill velha (`tuninho-devops-hostinger-alfa/`) pode ser removida localmente por cada instalação via `/tuninho-updater` (ou manualmente)

---

## Como usar a skill renomeada (v3.0.0+)

### Para deploy no hostinger-alfa (comportamento retroativo)

```
Operador: "deploy hostinger-alfa maestrofieldmanager"
Skill:    resolve SERVER_NAME=hostinger-alfa via servers-registry.yaml
          carrega projects/hostinger-alfa/maestrofieldmanager/config.md
          executa os 11 stages com os paths /opt/hostinger-alfa/...
          (comportamento idêntico a v2.x)
```

### Para deploy no hostinger-beta (novo em v3.0.0)

```
Operador: "deploy hostinger-beta mural"  (ou "bootstrap beta mural")
Skill:    resolve SERVER_NAME=hostinger-beta via servers-registry.yaml
          carrega projects/hostinger-beta/mural/config.md (full-stack)
          executa Stage 0B (bootstrap) + Stages 1-8 com paths /opt/hostinger-beta/...
```

### Trigger de compatibilidade retroativa

Operadores que digitarem `/tuninho-devops-hostinger-alfa` ativam a skill nova, que detecta o sufixo `-alfa` no trigger e resolve `SERVER_NAME=hostinger-alfa` automaticamente. Zero fricção.

---

## Changelog da operação

| Data | Op | Autor | Mudança |
|------|----|----|---------|
| 2026-04-15 | Op 25 Fase 1 | victorgaudio + claude-opus-4-6 | Criação de `project-profiles.md` + `sidecar-templates/full-stack.md` |
| 2026-04-15 | Op 25 Fase 2 | victorgaudio + claude-opus-4-6 | Rename skill + bump v3.0.0 + reorganização sidecars + atualização cascata em 5 skills dependentes + criação de 2 registries + criação deste documento de migração |

---

## Referências cruzadas

- **Discovery da Op 25**: `_a4tunados/_operacoes/prompts/25_1_DISCOVERY_replicacao_mural_hostinger_beta.md`
- **Discovery XP**: `_a4tunados/_operacoes/prompts/25_1-xp_DISCOVERY_replicacao_mural_hostinger_beta.md`
- **Plano da Op 25**: `_a4tunados/_operacoes/prompts/25_2_DEFINE_PLAN_replicacao_mural_hostinger_beta.md`
- **Plano XP**: `_a4tunados/_operacoes/prompts/25_2-xp_DEFINE_PLAN_replicacao_mural_hostinger_beta.md`
- **Review Fase 2**: `_a4tunados/_operacoes/projetos/25_replicacao_mural_hostinger_beta/fase_02/review.md`
- **Registry central**: `_a4tunados/deploys/servers-registry.yaml`
- **Registry alfa**: `_a4tunados/deploys/hostinger-alfa/server-registry.json`
- **Registry beta**: `_a4tunados/deploys/hostinger-beta/server-registry.json`
- **Perfis estruturais**: `references/project-profiles.md`
- **Template full-stack**: `references/sidecar-templates/full-stack.md`

---

**Doc criado**: 2026-04-15 durante Op 25 Fase 2 pós-auditoria do operador.
**Última atualização**: 2026-04-15
**Mantido por**: skill `tuninho-devops-hostinger` — atualizar em operações futuras que toquem a arquitetura multi-host
