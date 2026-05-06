# Sidecar Suporte — tuninho.ai

> **Versao:** 1.0.0 | **Criado:** 2026-04-19 | **Ultima atualizacao:** 2026-04-19
> **Projeto:** tuninho.ai
> **Repositorio:** `{owner}/tuninho.ai` (confirmar)

---

## Metadata do Projeto

| Campo | Valor |
|-------|-------|
| **Stack** | Next.js 16.2.4 + React 19 + Tailwind 4 + TypeScript 5 |
| **Tipo** | App com SQLite + Firebase Auth + Claude SDK (pos Op 02/03) |
| **Porta dev** | 3000 (Next.js) |
| **Deploy** | hostinger-beta — https://dev.tuninho.ai (via `tuninho-devops-hostinger`) |

---

## Vault e Documentacao

| Item | Caminho |
|------|---------|
| **Vault Escriba** | `_a4tunados/docs_tuninho.ai/` |
| **Deploy Sidecar** | `.claude/skills/tuninho-devops-hostinger/projects/hostinger-beta/tuninho-ai/config.md` |
| **Env Sidecar** | `.claude/skills/tuninho-devops-env/projects/tuninho.ai/config.md` |
| **DDCE Sidecar** | `.claude/skills/tuninho-ddce/projects/tuninho.ai/config.md` |
| **QA Sidecar** | `.claude/skills/tuninho-qa/projects/tuninho.ai/config.md` |

---

## Areas sensiveis

### 1. Fluxo landing → kanban

`src/components/transitions/ChatToKanban.tsx` anima a transicao. Bugs comuns:
- Frames caindo em mobile → verificar `framer-motion` transitions
- Estado do `useAppState` nao migrando corretamente

### 2. Flip 3D dos cards

`src/components/card/FlipButton.tsx` + `CardFront/Back.tsx` com `transform: rotateY`.
- Problemas de z-index / backface-visibility em Safari
- Testes DEVEM rodar em Playwright (Chromium) e Safari (se disponivel)

### 3. Drag and drop do Kanban

`@hello-pangea/dnd` com React 19. Ainda pode haver incompatibilidades que
surgirao em producao — monitorar.

---

## Issues Conhecidos

(Nenhum registrado ate 2026-04-19)

---

## Contatos

| Papel | Quem |
|-------|------|
| **Product owner** | victorgaudio@gmail.com |
| **Operacoes a4tunados** | operacoes@4tuna.com.br |

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.0.0 | 2026-04-19 | Sidecar inicial |
