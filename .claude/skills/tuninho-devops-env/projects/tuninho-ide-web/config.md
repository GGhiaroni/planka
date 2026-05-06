# tuninho-ide-web — Environment Config

> Gerado por tuninho-devops-env v1.0.0 em 2026-04-03

## Producao

| Item | Valor |
|------|-------|
| **Porta** | 3847 |
| **Dominio** | tuninhoideweb.fourtuna.com.br |
| **PM2** | tuninho-ide-web |
| **tmux prefix** | tuninho_ |
| **CDP ports** | 9222+ |
| **Database** | /opt/hostinger-alfa/tuninho-ide-web/data/tuninho.db |
| **Nginx** | /opt/hostinger-alfa/nginx/sites/tuninho-ide-web.conf |
| **SSL** | Let's Encrypt (expira 2026-06-28) |
| **Startup** | ecosystem.config.cjs via PM2 |

## Desenvolvimento

| Item | Valor |
|------|-------|
| **Porta** | 3848 |
| **Dominio** | localhost |
| **PM2** | N/A (node --watch via dev.sh) |
| **tmux prefix** | tundev_ |
| **CDP ports** | 19222+ |
| **Database** | {workspace}/data/tuninho.db |
| **Startup** | `bash dev.sh` |

## Matriz de Isolamento

| Recurso | Producao | Dev | Status |
|---------|----------|-----|--------|
| Porta HTTP | 3847 | 3848 | Isolado |
| tmux prefix | tuninho_ | tundev_ | Isolado |
| CDP ports | 9222+ | 19222+ | Isolado |
| Database | /opt/.../data/ | workspace/data/ | Isolado |
| JWT Secret | data/.jwt-secret | data/.jwt-secret (separado) | Isolado |
| GitHub OAuth | data/.github-oauth | data/.github-oauth (copiado) | Compartilhado |
| Claude CLI | /usr/local/bin/claude | /usr/local/bin/claude | Compartilhado |

## Riscos de Estado Compartilhado

1. **GitHub OAuth** — dev copia credenciais de prod. Callback URL aponta para prod domain. Login OAuth em dev redireciona para prod.
2. **Claude CLI** — binario global compartilhado. Sem risco de conflito.
3. **Chromium headless** — binario compartilhado, mas portas CDP isoladas.

## Como rodar dev

```bash
# SEMPRE usar dev.sh — NUNCA node server.js direto
bash dev.sh
```

## Como deployar

```bash
# Rsync workspace → prod com backup e gates
bash deploy.sh
```

## Cross-Projects no Servidor

| Projeto | Porta | Dominio | PM2/systemd |
|---------|-------|---------|-------------|
| maestrofieldmanager | 3001 | maestro.fourtuna.com.br | PM2 |
| chooz_2026 | 3849 | chooz2026.fourtuna.com.br | PM2 |
| orquestravoadora | 3040 | dev.oficinaorquestravoadora2026.55jam.com.br | systemd |
