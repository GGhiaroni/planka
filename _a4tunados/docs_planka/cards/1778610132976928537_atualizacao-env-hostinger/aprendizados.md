---
title: "Card 928537 — Aprendizados"
tags:
  - a4tunados
  - tuninho/escriba
  - type/feature
  - status/active
date: 2026-05-19
version: "1.0"
related:
  - "[[cards/1778610132976928537_atualizacao-env-hostinger/sessoes/2026-05-19_01_card-928537-deploy-supabase]]"
---

# Card 928537 — Aprendizados (cross-projeto)

Licoes potencialmente migráveis pra ops-suite ou outros projetos a4tunados.

## L1: `nohup` no servidor > re-rodar CI quando build é o gargalo

**Padrão**: quando uma etapa de build longa (>3min) faz CI failar por SSH timeout, **NÃO re-trigger o mesmo workflow** — o failure é estrutural do canal SSH, não do código.

**Recovery canônico**: `ssh server "nohup bash deploy.sh > /var/log/... 2>&1 &"` + polling do log + verify side-effects.

**Migração proposta**: documentar em `tuninho-devops-hostinger` (referência `recovery-from-ssh-timeout.md`) com snippet pronto.

## L2: Operador estrangeiro = vault stale = scan forense obrigatório

**Padrão**: projetos com contributors fora do ops-suite (caso canonico Ghiaroni @ planka) acumulam features sem ADR. Próxima operação ops-suite no projeto parte de assumption-stale.

**Recovery**: scan forense `git log --author={externo}` + cross-reference com vault + gerar ADRs retroativas (status: `inferred`).

**Migração proposta**: novo modo formal `tuninho-escriba --forensic-foreign-operator` (Card 928537 disparou prototipação ad-hoc). DDCE Etapa 0 deve invocar este modo se detectar commits remotos não-mapeados.

## L3: VPS sem git é canon válido — não assumir `git pull`

**Padrão**: o VPS hostinger-beta NÃO tem `/opt/hostinger-beta/planka/.git` — código chega via rsync do CI. `git pull origin master` no VPS falha. Runbooks do operador que usam linguagem genérica de "git pull" precisam ser interpretados em contexto.

**Migração proposta**: `tuninho-devops-hostinger` deve declarar `deploy_method: rsync-from-ci | git-pull | docker-pull | manual` no sidecar por projeto, e advertir quando runbook contradiz o modo.

## L4: `.env` gitignored em prod é canon — patch idempotente é o pattern

**Padrão**: env files de produção NÃO são versionados (segurança + isolation). Updates devem ser idempotentes (`grep -q || echo >>`) + backup pré-update.

**Migração proposta**: `tuninho-devops-env` ganhar modo `--add-vars-to-server SERVER PATH VAR1=VAL1 VAR2=VAL2 --backup` com pattern automatizado + verify pós-write.

## L5: Stale branch sem código mudado = zero risco

**Padrão**: trabalhar em branch stale só é problema se você MODIFICAR código. Trabalho 100% server-side (env, docker, deploy) em branch stale não cria risco de regressão.

**Diagnóstico canônico**: `git merge-base HEAD <prod-branch>` + `git log <merge-base>..HEAD --stat` mostra se a branch tem diffs de código. Se vazio: stale é cosmético.

## L6: PR docs em branch nova ≠ trabalho na branch stale

**Padrão**: ao precisar empurrar mudança de docs/config no projeto após operação card-isolated com branch stale, criar nova branch baseada em `origin/{tronco-canonical}` + PR limpa é > tentar empurrar via card-isolated.

**Migração proposta**: `tuninho-da-comlurb` (modo 6) pode oferecer "spawn doc-update branch off canonical" quando detecta divergência grande entre card-isolated branch e canonical.

## L7: Secret no body do mural = pendência de rotação obrigatória

**Padrão**: quando operador inclui secret no body de card mural (mesmo interno), a chave deve ser tratada como **comprometida** — rotação pós-execução é pendência canônica.

**Migração proposta**: `tuninho-mural` parse mode pode detectar secrets via redact patterns (já tem 13 patterns em v0.4.0) e auto-injetar pendência "rotate-secret" no contract YAML.
