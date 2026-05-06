# Sidecar — tuninho-mural para a4tunados_web_claude_code

> Populado em 2026-05-03 durante card 1766766663711065657 ("Trabalhar com anexos do mural") fluxo card-isolated DDCE.
> Substitui stub gerado em Op 18 Fase 2 (2026-05-02 sob tuninho-mural v0.9.0).

## Board

- **Nome**: `tuninho IDE`
- **ID**: `1745869568800195838`
- **default_origin**: `a4tunados-mural`
- **API base (dev/prod)**: `https://mural.a4tunados.com.br/api`
- **Backend**: Planka (kanban customizado)

## lists_mapping (validado via API real 2026-05-03)

```yaml
lists_mapping:
  backlog: "1745869792541148418"
  todo: "1745869808034907396"
  doing: "1745869836665226502"
  validando: "1766168816896706032"   # criada na Op 18 Card 1
  done: "1745869847167763720"
  arquivo: "1766054713029035415"
```

Movimento canônico DDCE (Regra Inviolável #57 — mural movement em todos os gates):
- Recebimento → `todo` (default ao criar card)
- Iniciada operação → `doing`
- Etapa 15.5 (mural-export tecnico, Regra #48) → `validando`
- Etapa 18 (após validacao humana) → `done`

## repos_mapping (multi-repo Op 18 Card 2 + extensao card-anexos)

```yaml
repos_mapping:
  a4tunados_web_claude_code:
    comment_prefix: "[ide]"
    link_branch_prefix: "https://github.com/victorgaudio/a4tunados_web_claude_code/tree/"
  a4tunados-ops-suite:
    comment_prefix: "[ops-suite]"
    link_branch_prefix: "https://github.com/victorgaudio/a4tunados-ops-suite/tree/"
  a4tunados_mural:
    comment_prefix: "[mural-lib]"
    link_branch_prefix: "https://github.com/victorgaudio/a4tunados_mural/tree/"
```

## attachments_strategy (v0.10.0+ — card 1766766663711065657)

```yaml
attachments_strategy:
  mode: manual_via_flag           # auto | manual_via_flag | disabled
  default_folder_pattern: "fase_NN/evidencias/"
  preferred_modes:
    - card-evidence               # batch para pasta evidencias/
    - attach-evidence             # single para evidência ad-hoc
    - fetch-attachments           # ler anexos existentes
  concurrency_default: 3
  filter_default: "\\.(png|jpe?g|gif|webp|svg|pdf|md|txt|log|json|ya?ml)$"
  download_caveat: |
    Downloads via Bearer podem retornar 401 (Planka session-bound).
    Usar data.url em browser autenticado para acesso confiavel.
```

## Cards / Operacoes

- Pasta de cards: `_a4tunados/_operacoes/cards/`
- Pasta de prompts DDCE: `_a4tunados/_operacoes/prompts/`
- Operacoes: `_a4tunados/_operacoes/projetos/`
- Vault escriba: `_a4tunados/docs_a4tunados_web_claude_code/` (path canonico nao-padronizado — P7 Op 18)

## Status

| Item | Estado |
|------|--------|
| Sidecar criado | 2026-05-02 (stub) |
| Sidecar populado real | **2026-05-03 (esta atualização)** |
| lists_mapping populado | OK — 6 listas validadas via API |
| repos_mapping populado | OK (3 repos: ide, ops-suite, mural) |
| attachments_strategy | OK (v0.10.0 — card 1766766663711065657) |
| Validado em E2E | OK — checkpoints e move-card funcionais durante este card-isolated |

## Cards ativos no board (referencia)

- `1766766663711065657` — "Trabalhar com anexos do mural" (em `doing` durante card-isolated atual, fluxo DDCE)
- `1766153417106916845` — "tester user em prod tb" (Op 18 Card 1) — em `doing`
- `1766095178524788199` — "ddce multi projetos gitflow" (Op 18 Card 2) — em `doing`
- `1766067208959559112` — "Ajustar Chat Terminal Cursor..." (Op 19) — em validacao

## Comandos canonicos

### Movimento entre gates

```bash
# Mover card pra validando (Etapa 15.5)
node .claude/skills/tuninho-mural/cli/mural-cli.js move-card \
  --card <ID> --to validando \
  --project a4tunados_web_claude_code --env dev

# Mover card pra done (Etapa 18, após validacao)
node .claude/skills/tuninho-mural/cli/mural-cli.js move-card \
  --card <ID> --to done \
  --project a4tunados_web_claude_code --env dev
```

### Mural-export técnico (Etapa 15.5 — Regra #48)

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js card-result \
  --card <ID> \
  --results _a4tunados/_operacoes/cards/<ID>_*/results_*.md \
  --pr-url <URL_PR> \
  --mark-validating \
  --project a4tunados_web_claude_code --env dev
```

### Anexos (v0.10.0+)

```bash
# Ler anexos existentes do card
node .claude/skills/tuninho-mural/cli/mural-cli.js fetch-attachments \
  --card <ID> --env dev

# Anexar 1 evidência específica + comment
node .claude/skills/tuninho-mural/cli/mural-cli.js attach-evidence \
  --card <ID> --file <path> --text "<markdown>" --env dev

# Batch upload de pasta inteira (Etapa 11 / 15.X DDCE)
node .claude/skills/tuninho-mural/cli/mural-cli.js card-evidence \
  --card <ID> --folder fase_NN/evidencias/ \
  --text "## Evidências fase N" --env dev
```

### Encerramento (Etapa 18)

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js card-validated \
  --card <ID> \
  --summary "<resumo entregue>" \
  --escriba-ref _a4tunados/docs_a4tunados_web_claude_code/sessoes/<sessao>.md \
  --seal-ref _a4tunados/_operacoes/cards/<ID>_*/handoffs/HANDOFF_*.yaml \
  --project a4tunados_web_claude_code --env dev
```
