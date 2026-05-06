# Estrutura Padrao — a4tunados-ops-suite v4

> Referencia de padrao estrutural para skills e hooks do pack a4tunados.
> Usado pelo modo `verify` do tuninho-updater para validar integridade.

---

## Padrao de Skill

Toda skill do a4tunados-ops-suite deve seguir esta estrutura:

### Estrutura de Diretorio

```
tuninho-{nome}/
+-- SKILL.md                    # Obrigatorio - definicao completa da skill
+-- references/                 # Obrigatorio - arquivos de referencia
|   +-- licoes-aprendidas.md    # Opcional - registro de aprendizados
|   +-- {outros-refs}.md        # Arquivos de referencia especificos
+-- projects/                   # Opcional - sidecars de projeto (quando has_sidecar=true)
    +-- README.md               # Template explicando o conceito de sidecar
    +-- {nome_projeto}/
        +-- config.md           # Config especifica do projeto (NUNCA sincronizada)
```

### SKILL.md - Formato Obrigatorio

```markdown
---
name: tuninho-{nome}
description: >
  Tuninho {Nome} — Descricao da skill incluindo triggers de invocacao.
  Use quando o usuario pedir para /{trigger}, {variacao1}, {variacao2},
  ou qualquer variacao de {proposito}.
---

# Tuninho {Nome} v{X.Y.Z}

> **a4tunados-ops-suite** — Esta skill faz parte do a4tunados-ops-suite, o conjunto
> de ferramentas operacionais do metodo a4tunados.

{Descricao do papel e missao}

Toda a comunicacao deve ser em **portugues brasileiro (pt-BR)**.

---

{Corpo da skill com etapas, regras, etc}

---

## Versionamento

### Versionamento da Skill
A versao desta skill segue semver e esta no titulo deste arquivo.
- **Patch** (0.0.x): Ajustes no fluxo, correcoes de texto
- **Minor** (0.x.0): Novas funcionalidades, novos cenarios
- **Major** (x.0.0): Mudanca fundamental no fluxo de trabalho
```

### Checklist de Validacao

- [ ] Frontmatter YAML com `name` e `description`
- [ ] `description` inclui triggers de invocacao
- [ ] H1 com versao semver: `# Tuninho {Nome} v{X.Y.Z}`
- [ ] Banner do suite: `> **a4tunados-ops-suite** — Esta skill faz parte...`
- [ ] Comunicacao em pt-BR declarada
- [ ] Diretorio `references/` existe
- [ ] Secao de Versionamento presente
- [ ] Nome segue convencao `tuninho-{nome}`

---

## Padrao de Hook

### Estrutura

```
hooks/
+-- hooks.json
+-- scripts/
    +-- tuninho-hook-conta-token.py        # PreToolUse - monitoramento de tokens
    +-- tuninho-hook-inicio-sessao.py      # UserPromptSubmit - deteccao de operacao
    +-- tuninho-hook-fim-sessao.sh         # Stop - resumo pos-sessao
    +-- tuninho-hook-cards-mural.py        # UserPromptSubmit+PreToolUse - deteccao de cards
    +-- tuninho-hook-guardiao-skills.py    # PreToolUse - guardiao de skills
```

### hooks.json - Formato

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "python3 ${CLAUDE_PLUGIN_ROOT}/scripts/tuninho-hook-conta-token.py",
        "timeout": 5000
      }, {
        "type": "command",
        "command": "python3 ${CLAUDE_PLUGIN_ROOT}/scripts/tuninho-hook-guardiao-skills.py",
        "timeout": 5000
      }]
    }],
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "python3 ${CLAUDE_PLUGIN_ROOT}/scripts/tuninho-hook-inicio-sessao.py",
        "timeout": 5000
      }, {
        "type": "command",
        "command": "python3 ${CLAUDE_PLUGIN_ROOT}/scripts/tuninho-hook-cards-mural.py",
        "timeout": 5000
      }]
    }],
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/tuninho-hook-fim-sessao.sh",
        "timeout": 30000
      }]
    }]
  }
}
```

### Requisitos dos Scripts

- Header com versao: `# ... V{X.Y.Z}`
- Interpreters explicitos no shebang: `#!/usr/bin/env python3` ou `#!/usr/bin/env bash`
- Usar `cwd` do JSON input para paths (nao depender de env vars)
- State file em `.claude/session-tracker.json` do projeto
- Nunca falhar silenciosamente em erros criticos
- Timeout respeitado (5s para Python, 30s para Bash)

---

## manifest.json - Formato

