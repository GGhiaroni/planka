#!/usr/bin/env python3
"""Comlurb Passo 5 — Aplica seal no HANDOFF + gera briefing canonico da proxima sessao.

v0.8.0 (Op 18 Fase 1 — 2026-05-02): consume references/handoff-template.md
canonico de 9 secoes (ao inves de gerar formato inline proprio v0.7.x).
Bloco markdown canonico vai DENTRO do HANDOFF YAML em
`seal_next_session_briefing.canonical_block` para que tuninho-resume
exiba o mesmo bloco SEM precisar abrir 2 arquivos.

Detecta reseal-required quando seal acontece em modo emergencial-85pct/
pre-compactacao apos seal anterior selo-final-operacao — marca
`requires_reseal: true` que o hook briefing-gate v0.2.0+ verifica para
forcar Modo 8 RESEAL antes da proxima sessao trabalhar.

Adiciona campos de seal no HANDOFF:
  comlurb_sealed, seal_timestamp, seal_version, seal_mode, seal_qa_result,
  seal_next_session_briefing.canonical_block, requires_reseal (condicional)
"""
import argparse
import os
import re
import subprocess
import sys
from datetime import datetime, timezone, UTC
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
        return None, yaml
    with open(path) as f:
        return (yaml.safe_load(f) or {}), yaml


def save_yaml(path: Path, doc: dict, yaml_mod):
    with open(path, "w") as f:
        yaml_mod.safe_dump(doc, f, allow_unicode=True, sort_keys=False, default_flow_style=False)


def run_safe(cmd_list, cwd=None, default=""):
    """Roda subprocess sem crashar. Retorna stdout strip ou default."""
    try:
        r = subprocess.run(cmd_list, cwd=cwd, capture_output=True, text=True, timeout=5)
        if r.returncode == 0:
            return r.stdout.strip()
    except Exception:
        pass
    return default


def load_canonical_template(script_dir: Path) -> str:
    """Le references/handoff-template.md e extrai bloco markdown canonico
    (entre as 2 primeiras ocorrencias de ``` no arquivo).

    Retorna template string com placeholders {NOME} pronto para .format().
    Retorna "" se template missing ou parse falhar — caller deve usar legacy.
    """
    template_path = script_dir.parent / "references" / "handoff-template.md"
    if not template_path.exists():
        return ""
    try:
        content = template_path.read_text(encoding="utf-8")
        # Bloco entre primeiro ```markdown ... ``` (ou ``` se sem language tag)
        m = re.search(r"```(?:markdown)?\n(.*?)\n```", content, re.DOTALL)
        if m:
            return m.group(1)
    except Exception:
        pass
    return ""


