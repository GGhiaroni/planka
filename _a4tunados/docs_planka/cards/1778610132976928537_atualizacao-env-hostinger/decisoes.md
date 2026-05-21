---
title: "Card 928537 — Decisoes locais"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/active
date: 2026-05-19
version: "1.0"
related:
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/sessoes/2026-05-19_01_card-928537-deploy-supabase]]"
---

# Card 928537 — Decisoes Locais

## D1: Rodar `scripts/deploy.sh` manual em `nohup` ao invés de re-tentar CI

**Contexto**: CI run 26118581860 falhou por SSH idle timeout durante `npm install @supabase/supabase-js@^2` (~5min). Re-tentar exatamente o mesmo workflow falharia de novo no mesmo ponto.

**Decisão**: rodar deploy.sh diretamente no VPS sob `nohup` (imune ao SSH idle do runner GH Actions).

**Alternativas**:
- Re-trigger CI (provavelmente refalha mesmo).
- Mitigar Dockerfile/CI antes de tentar de novo (escopo maior, atrasa unblock).
- Deploy manual via comando ad-hoc (sem rollback safety).

**Consequência**: VPS rapidamente em estado consistente. Mitigação estrutural da CI fica como pendência (PR #15 documenta).

## D2: Append idempotente das env vars com `grep -q ... || echo ... >> .env`

**Contexto**: `.env` da VPS é gitignored + preservado em rsync. Não pode ser overwritten.

**Decisão**: pattern idempotente `grep -q '^SUPABASE_URL=' .env || echo 'SUPABASE_URL=...' >> .env`. Re-execução não duplica.

**Alternativas**: `sed` com flag, full-rewrite via heredoc, edit manual.

**Consequência**: comando seguro pra re-rodar. Backup preservado.

## D3: `SUPABASE_SECRET_KEY` exposta no body do card mural → rotação como pendência

**Contexto**: operador postou os 2 valores das env vars no body do card mural, incluindo a `service_role` key (que bypassa RLS).

**Decisão**: sinalizar rotação como pendência operacional pós-deploy. Mural a4tunados é interno mas visível a vários membros.

**Alternativas**: rotacionar imediatamente (escopo expandido para o card), aceitar risco (incompatível com data-protection).

**Consequência**: pendência clara registrada no card + sessão escriba + report do card. Operador decide quando rotacionar.

## D4: Aceitar build longo (726MB +130MB pelo supabase-js) sem mitigação imediata

**Contexto**: build agora demora ~5min adicional pelo `npm install --no-save @supabase/supabase-js@^2`. Causa do SSH timeout do CI.

**Decisão**: mitigação fora do escopo do Card 928537. Documentar em PR #15 + DEPLOY-STAGING.md.

**Alternativas**:
- Pre-install em layer cacheada (modificar planka.Dockerfile).
- Declarar dep em `package.json` (modificar tudo, escopo grande).
- Usar `npm ci` com lockfile.

**Consequência**: próximo merge em deploy/staging vai re-falhar no CI. Cosmético (prod ok). Operador pode aplicar 1 das 3 mitigações antes.

## D5: PR docs em branch nova baseada em `deploy/staging` tip, não no card-isolated stale

**Contexto**: operador pediu "atualize a branch de deploy para estar com informação contextualizada e atualizada do que foi feito aqui". Nossa branch card-isolated (`dd7b9db7`) é stale (20+ commits atrás de `origin/deploy/staging`).

**Decisão**: criar worktree temporário, nova branch `docs/card-928537-registra-env-supabase-vps` baseada em `origin/deploy/staging` tip, doc-only commit, PR → deploy/staging (não auto-merge).

**Alternativas**:
- Cherry-pick docs commit da nossa branch (mais complexo, pode arrastar baggage da stale).
- Modificar nossa branch e mergear (vai gerar conflitos brutais por 20+ commits).
- Direct push em deploy/staging (viola card-isolated principle).

**Consequência**: PR limpa, operador revisa, merge dispara CI (que vai falhar cosmético).

## D6: NÃO auto-merge PR #15

**Contexto**: hook card-isolated diz "Push + PR via gh pr create — NAO auto-merge".

**Decisão**: PR aberta, operador revisa e mergeia manualmente quando confortável (especialmente porque o merge vai disparar CI que falha — operador escolhe quando lidar com isso).

**Consequência**: PR vira pendência leve. Card 928537 segue pra Validando independente disso (PR é cosmético, prod já validada).
