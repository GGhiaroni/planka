#!/usr/bin/env python3
"""
audit-card-input-coverage.py — Valida Regra #41 do tuninho-ddce v4.5.0

Cruza turns do assistant na sessao (JSONL em handoffs/raw_sessions/) com
comments no card do mural, detectando perguntas do agente que foram
postadas SO em um canal (violando a regra dos 2 canais).

Motivado por GAP-OP05-001 e GAP-OP05-003.

Usage: audit-card-input-coverage.py <CARD_ID> <OP_NUM> [--env prod|stage|dev]

Exit codes:
  0 — >= 80% coverage (PASS)
  1 — 50-79% coverage (WARN)
  2 — < 50% coverage (FAIL) OU erro
"""
import sys
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime

QUESTION_PATTERNS = [
    re.compile(r'\bP\d+(\.\d+)?:', re.IGNORECASE),
    re.compile(r'\?\s*(?:$|\n)', re.MULTILINE),
    re.compile(r'\b(aprova|confirma|libera|posso (?:seguir|avancar)|quer (?:que|eu))\b', re.IGNORECASE),
]
OPERATOR_ADDRESS_PATTERNS = [
    re.compile(r'@victorgaudio', re.IGNORECASE),
    re.compile(r'\boperador\b', re.IGNORECASE),
    re.compile(r'\bvoce\b', re.IGNORECASE),
]


def extract_assistant_turns_with_questions(jsonl_path):
    turns = []
    if not jsonl_path.exists():
        return turns
    with open(jsonl_path, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get('type') != 'assistant':
                continue
            msg = entry.get('message', {})
            content_blocks = msg.get('content', [])
            if not isinstance(content_blocks, list):
                continue
            text_parts = [b.get('text', '') for b in content_blocks
                          if isinstance(b, dict) and b.get('type') == 'text']
            full_text = '\n'.join(text_parts)
            if not full_text.strip():
                continue
            has_question = any(p.search(full_text) for p in QUESTION_PATTERNS)
            if not has_question:
                continue
            addresses_op = any(p.search(full_text) for p in OPERATOR_ADDRESS_PATTERNS)
            turns.append({
                'timestamp': entry.get('timestamp', ''),
                'text_preview': full_text[:300],
                'addresses_operator': addresses_op,
            })
    return turns


def fetch_card_comments(card_id, env='prod'):
    env_file = Path(f'_a4tunados/env/mural/.env.mural.{env}')
    if not env_file.exists():
        return []
    env_vars = {}
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()
    api_url = env_vars.get('MURAL_API_URL', '')
    token = env_vars.get('MURAL_TUNINHO_TOKEN', '')
    if not api_url or not token:
        return []
    try:
        result = subprocess.run(
            ['curl', '-sS', f'{api_url}/api/cards/{card_id}/comments',
             '-H', f'Authorization: Bearer {token}'],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        return data.get('items', [])
    except Exception:
        return []


def find_comment_match(turn, comments):
    turn_ts = turn['timestamp']
    turn_text = turn['text_preview'].lower()
    turn_fp = re.sub(r'\s+', ' ', turn_text[:200]).strip()
    for c in comments:
        c_ts = c.get('createdAt', '')
        c_text = (c.get('text') or '').lower()
        if not c_ts or c_ts < turn_ts:
            continue
        try:
            delta_s = (datetime.fromisoformat(c_ts.replace('Z', '+00:00'))
                       - datetime.fromisoformat(turn_ts.replace('Z', '+00:00'))).total_seconds()
            if delta_s > 3600 or delta_s < 0:
                continue
        except Exception:
            continue
        c_norm = re.sub(r'\s+', ' ', c_text).strip()
        for i in range(0, max(len(turn_fp) - 40, 1), 30):
            snippet = turn_fp[i:i + 50]
            if len(snippet) >= 40 and snippet in c_norm:
                return c
    return None


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <CARD_ID> <OP_NUM> [--env prod|stage|dev]")
        return 2
    card_id = sys.argv[1]
    op_num = sys.argv[2]
    env = 'prod'
    for i, arg in enumerate(sys.argv[3:], start=3):
        if arg == '--env' and i + 1 < len(sys.argv):
            env = sys.argv[i + 1]

    print('=' * 60)
    print(f'AUDIT-CARD-INPUT-COVERAGE — Card {card_id}')
    print('(tuninho-qa v0.8.0+ | Regra #41 tuninho-ddce v4.5.0)')
    print('=' * 60)
    print(f'Op: {op_num} | Env: {env}')
    print()

    op_dirs = list(Path('_a4tunados/_operacoes/projetos').glob(f'{op_num}_*'))
    if not op_dirs:
        print(f'ERROR: Pasta da operacao Op {op_num} nao encontrada')
        return 2
    op_dir = op_dirs[0]
    raw_sessions = list((op_dir / 'handoffs' / 'raw_sessions').glob('*.jsonl'))
    if not raw_sessions:
        print(f'WARN: nenhum raw_sessions JSONL em {op_dir}/handoffs/raw_sessions/')
        print('      (sessao corrente pode nao ter sido coletada ainda)')
        return 1

    all_questions = []
    for jsonl in raw_sessions:
        questions = extract_assistant_turns_with_questions(jsonl)
        all_questions.extend(questions)
        print(f'  {jsonl.name}: {len(questions)} turns com pergunta')

    operator_qs = [q for q in all_questions if q['addresses_operator']]
    print(f'\nTotal turns com pergunta: {len(all_questions)}')
    print(f'Enderecando operador (heuristica): {len(operator_qs)}')

    comments = fetch_card_comments(card_id, env)
    print(f'Comments no card: {len(comments)}')

    if not operator_qs:
        print('\nPASS: zero perguntas ao operador detectadas')
        return 0

    print('\n-- Cruzamento --')
    matched = 0
    unmatched = []
    for q in operator_qs:
        if find_comment_match(q, comments):
            matched += 1
        else:
            unmatched.append(q)

    coverage_pct = (matched / len(operator_qs)) * 100 if operator_qs else 0
    print(f'  Perguntas com comment correspondente: {matched}/{len(operator_qs)} ({coverage_pct:.0f}%)')

    if unmatched:
        print(f'\n-- Perguntas SEM comment no card ({len(unmatched)}) --')
        for q in unmatched[:5]:
            preview = q['text_preview'][:140].replace('\n', ' ')
            print(f'  * [{q["timestamp"][:19]}] {preview}...')
        if len(unmatched) > 5:
            print(f'  (+ {len(unmatched) - 5} outras)')

    print()
    if coverage_pct >= 80:
        print(f'PASS: {coverage_pct:.0f}% coverage')
        return 0
    elif coverage_pct >= 50:
        print(f'WARN: {coverage_pct:.0f}% coverage — Regra #41 potencialmente violada')
        return 1
    else:
        print(f'FAIL: {coverage_pct:.0f}% coverage — Regra #41 violada sistematicamente')
        return 2


if __name__ == '__main__':
    sys.exit(main())
