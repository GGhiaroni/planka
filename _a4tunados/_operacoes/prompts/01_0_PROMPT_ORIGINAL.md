---
operacao: 01
nome: deploy-planka-hostinger-redeploy
data: 2026-05-06
tipo: prompt_original
operador: victorgaudio
modelo: claude-opus-4-7[1m]
modo: interativo
branch_op: feat/deploy-planka-hostinger-redeploy
branch_base: develop (89d798ad — pos-merge PR #1 instalação ops-suite)
projeto: planka
git_remote: github.com/GGhiaroni/planka
---

# Prompt Original — Operação 01: deploy-planka-hostinger-redeploy

## Demanda principal (verbatim)

> Execute um ddce para descobrir qual implementação já fizemos desse projeto em docker do hostinger e em qual domínio para que possamos implementar ele novamente ou atualizar ele através dessa branch que estamos. Precisamos deixar esse projeto no link e deployado online, com todas as suas funções. Já fizemos isso antes

## Confirmações do operador (apresentação do fluxo integral)

> A branch deve ser merjada via gitflow da for para develop e syncada. Devemos começar a operação baseada em develop a mais atualizada possível. Inicie a operação de modo interativo. Simbora

Decisões consolidadas:
- **Modo**: interativo
- **Tipo de op**: DDCE convencional (não card-isolated — não há card mural anexado)
- **Branch base**: develop atualizada (89d798ad pós-merge PR #1)
- **Branch da op**: `feat/deploy-planka-hostinger-redeploy` (criada do tip de develop)
- **Pré-requisito cumprido**: branch anterior `fix/install-tuninho-gitignore` mergeada via gitflow → develop → sync local (PR #1, mergedAt 2026-05-06T13:10:57Z)

## Objetivo

Descobrir histórico de deploy anterior do planka (domínio, servidor Hostinger, estado runtime) e re-deployar/atualizar a partir desta branch para que o projeto fique online novamente com todas as funções.

## Pistas iniciais

1. Auto-scan da skill `tuninho-devops-env` v1.0.0 detectou stack: **Node.js + Docker + Docker Compose**.
2. `licoes-aprendidas.md` da skill `tuninho-devops-hostinger` menciona `postgresql://postgres@127.0.0.1:5432/planka` — **confirmação de deploy anterior**.
3. Branch develop do planka tem 5 commits do operador (features de board log, drag-and-drop, planilha line-height, seed Design board) — fork customizado.
4. Workspace path: `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/planka` (sob hostinger-alfa).

## Escopo provisório (a confirmar no DEFINE)

- **Inclui**: descobrir deploy anterior, atualizar imagem/código se necessário, redeploy via tuninho-devops-hostinger, smoke + E2E real, documentação no env-catalog.
- **Exclui (provisório)**: migração de dados de outros sistemas, novas features do planka que não estejam na branch develop atual.

## Anti-padrões já rejeitados

- Deploy manual (rsync/docker compose direto) — usar tuninho-devops-hostinger.
- Validação só via curl — Playwright E2E real obrigatório.
- PR para master — develop é trunk neste projeto.
- UPDATE/DELETE em DB de prod sem GATE explícito.
