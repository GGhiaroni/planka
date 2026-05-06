# Config Deploy Vercel — tuninho.ai

> Configuracao Vercel do prototipo `tuninho.ai`.
> Criado em 2026-04-19 (pos-deploy — investigacao retroativa via GitHub Deployments API).
>
> **Importante**: o deploy e **automatico via integracao GitHub→Vercel**, NAO via
> CLI direto. Cada push para a branch de producao (origin HEAD = `feat/sem_tuninho`)
> dispara build/deploy automaticamente. CLI so e necessario para inspecao/rollback/env vars.

---

## Identificacao

| Item | Valor |
|------|-------|
| **Projeto Vercel** | `tuninho-ai` |
| **Scope** | `victorgaudios-projects` (conta pessoal de Victor, **nao** `a4tunados-projects`) |
| **Repo GitHub** | `victorgaudio/tuninho.ai` |
| **Branch producao** | `feat/sem_tuninho` (origin HEAD) |
| **Local path** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/tuninho.ai` |
| **Dominio production (alias Vercel)** | https://tuninho-ai.vercel.app/ |
| **Dominio custom** | _(ainda nao configurado — sugestao futura: `tuninho.ai` ou `app.tuninho.ai`)_ |
| **Deploy flow** | **GitHub integration** (webhook auto-deploy em push) |

## Tech Stack

| Item | Valor |
|------|-------|
| **Framework** | Next.js 16.2.4 (App Router) |
| **Runtime Vercel** | Node.js 20 (padrao) |
| **Build command** | `next build` (auto-detectado) |
| **Output directory** | `.next/` (auto-detectado) |
| **Install command** | `npm install` |
| **Package manager** | npm (`package-lock.json` commitado) |
| **Turbopack** | Sim (bundles nomeados `turbopack-*` aparecem no HTML) |

## Proteção / Acesso

| URL | Status |
|-----|--------|
| Alias production (`tuninho-ai.vercel.app`) | **Publico** (HTTP 200) |
| URL de deploy especifico (`tuninho-{hash}-victorgaudios-projects.vercel.app`) | **401 — Deployment Protection ativo** (requer login Vercel/SSO) |

Isso e o comportamento padrao Vercel: a URL production e publica via alias,
mas os deploys individuais ficam protegidos. Nao mexer sem razao.

## Verificacao Pos-Deploy

| Check | Comando | Esperado |
|-------|---------|----------|
| **HTTP root** | `curl -s -o /dev/null -w "%{http_code}" https://tuninho-ai.vercel.app/` | 200 |
| **Title + meta** | `curl -s https://tuninho-ai.vercel.app/ \| grep -iE "title\|description"` | "tuninho.ai — a IA mais organizada que voce conhece" |
| **Idioma** | `<html lang="pt-BR">` | presente |
| **Landing visual** | Abrir via Playwright MCP (CDP 9226) | Hero + ChatInput renderizados |
| **Fluxo chat → kanban** | Enviar prompt → validar animacao → kanban aparece | interpretacao visual |
| **Flip 3D de card** | Clicar em MiniCard → modal → FlipButton alterna front/back | interpretacao visual |

## Variaveis de Ambiente

Nenhuma declarada. O prototipo e frontend puro (mock data em `src/lib/mock-data.ts`).
Quando back-end real entrar: adicionar via `vercel env add` ou Vercel dashboard
e registrar aqui (somente nomes — **nunca** valores reais).

## DNS (para futuro dominio custom)

Quando decidir usar `tuninho.ai` (ou subdominio) apontando para este deploy:

| Item | Valor |
|------|-------|
| **Provider** | _(a definir — Registro.br provavel)_ |
| **Tipo** | CNAME → `cname.vercel-dns.com` |
| **SSL** | Auto-provisioned by Vercel |
| **Config Vercel** | `vercel domains add tuninho.ai tuninho-ai --scope victorgaudios-projects` |

## Historico de Deploys

| Data (UTC) | ID Deployment | Ref | State | URL de deploy |
|------------|---------------|-----|-------|---------------|
| 2026-04-16 18:05:38 | 4391786562 | `0098428` | success | `https://tuninho-60dn72oj9-victorgaudios-projects.vercel.app` |

_Fonte: GitHub Deployments API (`gh api repos/victorgaudio/tuninho.ai/deployments`)._
_Inspecao manual via Vercel dashboard retorna detalhes mais ricos (logs, bundle size, ISR)._

## Comandos CLI uteis (inspecao)

```bash
# Autenticar na conta correta (pessoal do Victor)
npx vercel@latest login

# Confirmar scope
npx vercel@latest whoami

# Linkar diretorio ao projeto (ja deve estar linkado se .vercel/ existir)
npx vercel@latest link --project tuninho-ai --scope victorgaudios-projects

# Ver ultimos deploys
npx vercel@latest ls tuninho-ai

# Logs de um deploy especifico
npx vercel@latest inspect https://tuninho-60dn72oj9-victorgaudios-projects.vercel.app/

# Forcar redeploy do HEAD atual (raramente necessario — o webhook ja faz)
npx vercel@latest deploy --prod
```

## Licoes Especificas

### 1. Scope e conta pessoal, nao a4tunados (2026-04-19)

Diferente do padrao de outros projetos a4tunados (que vivem em `a4tunados-projects`),
este projeto esta em `victorgaudios-projects`. Importante lembrar ao usar
comandos CLI — passar `--scope victorgaudios-projects`.

Se futuramente for migrado para `a4tunados-projects`, sera necessario:
1. Criar novo projeto em `a4tunados-projects`
2. Importar repo GitHub la
3. Remover do `victorgaudios-projects`
4. Atualizar DNS (se houver custom domain)

### 2. Deploy via integracao GitHub (nao CLI) (2026-04-19)

O setup atual e "push → deploy automatico". Nao ha `vercel.json` ou
`.vercel/project.json` commitados no repo (o link foi feito via web UI do Vercel).

Consequencia: qualquer push em `feat/sem_tuninho` dispara build production.
Cuidar com commits WIP nessa branch.

### 3. Deployment Protection nos deploys individuais (2026-04-19)

A URL production (`tuninho-ai.vercel.app`) e publica, mas URLs de deploy
individuais retornam 401. Isto e o padrao do Vercel — nao mexer sem razao.

## Migracao futura para hostinger-beta

Quando o projeto migrar para `hostinger-beta` (roadmap):

1. Criar sidecar em `tuninho-devops-hostinger/projects/hostinger-beta/tuninho.ai/config.md`
2. Bootstrap do VPS beta via `/tuninho-devops-hostinger bootstrap-beta`
3. Apontar DNS para VPS beta (ou manter Vercel como fallback)
4. Desativar webhook GitHub→Vercel ou deletar projeto Vercel
5. Marcar este sidecar como deprecated com link para o novo

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 0.1.0 | 2026-04-19 | Seed inicial (placeholders) |
| 1.0.0 | 2026-04-19 | Preenchido com dados reais do deploy (scope, URLs, primeiro deployment ID) via investigacao GitHub Deployments API |
