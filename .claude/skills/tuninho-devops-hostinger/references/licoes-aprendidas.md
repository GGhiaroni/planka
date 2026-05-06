# Licoes Aprendidas — Tuninho DevOps Hostinger Alfa

> Documento vivo. Atualizado apos CADA deploy no servidor Hostinger Alfa.
> Cada licao tem numero sequencial, nunca reutilizado.

---

## Licoes

### Licao #1: Standalone mode do Next.js NAO funciona com Prisma cross-platform

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: Build standalone feito no macOS (darwin-arm64) embute o Prisma client com hash e engine binaria especifica da plataforma. No servidor Linux, o modulo `@prisma/client-{hash}` nao e encontrado.
- **Causa raiz**: Next.js standalone mode copia node_modules minimos incluindo o Prisma client gerado para macOS. O `npx prisma generate` no servidor gera o client correto mas o build ja hardcodou o path com hash macOS.
- **Solucao**: NAO usar `output: "standalone"` no next.config.ts. Fazer build completo NO SERVIDOR (npm install + npx prisma generate + npm run build). Transferir apenas o source code (148KB vs 44MB standalone).
- **Regra**: SEMPRE fazer build no servidor para projetos com Prisma. Tarball contem apenas source code, sem node_modules nem .next/
- **Aplicavel a**: TODOS os projetos com Prisma no servidor

### Licao #2: NextAuth v5 usa AUTH_SECRET, nao NEXTAUTH_SECRET

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: API de auth retornava "There was a problem with the server configuration" ao tentar login
- **Causa raiz**: NextAuth v5 (beta) usa `AUTH_SECRET` como variavel de ambiente, nao `NEXTAUTH_SECRET`. Embora `NEXTAUTH_SECRET` funcione em versoes anteriores, a v5 requer `AUTH_SECRET`.
- **Solucao**: Definir AMBAS as variaveis no .env.production: `AUTH_SECRET` e `NEXTAUTH_SECRET` (para retrocompatibilidade)
- **Regra**: Verificar qual versao do NextAuth o projeto usa e configurar as variaveis corretas
- **Aplicavel a**: Projetos com NextAuth v5

### Licao #3: AUTH_TRUST_HOST obrigatorio para deploy com reverse proxy

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: NextAuth retornava erro "UntrustedHost: Host must be trusted" ao acessar via HTTPS
- **Causa raiz**: NextAuth v5 por padrao nao confia em hosts quando esta atras de reverse proxy (Nginx). O header Host vem do proxy, nao do client direto.
- **Solucao**: Definir `AUTH_TRUST_HOST=true` nas variaveis de ambiente
- **Regra**: SEMPRE incluir AUTH_TRUST_HOST=true em deploys atras de reverse proxy
- **Aplicavel a**: TODOS os projetos com NextAuth atras de Nginx

### Licao #4: Variaveis de ambiente no PM2 ecosystem.config.js vs .env

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: Variaveis adicionadas ao .env.production nao eram lidas pelo processo PM2 em execucao
- **Causa raiz**: O Next.js em modo standalone le .env no build time. Em modo normal (next start), le .env em runtime MAS o PM2 pode nao repassar o CWD correto
- **Solucao**: Para variaveis criticas de runtime (AUTH_TRUST_HOST, AUTH_SECRET), definir no `env:` block do ecosystem.config.js E no .env.production
- **Regra**: Manter variaveis de ambiente em AMBOS: .env.production e ecosystem.config.js
- **Aplicavel a**: TODOS os projetos com PM2

### Licao #5: Repositorio Monarx da Hostinger pode bloquear apt-get update

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: `apt-get update` falhava com erro do repositorio monarx (agent de seguranca da Hostinger)
- **Causa raiz**: O repositorio `repository.monarx.com` nao tinha Release file para Ubuntu 25.10 (questing)
- **Solucao**: Desabilitar o repositorio: `mv /etc/apt/sources.list.d/monarx.list /etc/apt/sources.list.d/monarx.list.disabled`
- **Regra**: Se apt-get update falhar por repositorio monarx, desabilitar sem medo (e um agent de seguranca da Hostinger, nao afeta o funcionamento do servidor)
- **Aplicavel a**: Servidor Hostinger Alfa (especifico)

### Licao #6: tar no macOS inclui extended headers LIBARCHIVE.xattr

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: Milhares de warnings "Ignoring unknown extended header keyword 'LIBARCHIVE.xattr.com.apple.provenance'" ao extrair no Linux
- **Causa raiz**: tar do macOS inclui metadados Apple mesmo com COPYFILE_DISABLE=1 (o xattr de provenance nao e coberto por essa flag)
- **Solucao**: Os warnings sao inofensivos e podem ser ignorados. Para evitar: usar `gtar` (GNU tar via Homebrew) no macOS
- **Regra**: Ignorar warnings de LIBARCHIVE.xattr na extracao. Nao afetam o deploy
- **Aplicavel a**: TODOS os projetos (deploy de macOS para Linux)

### Licao #7: SSH key com passphrase requer ssh-agent + expect

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: SSH com -i falhava com "Permission denied" mesmo com chave correta
- **Causa raiz**: A chave SSH tem passphrase e o ssh nao tem como receber interativamente no contexto de automacao
- **Solucao**: Usar ssh-agent com expect para carregar a chave: `eval "$(ssh-agent -s)" && expect -c 'spawn ssh-add {key}; expect "Enter passphrase"; send "{pass}\r"; expect eof'`
- **Regra**: SEMPRE usar ssh-agent + expect para chaves com passphrase. O ssh-agent nao persiste entre comandos bash, entao encadear tudo no mesmo shell
- **Aplicavel a**: Servidor Hostinger Alfa (passphrase: tanarede)

### Licao #8: DB SQLite precisa existir ANTES do build Next.js

- **Descoberta em**: Bootstrap v0.1.0 de batutamanager (2026-03-28)
- **Status**: ATIVA
- **Problema**: npm run build falhava com "Error code 14: Unable to open the database file" durante static generation
- **Causa raiz**: Next.js tenta pre-renderizar paginas que fazem queries ao DB durante o build. Se o DB nao existe, o build falha
- **Solucao**: Executar `npx prisma migrate deploy` ANTES de `npm run build` para garantir que o DB existe
- **Regra**: Sequencia obrigatoria: npm install → npx prisma generate → npx prisma migrate deploy → npm run build
- **Aplicavel a**: TODOS os projetos Next.js + Prisma + SQLite

### Licao #9: Commit e push da branch ANTES do merge para deploy

