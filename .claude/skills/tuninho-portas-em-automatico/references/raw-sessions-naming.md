# Raw Sessions — Convencao de Naming

> Referencia usada por `scripts/coletar-raw-sessions.sh`.
>
> Define como os JSONLs de sessoes Claude Code sao copiados e nomeados em
> `_a4tunados/_operacoes/projetos/{NN}_*/handoffs/raw_sessions/`.

---

## Formato canonico

```
{YYYY-MM-DD}_sessao_{NN_inferido}_{primeiros_8_chars_uuid}.jsonl
```

**Exemplos**:
- `2026-04-13_sessao_01_2928f3e8.jsonl`
- `2026-04-13_sessao_02_1a01f248.jsonl`
- `2026-04-13_sessao_03_37d46b4e_partial.jsonl` (sessao em curso — opcional suffix `_partial`)
- `2026-04-14_sessao_04_a1b2c3d4.jsonl`

---

## Campos

### `YYYY-MM-DD`

Data de ultima modificacao do JSONL original (`mtime`). Permite ordenacao cronologica trivial via `ls`.

**Motivo**: JSONLs do Claude Code sao append-only durante a sessao. O mtime reflete o momento em que a sessao foi finalizada (pelo /clear ou session end).

**Edge case**: se a sessao foi interrompida abruptamente, o mtime pode estar incorreto. Aceitavel.

### `NN_inferido`

Numero da sessao, inferido cronologicamente dentro do contexto da operacao atual.

**Regra de inferencia (v0.1.0)**:
1. Lista todos os JSONLs do `~/.claude/projects/{slug}/` por mtime crescente
2. Conta 1, 2, 3... para cada arquivo
3. Assume que **todos** os JSONLs ordenados representam a operacao DDCE corrente

**Limitacoes conhecidas**:
- Se o projeto teve operacoes DDCE anteriores (Ops 1-22 no a4tunados_mural), os JSONLs dessas operacoes aparecem antes. A numeracao `sessao_01` pode nao corresponder a Op 23 sessao 01 — pode ser Op 22 sessao 5, por exemplo.
- Para a Op 23 especificamente (caso de teste da v0.1.0), a numeracao manual foi feita e corresponde corretamente.

**Solucao v0.2.0**: derivar `NN_inferido` via inspecao do JSONL (parse de `cwd`, `prompt`, `session_id`) em vez de mtime + posicao. Requer parsing de JSONL em bash (custoso) ou em Python (mais limpo — mover script para Python).

### `primeiros_8_chars_uuid`

Primeiros 8 caracteres do UUID original do JSONL. Permite identificacao 1:1 com o arquivo em `~/.claude/projects/{slug}/`.

**Exemplo**:
- Original: `~/.claude/projects/-Users-vcg-development-a4tunados-a4tunados-mural/2928f3e8-7c50-4ca7-b56b-eba4a38b8903.jsonl`
- Copia: `handoffs/raw_sessions/2026-04-13_sessao_01_2928f3e8.jsonl`

### Suffix `_partial` (opcional)

Quando a sessao em curso e copiada (sessao corrente, que ainda nao terminou), adicionar `_partial` ao final do nome antes da extensao.

**Motivo**: distinguir entre snapshots completos (sessoes finalizadas) e snapshot parcial (sessao em execucao). Um snapshot `_partial` pode ser **sobrescrito** pela versao final quando a sessao encerrar.

**Exemplo**:
- Durante a sessao 03 em execucao: `2026-04-13_sessao_03_37d46b4e_partial.jsonl`
- Apos a sessao 03 encerrar: `2026-04-13_sessao_03_37d46b4e.jsonl` (sobrescreve)

---

## Pasta por environment (multi-machine)

Quando o operador usa multiplos computadores para o mesmo projeto, cada maquina tem seus proprios JSONLs. A estrutura reserva subpastas por environment:

```
handoffs/raw_sessions/
├── 2026-04-13_sessao_01_{uuid}.jsonl              ← maquina corrente (sem subdir)
├── 2026-04-13_sessao_02_{uuid}.jsonl
├── env-macbook-vcg/                                ← outra maquina (opcional)
│   ├── 2026-04-13_sessao_01_{uuid}.jsonl
│   └── ...
├── env-hostinger-alfa-dev/
│   └── ...
└── plan_files/
    └── ...
```

**v0.1.0**: nao implementa multi-machine. So copia da maquina corrente.

**v0.2.0**: implementar detecao de environment via `_a4tunados/local-machine.json` ou convencao.

---

## Idempotencia

O script verifica se o JSONL ja foi copiado antes de duplicar:

```bash
EXISTING=$(find "$DEST_DIR" -maxdepth 1 -name "*_${UUID_SHORT}.jsonl" -o -name "*_${UUID_SHORT}_partial.jsonl" | head -1)
if [[ -n "$EXISTING" ]]; then
  SKIPPED=$((SKIPPED + 1))
  continue
fi
```

O match e feito por `{UUID_SHORT}` — se dois JSONLs diferentes tiverem os mesmos 8 primeiros caracteres de UUID (colisao astronomicamente improvavel), o segundo nao sera copiado. Aceitavel para v0.1.0.

---

## Imutabilidade

Por convencao, JSONLs copiados em `handoffs/raw_sessions/` sao IMUTAVEIS. A skill NAO aplica `chmod a-w` para permitir overwrite em edge cases (ex: recriacao de sessao com mesmo UUID).

A convencao e respeitada por:
- Operador (nao editar manualmente)
- Scripts (so copiam, nunca editam)
- tuninho-qa (audita, nao modifica)
- git (commita junto com o HANDOFF)

---

*Parte da skill tuninho-portas-em-automatico v0.1.0*
