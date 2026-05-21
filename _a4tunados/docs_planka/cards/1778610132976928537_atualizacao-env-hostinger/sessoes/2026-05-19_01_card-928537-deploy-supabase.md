---
title: "Card 928537 — Atualização ENV hostinger + habilitação Supabase em prod"
aliases:
  - "Card 928537"
  - "ENV Supabase staging"
tags:
  - a4tunados
  - tuninho/escriba
  - type/session
  - status/active
date: 2026-05-19
version: "1.0"
related:
  - "[[MOC-Projeto]]"
  - "[[decisoes/ADR-003-supabase-mirroring]]"
  - "[[implementacao/supabase-mirroring]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/decisoes]]"
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/aprendizados]]"
---

# Card 928537 — Atualização ENV hostinger

## Contexto

Após Ghiaroni mergear a PR #14 `feat/conecta-ao-supabase` em `deploy/staging`, o auto-deploy CI ([run `26118581860`](https://github.com/GGhiaroni/planka/actions/runs/26118581860)) **falhou** com `client_loop: send disconnect: Broken pipe` durante o `RUN npm install --no-save @supabase/supabase-js@^2` (~5min de build).

Estado pós-falha:
- VPS recebeu rsync do código novo (etapa 1/6 do `scripts/deploy.sh` completou antes da queda).
- Build do Docker NÃO completou — container antigo (`planka-custom:latest` 596MB) seguiu rodando healthy.
- 2 env vars novas (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`) — necessárias para o supabase.js novo funcionar — NÃO foram adicionadas ao `.env` da VPS (env é gitignored, preservado em rsync).

Operador @victorgaudio abriu o Card 928537 no mural a4tunados com runbook explícito: SSH + git pull + add env vars + rebuild + validar via SQL queries.

## Plano Original

Não houve plano formal DDCE — operação pragmática operador-presente (verbo de execução em comentário no card mural). Runbook do próprio body do card serviu de plano:

1. SSH no VPS
2. `cd /opt/planka` (na realidade `/opt/hostinger-beta/planka/`)
3. `git pull origin master` (não aplicável — VPS recebe rsync via CI, não tem git)
4. Adicionar `SUPABASE_URL` + `SUPABASE_SECRET_KEY` no `.env`
5. `docker compose ... up -d --build planka ticket-form`
6. Validar via SQL Editor Supabase

## Prompts utilizados

Ver [[cards/1778610132976928537_atualizacao-env-hostinger/prompts/2026-05-19_01_prompts]] para transcrição completa.

## Ações executadas

### Pré-deploy (investigação)

1. `git fetch --all --prune` — atualização das refs locais.
2. `git log` cross-branch para comparar `HEAD` (card-isolated branch), `origin/deploy/staging` (tip 059a91d7), `origin/master` (9b24b85f).
3. `gh run list --branch deploy/staging --limit 5` — identificado run 26118581860 (failure 2026-05-19 18:56).
4. `gh run view 26118581860 --log-failed` — detectado `client_loop: send disconnect: Broken pipe` em stage docker 15/22 (npm install supabase).
5. SSH access test no VPS hostinger-beta com key `digital-ocean-tuninho-a4tunados` — ok.
6. Inspeção do .env do VPS: 20 linhas, 15 vars, nenhuma SUPABASE_*.
7. Verificação que o código novo (`server/utils/supabase.js`, `ticket-form/src/supabase.js`) já estava rsynced no VPS (timestamps de 2026-05-19 18:56 — última CI run).

### Deploy manual

8. Backup do `.env`: `cp .env .env.bak-20260519-192943` (chmod 600).
9. Append idempotente das 2 vars via `grep -q ... || echo ... >> .env` (verificado com `grep -E '^SUPABASE_(URL|SECRET_KEY)=' .env`).
10. `nohup bash scripts/deploy.sh > /var/log/planka-deploy-20260519-192952.log 2>&1 &` — execução manual evita o SSH idle timeout do runner GH Actions.
11. Monitoramento via tail do log + polling do `pgrep -f 'bash scripts/deploy.sh'`.

### Pós-build

12. Imagem nova `planka-custom:latest` build OK (id `b02085bd1b4e`, 726MB, +130MB pelo `@supabase/supabase-js`).
13. Imagem antiga preservada como `planka-custom:pre-deploy` (`55967cb198fa`, 596MB) — rollback safety.
14. `docker compose ... up -d --force-recreate planka` — restart com nova imagem.
15. Healthcheck Planka OK em 11s.
16. Smoke HTTP externo: `pdviewerp-stagging.fourtuna.com.br/` HTTP 200, `form-pdviewerp-stagging.fourtuna.com.br/` HTTP 200.
17. Bonus: rebuild + restart ticket-form (imagem nova `planka-ticket-form:latest` `327f1483fd3f`).

### Validação Supabase

18. Confirmado via `docker exec` que ambos containers (planka + ticket-form) têm `SUPABASE_URL` + `SUPABASE_SECRET_KEY` carregadas.
19. Query Supabase REST API direto do VPS (source `.env`):
    - `card_events`: vazio antes do teste.
    - `form_submissions`: vazio antes do teste.
20. Submetido test via `curl POST /api/manutencao` com payload de teste (cliente "TESTE TUNINHO Card 928537"):
    - Resposta: `{"ok":true,"os":"260519193527-017"}` HTTP 200.
21. Re-query Supabase:
    - `card_events`: 3 rows novas (`create`, `label_add`, `form_submit_chamado`) com `planka_card_id` `1778617494500542153`.
    - `form_submissions`: 1 row nova (`form_type='chamado'`, `os_number='260519193527-017'`, `status='created'`).
22. Adicional: submetido test via `curl POST /api/submit` (Design form, motivo "Manutenção", descrição test): 1 row card_events (`create`) sem row em form_submissions (comportamento esperado — `handler.js` não chama supabase).

### Limpeza

23. Login Planka via API (form bot user) + DELETE dos 2 cards de teste:
    - `DELETE /api/cards/1778617132146230983` HTTP 200, GET 404 (confirmado).
    - `DELETE /api/cards/1778617494500542153` HTTP 200, GET 404 (confirmado).
    - Rows correspondentes em form_submissions/card_events ficaram (refletem submissões reais — limpeza opcional via SQL).

### PR docs (follow-up do operador)

24. Operador pediu análise de branch deployada vs nossa branch (preocupação de regressão por trabalhar em commit stale).
25. Diagnóstico: nossa branch card-isolated (`dd7b9db7`) está 20+ commits atrás de `origin/deploy/staging` (`059a91d7`). MAS não modificamos código em nenhuma branch — só .env do VPS. Build manual usou os arquivos `/opt/hostinger-beta/planka/` rsynced do Ghiaroni (`059a91d7`), não nossa branch stale. **Zero risco de regressão**.
26. Criado worktree temporário `/tmp/planka-docs-928537` baseado em `origin/deploy/staging`, branch nova `docs/card-928537-registra-env-supabase-vps`.
27. Editado `DEPLOY-STAGING.md` (doc-only) adicionando:
    - Entrada no histórico 2026-05-19 (env vars + deploy manual).
    - Seção nova "Failure mode conhecido — CI SSH timeout em builds longos" com sintomas, recovery via nohup, 3 mitigações estruturais propostas.
28. `git push -u origin docs/card-928537-registra-env-supabase-vps`.
29. `gh pr create --base deploy/staging` → [PR #15](https://github.com/GGhiaroni/planka/pull/15) aberta (NÃO auto-merge per card-isolated).
30. Worktree temporário removido.

## Arquivos modificados

| Arquivo | Local | Ação | Descrição |
|---|---|---|---|
| `/opt/hostinger-beta/planka/.env` | VPS | modificado | Adicionadas 2 vars (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`). 20→22 linhas. |
| `/opt/hostinger-beta/planka/.env.bak-20260519-192943` | VPS | criado | Backup pré-update do .env. |
| `/var/log/planka-deploy-20260519-192952.log` | VPS | criado | Log completo da execução do deploy.sh. |
| `/opt/hostinger-beta/backups/planka-pre-deploy-20260519-192952.dump` | VPS | criado | pg_dump preventivo do banco Planka (92K). |
| `planka-custom:latest` | VPS docker | rebuild | Imagem nova `b02085bd1b4e` (726MB) incluindo `@supabase/supabase-js`. |
| `planka-custom:pre-deploy` | VPS docker | tag-preserved | Rollback safety. |
| `planka-ticket-form:latest` | VPS docker | rebuild | Imagem nova `327f1483fd3f`. |
| `DEPLOY-STAGING.md` | branch `docs/card-928537-...` | modificado | +26 linhas no histórico + seção "Failure mode CI SSH timeout". |