- **Descoberta em**: Pre-deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: O Stage 0.5 (Branch Verification + Merge Flow) faz merge da branch atual em `deploy/hostinger-alfa`, mas NAO verifica se a branch atual tem alteracoes nao commitadas ou commits nao pushados. Resultado: merge pode incluir estado incompleto ou perder alteracoes locais.
- **Causa raiz**: O fluxo de deploy assume que a branch esta limpa e pushada, mas nao ha validacao explicita. Alteracoes feitas na mesma sessao (licoes, configs, docs) ficam unstaged.
- **Solucao**: Adicionar verificacao OBRIGATORIA no Stage 0.5, ANTES do merge:
  1. `git status` — deve retornar working tree clean (ou apenas arquivos ignorados)
  2. `git log origin/{branch}..HEAD` — deve retornar vazio (todos os commits pushados)
  3. Se houver alteracoes: commit + push ANTES de prosseguir com merge
  4. Se houver commits nao pushados: push ANTES de prosseguir
  5. Somente apos branch limpa e pushada: executar merge --no-ff
- **Regra**: NUNCA fazer merge para deploy com alteracoes pendentes. Stage 0.5 DEVE bloquear.
- **Aplicavel a**: TODOS os projetos (fluxo de deploy)

### Licao #10: Validacao Playwright UI obrigatoria no Stage 6

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: O Stage 6 (Verificacao Automatizada) usa apenas `curl` + contagem de registros + cross-project HTTP check. O Stage 7 e validacao manual no browser. Nenhum dos dois executa navegacao Playwright real como usuario final. Resultado: deploy pode ser declarado "OK" com curl retornando 200, mas UI quebrada (CSS, JS client-side, formularios, auth flow, etc).
- **Causa raiz**: A skill foi criada com foco em infraestrutura (PM2, Nginx, DB) e nao em validacao de experiencia do usuario. Curl so verifica que o servidor responde, nao que a aplicacao funciona corretamente.
- **Solucao**: O Stage 6 DEVE incluir validacao Playwright ANTES do Stage 7 (validacao humana). Roteiro minimo obrigatorio:
  1. Navegar para a URL de producao (HTTPS)
  2. Verificar que a pagina de login renderiza corretamente (titulo, logo, form)
  3. Executar login com credenciais de teste
  4. Verificar que o dashboard carrega (sidebar, conteudo principal)
  5. Navegar para 2-3 rotas principais e verificar que carregam
  6. Capturar screenshots como evidencia em cada etapa
  7. Se o deploy envolveu alteracoes visuais (como rebrand): validar os elementos visuais especificos
  O Playwright deve ser executado contra a URL de PRODUCAO (HTTPS), nao localhost.
  Screenshots devem ser salvos no relatorio de deploy (Stage 8).
  Se Playwright falhar: BLOQUEAR Stage 7 e sugerir rollback.
- **Regra**: NUNCA declarar deploy OK sem validacao Playwright UI. Curl 200 NAO substitui navegacao real.
- **Aplicavel a**: TODOS os projetos com interface web

### Licao #11: npm install sem --omit=dev quando Tailwind e devDep

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: `npm install --omit=dev` nao instala Tailwind CSS (devDependency). Build Next.js falha com erro de PostCSS ao processar globals.css.
- **Causa raiz**: Tailwind CSS 4 e listado como devDependency no package.json, mas e necessario durante o build (PostCSS transform). `--omit=dev` pula a instalacao.
- **Solucao**: Usar `npm install` (sem --omit=dev) para projetos que usam Tailwind. O build precisa das devDependencies. Alternativa: mover tailwindcss para dependencies (nao recomendado — polui producao).
- **Regra**: Para projetos com Tailwind CSS, NUNCA usar --omit=dev no servidor. A sequencia e: `npm install` (completo) → prisma generate → prisma migrate deploy → npm run build
- **Aplicavel a**: TODOS os projetos com Tailwind CSS

### Licao #12: .env.production precisa de symlink .env para Prisma CLI

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: `npx prisma migrate deploy` nao le `.env.production`, apenas `.env`. Erro: "Environment variable not found: DATABASE_URL"
- **Causa raiz**: Prisma CLI por padrao le apenas `.env` no CWD. O arquivo `.env.production` e uma convencao Next.js, nao do Prisma.
- **Solucao**: Criar symlink no servidor: `ln -sf .env.production .env`. Isso permite que tanto Next.js quanto Prisma leiam as mesmas variaveis.
- **Regra**: SEMPRE criar symlink `.env → .env.production` apos restaurar o .env.production no deploy. Adicionar ao Step 5.5.
- **Aplicavel a**: TODOS os projetos com Prisma + Next.js

### Licao #13: SSL cert precisa ser gerado ANTES de configurar Nginx HTTPS

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: Nginx config com bloco HTTPS referenciando cert inexistente causa `nginx -t` falhar com "BIO_new_file() failed". Config manual com SSL paths hardcoded falha quando o cert ainda nao foi gerado.
- **Causa raiz**: No rebrand, o dominio mudou (batutamanager → maestro) mas o cert antigo e para o dominio antigo. Config Nginx foi criada com paths do novo cert antes de rodar certbot.
- **Solucao**: Sequencia correta: (1) criar config Nginx HTTP-only primeiro, (2) `nginx -t && reload`, (3) rodar `certbot --nginx -d {dominio}` que AUTOMATICAMENTE modifica a config para incluir SSL, (4) verificar `nginx -t` final. NUNCA hardcodar paths de cert que ainda nao existem.
- **Regra**: Para dominios novos ou renomeados: sempre HTTP-only → certbot → verificar. Certbot gerencia os paths SSL automaticamente.
- **Aplicavel a**: TODOS os projetos com dominio novo ou renomeado

### Licao #14: Seed obrigatorio quando DB e criado do zero

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: `prisma migrate deploy` criou as tabelas mas o DB ficou vazio (0 registros). Login falhou com "Email ou senha invalidos". O Stage 5 nao preve execucao de seed.
- **Causa raiz**: O fluxo de deploy assume que o DB ja tem dados (deploy incremental). Num rebrand com rename de pasta, o DB anterior pode nao ser copiado ou pode ser recriado pelas migrations.
- **Solucao**: Apos `prisma migrate deploy` no Stage 5, verificar se a tabela User tem 0 registros. Se sim: (1) perguntar ao operador se deseja rodar seed, (2) executar `npx tsx prisma/seed.ts`, (3) verificar contagem pos-seed. Para deploy incremental normal (DB copiado da versao anterior), o seed NAO deve ser executado.
- **Regra**: Stage 5 deve incluir check: `sqlite3 production.db "SELECT count(*) FROM User;"` — se 0 e projeto tem seed.ts, perguntar antes de prosseguir.
- **Aplicavel a**: TODOS os projetos com seed.ts

