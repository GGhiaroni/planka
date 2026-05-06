# Sidecar Deploy — Orquestra Voadora Oficina 2026

> **Versao:** 1.1.0 | **Criado:** 2026-04-03 | **Ultima atualizacao:** 2026-04-06
> **Projeto:** orquestravoadoraoficina2026
> **Repositorio:** operacoes4tuna/orquestravoadoraoficina2026

---

## Dados do Projeto

| Campo | Valor |
|-------|-------|
| **Stack** | Flask + Gunicorn + systemd + Nginx + SQLite |
| **Dominio (prod)** | `oficinaorquestravoadora2026.55jam.com.br` |
| **Dominio (dev redirect)** | `dev.oficinaorquestravoadora2026.55jam.com.br` → 301 prod |
| **Porta interna** | 3040 |
| **Process manager** | systemd (`orquestravoadora.service`) |
| **Python** | 3.13.7 |
| **Nginx** | 1.28.0 (SSL Let's Encrypt, expira 2026-07-01) |
| **Deploy mode** | SELF_DEPLOY (rsync local) desde Op 17 / REMOTE (tarball + SCP) de dev local |
| **Workspace dev** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/orquestravoadoraoficina2026` |
| **Porta dev** | 3041 |
| **Env catalog** | `.claude/skills/tuninho-devops-env/projects/orquestravoadora/env-catalog.json` |
| **Prod path** | `/opt/hostinger-alfa/orquestravoadora/` |
| **DB path** | `orquestravoadora.db` (relativo a prod_path) |
| **Health endpoint** | `https://oficinaorquestravoadora2026.55jam.com.br/` |
| **Graceful restart** | `systemctl reload orquestravoadora` (HUP signal, zero-downtime) |

---

## SSH

| Campo | Valor |
|-------|-------|
| **Host** | 31.97.243.191 |
| **User** | root |
| **Auth primaria** | `sshpass -p PASSWORD -o PreferredAuthentications=password` |
| **Auth alternativa** | SSH key `_a4tunados/env/hostinger/id_ed25519` |
| **Credenciais** | `_a4tunados/env/hostinger/.env.hostinger` |

---

## Env Vars Producao

Arquivo `.env` no servidor (`/opt/hostinger-alfa/orquestravoadora/.env`):

```
# Flask
FLASK_ENV=production
PORT=3040
SECRET_KEY=<persistido em .secret_key>

# Asaas PRODUCAO
ASAAS_API_KEY=<chave prod — copiar de .env local>
ASAAS_BASE_URL=https://api.asaas.com/v3

# Firebase
FIREBASE_API_KEY=AIzaSyDedMODuMLT2etpaxCeVgkDqPe_1Qolark
FIREBASE_AUTH_DOMAIN=jamov-95fda.firebaseapp.com
FIREBASE_PROJECT_ID=jamov-95fda
FIREBASE_STORAGE_BUCKET=jamov-95fda.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=810502259234
FIREBASE_APP_ID=1:810502259234:web:b3ecc6c57151509fa0c07b
FIREBASE_MEASUREMENT_ID=G-7Z7LEMPV82
FIREBASE_SERVICE_ACCOUNT_PATH=_a4tunados/env/firebase/jamov-95fda-firebase-adminsdk-fbsvc-847b607247.json

# Google Sheets
SPREADSHEET_ID=1o1jNB6R7GbtSc6QJw704qqWgbj-2nqag7VPdMS-SQsQ
```

---

## Procedimentos de Deploy — Banco de Dados (SQLite)

> **REGRA FUNDAMENTAL**: O banco de PRODUCAO e a fonte de verdade para dados.
> O banco LOCAL e a fonte de verdade para SCHEMA (estrutura).
> NUNCA copiar o banco local para producao. NUNCA sobrescrever dados de producao.

### Estrategia Padrao: Deploy de CODIGO, nao de BANCO

1. **Backup OBRIGATORIO do banco de producao** ANTES de qualquer deploy:
   ```bash
   ssh root@31.97.243.191 "cp /opt/hostinger-alfa/orquestravoadora/orquestravoadora.db \
     /opt/hostinger-alfa/backups/orquestravoadora_$(date +%Y%m%d_%H%M%S).db"
   ```

2. **Deployar CODIGO** (app.py, database.py, templates, static, etc.)
   - O codigo contem migrations automaticas (ALTER TABLE ADD COLUMN com try/except)
   - Ao reiniciar o servico, o `database.py` roda `init_db()` que adiciona colunas novas
   - Colunas novas sao NULLABLE — nao quebram dados existentes

3. **NAO deployar**:
   - `orquestravoadora.db` (NUNCA — dados de producao sao sagrados)
   - `.env` (atualizar manualmente ou via script, nao sobrescrever)
   - `_a4tunados/env/` (copiar apenas arquivos novos necessarios)

### Migracao de Schema

O `database.py` contem ALTER TABLE com exception handling:
```python
try:
    cursor.execute("ALTER TABLE users ADD COLUMN firebase_uid TEXT")
except sqlite3.OperationalError:
    pass  # coluna ja existe
```

**Colunas adicionadas desde Op 10 (ultimo deploy):**
- `users.firebase_uid` (TEXT, nullable) — Op 11
- `inscricoes.presenca_confirmada_em` (DATETIME, nullable) — Op 12

### Migracao de Dados de Configuracao

Para tabelas de **configuracao** (nao dados de usuario), usar scripts dedicados:

#### asaas_config
- Tabela existe em producao (criada na Op 10) mas com dados **sandbox**
- Precisa ser **atualizada** (nao recriada) com dados de producao
- Abordagem: script Python que conecta no DB de producao via SSH tunnel
  ou via execucao remota, e faz UPDATE dos campos necessarios
- Campos criticos a atualizar:
  - `subconta_wallet_id` → fc720327-9591-42da-9f94-3cb1e8eb9e81
  - `subconta_api_key` → chave prod da subconta OV
  - `asaas_webhook_token` → token do webhook HTTPS
  - Dados bancarios da OV (Banco do Brasil, ag 0287, cc 122522-7)

#### cursos (tabela de cursos/produtos)
- Cursos novos criados localmente precisam ser inseridos em producao
- Validar: curso ja existe em producao? Se sim, nao duplicar
- Abordagem: script de reconciliacao que compara local vs prod por nome/id

### Migracao de Usuarios (Firebase Auth)

Quando Firebase Auth e deployado pela primeira vez:
1. Deploy o codigo com suporte a Firebase Auth
2. Instalar dependencia: `pip install firebase-admin>=6.5.0`
3. Copiar service account JSON para o servidor
4. Configurar env vars Firebase no .env
5. Rodar `migrate_users_firebase.py` CONTRA o banco de PRODUCAO
   - Script e idempotente (verifica firebase_uid antes de criar)
   - Cria usuarios no Firebase Auth com email + senha do banco
   - Salva firebase_uid no banco
   - Define custom claims (admin) para usuarios admin

### Reconciliacao de Dados (Triple Check)

Antes de qualquer deploy, comparar:

| Fonte | O que verificar |
|-------|----------------|
| **Banco producao** | COUNT de users, inscricoes, avaliacoes, pagamentos |
| **Banco local** | Mesmo — identificar discrepancias |
| **Google Sheets** | Inscricoes e avaliacoes (fonte original) |

Se producao tem dados que local nao tem → producao e verdade.
Se local tem dados que producao nao tem → provavelmente teste (validar com operador).

### Arquivos a Copiar para Producao (alem do codigo)

| Arquivo | Destino no servidor | Quando |
|---------|-------------------|--------|
| `credentials.json` | `<prod_path>/credentials.json` | Se atualizado |
| Firebase service account JSON | `<prod_path>/_a4tunados/env/firebase/` | Primeiro deploy Firebase |
| `.env` (parcial) | `<prod_path>/.env` | Merge manual de novas vars |

---

## Cross-Project Health Check

Projetos no mesmo servidor (hostinger-alfa):

| Projeto | Porta | Stack | Process Manager |
|---------|-------|-------|----------------|
| tuninho-ide-web | 3847 | Express + WS + SQLite | PM2 |
| maestrofieldmanager | 3001 | Next.js + Prisma | PM2 |
| chooz_2026 | 3849 | Next.js | PM2 |
| **orquestravoadora** | **3040** | **Flask + Gunicorn** | **systemd** |

Verificar que nenhum projeto vizinho e afetado apos deploy.

---

## Self-Deploy (Tuninho IDE → Produção)

Desde Op 17, o desenvolvimento acontece no Tuninho IDE web no mesmo servidor.

| Campo | Valor |
|-------|-------|
| **Workspace** | `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/orquestravoadoraoficina2026` |
| **Prod** | `/opt/hostinger-alfa/orquestravoadora/` |
| **Deploy mode** | SELF_DEPLOY (rsync incremental + systemctl reload) |
| **Dev port** | 3041 |
| **Prod port** | 3040 |

### rsync_excludes
```
venv/
__pycache__/
*.pyc
.env*
.secret_key
orquestravoadora.db
_a4tunados/
.claude/
.mcp.json
.git/
.playwright-mcp/
credentials.json
*.json  # Firebase SA, Google credentials
logs/
```

### Procedimento Self-Deploy
1. Verificar dev server esta parado (porta 3041 livre)
2. Backup DB produção: `cp /opt/hostinger-alfa/orquestravoadora/orquestravoadora.db /opt/hostinger-alfa/backups/orquestravoadora_$(date +%Y%m%d_%H%M%S).db`
3. rsync workspace → prod (excluindo itens acima)
4. Health check pré-reload: `curl -s http://127.0.0.1:3040/`
5. `systemctl reload orquestravoadora` (graceful, zero-downtime)
6. Health check pós-reload
7. Cross-project check (tuninho-ide 3847, maestro 3001, chooz 3849)

### Nota: load_dotenv(override=True)
O app.py usa `load_dotenv(override=True)` para que o .env do projeto prevaleça sobre variáveis herdadas do sistema (IDE herda PORT=3847). Isso é seguro tanto em dev (.env com PORT=3041) quanto em prod (.env.production com PORT=3040 via systemd EnvironmentFile).

---

## Historico de Deploys

| Data | Op | O que foi deployado | Observacoes |
|------|----|---------------------|-------------|
| 2026-04-02 | 10 | Deploy inicial (prod) | Gunicorn + systemd + Nginx + SSL + limpeza DB + reimportacao |
| 2026-04-03 | 13 | (pendente) | Firebase Auth + Analytics + CS + Asaas PROD + Aula Experimental |

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.1.0 | 2026-04-06 | Self-deploy via Tuninho IDE. Porta dev 3041. Env catalog. rsync excludes. load_dotenv override. |
| 1.0.0 | 2026-04-03 | Versao inicial. Procedimentos de deploy DB, env vars, migracao Firebase/Asaas, reconciliacao de dados, cross-project checks. |
