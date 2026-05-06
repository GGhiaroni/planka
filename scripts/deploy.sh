#!/usr/bin/env bash
# Deploy script — invocado pelo GitHub Actions via SSH.
# Roda em /opt/hostinger-beta/planka/ no servidor hostinger-beta.
#
# Funcao: rebuilda imagem planka-custom + restart preservando volumes.
# Idempotente. Tem rollback automatico se smoke falha.

set -euo pipefail

cd /opt/hostinger-beta/planka

LOG_PREFIX="[deploy.sh $(date +%Y-%m-%dT%H:%M:%S)]"
log() { echo "$LOG_PREFIX $*"; }

COMPOSE_BASE="-f docker-compose.prod.yml -f docker-compose.hostinger-beta.yml --env-file .env"

log "1/6 Backup pg_dump preventivo"
mkdir -p /opt/hostinger-beta/backups
BACKUP="/opt/hostinger-beta/backups/planka-pre-deploy-$(date +%Y%m%d-%H%M%S).dump"
docker exec planka-postgres-1 pg_dump -U postgres -Fc planka > "$BACKUP" || {
  log "BACKUP FAILED — aborting deploy (DB safety first)"
  exit 1
}
log "Backup OK: $BACKUP ($(du -h $BACKUP | cut -f1))"

log "2/6 Tag imagem atual como pre-deploy (rollback safety)"
docker tag planka-custom:latest planka-custom:pre-deploy 2>/dev/null || log "(no current image — first deploy?)"

log "3/6 Build nova imagem"
docker compose $COMPOSE_BASE build planka

log "4/6 Restart container planka (preservando postgres-data)"
docker compose $COMPOSE_BASE up -d --force-recreate planka

log "5/6 Aguarda healthcheck (timeout 90s)"
for i in $(seq 1 90); do
  STATUS=$(docker inspect planka-planka-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "healthy" ]; then
    log "Container healthy apos ${i}s"
    break
  fi
  sleep 1
  if [ $i -eq 90 ]; then
    log "TIMEOUT — container nao ficou healthy em 90s. Iniciando rollback."
    docker tag planka-custom:pre-deploy planka-custom:latest 2>/dev/null
    docker compose $COMPOSE_BASE up -d --force-recreate planka
    exit 2
  fi
done

log "6/6 Smoke test HTTP externo"
HTTP_CODE=$(curl -fsSL -o /dev/null -w "%{http_code}" https://pdviewerp-stagging.fourtuna.com.br/ || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  log "SMOKE FAILED: HTTP $HTTP_CODE — iniciando rollback"
  docker tag planka-custom:pre-deploy planka-custom:latest 2>/dev/null
  docker compose $COMPOSE_BASE up -d --force-recreate planka
  exit 3
fi

# Rebuild + restart ticket-form (necessario quando codigo do form mudou — sem
# --build, fixes em ticket-form/src/ nao chegam ao container).
log "Bonus: rebuild + restart ticket-form para aplicar codigo novo + reler .env"
docker compose $COMPOSE_BASE up -d --build --no-deps ticket-form 2>/dev/null || log "(ticket-form skip)"

log "DEPLOY OK ✓ — staging em https://pdviewerp-stagging.fourtuna.com.br/"
