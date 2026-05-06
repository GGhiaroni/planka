# Staging Deploy Flow — Como deployar

## Quick start (dev)

```bash
git checkout deploy/staging
git merge develop                    # ou cherry-pick
git push origin deploy/staging
```

GitHub Actions cuida do resto. Acompanhe em https://github.com/GGhiaroni/planka/actions

## Anatomia do fluxo

```
1. Dev faz git push origin deploy/staging
                ↓
2. GitHub Actions trigger (.github/workflows/deploy-staging.yml)
                ↓
3. Runner Ubuntu Setup SSH com STAGING_DEPLOY_SSH_KEY
                ↓
4. rsync ./  →  root@76.13.239.198:/opt/hostinger-beta/planka/
   (excluindo .git, node_modules, .env, _a4tunados, .claude, .mcp.json,
    .vscode, docker-compose.hostinger-beta.yml)
                ↓
5. SSH invoca /opt/hostinger-beta/planka/scripts/deploy.sh
                ↓
6. deploy.sh executa:
   a) pg_dump preventivo (/opt/hostinger-beta/backups/planka-pre-deploy-*.dump)
   b) Tag imagem atual como pre-deploy
   c) docker compose build planka
   d) docker compose up -d --force-recreate planka
   e) Healthcheck loop até "healthy" (timeout 90s)
   f) Smoke HTTP externo (curl https://...)
   g) Restart ticket-form (re-le .env)
   h) Em qualquer falha: rollback automático (volta imagem pre-deploy)
                ↓
7. Runner faz smoke test final (curl HTTP 200)
                ↓
8. Workflow ENCERRA. Status visível em github.com/.../actions
```

## Tempo total esperado

3-5 min do push ao staging atualizado.

## Em caso de falha

`scripts/deploy.sh` tem rollback automático interno:
- Falha healthcheck (timeout 90s) → volta imagem `pre-deploy`
- Falha smoke HTTP → volta imagem `pre-deploy`
- DB nunca é tocado (volume preservado)

Backups pg_dump em `/opt/hostinger-beta/backups/`.

## Pre-requisitos (one-time setup operador)

### 1. Mover workflow file
```bash
git mv docs/deploy-staging.workflow.yml.template .github/workflows/deploy-staging.yml
git commit -m "chore: enable deploy-staging workflow"
git push
```

### 2. Adicionar secrets no GitHub Repo Settings → Secrets → Actions

| Secret | Valor |
|--------|-------|
| `STAGING_DEPLOY_SSH_KEY` | Private key gerada (vai entregar separado) |
| `STAGING_DEPLOY_HOST` | `76.13.239.198` |
| `STAGING_DEPLOY_USER` | `root` |

### 3. Validar
```bash
git checkout deploy/staging
git commit --allow-empty -m "test: trigger deploy"
git push origin deploy/staging
```

## Manutenção

### Limpar imagens antigas no servidor
```bash
ssh root@76.13.239.198 "docker image prune -a -f"
```

### Ver logs ao vivo
```bash
ssh root@76.13.239.198 "docker logs -f planka-planka-1"
```

### DB shell
```bash
ssh root@76.13.239.198 "docker exec -it planka-postgres-1 psql -U postgres planka"
```

### Reset DB (cuidado! perde dados)
```bash
ssh root@76.13.239.198 "
  cd /opt/hostinger-beta/planka
  docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env down
  docker volume rm planka_postgres-data
  docker compose -f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env up -d planka postgres
"
```
