#!/bin/bash
# consolidate-report.sh — Tuninho QA
#
# Consolida todos os relatorios de auditoria de uma operacao em
# qa/_N+1_QA_PLANO_ACAO.md, agregando gaps por severidade e responsavel.
#
# Uso: ./consolidate-report.sh {NN}

set -e

NN="${1:-}"
if [ -z "$NN" ]; then
  echo "Uso: $0 {NN}"
  exit 2
fi

NN_PAD=$(printf "%02d" "$NN")
PROJ_GLOB="_a4tunados/_operacoes/projetos/${NN_PAD}_*"
PROJ_DIR=$(ls -d $PROJ_GLOB 2>/dev/null | head -1)

if [ -z "$PROJ_DIR" ]; then
  echo "[FAIL] Pasta da operacao nao encontrada"
  exit 1
fi

QA_DIR="$PROJ_DIR/qa"
if [ ! -d "$QA_DIR" ]; then
  echo "[FAIL] Pasta qa/ nao existe — rode audit-retroativo primeiro"
  exit 1
fi

OUTPUT="$QA_DIR/_11_QA_PLANO_ACAO.md"

echo "=== Tuninho QA — consolidate-report Op $NN ==="
echo "Saida: $OUTPUT"
echo ""

# Header
cat > "$OUTPUT" <<EOF
---
operacao: $NN
data: $(date +%Y-%m-%d)
auditor: tuninho-qa v0.1.0
tipo: plano-acao-consolidado
---

# Plano de Acao — QA Op $NN

> Consolidacao automatica dos gaps detectados pela auditoria retroativa.
> Gerado em $(date +%Y-%m-%dT%H:%M:%S%z) por consolidate-report.sh

## Resumo Executivo

EOF

# Contar gaps por severidade
CRITICA=$(grep -h "Severidade.*CRITICA\|Severidade.*: CRITICA" "$QA_DIR"/_*.md 2>/dev/null | wc -l | tr -d ' ')
ALTA=$(grep -h "Severidade.*ALTA" "$QA_DIR"/_*.md 2>/dev/null | wc -l | tr -d ' ')
MEDIA=$(grep -h "Severidade.*MEDIA" "$QA_DIR"/_*.md 2>/dev/null | wc -l | tr -d ' ')
BAIXA=$(grep -h "Severidade.*BAIXA" "$QA_DIR"/_*.md 2>/dev/null | wc -l | tr -d ' ')
TOTAL=$((CRITICA + ALTA + MEDIA + BAIXA))

cat >> "$OUTPUT" <<EOF
| Severidade | Quantidade |
|------------|------------|
| CRITICA | $CRITICA |
| ALTA | $ALTA |
| MEDIA | $MEDIA |
| BAIXA | $BAIXA |
| **TOTAL** | **$TOTAL** |

## Gaps por Relatorio

EOF

# Listar gaps de cada relatorio
for relatorio in "$QA_DIR"/_*.md; do
  if [ -f "$relatorio" ] && [ "$(basename $relatorio)" != "_11_QA_PLANO_ACAO.md" ]; then
    NOME=$(basename "$relatorio" .md)
    echo "### $NOME" >> "$OUTPUT"
    echo "" >> "$OUTPUT"

    # Extrair entries GAP-*
    GAPS=$(grep -c "^### GAP-" "$relatorio" 2>/dev/null || echo 0)
    if [ "$GAPS" -gt 0 ]; then
      echo "Total gaps: $GAPS" >> "$OUTPUT"
      grep -A 1 "^### GAP-" "$relatorio" 2>/dev/null | head -30 >> "$OUTPUT"
    else
      echo "_Sem gaps detectados._" >> "$OUTPUT"
    fi
    echo "" >> "$OUTPUT"
  fi
done

cat >> "$OUTPUT" <<EOF

## Acoes por Responsavel

> Cada acao corretiva tem um responsavel definido. O QA NAO corrige bugs
> funcionais — apenas reporta. A correcao e responsabilidade da fase ou
> do operador.

EOF

# Extrair responsaveis dos relatorios
RESPONSAVEIS=$(grep -h "Responsavel:" "$QA_DIR"/_*.md 2>/dev/null | sort -u || echo "")
if [ -n "$RESPONSAVEIS" ]; then
  echo "$RESPONSAVEIS" >> "$OUTPUT"
else
  echo "_Nenhum responsavel registrado._" >> "$OUTPUT"
fi

cat >> "$OUTPUT" <<EOF

## Re-validacoes Necessarias

Apos correcao de cada gap, re-invocar tuninho-qa no modo correspondente:

| Gap | Modo de re-validacao |
|-----|----------------------|
| Discovery | \`audit-discovery --operacao $NN\` |
| Define | \`audit-define --operacao $NN\` |
| Execution Fase X | \`audit-gate-fase --operacao $NN --fase X\` |
| Deploy | \`audit-deploy --projeto NOME --servidor ALVO\` |
| Final | \`audit-gate-final --operacao $NN\` |

---

*Consolidado em $(date) por tuninho-qa v0.1.0*
EOF

echo "[OK] $OUTPUT criado"
echo "Total gaps: $TOTAL ($CRITICA criticas, $ALTA altas, $MEDIA medias, $BAIXA baixas)"
