# Backup Procedures — Tuninho Fix Suporte

---

## SQLite (WAL mode)

**NUNCA usar `cp` em banco SQLite em producao** — pode copiar estado inconsistente
se ha transacoes em andamento (WAL mode).

```bash
# Backup WAL-safe (UNICA forma segura)
sqlite3 {db_path} ".backup '{backup_path}'"

# Verificar integridade do backup
sqlite3 {backup_path} "PRAGMA integrity_check;"

# Contagem de registros (baseline)
for table in $(sqlite3 {db_path} "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"); do
  count=$(sqlite3 {db_path} "SELECT count(*) FROM \"$table\";")
  echo "$table: $count"
done
```

## Diretorio completo

```bash
BACKUP_DIR="/opt/hostinger-alfa/backups/{projeto}-pre-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# DB
sqlite3 {db_path} ".backup '$BACKUP_DIR/{db_name}'"

# Codigo (apenas arquivos que vao mudar)
for f in app.py templates/painel.html static/style.css; do
  mkdir -p "$BACKUP_DIR/code/$(dirname $f)"
  cp "{prod_path}/$f" "$BACKUP_DIR/code/$f"
done

# Secrets
cp {prod_path}/.env "$BACKUP_DIR/env.bak" 2>/dev/null
```

## Convencao de nomes

```
/opt/hostinger-alfa/backups/
├── {projeto}-pre-op{NN}-{YYYYMMDD-HHMMSS}/    # Antes de operacao DDCE
├── {projeto}-pre-fix-{YYYYMMDD-HHMMSS}/        # Antes de fix emergencial
├── {projeto}-pre-deploy-{YYYYMMDD-HHMMSS}/      # Antes de deploy
├── {projeto}-pre-limpeza-{YYYYMMDD-HHMMSS}.db   # Antes de limpeza de dados
└── {projeto}-pre-cpf-fix-{YYYYMMDD-HHMMSS}.db   # Antes de fix especifico
```

## Retencao

**NUNCA deletar backups sem autorizacao do operador.**
Backups sao evidencia forense e rollback de emergencia.
