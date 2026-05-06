# Sidecar Suporte — Orquestra Voadora Oficina 2026

> **Versao:** 1.4.0 | **Criado:** 2026-04-07 | **Ultima atualizacao:** 2026-04-10
> **Projeto:** orquestravoadoraoficina2026
> **Repositorio:** operacoes4tuna/orquestravoadoraoficina2026

---

## Metadata do Projeto

| Campo | Valor |
|-------|-------|
| **Stack** | Flask + Gunicorn + systemd + Nginx + SQLite |
| **Dominio prod** | `oficinaorquestravoadora2026.55jam.com.br` |
| **Porta prod** | 3040 |
| **Porta dev** | 3041 |
| **DB engine** | SQLite (WAL mode) |
| **DB path (prod)** | `/opt/hostinger-alfa/orquestravoadora/orquestravoadora.db` |
| **DB path (dev)** | `orquestravoadora.db` (relativo ao workspace) |
| **Process manager** | systemd (`orquestravoadora.service`) |
| **Health endpoint** | `https://oficinaorquestravoadora2026.55jam.com.br/` |
| **Graceful restart** | `systemctl restart orquestravoadora` (HUP nao recarrega Python) |
| **Workers** | Gunicorn com 2 workers sync |
| **Python** | 3.13.7 |

---

## Vault e Documentacao

| Item | Caminho |
|------|---------|
| **Vault Escriba** | `_a4tunados/docs_orquestravoadoraoficina2026/` |
| **MOC Projeto** | `_a4tunados/docs_orquestravoadoraoficina2026/MOC-Projeto.md` |
| **Env Catalog** | `.claude/skills/tuninho-devops-env/projects/orquestravoadora/env-catalog.json` |
| **Deploy Sidecar** | `.claude/skills/tuninho-devops-hostinger-alfa/projects/orquestravoadora/config.md` |
| **Operacoes DDCE** | `_a4tunados/_operacoes/projetos/` (18 operacoes ate Op 18) |
| **Pendencias** | `_a4tunados/pendencias/` |

---

## Integracoes Externas

| Servico | Uso | Credencial | Notas |
|---------|-----|------------|-------|
| **Asaas** | Pagamentos PIX/boleto/cartao, split 99.5% OV / 0.5% Baile55 | `ASAAS_API_KEY` (.env) + `subconta_api_key` (asaas_config DB) | Prod: api.asaas.com/v3. Webhook configurado. Customer criado no momento do pagamento (nao do contrato). |
| **Firebase** | Auth (email+phone+password recovery) + Analytics (17 eventos) | `FIREBASE_SERVICE_ACCOUNT_PATH` (.env) | Project: jamov-95fda. COMPARTILHADO dev/prod. Phone Auth com custo por SMS. |
| **Twilio** | WhatsApp sandbox (templates, allowlist) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (.env) | WHATSAPP_PRODUCTION_MODE=false (safety lock). Numero dedicado. |
| **Google Sheets** | Dual-write inscricoes/avaliacoes | `credentials.json` (raiz) | Spreadsheet ID no .env. CUIDADO: Sheets remove zeros de CPF. |

---

## Padroes de Dados

### CPF
- **Formato correto**: 11 digitos numericos, com zero a esquerda (zfill)
- **Onde vive**: `inscricoes.cpf`, `matriculas.contrato_cpf`
- **Validacao**: Backend zfill(11) + digitos verificadores. Frontend validarCPF() em matricula.js
- **Asaas**: Campo `cpfCnpj` na API. Rejeita CPF < 11 digitos com resposta de 67 bytes
- **Bug conhecido**: Google Sheets remove zeros → import deve usar zfill
- **Sync**: contrato_cpf atualiza inscricoes.cpf automaticamente (fix Op 18)
- **Estrangeiros**: Aceita texto livre ("Nao tenho") — nao valida se nao numerico
- **Trava**: Apos asaas_customer_id preenchido, CPF nao pode ser editado

### RG
- **Formato**: Sem padrao nacional. Cada estado tem formato proprio
- **Validacao**: Apenas min 4 caracteres
- **Nao vai para o Asaas** — apenas visual na carteirinha

### Status de Inscricao
- **Valores**: pendente, habilitado, aula_experimental, desabilitado, matriculado, cancelado
- **Auto-assign no form**: cursou_antes=Sim → habilitado, Nao → aula_experimental, turma_lotada → desabilitado
- **Ciclo admin**: habilitado → aula_experimental → desabilitado → habilitado
- **Matriculado**: setado automaticamente apos pagamento confirmado no Asaas