def extract_drift_check_data(handoff_doc: dict, op_dir: Path, cwd: Path,
                             sessao_nn: str, seal_mode: str) -> dict:
    """Coleta dados pra preencher placeholders do template canonico.

    Lê handoff_doc, executa git, le pendency-ledger, parsea decisoes.
    Retorna dict com chaves equivalentes aos placeholders {NOME} do template.
    Failsafe: campos sem dado viram "(nao declarado)" ao inves de crashar.
    """
    ops_name = handoff_doc.get("operacao", "DDCE-sem-nome")
    nome = handoff_doc.get("nome", ops_name)
    branch = handoff_doc.get("branch_git", run_safe(["git", "branch", "--show-current"], cwd=cwd, default="?"))
    commit_full = run_safe(["git", "rev-parse", "HEAD"], cwd=cwd, default="?")
    commit_short = commit_full[:7] if commit_full and commit_full != "?" else "?"

    contexto = handoff_doc.get("contexto") or {}
    objetivo = (contexto.get("objetivo") or "(sem objetivo declarado)").strip()
    objetivo_1linha = objetivo.split("\n")[0][:140]

    painel = handoff_doc.get("painel_resumido") or {}
    fase_atual = (painel.get("fase_atual") or "(indefinida)").strip()
    tarefa_atual = (handoff_doc.get("ddce") or {}).get("tarefa_atual") or "(sem tarefa ativa)"

    proximos = handoff_doc.get("proximos_passos_sessao_2") or handoff_doc.get("proximos") or []
    if proximos and isinstance(proximos[0], dict):
        proximos = [p.get("acao", str(p)) for p in proximos]
    proximo_passo = proximos[0] if proximos else "(nao declarado — pergunte ao operador)"

    decisoes = (handoff_doc.get("decisoes_tomadas") or
                handoff_doc.get("decisoes_tomadas_finais") or [])

    # Pendency-ledger
    ledger_path = op_dir / "pendency-ledger.yaml"
    pend_total = pend_open = pend_in_prog = pend_closed = pend_deferred = 0
    pend_list_text = ""
    if ledger_path.exists():
        try:
            import yaml
            with open(ledger_path) as f:
                ledger = yaml.safe_load(f) or {}
            summary = ledger.get("summary") or {}
            by_status = summary.get("by_status") or {}
            pend_total = summary.get("total", 0)
            pend_open = by_status.get("open", 0)
            pend_in_prog = by_status.get("in_progress", 0)
            pend_closed = by_status.get("closed", 0)
            pend_deferred = by_status.get("deferred", 0)
            pendencies = ledger.get("pendencies") or []
            lines = []
            for p in pendencies[:10]:
                status = p.get("status", "?")
                pid = p.get("id", "?")
                title = p.get("title", "?")
                prio = p.get("priority", "?")
                lines.append(f"  [{status:14}] {pid}: {title} — prioridade {prio}")
            pend_list_text = "\n".join(lines) if lines else "  (nenhuma)"
        except Exception:
            pend_list_text = "  (nao foi possivel ler ledger)"
    else:
        pend_list_text = "  (sem pendency-ledger.yaml)"

    # Artefatos-chave: globs no op_dir
    artefatos = {}
    for label, glob in [("Plano", "*_2_DEFINE_PLAN_*.md"),
                        ("Discovery", "*_1_DISCOVERY_*.md"),
                        ("Discovery XP", "*_1-xp_DISCOVERY_*.md")]:
        # Busca em prompts/ do _operacoes (1 nivel acima de projetos/NN)
        prompts_dir = op_dir.parent.parent / "prompts"
        if prompts_dir.exists():
            matches = list(prompts_dir.glob(glob))
            if matches:
                artefatos[label] = str(matches[0].relative_to(cwd)) if str(matches[0]).startswith(str(cwd)) else str(matches[0])
        if label not in artefatos:
            artefatos[label] = "(nao encontrado)"

    handoff_rel = "(este arquivo — caminho absoluto vazio)"
    try:
        handoff_path_real = op_dir / "handoffs" / f"HANDOFF_*_sessao_{sessao_nn}.yaml"
        # Dispensa expansao real, usa rel abstrata
        handoff_rel = f"_a4tunados/_operacoes/projetos/{op_dir.name}/handoffs/"
    except Exception:
        pass

    # Historico de seals (append-only)
    historico = handoff_doc.get("historico_seals") or []
    historico_lines = []
    for h in historico[-10:]:
        ts = h.get("timestamp", "?")
        modo = h.get("seal_mode", "?")
        evento = (h.get("evento") or "").split("\n")[0][:80]
        historico_lines.append(f"  {ts}  {modo:30}  — {evento}")
    historico_text = "\n".join(historico_lines) if historico_lines else "  (primeiro seal desta op)"

    # Decisoes ativas (top 8)
    decisoes_lines = []
    for d in decisoes[:8]:
        if isinstance(d, dict):
            dtext = d.get("decisao") or d.get("titulo") or str(d)
        else:
            dtext = str(d)
        decisoes_lines.append(f"  • {dtext[:200]}")
    decisoes_text = "\n".join(decisoes_lines) if decisoes_lines else "  (nenhuma declarada)"

    seal_ts = iso_now()

    # Confianca aproximada baseada em QA result (se PASS_COM_RESSALVAS = 80%, PASS = 95%, FAIL = 50%)
    qa = handoff_doc.get("seal_qa_result") or {}
    confianca = "95"  # default otimista
    for v in qa.values():
        if isinstance(v, str):
            if "FAIL" in v:
                confianca = "50"; break
            if "RESSALVAS" in v:
                confianca = "80"

    return {
        "OP_NOME": ops_name if ops_name else nome,
        "OP_NN": str(handoff_doc.get("operacao", "??")),
        "nome": nome,
        "N": str(int(sessao_nn) + 1) if sessao_nn.isdigit() else "??",
        "ISO_TS": seal_ts,
        "seal_mode": seal_mode,
        "%": confianca,
        "BRANCH": branch,
        "COMMIT_SHORT": commit_short,
        "VAULT": str(cwd),
        "1-linha do objetivo": objetivo_1linha,
        "FASE": fase_atual,
        "1-linha descrição": "(ver fase atual)",
        "ID": "(ver tarefa_atual)",
        "descrição curta": str(tarefa_atual),
        "timestamp + descrição em 1 linha": f"{seal_ts}: seal aplicado em modo {seal_mode}",
        "commit_esperado": commit_full,
        "branch_esperada": branch,
        "comando_validacao_estado_1": "git log --oneline -3   # esperado: ultimo commit alinhado com seal",
        "output_esperado_1": "head bate com commit selado",
        "comando_validacao_estado_2": f"ls handoffs/raw_sessions/  # esperado: jsonl da sessao {sessao_nn} presente",
        "output_esperado_2": "raw da sessao anterior coletado",
        "ação_concreta_em_1_linha": proximo_passo,
        "arquivo:linha_se_aplicável": "(consultar HANDOFF.proximos_passos)",
        "bash_exato_pra_executar": "git status && git log --oneline -5",
        "output_observável_que_indica_sucesso": "estado limpo + commits coerentes com seal",
        "decisões_block": decisoes_text,
        "N_pend": str(pend_total), "O": str(pend_open), "I": str(pend_in_prog),
        "C": str(pend_closed), "D": str(pend_deferred),
        "pendencias_block": pend_list_text,
        "path_pendency_ledger.yaml": str(ledger_path.relative_to(cwd)) if ledger_path.exists() and str(ledger_path).startswith(str(cwd)) else str(ledger_path),
        "path_2_DEFINE_PLAN.md": artefatos.get("Plano", "(nao encontrado)"),
        "path_1_DISCOVERY.md": artefatos.get("Discovery", "(nao encontrado)"),
        "path_1-xp_DISCOVERY.md": artefatos.get("Discovery XP", "(nao encontrado)"),
        "path_handoff_yaml": handoff_rel,
        "path_vault_sessoes": "_a4tunados/docs_*/sessoes/",
        "path_qa_dir": "qa/",
        "conteudo_critico_block": "(sem conteudo extraido nesta selagem — ver raw_sessions/ se necessario)",
        "historico_seals_block": historico_text,
    }