### Licao #15: DATABASE_URL deve usar path absoluto no servidor

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: `DATABASE_URL="file:./prisma/production.db"` resolve relativo ao schema.prisma (que esta em `prisma/`), criando `prisma/prisma/production.db`. O app Next.js resolve relativo ao CWD, esperando `prisma/production.db`. Resultado: seed cria DB em path errado, app nao encontra dados.
- **Causa raiz**: O path relativo `file:./prisma/production.db` e ambiguo — diferentes ferramentas (Prisma CLI, Next.js runtime, seed script) resolvem a partir de diretorios diferentes.
- **Solucao**: No .env.production do servidor, SEMPRE usar path absoluto: `DATABASE_URL="file:/opt/hostinger-alfa/{projeto}/prisma/production.db"`. Atualizar no Stage 0B.7 (bootstrap) e no Stage 5.5 (deploy incremental com verificacao).
- **Regra**: NUNCA usar path relativo para DATABASE_URL em producao. Path absoluto elimina ambiguidade.
- **Aplicavel a**: TODOS os projetos com SQLite

### Licao #16: Arquivos de sessao Claude devem estar no .gitignore

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: Ao fazer `git checkout deploy/hostinger-alfa`, o `.claude/session-tracker.json` bloqueou a troca de branch ("Your local changes would be overwritten"). Precisou de stash manual.
- **Causa raiz**: Arquivos de estado de sessao (.claude/session-tracker.json, tuninho-hook-guardiao-state.json, tuninho-hook-cards-state.json) sao auto-gerados e mudam a cada interacao. Nao deveriam ser tracked pelo git.
- **Solucao**: Adicionar ao .gitignore do projeto: `.claude/session-tracker.json`, `.claude/tuninho-hook-guardiao-state.json`, `.claude/tuninho-hook-cards-state.json`. Remover do tracking: `git rm --cached`. Incluir este passo no Stage 0B (bootstrap) ou no primeiro deploy de cada projeto.
- **Regra**: Arquivos de estado de sessao NUNCA devem ser tracked pelo git. Verificar no Stage 0.5 se ha arquivos de sessao tracked e sugerir gitignore.
- **Aplicavel a**: TODOS os projetos com a4tunados-ops-suite

### Licao #17: Rename de projeto no servidor precisa de sub-fluxo dedicado

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: O Stage 5 assume que `{projeto}` no servidor ja e o nome correto. Neste deploy, o servidor tinha `batutamanager` mas o projeto agora e `maestrofieldmanager`. Toda a logica de rename (pm2 stop/delete antigo, mv pasta, rm Nginx antigo, certbot novo dominio) foi adaptacao manual nao prevista no fluxo.
- **Causa raiz**: A skill nao detecta que o nome do projeto mudou desde o ultimo deploy. O server-registry tinha nota de rename mas nao havia fluxo automatico.
- **Solucao**: No Stage 0, ao carregar server-registry, comparar `pm2_service` com o nome atual do projeto no sidecar. Se diferem: ativar flag `RENAME_DEPLOY`. No Stage 5, se flag ativa: (1) `pm2 stop/delete {nome_antigo}`, (2) `mv {pasta_antiga} {pasta_antiga}_pre_rename`, (3) extrair em `{pasta_nova}`, (4) restaurar de `{pasta_antiga}_pre_rename`, (5) remover Nginx antigo, (6) criar Nginx novo (HTTP-only), (7) certbot para novo dominio. Rollback: reverter mv e restaurar PM2/Nginx antigos.
- **Regra**: Se o nome do projeto mudou, o deploy DEVE incluir rename no servidor. Detectar automaticamente via server-registry.
- **Aplicavel a**: Qualquer projeto que passe por rebrand/rename

### Licao #18: ecosystem.config.js deve incluir DATABASE_URL