```json
{
  "suite_version": "4.0.0",
  "repo": "victorgaudio/a4tunados-ops-suite",
  "updated_at": "YYYY-MM-DD",
  "components": {
    "skills": {
      "tuninho-{nome}": {
        "version": "X.Y.Z",
        "path": "skills/tuninho-{nome}",
        "has_sidecar": false,
        "sidecar_dir": "projects"
      }
    },
    "hooks": {
      "tuninho-hook-conta-token": {
        "version": "X.Y.Z",
        "path": "hooks",
        "script": "tuninho-hook-conta-token.py",
        "event": "PreToolUse"
      },
      "tuninho-hook-inicio-sessao": {
        "version": "X.Y.Z",
        "path": "hooks",
        "script": "tuninho-hook-inicio-sessao.py",
        "event": "UserPromptSubmit"
      },
      "tuninho-hook-fim-sessao": {
        "version": "X.Y.Z",
        "path": "hooks",
        "script": "tuninho-hook-fim-sessao.sh",
        "event": "Stop"
      },
      "tuninho-hook-cards-mural": {
        "version": "X.Y.Z",
        "path": "hooks",
        "script": "tuninho-hook-cards-mural.py",
        "event": "UserPromptSubmit,PreToolUse"
      },
      "tuninho-hook-guardiao-skills": {
        "version": "X.Y.Z",
        "path": "hooks",
        "script": "tuninho-hook-guardiao-skills.py",
        "event": "PreToolUse"
      }
    }
  }
}
```

### Regras do Manifest

- `version` em cada componente DEVE bater com o H1 do SKILL.md correspondente
- `suite_version` e a versao geral do pack (independente das versoes individuais)
- `updated_at` e atualizado em cada push
- `has_sidecar: true` indica que a skill tem pasta `projects/` com configs por projeto
- `sidecar_dir` indica o nome da pasta de sidecar
- Sidecars sao **acumulativos**: sincronizados via pull/push com merge por subdiretorio

---

## Convencao de Nomenclatura v4.0.0

**Regra absoluta**: Todo artefato do a4tunados-ops-suite usa prefixo `tuninho-`.

| Item | Padrao | Exemplo |
|------|--------|---------|
| Skill folder | `tuninho-{nome}` | `tuninho-ddce` |
| Skill file | `SKILL.md` (maiusculo) | — |
| References | `{topico}.md` (minusculo, hifen) | `licoes-aprendidas.md` |
| Sidecar config | `config.md` | `projects/a4tunados_mural/config.md` |
| Hook (manifesto) | `tuninho-hook-{nome}` | `tuninho-hook-conta-token` |
| Hook (script) | `tuninho-hook-{nome}.py/.sh` | `tuninho-hook-conta-token.py` |
| Versao | semver `X.Y.Z` | `v1.4.0` |
| Branches de update | `feat/update-{skill}-v{versao}` | `feat/update-ddce-v1.5.0` |

Esta convencao permite identificacao imediata de artefatos do suite via
`grep -r "tuninho-"` ou `ls tuninho-*`.

---

## Estrutura Padrao do Diretorio _a4tunados/

O diretorio `_a4tunados/` e a raiz operacional do metodo a4tunados em cada projeto.
O updater DEVE garantir que esta estrutura exista ao instalar o ops-suite (bootstrap).

```
_a4tunados/
├── .cache/                          # Cache do ops-suite (git clone do repo)
│   └── a4tunados-ops-suite/         # Resetado a cada pull/push
├── _operacoes/                      # Artefatos operacionais
│   ├── cards/                       # Cards do mural (delivery-cards)
│   │   ├── {cardId}_{slug}/
│   │   │   ├── original_*.md
│   │   │   └── results_*.md
│   │   └── cards-manifest.json
│   ├── chamados/                    # Registros de suporte (fix-suporte)
│   │   └── YYYY-MM-DD_NN_slug.md   # SLA, tokens, custo, resolucao
│   ├── pendencias/                  # Itens adiados ou nao resolvidos
│   │   └── slug.md                 # Contexto para retomada futura
│   ├── projetos/                   # Operacoes DDCE
│   │   └── NN_nome/
│   └── prompts/                    # Artefatos DDCE (_0_, _1_, _2_, _3_)
├── docs_{nome_do_projeto}/          # Vault Escriba (Obsidian-compatible)
│   ├── MOC-Projeto.md              # Fonte principal de verdade do projeto
│   ├── sessoes/
│   ├── decisoes/
│   ├── implementacao/
│   └── ...
├── deploys/                        # Historico de deploys
├── env/                            # Credenciais (NAO commitado)
├── merge-backups/                  # Backups pre-merge do updater
├── ops-suite-sync-state.json       # Snapshot para 3-way merge
├── local-changes.json              # Modificacoes locais pendentes de push
└── zzz_old_files/                  # Arquivo morto de artefatos legados
```

### Pastas criadas pelo bootstrap

O updater DEVE criar estas pastas ao instalar o ops-suite pela primeira vez:
- `_a4tunados/.cache/`
- `_a4tunados/_operacoes/cards/`
- `_a4tunados/_operacoes/chamados/`
- `_a4tunados/_operacoes/pendencias/`
- `_a4tunados/_operacoes/projetos/`
- `_a4tunados/_operacoes/prompts/`

