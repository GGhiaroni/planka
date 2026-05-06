# Sidecar — chooz_2026 (Hostinger Alfa)

> Criado em 2026-04-13 (Op 23 sessao 03 MARCO 5) pela tuninho-devops-env scan.

## Projeto

- **Nome**: chooz_2026
- **Stack**: Next.js
- **Deploy mode**: tradicional

## Producao

- **IP**: 31.97.243.191 (hostinger-alfa)
- **Porta**: 3849
- **Dominio**: chooz2026.fourtuna.com.br
- **PM2**: `chooz_2026` (online)
- **CWD**: `/opt/hostinger-alfa/chooz_2026/app` (nota: codigo em subdir `app/`)
- **Nginx**: `/etc/nginx/sites-enabled/chooz_2026.conf`
- **SSL**: Let's Encrypt

## Observacoes

- Projeto tem diretorio `/opt/hostinger-alfa/chooz_2026/` como raiz, mas o codigo node fica em `app/` — indica que ha outros arquivos no diretorio raiz (talvez scripts, docs, data)
- **Pendente**: catalogo detalhado de env vars, stack especifico (Next.js versao, ORM se houver)

## Cross-project coexistence

Compartilha servidor Hostinger Alfa com outros projetos (ver server-inventory.json).

---

*Sidecar minimo criado em 2026-04-13 como parte da correcao de tracking devops/env.*
