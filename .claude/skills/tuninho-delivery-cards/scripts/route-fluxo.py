#!/usr/bin/env python3
"""
route-fluxo.py v1.4.0 — Heuristica DDCE vs FIX para cards do mural

Parte da skill tuninho-delivery-cards v1.4.0+ (fluxo card-isolated).

Entrada (via CLI):
  --card-json <path>     # JSON com {cardId, titulo, description, comments}
  OU
  --card-id <id>         # busca card via tuninho-mural fetch-card --card <id>

Saida (stdout, JSON):
  {
    "decision": "DDCE" | "FIX" | "AMBIGUOUS" | "WAIVED",
    "confidence": 0.0-1.0,
    "reason": "...",
    "score_ddce": int,
    "score_fix": int,
    "signals_matched": {
      "fix": [...], "ddce": [...],
      "structure_fix": [...], "structure_ddce": [...]
    },
    "description_length": int,
    "files_estimated": int,
    "systems_estimated": int,
    "blockers_ddce_detected": [...],
    "algorithm_version": "v1.4.0",
    "short_slug": "..."
  }

Exit codes:
  0 = analise concluida (ver decision)
  1 = erro de input (card-json invalido, card-id nao resolve)
  2 = erro tecnico (excecao Python)

Consumido por:
  - tuninho-delivery-cards SKILL.md secao "Heuristica DDCE vs Fix" (invoca
    via Bash e le stdout)
  - tuninho-ddce Etapa 0.2 (valida que decision != FIX antes de prosseguir)
  - tuninho-fix-suporte analogo

Se script falha (Python ausente, sintaxe, bug), skill tem fallback documentado
no SKILL.md: cair para roteamento binario legado (verbo de execucao → DDCE)
e registrar em heuristic.decision = "WAIVED — script-failure" no contrato.

Criado: 2026-04-22 (Op 04 card-isolated, suite v5.7.0).
"""

import json
import re
import sys
import argparse
from pathlib import Path


ALGORITHM_VERSION = "v1.4.0"
CONFIDENCE_THRESHOLD = 0.70


# Keywords peso 1 — linguagem casual/coloquial
SIGNALS_FIX = [
    "bug", "erro", "quebrou", "quebrado", "falhando", "falha",
    "nao funciona", "crashou", "crash", "500", "404", "producao quebrada",
    "urgent", "urgente", "incident", "incidente",
    "corrige", "corrigir", "conserta", "consertar", "arruma", "arrumar",
    "hotfix", "regressao", "regressão",
]
SIGNALS_DDCE = [
    "nova feature", "implementar", "implementa", "landing", "tela nova",
    "fluxo novo", "integracao", "integração", "analytics",
    "painel", "waitlist", "dashboard", "completo", "mvp",
    "adicionar", "criar", "desenvolver", "desenvolvimento",
    "feature", "funcionalidade", "modulo", "módulo", "componente novo",
]

# Keywords peso 2 — estrutura textual
STRUCTURE_FIX = [
    "stacktrace", "stack trace", "error log", "log de erro",
    "timeline do erro", "afetados", "impactados",
    "reproducao", "reprodução", "passos para reproduzir",
    "comportamento esperado", "comportamento atual",
    "debug", "diagnóstico", "diagnostico",
]
STRUCTURE_DDCE = [
    "criterios de aceite", "critérios de aceite",
    "requisitos:", "requisitos ", "user stories", "user story",
    "mockup", "design", "roadmap", "entregaveis", "entregáveis",
    "escopo:", "acceptance criteria",
    "dependencias", "dependências", "pre-requisitos", "pré-requisitos",
]

# Bloqueadores: presenca FORCA DDCE mesmo se fix score maior
BLOCKERS_DDCE = [
    "refactor", "redesenho", "re-arquitetura", "arquitetura",
    "tech debt", "débito técnico", "modernização", "modernizacao",
    "migração", "migracao",
]


def text_normalized(s):
    """Lowercase + strip + colapsa whitespace."""
    return re.sub(r"\s+", " ", s.lower().strip())


def count_matches(patterns, text):
    """Retorna lista dos patterns encontrados no text (case-insensitive)."""
    matched = []
    for p in patterns:
        if p.lower() in text:
            matched.append(p)
    return matched


def estimate_files(description):
    """Heuristica: contar mencoes a paths/arquivos (src/..., tests/..., .tsx, .ts)."""
    count = 0
    count += len(re.findall(r"src/\w", description))
    count += len(re.findall(r"tests?/\w", description))
    count += len(re.findall(r"\.\w{1,4}(?:\s|$)", description))
    count += len(re.findall(r"[a-z]+/[A-Z]\w+\.\w", description))  # ex: components/Foo.tsx
    return count


def estimate_systems(description):
    """Heuristica: contar mencoes a 'sistemas', 'modulos', 'paginas', 'rotas'."""
    text = description.lower()
    systems = 0
    for kw in ["sistema", "modulo", "módulo", "pagina", "página", "rota", "endpoint", "api", "servico", "serviço"]:
        systems += text.count(kw)
    return systems


