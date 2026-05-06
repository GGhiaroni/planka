# Sidecar DDCE — tuninho.ai

> Configuracoes e aprendizados **especificos** do projeto `tuninho.ai`
> para a skill `tuninho-ddce`. Criado em 2026-04-19.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Stack** | Next.js 16 + React 19 + Tailwind 4 + TypeScript 5 |
| **Tipo** | Prototipo frontend (sem back-end) |
| **Repo root** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai` |
| **Ops folder** | `_a4tunados/_operacoes/` |
| **Vault Escriba** | `_a4tunados/docs_tuninho.ai/` |
| **Deploy** | hostinger-beta — https://dev.tuninho.ai (via `tuninho-devops-hostinger`) |

---

## Particularidades

### 1. Projeto novo, sem historico de DDCE ainda

Em 2026-04-19 (criacao deste sidecar), o projeto tinha 2 commits apenas:
- `bc5ba2c chore: instalar a4tunados-ops-suite v5.1.0`
- `0098428 feat: prototipo funcional tuninho.ai`

Primeira operacao DDCE vai estabelecer o baseline de `_1_plano.md`,
`_2_execucao.md`, etc. O TEMPLATE_DDCE ja esta presente em `_a4tunados/_operacoes/`.

### 2. Testes visuais via Playwright MCP

O `.mcp.json` do projeto registra o Playwright MCP com CDP endpoint
`http://127.0.0.1:9226`. Operacoes que alteram UI DEVEM exercer Playwright
com interpretacao visual obrigatoria (Licao #31 do tuninho-qa).

### 3. Versionamento do pacote npm

O `package.json` esta em `v0.1.0` (prototipo). Etapa 15 (changelog) pode ser
generica ate termos um CHANGELOG.md dedicado. Quando migrar para producao
hostinger-beta, criar CHANGELOG.md com entradas por release.

---

## Comandos uteis

```bash
# Dev server
npm run dev

# Build de producao (executado no servidor hostinger-beta durante o deploy)
env -u NODE_ENV npm run build

# Lint
npm run lint
```

---

## Skills relacionadas

| Skill | Uso no projeto |
|-------|----------------|
| `tuninho-escriba` | Documentacao do vault `docs_tuninho.ai/` |
| `tuninho-devops-hostinger` | Deploy ativo (hostinger-beta -> dev.tuninho.ai) |
| `tuninho-qa` | Auditoria com Playwright MCP |
| `tuninho-portas-em-automatico` | Pre-flight de sessao |

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.0.0 | 2026-04-19 | Sidecar inicial |
