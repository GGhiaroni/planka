# Operação 01 — deploy-planka-hostinger-redeploy

> Atualizar staging Planka customizado em `https://pdviewerp-stagging.fourtuna.com.br`
> (servidor hostinger-beta) com código da branch `develop` atual + diagnosticar
> ticket-form crashado + entregar acessos ao dev pra ciclo de desenvolvimento.

## Metadata

| Campo | Valor |
|-------|-------|
| **Operador** | victorgaudio |
| **Modelo** | claude-opus-4-7[1m] |
| **Modo DDCE** | DDCE_EXPANSIVO_MULTI_SESSOES (interativo) |
| **Início** | 2026-05-06 |
| **Branch op** | `feat/deploy-planka-hostinger-redeploy` |
| **Branch base** | `develop@89d798ad` (pós-merge PR #1 install) |
| **Skill DDCE** | v5.0.3 |
| **ops-suite** | v5.41.1 |

## Servidores

| Servidor | IP | Hostname | Função |
|---|---|---|---|
| hostinger-alfa | 31.97.243.191 | srv1536196.hstgr.cloud | workspace dev (Claude Code roda aqui) |
| **hostinger-beta** | **76.13.239.198** | **srv1590899.hstgr.cloud** | **STAGING REAL — alvo da operação** |

## Vault path

`_a4tunados/docs_planka/` — **NÃO existe ainda** (será criado pelo escriba no encerramento)

## Estado das Sessões

| # | Fase | Sessão | Data | Status |
|---|---|---|---|---|
| 1 | DISCOVER | sessao_01 | 2026-05-06 | ✓ CONCLUÍDA |
| 2 | DEFINE | sessao_02 | (pendente) | ⏸ aguardando abrir |
| 3 | EXECUTION | sessao_03 | (pendente) | ⏸ |
| 4 | QA + FINAL | sessao_04 | (pendente) | ⏸ |

## Métricas de Tokens

| Fase | Início | Fim | Δ tokens | Duração | Custo USD |
|------|--------|-----|----------|---------|-----------|
| DISCOVER (sessão 1) | 417,249 (41.7%) | (a calcular no fim da sessão) | TBD | TBD | TBD |
| DEFINE (sessão 2) | — | — | — | — | — |
| EXECUTION | — | — | — | — | — |
| QA + FINAL | — | — | — | — | — |
| **TOTAL** | — | — | — | — | — |

## Artefatos

| # | Tipo | Arquivo | Status |
|---|---|---|---|
| 0 | Prompt original | `prompts/01_0_PROMPT_ORIGINAL.md` | ✓ |
| 1 | Discovery (sintético) | `prompts/01_1_DISCOVERY_deploy-planka-hostinger-redeploy.md` | ✓ |
| 1-xp | Discovery (expandido) | `prompts/01_1-xp_DISCOVERY_deploy-planka-hostinger-redeploy.md` | ✓ |
| 2 | Define plan | `prompts/01_2_DEFINE_PLAN_*` | ⏸ sessão 2 |
| 2-xp | Define plan (expandido) | `prompts/01_2-xp_DEFINE_PLAN_*` | ⏸ sessão 2 |
| 3 | Results | `prompts/01_3_RESULTS_*` | ⏸ encerramento |

## Fases planejadas (preliminar — confirmar no DEFINE)

1. **Fase 1** — Sync código local → servidor B + rebuild imagem
2. **Fase 2** — Diagnóstico e correção do ticket-form (PLANKA_LIST_ID)
3. **Fase 3** — Validação E2E real (multi-viewport, multi-feature) + entrega de acessos ao dev

## Handoffs (estrutura v3.10.0+)

```
handoffs/
├── HANDOFF_2026-05-06_sessao_01.yaml   # ATIVO — estado da sessão 1 (DISCOVER concluído)
└── raw_sessions/                        # JSONLs + plan files (populados via tuninho-portas-em-automatico)
    └── .gitkeep
```

## Referências

- **Prompt original**: `_a4tunados/_operacoes/prompts/01_0_PROMPT_ORIGINAL.md`
- **Skill DDCE**: `.claude/skills/tuninho-ddce/SKILL.md` v5.0.3
- **PR install ops-suite**: GGhiaroni/planka#1 (mergeado)
- **DEPLOY.md** do repo (instruções históricas — 222 linhas)
- **Sidecars hostinger-beta**: `.claude/skills/tuninho-devops-hostinger/projects/hostinger-beta/`
