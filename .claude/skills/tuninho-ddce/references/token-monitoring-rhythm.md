# Token Monitoring Rhythm — Reference Técnica (Regra Inviolável #54)

> Adotado em Op 17 (a4tunados_web_claude_code, 2026-05-02). Padrão em TODAS as operações DDCE doravante.

## Por que existe

Operador relatou que ao chegar próximo do limite Claude Code (85%), Comlurb era invocada em modo emergencial e o handoff resultante era de qualidade inferior. Operações multi-sessão tinham continuidade não-fluida.

Solução: monitoramento ativo desde o início da operação com thresholds explícitos. Para evitar emergencial, definir teto operacional ANTES do limite hard.

## Thresholds canônicos

| Threshold | Valor | Ação |
|---|---|---|
| INFO | 60% | Log informativo (sem ação) |
| WARN | **70%** | Pausa pra avaliar com operador |
| STOP | **75%** | Comlurb gate-guard-full obrigatório |
| Buffer Comlurb | 8% (75→83%) | Margem pra Comlurb operar (ritual completo + seal + briefing) |
| Hard limit Claude | 85% | Bloqueio nativo do Claude Code |

Cálculo: 75% + 8% = 83%, ainda 2% abaixo do hard limit. Comlurb tem espaço pra rodar sem ser bloqueada.

## Cálculo via JSONL

Cada sessão Claude Code mantém um JSONL em `~/.claude/projects/{slug}/{uuid}.jsonl`. Cada entry tem `message.usage` com tokens consumidos.

### Snippet canônico (bash + python)

```bash
JSONL=$(ls -t ~/.claude/projects/-$(echo "$PWD" | sed 's|/|-|g; s|^-||')/*.jsonl 2>/dev/null | head -1)
python3 -c "
import json
with open('$JSONL') as f:
    lines = f.readlines()[-200:]
latest = None
for line in lines:
    try:
        d = json.loads(line.strip())
        u = d.get('message',{}).get('usage')
        if u and not d.get('isSidechain') and d.get('timestamp','') > (latest or ('',''))[1]:
            latest = (u, d['timestamp'])
    except: pass
if latest:
    u = latest[0]
    inp = u.get('input_tokens',0)
    cr = u.get('cache_read_input_tokens',0)
    cc = u.get('cache_creation_input_tokens',0)
    total = inp + cr + cc
    pct = (total / 1_000_000) * 100
    print(f'TOKENS: {total:,} ({pct:.2f}%)')
    print(f'WARN 70% em {(700000-total):,} ({70-pct:.2f}pp)')
    print(f'STOP 75% em {(750000-total):,} ({75-pct:.2f}pp)')
"
```

`isSidechain: True` indica sub-agent — excluir pra contar só tokens da sessão principal.

Total = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. Esses 3 são input tokens contados no contexto.

`output_tokens` é separado (não conta no contexto da próxima request).

Modelo Claude Code default é Opus 4.7 com janela de **1M tokens**. Calcular % como `total / 1_000_000`.

## Cadência de reports

Em ops formais (17 etapas):

| Ponto | Report |
|---|---|
| Início Etapa 1 (após captura baseline) | Etapa 0.5 NOVA — declarar baseline + thresholds |
| Pós Etapa 5 (GATE DISCOVER) | "% atual, delta DISCOVER, projeção DEFINE+EXECUTION" |
| Pós Etapa 8 (GATE DEFINE) | Idem com delta DEFINE |
| Pós cada Etapa 14 (GATE FASE) | Idem com delta da fase |
| Pós Etapa 16 (GATE FINAL) | Final report + decisão Comlurb |

Em modo `--lite`:
- Baseline declarado no início
- Report a cada gate condensado (DISCOVER lite, DEFINE lite, EXECUTION light)
- Mesmos thresholds aplicáveis

Em retomada (`/ddce-continuar`):
- Capturar baseline na retomada (sessão zerada começa em ~14% por causa do contexto inicial Claude Code + skills carregadas)
- Reportar baseline ao operador como referência

## Exemplo de declaração Etapa 0.5

```markdown
🎯 Token Monitoring Rhythm (Regra Inviolável #54)

| Métrica | Valor |
|---|---|
| Baseline | 135.191 tokens (13.52%) |
| WARN 70% em | 56.48pp |
| STOP 75% em | 61.48pp |
| Buffer Comlurb | 8% (até 83%) |
| Cadência | Report a cada gate (DISCOVER → DEFINE → cada FASE → FINAL) |

Vou reportar % atual e delta a cada transição. Ao 70%, pausamos pra avaliar.
Ao 75%, invoco Comlurb gate-guard-full automaticamente pra encerrar sessão limpa.
```

## Ações automáticas em cada threshold

### Em INFO (60%)
- Apenas log no canal de status
- Sem prompt operador

### Em WARN (70%)
- Output explícito: "⚠ Atingi 70% (WARN). Projeção até STOP: {X}pp."
- Listar trabalho restante + estimativa
- Perguntar: "Continuar ou Comlurb agora?"

### Em STOP (75%)
- Output: "⛔ STOP 75% atingido. Invocando Comlurb gate-guard-full."
- Invocar: `Skill tool: tuninho-da-comlurb, args: "--mode gate-guard-full"`
- Comlurb v0.8.0+ gera HANDOFF canônico
- Após seal: encerrar sessão com instrução ao operador pra retomar

### Em emergencial (85% hard limit)
- Bloqueio nativo Claude Code ativa
- Comlurb v0.7.1+ tem Modo 5 (emergencial 85%) — fallback se STOP 75% foi pulado
- Hook conta-token v5.1.0 já cobre essa rede de segurança via whitelist seletivo

## Ferramentas de apoio

- `tuninho-hook-conta-token` v5.1.0+ — monitora tokens em background, dispara alertas em INFO/AVISO/COMLURB/URGENTE
- `tuninho-da-comlurb` v0.8.0+ — orquestra ritual de selo no STOP/emergencial
- `tuninho-portas-em-automatico` v0.5.0+ Resp 12 (futuro) — pode validar baseline coletada na retomada

## Anti-padrões rejeitados

❌ "Vou continuar e ver o que dá" — sem baseline, sem reports, sem thresholds
❌ "Otimizar tokens não importa, opera normal" — bypass da regra (operador pode autorizar pontualmente, mas regra default é monitorar)
❌ Pular declaração da Etapa 0.5 — operador perde visibilidade
❌ Não invocar Comlurb em STOP 75% — vira emergencial, qualidade do handoff cai

## Origem canônica (Op 17)

Op 17 implementou rhythm experimentalmente em ~3-4 sessões de trabalho. Operador validou empiricamente ("adorei") e formalizou como padrão. Bump v4.10.0 incorpora.

Métricas reais Op 17:
- DISCOVER: 13.52% → 37.25% (delta 23.73pp)
- DEFINE: 37.25% → 42.72% (delta 5.47pp)
- EXECUTION (F1-F6 + design F7+F8): 42.72% → ~63% (delta ~20pp)
- Comlurb gate-guard-full: ~63% → ~70% (delta ~7pp)
- Sessão encerrada bem abaixo do limit, com handoff fluido pra próxima sessão (F7 push real + F8 E2E)