### Pagamentos
- **Metodos**: PIX, boleto, cartao (todos via Asaas)
- **Fluxo cartao**: Cria subscription → abre invoiceUrl em nova aba → usuario preenche cartao no checkout Asaas → webhook PAYMENT_CONFIRMED atualiza nosso banco
- **Split**: 99.5% subconta OV, 0.5% Baile55 (retido automaticamente)
- **10 parcelas**: Abril a Janeiro, dia 5, primeira parcela D+5

---

## Comandos de Investigacao

### Banco de Dados
```bash
DB="/opt/hostinger-alfa/orquestravoadora/orquestravoadora.db"

# Distribuicao de status
sqlite3 $DB "SELECT status_aprovacao, count(*) FROM inscricoes GROUP BY status_aprovacao ORDER BY count(*) DESC;"

# Buscar usuario por telefone
sqlite3 $DB "SELECT u.id, u.email, u.nome_completo, u.telefone FROM users u WHERE u.telefone LIKE '%{numero}%';"

# Inscricoes de um usuario
sqlite3 $DB "SELECT i.id, i.nome_completo, i.cpf, i.instrumento, i.status_aprovacao FROM inscricoes i JOIN users u ON i.user_id=u.id WHERE u.telefone LIKE '%{numero}%';"

# Matriculas com detalhes
sqlite3 $DB -header -column "SELECT m.id, m.status, m.contrato_nome, m.metodo_pagamento, m.asaas_customer_id, (SELECT count(*) FROM pagamentos WHERE matricula_id=m.id AND status='pago') as pagas FROM matriculas m JOIN cursos c ON m.curso_id=c.id AND c.ativo=1;"

# Pagamentos de uma matricula
sqlite3 $DB -header -column "SELECT * FROM pagamentos WHERE matricula_id={id} ORDER BY data_vencimento;"

# CPFs com menos de 11 digitos
sqlite3 $DB "SELECT id, nome_completo, cpf, length(cpf) FROM inscricoes WHERE cpf GLOB '[0-9]*' AND length(cpf) < 11;"

# Audit log de edicoes
sqlite3 $DB -header -column "SELECT * FROM inscricoes_audit ORDER BY alterado_em DESC LIMIT 20;"
```

### Logs
```bash
# Nginx access log (IP real)
tail -200 /var/log/nginx/access.log | grep "oficinaorquestravoadora"

# Gunicorn error log
tail -100 /opt/hostinger-alfa/orquestravoadora/logs/error.log

# Erros 500 hoje
grep " 500 " /opt/hostinger-alfa/orquestravoadora/logs/access.log | grep "$(date +%d/%b/%Y)"

# Byte count dos erros (tecnica Op 18)
grep " 500 " /opt/hostinger-alfa/orquestravoadora/logs/access.log | awk '{print $10}' | sort | uniq -c | sort -rn

# Acessos por hora (BRT)
for h in $(seq -w 0 23); do
  utc_h=$(printf "%02d" $(( (10#$h + 3) % 24 )))
  count=$(grep "$(date +%d/%b/%Y):${utc_h}:" /var/log/nginx/access.log | grep "oficinaorquestravoadora" | wc -l)
  echo "  ${h}:00 BRT: $count"
done
```

### Servicos
```bash
systemctl status orquestravoadora
systemctl restart orquestravoadora
journalctl -u orquestravoadora --since "1 hour ago" --no-pager | tail -30
```

---

## Issues Conhecidos e Resolucoes

### #1 — CPF Leading Zeros (P1, resolvido)
- **Data**: 2026-04-07
- **Sintoma**: Asaas retorna HTTP 500 (67 bytes) ao criar customer
- **Root cause**: Google Sheets remove zeros de campos numericos. 62 CPFs importados com 10 digitos
- **Fix**: zfill(11) em 6 pontos (backend pagamento, backend contrato sync, import_sheets, JS contrato, JS form, mensagem erro amigavel). 63 CPFs corrigidos no banco
- **Operacao**: Op 18, Sessao 28
- **Prevencao**: Validacao em todas as camadas de entrada

