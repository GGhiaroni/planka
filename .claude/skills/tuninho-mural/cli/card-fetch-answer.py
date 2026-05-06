#!/usr/bin/env python3
"""
card-fetch-answer.py — tuninho-mural v0.6.0+

Parseia respostas a/b/c/d (ou texto livre) em comentários de cards Planka.
Pattern "answer matching" da web search WS3 (Op 07): regex explícito + fuzzy.

Uso:
  python3 card-fetch-answer.py --card <id> --comment <id> --questions <path-json>

Output:
  JSON {"P1": "a", "P2": "Other: <texto>"} ou similar

Heurística:
  1. Procura linha tipo `^P\d+:\s*[a-d]\b` (priority) — match explícito
  2. Procura fuzzy match contra labels das opções
  3. Fallback: "Other: <texto completo>"
"""

import json
import re
import sys
import argparse
import subprocess
import os


def fetch_comment(card_id, comment_id):
    """Busca comentário via mural-cli.js"""
    cli = os.path.join(os.path.dirname(__file__), 'mural-cli.js')
    result = subprocess.run(
        ['node', cli, 'comment-get', '--card', str(card_id), '--id', str(comment_id)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        sys.stderr.write(f"FAIL fetch: {result.stderr}\n")
        sys.exit(1)
    try:
        data = json.loads(result.stdout)
        return data.get('text', '')
    except json.JSONDecodeError:
        return result.stdout


def parse_answers(text, questions):
    """Parseia respostas a/b/c contra questões."""
    answers = {}
    text_lower = text.lower()

    for i, q in enumerate(questions, 1):
        key = f"P{i}"

        # Heurística 1: match explícito "P1: a"
        m = re.search(rf'\bp{i}\s*[:=]\s*([a-d])\b', text_lower)
        if m:
            answers[key] = m.group(1)
            continue

        # Heurística 2: fuzzy match contra label das opções
        matched = None
        for j, opt in enumerate(q.get('options', [])):
            label_lower = opt.get('label', '').lower()
            if label_lower and label_lower in text_lower:
                letter = chr(97 + j)
                matched = letter
                break
        if matched:
            answers[key] = matched
            continue

        # Heurística 3: encontra primeira letra a/b/c/d na linha (mais frágil)
        m2 = re.search(rf'\bp{i}\s*[:=]?\s*([a-d])\b', text_lower)
        if m2:
            answers[key] = m2.group(1)
            continue

        # Fallback
        answers[key] = f"Other: {text[:200]}"

    return answers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--card', required=True)
    parser.add_argument('--comment', required=True)
    parser.add_argument('--questions', required=True, help='path para spec JSON')
    parser.add_argument('--text', help='Em vez de fetch, parsear texto direto (testing)')
    args = parser.parse_args()

    with open(args.questions) as f:
        spec = json.load(f)

    if args.text:
        text = args.text
    else:
        text = fetch_comment(args.card, args.comment)

    answers = parse_answers(text, spec.get('questions', []))
    print(json.dumps(answers, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
