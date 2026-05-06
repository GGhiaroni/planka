#!/usr/bin/env python3
"""
manifest-sync.py — Op 07 T3.1+T3.2

Sincroniza _operacoes/cards/cards-manifest.json com diretórios em
_operacoes/cards/. NÃO sobrescreve campos enriquecidos (titulo, mural_url,
heuristic_*, etc); apenas adiciona entries para cards no FS sem entry no
manifest, e flagga manifest entries sem dir correspondente.

Uso:
  python3 manifest-sync.py [--dry-run]
"""
import json, os, sys, re
from datetime import datetime, timezone

ROOT = "_a4tunados/_operacoes/cards"
MANIFEST = f"{ROOT}/cards-manifest.json"

def main():
    dry_run = "--dry-run" in sys.argv
    if not os.path.exists(MANIFEST):
        manifest = {"version": "1.0", "updated_at": datetime.now(timezone.utc).isoformat(), "cards": {}}
    else:
        with open(MANIFEST) as f:
            manifest = json.load(f)
    cards_dict = manifest.setdefault("cards", {})

    # Scan FS
    fs_ids = {}
    for d in sorted(os.listdir(ROOT)):
        path = f"{ROOT}/{d}"
        if not os.path.isdir(path):
            continue
        # Extrai card_id (até primeiro _)
        m = re.match(r"^(\d+)_(.*)$", d) or re.match(r"^(\d+)$", d)
        if m:
            cid = m.group(1)
            slug = m.group(2) if len(m.groups()) > 1 else ""
        else:
            cid = d
            slug = ""
        fs_ids[cid] = (slug, path)

    # Detectar diffs
    added = []
    orphaned = []

    for cid, (slug, path) in fs_ids.items():
        if cid not in cards_dict:
            # Card no FS sem entry — criar entry mínima
            entry = {
                "titulo": slug.replace('-', ' ').title() or "Sem título",
                "slug": slug,
                "operacoes": [],
                "has_original": any(f.startswith("original_") for f in os.listdir(path) if os.path.isfile(f"{path}/{f}")),
                "has_results": any(f.startswith("results_") for f in os.listdir(path) if os.path.isfile(f"{path}/{f}")),
                "last_status": "UNKNOWN",
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "added_by": "manifest-sync.py (Op 07 T3.2)",
            }
            # Tenta ler contract para enriquecer
            cyaml = f"{path}/contracts/card-isolated-contract.yaml"
            if os.path.exists(cyaml):
                try:
                    with open(cyaml) as f: y = f.read()
                    if "status: ACTIVE" in y: entry["last_status"] = "ACTIVE"
                    elif "status: FULFILLED" in y: entry["last_status"] = "FULFILLED"
                    elif "status: BREACHED" in y: entry["last_status"] = "BREACHED"
                except Exception: pass
            added.append((cid, entry))
            cards_dict[cid] = entry

    for mid in list(cards_dict.keys()):
        if mid not in fs_ids:
            orphaned.append(mid)
            cards_dict[mid]["orphaned_from_fs"] = True

    # Update timestamp
    manifest["updated_at"] = datetime.now(timezone.utc).isoformat()

    print(f"=== manifest-sync ===")
    print(f"FS cards: {len(fs_ids)}")
    print(f"Manifest cards: {len(cards_dict)}")
    print(f"Added (FS sem entry): {len(added)}")
    for cid, e in added: print(f"  + {cid} ({e['slug']}) status={e['last_status']}")
    print(f"Orphaned (manifest sem FS): {len(orphaned)}")
    for o in orphaned: print(f"  ! {o}")

    if dry_run:
        print("\n(dry-run — manifest NÃO salvo)")
        return 0

    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo em {MANIFEST}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