### #2 — contrato_cpf Nao Sync (P0, resolvido)
- **Data**: 2026-04-07
- **Sintoma**: Usuario corrige CPF no contrato mas pagamento falha com CPF antigo
- **Root cause**: matriculas.contrato_cpf e inscricoes.cpf sao campos independentes. Pagamento usa inscricoes.cpf
- **Fix**: Ao assinar contrato, se CPF mudou, UPDATE inscricoes.cpf automaticamente
- **Operacao**: Op 18
- **Prevencao**: Sync automatico implementado

### #3 — Import Status Bug (P1, resolvido)
- **Data**: 2026-04-07 (bug desde Op 07)
- **Sintoma**: 138 novatos importados como desabilitado em vez de aula_experimental
- **Root cause**: import_sheets.py Op 07 tinha `else: desabilitado` catch-all
- **Fix**: Bulk UPDATE 138 registros + fix na logica do import
- **Operacao**: Op 18
- **Prevencao**: Logica explicita por categoria (turma_lotada, veterano, novato)

### #4 — Inscricoes Duplicadas (P2, pendente)
- **Data**: 2026-04-07
- **Sintoma**: 17 emails com inscricoes duplicadas (18 registros extras)
- **Root cause**: Import Sheets executado multiplas vezes sem deduplicacao
- **Status**: Pendente — registrado em `_a4tunados/pendencias/`

### #5 — Database Lock em Deploy (P1, resolvido)
- **Data**: 2026-04-07
- **Sintoma**: 11 erros HTTP 500 durante janela de deploy (3 alunas afetadas)
- **Root cause**: Queries bulk via sqlite3 CLI competem com Gunicorn workers
- **Fix**: Problema temporario — resolveu sozinho apos queries terminarem
- **Prevencao**: Rodar queries bulk em horario de baixo trafego

### #9 — Status aula_experimental → habilitado + auto-promoção per-user (P2, resolvido)
- **Data**: 2026-04-09
- **Sintoma**: (1) Alunos confirmados em aula experimental precisam virar habilitados em massa para se matricular. (2) No admin, ao mudar status de aula_experimental, aluno some do filtro (ciclo vai para desabilitado, não habilitado).
- **Root cause**: (1) Operação manual nunca foi feita em massa. (2) Ciclo `aula_experimental → desabilitado → habilitado` não tem atalho para confirmados.
- **Fix**: (1) Bulk UPDATE direto no prod (71 registros) com backup, presenca_confirmada_em preservada. (2) Toggle inteligente em app.py:946 — aula_exp + confirmado → habilitado direto (1 clique). (3) Botão bulk admin "Promover confirmados → Apto" em /admin/inscricoes/promover-confirmados. (4) Auto-promoção no /painel — escopo individual (apenas o próprio usuário), só fora de quarta antes 21h BRT, idempotente.
- **Usuários afetados (positivamente)**: 71 alunos promovidos.
- **Operação**: Chamado #10
- **Prevenção**: (1) Auto-promoção no login do usuário elimina trabalho manual semanal. (2) Botão admin como safety net. (3) Toggle inteligente reduz cliques.
- **Backup pré-fix**: `/opt/hostinger-alfa/backups/orquestravoadora-pre-bulk-experimental-20260409_205235/`

### #8 — Admin sem inscricao nao loga como admin — Firebase Phone Auth UID separado (P2, resolvido)
- **Data**: 2026-04-09
- **Sintoma**: Admin criado pelo painel admin, sem inscricao, nao consegue acessar /admin. Login redireciona para /painel. current_user.is_admin = False mesmo com SQLite is_admin=1.
- **Root cause**: Firebase Phone Auth cria UID separado do Email Auth. `novo_usuario` seta custom claim `admin:True` no email UID. Login por telefone cria segundo UID (phone) sem claims. `/login` sobrescreve firebase_uid no SQLite com phone UID. `load_user_from_request` (auth.py:122-124) overrida is_admin do SQLite com Firebase claims do phone UID (False).
- **Fix**: (1) auth.py: removido override de is_admin do Firebase claims — SQLite e fonte de verdade. (2) app.py: redirect usa user.is_admin (SQLite) + sincroniza claims ao UID atual se divergente.
- **Usuarios afetados**: 1 confirmado (Joao Bouhid), 1 risco latente (Erika Rocha).
- **Operacao**: Chamado #08
- **Prevencao**: (1) SQLite como fonte de verdade para is_admin. (2) Sync automatico de claims ao UID atual no login. (3) Considerar Firebase account linking.
- **Backup pre-fix**: `/opt/hostinger-alfa/backups/orquestravoadora-pre-fix-admin-20260409_124857/`

