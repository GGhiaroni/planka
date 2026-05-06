# Sidecar: a4tunados_web_claude_code (Tuninho IDE Web)

## Changelog e Versionamento

- **Changelog path**: `CHANGELOG.md` (raiz do projeto)
- **Version file (package.json)**: `package.json` campo `version`
- **Version file (UI)**: `public/index.html` — span com id `app-version-badge`
- **Formato**: Keep a Changelog (pt-BR). Seções: Adicionado, Alterado, Corrigido, Removido
- **Versionamento**: Semver (MAJOR.MINOR.PATCH)
- **Instruções para Escriba**: Ao documentar operações, atualizar CHANGELOG.md com entrada datada. Bumpar version no package.json e no index.html (.app-version badge). O changelog é renderizado em modal ao clicar no badge de versão no header.

## Interdependências de Módulos

Este projeto tem **forte acoplamento entre módulos**. Toda modificação deve considerar:

1. **Event system**: Módulos comunicam via CustomEvent (`file-selected`, `files-changed`, `file-watcher-change`, `git-status-updated`, `project-selected-from-explorer`). Alterar eventos pode quebrar múltiplos módulos.
2. **Project switching**: `projectTabs.onSwitch` orquestra todos os módulos (editor, terminal, explorer, browser, gitgraph, source-control). Adicionar módulo novo = registrar no switch.
3. **Auth token**: Passado como parâmetro no constructor de cada módulo. WebSocket usa query param `?token=`.
4. **Workspace isolation**: Todos os paths passam por `safePath()` no server. Nunca acessar arquivos fora do workspace do usuário.
5. **Editor state**: `saveProjectState()`/`restoreProjectState()` serializa estado de todas as abas (incluindo pin, preview, type). Adicionar propriedade nova = incluir na serialização.

## Op 18 — adicoes desta versao (DDCE v4.12.0, 2026-05-02)

### Identidade do projeto

- **Nome canonico**: a4tunados_web_claude_code
- **Repo principal**: github.com/victorgaudio/a4tunados_web_claude_code
- **Versao prod**: 0.3.0 (Op 14)
- **Versao local**: 0.3.1 (Op 15 nao deployada)

### Multi-repo (Card 2)

Operacoes neste projeto podem cruzar 2+ repos:

| Repo | Papel | Branch typical |
|------|-------|----------------|
| `a4tunados_web_claude_code` | IDE — codigo principal + auth + workspaces | `feat/op{NN}-...` ou `fix/...` |
| `a4tunados-ops-suite` | Skills tuninho-* + hooks | `fix/op{NN}-bumps-...` ou direto em main |
| `a4tunados_mural` | Mural backend (Planka customizado) | `feat/op{NN}-...` ou `fix/...` |

Em operacoes single-repo (default), so o repo principal entra no scope. Em multi-repo, sidecar `tuninho-git-flow-dafor/projects/.../state.yaml` deve ter `repos: []` populado e Comlurb v0.10.0+ adiciona `repos_state: {}` ao HANDOFF.

### Vault Escriba

- **Path canonico** (esperado): `_a4tunados/docs_a4tunados_web_claude_code/`
- **Path atual** (P7 Op 18 deferida): `_a4tunados/docs_a4tunados_web_claude_code/`
- **Find dinamico**: `find _a4tunados -maxdepth 2 -type d -name "docs_*"` retorna o path real

### Mural board (Card 1)

- **Board name**: `tuninho IDE`
- **Backend**: a4tunados-mural (Planka customizado)
- **Sidecar tuninho-mural**: `.claude/skills/tuninho-mural/projects/a4tunados_web_claude_code/config.md` (stub gerado Op 18 Fase 2)
- **Listas canonicas**: todo, doing, validando, done

### Defaults DDCE adicionais

| Item | Valor |
|------|-------|
| Pasta operacoes | `_a4tunados/_operacoes/projetos/{NN}_{nome}/` |
| Pasta cards | `_a4tunados/_operacoes/cards/{cardId}_{slug}/` |
| Branch base | `develop` |
| PR target padrao | `develop` (gitflow d'a4) |
| Main extremamente conservadora | sim |

### Token rhythm baselines (Regra Inviolavel #54)

| Sessao Op 18 | Baseline | Fim |
|--------------|----------|-----|
| Sessao 01 (Discovery) | 124k (12.5%) | 720k (72%) |
| Sessao 02 (DEFINE+EXEC autonomo) | 144k (14.4%) | (em curso) |

### Test users (referencia tuninho-tester)

| Username | Role | ID DB | Auth method em prod |
|----------|------|-------|---------------------|
| admin | admin | 1 | github-oauth |
| victorgaudio | admin | 2 | github-oauth ou x-test-bypass-prod (Card 1) |
| tuninho-tester-admin | admin | 3 | x-test-bypass-prod (Card 1) ou dev-bypass local |
| tuninho-tester-member | user | 4 | x-test-bypass-prod ou dev-bypass local |
