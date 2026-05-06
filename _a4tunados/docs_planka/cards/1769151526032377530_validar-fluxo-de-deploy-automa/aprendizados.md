---
title: "Aprendizados — Card 377530"
tags:
  - a4tunados
  - tuninho/escriba
  - type/decision
  - status/active
date: 2026-05-06
version: "1.0"
related:
  - "[[sessoes/2026-05-06_01_card-377530-validar-deploy]]"
  - "[[decisoes]]"
---

# Aprendizados — Card 377530

## L1 — Op 01 deixou template do workflow mas nao ativou

Op 01 documentou em `DEPLOY-STAGING.md:14`:
> GitHub Actions detecta o push, faz rsync + build + restart + smoke automatico.

Mas o workflow ficou em `docs/deploy-staging.workflow.yml.template` e nunca foi
copiado pra `.github/workflows/`. Operador nao percebeu durante validacao porque
nunca pushou pra `deploy/staging` ate este card.

**Aplicacao futura**: na proxima Op de "ativar fluxo CI/CD em projeto novo",
checklist final deve incluir: "workflow file em `.github/workflows/` (nao apenas em
`docs/`) + secrets configurados + 1 push de teste pra confirmar que disparou". Op 01
ficou em "secrets configurados + push de teste manual" — faltou o passo de mover
template→ativo.

---

## L2 — Token `gh` precisa de scope `workflow` pra mexer em `.github/workflows/`

Sintoma: `git push origin deploy/staging` rejeitado com:
```
! [remote rejected] deploy/staging -> deploy/staging
  (refusing to allow an OAuth App to create or update workflow `.github/workflows/...`
   without `workflow` scope)
```

E mesmo `gh api -X PUT contents/.github/workflows/...` retorna `404 Not Found`
(nao mostra a real causa, parece bug not-found mas e permission). Reprodutivel pra
qualquer token oauth sem scope `workflow`.

**Aplicacao futura**: skill `tuninho-devops-*` (qualquer uma que mexa em CI/CD)
deve checar pre-flight `gh auth status -t | grep workflow` E se faltar, FAIL FAST
com instrucao clara `gh auth refresh -h github.com -s workflow`. Custa <1s e evita
400-500ms de latencia + diagnostic confuso depois.

---

## L3 — `docker compose up -d --no-deps <service>` NAO rebuilda imagem

Bug do `deploy.sh` original. Sem `--build`, qualquer mudanca em codigo do servico
(quando o servico tem `build:` no compose, nao apenas `image:`) e silenciosamente
ignorada. Container sobe com a imagem antiga.

**Aplicacao futura**: deploys de servicos com `build:` no compose devem **sempre**
usar `--build` (ou ter step explicito `docker compose build <service>` antes).
Cache de build resolve overhead. Sem isso, fixes em codigo "aplicam silenciosamente"
- bug particularmente perigoso porque parece OK ate alguem testar funcionalidade.

Pode virar sub-check `audit-compose-build-coverage` em `tuninho-qa` futuro: scan de
scripts de deploy procurando `up -d` em servicos com `build:` sem `--build`.

---

## L4 — Planka recente rejeita `description: ""` em POST /api/lists/:id/cards

Comportamento confirmado em servidor staging Planka (a4tunados-mural-derived custom
fork). Validador exige `description` ausente OU non-empty string. Erro:
```
{"code":"E_MISSING_OR_INVALID_PARAMS",
 "problems":["Invalid \"description\": Value ('') was an empty string."]}
```

Codigo legado em `ticket-form/src/{gforms,manutencao}Handler.js` passa `''` literal
quando handler nao quer descricao. Funcionava em versoes anteriores; quebrou em
algum upgrade do Planka custom (provavel: Op 23 patch + seed do user tuninho ou
outra das ondas de bumps).

**Aplicacao futura**: clients HTTP de `tuninho-mural` / `mural-api-client` devem
tratar payload empty-string como ausente. Particularmente em campos `description`,
`name`, e similares onde Planka tem validacao isNotEmptyString.

Talvez valha sub-check `audit-empty-string-payload` em validators do mural-api-client
quando nivel de log esta verbose.

---

## L5 — Modo pragmatico conversacional cabe pra "investigar + fix em servico ja
deployado"

Card-isolated formal (DDCE expansivo + contrato YAML + 4 sessoes) e overkill pra
investigacao guiada por evidencia onde:
- Operador esta on-call e responsivo
- Bug e reproducible em <1min via API direta
- Fix e cirurgico (1-2 linhas em 1-2 arquivos)
- Validacao e end-to-end imediata via Playwright/curl

O proprio mural funciona como "log narrativo" da operacao. Escriba pos-fato (este
vault) preserva rastreabilidade objetiva. Custo: nao ha gates QA bloqueantes
durante; risco de pular validacao.

**Aplicacao futura**: documentar em DDCE "6 condicoes onde modo pragmatico e
aceitavel" (Card 138) — esta sessao e exemplo concreto. Considerar adicionar criterio
"servico em producao staging com bug reproducible em <2min".

---

## L6 — `gh auth refresh -s workflow` precisa de browser interativo

Nao consegui executar autonomo. `gh auth refresh` mostra device code + URL,
mas `gh` espera input interativo (Enter para abrir browser, ou copy do code pra
pagina github.com/login/device).

**Aplicacao futura**: quando skill (qualquer uma) detectar que precisa de scope
adicional do `gh`, ela deve PARAR e instruir operador a rodar interativamente
no shell dele (`! gh auth refresh -h github.com -s workflow`). Tentativas de
contornar via API REST direta tambem falham (mesma policy server-side).
