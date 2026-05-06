# Investigation Playbook — Tuninho Fix Suporte

> Tecnicas de investigacao reutilizaveis, descobertas em operacoes reais.

---

## Tecnica #1: Response Byte Count

**Descoberta em:** Op 18, orquestravoadoraoficina2026 (2026-04-07)

**Quando usar:** Quando o access log mostra erros HTTP 500 mas o error log nao
tem detalhes suficientes.

**Como funciona:** O tamanho da response body (`$body_bytes_sent` no nginx,
coluna 10 no combined format) identifica EXATAMENTE a mensagem de erro retornada
ao cliente. Cada mensagem JSON tem um tamanho unico.

**Procedimento:**
```bash
# 1. Identificar o tamanho da response nos 500s
awk '$9 == 500 {print $10}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 2. Para cada tamanho, calcular qual mensagem JSON corresponde
python3 -c "
import json
# Testar mensagens conhecidas
msgs = ['database is locked', 'cpfCnpj invalid or already exists for another customer', ...]
for m in msgs:
    print(f'{len(json.dumps({\"error\": m}))} bytes: {m}')
"

# 3. Cruzar com o access log para confirmar
awk '$10 == 67 {print}' /var/log/nginx/access.log | tail -20
```

**Exemplo real:** 67 bytes = `{"error": "cpfCnpj invalid or already exists for another customer"}`

---

## Tecnica #2: Backup DB Comparison

**Descoberta em:** Op 18 (2026-04-07)

**Quando usar:** Quando dados mudaram e voce precisa entender o que era antes.

**Procedimento:**
```bash
# 1. Listar backups disponiveis
ls -lt /opt/hostinger-alfa/backups/{projeto}* | head -10

# 2. Comparar campo especifico
sqlite3 {backup_db} "SELECT id, cpf FROM inscricoes WHERE id = 274;"
sqlite3 {prod_db} "SELECT id, cpf FROM inscricoes WHERE id = 274;"

# 3. Comparar contagem de registros
for db in {backup} {prod}; do
  echo "=== $db ==="
  for t in users inscricoes matriculas pagamentos; do
    echo "  $t: $(sqlite3 $db "SELECT count(*) FROM $t;")"
  done
done
```

---

## Tecnica #3: BRT Timezone Conversion

**Quando usar:** Sempre que comunicar com operador ou correlacionar logs com
relatos de usuarios. Servidor em UTC, usuarios em BRT (UTC-3).

**Referencia rapida:**
```
UTC 00:00 = BRT 21:00 (dia anterior)
UTC 03:00 = BRT 00:00
UTC 12:00 = BRT 09:00
UTC 18:00 = BRT 15:00
UTC 23:00 = BRT 20:00
```

**Comando:**
```bash
TZ='America/Sao_Paulo' date -d "2026-04-07 00:24 UTC" "+%H:%M BRT"
```

---

## Tecnica #4: API Direct Test

**Quando usar:** Quando pagamento ou integracao externa falha e voce precisa
isolar se o problema e nosso ou da API.

**Asaas:**
```bash
# Buscar customer por CPF
curl -s -H "access_token: $ASAAS_API_KEY" "https://api.asaas.com/v3/customers?cpfCnpj={cpf}"

# Criar customer de teste (lembrar de deletar depois)
curl -s -X POST -H "access_token: $ASAAS_API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"Teste","cpfCnpj":"{cpf}","email":"{email}"}' \
  "https://api.asaas.com/v3/customers"

# Deletar customer de teste
curl -s -X DELETE -H "access_token: $ASAAS_API_KEY" "https://api.asaas.com/v3/customers/{id}"
```

**Firebase:** Verificar via Admin SDK ou console.
**Twilio:** Verificar via API status.

---

## Tecnica #5: Playwright Visual Verification

**Quando usar:** Apos todo deploy que afeta UI.

**Procedimento:**
```javascript
// Viewport mobile (375x812)
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('{url}');
await page.screenshot({ path: 'evidencias/{nome}.png', fullPage: true });

// Verificar scroll horizontal (indica problema de responsividade)
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
const cw = await page.evaluate(() => document.documentElement.clientWidth);
// se sw > cw → tem scroll horizontal → problema
```

**SEMPRE:** Interpretar screenshots via Read tool apos captura — confirmar
texto visivel, layout adequado, botoes acessiveis.

---

## Tecnica #6: Simulacao de Code Path + Flask Test Client

**Quando usar:** Quando precisa entender EXATAMENTE o que o codigo faz com dados
especificos sem executar a rota no browser.

**Procedimento:**
```python
import sys
sys.path.insert(0, '/opt/hostinger-alfa/{projeto}')
from dotenv import load_dotenv
load_dotenv('/opt/hostinger-alfa/{projeto}/.env', override=True)

import sqlite3
conn = sqlite3.connect('{db_path}')
conn.row_factory = sqlite3.Row

# Reproduzir exatamente o que o app faz
insc = conn.execute('SELECT * FROM inscricoes WHERE id = ?', (id,)).fetchone()
cpf_clean = (insc['cpf'] or '').replace('.','').replace('-','').strip()
# ... simular o resto do fluxo
```

