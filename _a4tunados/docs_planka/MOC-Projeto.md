# MOC — planka (fork GGhiaroni)

> Map of Content do projeto **planka** — fork customizado do Planka kanban.
> Vault inicial criado em 2026-05-06 ao final da Op 01.
> Atualização forense (cobertura Ghiaroni + Card 928537) em 2026-05-19 — ver [[changelog#[1.2.0]]].

## Identidade

- **Repo**: github.com/GGhiaroni/planka
- **Base upstream**: github.com/plankanban/planka v2.1.0 (em v2.1.1 no upstream)
- **Stack**: Sails.js + React 18 + PostgreSQL 16 + Docker Compose + Caddy (desabilitado, nginx do host serve)
- **Staging**: https://pdviewerp-stagging.fourtuna.com.br/ (hostinger-beta)
- **Form tickets**: https://form-pdviewerp-stagging.fourtuna.com.br/
- **Co-desenvolvido por**: Gabriel Ghiaroni (`@ghiaroni`, mural id 1754033421388089095) — opera fora do ops-suite. Vault atualizado via modo forense [[#Notas sobre operador estrangeiro|operador estrangeiro]].

## Notas sobre operador estrangeiro

> Este projeto tem contribuições significativas (23 commits, 14+ features) de Gabriel Ghiaroni que NÃO passam por skills da ops-suite (DDCE, fix-suporte, escriba, etc.). O vault é mantido em paralelo via **escriba modo forense** — ADRs retroativos com `status: inferred` cobrem decisões inferidas a partir do código + git log + PRs GitHub. Sempre antes de iniciar uma nova operação no planka: `git fetch && git log --author=GGhiaroni --since="<data-ult-op>" --oneline` para identificar gaps.

## Operações executadas

- [Op 01: deploy-planka-hostinger-redeploy](sessoes/2026-05-06_op01-deploy-staging.md) — 2026-05-06

## Cards card-isolated

- [Card 377530 — Validar fluxo de deploy automatico do staging](cards/1769151526032377530_validar-fluxo-de-deploy-automa/report-executivo.md) — 2026-05-06 (✅ validado end-to-end)
- [Card 928537 — Atualização ENV hostinger (Supabase em prod)](cards/1778610132976928537_atualizacao-env-hostinger/report-executivo.md) — 2026-05-19 (✅ deploy validado, em Validando)

## Report Executivo

- [report-executivo.md](report-executivo.md) — Consolidação geral de operações, custos, métricas, features Ghiaroni catalogadas

## ADRs

### Tracked via ops-suite (Op 01 / Cards)

- [ADR-001: Deploy staging via Docker Compose + nginx host + CI/CD GitHub Actions](decisoes/ADR-001-deploy-staging-cicd.md) (Op 01)
- [ADR-002: Workaround sails.io.js + socket.io-client v4 incompat](decisoes/ADR-002-workaround-socket-io-v4.md) (Op 01)

### Retroativos — operador estrangeiro (Ghiaroni features)

- [ADR-003: Espelhamento Planka → Supabase para BI/auditoria](decisoes/ADR-003-supabase-mirroring.md) (PR #14, 2026-05-19 — habilitado em prod via Card 928537)
- [ADR-004: Auto-arquivamento de cards Concluídos após 30 dias](decisoes/ADR-004-auto-archive-30-dias.md) (PR #7, 2026-05-07)
- [ADR-005: Sync real-time + fallback do campo Chamado finalizado em](decisoes/ADR-005-realtime-finalized-sync.md) (PR #9, 2026-05-07)
- [ADR-006: Silent re-sync ao voltar pra aba (cobre eventos socket perdidos)](decisoes/ADR-006-silent-resync-tab-focus.md) (PR #10, 2026-05-07)
- [ADR-007: Paridade de cor labels TableView vs chips Kanban](decisoes/ADR-007-label-color-parity-table-kanban.md) (PR #11, 2026-05-07)
- [ADR-008: Bundle UX/UI Custom Planka (10 features May 2026)](decisoes/ADR-008-ux-bundle-may-2026.md) (May 4-7, pré-CI/CD)

## Implementação

- [Fluxo deploy staging via branch deploy/staging](implementacao/staging-deploy-flow.md)
- [Supabase Mirroring (cards + form_submissions + card_events)](implementacao/supabase-mirroring.md)
- [ticket-form (Node service de formulários → Planka + Supabase)](implementacao/ticket-form-system.md)

## Funcionalidades (catálogo Ghiaroni)

**14 features mapeadas em PRs #5, #7, #9, #10, #11, #13, #14 + bundle May 4:**

| Feature | PR | ADR | Data |
|---|---|---|---|
| Custom label list type + UX bundle | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| Coluna colapsada | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| Drag-and-drop intra-coluna | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| 3 opções altura linha planilha | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| Seed coluna 'Falar com o cliente' | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| Log/histórico do board | (May 4 bundle) | [ADR-008](decisoes/ADR-008-ux-bundle-may-2026.md) | 2026-05-04 |
| Seed boards iniciais + form linkage | #5 | — | 2026-05-06 |
| Auto-archive 30 dias | #7 | [ADR-004](decisoes/ADR-004-auto-archive-30-dias.md) | 2026-05-07 |
| Sync real-time Chamado finalizado em | #9 | [ADR-005](decisoes/ADR-005-realtime-finalized-sync.md) | 2026-05-07 |
| Silent re-sync ao voltar pra aba | #10 | [ADR-006](decisoes/ADR-006-silent-resync-tab-focus.md) | 2026-05-07 |
| Cor labels TableView = Kanban chips | #11 | [ADR-007](decisoes/ADR-007-label-color-parity-table-kanban.md) | 2026-05-07 |
| Ajustes form Pedido de Artes | #13 | — | 2026-05-07 |
| Espelhamento Supabase (cards + forms) | #14 | [ADR-003](decisoes/ADR-003-supabase-mirroring.md) | 2026-05-19 |
| Enable Supabase em prod (env vars + deploy) | Card 928537 | (operacional) | 2026-05-19 |

## Skills tuninho relevantes

- `tuninho-devops-hostinger` — sidecar `projects/hostinger-beta/planka/` (deploy info)
- `tuninho-devops-env` — sidecar `projects/planka/` (env config)
- `tuninho-escriba` — vault keeper + **modo forense operador-estrangeiro** (prototipado neste card)

## Pendências de housekeeping

- [ ] Mergear PR #15 (`docs/card-928537-registra-env-supabase-vps` → `deploy/staging`) — doc-only, aberta NÃO auto-merge.
- [ ] Aplicar 1 das 3 mitigações para o SSH timeout do CI antes do próximo merge em deploy/staging (declarar `@supabase/supabase-js` em `package.json`, ou `npm ci` com lockfile, ou ajustar `ServerAliveInterval`).
- [ ] Rotacionar `SUPABASE_SECRET_KEY` (exposta no body do Card 928537).
- [ ] Gerar patch agregado `feature-bundle-may-2026.patch` para facilitar future upstream rebase (mitigação proposta em [[ADR-008]]).
- [ ] Parametrizar regex de "lista concluída" em [[ADR-005]] via env `CHAMADOS_DONE_LIST_REGEX`.