def short_slug(titulo, max_words=3, max_chars=30):
    """Gera slug curto: primeiras N palavras significativas + lowercase + kebab-case."""
    # Remove caracteres nao-alphanumericos
    clean = re.sub(r"[^a-zA-Z0-9\s-]", "", titulo.lower())
    words = [w for w in clean.split() if len(w) > 2]  # dropar stopwords curtas
    stopwords = {"que", "com", "para", "sem", "nos", "nas", "dos", "das", "este", "esta", "isso"}
    words = [w for w in words if w not in stopwords][:max_words]
    result = "-".join(words)
    return result[:max_chars].rstrip("-") or "card"


def decide(card):
    """
    Core da heuristica. Retorna dict com decision/confidence/signals/etc.
    """
    titulo = card.get("titulo", "") or card.get("title", "")
    description = card.get("description", "") or ""
    comments = card.get("comments", []) or []

    # Concatenar todo o texto pesquisavel
    all_text = f"{titulo}\n{description}"
    if comments:
        all_text += "\n" + "\n".join(
            c.get("text", "") if isinstance(c, dict) else str(c)
            for c in comments
        )
    text = text_normalized(all_text)

    # Sinais peso 1
    matched_fix = count_matches(SIGNALS_FIX, text)
    matched_ddce = count_matches(SIGNALS_DDCE, text)

    # Sinais peso 2 (estrutura)
    matched_struct_fix = count_matches(STRUCTURE_FIX, text)
    matched_struct_ddce = count_matches(STRUCTURE_DDCE, text)

    score_fix = len(matched_fix) * 1.0 + len(matched_struct_fix) * 2.0
    score_ddce = len(matched_ddce) * 1.0 + len(matched_struct_ddce) * 2.0

    # Heuristicas de tamanho
    desc_len = len(description)
    if desc_len < 200 and score_fix > 0:
        score_fix += 3  # cards curtos+vagos tendem a ser bugs
    if desc_len > 1000:
        score_ddce += 2  # cards extensos tendem a ser features

    # Bloqueadores DDCE (forcam DDCE mesmo se fix score maior)
    blockers = count_matches(BLOCKERS_DDCE, text)
    files_est = estimate_files(description)
    systems_est = estimate_systems(description)

    # Aplicar bloqueadores
    force_ddce_reasons = []
    if blockers:
        force_ddce_reasons.append(f"keywords arquiteturais: {blockers}")
    if systems_est > 2:
        force_ddce_reasons.append(f">2 sistemas ({systems_est})")
    if files_est > 3:
        force_ddce_reasons.append(f">3 arquivos estimados ({files_est})")

    # Calcular decision
    total = score_fix + score_ddce
    if total == 0:
        confidence = 0.0
        decision = "AMBIGUOUS"
        reason = "Nenhum sinal DDCE nem FIX detectado"
    elif force_ddce_reasons:
        decision = "DDCE"
        confidence = min(0.95, 0.75 + len(force_ddce_reasons) * 0.05)
        reason = f"Bloqueador forca DDCE: {'; '.join(force_ddce_reasons)}"
    else:
        max_score = max(score_fix, score_ddce)
        confidence = round(max_score / total, 3)
        if confidence < CONFIDENCE_THRESHOLD:
            decision = "AMBIGUOUS"
            reason = f"Confidence {confidence} abaixo de {CONFIDENCE_THRESHOLD}"
        elif score_fix > score_ddce:
            decision = "FIX"
            reason = f"score_fix={score_fix} > score_ddce={score_ddce}"
        else:
            decision = "DDCE"
            reason = f"score_ddce={score_ddce} >= score_fix={score_fix}"

    return {
        "decision": decision,
        "confidence": confidence,
        "reason": reason,
        "score_ddce": score_ddce,
        "score_fix": score_fix,
        "signals_matched": {
            "fix": matched_fix,
            "ddce": matched_ddce,
            "structure_fix": matched_struct_fix,
            "structure_ddce": matched_struct_ddce,
        },
        "description_length": desc_len,
        "files_estimated": files_est,
        "systems_estimated": systems_est,
        "blockers_ddce_detected": blockers,
        "algorithm_version": ALGORITHM_VERSION,
        "short_slug": short_slug(titulo),
    }


def main():
    parser = argparse.ArgumentParser(description="Heuristica DDCE vs FIX para cards")
    parser.add_argument("--card-json", type=str, help="Path para JSON do card")
    parser.add_argument("--card-id", type=str, help="CardId (invoca tuninho-mural fetch-card)")
    parser.add_argument("--stdin", action="store_true", help="Ler card JSON de stdin")
    args = parser.parse_args()

    try:
        if args.stdin:
            card = json.load(sys.stdin)
        elif args.card_json:
            card = json.loads(Path(args.card_json).read_text())
        elif args.card_id:
            # Placeholder: real implementation invocaria tuninho-mural CLI
            # Por ora, exige JSON pre-fetchado
            sys.stderr.write(
                "--card-id ainda nao implementado. Use --card-json ou --stdin.\n"
            )
            sys.exit(1)
        else:
            sys.stderr.write("Uso: --card-json <path> | --stdin | --card-id <id>\n")
            sys.exit(1)

        result = decide(card)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        sys.exit(0)

    except (json.JSONDecodeError, FileNotFoundError) as e:
        sys.stderr.write(f"Erro de input: {e}\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Erro tecnico: {e}\n")
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
