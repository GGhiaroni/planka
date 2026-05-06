# Sidecar — Regras de versionamento tuninho-ai @ hostinger-beta

> **Criado em**: 2026-04-25 (Card 1760962183182681367 — pedido explicito do operador)
> **Aplica-se a**: tuninho.ai (este projeto). Outros projetos podem ter regras proprias.

## Regra geral

**Bumps de versao do `package.json` sao decisao do operador, nao do agente.**
Operador definiu que enquanto estamos no escopo da v0.5.x, **toda mudanca e
patch incremental** (v0.5.0 → v0.5.1 → v0.5.2 → ...). Bump minor (v0.5.x → v0.6.0)
ou major (v0.6.x → v1.0.0) **so apos autorizacao explicita do operador**.

## Como aplicar (em qualquer skill que mexa em version: DDCE Etapa 15, devops, escriba)

1. **Antes de editar `package.json`**, ler o ultimo entry valido em `CHANGELOG.md`
   e o `version` corrente em `package.json`.
2. **Default = bump patch**: se ultima publicada foi v0.5.x, proxima e v0.5.x+1.
3. **Bump minor/major exige confirmacao expressa do operador na sessao**.
   Em modo autonomo card-isolated, **nao bumpar minor sem evidencia de autorizacao**
   (ex: comentario do operador no card dizendo "ok pode subir pra v0.6"). Se nao houver,
   manter em patch.
4. **Hotfix tambem e patch** (v0.5.2 → v0.5.3 etc), nao reseta a sequencia.
5. **Cada PR card-isolated cria 1 patch** mesmo que a operacao tenha varios commits.
   Ou seja: 1 card → 1 bump patch (ou nenhum, se for so doc/chore).

## Erro historico (lesson learned)

Card 1760962183182681367 originalmente fez bump v0.5.0 → v0.6.0 (minor) sem autorizacao
do operador. Operador corrigiu e pediu renumeracao retroativa para v0.5.1 + sidecar
documentando a regra. Veja CHANGELOG.md historico:

- v0.5.1 (era v0.6.0) — Card 1760962183182681367 entrega original (textarea autosize +
  description no topo + 5→9 tools regex)
- v0.5.2 (era v0.6.1) — Card 1760962183182681367 hotfix pos-validacao 1
  (placeholders limpos + regex permissivas com artigo + LLM context catalog)
- v0.5.3 — Card 1760962183182681367 hotfix pos-validacao 2 em curso
  (plan-then-execute + markdown chat + Opus 4.7 default)

> Os deploys hostinger-beta com badge "0.6.0" e "0.6.1" sao logs imutaveis e nao
> sao editados retroativamente — apenas o produto vivo (a partir do proximo deploy)
> usa o numero corrigido v0.5.x.

## Aplicabilidade cruzada

Este sidecar e lido por:
- `tuninho-ddce` na Etapa 15 (Changelog + bump)
- `tuninho-devops-hostinger` no Stage 0 (Risk analysis registra versao alvo)
- `tuninho-escriba` ao popular vault `docs_tuninho.ai/changelog.md`

Skills que nao verificam este sidecar antes de bumpar version sao consideradas
**fora de compliance** e devem ser bumpadas para incorporar a leitura.
