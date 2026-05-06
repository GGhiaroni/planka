# Playwright Stability — CDP Respawn + Session Recovery

> Criado em 2026-04-23 a partir da L4.1 da Op 05 Fase 4 (tuninho.ai).
>
> Documento prescritivo. Quando o chrome-headless do Playwright MCP morre
> mid-session (sintoma: `Error: server: connect ECONNREFUSED 127.0.0.1:<port>`),
> este e o procedimento padrao de recuperacao.

## Quando isso acontece

- Sessoes longas de Playwright (60+ min contínuos com multiplos
  `browser_navigate` + `browser_click` + `browser_snapshot`)
- Apos `browser_close` quando o MCP tenta reconectar no mesmo CDP
- Quando o chrome processa HTML/JS pesado (combobox virtualizado com
  200+ items, single-page-app com muito re-render)
- Em workspaces Claude Code onde outros processos disputam CPU/memoria

**Sintoma reprovado**: `browser_take_screenshot` retorna
`Error: browserBackend.callTool: Target page, context or browser has been closed`.
Qualquer chamada subsequente retorna
`Error: server: connect ECONNREFUSED 127.0.0.1:<port>`.

## Procedimento de recuperacao (copiar e adaptar)

```bash
# 1. Fechar elegantemente (pode falhar, ok)
# (via MCP) browser_close

# 2. Respawn manual de novo chrome-headless no MESMO port do .mcp.json
# Ler port do projeto:
CDP_PORT=$(grep -oP '127\.0\.0\.1:\K[0-9]+' .mcp.json | head -1)
echo "CDP port alvo: $CDP_PORT"

# 3. Verificar se port ja esta ocupado
ss -tlnp 2>/dev/null | grep ":$CDP_PORT " && echo "ocupado" || echo "livre"

# 4. Spawn chrome-headless (path do Playwright MCP default):
nohup /root/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell \
  --remote-debugging-port=$CDP_PORT \
  --no-sandbox --disable-setuid-sandbox --disable-gpu \
  --headless=new \
  --window-size=1280,900 \
  about:blank > /tmp/chrome-${CDP_PORT}.log 2>&1 &

sleep 2

# 5. Verificar que port abriu
ss -tlnp 2>/dev/null | grep ":$CDP_PORT "

# 6. Via MCP: browser_navigate pro primeiro URL (o MCP re-conecta no CDP)
```

## Estado perdido apos respawn

- **Cookies e session storage**: perdidos. Re-login obrigatorio.
  Em projetos com Firebase Auth: re-invocar `auth-e2e-bypass-popup.yaml`
  (mint custom token + signin).
- **Local storage**: perdido. Se o projeto armazena settings la, re-setar.
- **Historico de navegacao**: vazio.
- **Screenshots ja tirados**: preservados no disco (nao afetados).

## Boas praticas preventivas

1. **Em sessoes >30min de Playwright intenso**, considerar fazer
   `browser_close` proativo + respawn antes de operacoes criticas.
2. **Capturar screenshots em progress**, nao so no fim. Se CDP morrer,
   pelo menos as evidencias parciais estao salvas.
3. **Salvar token de bypass em /tmp** no inicio da sessao:
   ```bash
   npx tsx scripts/mint-test-tokens.mts | jq -r '.admin.idToken' > /tmp/admin-token.txt
   ```
   Assim, apos respawn, o re-login e 1-liner: `curl -c cookies.txt -X POST
   /api/auth/signin -H "Authorization: Bearer $(cat /tmp/admin-token.txt)"`.
4. **Preferir `browser_evaluate` com `fetch` sobre `browser_click`** quando
   a acao UI tem endpoint HTTP equivalente — reduz chance de frame reparse
   + crash (ver recomendacao em `roteiros-template.yaml`).

## Integracao com audit-user-flow

Quando `audit-user-flow` detecta crash do CDP mid-gate, NAO marca o gate
como FAIL automaticamente. Primeiro tenta respawn seguindo este doc. Se
respawn falha ou a acao que causou o crash se repete, ai sim FAIL + log
em `fase_NN/qa/audit-playwright-stability-{ts}.md`.

## Historico

- 2026-04-23: documento criado. Incidente Op 05 Fase 4 — 1 crash CDP
  apos click em combobox com 353 items. Respawn manual + re-login via
  bearer token funcionou; Fase 4 completou com 3 screenshots salvos.
