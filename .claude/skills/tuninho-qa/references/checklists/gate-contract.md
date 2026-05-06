# Gate Contract — Checklist do modo `audit-contract-compliance`

> Valida que o contrato entre DDCE e QA foi honrado integralmente.
> Invocado como sub-check de `audit-gate-final` e tambem disponivel standalone.

---

## Checks

| # | Check | Comando | Esperado | Bloqueante |
|---|-------|---------|----------|-----------|
| CC1 | Contract file exists | `ls contracts/qa-contract.yaml` | 1 arquivo | SIM |
| CC2 | Contract is valid YAML | `python3 -c "import yaml; yaml.safe_load(open('contracts/qa-contract.yaml'))"` | exit 0 | SIM |
| CC3 | Contract has acceptance | `grep "accepted_at:" contracts/qa-contract.yaml \| grep -v "null"` | 1 match | SIM |
| CC4 | Contract status is ACTIVE or FULFILLED | `grep "status:" contracts/qa-contract.yaml \| head -1` | ACTIVE ou FULFILLED | SIM |
| CC5 | All static obligations have delivery | `grep -A1 "type: static" contracts/qa-contract.yaml \| grep "status:" \| grep -cv "PENDING"` | == total static | SIM |
| CC6 | All dynamic obligations have delivery | `grep -A1 "type: dynamic" contracts/qa-contract.yaml \| grep "status:" \| grep -cv "PENDING"` | == total dynamic | SIM |
| CC7 | Zero blocking obligations PENDING | Contar `blocking: true` com `status: PENDING` | == 0 | SIM |
| CC8 | Every DELIVERED has artifacts | Para cada delivery com artifacts: verificar que arquivos existem no disco | todos existem | Alerta |
| CC9 | Summary counts match reality | Recontar e comparar com `summary:` | match | Alerta |
| CC10 | Amendments well-formed | Cada amendment tem timestamp + reason + added list | todos validos | Alerta |

---

## Resultado

- **PASS**: CC1-CC7 todos passam. CC8-CC10 podem ser alertas.
- **FAIL**: Qualquer CC1-CC7 falha → gate BLOQUEADO. Listar gaps e instruir correcao.

---

*Gate Contract v1.0.0 — tuninho-qa*
