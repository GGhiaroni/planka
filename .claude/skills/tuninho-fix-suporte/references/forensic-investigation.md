# Investigacao Forense — Tuninho Fix Suporte

> Metodologia de investigacao exaustiva para incidentes de producao.
> Principio: NUNCA aceitar hipotese sem PROVAR. Sempre perguntar "o que MAIS?".

---

## Mentalidade Forense

O perito forense nao busca confirmar o que acha que aconteceu. Ele busca **descobrir
o que aconteceu**, mesmo que contrarie a hipotese inicial. Toda investigacao DEVE:

1. Formular pelo menos **2 hipoteses** para a causa raiz
2. Buscar **evidencias que refutem** cada hipotese (nao so as que confirmem)
3. Mapear **todos os afetados** (nao so os que reclamaram)
4. Reconstruir a **timeline completa** (nao so o momento do erro)
5. Analisar o **raio de explosao** (o que mais pode ter sido afetado)
6. Cruzar **multiplas fontes** (logs + DB + analytics + relatos)

---

## 5 Trilhas Paralelas de Investigacao

### Trilha 2a: Mapeamento de Sintomas

**Objetivo:** Catalogar TODOS os sinais do problema, nao so o reportado.

**Procedimento:**
1. Coletar TODOS os relatos (email, mensagem, verbal)
2. Escanear logs de erro (Gunicorn error.log):
   ```bash
   grep "ERROR\|Exception\|Traceback" {error_log} | grep "$(date +%Y-%m-%d)" | tail -50
   ```
3. Escanear access log por status anormais:
   ```bash
   # Todos os 4xx e 5xx de hoje
   awk '$9 >= 400' {access_log} | grep "$(date +%d/%b/%Y)" | awk '{print $9}' | sort | uniq -c | sort -rn
   ```
