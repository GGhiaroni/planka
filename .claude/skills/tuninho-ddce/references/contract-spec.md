# Contract Pattern — Especificacao v1.0.0

> Padrao de contratacao entre skills do a4tunados-ops-suite.
> Define como uma skill (contractor) contrata outra (contracted) com obrigacoes
> rastreadas, entregas verificaveis e enforcement nos gates.

---

## Principios

1. **Contrato e arquivo** — vive em `contracts/` da operacao, sobrevive entre sessoes
2. **Obrigacao rastreada** — cada ponto de integracao e uma obligation com status
3. **Entrega registrada** — skill contratada escreve delivery record apos cada invocacao
4. **Gate verifica** — antes de cada gate, DDCE checa o contrato; PENDING blocking = BLOQUEIA
5. **Compliance 100%** — GATE FINAL so passa se todas obrigacoes blocking estao DELIVERED
6. **Append-only** — amendments e deliveries sao adicionados, nunca editados ou removidos

---

## Schema YAML do Contrato

```yaml
# contracts/{skill}-contract.yaml

contract:
  version: "1.0.0"              # versao do schema
  id: "op{NN}-{skill}-001"      # identificador unico
  contractor: "tuninho-ddce"    # skill que contrata
  contractor_version: "vX.Y.Z"  # versao do contractor na criacao
  contracted: "tuninho-{skill}" # skill contratada
  contracted_version: null       # preenchido na aceitacao
  operation: "{NN}_{nome}"      # operacao vinculada
  created_at: "ISO-8601"        # timestamp de criacao
  status: DRAFT                 # DRAFT | ACTIVE | FULFILLED | BREACHED

acceptance:
  accepted_at: null              # preenchido pela skill contratada
  accepted_by: null              # nome da skill que aceitou
  accepted_version: null         # versao da skill na aceitacao

obligations:
  - id: "OBL-XXXX"              # identificador unico da obrigacao
    point: "Etapa N"            # etapa DDCE onde a obrigacao ocorre
    gate: null                   # GATE_DISCOVER | GATE_DEFINE | GATE_FASE | GATE_FINAL | null
    mode: "nome-do-modo"        # modo da skill contratada a invocar
    args: "--operacao {NN}"     # argumentos para o modo
    blocking: true               # se true, gate bloqueia quando PENDING
    type: static                 # static (criada na Etapa 7) | dynamic (adicionada apos DEFINE)
    status: PENDING              # PENDING | DELIVERED | SKIPPED | WAIVED
    delivery: null               # preenchido pela skill contratada (ver Delivery Record)

amendments:
  []                             # lista append-only de modificacoes

summary:
  total: 0
  delivered: 0
  pending: 0
  skipped: 0
  waived: 0
  blocking_pending: 0
  compliance_pct: "0%"
  last_updated: null
```

---

## Maquina de Estados do Contrato

```
DRAFT ──── (skill contratada aceita) ────→ ACTIVE
ACTIVE ─── (todas blocking DELIVERED) ───→ FULFILLED
ACTIVE ─── (gate detecta breach) ────────→ BREACHED

BREACHED → pode voltar a ACTIVE se gaps forem corrigidos
FULFILLED → estado final (imutavel)
```

### Status das Obligations

| Status | Significado | Quem seta |
|--------|-------------|-----------|
| PENDING | Aguardando entrega | DDCE (ao criar) |
| DELIVERED | Entrega feita com sucesso | Skill contratada (apos invocar) |
| SKIPPED | Nao aplicavel nesta operacao | DDCE (com justificativa) |
| WAIVED | Dispensada pelo operador | DDCE (com aprovacao explicita do operador) |

**Regras de transicao:**
- PENDING → DELIVERED: skill contratada escreveu delivery record com result PASS ou FAIL
- PENDING → SKIPPED: DDCE determinou que a obrigacao nao se aplica (ex: OBL-DEPLOY quando fase nao tem deploy). Requer `skip_reason` no delivery.
- PENDING → WAIVED: Operador explicitamente dispensou (ex: operacao urgente). Requer `waiver_reason` e `waived_by: operador` no delivery.
- DELIVERED com result FAIL: obrigacao entregue mas QA reprovou. Gate BLOQUEIA ate FAIL ser resolvido e QA re-invocado com novo delivery PASS.

---

## Delivery Record

Quando a skill contratada entrega uma obrigacao, escreve este bloco na obligation:

```yaml
delivery:
  timestamp: "2026-04-15T14:30:00Z"
  result: PASS                   # PASS | FAIL | PASS_COM_RESSALVAS
  artifacts:                     # lista de arquivos gerados
    - "qa/reports/audit-discovery.md"
    - "qa/evidencias/gate_discover.png"
  gaps_found: 0                  # numero de gaps detectados
  gaps_blocking: 0               # gaps que bloqueiam
  notes: "D1-D20 all PASS"      # resumo livre
  re_invocations: 0              # quantas vezes re-invocado apos FAIL
  skip_reason: null              # preenchido se status == SKIPPED
  waiver_reason: null            # preenchido se status == WAIVED
  waived_by: null                # "operador" se dispensado
```

