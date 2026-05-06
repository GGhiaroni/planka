# Checklist de Deploy — Tuninho DevOps Hostinger Alfa

> Checklist multi-projeto para deploys no servidor Hostinger Alfa.
> Use este checklist para garantir que TODOS os passos foram seguidos.

---

## Pre-Deploy

- [ ] Licoes aprendidas lidas (references/licoes-aprendidas.md)
- [ ] Projeto identificado e sidecar carregado
- [ ] Server-registry carregado
- [ ] Risk analysis apresentada ao operador
- [ ] GATE 0 confirmado

## Branch & Merge

- [ ] Branch atual verificada
- [ ] deploy/hostinger-alfa existe
- [ ] Merge --no-ff executado (se aplicavel)
- [ ] GATE 0.5 confirmado

## Bootstrap (apenas primeiro deploy)

- [ ] SSH conectado com sucesso
- [ ] OS e runtimes verificados
- [ ] Runtimes faltantes instalados (Node, PM2, Nginx, certbot)
- [ ] Estrutura de diretorios criada no servidor
- [ ] DNS verificado (dominio → IP)
- [ ] Nginx reverse proxy configurado
- [ ] nginx -t passou
- [ ] SSL obtido via certbot
- [ ] .env.production criado
- [ ] ecosystem.config.js criado
- [ ] GATE 0B confirmado

## Pre-flight Local

- [ ] Lint sem erros
- [ ] Prisma generate executado
- [ ] Build sem erros
- [ ] Output verificado (.next/ existe)
- [ ] Migrations contadas
- [ ] GATE 1 confirmado

## Cross-Project Check

- [ ] Todos os projetos no registry respondendo HTTP 200
- [ ] PM2 status OK para todos
- [ ] Disco > 2GB livre
- [ ] nginx -t valido
- [ ] GATE 2 confirmado

## Package & Transfer

- [ ] Tarball criado com COPYFILE_DISABLE=1
- [ ] Tarball validado (prisma/, package.json presentes)
- [ ] SCP transferido
- [ ] Tamanho verificado no servidor

## Backup

- [ ] Disco verificado no servidor
- [ ] Diretorio de backup criado
- [ ] SQLite copiado (production.db)
- [ ] SQL dump criado
- [ ] .env.production backupado
- [ ] ecosystem.config.js backupado
- [ ] Uploads backupados
- [ ] Contagem de registros baseline registrada
- [ ] Migrations pre-deploy registradas
- [ ] GATE 4 confirmado (PONTO DE NAO RETORNO)

## Deploy

- [ ] pm2 stop executado
- [ ] Versao anterior preservada (_pre_vX.Y.Z)
- [ ] Nova versao extraida
- [ ] Artefatos macOS limpos (._* e .DS_Store)
- [ ] .env.production restaurado
- [ ] ecosystem.config.js restaurado
- [ ] Uploads restaurados (rsync -a)
- [ ] SQLite restaurado (se existia)
- [ ] npm install --omit=dev executado
- [ ] npx prisma generate executado
- [ ] npx prisma migrate deploy executado
- [ ] Build executado (se necessario)
- [ ] pm2 start executado
- [ ] pm2 save executado

## Verificacao

- [ ] PM2 status: online
- [ ] PM2 logs: sem erros
- [ ] HTTP local: 200
- [ ] HTTPS externo: 200
- [ ] Contagem de registros: delta = 0 (ou esperado)
- [ ] Migrations pos-deploy: corretas
- [ ] Cross-project: TODOS respondendo HTTP 200
- [ ] GATE 6 confirmado

## Validacao Funcional

- [ ] Pagina carrega no browser
- [ ] SSL valido (cadeado verde)
- [ ] Login funciona
- [ ] Dashboard carrega dados
- [ ] Funcionalidades principais operam
- [ ] Console DevTools: 0 erros
- [ ] GATE 7 confirmado

## Pos-Deploy

- [ ] Branch de deploy pushed
- [ ] Relatorio de deploy criado
- [ ] Server-registry atualizado
- [ ] Licoes aprendidas atualizadas (se aplicavel)
- [ ] Feedback do operador coletado
- [ ] Versao da skill incrementada (se aplicavel)
- [ ] Escriba invocado

---

## Self-Deploy — Variantes (v2.0.0)

> Quando `DEPLOY_MODE=SELF_DEPLOY`, estes itens SUBSTITUEM seus equivalentes remotos.

### Diff Analysis (substitui Package + Transfer)
- [ ] rsync --dry-run executado
- [ ] Diferencas apresentadas ao operador
- [ ] Zero diferencas = deploy abortado (nada a fazer)
- [ ] Triggers condicionais detectados (package.json, bundle sources)

### Backup (variante local)
- [ ] sqlite3 .backup usado (WAL-safe, NAO cp direto)
- [ ] Secrets copiados (jwt-secret, oauth, etc.)
- [ ] ecosystem.config preservado
- [ ] Codigo backupado via rsync
- [ ] Contagem de registros registrada

### Deploy (variante rsync)
- [ ] rsync --delete executado com excludes do sidecar
- [ ] npm install condicional (so se package.json mudou)
- [ ] Build condicional (so se fontes mudaram)
- [ ] pm2 restart GRACEFUL (NAO stop+start — Regra #25)
- [ ] pm2 save executado
- [ ] DOWNTIME START/END registrado

### Verificacao (variante local)
- [ ] PM2 status: online (ANSI stripped — Licao #33)
- [ ] HTTP local: 200/302
- [ ] DB integrity_check: ok
- [ ] Cross-project: todos respondendo (curl local)
- [ ] WebSocket reconectou automaticamente
