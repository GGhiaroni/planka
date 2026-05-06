#!/usr/bin/env python3
"""Comlurb Passo 2 — Atualiza HANDOFF da sessao atual incrementalmente.

Merge (nao overwrite): preserva campos ja preenchidos, adiciona/atualiza
os campos que o Comlurb gerencia (raw_sessions, encerramento, etc).

Se o HANDOFF nao existe: cria a partir do template com base na estrutura.

Dependencia: PyYAML (ja comum em Python 3+).
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def try_yaml():
    try:
        import yaml
        return yaml
    except ImportError:
        return None


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_comlurb_context(op_dir: Path) -> dict:
    """Le o .comlurb-context que o sync-jsonl-final.sh escreveu."""
    ctx_file = op_dir / ".comlurb-context"
    ctx = {}
    if not ctx_file.exists():
        return ctx
    for line in ctx_file.read_text().splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            ctx[k.strip()] = v.strip()
    return ctx


def git_status_short(cwd: Path) -> list:
    try:
        r = subprocess.run(
            ["git", "-C", str(cwd), "status", "--short"],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode == 0:
            return [line for line in r.stdout.splitlines() if line.strip()]
    except Exception:
        pass
    return []


def current_branch(cwd: Path) -> str:
    try:
        r = subprocess.run(
            ["git", "-C", str(cwd), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        if r.returncode == 0:
            return r.stdout.strip()
    except Exception:
        pass
    return "unknown"


def find_or_create_handoff(op_dir: Path, sessao_nn: str, data: str) -> Path:
    handoffs_dir = op_dir / "handoffs"
    handoffs_dir.mkdir(parents=True, exist_ok=True)

    # Busca HANDOFF existente para essa sessao
    pattern = f"HANDOFF_*_sessao_{sessao_nn}.yaml"
    existing = sorted(handoffs_dir.glob(pattern))
    if existing:
        return existing[-1]

    # Cria novo
    return handoffs_dir / f"HANDOFF_{data}_sessao_{sessao_nn}.yaml"


TEMPLATE = """# HANDOFF — Operacao {operacao} sessao {sessao}
# Gerenciado pelo Tuninho da Comlurb v0.1.0 + agentes DDCE
# Imutavel apos /clear — snapshot da sessao

operacao: "{operacao}"
sessao: {sessao}
branch_git: "{branch}"
inicio_timestamp: "{now}"
encerramento_timestamp: null
status: "em_andamento"

ddce:
  fase_metodo: null
  etapa_atual: null
  fase_execucao: null
  tarefa_atual: null

contexto:
  objetivo: ""
  progresso: ""

painel_resumido:
  fases_concluidas: []
  fase_atual: ""
  fases_pendentes: []

raw_sessions_coletadas:
  local: []
  outros_environments: []
  plan_files: []
  coletado_em: ""
  coletado_por: ""

decisoes_tomadas: []
arquivos_modificados: []
riscos_ativos: []

pendencias_declaradas:
  fechadas_nesta_sessao: []
  abertas_nesta_sessao: []
  deferidas: []

tokens:
  inicio: 0
  fim: 0
  delta: 0
  custo_usd: 0

proximos_passos_sessao_N_mais_1: []

briefing_proxima_sessao:
  length_words: 0
  key_points: []
  content_path: null

comlurb_sealed: false
"""


def merge_update(handoff_path: Path, op_dir: Path, mode: str, cwd: Path, ctx: dict):
    yaml = try_yaml()
    data_iso = iso_now()

    if not handoff_path.exists():
        # Create from template
        op_name = op_dir.name
        branch = current_branch(cwd)
        handoff_path.write_text(TEMPLATE.format(
            operacao=op_name,
            sessao=ctx.get("COMLURB_SESSAO_NN", "01"),
            branch=branch,
            now=data_iso,
        ))
        print(f"  ✓ HANDOFF criado: {handoff_path.name}")

    # Load existing
    if yaml:
        with open(handoff_path) as f:
            doc = yaml.safe_load(f) or {}
    else:
        # Fallback: apenas append note no final (sem parsing YAML)
        note = f"\n# [Comlurb update {data_iso}] PyYAML nao disponivel — update manual necessario\n"
        with open(handoff_path, "a") as f:
            f.write(note)
        print("  ⚠ PyYAML nao disponivel — escrevi comentario ao inves de update estruturado")
        return

    # Update fields
    doc["encerramento_timestamp"] = data_iso
    doc["branch_git"] = current_branch(cwd)

    # raw_sessions
    rsc = doc.get("raw_sessions_coletadas") or {}
    local_list = rsc.get("local") or []
    jsonl_dest = ctx.get("COMLURB_JSONL_DEST", "")
    if jsonl_dest and jsonl_dest not in local_list:
        rel_path = os.path.relpath(jsonl_dest, cwd) if os.path.isabs(jsonl_dest) else jsonl_dest
        local_list.append(rel_path)
    rsc["local"] = local_list
    rsc["coletado_em"] = data_iso
    rsc["coletado_por"] = "tuninho-da-comlurb v0.1.0"
    doc["raw_sessions_coletadas"] = rsc

    # arquivos_modificados
    mods = git_status_short(cwd)
    if mods:
        doc["arquivos_modificados"] = mods

    # Note do modo
    log_entry = {
        "timestamp": data_iso,
        "modo": mode,
        "skill": "tuninho-da-comlurb v0.1.0"
    }
    doc.setdefault("comlurb_log", []).append(log_entry)

    # Save
    with open(handoff_path, "w") as f:
        yaml.safe_dump(doc, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

    print(f"  ✓ HANDOFF atualizado: {handoff_path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--op-dir", required=True)
    ap.add_argument("--mode", required=True)
    args = ap.parse_args()

    cwd = Path(args.cwd).resolve()
    op_dir = cwd / args.op_dir if not args.op_dir.startswith("/") else Path(args.op_dir)

    ctx = read_comlurb_context(op_dir)
    if not ctx:
        print("  ⚠ .comlurb-context nao encontrado — abortando")
        sys.exit(1)

    sessao_nn = ctx.get("COMLURB_SESSAO_NN", "01")
    data = ctx.get("COMLURB_DATA", datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    handoff_path = find_or_create_handoff(op_dir, sessao_nn, data)
    merge_update(handoff_path, op_dir, args.mode, cwd, ctx)

    # Registrar path do handoff no context
    with open(op_dir / ".comlurb-context", "a") as f:
        f.write(f"COMLURB_HANDOFF_PATH={handoff_path}\n")

    print(f"  Handoff: {handoff_path.relative_to(cwd)}")


if __name__ == "__main__":
    main()
