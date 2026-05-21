# HANDOFF — Card 1778610132976928537 (Atualização ENV hostinger)

## Status canonico
- **comlurb_sealed**: `true` (Modo 6 card-close-session — SEAL-008 single-PR pattern)
- **seal_timestamp**: `2026-05-21T16:55:00Z`
- **seal_version**: `v5.0.7`
- **seal_mode**: `card-close-final-modo-6-seal-008`
- **status_final**: `APROVADO_PRA_DONE`
- **card_id**: `1778610132976928537`
- **titulo**: "Atualização ENV hostinger"
- **branch**: `card/feat/atualizacao-env-hostinger-928537`
- **tag archive**: `archive/card/feat/atualizacao-env-hostinger-928537` → commit `ee466445`
- **operador**: `@victorgaudio` (id `1589454535816905915`)
- **validador externo**: `@ghiaroni` (id `1754033421388089095`) — operador estrangeiro
- **human_validated_at**: `2026-05-21T~14:00Z` (operador "Tudo aprovado")

## Validacoes (pre-check Comlurb v5.0.7)

| Pre-check | Status | Notas |
|---|---|---|
| `audit-pr-merged-and-develop-synced` | N/A | SEAL-008 single-PR pattern — sem PR feature na branch card-isolated |
| `audit-archive-tag-created` | PASS | `archive/card/feat/atualizacao-env-hostinger-928537` pushada para origin |
| `audit-pr-merge-strategy-coherence` | N/A | Sem merge a validar |
| `audit-storytelling-preserved` | PASS | Commit + tag preservam todo o storytelling do vault forense + sub-arvore card |
| `audit-tag-archive-is-ancestor` | N/A | Sem develop merge necessario (SEAL-008) |
| `audit-escriba-completeness` | PASS | 8/8 entregaveis canonicos: sessao, ADRs (8 incluindo 6 retroativos), implementacao (3), MOC, changelog v1.2.0, report-executivo, versioning bump, sub-arvore card completa |
| `audit-foreign-operator-drift` | N/A | Sub-check ainda nao deployado (PR ops-suite #151 pendente merge) — gap conhecido pre-coverage do operador estrangeiro Ghiaroni ja resolvido via dogfood no proprio card |
| Validacao humana operador | PASS | "Tudo aprovado" no card mural em 2026-05-21 |
| Validacao externa Ghiaroni | PASS | "@ghiaroni validou operacao" + Supabase em prod confirmado |

## Resumo da operacao

Card pragmatico operacional puro (sem mudanca de codigo no produto planka):

1. **Diagnostico**: CI auto-deploy da PR Ghiaroni #14 (`feat/conecta-ao-supabase`) falhou por SSH idle timeout durante npm install ~5min. Codigo rsynced no VPS mas build incompleto, env vars novas SUPABASE_* nao adicionadas.

2. **Execucao**: SSH manual no VPS hostinger-beta → backup .env → append idempotente SUPABASE_URL + SUPABASE_SECRET_KEY → `nohup bash scripts/deploy.sh` (imune ao SSH idle) → rebuild planka + ticket-form → healthcheck OK em 11s → smoke HTTP 200/200.

3. **Validacao**: REST API Supabase → 1 row `form_submissions` + 4 rows `card_events` (via 2 testes: `/api/manutencao` escreveu nas 2 tabelas; `/api/submit` escreveu so card_events via webhook by-design). 2 cards de teste DELETED limpos.

4. **Follow-up operador**: analise stale branch — confirmado zero risco de regressao (operacao 100% server-side, build manual usou arquivos rsynced de Ghiaroni `059a91d7`, nao branch stale). PR docs GGhiaroni/planka#15 aberta em branch nova baseada em `deploy/staging`.

5. **Escriba modo forense (operador estrangeiro)**: dogfood ad-hoc gerou 6 ADRs retroativos (`status: inferred`) + 2 implementacao docs cobrindo as 14 features Ghiaroni que estavam sem documentacao no vault. Vault saiu de "2 ADRs + 1 implementacao" para "9 ADRs + 3 implementacao + 2 sub-arvores cards" + MOC reorganizado + changelog v1.2.0.

6. **Ops-suite update**: operador aprovou e mandou implementar. PR victorgaudio/a4tunados-ops-suite#151 abre o pacote: `tuninho-escriba v5.2.0` (modo `--forensic-foreign-operator`), `tuninho-ddce v5.1.0` (Etapa 0.5 + Regra Inviolavel #86), `tuninho-qa v5.8.0` (sub-check `audit-foreign-operator-drift`), `tuninho-hook-gitflow-guardian v0.1.0` (UserPromptSubmit WARN). Bonus follow-up: bug fix do `cardId-vs-listId confusion` em `tuninho-mural v5.2.0` (card havia sido movido pra Arquivo ao inves de Validando — corretivo + sidecar planka com `lists_mapping` completo) + sidecar escriba/planka (migracao de memorias locais).

## Entregaveis

### Infraestrutura
- `.env` da VPS atualizado (backup `.env.bak-20260519-192943`)
- Imagem `planka-custom:latest` `b02085bd1b4e` (726MB +130MB pelo `@supabase/supabase-js`)
- Imagem `planka-ticket-form:latest` `327f1483fd3f`
- Containers planka + ticket-form rodando healthy com vars novas carregadas

### Pull Requests
- **GGhiaroni/planka#15** — `docs/card-928537-registra-env-supabase-vps` → `deploy/staging` (DOCS-ONLY, aberta NAO auto-merge)
- **victorgaudio/a4tunados-ops-suite#151** — `feat/card-928537-operador-estrangeiro-mode` → `main` (3 skills + 1 hook NOVO + sidecars planka, aberta para review)

### Vault docs_planka
- 8 ADRs (2 originais + 6 retroativos `inferred`)
- 3 implementacao docs (staging-deploy-flow, supabase-mirroring, ticket-form-system)
- 2 sub-arvores cards (377530, 928537)
- 1 proposta DRAFT (operador-estrangeiro — implementada em ops-suite #151)
- MOC + changelog v1.2.0 + report-executivo + versioning atualizados

### Sidecars centrais (ops-suite #151)
- `skills/tuninho-mural/projects/planka/config.md` (NOVO — lists_mapping ERP PDView)
- `skills/tuninho-escriba/projects/planka/sidecar.md` (NOVO — operador estrangeiro context migration)

### Comunicacao mural
- 8 comentarios no card 1778610132976928537 (ACK, plano, deploy, validacao, follow-up, escriba forense, proposta, encerramento)

## Pendencias finais

### Closed nesta sessao
- Habilitacao Supabase em prod (env + deploy + validacao)
- Cobertura forense Ghiaroni no vault planka
- Implementacao do modo operador-estrangeiro na ops-suite
- Bug fix mural cardId-vs-listId + sidecars planka

### Aberto (registrar e' suficiente — proximas sessoes)
1. **Rotacionar `SUPABASE_SECRET_KEY`** — chave exposta no body do card mural. Operador rotaciona no Supabase Dashboard + atualiza .env VPS + restart containers.
2. **Aplicar 1 das 3 mitigacoes** do SSH timeout CI antes do proximo merge em `deploy/staging` (declarar `@supabase/supabase-js` em `package.json`, ou `npm ci` com lockfile, ou ajustar `ServerAliveInterval`).
3. **Mergear PR GGhiaroni/planka#15** apos review (vai disparar CI auto-deploy que provavelmente refalha cosmetico — prod ja esta deployada).
4. **Mergear PR victorgaudio/a4tunados-ops-suite#151** apos review. Apos merge, projetos consumidores recebem skills/hook via `tuninho-updater pull`.
5. **Gerar patch agregado** `feature-bundle-may-2026.patch` (ADR-008 — facilitar future upstream rebase Planka v2.1.0 → v2.1.1+).
6. **Parametrizar regex** de "lista concluida" em [[ADR-005]] via env `CHAMADOS_DONE_LIST_REGEX`.
7. **Remover `.env.bak-20260519-192943`** da VPS apos confirmar dias de uso estavel.

## Historico de seals

- `2026-05-21T16:55:00Z` — `card-close-final-modo-6-seal-008` (Comlurb v5.0.7)

## Proxima sessao

**`_none_`** — card entregue. Pendencias acima sao independentes desta operacao (acao do operador OU operacoes futuras DDCE).

Se operador continuar trabalho neste worktree, hook `tuninho-hook-inicio-sessao` v4.3.0+ avisa: "Card 928537 selado em 2026-05-21. Mural em Done. PRs abertas: #15 (planka) + #151 (ops-suite). Pendencias housekeeping em HANDOFF.md secao 'Aberto'."

---

*Selado por Tuninho da Comlurb v5.0.7 — Modo 6 SEAL-008 single-PR pattern — 2026-05-21.*
