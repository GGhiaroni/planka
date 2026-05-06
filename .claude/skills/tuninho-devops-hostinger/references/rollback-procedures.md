# Procedimentos de Rollback — Tuninho DevOps Hostinger Alfa

> Tres niveis de rollback para o servidor Hostinger Alfa.
> Aplicavel a qualquer projeto. Use o nivel minimo necessario.

---

## Quando usar cada nivel

| Nivel | Cenario | Tempo estimado | Risco |
|-------|---------|----------------|-------|
| **Level 1 — Quick** | Deploy sem migrations, app nao inicia ou HTTP erro | ~1 min | Baixo |
| **Level 2 — Migration** | Migrations aplicadas, app com dados corrompidos | ~2 min | Medio |
| **Level 3 — Nuclear** | Tudo falhou, restaurar estado completo do backup | ~5 min | Alto |

---

## Level 1 — Quick Rollback

**Pre-condicao:** Nenhuma migration foi aplicada. Apenas swap de diretorio.

```bash
# Variaveis (substituir)
PROJETO="{projeto}"
VERSION="{versao}"
DOMINIO="{dominio}"

# Executar
pm2 stop $PROJETO
rm -rf /opt/hostinger-alfa/$PROJETO
mv /opt/hostinger-alfa/${PROJETO}_pre_v${VERSION} /opt/hostinger-alfa/$PROJETO
pm2 flush $PROJETO
cd /opt/hostinger-alfa/$PROJETO && pm2 start ecosystem.config.js
pm2 save

# Verificar
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://$DOMINIO/
pm2 status
```

---

## Level 2 — Migration Rollback

**Pre-condicao:** Migrations foram aplicadas e causaram problema. Restaurar DB do backup.

```bash
# Variaveis (substituir)
PROJETO="{projeto}"
VERSION="{versao}"
DOMINIO="{dominio}"
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/${PROJETO}-pre-deploy-* | head -1)

# Parar app
pm2 stop $PROJETO

# Restaurar diretorio
rm -rf /opt/hostinger-alfa/$PROJETO
mv /opt/hostinger-alfa/${PROJETO}_pre_v${VERSION} /opt/hostinger-alfa/$PROJETO

# Restaurar DB do backup
cp $BACKUP_DIR/production.db /opt/hostinger-alfa/$PROJETO/prisma/production.db

# Reiniciar
pm2 flush $PROJETO
cd /opt/hostinger-alfa/$PROJETO && pm2 start ecosystem.config.js
pm2 save

# Verificar
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://$DOMINIO/

# Verificar integridade dos dados
sqlite3 /opt/hostinger-alfa/$PROJETO/prisma/production.db \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

---

## Level 3 — Nuclear Rollback

**Pre-condicao:** Tudo falhou. Restaurar TUDO do backup: DB, .env, uploads.

```bash
# Variaveis (substituir)
PROJETO="{projeto}"
VERSION="{versao}"
DOMINIO="{dominio}"
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/${PROJETO}-pre-deploy-* | head -1)

# Parar app
pm2 stop $PROJETO

# Restaurar diretorio completo
rm -rf /opt/hostinger-alfa/$PROJETO
mv /opt/hostinger-alfa/${PROJETO}_pre_v${VERSION} /opt/hostinger-alfa/$PROJETO

# Restaurar DB
cp $BACKUP_DIR/production.db /opt/hostinger-alfa/$PROJETO/prisma/production.db

# Restaurar .env.production
if [ -f $BACKUP_DIR/env.production.bak ]; then
  cp $BACKUP_DIR/env.production.bak /opt/hostinger-alfa/$PROJETO/.env.production
fi

# Restaurar uploads
if [ -f $BACKUP_DIR/uploads_backup.tar.gz ]; then
  cd /opt/hostinger-alfa/$PROJETO
  tar -xzf $BACKUP_DIR/uploads_backup.tar.gz
fi

# Reiniciar
pm2 flush $PROJETO
cd /opt/hostinger-alfa/$PROJETO && pm2 start ecosystem.config.js
pm2 save

# Verificar
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://$DOMINIO/
pm2 status

# Verificar contagem de registros (comparar com baseline)
if [ -f $BACKUP_DIR/contagem_registros.txt ]; then
  echo "=== BASELINE ==="
  cat $BACKUP_DIR/contagem_registros.txt
  echo "=== ATUAL ==="
  for table in $(sqlite3 /opt/hostinger-alfa/$PROJETO/prisma/production.db \
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"); do
    count=$(sqlite3 /opt/hostinger-alfa/$PROJETO/prisma/production.db \
      "SELECT count(*) FROM \"$table\";")
    echo "$table: $count"
  done
fi
```

---

## Pos-Rollback (OBRIGATORIO)

Apos QUALQUER nivel de rollback:

1. **Cross-project check**: verificar TODOS os projetos no servidor
   ```bash
   # Para cada projeto no server-registry:
   curl -s -o /dev/null -w "%{http_code}" https://{dominio_projeto}/
   ```

2. **Documentar**: registrar o rollback em `_a4tunados/deploys/hostinger-alfa/operacoes/`

3. **Analisar causa raiz**: por que o rollback foi necessario?

4. **Adicionar licao**: atualizar `references/licoes-aprendidas.md` com a causa e prevencao

---

## Rollback para Self-Deploy (v2.0.0)

> Quando o deploy foi feito via rsync (SELF_DEPLOY mode), o rollback e mais simples
> porque o backup contem copia do codigo e o DB foi backupado com sqlite3 .backup.

### Level 1 — Quick Rollback (Self-Deploy)

**Pre-condicao**: rsync executou mas app nao inicia ou HTTP erro.

```bash
PROJETO="{projeto}"
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/${PROJETO}-pre-deploy-* | head -1)
PROD_DIR="{prod_path}"

# Restaurar codigo do backup
rsync -a "$BACKUP_DIR/code/" "$PROD_DIR/"
pm2 restart $PROJETO
pm2 save
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:{porta}/
```

### Level 2 — DB + Code Rollback (Self-Deploy)

```bash
PROJETO="{projeto}"
BACKUP_DIR=$(ls -td /opt/hostinger-alfa/backups/${PROJETO}-pre-deploy-* | head -1)
PROD_DIR="{prod_path}"

pm2 stop $PROJETO
rsync -a "$BACKUP_DIR/code/" "$PROD_DIR/"
cp "$BACKUP_DIR/{db_name}" "$PROD_DIR/{db_path}"
pm2 restart $PROJETO
pm2 save
```

**NOTA**: NAO ha Level 3 (Nuclear) para self-deploy — rsync + sqlite3 .backup ja cobrem
tudo que o Level 3 remoto faz (codigo, DB, config). Para situacao extrema:
restaurar backup completo e reiniciar PM2.

**Pos-rollback**: re-verificar TODOS os projetos (cross-project check).

---

## Historico de Rollbacks

| Data | Projeto | Nivel | Causa | Resolucao | Licao # |
|------|---------|-------|-------|-----------|---------|
| (preenchido conforme rollbacks ocorrem) |
