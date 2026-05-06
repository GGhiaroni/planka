# Licoes Aprendidas — Tuninho DevOps Env

| # | Licao | Categoria | Status |
|---|-------|-----------|--------|
| 1 | Editar producao diretamente causa divergencia workspace/prod | Isolamento | Mitigado (skill + hook) |
| 2 | tmux prefix hardcoded causa cross-contamination de sessoes | tmux | Mitigado (env var) |
| 3 | CDP port hardcoded causa conflito de Chromium instances | Browser | Mitigado (env var) |
| 4 | dev.sh DEVE ser o unico modo de rodar dev | Processo | Ativo |
| 5 | .mcp.json pode ser sobrescrito por outra instancia | MCP | Mitigado (dirs separados) |

---

### #1 — Editar producao diretamente causa divergencia

- **Descoberta em:** Operacao 09 (multi sessions stability), 2026-04-02
- **Contexto:** Sessao anterior editou arquivos diretamente em `/opt/hostinger-alfa/tuninho-ide-web/` (producao) sem commitar no workspace
- **Problema:** Producao tinha codigo (overlay files, claim handlers) que o workspace/git nao tinha. Deploy seguinte reverteria essas mudancas.
- **Solucao:** Regra: NUNCA editar prod diretamente. Sempre workspace → deploy.sh. Skill devops-env cataloga para prevenir.

### #2 — tmux prefix hardcoded causa cross-contamination

- **Descoberta em:** Operacao 09 (isolamento dev/prod), 2026-04-02
- **Contexto:** `tmux-manager.js` tinha `tuninho_` hardcoded em 3 locais
- **Problema:** Instancia dev listava e tentava gerenciar sessoes tmux de producao
- **Solucao:** Prefix via `TUNINHO_SESSION_PREFIX` env var. Dev usa `tundev_`, prod usa `tuninho_`.

### #3 — CDP port hardcoded causa conflito de Chromium

- **Descoberta em:** Operacao 09 (isolamento dev/prod), 2026-04-02
- **Contexto:** `browser-manager.js` tinha `this._nextPort = 9222` hardcoded
- **Problema:** Dev e prod disputavam as mesmas portas CDP para Chromium headless
- **Solucao:** Port start via `TUNINHO_CDP_PORT_START` env var. Dev usa 19222, prod usa 9222.

### #4 — dev.sh DEVE ser o unico modo de rodar dev

- **Descoberta em:** Operacao 09 (validacao), 2026-04-02
- **Contexto:** Rodar `node server.js` direto usa PORT default (3456) e prefix default (`tuninho_`)
- **Problema:** Conflita com producao em porta e tmux prefix
- **Solucao:** Sempre usar `bash dev.sh` que configura todas as env vars de isolamento.

### #5 — .mcp.json pode ser sobrescrito por outra instancia

- **Descoberta em:** Operacao 09 (analise de conflitos), 2026-04-02
- **Contexto:** Duas instancias escrevem `.mcp.json` no workspace com CDP ports diferentes
- **Problema:** Claude Code conecta ao browser errado
- **Solucao:** Cada instancia tem seu workspaces/ dir separado. Risco mitigado naturalmente.