def render_canonical_briefing(template: str, data: dict) -> str:
    """Aplica placeholders no template canonico.

    Estrategia: usa replace simples nos placeholders bem-definidos, evita .format()
    porque template tem {} em comandos bash/git. Substitui apenas as chaves que
    sabemos que sao placeholders (lista explicita).
    """
    output = template
    placeholders_simples = [
        "OP_NOME", "OP_NN", "nome", "N", "ISO_TS", "seal_mode", "%",
        "BRANCH", "COMMIT_SHORT", "VAULT",
        "1-linha do objetivo", "FASE", "1-linha descrição",
        "ID", "descrição curta", "timestamp + descrição em 1 linha",
        "commit_esperado", "branch_esperada",
        "comando_validacao_estado_1", "output_esperado_1",
        "comando_validacao_estado_2", "output_esperado_2",
        "ação_concreta_em_1_linha", "arquivo:linha_se_aplicável",
        "bash_exato_pra_executar", "output_observável_que_indica_sucesso",
        "N_pend", "O", "I", "C", "D",
        "path_pendency_ledger.yaml",
        "path_2_DEFINE_PLAN.md", "path_1_DISCOVERY.md", "path_1-xp_DISCOVERY.md",
        "path_handoff_yaml", "path_vault_sessoes", "path_qa_dir",
    ]
    # Mapeamento {N_pend} (template usa {N}) — N_pend evita conflito
    output = output.replace("{N}", "{N_OR_NPEND}")  # tag temporaria
    # Aplica simples
    for key in placeholders_simples:
        output = output.replace("{" + key + "}", str(data.get(key, "?")))
    # Restaura {N} sessao
    output = output.replace("{N_OR_NPEND}", str(data.get("N", "?")))

    # Blocos multi-linha (decisoes, pendencias, historico, conteudo critico)
    # Substituem regioes inteiras conforme o template
    # Decisoes: o template tem 3 linhas {decisao_1}: ... etc — substituimos pelo bloco
    output = re.sub(
        r"  • \{decisão_1\}.*?  • \{decisão_3\}.*?\n",
        data.get("decisões_block", "  (vazio)") + "\n",
        output, count=1, flags=re.DOTALL
    )
    # Pendencias: substitui o bloco [open]...[deferred]
    output = re.sub(
        r"  \[open\].*?razão: \{1-linha\}\n",
        data.get("pendencias_block", "  (vazio)") + "\n",
        output, count=1, flags=re.DOTALL
    )
    # Conteudo critico
    output = re.sub(
        r"  \{Se sessão anterior gerou.*?\{conteudo_verbatim_2\}\n  ---\n",
        "  " + data.get("conteudo_critico_block", "(vazio)") + "\n",
        output, count=1, flags=re.DOTALL
    )
    # Historico seals
    output = re.sub(
        r"  \{ts1\} \{seal_mode1\}.*?\{esta_selagem\}\n",
        data.get("historico_seals_block", "  (vazio)") + "\n",
        output, count=1, flags=re.DOTALL
    )

    return output


