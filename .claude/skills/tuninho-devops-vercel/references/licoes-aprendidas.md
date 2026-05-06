# Licoes Aprendidas — Tuninho DevOps Vercel

> Registro acumulativo de licoes aprendidas em deploys Vercel.
> LEITURA OBRIGATORIA no Stage 0 de cada deploy.

---

## Indice

1. [Hobby Plan — Autoria de Commits](#1-hobby-plan--autoria-de-commits)
2. [Vercel CLI — Versao e Autenticacao](#2-vercel-cli--versao-e-autenticacao)
3. [Projeto Link — Nome do Diretorio](#3-projeto-link--nome-do-diretorio)
4. [GitHub Integration — Obsoleta para Hobby](#4-github-integration--obsoleta-para-hobby)

---

## 1. Hobby Plan — Autoria de Commits

**Data:** 2026-03-30
**Projeto:** orquestravoadoraoficina2026
**Severidade:** CRITICA
**Impacto:** Todos os deploys via GitHub integration bloqueados

### O que aconteceu

O Vercel Hobby plan passou a bloquear deploys de commits cujo autor git nao e o
dono da conta Vercel. O projeto e desenvolvido por `victorgaudio` mas a conta
Vercel pertence a `operacoes4tuna`.

Erro exibido:
```
The Deployment was blocked because the commit author does not have contributing
access to the project on Vercel.
Hobby teams do not support collaboration. Please upgrade to Pro to add team members.
```

### Tentativas que NAO funcionaram

1. **Squash merge via GitHub**: O squash merge manteve o autor original (`victorgaudio`),
   nao mudou para `operacoes4tuna`.
2. **Commit com `--author`**: Mesmo setando author como `operacoes4tuna` e committer
   tambem, o Vercel continuou bloqueando. O Vercel checa algo alem do git author
   (possivelmente o sender do webhook push do GitHub).
3. **Push direto na main como operacoes4tuna**: Mesmo com `gh auth switch --user operacoes4tuna`
   e git config local setado para operacoes4tuna, o Vercel bloqueou.

### Solucao que FUNCIONOU

Deploy via Vercel CLI, bypassando completamente a integracao GitHub:
```bash
npx vercel@latest --prod --yes
```
Com o CLI autenticado como `operacoes4tuna` (`npx vercel@latest whoami`).

### Regra derivada

**NUNCA confiar na GitHub integration para deploys em conta Hobby com colaboradores.**
Sempre usar CLI deploy.

---

## 2. Vercel CLI — Versao e Autenticacao

**Data:** 2026-03-30
**Severidade:** ALTA

### O que aconteceu

O sistema tinha `vercel` v44.6.5 instalado globalmente, mas a versao atualizada
(v50.37.3) foi instalada via `npm i -g vercel@latest` em outro path. O comando
`vercel` continuava apontando para a versao antiga.

A versao antiga usava um fluxo de login deprecated (email-based) que foi
desabilitado pelo Vercel em fevereiro/2026.

### Solucao

Sempre usar `npx vercel@latest` em vez de `vercel` diretamente. O `npx` garante
a versao mais recente sem conflito de PATH.

### Regra derivada

**SEMPRE usar `npx vercel@latest`** para qualquer comando Vercel.

---

## 3. Projeto Link — Nome do Diretorio

**Data:** 2026-03-30
**Projeto:** orquestravoadoraoficina2026
**Severidade:** MEDIA

### O que aconteceu

O diretorio local se chama `TesteGoogleForms` (com maiusculas e sem hifens).
Ao rodar `npx vercel@latest --prod`, o CLI tentou usar o nome do diretorio
como nome do projeto, causando erro:
```
Error: Project names must be lowercase...
```

### Solucao

Linkar explicitamente ao projeto existente:
```bash
npx vercel@latest link --project orquestravoadoraoficina2026 --yes --scope a4tunados-projects
```

### Regra derivada

**Sempre linkar projetos explicitamente** com `--project` no Bootstrap (Stage 0B).
Nunca depender do auto-detect por nome de diretorio.

---

## 4. GitHub Integration — Obsoleta para Hobby

**Data:** 2026-03-30
**Severidade:** INFORMATIVA

### Contexto

Ate 26/mar/2026, a GitHub integration funcionava para merge commits feitos por
`operacoes4tuna` via GitHub web. Os PRs #1 a #7 deployaram com sucesso.

Entre 26 e 30/mar/2026, o Vercel endureceu a verificacao do Hobby plan.
PRs #8 e #9 falharam mesmo tendo merge commits identicos aos anteriores.

### Evidencia

Todos os Preview deploys (commits na branch) SEMPRE falharam — o Hobby plan
nunca permitiu deploys de commits por colaboradores em Preview. Apenas Production
(merge commits) funcionavam, e isso tambem parou.

### Regra derivada

A GitHub integration no Vercel Hobby e **unreliable** para projetos com
colaboradores. O deploy via CLI e a unica solucao confiavel. Esta skill
existe por causa disso.

---

## Template para Novas Licoes

```markdown
## N. {Titulo}

**Data:** AAAA-MM-DD
**Projeto:** {projeto}
**Severidade:** CRITICA | ALTA | MEDIA | BAIXA | INFORMATIVA

### O que aconteceu
{descricao}

### Solucao
{o que resolveu}

### Regra derivada
{regra para prevenir recorrencia}
```
