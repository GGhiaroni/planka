# Sidecar — maestrofieldmanager (Hostinger Alfa)

> Criado em 2026-04-13 (Op 23 sessao 03 MARCO 5) pela tuninho-devops-env scan.
> Este projeto ja estava rodando no Hostinger desde antes da Op 23 mas nao tinha sidecar.

## Projeto

- **Nome**: maestrofieldmanager
- **Stack**: Next.js + Prisma + SQLite
- **Deploy mode**: tradicional (scp + ssh + pm2 restart)

## Producao

- **IP**: 31.97.243.191 (hostinger-alfa)
- **Porta**: 3001
- **Dominio**: maestro.fourtuna.com.br
- **PM2**: `maestrofieldmanager` (online)
- **CWD**: `/opt/hostinger-alfa/maestrofieldmanager`
- **Nginx**: `/etc/nginx/sites-enabled/maestrofieldmanager.conf`
- **SSL**: Let's Encrypt via certbot (verificar expiry — nao catalogado ainda)

## Observacoes

- Stack Next.js + Prisma (ORM) + SQLite (banco local no proprio servidor)
- Nao compartilha database com outros projetos do Hostinger
- Porta 3001 no Hostinger coincide com port 3001 do a4tunados_mural local (Vite alt) — NAO e conflito pois sao maquinas diferentes
- **Pendente**: catalogo detalhado de env vars, ecosystem.config, dev.sh, data paths. Proxima scan deve capturar.

## Deploy

Nao documentado em detalhe ainda. Provavelmente:
1. scp do tarball do projeto (exclude node_modules, .git)
2. ssh + `npm install` + `prisma generate`
3. `pm2 restart maestrofieldmanager`

Operador deve criar flow de deploy dedicado em proxima op se for fazer deploys frequentes.

## Cross-project coexistence

Compartilha servidor Hostinger Alfa com:
- tuninho-ide-web (3847)
- chooz_2026 (3849)
- familygames (3030)
- weplus (3850)
- claude-sessions-service (3848)
- orquestravoadora (3040 systemd)

---

*Sidecar minimo criado em 2026-04-13 como parte da correcao de tracking devops/env. Expandir conforme necessidade de deploy.*
