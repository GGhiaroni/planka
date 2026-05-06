# audit-card-isolation — Sub-check do QA v0.7.2

Novo sub-check invocado dentro de `audit-gate-final` (modo 9) QUANDO o contrato
da operacao e `card-isolated` (tipo multi-skill, gerado via
`contract-card-isolated-template.yaml`).

## Quando e invocado

- Automaticamente por `audit-gate-final` se detectar `contract.contracted: "multi"`
  E `contract.id` bate com padrao `card-{cardIdShort}-isolated-*` em
  `_a4tunados/_operacoes/cards/{cardId}_*/contracts/card-isolated-contract.yaml`
- Manualmente: `Skill: tuninho-qa, args: "audit-card-isolation --contract {path}"`

## Status: BLOCKING

Se FAIL, o `audit-gate-final` NAO pode passar. OBL-QA-CARD-ISOLATION do
contrato fica PENDING, compliance_pct < 100%, DDCE/fix-suporte nao pode
prosseguir para OBL-COMLURB-SEAL.

## Criterios de validacao (4 obrigatorios)

### 1. Branch matches regex

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ ! "$BRANCH" =~ ^card/(feat|fix)/[a-z0-9-]{1,40}-[0-9]{6}$ ]]; then
  echo "[FAIL] Branch '$BRANCH' nao bate com padrao card/(feat|fix)/{slug}-{id6}"
  exit 1
fi
```

**Motivacao**: evitar que fluxo card-isolated rode em branch fora do padrao.
Branch mal-nomeada quebra rastreabilidade (hook inicio-sessao nao consegue
detectar, escriba nao grava em cards/, etc).

### 2. Contract compliance_pct == 100%

```python
import yaml
contract = yaml.safe_load(open(contract_path))
summary = contract["summary"]
if summary["compliance_pct"] != "100%":
    print(f"[FAIL] compliance {summary['compliance_pct']}, esperado 100%")
    print(f"       blocking_pending: {summary['blocking_pending']}")
    # listar quais obrigations estao PENDING
    for obl in contract["obligations"]:
        if obl["status"] == "PENDING" and obl.get("blocking"):
            print(f"       - {obl['id']}: {obl.get('mode')}")
    exit(1)
```

**Motivacao**: garantir que TODAS as obrigations blocking foram DELIVERED
antes de fechar o card. Diferente do `audit-contract-compliance` generico,
este sub-check lista as pendentes para debug imediato.

### 3. Diff toca somente `allowed_paths`

```bash
git diff develop...HEAD --name-only > /tmp/changed-files.txt

# Ler allowed_paths do contrato
PATHS=$(yq -r '.allowed_paths[]' $CONTRACT_PATH)

# Para cada arquivo modificado, verificar se bate com algum allowed_path
while IFS= read -r file; do
    matched=false
    while IFS= read -r pattern; do
        # Expandir {CARD_ID} no pattern com o cardId do contrato
        expanded=$(echo "$pattern" | sed "s|{CARD_ID}|$CARD_ID|g")
        if [[ "$file" == $expanded* ]] || [[ "$file" == $expanded ]]; then
            matched=true
            break
        fi
    done <<< "$PATHS"

    if [ "$matched" = "false" ]; then
        echo "[FAIL] arquivo fora de allowed_paths: $file"
        exit 1
    fi
done < /tmp/changed-files.txt
```

**Motivacao**: previne que fluxo card-isolated toque arquivos fora do
escopo (ex: outras skills, outros projetos em monorepo, configuracoes
globais). `allowed_paths` do contrato e whitelist explicita; qualquer
expansao deve ser documentada como amendment.

**Casos comuns que passam**:
- `src/`, `tests/`, `docs/`, `public/`, `scripts/`
- `_a4tunados/_operacoes/cards/{CARD_ID}_*/`
- `_a4tunados/docs_*/cards/{CARD_ID}_*/`
- `next-env.d.ts`, `package*.json` (auto-gerados)

**Casos que falham**:
- `.claude/skills/*/SKILL.md` (skill sem bump pertence a outra operacao)
- `_a4tunados/_operacoes/projetos/*/` (card-isolated nao deve criar projeto)
- `/etc/nginx/*` (fora do escopo)

### 4. Develop intacto

```bash
# A branch card/* deve estar ADIANTE de develop (mais commits), nao ATRAS.
AHEAD=$(git rev-list --count develop..HEAD)
BEHIND=$(git rev-list --count HEAD..develop)

if [ "$AHEAD" -eq 0 ]; then
    echo "[FAIL] branch card/* nao tem commits propios (AHEAD=0)"
    echo "       algo esta errado — operacao foi documentada?"
    exit 1
fi

if [ "$BEHIND" -gt 0 ]; then
    echo "[WARN] branch card/* esta $BEHIND commits atras de develop"
    echo "       considere rebase para manter alinhamento (nao blocking)"
fi

# develop nao pode ter sido tocado pela branch card/*
# (git log develop..HEAD mostra commits NOVOS em HEAD nao em develop — OK)
# (git log HEAD..develop == 0 significa HEAD contem develop full — OK)
# Nao ha caso de "develop foi modificado" porque develop local e reset em
# git fetch; o check importante e garantir que AHEAD >= 1.
```

**Motivacao**: detectar branches card/* vazias (erro de fluxo) ou que
estejam desatualizadas em relacao a develop (indica que operador esqueceu
rebase — nao blocking, apenas warning).

## Output

Em caso de PASS, gravar em `_a4tunados/_operacoes/cards/{cardId}_*/qa/audit-card-isolation-{ts}.md`:

```markdown
# audit-card-isolation — PASS

**Contract**: `{path}`
**Branch**: `{branch}` (AHEAD={N}, BEHIND={M})
**compliance_pct**: 100%
**Files changed**: {count} (todos dentro de allowed_paths)
**Executed at**: {ISO_TS}

## Criterios

- [x] Branch regex match
- [x] Contract compliance 100%
- [x] Diff within allowed_paths ({count} files checked)
- [x] develop intacto (AHEAD=1+, HEAD contains full develop)

## Allowed paths aplicados

- {list}

## Files changed

- {list}
```

Em caso de FAIL, escrever mesmo arquivo com status FAIL + linha falhada +
sugestao de correcao. O DDCE/fix-suporte le este arquivo e trata conforme:
- Se FAIL em "branch regex": aborta, operador deve refazer branch
- Se FAIL em "compliance": lista pending obligations, retenta delivery
- Se FAIL em "allowed_paths": lista arquivos ofensivos, operador decide
  (a) adicionar amendment ao contrato expandindo allowed_paths OU
  (b) reverter os arquivos com `git checkout -- {file}`
- Se FAIL em "develop intacto": aborta, investigar git state

## Integracao com OBL-QA-CARD-ISOLATION

Este sub-check e a entrega da obligation `OBL-QA-CARD-ISOLATION` no contrato.
Delivery:

```yaml
delivery:
  timestamp: "{ISO_TS}"
  result: PASS | FAIL
  artifacts:
    - "_a4tunados/_operacoes/cards/{cardId}_*/qa/audit-card-isolation-{ts}.md"
  gaps_found: {N}
  gaps_blocking: {N}
  notes: "{resumo curto se FAIL}"
  re_invocations: {counter}
```

## Versionamento

- **v0.7.2** (2026-04-22): Sub-check inicial, parte da Op 04 card-isolated.
  Incorpora aprendizados da Op 03 go-live sobre Contract Pattern.
