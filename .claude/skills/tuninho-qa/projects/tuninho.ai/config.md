# Sidecar QA — tuninho.ai

> Configuracoes especificas de auditoria DDCE do projeto `tuninho.ai`.
> Criado em 2026-04-19.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Stack** | Next.js 16 + React 19 + Tailwind 4 |
| **Tipo** | Prototipo frontend (sem back-end) |
| **Playwright MCP** | CDP `http://127.0.0.1:9226` (ver `.mcp.json`) |
| **Testes automatizados** | Nenhum ainda (sem Jest/Vitest/Playwright test suite) |

---

## Particularidades de Auditoria

### 1. Sem testes unitarios/integrados ainda

O projeto e prototipo — nao tem suite de testes automatizada. O QA do DDCE
depende de:
- **Interpretacao visual via Playwright MCP** (Licao #31 — obrigatoria)
- **Lint** (`npm run lint`) como gate minimo
- **Build** (`npm run build`) como gate de integridade

### 2. Interpretacao visual obrigatoria

Toda operacao DDCE que altera UI (componentes `src/components/**`) DEVE:
1. Rodar `npm run dev` para ter o app em `localhost:3000`
2. Abrir via Playwright MCP (CDP 9226)
3. Screenshot interpretado com descricao textual do que aparece em tela
4. Registrar em `_3_evidencias/` da operacao

Sem screenshots interpretados, o gate EXECUTION NAO libera.

### 3. Pendency accounting cruzado (REGRA_MASTER_1)

Projeto novo em 2026-04-19 — `handoffs/raw_sessions/` ainda vazio. A skill
`tuninho-portas-em-automatico` DEVE popular os raw sessions JSONLs no inicio
de cada sessao (hook `tuninho-hook-inicio-sessao`).

### 4. Multi-ambiente

O operador usa multiplas estacoes (macbook, desktop, Hostinger workspace).
Auditoria retroativa DEVE considerar JSONLs das tres origens.

### 5. Cobertura de tools sem amostragem

Operacoes que tocam multiplos componentes React devem auditar TODOS —
nao so os "principais". Especialmente os fluxos:
- landing → chat → kanban (transicao)
- MiniCard → CardModal → flip 3D

---

## Gates Bloqueantes (este projeto)

| Gate | Criterio minimo |
|------|----------------|
| **DISCOVER** | `_0_contexto.md` com stack, commits base, objetivo |
| **DEFINE** | `_1_plano.md` + `_1-xp_checklist.md` + interpretacao visual do estado atual |
| **EXECUTION** | `_2_execucao.md` + `_3_evidencias/` com screenshots interpretados de TODAS as telas afetadas + `npm run lint` limpo + `npm run build` sucesso |

---

## Skills relacionadas

| Skill | Uso no QA |
|-------|-----------|
| `tuninho-portas-em-automatico` | Popula `handoffs/raw_sessions/` (REGRA_MASTER_1) |
| `tuninho-escriba` | Vault `docs_tuninho.ai/` (documentacao apos gate) |
| `tuninho-devops-hostinger` | Verificacao pos-deploy (smoke HTTP 200 em dev.tuninho.ai, PM2 status, SSE end-to-end via cron monitor) |

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.0.0 | 2026-04-19 | Sidecar inicial |