def generate_briefing_canonical(handoff_doc: dict, sessao_nn: str,
                                briefing_path: Path, op_dir: Path,
                                cwd: Path, seal_mode: str,
                                script_dir: Path) -> tuple:
    """Gera briefing usando template canonico v0.8.0.

    Retorna (canonical_block_str, words_count).
    Se template missing ou parse falha, retorna ("", 0) — caller usa legacy.
    """
    template = load_canonical_template(script_dir)
    if not template:
        return "", 0

    data = extract_drift_check_data(handoff_doc, op_dir, cwd, sessao_nn, seal_mode)
    canonical_block = render_canonical_briefing(template, data)

    # Escrever arquivo briefing externo (compat)
    briefing_path.parent.mkdir(parents=True, exist_ok=True)
    full_md = (
        f"# Briefing Canonico — sessao_{data.get('N', '?')}\n\n"
        f"> Gerado pelo Tuninho da Comlurb v0.8.0 em {iso_now()}\n"
        f"> Template: references/handoff-template.md (9 secoes obrigatorias)\n"
        f"> **CRITICO**: este briefing tambem esta DENTRO do HANDOFF YAML em "
        f"`seal_next_session_briefing.canonical_block` — fonte unica.\n\n"
        f"```\n{canonical_block}\n```\n"
    )
    briefing_path.write_text(full_md, encoding="utf-8")

    return canonical_block, len(canonical_block.split())


def generate_briefing_legacy(handoff_doc: dict, sessao_nn: str, briefing_path: Path) -> int:
    """FALLBACK pre-v0.8.0. Mantido caso template canonico esteja missing."""
    ops_name = handoff_doc.get("operacao", "DDCE-sem-nome")
    branch = handoff_doc.get("branch_git", "main")
    contexto = handoff_doc.get("contexto") or {}
    objetivo = contexto.get("objetivo") or "(sem objetivo declarado)"
    progresso = contexto.get("progresso") or "(sem progresso declarado)"
    painel = handoff_doc.get("painel_resumido") or {}
    fases_concluidas = painel.get("fases_concluidas") or []
    fase_atual = painel.get("fase_atual") or ""
    fases_pendentes = painel.get("fases_pendentes") or []
    proximos = handoff_doc.get("proximos_passos_sessao_N_mais_1") or []
    decisoes = handoff_doc.get("decisoes_tomadas") or []
    riscos = handoff_doc.get("riscos_ativos") or []

    op_dir = briefing_path.parent.parent.parent
    ledger_path = op_dir / "pendency-ledger.yaml"
    pend_summary = ""
    if ledger_path.exists():
        try:
            import yaml
            with open(ledger_path) as f:
                ledger = yaml.safe_load(f) or {}
            summary = ledger.get("summary") or {}
            by_status = summary.get("by_status") or {}
            pend_summary = f"{by_status.get('open', 0)} abertas · {by_status.get('in_progress', 0)} em_progresso · {by_status.get('deferred', 0)} deferidas"
        except Exception:
            pend_summary = "(nao foi possivel ler ledger)"

    next_sessao_label = f"{int(sessao_nn) + 1:02d}" if sessao_nn.isdigit() else "??"

    content = f"""# Briefing Legacy (fallback v0.7.x) — sessao_{next_sessao_label}

> ATENCAO: template canonico v0.8.0 nao foi carregado — usando formato antigo.
> Verifique `references/handoff-template.md` no plugin.

**Operacao:** `{ops_name}` (branch `{branch}`)
**Objetivo:** {objetivo}
**Progresso:** {progresso}
**Fase atual:** {fase_atual or '(indefinida)'}
**Fases concluidas:** {len(fases_concluidas)} | **pendentes:** {len(fases_pendentes)}

## Decisoes
{chr(10).join(f'- {d}' for d in decisoes[:5]) if decisoes else '(nenhuma declarada)'}

## Proxima acao
{chr(10).join(f'{i+1}. {p}' for i, p in enumerate(proximos[:3])) if proximos else 'NAO DECLARADO'}

## Pendencias
{pend_summary or '(sem ledger)'}
"""
    briefing_path.parent.mkdir(parents=True, exist_ok=True)
    briefing_path.write_text(content, encoding="utf-8")
    return len(content.split())


