# Procedimentos de Rollback — a4tunados mural

> Tres niveis de rollback, do mais simples ao mais completo.
> Usar o nivel minimo necessario para resolver o problema.
> NUNCA deletar backups durante o rollback.

---

## Quando usar cada nivel

| Nivel | Cenario | Tempo | Perda de dados |
|-------|---------|-------|----------------|
| 1 - Quick | Deploy sem migrations, app nao funciona | ~1 min | ZERO |
| 2 - Migration | Migrations aplicadas, precisa reverter schema | ~3 min | ZERO |
| 3 - Nuclear | Corrupcao de dados, migration irreversivel, estado inconsistente | ~5 min | ZERO (restore do backup) |

---

## Pre-requisitos

Antes de qualquer rollback, confirmar que existem:

```bash
# App anterior preservada
ls -la /opt/a4tunados_mural_pre_vX.Y.Z/
# Deve existir

# Backup do banco
ls -la /root/backups/pre-deploy-YYYYMMDD-HHMMSS/
# Deve conter: planka_full.dump, planka_full.sql, contagem_registros.txt
```

**Se nenhum dos dois existir: NAO fazer rollback destrutivo. Diagnosticar e corrigir in-place.**

---

## Nivel 1: Quick Rollback

**Quando usar:** Deploy sem migrations novas. App retorna 502 ou nao funciona apos deploy.

**Causa tipica:** Modulo nativo nao compilado, config/env/ com nesting, client build incompleto.

### Comandos

```bash
# 1. Parar app atual
pm2 stop a4tunados-mural

# 2. Remover versao nova (com problemas)
rm -rf /opt/a4tunados_mural

# 3. Restaurar versao anterior
mv /opt/a4tunados_mural_pre_vX.Y.Z /opt/a4tunados_mural

# 4. Limpar logs residuais
pm2 flush a4tunados-mural

# 5. Iniciar versao anterior
cd /opt/a4tunados_mural && pm2 start ecosystem.config.js

# 6. Salvar config PM2
pm2 save
```

### Verificacao pos-rollback

```bash
# Aguardar ~10 segundos
sleep 10

# Verificar PM2
pm2 status

# Verificar HTTP (fonte de verdade)
curl -s -o /dev/null -w "%{http_code}" https://mural.a4tunados.com.br/
# Deve retornar 200

# Verificar dados
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT 'card' as t, count(*) FROM card UNION ALL SELECT 'board', count(*) FROM board;"
# Deve bater com baseline do backup
```

### Output esperado

```
pm2 status: online
HTTP: 200
Dados: identicos ao baseline
```

---

## Nivel 2: Migration Rollback

**Quando usar:** Migrations novas foram aplicadas e causaram problemas (schema incompativel,
dados corrompidos pela migration, app nao funciona com novo schema).

**Causa tipica:** Migration com bug, coluna com constraint errada, backfill falhou.

### Comandos

```bash
# 1. Parar app
pm2 stop a4tunados-mural

# 2. Reverter migrations (usando app NOVA que tem os arquivos de migration)
cd /opt/a4tunados_mural/server/db
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/planka npx knex migrate:rollback

# 3. Verificar que migration foi revertida
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT name FROM migration ORDER BY id DESC LIMIT 5;"

# 4. Remover versao nova
rm -rf /opt/a4tunados_mural

# 5. Restaurar versao anterior
mv /opt/a4tunados_mural_pre_vX.Y.Z /opt/a4tunados_mural

# 6. Limpar logs
pm2 flush a4tunados-mural

# 7. Iniciar versao anterior
cd /opt/a4tunados_mural && pm2 start ecosystem.config.js

# 8. Salvar config PM2
pm2 save
```

### Se knex migrate:rollback falhar

```bash
# Tentar rollback manual via SQL
# Exemplo para migration que adicionou coluna:
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "ALTER TABLE board DROP COLUMN IF EXISTS is_frozen;"

# Remover registro da migration
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "DELETE FROM migration WHERE name = '20260321100000_add_is_frozen_to_board.js';"

# Continuar com passos 4-8 acima
```

### Verificacao pos-rollback

```bash
sleep 10

pm2 status
curl -s -o /dev/null -w "%{http_code}" https://mural.a4tunados.com.br/
# 200

sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT count(*) FROM migration;"
# Deve bater com count PRE-deploy

sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT 'card' as t, count(*) FROM card UNION ALL SELECT 'board', count(*) FROM board;"
# Deve bater com baseline
```

---

## Nivel 3: Nuclear Rollback (Restore completo do DB)

**Quando usar:** Estado do banco inconsistente, migration destrutiva irreversivel,
dados corrompidos, ou quando niveis 1 e 2 falharam.

**ATENCAO:** Este procedimento SUBSTITUI todo o banco de dados pelo backup.
Qualquer dado criado APOS o backup sera PERDIDO (geralmente minimo — apenas
dados criados durante a janela de deploy).

### Comandos