**Flask Test Client (reproducao de rotas com sessao):**
```python
import os, sys
sys.path.insert(0, '/opt/hostinger-alfa/{projeto}')
os.chdir('/opt/hostinger-alfa/{projeto}')
os.environ['FLASK_ENV'] = 'production'
from app import app

with app.test_client() as client:
    with client.session_transaction() as sess:
        sess['_user_id'] = '{user_id}'  # Simular login como usuario especifico
    response = client.get('/painel')
    print(f'Status: {response.status_code}')
```

Isso reproduz EXATAMENTE o code path que o Gunicorn executa em producao,
incluindo Flask-Login, session, e toda a logica da rota.

---

## Tecnica #7: User Impact Mapping

**Descoberta em:** Op 19 (2026-04-08)

**Quando usar:** Quando um bug afeta usuarios e voce precisa saber QUEM e QUANTOS.

**Procedimento:**
1. Identificar dispositivos unicos afetados (por user-agent):
   ```bash
   grep " 500 " {access_log} | grep "{endpoint}" | awk -F'"' '{print $6}' | sort -u
   ```
2. Cruzar com logins (POST /login 200) por user-agent + proximidade temporal
3. Cruzar com /recuperar-acesso por user-agent (tamanho da resposta pode ser unico por email)
4. Verificar Firebase Analytics (se firebaseSetUserId ativo)
5. Para cada device: contar tentativas, primeiro/ultimo erro, source (referrer)

**Limitacao conhecida:** Se nao ha user_id no log (gap de observabilidade),
a identificacao depende de cruzamentos indiretos (user-agent, timestamps, response sizes).

---

## Tecnica #8: Reconstrucao de Timeline

**Descoberta em:** Op 19 (2026-04-08)

**Quando usar:** SEMPRE em incidentes P0/P1 para entender a dimensao temporal.

**Procedimento:** Script Python que gera tabela de 30 em 30 min:
```python
import re
from datetime import datetime, timedelta

entries = []
with open('{access_log}') as f:
    for line in f:
        m = re.match(r'.*\[(\d+/\w+/\d+:\d+:\d+:\d+).*"(\w+) ([^ ]+).*" (\d+)', line)
        if m:
            ts = datetime.strptime(m.group(1), '%d/%b/%Y:%H:%M:%S')
            entries.append({'ts': ts, 'path': m.group(3), 'status': int(m.group(4))})

slot = datetime(YYYY, MM, DD, 0, 0)  # UTC inicio do dia
while slot < datetime.now():
    slot_end = slot + timedelta(minutes=30)
    brt = slot - timedelta(hours=3)
    ok = sum(1 for e in entries if slot <= e['ts'] < slot_end and e['path'] == '{endpoint}' and e['status'] == 200)
    err = sum(1 for e in entries if slot <= e['ts'] < slot_end and e['path'] == '{endpoint}' and e['status'] >= 500)
    if ok or err:
        print(f"{brt.strftime('%H:%M BRT')} | OK: {ok} | ERRO: {err}")
    slot = slot_end
```

**Output:** Tabela com: horario BRT, contagem OK, contagem ERRO, notas (deploy, revert).

---

## Tecnica #9: Teste de Contra-Hipotese

**Descoberta em:** Op 19 (2026-04-08)

**Quando usar:** ANTES de concluir o diagnostico. Tentar REFUTAR a hipotese principal.

**Procedimento:**
1. Formular a negacao: "E se NAO for isso a causa?"
2. Buscar dados que contradiriam a hipotese:
   - Se hipotese e "deploy causou o bug": verificar se erro existia ANTES do deploy
   - Se hipotese e "bug no codigo": reproduzir em isolamento (Python puro)
   - Se hipotese e "dados corrompidos": comparar com backup
3. Se a negacao nao pode ser provada: hipotese reforcada
4. Se a negacao TEM evidencias: hipotese deve ser revisada

**Exemplo real (Op 19):**
```python
# Hipotese: sqlite3.Row nao tem .get()
# Contra-teste em isolamento:
import sqlite3
conn = sqlite3.connect(':memory:')
conn.row_factory = sqlite3.Row
conn.execute('CREATE TABLE t (id INT, campo TEXT)')
conn.execute('INSERT INTO t VALUES (1, "valor")')
row = conn.execute('SELECT * FROM t').fetchone()
print(hasattr(row, 'get'))  # False → hipotese CONFIRMADA
```

---

## Tecnica #10: Analise de Raio de Explosao

**Descoberta em:** Op 19 (2026-04-08)

**Quando usar:** Apos identificar o bug, verificar se o MESMO padrao existe em outros pontos.

**Procedimento:**
```bash
# 1. Buscar o padrao problematico em todo o codebase
grep -rn ".get(" {project_files} --include="*.py" | grep -v "request\.\|form\.\|json\.\|dict\.\|os\.\|config\."

# 2. Para cada match: e um sqlite3.Row ou um dict?
# Verificar a origem da variavel (funcao que retorna, row_factory)

# 3. Verificar se funcoes afetadas sao chamadas por outros endpoints
grep -rn "{funcao_afetada}" {project_files} --include="*.py" --include="*.html"
```

**Output:** Lista de areas verificadas: afetada / nao afetada / inconclusivo.