### #7 — Botao pagamento invisivel no mobile — parcelas-table sem media query (P2, resolvido)
- **Data**: 2026-04-08
- **Sintoma**: Coluna "Acao" com botoes Pagar/PIX QR/Atualizar cortada no mobile (375px). Usuarios com matricula nao conseguem pagar pelo celular.
- **Root cause**: `.parcelas-table` com `white-space:nowrap` (style.css:958) e ausencia de media query responsivo. O wrapper `.table-responsive { overflow-x:auto }` adicionado na Op 18 (T2.3) apenas habilitou scroll horizontal invisivel.
- **Fix**: (1) `data-label` nos 5 `<td>` da tabela de parcelas (painel.html). (2) Media query `@media (max-width:680px)` com card layout — cada parcela vira card com botoes visíveis abaixo (style.css). 0 linhas Python.
- **Cenarios cobertos**: Cartao (Atualizar), PIX (Pagar+PIX QR+Atualizar), Boleto (Pagar+Atualizar), Pago (badge verde), Vencido.
- **Operacao**: Chamado #07
- **Prevencao**: (1) Media query card layout para tabelas com acoes/botoes. (2) Testar SEMPRE em viewport 375px. (3) `overflow-x:auto` nao e fix de responsividade — e paliativo.
- **Backup pre-fix**: `/opt/hostinger-alfa/backups/orquestravoadora-pre-fix-responsividade-20260408_200130/`

### #6 — /painel 500 para usuarios com matricula — mat.get() em sqlite3.Row (P0, resolvido)
- **Data**: 2026-04-07 (deploy 17:30 BRT) → 2026-04-08 (revert 22:09 BRT)
- **Sintoma**: /painel retorna HTTP 500 (265 bytes) para TODOS os usuarios com matricula ativa. Usuarios sem matricula nao afetados. 72 erros, 15 dispositivos, ~4h26min de exposicao.
- **Root cause**: Commit ab4c6d1 introduziu `mat.get('asaas_customer_id')` na linha 412. `sqlite3.Row` nao possui `.get()` — so dicts Python possuem. O bug estava no pseudocodigo do plano (`plano_campos_editaveis_carteirinha.md` linha 112).
- **Usuarios afetados**: 15 dispositivos unicos. Identificados: Beatriz Loureiro, Amanda Vieira Marques, Diogo Pires Manhnini, Binha Caldas, Luiz Fernando Guedes. 10 nao identificados por falta de user_id no log.
- **Fix**: `git revert ab4c6d1` — revert completo do commit. Funcao de edicao removida.
- **Operacao**: Op 19
- **Prevencao**: (1) Testar com TODOS os perfis de usuario antes de deploy. (2) Nunca usar .get() em sqlite3.Row. (3) Nao expandir escopo sem aprovacao. (4) Implementar logging com user_id.
- **Agravantes**: Escopo expandido (4 campos vs 2 pedidos), plano "futuro" executado na hora, sem DDCE, sem teste com usuario com matricula, firebaseSetUserId() nao ativo.
- **Verificacao pos-fix**: 84 testes em 5 perspectivas (47 com matricula + 20 sem + 5 publicas + 12 admin + integridade), zero falhas.
- **Backup pre-revert**: `/opt/hostinger-alfa/backups/orquestravoadora-pre-revert-op19-20260408-010836/`

---

## Gaps de Observabilidade (Op 19)

**O que FALTOU para investigacao completa:**

| Gap | Impacto | Pendencia |
|-----|---------|-----------|
| Sem user_id no access log | 10 de 15 usuarios nao identificados | `logging-observabilidade-producao.md` Proposta A/C |
| `firebaseSetUserId()` nunca chamado | Firebase Analytics nao correlaciona eventos com usuarios | `logging-observabilidade-producao.md` Proposta B |
| Sem `@app.after_request` | Sem medicao de tempo, sem contexto de usuario por request | `logging-observabilidade-producao.md` Proposta A |
| Sem log de tentativas de login | Chamado 05 (Gabriel sem SMS) exigiu investigacao manual | Proposta futura |

**Firebase Analytics ja implementado com 17 eventos** em 12 templates (`firebase-init.js`).
Helper `firebaseSetUserId(uid)` existe em `firebase-init.js:48-52` mas nunca e invocado.
Ativar e a melhoria de menor risco e maior retorno.

---

## Regras de Teste Pre-Deploy (Op 19)

