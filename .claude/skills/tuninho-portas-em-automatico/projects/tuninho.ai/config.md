# Sidecar — tuninho.ai

> Configuracoes especificas do projeto `tuninho.ai` para a skill
> `tuninho-portas-em-automatico`. Criado em 2026-04-19.

---

## Paths

| Campo | Valor |
|-------|-------|
| **Repo root** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai` |
| **Claude projects dir** | `~/.claude/projects/-opt-hostinger-alfa-workspaces-tuninho-ide-victorgaudio-tuninho-ai` |
| **Slug** | `-opt-hostinger-alfa-workspaces-tuninho-ide-victorgaudio-tuninho-ai` |
| **Ops folder** | `_a4tunados/_operacoes/projetos/` |
| **Vault docs** | `_a4tunados/docs_tuninho.ai/` |
| **Operacao mais recente** | (nenhuma DDCE ate 2026-04-19 — prototipo em bootstrap) |

---

## Particularidades

### 1. Projeto novo, sem cards ativos

Em 2026-04-19 o projeto ainda NAO tem cards do mural associados.
O check 7 (`cards_manifest`) vai acusar ausencia — isso e esperado no estado
atual. Quando o projeto ganhar board no mural a4tunados, este sidecar deve
ser atualizado com o `board_id` correspondente e a regra passa a ser verificar
`_a4tunados/_operacoes/cards/`.

### 2. Ambiente hostinger-alfa compartilhado

Este projeto vive em `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/`
junto com outros workspaces do operador victorgaudio. Cuidar conflitos de porta
com vizinhos (ver `tuninho-devops-env`).

### 3. Playwright MCP dedicado

O `.mcp.json` registra Playwright com CDP endpoint `127.0.0.1:9226` — NAO usa
a porta padrao 9222. Isto isola o Chromium deste projeto de outros que
compartilhem a mesma maquina.

### 4. Dev server

Quando a sessao precisar de Playwright para validar UI (check visual da
Licao #31 do tuninho-qa), o dev server DEVE estar rodando:

```bash
npm run dev  # Next.js em localhost:3000
```

Sem isso, Playwright nao tem alvo.

---

## Skills relacionadas (projeto-especificas)

| Skill | Uso no projeto |
|-------|----------------|
| `tuninho-devops-hostinger` | Deploy hostinger-beta — https://dev.tuninho.ai (producao) |
| `tuninho-qa` | Auditoria com Playwright MCP |
| `tuninho-escriba` | Vault `docs_tuninho.ai/` |

---

## Operacoes em que esta skill foi testada

| Operacao | Data | Resultado |
|----------|------|-----------|
| (nenhuma) | — | — |

---

*Sidecar — Parte da skill tuninho-portas-em-automatico v0.1.0*