### Por que cada pasta existe

| Pasta | Responsavel | Proposito |
|-------|-------------|-----------|
| `cards/` | delivery-cards | Rastreabilidade individual de cards do mural |
| `chamados/` | fix-suporte | Registro de suporte com SLA, custo, resolucao |
| `pendencias/` | fix-suporte/ddce | Itens adiados com contexto para retomada |
| `projetos/` | ddce | Operacoes estruturadas com fases |
| `prompts/` | ddce | Artefatos _0_/_1_/_2_/_3_ |
| `docs_*/` | escriba | Vault Obsidian do projeto |
| `deploys/` | devops-* | Historico de deploys por servidor |

---

## Artefatos de Merge e Sync (v4.1.0)

### ops-suite-sync-state.json

Snapshot do estado de todos os componentes apos o ultimo sync.
Localizado em `_a4tunados/ops-suite-sync-state.json`.

```json
{
  "last_sync": "YYYY-MM-DDTHH:MM:SSZ",
  "sync_type": "push|pull|bootstrap",
  "suite_version_at_sync": "X.Y.Z",
  "components": {
    "tuninho-{nome}": {
      "version_at_sync": "X.Y.Z",
      "sections_hash": {
        "## Section Name": "sha256_16chars"
      },
      "file_hash": "sha256:16chars"
    }
  },
  "hooks": {
    "tuninho-hook-{nome}": {
      "version_at_sync": "X.Y.Z",
      "file_hash": "sha256:16chars"
    }
  }
}
```

### merge-log.json

Historico de merges executados. Localizado em `_a4tunados/merge-log.json`.

```json
[{
  "timestamp": "ISO8601",
  "type": "pull|push",
  "components": ["tuninho-{nome}"],
  "base_version": "X.Y.Z",
  "local_version": "X.Y.Z",
  "remote_version": "X.Y.Z",
  "result_version": "X.Y.Z",
  "sections_auto": N,
  "sections_conflict": N,
  "backup_path": "_a4tunados/merge-backups/{timestamp}/"
}]
```

### merge-backups/

Backups pre-merge para rollback. Localizado em `_a4tunados/merge-backups/`.
Estrutura: `{YYYYMMDD-HHMMSS}/{skill_name}/SKILL.md` + `references/`.

### migrations no manifest.json

Secao que mapeia renames e reestruturacoes entre versoes.

```json
{
  "migrations": {
    "X.Y.Z": {
      "hooks_renamed": { "old_name": "new_name" },
      "hooks_manifest_renamed": { "old_entry": ["new_entry1", "new_entry2"] }
    }
  }
}
```

---

## Sidecars — Regra de Ouro

**Sidecar e excecao.** Conteudo que beneficia QUALQUER projeto vai para `references/`
ou para o `SKILL.md` generico. So vai para `projects/{nome}/config.md` o que e
estritamente especifico de um unico projeto.

Sidecars sao **acumulativos e sincronizados** pelo updater (pull E push).
O repo centraliza sidecars de TODOS os projetos e estacoes de trabalho.
Cada subdiretorio `projects/{nome_projeto}/` e tratado independentemente no merge:
- Pull traz configs de outros projetos/estacoes para o local
- Push envia configs do projeto atual para o repo
- Se o mesmo sidecar existe local E remoto: merge 3-way por secoes
- Sidecars de projetos diferentes nunca conflitam (subdiretorios independentes)

---

## Arquivo Morto de Legado — `_a4tunados/zzz_old_files/`

Quando o updater detecta artefatos de versoes anteriores do ops-suite (V2.x/V3.x),
eles sao movidos para `_a4tunados/zzz_old_files/` em vez de deletados.

### Estrutura do Arquivo Morto

```
_a4tunados/zzz_old_files/
+-- README.md                           # Documentacao do que foi movido
+-- ops-suite/                          # Submodulo git V2.x (se existia)
+-- backups_operacoes_v2/               # Backups legados
+-- HANDOFF.yaml                        # Handoffs stale da raiz do projeto
+-- .claude/
    +-- skills/a4tunados/               # Skills legadas (pre-tuninho)
    +-- commands/                       # Commands depreciados (op-novo, etc)
    +-- agents/                         # Agents depreciados (ops-v2)
    +-- sync/                           # Sistema sync legado (ops-sync.sh)
    +-- CHECKLIST.md                    # Checklists stale V3.0
    +-- HANDOFF.yaml                    # Handoffs stale V3.0
```

### Regras

- **Nunca deletar** — sempre mover para `zzz_old_files/`
- **Preservar estrutura relativa** — manter paths originais como subdiretorios
- **Documentar** — criar/atualizar README.md com data e motivo da limpeza
- **Confirmar** — sempre pedir confirmacao do usuario antes de mover
- Esses arquivos podem ser deletados pelo usuario apos confirmar que nao precisa mais
