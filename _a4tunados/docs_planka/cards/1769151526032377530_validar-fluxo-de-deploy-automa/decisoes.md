---
title: "Decisoes — Card 377530"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/active
date: 2026-05-06
version: "1.0"
related:
  - "[[sessoes/2026-05-06_01_card-377530-validar-deploy]]"
  - "[[../../decisoes/ADR-001-deploy-staging-cicd]]"
---

# Decisoes — Card 377530

## D1 — Modo pragmatico conversacional aceitavel

**Status**: aceita

**Contexto**: card-isolated detectado, mas hook avisou MODO PRAGMATICO porque
`_a4tunados/_operacoes/cards/` nao existia (sem rastreabilidade DDCE formal).
Operador estava presente, comunicando objetivo a cada turno via mural. Plano emergiu
durante a conversa em vez de DEFINE rigoroso pre-execucao.

**Decisao**: prosseguir em modo pragmatico, com transparencia total via mural a cada
passo significativo. Nao invocar `tuninho-ddce --card-isolated` para uma investigacao
+ fix de servico ja deployado.

**Alternativa rejeitada**: invocar DDCE expansivo. Custo: muita ceremonia pra um
escopo que cabe em 1 sessao com operador on-call. Beneficio (rastreabilidade) era
substituivel pelo proprio mural log + escriba final.

**Consequencia**: auditoria objetiva via contrato YAML nao existe. Compensado por
documentacao Escriba completa pos-fato (este vault) + comments narrativos no card.

---

## D2 — Cores das 8 labels: paleta padrao Planka inferida

**Status**: aceita

**Contexto**: operador autorizou criar labels mas nao especificou cores. Planka tem
42 cores nomeadas em `server/api/models/Label.js:1-42`.

**Decisao**: mapeamento intuitivo prioridade → cor, sem perguntar:

| Prioridade | Cor escolhida | Racional |
|------------|---------------|----------|
| BAIXA PRIORIDADE | fresh-salad (verde claro) | semaforo verde |
| MEDIA GRAVIDADE | egg-yellow (amarelo) | semaforo amarelo |
| URGENCIA | pumpkin-orange (laranja) | semaforo amarelo+ |
| EM TRATAMENTO | lagoon-blue (azul) | em andamento, neutro |
| ATUALIZACAO DO TRATAMENTO | antique-blue (azul claro) | sub-status do tratamento |
| PENDENCIAS DE INSTALACAO | desert-sand (bege) | pendente, neutro |
| EM ESPERA | muddy-grey (cinza) | inativo |
| MAXIMA PRIORIDADE | berry-red (vermelho) | urgencia maxima |

**Alternativa rejeitada**: perguntar ao operador. Pra um detalhe ajustavel a qualquer
momento via UI Planka, a pergunta nao agregava valor.

**Consequencia**: se operador nao gostar da paleta, troca em 30s pela UI Planka.
Ids dos labels nao mudam, `.env` continua valido.

---

## D3 — Fix `description` vazia: omitir campo em vez de mandar `null`

**Status**: aceita

**Contexto**: Planka rejeita `description: ""` com `E_MISSING_OR_INVALID_PARAMS`.
3 abordagens possiveis:
1. Mandar `description: null`
2. Omitir o campo do body quando vazio
3. Mandar string com 1 char (ex: " ")

**Decisao**: opcao 2 — omitir do body. `planka.js`:

```js
const body = { type: 'project', name, position: 65536 };
if (descricao && String(descricao).trim().length > 0) {
  body.description = descricao;
}
```

**Alternativa rejeitada (1 — null)**: nao testei se Planka aceita null em vez de
empty string. Risco. Omitir e mais defensivo.

**Alternativa rejeitada (3 — placeholder)**: poluir cards com " " ou similar. Hack.

**Consequencia**: cards criados pelos forms agora tem `description: null` no Planka
quando o handler nao gera descricao. Display no UI: campo descricao vazio (esperado).

---

## D4 — `scripts/deploy.sh` rebuild ticket-form sempre

**Status**: aceita

**Contexto**: original `deploy.sh:62` fazia `docker compose ... up -d --no-deps
ticket-form` SEM `--build`. Como `ticket-form` tem `build: context: ./ticket-form`
no compose, sem `--build` o codigo novo (rsync'd para `/opt/hostinger-beta/planka/
ticket-form/src/`) nunca chega no container.

**Decisao**: trocar `up -d --no-deps ticket-form` por `up -d --build --no-deps
ticket-form`. Cache de build resolve quando nao mudou nada.

**Alternativa rejeitada**: detectar se `ticket-form/src/**` mudou via `git diff` e
condicionar o build. Mais complexo, fragil. Build rapido (1-2s cacheado) torna a
otimizacao pre-matura.

**Consequencia**: deploy fica ~1-3s mais lento em runs onde nada do ticket-form
mudou (cache hit). Beneficio: deploys que mexem em ticket-form pegam o codigo novo
deterministicamente.

---

## D5 — Cherry-pick em vez de merge para `deploy/staging`

**Status**: aceita

**Contexto**: branch `deploy/staging` estava em `373e3149` (PR #2 Op 01 inicial)
enquanto `master` estava 4 commits a frente em `a427d40b` (Op 01 vault + sidecar
results + comlurb seal). Pra deployar o fix `121c571d` (planka.js), 2 caminhos:

1. `git checkout deploy/staging && git merge develop` — arrasta toda Op 01 vault pra
   staging branch.
2. Cherry-pick cirurgico do commit do fix.

**Decisao**: cherry-pick. Resultado: `deploy/staging` ficou em
`4029bfb2` (= `373e3149` + `4029bfb2 fix planka.js`). Sem trazer Op 01 vault.

**Alternativa rejeitada**: merge develop. `_a4tunados/` e excluido do rsync entao
servidor nao se importaria, mas a branch `deploy/staging` ficaria com historia
poluida. Cherry-pick e mais limpo pra preservar `deploy/staging` como linha-de-vida
production-only.

**Consequencia**: a branch `deploy/staging` agora tem commits exclusivos
(`4029bfb2`, `48ec0cb7`, `310d47e2`) que nao existem em `develop`/`master`. Pra
sincronizar, fluxo `git-flow d'a4` a seguir vai cherry-pick'ar/mergear esses na
develop tambem.

---

## D6 — Deploy manual via SSH+rsync+deploy.sh enquanto Actions estava inativo

**Status**: aceita

**Contexto**: workflow `.github/workflows/deploy-staging.yml` ainda nao instalado
(meu token sem scope `workflow`). Push pra `deploy/staging` nao trigga nada.

**Decisao**: reproduzir manualmente o que Actions FARIA — exatamente o que esta no
template:

```bash
rsync -avz --delete --exclude=... ./ root@76.13.239.198:/opt/hostinger-beta/planka/
ssh root@76.13.239.198 "bash /opt/hostinger-beta/planka/scripts/deploy.sh"
```

**Alternativa rejeitada**: esperar operador autorizar gh auth refresh antes de
deployar. Atrasaria validacao desnecessariamente. Operador queria validacao
imediata.

**Consequencia**: validacao end-to-end dos forms aconteceu ANTES do workflow Actions
estar funcional. Quando workflow foi ativado, primeiro run real (`25457526463`)
serviu como segunda validacao independente — confirmou que reproducao manual era
fiel ao que Actions faria.
