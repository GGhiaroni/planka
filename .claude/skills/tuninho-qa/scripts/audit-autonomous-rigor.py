#!/usr/bin/env python3
"""
audit-autonomous-rigor.py — Valida Regra #42 do tuninho-ddce v4.5.0
                          + Regra #38 do tuninho-devops-hostinger v3.2.2

Roda sobre autonomous-report-*.md em _a4tunados/deploys/{host}/ e verifica
se o relatorio passa no threshold de rigor (autonomo = mais rigor, nao menos).

Heuristicas de FAIL:
  (a) gate passou em <50% do tempo medio de gates interativos historicos;
  (b) deploy gate sem screenshot em evidencias;
  (c) validation gate sem `browser_console_messages` consultado
      (heuristica: sem mencao a "console" no relatorio);
  (d) relatorio com gates rotulados "auto-aprovado" sem regra objetiva citada;
  (e) ausencia de metrica `downtime_funcional` (so `downtime_tecnico`) —
      Regra #40 devops-hostinger v3.2.3.

Usage: audit-autonomous-rigor.py <REPORT_PATH>

Exit codes:
  0 — PASS (todos os checks ok)
  1 — WARN (1-2 flags)
  2 — FAIL (3+ flags ou FAIL critico em c/e)
"""
import sys
import re
from pathlib import Path


def check_report(path):
    p = Path(path)
    if not p.exists():
        print(f'ERROR: {path} nao encontrado')
        return 2

    text = p.read_text(encoding='utf-8', errors='replace')
    flags = []

    # Check (a): duracao total vs thresholds
    # Heuristica: se relatorio diz "Duracao total: ~X min" com X < 10 pra
    # deploy REMOTE (exige ssh+tarball+build+restart), e provavel rushed.
    dur_match = re.search(r'[Dd]uracao\s+total[^:]*:\s*~?(\d+)\s*min', text)
    if dur_match:
        dur_min = int(dur_match.group(1))
        is_remote = 'REMOTE' in text or 'scp' in text.lower() or 'tarball' in text.lower()
        if is_remote and dur_min < 10:
            flags.append(f'(a) duracao {dur_min}min < 10min pra deploy REMOTE — provavel rushed')

    # Check (b): gate de deploy tem referencia a screenshot em evidencias?
    has_deploy_gate = bool(re.search(r'GATE[\s_]*6|deploy.*gate|post.deploy', text, re.IGNORECASE))
    has_screenshot_evidence = bool(
        re.search(r'fase_\d+/evidencias/|screenshot.*\.png|evidencias/\*\.png', text)
    )
    if has_deploy_gate and not has_screenshot_evidence:
        flags.append('(b) gate de deploy sem screenshot em fase_NN/evidencias/')

    # Check (c): validation gate menciona console check?
    has_validation_gate = bool(re.search(r'validacao|GATE[\s_]*6|post.deploy', text, re.IGNORECASE))
    has_console_check = bool(
        re.search(r'browser_console_messages|console.*error|console.*limpo|zero.*console', text, re.IGNORECASE)
    )
    if has_validation_gate and not has_console_check:
        flags.append('(c) validation gate sem mencao a browser_console_messages — possivel smoke so server-side')

    # Check (d): gates "auto-aprovado" vazios?
    auto_lines = re.findall(r'auto[- ]aprovad[oa].{0,80}', text, re.IGNORECASE)
    empty_autos = [line for line in auto_lines
                   if not re.search(r'regra|GATE \d|risk|threshold|check', line, re.IGNORECASE)]
    if len(empty_autos) >= 3:
        flags.append(f'(d) {len(empty_autos)} "auto-aprovado" sem regra objetiva citada')

    # Check (e): mencao de downtime_funcional?
    has_tecnico = bool(re.search(r'downtime[\s_]*(tecnico|technical)', text, re.IGNORECASE))
    has_funcional = bool(re.search(r'downtime[\s_]*(funcional|functional)', text, re.IGNORECASE))
    if has_tecnico and not has_funcional:
        flags.append('(e) CRITICO: so downtime_tecnico reportado, sem downtime_funcional (Regra #40 devops v3.2.3)')

    # Check bonus: addendum existe se incidente pos-SUCCESS?
    # Se o report declara SUCCESS mas tem arquivo-irmao {ts}-addendum.md, OK
    # Se tem mencao a "hotfix" ou "incidente" no corpo SEM addendum criado, flag
    stem = p.stem
    addendum_path = p.parent / f'{stem}-addendum.md'
    declares_success = bool(re.search(r'\bSUCCESS\b|Deploy\s+OK', text))
    mentions_hotfix = bool(re.search(r'hotfix|incidente|fix[- ]forward', text, re.IGNORECASE))
    if declares_success and mentions_hotfix and not addendum_path.exists():
        flags.append(f'(f) relatorio menciona hotfix/incidente mas nao tem {addendum_path.name} (Regra #41 devops v3.2.3)')

    # Output
    print('=' * 60)
    print(f'AUDIT-AUTONOMOUS-RIGOR — {p.name}')
    print('(tuninho-qa v0.8.1+ | Regras #38/#40/#41 devops + #42 ddce)')
    print('=' * 60)
    print(f'Path: {p}')
    print()

    if not flags:
        print('PASS: relatorio autonomous passa em todos os checks de rigor')
        return 0

    critical = [f for f in flags if 'CRITICO' in f]
    print(f'Flags: {len(flags)} ({len(critical)} criticas)')
    for f in flags:
        print(f'  - {f}')

    print()
    if critical or len(flags) >= 3:
        print('FAIL: relatorio autonomous nao passa no threshold minimo.')
        print('      Principio master: autonomo = MAIS rigor que interativo.')
        print('      Ver _a4tunados/principios/autonomo-eh-mais-rigoroso.md')
        return 2
    else:
        print('WARN: 1-2 flags — revisar manualmente.')
        return 1


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <REPORT_PATH>")
        return 2
    return check_report(sys.argv[1])


if __name__ == '__main__':
    sys.exit(main())