**Nenhum arquivo do worktree card-isolated foi modificado** — operação 100% server-side. Os arquivos do vault que estão sendo gerados agora (esta sessão) são o produto da Etapa Escriba.

## Decisões tomadas

Ver [[cards/1778610132976928537_atualizacao-env-hostinger/decisoes]]:
- D1: Run deploy.sh manual em `nohup` ao invés de re-tentar CI (causa raiz não-resolvida).
- D2: Adicionar env vars com fix idempotente (`grep -q ... || echo ... >> .env`) em vez de overwrite.
- D3: Sinalizar rotação da `SUPABASE_SECRET_KEY` como pendência (exposta no body do mural).
- D4: Aceitar build longo (726MB) ao invés de mitigar agora — operador prioriza unblock.
- D5: PR docs-only em branch nova baseada em deploy/staging tip (não reutilizar card-isolated stale).
- D6: NÃO merge auto da PR #15 — operador valida e mergeia manualmente (per card-isolated).

## Resultado

✅ **DEPLOY OK** + **espelhamento Supabase validado em prod**:
- 2 env vars carregadas em ambos containers.
- Pipeline `/api/manutencao` → form_submissions ✓ + card_events ✓.
- Pipeline webhook Planka → card_events ✓.
- Pipeline `/api/submit` Design → card_events ✓ (sem form_submissions, by-design).
- 2 cards de teste limpos.
- PR #15 docs aberta.

