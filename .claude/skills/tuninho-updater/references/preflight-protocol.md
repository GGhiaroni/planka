# Preflight Protocol — Verificacao Express de Atualizacao

> Protocolo padrao para todas as skills a4tunados. Executado ANTES do fluxo principal.
> Custo: 1 request HTTP (<1KB) + 1 grep local. Tempo: ~1-2 segundos.

---

## Protocolo

### Passo 1: Buscar versoes remotas (1 request HTTP via gh API)

O repo e **privado**, portanto `raw.githubusercontent.com` NAO funciona.
Usar a GitHub API autenticada via `gh`:

```bash
gh api repos/victorgaudio/a4tunados-ops-suite/contents/manifest.json --jq '.content' 2>/dev/null | base64 -d
```

Tempo medido: ~0.35 segundos. Se falhar (gh nao autenticado, sem internet): **prosseguir silenciosamente** — a verificacao NAO deve bloquear o fluxo.

### Passo 2: Extrair versoes locais

```bash
for f in .claude/skills/tuninho-*/SKILL.md; do
  skill=$(basename $(dirname "$f"))
  ver=$(grep -m1 'v[0-9]*\.[0-9]*\.[0-9]*' "$f" | sed -n 's/.*\(v[0-9]*\.[0-9]*\.[0-9]*\).*/\1/p')
  echo "$skill:$ver"
done
```

### Passo 3: Comparar e decidir

Para cada skill presente no manifest remoto E instalada localmente:
- Extrair `version` do JSON remoto para aquela skill
- Comparar com versao local do H1

**Se TODAS iguais ou locais mais novas** → prosseguir silenciosamente (ZERO output ao operador).

**Se alguma remota > local** → mostrar aviso compacto:

```
ops-suite: atualizacoes disponiveis

| Skill             | Local  | Remoto |
|-------------------|--------|--------|
| tuninho-escriba   | v2.0.0 | v2.1.0 |
| tuninho-ddce      | v1.4.0 | v1.5.0 |

Atualizar agora antes de prosseguir? (s/n)
```

- **"s"**: executar pull do updater (Etapa 0 + pull), depois retornar ao fluxo original da skill
- **"n"**: prosseguir sem atualizar — registrar internamente que foi recusado (nao perguntar de novo na mesma conversa)

---

## Regras

1. **Fail-safe** — se `gh api` falhar (auth, rede), seguir sem verificar
2. **NAO clonar, NAO fazer git fetch** — apenas 1 GET do manifest.json via GitHub API (`gh api`)
3. **NAO mostrar nada se tudo estiver atualizado** — zero friccao no caso comum
4. **NAO bloquear o fluxo** — se a verificacao falhar por qualquer motivo, prosseguir
5. **NAO perguntar duas vezes** na mesma conversa — se o operador disse "n", respeitar
6. **Skill-invocante e soberana** — o preflight e um servico, nao um desvio. Apos o preflight (com ou sem update), o fluxo da skill invocada continua normalmente