- **Descoberta em**: Deploy v0.2.0 de maestrofieldmanager (2026-03-29)
- **Status**: ATIVA
- **Problema**: O ecosystem.config.js criado no deploy nao incluiu DATABASE_URL no bloco `env:`. O app leu do .env.production, mas per Licao #4 as vars criticas devem estar em AMBOS.
- **Causa raiz**: O template de ecosystem.config.js no Stage 0B.8 e no Stage 5.5b nao lista DATABASE_URL como variavel obrigatoria.
- **Solucao**: Template do ecosystem.config.js DEVE incluir: DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET, AUTH_TRUST_HOST, NEXTAUTH_URL, NODE_ENV, PORT. Todas as variaveis do .env.production devem ser espelhadas no bloco `env:` do ecosystem.config.js.
- **Regra**: TODAS as variaveis de ambiente criticas devem estar em AMBOS: .env.production e ecosystem.config.js (per Licao #4). O template deve ser atualizado.
- **Aplicavel a**: TODOS os projetos com PM2

### Licao #19: Modulos nativos (node-pty, better-sqlite3) precisam de build-essential

- **Descoberta em**: Bootstrap v0.1.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA
- **Problema**: npm install falha ao compilar node-pty e better-sqlite3 sem gcc/g++/make
- **Causa raiz**: Esses modulos tem bindings C++ que precisam ser compilados nativamente na plataforma alvo. Prebuilds sao macOS-specific.
- **Solucao**: `apt-get install -y build-essential` ANTES de `npm install` em projetos com modulos nativos C++
- **Regra**: Verificar se build-essential esta instalado no Stage 0B.1 (reconhecimento)
- **Aplicavel a**: TODOS os projetos com node-pty, better-sqlite3, ou qualquer modulo nativo

### Licao #20: envStr vazio causa syntax error em bash

- **Descoberta em**: Bootstrap v0.1.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA (corrigida no codigo)
- **Problema**: Comando tmux falhava com `bash: syntax error near unexpected token ';'`
- **Causa raiz**: `Object.keys(process.env).filter(k => k.startsWith('CLAUDE_CODE_')).map().join('; ')` retorna string vazia quando nao ha variaveis CLAUDE_CODE_*. Concatenado com `unset CLAUDECODE; ` + `""` + `; tmux...` gera `; ;`
- **Solucao**: Construir array de unsets e juntar com join unico, evitando string vazia intermediaria
- **Regra**: Sempre validar que join de array vazio nao gera separadores duplicados em comandos shell
- **Aplicavel a**: Qualquer projeto que monte comandos shell dinamicamente

### Licao #21: Claude CLI precisa ser instalado globalmente no servidor

- **Descoberta em**: Bootstrap v0.1.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA
- **Problema**: Terminal IDE depende do `claude` CLI acessivel via `which claude` para abrir sessoes tmux
- **Solucao**: `npm install -g @anthropic-ai/claude-code` no servidor. Verificar com `which claude && claude --version`
- **Regra**: Para projetos que usam Claude CLI como runtime, instalar globalmente no Stage 0B.2
- **Aplicavel a**: tuninho-ide-web e qualquer projeto que integre Claude CLI

### Licao #22: ESM (type:module) requer ecosystem.config.cjs

- **Descoberta em**: Bootstrap v0.1.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA
- **Problema**: PM2 ecosystem.config.js usa `module.exports` (CommonJS), mas projetos com `"type": "module"` no package.json rejeitam require() implicito
- **Solucao**: Renomear para `ecosystem.config.cjs` (extensao explicita CommonJS). PM2 aceita ambas as extensoes.
- **Regra**: Verificar `type` no package.json. Se `"module"`: usar `.cjs`. Se nao definido ou `"commonjs"`: usar `.js`
- **Aplicavel a**: TODOS os projetos ESM com PM2

### Licao #23: postinstall macOS-specific impede deploy em Linux

- **Descoberta em**: Bootstrap v0.1.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA (corrigida no codigo)
- **Problema**: `chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper` no postinstall usa glob macOS-specific. Em Linux, o path `darwin-*` nao existe.
- **Causa raiz**: Postinstall criado apenas para ambiente de desenvolvimento macOS, sem considerar deploy Linux.
- **Solucao**: Alterar glob para `*/spawn-helper` (cross-platform). O `|| true` ja prevenia erro, mas o fix elimina o warning.
- **Regra**: TODO postinstall em package.json DEVE ser cross-platform desde o inicio. Verificar no Stage 0B.
- **Aplicavel a**: TODOS os projetos com scripts postinstall

### Licao #24: Sempre editar local primeiro, deploy depois (NUNCA hotfix direto)

- **Descoberta em**: Deploy v0.2.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA
- **Problema**: Hotfixes aplicados diretamente no servidor (SCP de arquivo individual) criam divergencia entre codigo local e producao. Correcoes ficam no servidor mas nao no repositorio, podendo ser sobrescritas no proximo deploy.
- **Causa raiz**: Urgencia de corrigir bug em producao leva a pular o fluxo de commit-first.
- **Solucao**: OBRIGATORIO: (1) editar codigo localmente, (2) commitar na branch de deploy, (3) criar tarball completo, (4) transferir e extrair no servidor. NUNCA SCP de arquivo individual. Se a correcao e urgente, o fluxo local-first leva ~2min a mais — aceitavel vs risco de divergencia.
- **Regra**: O servidor NUNCA deve ter codigo que nao existe no repositorio. Deploy SEMPRE via tarball completo apos commit.
- **Aplicavel a**: TODOS os projetos em TODOS os deploys

### Licao #25: tmux mouse ON + Shift+drag para selecao em web terminals (REVISADA)

- **Descoberta em**: Deploy v0.2.0 de tuninho-ide-web (2026-03-30). **Revisada**: v0.4.0 (mesmo dia)
- **Status**: ATIVA (revisada)
- **Problema original**: Com `tmux set-option mouse on`, selecao de texto nativa nao funciona (tmux captura mouse events).
- **Tentativa 1 (mouse off)**: Selecao volta a funcionar, mas scroll para de funcionar em alternate screen (claude CLI). Inaceitavel — scroll e essencial.
- **Solucao final**: Manter `tmux set-option mouse on` (scroll funciona). Para selecionar texto: **Shift+arraste** — comportamento padrao em TODOS os terminais com mouse support (iTerm, Windows Terminal, xterm.js). Shift bypassa o mouse reporting do tmux.
- **Regra**: tmux mouse ON sempre. Selecao de texto: Shift+drag. Documentar para o usuario.
- **Aplicavel a**: tuninho-ide-web e qualquer projeto com terminal web via xterm.js

### Licao #26: Multi-viewer — multiplos browsers compartilhando sessao terminal

- **Descoberta em**: Deploy v0.3.0 de tuninho-ide-web (2026-03-30)
- **Status**: ATIVA
- **Problema**: Quando o mesmo usuario abria a IDE em 2 browsers, o segundo tomava controle do PTY e o primeiro mostrava "[lost tty]". Impossivel usar de dois dispositivos simultaneamente.
- **Causa raiz**: O terminal-manager armazenava 1 WebSocket por sessao (Map com key sessionName). Ao conectar o segundo browser, o primeiro era desconectado.
- **Solucao**: Refatorar para 1 PTY por sessao + N WebSockets como viewers (Map de clients). PTY output broadcast a todos os viewers. Input de qualquer viewer vai para o mesmo PTY. Desconectar 1 browser nao afeta os outros. PTY so desconecta quando ultimo viewer sai.
- **Regra**: Para IDEs web multi-dispositivo, usar pattern multi-viewer (1 PTY, N WS clients).
- **Aplicavel a**: tuninho-ide-web e projetos com terminal compartilhado

### Licao #31: Self-deploy rsync incremental e mais rapido e seguro que tarball para deploys on-server

- **Descoberta em**: Self-deploy validacao de tuninho-ide-web (2026-04-02)
- **Status**: ATIVA
- **Problema**: O fluxo original (tarball + SCP + extract + mv) causa ~30-60s de downtime. Para projetos onde o workspace esta no mesmo servidor que producao, esse fluxo e desnecessariamente complexo e lento.
- **Causa raiz**: O fluxo foi desenhado para deploy REMOTO (macOS → Linux). No cenario self-deploy, workspace e producao estao no mesmo filesystem.
- **Solucao**: Usar rsync incremental com --delete. Apenas arquivos modificados sao transferidos. Nao ha mv de diretorio, nao ha tarball, nao ha SCP. Downtime cai para ~3-5s (apenas o pm2 restart).
- **Regra**: Para projetos com deploy_mode SELF_DEPLOY, SEMPRE usar rsync incremental. NUNCA tarball.
- **Aplicavel a**: Qualquer projeto com workspace no mesmo servidor que producao

### Licao #32: PM2 restart (graceful) preserva tmux; stop+start mata PTY attachments

- **Descoberta em**: Self-deploy validacao de tuninho-ide-web (2026-04-02)
- **Status**: ATIVA
- **Problema**: `pm2 stop + pm2 start` mata o processo Node completamente. Para tuninho-ide-web, isso desconecta TODAS as sessoes tmux/PTY ativas. WebSockets caem sem reconexao.
- **Causa raiz**: pm2 stop destroi o processo; start cria novo com PID diferente. File descriptors perdidos. pm2 restart faz reload graceful enviando SIGTERM e reiniciando o processo.
- **Solucao**: Para self-deploy, SEMPRE usar `pm2 restart {app}` (graceful). tmux sessions sobrevivem (tmux server e independente do Node). WebSocket reconecta automaticamente (~2-3s com backoff).
- **Regra**: NUNCA usar pm2 stop+start em self-deploy. SEMPRE pm2 restart. NUNCA tmux kill-server.
- **Aplicavel a**: tuninho-ide-web e qualquer projeto com terminal web/tmux/sessoes persistentes

### Licao #33: Codigos ANSI escape em output PM2 quebram parsing naive

- **Descoberta em**: Self-deploy validacao de tuninho-ide-web (2026-04-02)
- **Status**: ATIVA
- **Problema**: `pm2 describe {app}` retorna output com codigos de cor ANSI (\x1b[0;32m, etc). Grep/awk por "online" ou "status" falha porque os codigos estao intercalados nos caracteres.
- **Causa raiz**: PM2 detecta TTY e emite cores automaticamente, mesmo quando output e parseado por script.
- **Solucao**: SEMPRE strip ANSI antes de parsear: `sed 's/\x1b\[[0-9;]*m//g'`
- **Regra**: Todo parsing de output PM2 em scripts deve incluir strip de ANSI como primeiro passo.
- **Aplicavel a**: TODOS os projetos que parseiam output PM2 em scripts bash

### Licao #34: NUNCA mover diretorios ANTES de atualizar codigo em SELF-DEPLOY

- **Descoberta em**: Deploy Op 10 workspace isolation de tuninho-ide-web (2026-04-03)
- **Status**: ATIVA
- **Problema**: Durante SELF-DEPLOY da Op 10, os workspaces de prod foram movidos de `workspaces/{projeto}` para `workspaces/victorgaudio/{projeto}` ANTES do rsync do codigo novo. O codigo antigo (em execucao) esperava a estrutura flat, nao encontrou os projetos, e a IDE ficou quebrada. Pior: o CWD do agente Claude Code (que era `workspaces/a4tunados_web_claude_code`) deixou de existir, bloqueando TODOS os comandos Bash — o agente nao conseguiu nem reverter a operacao.
- **Causa raiz**: A sequencia errada criou estado intermediario: codigo antigo + estrutura nova = projetos invisiveis para a IDE. Em SELF-DEPLOY, o agente opera de DENTRO do workspace que esta sendo movido, entao mover o workspace mata o proprio agente.
- **Solucao**: Ordem segura para migracao de estrutura em SELF-DEPLOY: (1) COPIAR (cp -al para hardlinks, zero espaco extra) para nova estrutura, (2) rsync codigo novo para prod, (3) PM2 restart (codigo novo resolve nova estrutura), (4) verificar que tudo funciona, (5) SO ENTAO remover originais da estrutura antiga. Se algo der errado, os originais ainda existem como fallback.
- **Regra**: Regra #33 — NUNCA mv antes de atualizar codigo. SEMPRE copiar primeiro, atualizar, verificar, so depois remover.
- **Aplicavel a**: TODOS os deploys que envolvem migracao de estrutura de diretorios, especialmente em SELF-DEPLOY

### Licao #35: Sidecar deve ser atualizado quando operacao muda paths estruturais

- **Descoberta em**: Deploy Op 11 GitGraph de tuninho-ide-web (2026-04-04)
- **Status**: ATIVA
- **Problema**: O `workspace_path` no sidecar apontava para `/opt/hostinger-alfa/tuninho-ide-web/workspaces/a4tunados_web_claude_code` (path pre-Op 10). Apos a Op 10 (workspace isolation per-user), o path real migrou para `/opt/hostinger-alfa/workspaces-tuninho-ide/victorgaudio/a4tunados_web_claude_code`. O sidecar ficou stale.
- **Causa raiz**: A Op 10 migrou a estrutura de workspaces mas nao atualizou o sidecar de deploy. O deploy da Op 10 usou o path correto inline (detectado no momento), mas o sidecar permaneceu com o path antigo.
- **Solucao**: Quando uma operacao DDCE altera paths estruturais (migracao de workspaces, rename de diretorios, mudanca de base path), o sidecar de deploy (`projects/{projeto}/config.md`) DEVE ser atualizado como parte da operacao — nao apenas no proximo deploy.
- **Impacto real**: Nenhum neste deploy (detectado e corrigido no Stage 0). Mas se um deploy futuro tivesse usado o sidecar sem verificar, o rsync source estaria errado.
- **Regra**: Operacoes que mudam paths referenciados em sidecars devem atualizar os sidecars como parte do checklist de conclusao.
- **Aplicavel a**: TODOS os projetos com sidecar de deploy + operacoes que envolvem migracao de estrutura

### Licao #36: Socket.io precisa de location block /socket.io/ dedicado no Nginx

- **Descoberta em**: Bootstrap v2.0.0 de familygames (2026-04-04)
- **Status**: ATIVA
- **Problema**: Socket.io usa WebSocket upgrade e long polling como fallback. Um unico location block generico pode nao manter conexoes WebSocket longas abertas.
- **Causa raiz**: Nginx fecha conexoes idle apos 60s por padrao. Socket.io heartbeat e a cada 25s, mas reconexoes podem demorar. Long polling precisa de proxy_read_timeout alto.
- **Solucao**: Criar location block dedicado `/socket.io/` com `proxy_read_timeout 86400` (24h) e headers de WebSocket upgrade.
- **Regra**: Todo projeto com Socket.io deve ter location block dedicado no Nginx para `/socket.io/`.
- **Aplicavel a**: familygames e qualquer projeto com Socket.io ou WebSocket no servidor

### Licao #37: Projetos vanilla JS (sem build) simplificam drasticamente o deploy

- **Descoberta em**: Bootstrap v2.0.0 de familygames (2026-04-04)
- **Status**: ATIVA
- **Problema**: Nao e um problema — e uma observacao. Projetos sem framework pesado (Next.js, Prisma, Tailwind) reduzem o Stage 5 a: extract tarball + npm install + pm2 start.
- **Causa raiz**: Sem build step, sem prisma generate, sem migrations, sem seed check, sem symlink .env, sem DATABASE_URL absoluto — todas essas etapas sao eliminadas.
- **Solucao**: Para projetos vanilla, o deploy pode usar `npm install --omit=dev` com seguranca (devDeps nao sao necessarias). Tarball fica minusculo (~69KB). Memoria PM2 ~20MB.
- **Regra**: Ao detectar projeto sem build step no sidecar, pular etapas 5.9-5.11 do Stage 5.
- **Aplicavel a**: familygames e qualquer projeto Express/vanilla sem framework de build

### Licao #38: Token OAuth hardcoded na remote URL causa falhas recorrentes de push

- **Descoberta em**: Op 01 weplus_prototipo — migracao Hostinger (2026-04-08)
- **Status**: ATIVA
- **Problema**: `git push` falhou com `fatal: could not read Password` porque a remote URL tinha token `gho_*` expirado embutido. A "correção" de embutir novo token via `git remote set-url` recria o mesmo problema quando o token expira.
- **Causa raiz**: Tokens `gho_*` sao tokens de sessao do `gh` CLI e expiram. Quando embutidos na URL, criam ciclo: funciona → expira → push falha → alguem embute novo token → funciona → expira.
- **Solucao**: NUNCA embutir token na remote URL. Usar credential helper dinamico: `git config --global credential.helper '!gh auth git-credential'` + URL limpa `https://github.com/org/repo.git`. Verificacao preventiva adicionada no Stage 0.5 passo 2.
- **Regra**: Verificar remote URL para tokens hardcoded ANTES de qualquer push. Corrigir automaticamente (sem gate).
- **Aplicavel a**: TODOS os projetos no servidor que usam git push

---

## Resumo

| # | Titulo | Deploy | Projeto | Severidade |
|---|--------|--------|---------|------------|
| 1 | Standalone + Prisma cross-platform | v0.1.0 | batutamanager | ALTA |
| 2 | AUTH_SECRET vs NEXTAUTH_SECRET | v0.1.0 | batutamanager | ALTA |
| 3 | AUTH_TRUST_HOST com reverse proxy | v0.1.0 | batutamanager | ALTA |
| 4 | Env vars PM2 vs .env | v0.1.0 | batutamanager | MEDIA |
| 5 | Monarx repo bloqueia apt | v0.1.0 | batutamanager | BAIXA |
| 6 | LIBARCHIVE.xattr warnings | v0.1.0 | batutamanager | BAIXA |
| 7 | SSH key com passphrase | v0.1.0 | batutamanager | MEDIA |
| 8 | DB precisa existir antes do build | v0.1.0 | batutamanager | ALTA |
| 9 | Commit+push ANTES do merge para deploy | pre-v0.2.0 | maestrofieldmanager | ALTA |
| 10 | Validacao Playwright UI obrigatoria no Stage 6 | v0.2.0 | maestrofieldmanager | ALTA |
| 11 | npm install sem --omit=dev (Tailwind) | v0.2.0 | maestrofieldmanager | ALTA |
| 12 | Symlink .env → .env.production para Prisma | v0.2.0 | maestrofieldmanager | ALTA |
| 13 | SSL cert antes de Nginx HTTPS | v0.2.0 | maestrofieldmanager | MEDIA |
| 14 | Seed obrigatorio quando DB criado do zero | v0.2.0 | maestrofieldmanager | ALTA |
| 15 | DATABASE_URL path absoluto no servidor | v0.2.0 | maestrofieldmanager | ALTA |
| 16 | Arquivos sessao Claude no .gitignore | v0.2.0 | maestrofieldmanager | MEDIA |
| 17 | Rename de projeto: sub-fluxo dedicado | v0.2.0 | maestrofieldmanager | ALTA |
| 18 | ecosystem.config.js com DATABASE_URL | v0.2.0 | maestrofieldmanager | MEDIA |
| 19 | Modulos nativos precisam de build-essential | v0.1.0 | tuninho-ide-web | ALTA |
| 20 | envStr vazio causa syntax error em bash | v0.1.0 | tuninho-ide-web | ALTA |
| 21 | Claude CLI precisa ser instalado globalmente | v0.1.0 | tuninho-ide-web | ALTA |
| 22 | ESM (type:module) requer ecosystem.config.cjs | v0.1.0 | tuninho-ide-web | MEDIA |
| 23 | postinstall macOS-specific impede deploy Linux | v0.1.0 | tuninho-ide-web | MEDIA |
| 24 | Sempre editar local primeiro, deploy depois (NUNCA hotfix direto) | v0.2.0 | tuninho-ide-web | ALTA |
| 25 | tmux mouse ON + Shift+drag para selecao (REVISADA) | v0.4.0 | tuninho-ide-web | ALTA |
| 26 | Multi-viewer: multiplos browsers compartilhando sessao terminal | v0.3.0 | tuninho-ide-web | MEDIA |
| 27 | sshpass + PreferredAuthentications=password para chave com passphrase | v0.1.0 | chooz_2026 | ALTA |
| 28 | Drizzle ORM: npx drizzle-kit push (nao migrate deploy) | v0.1.0 | chooz_2026 | MEDIA |
| 29 | Next.js sem Prisma: nao precisa de npx prisma generate | v0.1.0 | chooz_2026 | MEDIA |
| 30 | Diretorios de imagens writable no servidor | v0.1.0 | chooz_2026 | MEDIA |
| 31 | Self-deploy rsync incremental > tarball para on-server | self-deploy | tuninho-ide-web | ALTA |
| 32 | PM2 restart (graceful) preserva tmux; stop+start mata PTY | self-deploy | tuninho-ide-web | ALTA |
| 33 | ANSI escape codes em PM2 output quebram parsing naive | self-deploy | tuninho-ide-web | MEDIA |
| 34 | NUNCA mover diretorios ANTES de atualizar codigo em SELF-DEPLOY | Op 10 | tuninho-ide-web | CRITICA |
| 35 | Sidecar deve ser atualizado quando operacao muda paths estruturais | Op 11 | tuninho-ide-web | MEDIA |
| 36 | Socket.io precisa de location block /socket.io/ dedicado no Nginx | v2.0.0 | familygames | MEDIA |
| 37 | Projetos vanilla JS (sem build) simplificam drasticamente o deploy | v2.0.0 | familygames | MEDIA |
| 38 | Token OAuth hardcoded na remote URL causa falhas recorrentes de push | v2.3.0 | weplus_prototipo | ALTA |
| 39 | `ssh host 'sudo -u postgres pg_dump'` vaza stderr no stdout e corrompe o dump binario | v3.0.1 | Op 25 beta mural | **CRITICA** |
| 40 | `tar --exclude='./env'` matcha qualquer dir chamado env (incluindo subdirs criticos) | v3.0.1 | Op 25 beta mural | **CRITICA** |
| 41 | PG17 SASL SCRAM: linha trust no pg_hba.conf DEVE preceder scram-sha-256 | v3.0.1 | Op 25 beta mural | **CRITICA** |
| 42 | Apos pg_restore, SEMPRE rodar db:migrate antes de iniciar a app | QA Op 26 | mural beta | **CRITICA** |
| 43 | Re-deploy mesmo dia: `pm2 delete + start`, nao `pm2 stop + start` | Deploy 002 | chooz_2026 | ALTA |

---

## Licao #39: pg_dump via SSH+sudo vaza stderr no dump binario

- **Descoberta em**: Op 25 Fase 4 (dump do prod DO para replicar no beta), 2026-04-15
- **Status**: ATIVA
- **Problema**: `ssh host 'sudo -u postgres pg_dump -Fc -d planka' > backup.dump` gerou arquivo de tamanho correto mas corrompido. Os primeiros bytes eram `perl: warning: Setting locale failed...` em vez do magic PGDMP binario.
- **Causa raiz**: em servidores DigitalOcean com locale mal configurado, `sudo -u postgres` emite warnings do perl que vazam para stdout via buffering do sudo/PAM. No SSH pipe, esses warnings chegam ANTES do binario do pg_dump, corrompendo o magic header.
- **Deteccao**: `file backup.dump` retorna "data" em vez de "PostgreSQL custom database dump - v1.x". `pg_restore -l` retorna "input file does not appear to be a valid archive". `xxd | head` mostra texto legivel no inicio.
- **Solucao**: redirecionar stderr do pg_dump remoto para /dev/null ANTES do pipe:
  ```bash
  ssh host 'sudo -u postgres pg_dump -Fc -d planka 2>/dev/null' > backup.dump
  ```
- **Regra universal**: ao capturar output binario via SSH+sudo, SEMPRE `2>/dev/null` no lado remoto. Vale para pg_dump, mysqldump, tar, qualquer binario.
- **Aplicavel a**: todos os projetos full-stack com DB externo, e qualquer operacao de backup/restore cruzado entre servidores.

---

## Licao #40: tar --exclude com pattern sem slash final matcha amplamente

- **Descoberta em**: Op 25 Fase 5 (deploy do mural para beta), 2026-04-15
- **Status**: ATIVA
- **Problema**: comando `tar --exclude='./env' -czf out.tar.gz .` pretendia excluir apenas `./env/` da raiz (dir com credenciais DigitalOcean). Em vez disso, excluiu TODOS os subdirs chamados `env/` recursivamente — incluindo `./server/config/env/` que contem `production.js` (essencial para Sails em production). Deploy falhou com "No sails.config.sockets.onlyAllowOrigins setting was detected".
- **Causa raiz**: BSD tar (macOS) e GNU tar, quando recebem `--exclude='./env'` sem trailing slash ou wildcard, interpretam como "qualquer path com nome `env`". Pattern matching amplo demais.
- **Deteccao**: `grep: /path/config/env/production.js: No such file or directory` no servidor apos extract. `tar -tzf out.tar.gz | grep env` nao retorna nenhum path com `/env/`.
- **Solucao**: usar padrao explicito com glob ou path absoluto dentro do tar:
  ```bash
  # EVITAR:
  --exclude='./env'

  # PREFERIR:
  --exclude='./env/*'              # exclui conteudo de ./env, preserva dir
  --exclude='./env/digitalocean'   # exclui especifico
  --exclude='./env/*.sh'           # exclui por extensao
  ```
- **Regra universal**: `--exclude` de tar aceita globs — seja especifico. Teste com `tar -tzf` antes de confiar.
- **Aplicavel a**: qualquer operacao de empacotamento de codigo para deploy.

---

## Licao #41: PG17 SASL SCRAM exige trust antes de scram-sha-256 em pg_hba.conf

- **Descoberta em**: Op 25 Fase 5 (primeiro start do mural no beta), 2026-04-15
- **Status**: ATIVA
- **Problema**: mural startou mas errored com `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`. App conectava com `DATABASE_URL=postgresql://postgres@127.0.0.1:5432/planka` (sem password, esperando trust local), e PG17 tentou negociar SCRAM porque a regra trust estava DEPOIS das regras scram padrao no pg_hba.conf.
- **Causa raiz**: PG17 (vs PG14-) mudou o padrao de auth para `scram-sha-256` mesmo em conexoes locais 127.0.0.1/32. A linha default em pg_hba.conf e `host all all 127.0.0.1/32 scram-sha-256`. Quando a linha trust (para postgres@127.0.0.1/32) e adicionada depois via append, PG aplica a primeira match em ordem linear — e a primeira match eh scram-sha-256, nao trust. Como o client nao envia password, SASL falha.
- **Deteccao**: log do app Node mostra stack trace com `machinepack-postgresql/node_modules/pg/lib/crypto/sasl.js:24` e mensagem "client password must be a string".
- **Solucao**: reordenar pg_hba.conf colocando a regra trust ANTES das regras scram. Exemplo via sed prepend:
  ```bash
  sed -i '0,/^host/{s|^host|host    all             postgres        127.0.0.1/32            trust\nhost|}' /etc/postgresql/17/main/pg_hba.conf
  systemctl restart postgresql
  ```
- **Alternativa**: setar password no user postgres (`ALTER USER postgres PASSWORD '...'`) e incluir no DATABASE_URL. Menos seguro para trust local mas funciona.
- **Regra universal**: em PG14+, pg_hba.conf e avaliado em ordem. Regras trust SEMPRE devem vir ANTES de regras scram-sha-256 para os mesmos user+address.
- **Aplicavel a**: todos os bootstraps de servidor novo com PostgreSQL 14 ou superior + app que usa trust local.

---

## Licao #42: Apos pg_restore, SEMPRE rodar db:migrate antes de iniciar a aplicacao

- **Descoberta em**: Op 26 QA Fase 2 (QA do deploy da Op 25), 2026-04-15
- **Status**: ATIVA — inviolavel em todos os deploys com pg_restore
- **Problema**: Apos Op 25 replicar o mural do prod DO para o beta via pg_dump/pg_restore, a app preso no loader inicial. DevTools console mostrava `Internal Server Error @ fetchCore → rootSaga cancelled`. PM2 error log revelou:
  ```
  Sending 500 ("Server Error") response:
  Unexpected error from database adapter: column "claude_workspace" does not exist
  ```
- **Causa raiz**: O prod DO estava em v2.3.2 (desta operacao ~30 migrations), mas o codigo deployado no beta era da branch `develop` com 34 migrations (Op 22 adicionou `claude_workspace`, Op 23 adicionou tuninho user seed + jsonb + metadata). O pg_restore copiou o schema + dados do DO, mas **nao rodou as migrations faltantes** do codigo novo. Resultado: DB com 30 migrations aplicadas, codigo tentando ler colunas que nao existem (ex: `board.claude_workspace`), saga PLANKA falha no boot inteiro.
- **Pontos cegos do pg_restore**:
  1. A contagem de migrations no DB batia (30) com a do source, entao um teste simples como `SELECT count(*) FROM migration` PASSARIA
  2. A contagem de usuarios, projects, boards, cards tambem batiam
  3. Apenas testes de boot real expoem o gap (a app tenta chamar coluna inexistente)
- **Solucao obrigatoria**: IMEDIATAMENTE apos pg_restore e ANTES do primeiro start da app, executar:
  ```bash
  cd /opt/{host}/{projeto}/server && npm run db:migrate
  pm2 reload {app_name}  # ou pm2 restart para forcar refresh do Sails
  ```
  Verificar que a contagem de migrations bate com o numero de arquivos em `server/db/migrations/`:
  ```bash
  sudo -u postgres psql -d {dbname} -tAc "SELECT count(*) FROM migration"
  ls server/db/migrations/*.js | wc -l
  ```
  Estes dois numeros DEVEM ser iguais apos o fix.
- **Regra universal (PLANKA e similares)**: sempre que o codigo deployado e mais novo que o dump restaurado, o DB vai estar "atras" do codigo. Migrations cobrem essa lacuna — sao parte essencial do processo de restore, nao opcional.
- **Integracao com checklist-deploy**: Adicionar step obrigatorio "Run pending migrations" entre "pg_restore" e "start app" nos roteiros de bootstrap e replicacao. Ver `references/checklist-deploy.md`.
- **Efeito colateral**: A migration seed do user tuninho (`20260413100000_seed_tuninho_user.js`) cria +1 row em `user_account`. Aceitavel — e uma conta bot de sistema. Se o QA verifica contagens pos-restore, aumentar a tolerancia para users +1.
- **Aplicavel a**: todas as replicacoes pg_restore (Op 25, Op 27+, futuros deploys de disaster recovery, clones para staging).

---

## Licao #43: Re-deploy no mesmo dia → `pm2 delete + start`, nao `pm2 stop + start`

- **Descoberta em**: Deploy 002 chooz_2026 (fix UX pos-Op18), 2026-04-18
- **Status**: ATIVA — aprovada pelo operador
- **Problema**: Apos `pm2 stop chooz_2026` + `mv(/opt/.../chooz_2026 -> chooz_2026_pre_op18_ux)` + `pm2 start ecosystem.config.cjs` em sequencia rapida no segundo deploy do mesmo dia, o PM2 manteve status=stopped com contador restarts=5 (nao zerou). HTTP local 3849 retornou 000; HTTPS retornou 502. Logs error.log e out.log ficaram vazios — falha silenciosa de start, sem stack trace.
- **Causa raiz**: O PM2 daemon mantem entries internas por `name` + `id`. Quando o diretorio fisico apontado pelo `cwd` e movido, o entry fica com state stale apontando para path que nao existe mais (mesmo que o path abstrato "chooz_2026" tenha sido recriado depois pelo tar). O `pm2 start ecosystem.config.cjs` subsequente nao forca reload total — apenas toggla status. Se ha inconsistencia entre entry interno e filesystem, a app fica stopped sem emitir erro detalhavel.
- **Deteccao**: `pm2 describe {app}` mostra status=stopped + restart_time identico ao valor pre-stop; `curl http://127.0.0.1:{port}` retorna 000; `nginx` responde 502 upstream. Executar o binario manualmente (`node_modules/.bin/next start -p {port}`) inicia OK, confirmando que o codigo esta bem.
- **Solucao**: `pm2 delete {app}` (remove entry completamente) seguido de `pm2 start ecosystem.config.cjs` (cria entry novo com id fresh) + `pm2 save`. Reseta state totalmente.
- **Regra universal**: Em deploys **REMOTE** (Stage 5) que envolvem `mv` do diretorio do projeto, **SEMPRE usar `pm2 delete {app} 2>/dev/null || true` no lugar de `pm2 stop {app}`**. Nao confiar em toggle stop/start sequencial quando o path pode mudar. Proximo `pm2 start ecosystem` cria entry limpo.
- **Fix no Stage 5 da skill**: Linha `pm2 stop {projeto}` deve virar `pm2 delete {projeto} 2>/dev/null || true`. O `pm2 save` no final do Stage ja persistira o novo entry.
- **Downtime adicional do incidente**: +2 min (vs 30-60s esperados — subiu para ~3 min no total devido ao diagnostico do 502).
- **Aplicavel a**: TODOS os projetos REMOTE que usam mv+restore pattern no Stage 5.

---

---

## Licao — Comparacao OBRIGATORIA de IDs em todo restore (Card 1761271429099161009 Anexos, 2026-04-25)

**Contexto**: Card "Anexos" tuninho.ai — durante a janela de validacao, foi
detectada uma regressao acidental do DB causada por operacao paralela. O agente
fez restore do backup mais novo que tinha a coluna Scrum + 17 cards perdidos,
mas NAO comparou explicitamente IDs presentes/ausentes ANTES de declarar SUCCESS.

**Problema**: O operador legitimamente perguntou "PUTA MERDA. Se recuperou o BD
em estado de antes, pode ter recuperado algo desatualizado OU ENTAO PERDIDO DADO
de algum user teste". Sem comparacao explicita, o agente nao tinha como provar
que zero dados de outros users foram perdidos. Comparacao foi feita apos o
pedido (e confirmou seguranca total: zero perda exceto 2 colunas vazias do
proprio operador), mas devia ter sido OBRIGATORIA na primeira passagem.

**Solucao** (incorporada na v3.5.0):
1. Stage 9.5 NOVA — Diagnostico de Regressao DB: tabela cronologica de contagens
   em todos os backups antes de qualquer restore, identificando o ponto de inflexao.
2. Regra Inviolavel #42 — Comparacao OBRIGATORIA de IDs: `comm -23` entre
   safety_backup e target_backup por tabela; bloqueia restore se houver IDs
   perdidos sem confirmacao explicita do operador (ou flag `accepted_data_loss: true`
   no contrato em modo autonomo).
3. Sub-check QA `audit-restore-data-integrity` (delegacao para tuninho-qa v0.10+).
