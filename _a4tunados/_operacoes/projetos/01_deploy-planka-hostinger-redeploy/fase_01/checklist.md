# Checklist Fase 1 — Bootstrap deploy seguro

- [ ] T1.1: Backup preventivo pg_dump do DB atual no servidor B
- [ ] T1.2: rsync código local → /opt/hostinger-beta/planka/ (preservando .env, _a4tunados, .git)
- [ ] T1.3: Validar override compose com `docker compose ... config`
- [ ] T1.4: Rebuild imagem planka-custom:latest com tag pre-deploy de safety
- [ ] T1.5: Restart container planka com --force-recreate (preservando postgres-data)
- [ ] T1.6: Smoke + healthcheck pós-deploy (HTTPS 200 + container healthy + logs limpos)
- [ ] T1.7: Validação E2E real Playwright multi-viewport (desktop + mobile) com interpretação visual + 5 features dev validadas
