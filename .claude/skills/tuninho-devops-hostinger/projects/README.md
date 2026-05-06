# Modulos Sidecar por Projeto — Tuninho DevOps Hostinger Alfa

> Cada subpasta contem configuracoes de deploy **especificas** de um projeto
> no servidor Hostinger Alfa. O conteudo aqui e a **excecao** — tudo que for
> universal fica no SKILL.md e references/.

## Conceito

A skill DevOps Hostinger Alfa gerencia multiplos projetos no mesmo servidor.
Cada projeto tem particularidades: dominio, porta, stack, DB, build commands.
Essas particularidades ficam no sidecar (aqui).

## Como funciona

1. Ao iniciar um deploy, a skill identifica o projeto (pelo cwd ou perguntando)
2. Carrega `projects/{nome_projeto}/config.md` com todas as configs de deploy
3. Se NAO existir: entra no sub-fluxo de Bootstrap (Stage 0B) para criar o sidecar
4. Ao final do bootstrap, o sidecar e criado automaticamente com os dados descobertos

## Estrutura

```
projects/
├── README.md                    (este arquivo — pode ser atualizado pelo updater)
├── maestrofieldmanager/
│   └── config.md                (config deploy MaestroFieldManager — NUNCA sincronizado)
└── {outro_projeto}/
    └── config.md                (config deploy do projeto — NUNCA sincronizado)
```

## Campos do Sidecar

### Campos padrao (todos os projetos)
- **Projeto**: Nome, Stack, Dominio, Porta
- **Particularidades de Deploy**: Modulos nativos, build commands, DB, etc.
- **Env vars producao**: Variaveis de ambiente em producao
- **Historico de Deploys**: Tabela cronologica

### Campos self-deploy (projetos no servidor — v2.0.0)
Quando o projeto e editado de dentro do proprio servidor (ex: IDE editando a si mesma):

| Campo | Descricao |
|-------|-----------|
| `deploy_mode` | `SELF_DEPLOY`, `REMOTE`, ou `AUTO` (default) |
| `workspace_path` | Caminho absoluto do workspace no servidor |
| `prod_path` | Caminho absoluto do diretorio de producao |
| `db_path` | Caminho relativo do banco de dados (a partir de prod_path) |
| `health_endpoint` | URL local de health check (ex: `http://localhost:3847/`) |
| `graceful_restart` | `true` para pm2 restart (preserva tmux), `false` para stop+start |
| `session_preservation` | Notas sobre impacto em sessoes (tmux, WebSocket, etc.) |
| `rsync_excludes` | Lista de patterns excluidos do rsync (data/, .git/, etc.) |
| `conditional_triggers` | Tabela de triggers condicionais (npm install, build) |
| `cross_projects` | Lista de projetos vizinhos para cross-check (nome\|porta\|dominio) |

## Regras

1. **Sidecar e excecao.** Configs universais do servidor vao no SKILL.md.
   So vai para o sidecar o que e estritamente especifico de um unico projeto.
2. **NUNCA sincronizado pelo updater** — sidecars sao locais a cada projeto.
3. **Unica excecao**: este README.md (template) pode ser atualizado via pull.
4. **Acumulativo**: cada novo projeto que usar esta skill ganha seu proprio sidecar.
   Assim a skill acumula conhecimento sobre todos os projetos no servidor.
