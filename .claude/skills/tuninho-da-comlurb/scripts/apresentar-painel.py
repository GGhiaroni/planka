#!/usr/bin/env python3
"""Comlurb — Apresenta painel final para o agente passar ao operador.

Le o HANDOFF atualizado + pendency-ledger + briefing e monta o painel visual.
"""
import argparse
import sys
from pathlib import Path


def read_ctx(op_dir: Path) -> dict:
    ctx_file = op_dir / ".comlurb-context"
    ctx = {}
    if ctx_file.exists():
        for line in ctx_file.read_text().splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                ctx[k.strip()] = v.strip()
    return ctx


def load_yaml(path: Path):
    try:
        import yaml
        if not path.exists():
            return None
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--op-dir", required=True)
    ap.add_argument("--mode", required=True)
    args = ap.parse_args()

    cwd = Path(args.cwd).resolve()
    op_dir = cwd / args.op_dir if not args.op_dir.startswith("/") else Path(args.op_dir)

    ctx = read_ctx(op_dir)
    handoff_path = Path(ctx.get("COMLURB_HANDOFF_PATH", ""))
    sessao_nn = ctx.get("COMLURB_SESSAO_NN", "01")
    data = ctx.get("COMLURB_DATA", "?")

    handoff = load_yaml(handoff_path) if handoff_path.exists() else None
    ledger = load_yaml(op_dir / "pendency-ledger.yaml")

    op_name = op_dir.name if op_dir else "?"
    sealed = handoff.get("comlurb_sealed") if handoff else False
    seal_ts = handoff.get("seal_timestamp") if handoff else "?"
    next_sessao = f"{int(sessao_nn) + 1:02d}" if sessao_nn.isdigit() else "??"
    briefing_path = ""
    briefing_words = 0
    if handoff:
        brief = handoff.get("seal_next_session_briefing") or {}
        briefing_path = brief.get("content_path", "")
        briefing_words = brief.get("length_words", 0)

    raw_local = []
    if handoff:
        raw_local = (handoff.get("raw_sessions_coletadas") or {}).get("local") or []

    pend_open = pend_closed = pend_deferred = pend_silence = 0
    if ledger:
        by_status = (ledger.get("summary") or {}).get("by_status") or {}
        pend_open = by_status.get("open", 0)
        pend_closed = by_status.get("closed", 0)
        pend_deferred = by_status.get("deferred", 0)
        pend_silence = by_status.get("silenciosamente_carregada", 0)

    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║   🧹 FAXINA COMPLETA — Tuninho da Comlurb v0.1.0             ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║ Operacao:    {op_name:<47} ║")
    print(f"║ Sessao:      sessao_{sessao_nn} ({data}){' ' * (31 - len(sessao_nn) - len(data))} ║")
    print(f"║ Modo:        {args.mode:<47} ║")
    print("║                                                              ║")
    print("║ Sincronizado:                                                ║")
    print(f"║   • JSONL sessao atual: {('✅ ' + str(len(raw_local)) + ' arquivo(s)' if raw_local else '⚠ nenhum'):<36} ║")
    print("║                                                              ║")
    print(f"║ HANDOFF: {handoff_path.name if handoff else '?':<51} ║")
    print(f"║ Status: {'✅ SEAL APLICADO' if sealed else '⚠ SEAL NAO APLICADO':<52} ║")
    if sealed:
        print(f"║ Timestamp: {seal_ts:<49} ║")
    print("║                                                              ║")
    print("║ Pendencias:                                                  ║")
    print(f"║   {pend_open} abertas · {pend_closed} fechadas · {pend_deferred} deferidas{('  ⚠ ' + str(pend_silence) + ' silenciosas!' if pend_silence > 0 else ''):<40}")
    print("║                                                              ║")
    if briefing_path:
        print(f"║ Briefing sessao_{next_sessao}:                                           ║")
        print(f"║   • {briefing_words} palavras em {briefing_path[:42]:<42} ║")
    print("║                                                              ║")
    if sealed and args.mode in ("faxina-pre-clear", "emergencial-85pct", "pre-compact", "gate-guard-full"):
        print("║ STATUS: ✅ PODE DAR /clear AGORA                             ║")
        print("║                                                              ║")
        print(f"║ A proxima sessao (sessao_{next_sessao}) recebera o briefing             ║")
        print("║ automatico via tuninho-hook-inicio-sessao.                   ║")
    elif args.mode == "gate-guard-light":
        print("║ STATUS: ✅ GATE-GUARD LIGHT completo                          ║")
        print("║   JSONL + HANDOFF atualizados. Continue a sessao.            ║")
    elif args.mode == "selo-final-operacao":
        print("║ STATUS: ✅ OPERACAO SELADA                                    ║")
        print("║   Operacao imutavel. Safe para encerrar sessao.              ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    if sealed and args.mode != "gate-guard-light":
        print("Digite /clear quando estiver pronto para iniciar nova sessao.")


if __name__ == "__main__":
    main()
