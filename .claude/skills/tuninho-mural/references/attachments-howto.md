# Tuninho Mural — Anexos no fluxo DDCE (v0.10.0+)

Guia operacional para usar `fetch-attachments`, `attach-evidence` e `card-evidence` durante operações.

## Quando usar

| Cenário | Modo |
|---|---|
| Trazer contexto: ler anexos que o operador colocou no card | `fetch-attachments` |
| Anexar 1 evidência específica + comentário | `attach-evidence` |
| Anexar pasta inteira de evidências (Playwright fase_NN/evidencias/) | `card-evidence` |
| DDCE Etapa 11.5 / 15.X — incluir prints da operação | `card-evidence --folder fase_NN/evidencias/` |

## Pré-requisitos

- `services/mural-api-client@>=0.2.0` (com `listAttachments` e fix bug Planka #1352)
- Env carregado de `_a4tunados/env/mural/.env.mural.{dev|prod}`:
  - `MURAL_API_URL` (com ou sem `/api` — CLI normaliza)
  - `MURAL_TUNINHO_TOKEN` (Bearer do bot)
  - `ADMIN_USER_ID` (para X-Acted-On-Behalf-Of)

## fetch-attachments

```bash
# Listar metadata
node .claude/skills/tuninho-mural/cli/mural-cli.js fetch-attachments \
  --card 1766766663711065657 --env prod

# Listar + baixar para folder local
node .claude/skills/tuninho-mural/cli/mural-cli.js fetch-attachments \
  --card 1766766663711065657 --download-to /tmp/anexos-card --env prod
```

**Output**:
```json
{
  "ok": true,
  "count": 2,
  "items": [
    { "id": "...", "name": "screenshot.png", "type": "file",
      "url": "https://mural.../attachments/.../download/screenshot.png",
      "sizeInBytes": 102400, "mimeType": "image/png", "createdAt": "..." }
  ]
}
```

**⚠️ Limitação download**: Planka exige session-bound token para `/attachments/{id}/download/{filename}`. CLI Bearer pode retornar 401 → use `data.url` em browser autenticado.

## attach-evidence

```bash
# Anexar 1 PNG + comment customizado
node .claude/skills/tuninho-mural/cli/mural-cli.js attach-evidence \
  --card 1766766663711065657 \
  --file _a4tunados/_operacoes/cards/.../fase_01/evidencias/login_admin.png \
  --text "Validação Playwright login admin (Op 18 F2)" \
  --env prod

# Anexar arquivo com comment default (📎 Evidência: filename)
node .claude/skills/tuninho-mural/cli/mural-cli.js attach-evidence \
  --card 1766766663711065657 --file ./relatorio.pdf --env prod
```

**MimeType automático** via extensão: `.png→image/png`, `.jpg→image/jpeg`, `.pdf→application/pdf`, `.md→text/markdown`, etc.

## card-evidence (batch — recomendado para pasta evidencias/)

```bash
# Default: filtro padrão png|jpg|gif|webp|svg|pdf|md|txt|log|json|yaml, concurrency 3
node .claude/skills/tuninho-mural/cli/mural-cli.js card-evidence \
  --card 1766766663711065657 \
  --folder _a4tunados/_operacoes/cards/.../fase_01/evidencias/ \
  --text "## Evidências fase 01 — validação E2E" \
  --env prod

# Apenas PNGs com concurrency 5
node .claude/skills/tuninho-mural/cli/mural-cli.js card-evidence \
  --card 1766766663711065657 --folder ./evidencias/ \
  --filter '\.png$' --concurrency 5 --env prod
```

**Output**:
```json
{
  "ok": true,
  "count": 5,
  "total_files": 5,
  "attachment_ids": ["...","..."],
  "comment_id": "...",
  "folder": "./evidencias/"
}
```

## Integração com DDCE

### Etapa 11 (Validação Playwright)

Após capturar screenshots em `fase_NN/evidencias/`, antes de prosseguir para Etapa 12 (Validação humana):

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js card-evidence \
  --card $CARD_ID --folder fase_NN/evidencias/ \
  --text "## Evidências automáticas — Playwright fase ${N}" \
  --env prod
```

### Etapa 15.5 (Mural Export tecnico)

Após `card-result --mark-validating`, complementar com pasta consolidada de evidências de toda a operação:

```bash
node .claude/skills/tuninho-mural/cli/mural-cli.js card-evidence \
  --card $CARD_ID --folder _a4tunados/_operacoes/cards/$CARD_ID_*/all-evidencias/ \
  --text "## Evidências consolidadas da operação" \
  --env prod
```

(Em Op futura, esse passo poderá ser disparado AUTO via Regra DDCE estendida — design opt-in nesta op.)

## Troubleshooting

| Sintoma | Causa | Resolução |
|---|---|---|
| Upload retorna 413 Payload Too Large | Servidor Planka tem cap (geralmente 50MB) | Comprimir / dividir |
| Upload `>64KB` falha silenciosamente | Lib < v0.2.0 (bug Planka #1352) | Atualizar mural-api-client |
| Download retorna 401 | Bearer não aceito em rota /attachments/* | Usar data.url em browser |
| MimeType incorreto, UI mostra ícone genérico | Extensão não mapeada | Adicionar em `MIME_BY_EXT` (mural-cli.js) |
| Comment não vincula attachment | createComment recebeu attachmentIds vazio | Verificar que upload retornou `item.id` válido |
| Rate limit / 429 | Concurrency muito alta | `--concurrency 1` ou `--concurrency 2` |

## Referências externas

- [Planka issue #1352 — multipart order bug](https://github.com/plankanban/planka/issues/1352)
- [Planka discussion #1460 — attachment download](https://github.com/plankanban/planka/discussions/1460)
- [mural-api-client CHANGELOG v0.2.0](../../../services/mural-api-client/CHANGELOG.md)