4. Aplicar tecnica de Byte Count (#1 do playbook) para identificar mensagens de erro
5. Categorizar por: endpoint afetado, timestamp, tamanho da resposta, user-agent

**Output:** Tabela de sintomas com: sintoma, frequencia, primeiro/ultimo ocorrencia, endpoints.

### Trilha 2b: Avaliacao de Impacto

**Objetivo:** Responder QUEM, QUANTOS, DESDE QUANDO.

**Procedimento:**
1. Contar dispositivos unicos afetados (por user-agent):
   ```bash
   grep " 500 " {access_log} | grep "{endpoint}" | awk -F'"' '{print $6}' | sort -u | wc -l
   ```
2. Identificar usuarios por nome quando possivel:
   - Cruzar user-agent + timestamp com POST /login (sessoes recentes)
   - Cruzar com POST /recuperar-acesso (tamanho da resposta pode ser unico por email)
   - Verificar Firebase Analytics (se firebaseSetUserId ativo)
   - Cruzar com /painel 200 pre-incidente (tamanho da pagina varia por usuario)
3. Classificar a populacao afetada vs nao afetada:
   ```sql
   -- Quantos usuarios tem cada perfil?
   SELECT 'com_matricula' as perfil, count(DISTINCT u.id) FROM users u
     JOIN inscricoes i ON i.user_id=u.id
     JOIN matriculas m ON m.inscricao_id=i.id WHERE m.status != 'cancelada'
   UNION ALL
   SELECT 'sem_matricula', count(DISTINCT u.id) FROM users u
     JOIN inscricoes i ON i.user_id=u.id
     LEFT JOIN matriculas m ON m.inscricao_id=i.id WHERE m.id IS NULL;
   ```
4. Determinar se o bug e **deterministico** (100% crash para perfil X) ou **intermitente**

**Output:** Tabela: total afetados, identificados por nome, nao identificados, perfil afetado vs nao afetado.

### Trilha 2c: Reconstrucao de Timeline

**Objetivo:** Mapa temporal completo do incidente, 30 em 30 minutos.

**Procedimento:**
```python
# Script padrao de reconstrucao de timeline
import re
from datetime import datetime, timedelta

entries = []
with open('{access_log}') as f:
    for line in f:
        m = re.match(r'.*\[(\d+/\w+/\d+:\d+:\d+:\d+).*"(\w+) ([^ ]+).*" (\d+)', line)
        if m:
            ts = datetime.strptime(m.group(1), '%d/%b/%Y:%H:%M:%S')
            entries.append({'ts': ts, 'method': m.group(2), 'path': m.group(3), 'status': int(m.group(4))})

# Buckets de 30 min
start = datetime(YYYY, MM, DD, 0, 0)  # UTC
slot = start
while slot < datetime.now():
    slot_end = slot + timedelta(minutes=30)
    brt = slot - timedelta(hours=3)
    ok = sum(1 for e in entries if slot <= e['ts'] < slot_end and e['path'] == '{endpoint}' and e['status'] == 200)
    err = sum(1 for e in entries if slot <= e['ts'] < slot_end and e['path'] == '{endpoint}' and e['status'] >= 500)
    if ok or err:
        print(f"{brt.strftime('%H:%M BRT')} | OK: {ok} | ERRO: {err}")
    slot = slot_end
```

**Output:** Tabela de 30 em 30 min com contagem de OKs vs erros, marcando deploy/revert.

### Trilha 2d: Candidatos a Causa Raiz

**Objetivo:** Pelo menos 2 hipoteses, cada uma com evidencias pro e contra.

**Procedimento:**
1. Hipotese 1: a mais obvia (o que parece ser)
   - Evidencias que suportam: {lista}
   - Evidencias que contradizem: {lista}
   - Confianca: {0-100%}
2. Hipotese 2: alternativa (o que mais poderia ser)
   - Evidencias que suportam: {lista}
   - Evidencias que contradizem: {lista}
   - Confianca: {0-100%}
3. Para cada hipotese: como PROVAR que e a causa real?
4. Para cada hipotese: como REFUTAR?

**Regra:** Se confianca < 80% na hipotese principal, PARAR e investigar mais antes do parecer.

### Trilha 2e: Analise de Raio de Explosao

**Objetivo:** Descobrir o que MAIS pode estar afetado alem do reportado.

**Procedimento:**
1. Identificar a funcao/modulo onde o bug esta
2. Buscar TODOS os outros chamadores dessa funcao:
   ```bash
   grep -rn "{funcao}" {project_files} --include="*.py" --include="*.html" --include="*.js"
   ```
3. Para cada chamador: o mesmo bug pode ocorrer? Testar.
4. Verificar logs de OUTROS endpoints que usam a mesma logica
5. Verificar se houve deploys recentes que tocaram areas vizinhas:
   ```bash
   git log --oneline --since="3 days ago" -- {files_related}
   ```
6. Perguntar: "Se eu fosse o bug, onde mais eu poderia estar escondido?"

**Output:** Lista de areas verificadas com status (afetada/nao afetada/inconclusivo).

---

## Protocolo de Coleta de Evidencias

**Minimo 3 fontes independentes** para confirmar causa raiz:

| Tipo de evidencia | Exemplo |
|-------------------|---------|
| Log de servidor | Traceback no error.log com linha exata |
| Reproducao | Bug replicado com Flask test_client ou Playwright |
| Timeline | Correlacao temporal: primeiro erro coincide com deploy |
| Codigo | Leitura do codigo confirma o path do erro |
| Dados | Query no DB mostra estado inconsistente |
| Comparacao | Backup vs producao mostra o que mudou |
| Externo | Web research confirma que e um problema conhecido |

**Regra:** Se so tem 1 fonte, e INDICIO. Se tem 2, e FORTE INDICIO. Se tem 3+, e EVIDENCIA.
O parecer (Stage 5) so deve ser apresentado com EVIDENCIA (3+ fontes).

---

## Protocolo de Contra-Hipotese

Antes de concluir o diagnostico, testar a NEGACAO:

1. "E se NAO for esse o problema?" — o que os dados mostrariam se fosse outra causa?
2. "E se o bug existisse ANTES?" — verificar se o comportamento ja existia antes do deploy/mudanca
3. "E se for mais de uma causa?" — bugs compostos sao mais comuns do que parece
4. Reproducao isolada: recriar as condicoes EXATAS em dev e confirmar

**Exemplo real (Op 19):** Hipotese: `mat.get()` crasheia em sqlite3.Row.
Contra-teste: reproduzir em Python isolado → confirmou que `hasattr(sqlite3.Row, 'get')` = False.
Contra-hipotese refutada com sucesso → diagnostico confirmado.
