# Sidecar — a4tunados_mural

> Configuracoes especificas do projeto `a4tunados_mural` para a skill
> `tuninho-portas-em-automatico`.

---

## Paths

| Campo | Valor |
|-------|-------|
| **Repo root** | `/Users/vcg/development/a4tunados/a4tunados_mural` |
| **Claude projects dir** | `~/.claude/projects/-Users-vcg-development-a4tunados-a4tunados-mural` |
| **Slug** | `-Users-vcg-development-a4tunados-a4tunados-mural` |
| **Ops folder** | `_a4tunados/_operacoes/projetos/` |
| **Operacao mais recente** | `23_claudecode_back_v3` (conforme Op ativa em 2026-04-13) |

---

## Particularidades

### 1. Projeto tem cards do mural

O check 7 (cards_manifest) e aplicavel. Verificar `_a4tunados/_operacoes/cards/`
se existir.

### 2. Historico rico de operacoes

Em 2026-04-13 (quando esta skill foi criada), o projeto tinha 23 operacoes DDCE
completadas (Ops 1-23, algumas no legado `zz_legados_ops/`). Multiplos JSONLs
em `~/.claude/projects/{slug}/` podem corresponder a operacoes diferentes.

**Implicacao para a skill**: a heuristica "NN_inferido cronologicamente" da v0.1.0
pode nao distinguir corretamente entre JSONLs de operacoes diferentes. Aceitavel
como comportamento inicial — a v0.2.0 pode parsear o JSONL para extrair contexto.

### 3. Multi-ambiente

O operador usa multiplas maquinas (macbook, desktop, Hostinger workspace).
Cada uma tem seu proprio `~/.claude/projects/{slug}/`. Sem sync explicito,
JSONLs de outras maquinas nao aparecem.

A v0.1.0 so cobre a maquina local. Multi-machine e TODO para v0.2.0.

### 4. Dev server

O check 4 (hook) deve ser complementado por uma verificacao de dev server no
futuro — o projeto usa `npm start` para rodar server + client simultaneos.
Se a sessao vai precisar de Playwright, o dev server precisa estar UP.

**v0.2.0 TODO**: adicionar check 8 — dev server rodando em `localhost:3000` e
`localhost:1337`.

---

## Skills relacionadas (projeto-especificas)

| Skill | Uso no projeto |
|-------|----------------|
| `tuninho-delivery-cards` | Parse/historico/results dos cards do mural |
| `tuninho-mural` | CLI cliente do mural via mural-api-client |
| `tuninho-devops-mural-devprod` | Deploy para producao DigitalOcean |
| `tuninho-qa` | Auditoria estrutural (REGRA_MASTER_1 usa raw_sessions que esta skill coleta) |

---

## Operacoes em que esta skill foi testada

| Operacao | Data | Resultado |
|----------|------|-----------|
| Op 23 (claudecode_back_v3) | 2026-04-13 | Criacao inicial — primeira execucao manual (MARCO 3 sessao 03). Coleta retroativa dos 3 JSONLs ja foi feita no MARCO 1. |

---

*Sidecar — Parte da skill tuninho-portas-em-automatico v0.1.0*