**OBRIGATORIO antes de qualquer deploy que toque /painel, auth, ou rotas de usuario:**

1. Testar com usuario COM matricula ativa E asaas_customer_id preenchido
2. Testar com usuario COM matricula SEM asaas_customer_id
3. Testar com usuario SEM matricula (so inscricao)
4. Testar com usuario SEM inscricao
5. Testar com admin
6. Testar rotas publicas (/inscricoes, /avaliacoes, /)

**Comando rapido para teste funcional pos-deploy:**

```python
# Rodar com: /opt/hostinger-alfa/orquestravoadora/venv/bin/python3
import os, sys, sqlite3
sys.path.insert(0, '/opt/hostinger-alfa/orquestravoadora')
os.chdir('/opt/hostinger-alfa/orquestravoadora')
os.environ['FLASK_ENV'] = 'production'
from app import app

conn = sqlite3.connect('/opt/hostinger-alfa/orquestravoadora/orquestravoadora.db')
conn.row_factory = sqlite3.Row

# Usuario com matricula ativa
user_mat = conn.execute('''
    SELECT DISTINCT u.id FROM users u JOIN inscricoes i ON i.user_id=u.id
    JOIN matriculas m ON m.inscricao_id=i.id WHERE m.status != 'cancelada'
    AND m.asaas_customer_id IS NOT NULL LIMIT 1
''').fetchone()

# Usuario sem matricula
user_no = conn.execute('''
    SELECT DISTINCT u.id FROM users u JOIN inscricoes i ON i.user_id=u.id
    LEFT JOIN matriculas m ON m.inscricao_id=i.id WHERE m.id IS NULL LIMIT 1
''').fetchone()

# Admin
admin = conn.execute("SELECT id FROM users WHERE is_admin=1 LIMIT 1").fetchone()
conn.close()

for label, uid in [("COM matricula", user_mat), ("SEM matricula", user_no), ("ADMIN", admin)]:
    with app.test_client() as client:
        with client.session_transaction() as sess:
            sess['_user_id'] = str(uid['id'])
        r = client.get('/painel')
        status = "OK" if r.status_code == 200 else "FALHOU"
        print(f"[{status}] {label} (id {uid['id']}): /painel {r.status_code}")
```

---

## Procedimentos de Backup

```bash
# Backup WAL-safe do banco
sqlite3 /opt/hostinger-alfa/orquestravoadora/orquestravoadora.db \
  ".backup /opt/hostinger-alfa/backups/orquestravoadora_$(date +%Y%m%d_%H%M%S).db"

# Backup de arquivos especificos
for f in app.py database.py templates/painel.html static/style.css static/matricula.js; do
  cp /opt/hostinger-alfa/orquestravoadora/$f /opt/hostinger-alfa/backups/code_$f
done
```

**Backups existentes**:
- `/opt/hostinger-alfa/backups/orquestravoadora-pre-op18-*` — Pre deploy Op 18
- `/opt/hostinger-alfa/backups/orquestravoadora-pre-limpeza-*` — Pre limpeza dados teste
- `/opt/hostinger-alfa/backups/orquestravoadora-pre-cpf-fix-*` — Pre correcao CPFs (PERMANENTE)
- `/opt/hostinger-alfa/backups/orquestravoadora-pre-revert-op19-20260408-010836/` — Pre revert Op 19 (DB + 5 arquivos codigo)

---

## Aprendizados Operacionais (Op 19)

### 1. Testar com TODOS os perfis de usuario
O bug da Op 19 so afetava 18% dos usuarios (com matricula). Testes com outros perfis passavam.
Deploy que toca /painel DEVE usar o script de teste funcional acima.

### 2. sqlite3.Row nao e dict
`sqlite3.Row` suporta `row['campo']` mas NAO `.get()`. Em todo o codebase, `row['campo']`
funciona. O unico `.get()` em Row era o bug. Regra: NUNCA usar `.get()` em resultado de query.

### 3. Nao expandir escopo sem aprovacao explicita
Operador pediu CPF e RG. Implementacao incluiu nome e telefone — dados que afetam Firebase Auth,
SMS e login. Escopo deve ser confirmado antes da implementacao.

### 4. Plano "futuro" nao deve ser executado na mesma sessao
O documento dizia "PLANEJADO — nao executado. Para operacao futura exclusiva." Foi executado
na hora, sem DDCE, sem gates de aprovacao. Respeitar marcacao de status.