```bash
# 1. Parar app
pm2 stop a4tunados-mural

# 2. Encontrar backup mais recente
ls -la /root/backups/ | sort
# Usar o pre-deploy mais recente

BACKUP="/root/backups/pre-deploy-YYYYMMDD-HHMMSS"

# 3. Verificar integridade do backup ANTES de dropar o banco
pg_restore -l $BACKUP/planka_full.dump | head -5
# Deve listar tabelas sem erros

# 4. Dropar e recriar banco
sudo -u postgres dropdb -h 127.0.0.1 planka
sudo -u postgres createdb -h 127.0.0.1 planka

# 5. Restaurar do dump
sudo -u postgres pg_restore -h 127.0.0.1 -d planka \
  --no-owner --no-privileges \
  $BACKUP/planka_full.dump

# 6. Verificar restauracao
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT 'user_account' as t, count(*) FROM user_account
   UNION ALL SELECT 'project', count(*) FROM project
   UNION ALL SELECT 'board', count(*) FROM board
   UNION ALL SELECT 'card', count(*) FROM card;"
# Deve bater com contagem_registros.txt do backup

# 7. Remover versao nova
rm -rf /opt/a4tunados_mural

# 8. Restaurar versao anterior
mv /opt/a4tunados_mural_pre_vX.Y.Z /opt/a4tunados_mural

# 9. Limpar logs
pm2 flush a4tunados-mural

# 10. Iniciar versao anterior
cd /opt/a4tunados_mural && pm2 start ecosystem.config.js

# 11. Salvar config PM2
pm2 save
```

### Se pg_restore falhar (dump corrompido)

Usar o backup em plain SQL como fallback:

```bash
# Dropar e recriar banco (se nao fez ainda)
sudo -u postgres dropdb -h 127.0.0.1 planka
sudo -u postgres createdb -h 127.0.0.1 planka

# Restaurar via SQL plain
sudo -u postgres psql -h 127.0.0.1 -d planka < $BACKUP/planka_full.sql

# Continuar com passos 6-11
```

### Verificacao pos-rollback nuclear

```bash
sleep 10

# App
pm2 status
curl -s -o /dev/null -w "%{http_code}" https://mural.a4tunados.com.br/
# 200

# Dados completos
sudo -u postgres psql -h 127.0.0.1 -d planka -c "
SELECT 'user_account' as t, count(*) FROM user_account
UNION ALL SELECT 'project', count(*) FROM project
UNION ALL SELECT 'board', count(*) FROM board
UNION ALL SELECT 'card', count(*) FROM card
UNION ALL SELECT 'list', count(*) FROM list
UNION ALL SELECT 'action', count(*) FROM action
UNION ALL SELECT 'comment', count(*) FROM comment
UNION ALL SELECT 'task', count(*) FROM task
UNION ALL SELECT 'attachment', count(*) FROM attachment
UNION ALL SELECT 'notification', count(*) FROM notification
ORDER BY t;"

# Comparar com $BACKUP/contagem_registros.txt
cat $BACKUP/contagem_registros.txt
# TODOS os valores devem ser identicos

# Migrations
sudo -u postgres psql -h 127.0.0.1 -d planka -c \
  "SELECT count(*) FROM migration;"
# Deve bater com PRE-deploy

# Avatares
sudo -u postgres psql -h 127.0.0.1 -d planka -t -c \
  "SELECT avatar->>'dirname' FROM user_account WHERE avatar IS NOT NULL;" | \
while read -r dirname; do
  dirname=$(echo "$dirname" | xargs)
  if [ -n "$dirname" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      "https://mural.a4tunados.com.br/user-avatars/$dirname/original.jpg")
    echo "Avatar $dirname: HTTP $code"
  fi
done
# Todos 200
```

---

## Fluxo de Decisao

```
Deploy falhou?
  |
  ├── App retorna 502/500?
  |     ├── Migrations novas foram aplicadas?
  |     |     ├── SIM → Nivel 2 (Migration Rollback)
  |     |     └── NAO → Nivel 1 (Quick Rollback)
  |     └── Nivel 1 resolveu?
  |           ├── SIM → Fim
  |           └── NAO → Nivel 2 ou 3
  |
  ├── Dados incorretos/corrompidos?
  |     └── Nivel 3 (Nuclear Rollback)
  |
  ├── App funciona mas feature bugada?
  |     ├── Feature critica?
  |     |     ├── SIM → Nivel 1 ou 2
  |     |     └── NAO → Hotfix (nao rollback)
  |     └── Avaliar com usuario
  |
  └── Tudo OK → Nao precisa de rollback
```

---

## Regras de Rollback

1. **NUNCA deletar o backup** durante rollback — e sua unica rede de seguranca
2. **SEMPRE verificar** que a versao anterior existe antes de dropar a nova
3. **SEMPRE verificar** integridade do dump ANTES de dropar o banco (Nivel 3)
4. **SEMPRE fazer verificacao completa** apos rollback (HTTP + dados + avatares)
5. **NUNCA assumir** que rollback deu certo sem verificar HTTP 200
6. **Comunicar ao usuario** o que aconteceu, o que foi feito, e o estado atual
7. **Documentar o incidente** no deploy report para futuras referencias