---

## Amendments (Emendas)

Modificacoes no contrato sao permitidas apenas em pontos definidos:

| Momento | Tipo de emenda | O que muda |
|---------|---------------|------------|
| Apos GATE DEFINE (Etapa 8) | Adicao de dinamicas | OBL-FASE-{N}, OBL-PRE/POST-T{N}.{M}, OBL-DEPLOY-{N} |
| Feedback do operador (Etapa 12.1) | Nova fase adicionada | Novas OBL-FASE, OBL-PRE/POST para fase extra |
| Deploy emergencial | Adicao pontual | OBL-DEPLOY-{N} para fase que ganhou deploy |

**Formato de amendment:**
```yaml
amendments:
  - timestamp: "ISO-8601"
    reason: "Post-GATE DEFINE: 4 fases, 12 tarefas identificadas"
    added:
      - "OBL-FASE-01"
      - "OBL-FASE-02"
      - "OBL-PRE-T1.1"
      - "OBL-POST-T1.1"
    removed: []                  # remocoes NAO sao permitidas (append-only)
```

---

## Verificacao de Compliance

### Comando bash para checar compliance

```bash
# Contar obrigacoes por status
CONTRACT="contracts/qa-contract.yaml"

TOTAL=$(grep -c "^  - id:" "$CONTRACT")
DELIVERED=$(grep -c "status: DELIVERED" "$CONTRACT")
PENDING=$(grep -c "status: PENDING" "$CONTRACT")
BLOCKING_PENDING=$(grep -B5 "status: PENDING" "$CONTRACT" | grep -c "blocking: true")

echo "Total: $TOTAL | Delivered: $DELIVERED | Pending: $PENDING | Blocking Pending: $BLOCKING_PENDING"

if [ "$BLOCKING_PENDING" -gt 0 ]; then
  echo "FAIL: $BLOCKING_PENDING obrigacoes bloqueantes pendentes"
  exit 1
fi
echo "PASS: compliance OK"
```

### Verificacao no GATE FINAL

Antes de invocar QA audit-gate-final, DDCE executa:

1. Ler `contracts/qa-contract.yaml`
2. Contar obligations por status
3. Se `blocking_pending > 0` → BLOQUEAR (contrato violado — nao invocar QA)
4. Se `blocking_pending == 0` → invocar QA audit-gate-final normalmente
5. Apos QA retornar PASS → setar `contract.status: FULFILLED`

---

## Extensibilidade — Contratos com Outras Skills

O mesmo padrao pode ser usado para contratar qualquer skill. Exemplos:

### Contrato com tuninho-escriba

```yaml
contract:
  contracted: tuninho-escriba
obligations:
  - id: "OBL-ESCRIBA-FASE-01"
    point: "Etapa 14"
    gate: "GATE_FASE"
    mode: "document-phase"
    args: "--operacao {NN} --fase 1"
    blocking: true
    type: dynamic
  - id: "OBL-ESCRIBA-FINAL"
    point: "Etapa 15"
    gate: "GATE_FINAL"
    mode: "document-operation"
    args: "--operacao {NN}"
    blocking: true
    type: static
```

### Contrato com tuninho-devops-*

```yaml
contract:
  contracted: tuninho-devops-hostinger-alfa
obligations:
  - id: "OBL-DEPLOY-PROD"
    point: "Etapa 11.5"
    gate: null
    mode: "deploy"
    args: "--projeto a4tunados_mural"
    blocking: true
    type: dynamic
```

### Como criar um contrato para nova skill

1. Criar template em `references/contract-{skill}-template.yaml`
2. Definir obrigacoes estaticas (sempre presentes) e dinamicas (geradas apos DEFINE)
3. Na skill contratada: adicionar secao "Contract Awareness" que le/escreve no contrato
4. No DDCE: adicionar geracao do contrato na Etapa 7 e verificacao nos gates relevantes

---

## Regras do Contract Pattern

1. **Um contrato por skill por operacao** — `contracts/{skill}-contract.yaml`
2. **Contrato e compartilhado** — contractor e contracted leem/escrevem no mesmo arquivo
3. **Append-only** — deliveries e amendments sao adicionados, nunca editados
4. **Compliance antes do gate** — DDCE verifica ANTES de invocar a skill contratada
5. **Delivery obrigatoria** — skill contratada DEVE escrever delivery record apos cada invocacao
6. **Cross-session** — contrato persiste no diretorio da operacao (nao depende de memoria)
7. **Backward compatible** — se contrato nao existe, fallback para behavior instrucional
8. **Summary atualizado** — apos cada delivery ou amendment, recalcular summary counts

---

*Contract Pattern v1.0.0 — a4tunados-ops-suite*
