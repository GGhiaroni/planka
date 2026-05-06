#!/usr/bin/env python3
"""Comlurb Passo 3 — Reconcilia pendency-ledger com declaracoes do HANDOFF.

Le pendency-ledger.yaml (ou cria vazio se nao existe).
Le HANDOFF.pendencias_declaradas.
Aplica mudancas + detecta "silenciosamente_carregadas" + recalcula summary.
"""
import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


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
    except ImportError:
        return None, None
    if not path.exists():
        return {}, yaml
    with open(path) as f:
        return (yaml.safe_load(f) or {}), yaml


def save_yaml(path: Path, doc: dict, yaml_mod):
    with open(path, "w") as f:
        yaml_mod.safe_dump(doc, f, allow_unicode=True, sort_keys=False, default_flow_style=False)


def reconcile(ledger_path: Path, handoff_path: Path, sessao_nn: str):
    ledger, yaml_mod = load_yaml(ledger_path)
    if yaml_mod is None:
        print("  ⚠ PyYAML nao disponivel — reconciliacao pulada")
        return

    handoff, _ = load_yaml(handoff_path)

    if not ledger:
        ledger = {
            "operacao": handoff_path.parent.parent.name,
            "ledger_version": "1.0",
            "updated_at": iso_now(),
            "updated_by": "tuninho-da-comlurb v0.1.0",
            "summary": {
                "total": 0,
                "by_status": {"open": 0, "in_progress": 0, "closed": 0, "deferred": 0, "silenciosamente_carregada": 0},
                "by_origin_session": {}
            },
            "pendencies": []
        }

    declared = (handoff or {}).get("pendencias_declaradas") or {}
    fechadas = declared.get("fechadas_nesta_sessao") or []
    abertas = declared.get("abertas_nesta_sessao") or []
    deferidas = declared.get("deferidas") or []

    pend_list = ledger.get("pendencies") or []
    pend_by_id = {p.get("id"): p for p in pend_list if p.get("id")}

    now = iso_now()
    sessao_id = f"sessao_{sessao_nn}"

    # Fechar pendencias declaradas
    for item in fechadas:
        # Item pode ser string "ID — razao" ou dict {id, razao}
        if isinstance(item, str):
            parts = item.split("—", 1)
            pid = parts[0].strip()
            razao = parts[1].strip() if len(parts) > 1 else ""
        else:
            pid = item.get("id", "")
            razao = item.get("razao", "")

        if pid in pend_by_id:
            p = pend_by_id[pid]
            p["status"] = "closed"
            p["fechada_em_sessao"] = sessao_id
            p["fechada_em_timestamp"] = now
            p["resolucao"] = razao
            p.setdefault("historico", []).append({
                "timestamp": now, "sessao": sessao_id, "evento": "fechada", "nota": razao
            })
            print(f"  ✓ Fechada: {pid}")
        else:
            print(f"  ⚠ Fechada declarada mas nao existe no ledger: {pid}")

    # Novas pendencias abertas
    for item in abertas:
        if isinstance(item, dict) and item.get("id"):
            pid = item["id"]
            if pid in pend_by_id:
                print(f"  ⚠ Pendencia ja existe no ledger: {pid} — skip")
                continue
            new_pend = {
                "id": pid,
                "titulo": item.get("titulo", ""),
                "descricao": item.get("descricao", ""),
                "origem_sessao": sessao_id,
                "origem_timestamp": now,
                "status": "open",
                "prioridade": item.get("prioridade", "media"),
                "historico": [{
                    "timestamp": now, "sessao": sessao_id, "evento": "criada", "nota": "Declarada no HANDOFF"
                }]
            }
            for key in ("relacionado_a", "proxima_acao"):
                if item.get(key):
                    new_pend[key] = item[key]
            pend_list.append(new_pend)
            pend_by_id[pid] = new_pend
            print(f"  ✓ Aberta: {pid}")

    # Deferidas
    for item in deferidas:
        if isinstance(item, str):
            parts = item.split("—", 1)
            pid = parts[0].strip()
            razao = parts[1].strip() if len(parts) > 1 else ""
        else:
            pid = item.get("id", "")
            razao = item.get("razao", "")

        if pid in pend_by_id:
            p = pend_by_id[pid]
            p["status"] = "deferred"
            p["razao_deferimento"] = razao
            p.setdefault("historico", []).append({
                "timestamp": now, "sessao": sessao_id, "evento": "deferida", "nota": razao
            })
            print(f"  ✓ Deferida: {pid}")

    # Detectar silenciosamente_carregadas
    declared_ids = set()
    for item in fechadas + deferidas:
        if isinstance(item, str):
            declared_ids.add(item.split("—", 1)[0].strip())
        elif isinstance(item, dict):
            declared_ids.add(item.get("id", ""))

    silencio_count = 0
    for p in pend_list:
        if p.get("status") in ("open", "in_progress") and p.get("origem_sessao") != sessao_id:
            if p["id"] not in declared_ids:
                # Sessao atual nao declarou nada sobre ela
                p.setdefault("historico", []).append({
                    "timestamp": now, "sessao": sessao_id,
                    "evento": "silenciosamente_carregada",
                    "nota": f"Sessao {sessao_id} encerrou sem declarar status desta pendencia"
                })
                silencio_count += 1

    if silencio_count > 0:
        print(f"  ⚠ {silencio_count} pendencia(s) silenciosamente_carregada(s) — sessao nao declarou status")

    # Recalcula summary
    summary = {
        "total": len(pend_list),
        "by_status": {"open": 0, "in_progress": 0, "closed": 0, "deferred": 0, "silenciosamente_carregada": 0},
        "by_origin_session": {}
    }
    for p in pend_list:
        st = p.get("status", "open")
        # silenciosamente_carregada e contabilizada via historico, nao status
        has_silencio = any(h.get("evento") == "silenciosamente_carregada" for h in p.get("historico", []))
        if has_silencio and st in ("open", "in_progress"):
            summary["by_status"]["silenciosamente_carregada"] += 1
        else:
            summary["by_status"][st] = summary["by_status"].get(st, 0) + 1
        orig = p.get("origem_sessao", "unknown")
        summary["by_origin_session"][orig] = summary["by_origin_session"].get(orig, 0) + 1

    ledger["summary"] = summary
    ledger["updated_at"] = now
    ledger["updated_by"] = "tuninho-da-comlurb v0.1.0"
    ledger["pendencies"] = pend_list

    save_yaml(ledger_path, ledger, yaml_mod)
    print(f"  ✓ Ledger salvo: total={summary['total']} open={summary['by_status']['open']} closed={summary['by_status']['closed']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--op-dir", required=True)
    args = ap.parse_args()

    cwd = Path(args.cwd).resolve()
    op_dir = cwd / args.op_dir if not args.op_dir.startswith("/") else Path(args.op_dir)

    ctx = read_ctx(op_dir)
    handoff_path = Path(ctx.get("COMLURB_HANDOFF_PATH", ""))
    sessao_nn = ctx.get("COMLURB_SESSAO_NN", "01")

    if not handoff_path.exists():
        print(f"  ✗ HANDOFF nao encontrado: {handoff_path}")
        sys.exit(1)

    ledger_path = op_dir / "pendency-ledger.yaml"
    reconcile(ledger_path, handoff_path, sessao_nn)


if __name__ == "__main__":
    main()
