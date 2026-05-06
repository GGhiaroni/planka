# Playwright Patterns — Tuninho QA

> Padroes de uso do Playwright que o QA exige.
> Inspirado nas Licoes #2, #31, #32 do tuninho-ddce.

---

## Padrao 1 — NUNCA usar `browser_take_screenshot`

**Por que**: causa erro 400 de incompatibilidade de tipo de imagem (Licao #2).

```
API Error: 400 {"type":"error","error":{"type":"invalid_request_error",
"message":"Image does not match the provided media type"}}
```

**Alternativas obrigatorias**:

```javascript
// Padrao 1 (preferivel): browser_snapshot do MCP Playwright
await mcp__playwright__browser_snapshot()

// Padrao 2: browser_run_code com page.screenshot
await mcp__playwright__browser_run_code({
  code: `await page.screenshot({ path: 'evidencias/fase_06_T6.1_workspace_inicial.png', fullPage: true })`
})
```

---

## Padrao 2 — SEMPRE interpretar screenshots via Read tool

**Licao #31**: capturar sem interpretar = nao capturou.

**Fluxo correto**:

1. Capturar screenshot via `browser_run_code` ou `browser_snapshot`
2. Aguardar arquivo escrito em disco
3. Usar Read tool com path absoluto:
   ```
   Read({ file_path: "/Users/vcg/.../evidencias/T6.1_workspace_inicial.png" })
   ```
4. Registrar interpretacao verbatim no relatorio

**Interpretacao deve cobrir**:
- (a) Quais informacoes estao visiveis?
- (b) Algum texto cortado, sobreposto ou truncado?
- (c) Layout adequado ao viewport (sem overflow)?
- (d) Botoes/acoes acessiveis (clicaveis, dentro do viewport)?
- (e) Algum erro visual (placeholder `{x}`, "undefined", "NaN", "[object Object]")?

---

## Padrao 3 — SPA navigation > page.goto()

**Licao #32**: `page.goto()` reinicia a sessao do analytics; clicar em links preserva.

**Para auditoria de fluxo de usuario real**:

```javascript
// Errado (reinicia sessao, perde state, contamina analytics)
await page.goto('http://localhost:3000/board/123')

// Correto (simula uso real)
await page.goto('http://localhost:3000')                // entrada inicial
await page.click('text=Meu Projeto')                    // click navega
await page.click('[data-testid="board-card-123"]')      // SPA navigation
```

`page.goto()` so e aceito para entrada inicial na aplicacao.

---

## Padrao 4 — Esperar elementos antes de interagir

```javascript
// Errado (pode falhar por timing)
await page.click('text=Submit')

// Correto (aguarda elemento existir e ser clicavel)
await page.waitForSelector('text=Submit', { state: 'visible' })
await page.click('text=Submit')
```

Usar `waitFor` da MCP Playwright tool para esperas explicitas.

---

## Padrao 5 — Capturar console errors

```javascript
const consoleErrors = []
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})

// ... fazer interacoes ...

if (consoleErrors.length > 0) {
  // FAIL — console errors sao criterio de bloqueio
  console.log('CONSOLE ERRORS:', consoleErrors)
}
```

QA exige captura de console errors como parte do `post-check`.

---

## Padrao 6 — Capturar network failures

```javascript
const networkFailures = []
page.on('response', response => {
  if (response.status() >= 400) {
    networkFailures.push({
      url: response.url(),
      status: response.status()
    })
  }
})

// ... interagir ...

if (networkFailures.length > 0) {
  // FAIL — network errors sao criterio de bloqueio
}
```

---

## Padrao 7 — Naming consistente de evidencias

Padrao: `T{N}.{M}_{descricao_curta_sem_acento}.png`

Exemplos:
- `T6.1_workspace_inicial_vazio.png`
- `T6.1_workspace_apos_add_primeiro.png`
- `T6.2_dual_display_comment_tuninho.png`
- `T7.3_diff_overlay_sem_botoes_pr.png`

Para auditorias retroativas: `RETRO_T{N}.{M}_{descricao}.png`

---

## Padrao 8 — fullPage sempre true

```javascript
await page.screenshot({ path: '...', fullPage: true })
```

Razao: viewport pode esconder problemas (overflow, conteudo abaixo do fold).
fullPage captura tudo que existe na pagina.

---

## Padrao 9 — Resize antes de screenshots criticos

Para validar responsividade, capturar em multiplos viewports:

```javascript
// Desktop
await page.setViewportSize({ width: 1440, height: 900 })
await page.screenshot({ path: 'T6.1_desktop.png', fullPage: true })

// Tablet
await page.setViewportSize({ width: 768, height: 1024 })
await page.screenshot({ path: 'T6.1_tablet.png', fullPage: true })

// Mobile
await page.setViewportSize({ width: 375, height: 812 })
await page.screenshot({ path: 'T6.1_mobile.png', fullPage: true })
```

---

## Padrao 10 — Cleanup entre testes

Entre tarefas, limpar estado para evitar contaminacao:

```javascript
// Limpar localStorage
await page.evaluate(() => localStorage.clear())

// Limpar sessionStorage
await page.evaluate(() => sessionStorage.clear())

// Logout se aplicavel
await page.click('text=Logout').catch(() => {})
```

---

## Anti-padroes (NUNCA fazer)

| Anti-padrao | Por que e errado |
|-------------|------------------|
| `browser_take_screenshot` | Erro 400 garantido (Licao #2) |
| Capturar e nao interpretar | Licao #31 — screenshot sem interpretacao = nao capturado |
| `page.goto()` em vez de click | Licao #32 — quebra sessao do analytics, nao simula uso real |
| `setTimeout` em vez de `waitFor` | Race condition, falha intermitente |
| Screenshot `fullPage: false` | Esconde problemas abaixo do fold |
| Naming inconsistente | Dificulta cross-reference no relatorio |
| Aceitar PASS sem validar console + network | Bugs invisiveis a olho nu |
| Smoke test "rapidinho" sem screenshot | Sem evidencia = sem prova (Princ. 1) |

---

*Tuninho QA v0.1.0 — playwright-patterns*