### 5. Verificacao em 5 perspectivas deve ser padrao
A validacao pos-deploy com 84 testes em 5 perspectivas deu confianca real. Deve ser padrao:
P1 (com matricula), P2 (sem matricula), P3 (publicas), P4 (admin), P5 (integridade/servicos).

### 6. Informacao que o operador pede e CRITICA
Quando o operador pede mapeamento de usuarios afetados, timeline detalhada, ou analise de causa —
essas informacoes sao essenciais e devem constar nos artefatos. Nao subestimar a importancia
das perguntas do operador.

### 7. Conhecer as ferramentas ja implementadas
Firebase Analytics com 17 eventos ja estava documentado no vault. O fix-suporte deveria ter
consultado o vault e sabido da existencia do Analytics e do `firebaseSetUserId()` antes de
afirmar que nao era possivel identificar usuarios.

### 8. overflow-x:auto NAO e fix de responsividade
Op 18 T2.3 adicionou `.table-responsive { overflow-x:auto }` e marcou como resolvido.
Na pratica, scroll horizontal e invisivel no mobile — usuario nao sabe que pode rolar.
Fix real: media query com card layout ou reestruturacao do conteudo para caber na viewport.
Regra: se a tabela tem botoes de acao, scroll horizontal NAO e aceitavel como solucao.

### 9. Evidencias visuais como entrega ao operador
Operador solicitou prints para encaminhar ao cliente. Screenshots Playwright em viewport
375px sao evidencia confiavel e reproduzivel. Sempre gerar ao menos 2 viewports (mobile +
desktop) como prova de correcao E de nao-regressao.

### 12. Auto-promoção per-user é mais segura que bulk centralizada
Quando uma operação de UPDATE precisa rodar automaticamente, prefira **escopo individual**
(WHERE user_id = ?) executado a cada acesso do próprio usuário, ao invés de **bulk centralizado**
(WHERE sem filtro) executado por admin/cron. Razões: (1) zero risco de bulk acidental afetar
muitos registros, (2) cada usuário promove apenas a si mesmo, (3) sem dependência de admin
acessar página específica, (4) idempotência natural (se já está promovido, zero efeito),
(5) o usuário é o trigger natural — só atualiza quando ele realmente acessa. Aplicado no
chamado #09: auto-promoção de aula_experimental → habilitado movida do admin_dashboard
para /painel com `WHERE user_id = ?`.

### 11. Firebase Phone Auth cria UID separado do Email Auth
Firebase Phone Auth e Email Auth criam **usuarios separados** (UIDs distintos) no mesmo
projeto Firebase. Custom claims setados no email UID NAO aparecem no phone UID.
Se o sistema depende de custom claims (como `admin:true`) para controle de acesso,
o SQLite deve ser fonte de verdade para is_admin, e claims devem ser sincronizados
ao UID ativo no momento do login. Regra: NUNCA confiar exclusivamente em Firebase claims
para determinar nivel de acesso — sempre cross-check com o banco local.

### 10. Estudo de impacto antes de deploy em producao
Operador solicitou estudo de impacto ANTES de autorizar deploy. Incluir: raio de explosao
(quais seletores CSS afetam quais elementos), interacoes com JS, cenarios cobertos,
viewport afetada vs nao-afetada, e side effects em elementos colaterais.

---

## Versionamento

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.0.0 | 2026-04-07 | Versao inicial. 5 issues conhecidos, padroes CPF/RG/Status/Pagamento, comandos investigacao SQLite+logs+systemd. Baseado na Op 18. |
| 1.1.0 | 2026-04-08 | Op 19: Issue #6 (mat.get P0), gaps de observabilidade, regras de teste pre-deploy, script de teste funcional, 7 aprendizados operacionais, backup pre-revert. |
| 1.4.0 | 2026-04-10 | Chamado #10: Issue #9 (status experimental → habilitado P2), bulk 71 alunos, toggle inteligente, auto-promoção per-user, aprendizado #12 (escopo individual zero risco). |
| 1.3.0 | 2026-04-09 | Chamado #08: Issue #8 (admin sem inscricao P2, Firebase Phone Auth UID separado), aprendizado #11 (Firebase Phone Auth dual UID). |
| 1.2.0 | 2026-04-08 | Chamado #07: Issue #7 (botao pagamento mobile P2), 3 aprendizados novos (#8 overflow nao e fix, #9 evidencias visuais, #10 estudo de impacto). |
