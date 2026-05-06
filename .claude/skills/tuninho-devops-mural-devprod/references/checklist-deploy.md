# Checklist de Deploy — a4tunados mural (Dev -> Producao)

> Referencia rapida para tracking durante execucao do deploy.
> Skill principal: `${CLAUDE_SKILL_DIR}/../SKILL.md`

---

## FASE 0: Analise de Risco
- [ ] Commits novos contados
- [ ] Arquivos alterados analisados
- [ ] Migrations novas identificadas (aditivas vs destrutivas)
- [ ] Dependencias alteradas verificadas (package.json diff)
- [ ] Versao local confirmada (A4tunadosVersion.js)
- [ ] Risco classificado (BAIXO/MEDIO/ALTO)
- [ ] Downtime estimado
- [ ] **GATE 0: Usuario confirmou GO**

## FASE 1: Pre-flight Local
- [ ] Branch correta (master ou branch de deploy)
- [ ] `cd server && npm run lint` — 0 erros
- [ ] `cd client && npm run lint` — 0 erros
- [ ] ecosystem.config.js: `script: "app.js"` (NAO npm start)
- [ ] Versao em A4tunadosVersion.js confirmada
- [ ] `cd client && npm run build` — OK
- [ ] Build output verificado (dist/index.html + dist/assets/)
- [ ] Migrations locais contadas
- [ ] **GATE 1: Usuario confirmou GO**

## FASE 2: Pacote e Transferencia
- [ ] Tarball criado com `COPYFILE_DISABLE=1 tar`
- [ ] Excludes verificados (node_modules, .git, .env, ._*, etc)
- [ ] Conteudo do tarball validado (migrations, ecosystem, version)
- [ ] Tamanho do tarball razoavel
- [ ] SCP para 167.99.24.138:/tmp/ concluido
- [ ] **GATE 2: Usuario confirmou GO**

## FASE 3: Backup em Producao
- [ ] Disco livre verificado (minimo 2GB)
- [ ] Backup dir criado: `/root/backups/pre-deploy-YYYYMMDD-HHMMSS/`
- [ ] DB dump custom format (.dump)
- [ ] DB dump plain SQL (.sql)
- [ ] Integridade do dump verificada (pg_restore -l)
- [ ] Row counts baseline salvo (contagem_registros.txt)
- [ ] Lista de migrations atuais salva (migrations_pre.txt)
- [ ] Config backup (.env + ecosystem.config.js + config/env/)
- [ ] Uploads backup (tar.gz)
- [ ] Sessoes ativas verificadas
- [ ] Atividade recente verificada
- [ ] Resumo apresentado ao usuario
- [ ] **GATE 3: Usuario confirmou GO (PONTO DE NAO RETORNO)**

## FASE 4: Deploy (DOWNTIME — sem pausas)
- [ ] pm2 stop a4tunados-mural
- [ ] pm2 flush a4tunados-mural
- [ ] mv app atual para /opt/a4tunados_mural_pre_vX.Y.Z
- [ ] mkdir + tar extract
- [ ] find ._* -delete + .DS_Store -delete
- [ ] Restore .env
- [ ] Restore config/env/*.js (GLOB, nao cp -r)
- [ ] Nesting check config/env/ (sem env/env/)
- [ ] Restore user-avatars (rsync -a)
- [ ] Restore background-images (rsync -a)
- [ ] Restore favicons (rsync -a)
- [ ] Restore preloaded-favicons (rsync -a)
- [ ] Restore attachments (rsync -a, em PRIVATE)
- [ ] Nesting check em CADA upload dir
- [ ] npm install --omit=dev --ignore-scripts
- [ ] npm rebuild (sem args — ALL natives)
- [ ] Nativos verificados: bcrypt, sharp, lodepng
- [ ] Client build deploy (dist -> server/public + views)
- [ ] Migrations aplicadas (se houver)
- [ ] Migration count pos-apply verificado
- [ ] pm2 start ecosystem.config.js
- [ ] pm2 save

## FASE 5: Verificacao Automatica
- [ ] pm2 status: online
- [ ] pm2 logs: 0 erros
- [ ] HTTP 127.0.0.1:1337: 200
- [ ] HTTPS mural.a4tunados.com.br: 200
- [ ] API /api/config: 200
- [ ] Row counts identicos ao baseline (ZERO delta)
- [ ] Migration count correto
- [ ] Avatares HTTP: todos 200
- [ ] Tabela comparativa apresentada
- [ ] **GATE 4: Verificacao automatica aprovada**

## FASE 6: Validacao Funcional (Manual)
- [ ] Login admin funciona
- [ ] Projetos carregam
- [ ] Boards carregam com cards
- [ ] Drag-and-drop funciona
- [ ] Real-time funciona (2 abas)
- [ ] Features novas testadas
- [ ] Console browser: 0 erros
- [ ] **GATE 5: Usuario validou funcionalmente**

## FASE 7: Documentacao
- [ ] Deploy report criado em _a4tunados/_operacoes/prompts/templates/
- [ ] CHANGELOG atualizado (se necessario)
- [ ] Resumo final apresentado

## EMERGENCIA (a qualquer momento)
- [ ] Se rollback necessario: ver references/rollback-procedures.md
- [ ] Nivel 1 (Quick): swap dirs, pm2 restart
- [ ] Nivel 2 (Migration): knex rollback + swap
- [ ] Nivel 3 (Nuclear): pg_restore + swap