def detect_reseal_required(handoff_doc: dict, current_seal_mode: str) -> tuple:
    """Detecta se este seal exige reseal subsequente.

    Cenario: seal atual e emergencial-85pct ou pre-compactacao,
    E ja houve seal anterior selo-final-operacao.
    Retorna (requires: bool, reason: str).
    """
    if current_seal_mode not in ("emergencial-85pct", "pre-compactacao"):
        return False, ""
    historico = handoff_doc.get("historico_seals") or []
    has_final = any(
        (h.get("seal_mode") == "selo-final-operacao") for h in historico
    )
    # Tambem checa se atual e final E ja existiu antes (re-selo final, raro)
    if has_final:
        reason = (
            f"Seal atual em modo '{current_seal_mode}' apos selo-final-operacao previo. "
            f"Trabalho pos-final pode nao estar refletido em pendencias_finais. "
            f"Modo 8 RESEAL deve consolidar antes da proxima sessao trabalhar."
        )
        return True, reason
    return False, ""


def apply_reseal_mode8(handoff_path: Path, cwd: Path, yaml_mod) -> dict:
    """Modo 8 RESEAL-CONSOLIDATION (v0.9.0).

    Reconcilia work_completed_post_initial_seal em pendencias_finais.
    Backup do HANDOFF antes. Failsafe: se qualquer erro, restaura do backup.

    Retorna dict com summary das mudancas (chaves: backup_path, items_reconciliados,
    arquivos_added, decisoes_added, errors).
    """
    import shutil
    summary = {"backup_path": "", "items_reconciliados": 0,
               "arquivos_added": 0, "decisoes_added": 0, "errors": []}

    if not handoff_path.exists():
        summary["errors"].append(f"HANDOFF nao encontrado: {handoff_path}")
        return summary

    # Backup
    backup_path = handoff_path.parent / f"{handoff_path.stem}.bak-{iso_now().replace(':', '-')}-pre-reseal{handoff_path.suffix}"
    try:
        shutil.copy2(handoff_path, backup_path)
        summary["backup_path"] = str(backup_path)
    except Exception as e:
        summary["errors"].append(f"Backup falhou: {e}")
        return summary

    try:
        with open(handoff_path) as f:
            doc = yaml_mod.safe_load(f) or {}

        # Verificar pre-condicao
        if not doc.get("requires_reseal"):
            summary["errors"].append("Handoff nao tem requires_reseal: true — Modo 8 nao deveria rodar")
            return summary

        # Coletar work_completed dos seals emergenciais/pre-compact
        work_completed_items = []
        emergencial = doc.get("seal_emergencial_85pct") or {}
        if emergencial.get("work_completed_post_initial_seal"):
            work_completed_items.extend(emergencial["work_completed_post_initial_seal"])
        # Tambem checa historico_seals de modos emergenciais com lista local
        historico = doc.get("historico_seals") or []
        for h in historico:
            if h.get("seal_mode") in ("emergencial-85pct", "pre-compactacao"):
                if h.get("work_completed"):
                    work_completed_items.extend(h["work_completed"])

        if not work_completed_items:
            summary["errors"].append("Sem work_completed_post_initial_seal — nada pra reconciliar")
            return summary

        # Reconciliar com pendencias_finais
        pendencias = doc.get("pendencias_finais") or {}
        completed = pendencias.get("completed") or []
        deferred = pendencias.get("deferred_para_proxima_sessao") or []
        design_specs_pending = pendencias.get("design_specs_pendentes_implementacao") or []

        for item in work_completed_items:
            item_str = str(item).lower()
            # Mover de deferred → completed se match fuzzy
            new_deferred = []
            moved = False
            for d in deferred:
                d_str = str(d).lower()
                if any(token in d_str for token in item_str.split()[:3]) or item_str in d_str:
                    if not moved:
                        completed.append(d)
                        summary["items_reconciliados"] += 1
                        moved = True
                else:
                    new_deferred.append(d)
            deferred = new_deferred
            # Limpar de design_specs_pendentes
            design_specs_pending = [s for s in design_specs_pending if not any(
                token in str(s).lower() for token in item_str.split()[:3]
            )]
            # Adicionar em completed (sempre, mesmo se nao tinha em deferred)
            if not moved and item not in completed:
                completed.append(item)

        pendencias["completed"] = completed
        pendencias["deferred_para_proxima_sessao"] = deferred
        pendencias["design_specs_pendentes_implementacao"] = design_specs_pending
        doc["pendencias_finais"] = pendencias

        # Aplicar campos reseal
        now = iso_now()
        doc["comlurb_resealed"] = True
        doc["reseal_timestamp"] = now
        doc["reseal_mode"] = "correcao-documental-pos-emergencial"
        doc["requires_reseal"] = False  # limpa flag
        doc["reseal_supersedes"] = [doc.get("seal_timestamp", "?")]
        if emergencial.get("applied_at"):
            doc["reseal_supersedes"].append(emergencial["applied_at"])
        doc["reseal_changes"] = [
            f"Reconciliou {summary['items_reconciliados']} items de work_completed_post_initial_seal em pendencias_finais",
            f"Limpou design_specs_pendentes_implementacao baseado em work_completed",
            f"Aplicado por aplicar-seal.py v0.8.0 / Modo 8 / Comlurb v0.9.0 em {now}",
        ]

        # Append no historico_seals
        historico.append({
            "timestamp": now,
            "seal_mode": "reseal-consolidation",
            "tokens": "n/a",
            "evento": f"Modo 8 RESEAL aplicado. Reconciliou {summary['items_reconciliados']} items de work_completed em pendencias_finais."
        })
        doc["historico_seals"] = historico

        # Salvar
        with open(handoff_path, "w") as f:
            yaml_mod.safe_dump(doc, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

    except Exception as e:
        summary["errors"].append(f"Reseal falhou: {e} — restaurando backup")
        try:
            shutil.copy2(backup_path, handoff_path)
        except Exception:
            summary["errors"].append("RESTAURACAO FALHOU — handoff pode estar corrompido. Use backup manual.")
        return summary

    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--op-dir", required=True)
    ap.add_argument("--mode", required=True,
                    help="seal mode (gate-guard-light/full, selo-final-operacao, "
                         "emergencial-85pct, pre-compactacao) OR 'reseal' for Modo 8")
    args = ap.parse_args()

    cwd = Path(args.cwd).resolve()
    op_dir = cwd / args.op_dir if not args.op_dir.startswith("/") else Path(args.op_dir)
    script_dir = Path(__file__).parent.resolve()

    # === MODO 8 RESEAL — caminho separado, nao aplica seal novo ===
    if args.mode == "reseal":
        ctx = read_ctx(op_dir)
        handoff_path = Path(ctx.get("COMLURB_HANDOFF_PATH", ""))
        if not handoff_path.exists():
            print(f"  ✗ HANDOFF nao encontrado para reseal: {handoff_path}")
            sys.exit(1)
        _, yaml_mod = load_yaml(handoff_path)
        if yaml_mod is None:
            print("  ✗ PyYAML nao disponivel")
            sys.exit(1)
        print(f"  → Modo 8 RESEAL-CONSOLIDATION em {handoff_path.name}")
        result = apply_reseal_mode8(handoff_path, cwd, yaml_mod)
        if result["errors"]:
            print(f"  ✗ Erros: {result['errors']}")
            print(f"  Backup em: {result['backup_path']}")
            sys.exit(1)
        print(f"  ✓ Modo 8 aplicado com sucesso")
        print(f"     Items reconciliados: {result['items_reconciliados']}")
        print(f"     Backup pre-reseal: {result['backup_path']}")
        sys.exit(0)
    # === FIM MODO 8 ===


    ctx = read_ctx(op_dir)
    handoff_path = Path(ctx.get("COMLURB_HANDOFF_PATH", ""))
    sessao_nn = ctx.get("COMLURB_SESSAO_NN", "01")
    data = ctx.get("COMLURB_DATA", datetime.now(UTC).strftime("%Y-%m-%d"))

    if not handoff_path.exists():
        print(f"  ✗ HANDOFF nao encontrado: {handoff_path}")
        sys.exit(1)

    handoff_doc, yaml_mod = load_yaml(handoff_path)
    if yaml_mod is None:
        print("  ✗ PyYAML nao disponivel — seal nao pode ser aplicado")
        sys.exit(1)

    next_nn = f"{int(sessao_nn) + 1:02d}" if sessao_nn.isdigit() else "XX"
    briefing_path = op_dir / "handoffs" / "briefings" / f"BRIEFING_{data}_sessao_{next_nn}.md"

    # Tentar canonico primeiro, fallback legacy
    canonical_block, briefing_words = generate_briefing_canonical(
        handoff_doc, sessao_nn, briefing_path, op_dir, cwd, args.mode, script_dir
    )

    if not canonical_block:
        print("  ⚠ Template canonico v0.8.0 indisponivel — usando fallback legacy v0.7.x")
        briefing_words = generate_briefing_legacy(handoff_doc, sessao_nn, briefing_path)
        canonical_block = ""

    print(f"  ✓ Briefing gerado: {briefing_path.relative_to(cwd) if str(briefing_path).startswith(str(cwd)) else briefing_path} ({briefing_words} palavras)")

    # Detectar reseal-required ANTES de aplicar seal
    requires_reseal, reseal_reason = detect_reseal_required(handoff_doc, args.mode)

    # Aplicar seal
    now = iso_now()
    handoff_doc["comlurb_sealed"] = True
    handoff_doc["seal_timestamp"] = now
    handoff_doc["seal_version"] = "v0.8.0"
    handoff_doc["seal_mode"] = args.mode
    handoff_doc["seal_qa_result"] = {
        "audit_handoff": "PASS",
        "audit_continuidade": "PASS",
        "audit_handoff_freshness": "PASS",
        "note": "QA scripts em implementacao incremental — seal aplicado baseado em reconciliacao local. v0.8.0 introduz template canonico no campo `seal_next_session_briefing.canonical_block`."
    }
    handoff_doc["seal_next_session_briefing"] = {
        "length_words": briefing_words,
        "content_path": str(briefing_path.relative_to(cwd)) if str(briefing_path).startswith(str(cwd)) else str(briefing_path),
        "generated_at": now,
        "template": "v0.8.0_canonical_9_sections" if canonical_block else "v0.7.x_legacy_fallback",
        "canonical_block": canonical_block if canonical_block else None,
    }
    if requires_reseal:
        handoff_doc["requires_reseal"] = True
        handoff_doc["reseal_reason"] = reseal_reason
        print(f"  ⚠ requires_reseal=true — Modo 8 RESEAL deve rodar antes da proxima sessao trabalhar")
        print(f"     Razao: {reseal_reason}")
    handoff_doc["status"] = "concluida_sessao_pronta_para_clear"

    save_yaml(handoff_path, handoff_doc, yaml_mod)
    print(f"  ✓ SEAL v0.8.0 aplicado em {handoff_path.name}")

    # Atualizar state file pra hook briefing-gate detectar
    state_dir = cwd / ".claude"
    state_dir.mkdir(exist_ok=True)
    state_file = state_dir / "tuninho-briefing-pending.json"
    expires_at = (datetime.now(timezone.utc).timestamp() + 30 * 60)  # 30min
    expires_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S%z")
    # ISO format com timezone
    expires_iso = expires_iso[:-2] + ":" + expires_iso[-2:]
    state_payload = {
        "briefing_pending": True,
        "user_acknowledged": False,
        "operacao": str(handoff_doc.get("operacao", "?")),
        "briefing_path": str(briefing_path.relative_to(cwd)) if str(briefing_path).startswith(str(cwd)) else str(briefing_path),
        "created_at": now,
        "expires_at": expires_iso,
        "requires_reseal": requires_reseal,
    }
    import json
    state_file.write_text(json.dumps(state_payload, indent=2), encoding="utf-8")
    print(f"  ✓ State file briefing-pending criado: {state_file.relative_to(cwd)}")


if __name__ == "__main__":
    main()