## Próximos passos

- [ ] Operador mergea PR #15 → trigga CI auto-deploy (provavelmente vai falhar de novo no mesmo SSH timeout — cosmético, prod não impactada).
- [ ] Aplicar 1 das 3 mitigações estruturais propostas na seção "Failure mode CI SSH timeout" antes do próximo merge para evitar run vermelho.
- [ ] Rotacionar `SUPABASE_SECRET_KEY` no Supabase Dashboard + atualizar .env VPS + restart containers.
- [ ] Remover `.env.bak-20260519-192943` da VPS após confirmar dias de uso estável.
- [ ] Ghiaroni testar end-to-end via UI dos forms staging (validação humana paralela).
- [ ] Encerrar card-isolated: tag archive + Comlurb seal Modo 6 + mover card mural Validando → Done.

## Consumo de Tokens

Sessão única, modo pragmático conversacional + investigação técnica + execução de deploy + escriba forense retroativo (cobertura Ghiaroni). Tokens N/D (não capturados durante a sessão — adicionar via JSONL parse no escriba final se aplicável).

## Referências

- Card mural: https://mural.a4tunados.com.br/cards/1778610132976928537
- PR #15: https://github.com/GGhiaroni/planka/pull/15
- Run CI falho: https://github.com/GGhiaroni/planka/actions/runs/26118581860
- Sidecar devops-hostinger: `.claude/skills/tuninho-devops-hostinger/projects/hostinger-beta/planka/config.md`
