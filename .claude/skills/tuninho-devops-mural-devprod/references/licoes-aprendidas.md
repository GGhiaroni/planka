# Licoes Aprendidas — Deploy a4tunados mural

> Compilacao de TODAS as licoes dos 4 deploys de producao (v2.1.1, v2.1.2, v2.2.0).
> Cada licao foi validada em deploys subsequentes.
> Ultima atualizacao: 2026-03-21

---

## Licao #1: npm install + rebuild

**Descoberta em:** v2.1.1 + v2.1.2
**Status:** VALIDADA (v2.2.0 aplicou com sucesso)

**Problema:** `npm install --omit=dev` falha porque `patch-package` (devDependency) esta
no postinstall script. Mesmo corrigindo com `--ignore-scripts`, `npm rebuild bcrypt &&
npm rebuild sharp` NAO e suficiente — outros nativos (lodepng via ico-to-png) ficam
sem compilar e causam 502.

**Erro v2.1.1:**
```
npm error command sh -c patch-package && npm run setup-python
```

**Erro v2.1.2:**
```
[E] A hook (`helpers`) failed to load!
[E] Failed to lift app: Cannot find module './build/Release/lodepng.node'
```

**Solucao definitiva:**
```bash
npm install --omit=dev --ignore-scripts
npm rebuild  # SEM ARGS — rebuilda TODOS os nativos automaticamente
```

**NUNCA listar modulos individualmente. Novos nativos podem ser adicionados como deps transitivas a qualquer momento.**

---

## Licao #2: NUNCA usar `cp -r dir/ dest/`

**Descoberta em:** v2.1.1 (config/env/) + v2.1.2 (user-avatars/)
**Status:** VALIDADA (v2.2.0 usou rsync com sucesso)

**Problema:** Quando o diretorio destino JA EXISTE, `cp -r src/ dest/` cria `dest/src/`
(aninhamento). Isso causou:
- `config/env/env/production.js` (502 — require paths quebrados)
- `user-avatars/user-avatars/{uuid}/` (avatares invisiveis)

**Erro v2.1.1:**
```
Error: Cannot find module '../../utils/logger'
Require stack: /opt/a4tunados_mural/server/config/env/env/production.js
```

**Solucao:**
```bash
# Para config (arquivos especificos):
cp /src/config/env/*.js /dest/config/env/

# Para uploads (diretorios inteiros):
rsync -a /src/server/public/user-avatars/ /dest/server/public/user-avatars/
```

**Verificacao obrigatoria apos restore:**
```bash
# Nao deve existir diretorio aninhado
if [ -d "dest/env/env" ]; then echo "ERRO: NESTING!"; fi
if [ -d "dest/user-avatars/user-avatars" ]; then echo "ERRO: NESTING!"; fi
```

---

## Licao #3: COPYFILE_DISABLE=1 no tar (macOS)

**Descoberta em:** v2.1.1
**Status:** VALIDADA (v2.2.0 aplicou com sucesso)

**Problema:** macOS inclui metadata files (`._*`, xattr) no tarball. No Linux, esses
arquivos causam SyntaxErrors quando Sails.js tenta parsear.

**Solucao:**
```bash
# Na criacao do tarball (macOS):
COPYFILE_DISABLE=1 tar -czf deploy.tar.gz ...

# Apos extracaono Linux (safety net):
find /opt/a4tunados_mural -name '._*' -delete
find /opt/a4tunados_mural -name '.DS_Store' -delete
```

---

## Licao #4: pm2 flush antes de restart

**Descoberta em:** v2.1.2
**Status:** VALIDADA (v2.2.0 aplicou com sucesso)

**Problema:** PM2 acumula logs entre sessoes/restarts. Logs de erros antigos aparecem
misturados com os novos, causando confusao diagnostica. No v2.1.2, logs do v2.1.1
(nesting em config/env/) apareceram novamente apesar do problema ja ter sido corrigido,
desperdicando 5+ minutos investigando um problema inexistente.

**Solucao:**
```bash
# ANTES de iniciar nova versao:
pm2 flush a4tunados-mural
pm2 start ecosystem.config.js
```

---

## Licao #5: HTTP curl e a fonte de verdade

**Descoberta em:** v2.1.2
**Status:** VALIDADA (v2.2.0 aplicou com sucesso)

**Problema:** `pm2 status` mostra "online" quando o processo Node.js esta rodando, mas
isso NAO significa que o app esta funcional. O processo pode ter crashado internamente
(ORM hook failure, modulo nativo nao compilado) e pm2 mostra "online" com 0 restarts.

**Solucao:**
```bash
# APOS pm2 start, SEMPRE verificar com curl:
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:1337/
curl -s -o /dev/null -w "%{http_code}" https://mural.a4tunados.com.br/

# Ambos devem retornar 200. Qualquer outro codigo = app com problema.
```

---

## Licao #6: Verificar nesting em diretorios restaurados

**Descoberta em:** v2.1.1 + v2.1.2
**Status:** VALIDADA (v2.2.0 verificou 4/4 sem nesting)

**Problema:** Qualquer operacao de copia de diretorio pode criar nesting silenciosamente.
O nesting e invisivel ate causar 502 ou 404.

**Solucao — verificacao apos CADA restore:**
```bash
# config/env/
ls /opt/a4tunados_mural/server/config/env/
# Deve mostrar: production.js test.js (SEM subdir env/)

# uploads
for dir in user-avatars background-images favicons; do
  if [ -d "/opt/a4tunados_mural/server/public/$dir/$dir" ]; then
    echo "NESTING em $dir!"
  else
    echo "$dir OK"
  fi
done
```

---

## Licao #7: Testar avatares via HTTP apos deploy

**Descoberta em:** v2.1.2 (avatares de 2 usuarios ficaram invisiveis)
**Status:** VALIDADA (v2.2.0 testou 7/7 HTTP 200)

**Problema:** Nesting em user-avatars/ causa 404 silencioso. Os usuarios veem um
placeholder generico sem perceber que o avatar esta inacessivel.

**Solucao:**
```bash
sudo -u postgres psql -h 127.0.0.1 -d planka -t -c \
  "SELECT avatar->>'dirname' FROM user_account WHERE avatar IS NOT NULL;" | \
while read -r dirname; do
  dirname=$(echo "$dirname" | xargs)
  if [ -n "$dirname" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      "https://mural.a4tunados.com.br/user-avatars/$dirname/original.jpg")
    echo "Avatar $dirname: HTTP $code"
  fi
done
# TODOS devem retornar 200
```

---

## Licao #8: Attachments em server/private/, NAO server/public/

**Descoberta em:** v2.1.1 (procedure errado corrigido no v2.1.2)
**Status:** VALIDADA (v2.2.0 usou path correto)

**Problema:** O plano de deploy v2.1.1 referenciava `server/public/attachments/` mas
o path correto e `server/private/attachments/`. Attachments copiados para public/
ficam expostos sem autenticacao e nao sao encontrados pelo servidor.

**Solucao:**
```bash
# CORRETO:
rsync -a /old/server/private/attachments/ /new/server/private/attachments/

# ERRADO:
# rsync -a /old/server/public/attachments/ /new/server/public/attachments/
```

---

## Licao #9: NUNCA deletar backups sem baixar para local

**Descoberta em:** Politica estabelecida desde v2.1.1
**Status:** POLITICA PERMANENTE

**Problema:** Espaco em disco no servidor e limitado (~3-4 GB livre). A tentacao de
deletar backups antigos para liberar espaco e grande, mas perder um backup pode
significar perda irrecuperavel de dados.

**Regra:**
1. Verificar `df -h` regularmente
2. Se espaco critico: baixar backups para maquina local via SCP
3. SOMENTE APOS confirmacao de download: deletar do servidor
4. NUNCA deletar sem autorizacao explicita do usuario
5. Manter SEMPRE pelo menos o backup mais recente no servidor

---

## Licao #10: ecosystem.config.js deve usar app.js

**Descoberta em:** v2.1.0 -> v2.1.1 (corrigido no repo)
**Status:** VALIDADA (corrigido permanentemente)

**Problema:** ecosystem.config.js original usava `script: "npm"` com `args: "start"`,
que executa `npm start` → `nodemon app.js`. Nodemon e ferramenta de dev (hot-reload)
e NAO deve rodar em producao (overhead, restarts desnecessarios).

**Solucao (ja aplicada no repo):**
```javascript
// CORRETO:
script: "app.js",

// ERRADO:
script: "npm",
args: "start",
```

**Pre-flight check obrigatorio:**
```bash
grep 'script:' ecosystem.config.js
# Deve conter: app.js
```

---

## Licao #11: Limpar arquivos ._* apos tar extract

**Descoberta em:** v2.1.1
**Status:** VALIDADA (v2.2.0 aplicou com sucesso)

**Problema:** Mesmo com `COPYFILE_DISABLE=1`, alguns arquivos ._* podem escapar
(dependendo da versao do tar). No Linux, Sails.js `include-all` tenta parsear
esses arquivos como JavaScript, causando SyntaxError.

**Solucao — sempre executar apos extract:**
```bash
find /opt/a4tunados_mural -name '._*' -delete
find /opt/a4tunados_mural -name '.DS_Store' -delete
```

---

## Licao #12: Usar 127.0.0.1, NUNCA localhost

**Descoberta em:** Setup inicial de producao
**Status:** VALIDADA (todos os deploys)

**Problema:** `localhost` pode resolver para IPv6 (`::1`) em sistemas modernos.
PostgreSQL nativo escuta apenas em IPv4 por padrao, causando ECONNREFUSED.

**Solucao:**
```bash
# CORRETO:
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/planka

# ERRADO:
DATABASE_URL=postgresql://postgres@localhost:5432/planka
```

---

## Licao #13: Avatar column e JSON, nao string

**Descoberta em:** v2.2.0 (verificacao de avatares)
**Status:** NOVA (v2.2.0)

**Problema:** A coluna de avatar no banco e `avatar` (tipo JSON com campos
`{dirname, extension, sizeInBytes}`), NAO `avatar_dirname` (string). Queries
que assumem string simples falham silenciosamente.

**Query correta:**
```sql
SELECT avatar->>'dirname' FROM user_account WHERE avatar IS NOT NULL;
```

---

## Licao #14: Session table NAO rastreia atividade em tempo real

**Descoberta em:** v2.2.0, **atualizada em:** girocard deploy (2026-03-27)
**Status:** ATUALIZADA

**Problema:** A tabela `session` NAO atualiza `updated_at` durante uso ativo. Ela so
registra criacao (login) e soft-delete (logout via `deleted_at`). A presenca real dos
usuarios e rastreada via Socket.io rooms in-memory (`@accessToken:*`, `@user:*`), que
nao sao acessiveis via SQL.

**Consequencia:** Queries na tabela `session` com `WHERE updated_at > now() - interval`
SEMPRE retornam 0 resultados, mesmo com usuarios online.

**Fonte correta de atividade (via SQL):** Tabela `action` — registra cada acao do usuario.
```sql
-- Usuarios com atividade recente (fonte real)
SELECT COUNT(DISTINCT user_id) FILTER (WHERE created_at > now() - interval '30 minutes') as ativos_30min
FROM action;

-- Detalhe por usuario
SELECT u.name, a.type, a.created_at
FROM action a JOIN user_account u ON a.user_id = u.id
WHERE a.created_at > now() - interval '3 hours'
ORDER BY a.created_at DESC LIMIT 10;
```

**Complemento (sessoes abertas, nao atividade):**
```sql
-- Sessoes com token nao expirado (indica login ativo, nao necessariamente online)
SELECT u.name, s.created_at FROM session s
JOIN user_account u ON u.id = s.user_id
WHERE s.deleted_at IS NULL ORDER BY s.created_at DESC;
```

---

## Licao #15: Deploy sem migrations = downtime minimo

**Descoberta em:** v2.2.0 (comparacao com v2.1.2)
**Status:** OBSERVACAO

**Dados comparativos:**

| Deploy | Migrations | Downtime |
|--------|-----------|----------|
| v2.1.1 | 23->26 (+3) | ~8min |
| v2.1.2 | 26->28 (+2) | ~10min |
| v2.2.0 | 28->28 (0) | ~1min 23s |

**Conclusao:** Migrations adicionam ~3-5 minutos ao downtime. Quando possivel,
agrupar features que nao precisam de migration para deploys mais rapidos.

---

## Licao #16: Teste de avatares deve usar extensao do DB

**Descoberta em:** v2.2.1
**Status:** NOVA

**Problema:** O teste padrao de avatares usava `.jpg` hardcoded no URL, causando
falso-alarme de 404 para usuarios com avatar PNG. 3 de 7 avatares retornaram 404
ate que a extensao correta foi verificada no banco.

**Solucao:**
```sql
-- Buscar extensao real de cada avatar
SELECT u.name, avatar->>'dirname' as dir, avatar->>'extension' as ext
FROM user_account u WHERE avatar IS NOT NULL;
```

```bash
# Testar com extensao correta do DB
curl -s -o /dev/null -w "%{http_code}" \
  "https://mural.a4tunados.com.br/user-avatars/$dirname/original.$extension"
```

---

## Licao #17: python3 venv falha no servidor — inofensivo

**Descoberta em:** v2.2.1
**Status:** NOVA

**Problema:** `npm rebuild` retorna exit code 1 porque o postinstall script do
server inclui `setup-python` (cria venv para Apprise/notificacoes). No servidor de
producao o venv pode nao inicializar corretamente, mas isso NAO afeta os modulos
nativos (bcrypt, sharp, lodepng) que ja foram compilados antes do postinstall falhar.

**Diagnostico:** Se `npm rebuild` falhar, verificar nativos individualmente:
```bash
cd /opt/a4tunados_mural/server
node -e "require('bcrypt'); console.log('bcrypt OK')"
node -e "require('sharp'); console.log('sharp OK')"
node -e "try { require('lodepng'); console.log('lodepng OK') } catch(e) { console.log('lodepng WARN: ' + e.message) }"
```

**Se os 3 passarem, o erro do python e inofensivo. Prosseguir com o deploy.**

---

## Licao #18: Verificar branch e merge flow antes do deploy

**Descoberta em:** v2.2.1
**Status:** NOVA — incorporada como Etapa 0.5 na skill

**Problema:** O operador pode estar em uma feature branch (`feat/XXX`) e nao em
`master`. Deployar direto de uma feature branch funciona, mas:
- `master` nao tera o codigo deployado (dessincronizacao)
- O gitgraph perde rastreabilidade (sem trilhas visiveis)
- Futuros deploys podem sobrescrever as mudancas

**Solucao — merge flow padrao do projeto:**
```bash
# 1. Verificar branch atual
git branch --show-current

# 2. Se NAO for master, fazer merge flow com --no-ff:
git checkout develop
git merge --no-ff feat/XXX -m "Merge branch 'feat/XXX' into develop"
git checkout master
git merge --no-ff develop -m "Merge branch 'develop'"
git checkout feat/XXX  # retornar

# 3. Verificar gitgraph
git log --oneline --graph --all -10
```

**Por que `--no-ff`?** Sem ele, git faz fast-forward e as trilhas das branches
ficam invisiveis no gitgraph. O `--no-ff` forca a criacao de merge commits que
preservam a topologia visual (trilhas separadas por branch).

**Resultado visual esperado:**
```
*   Merge branch 'develop'                    ← master
|\
| *   Merge branch 'feat/XXX' into develop    ← develop
| |\
| | * commit 3                                ← feat/XXX
| | * commit 2
| | * commit 1
| |/
|/
```

**IMPORTANTE:** Sempre pedir confirmacao do operador antes de executar os merges.
Apresentar as opcoes: (1) merge flow, (2) deploy direto, (3) cancelar.

---

## Licao #19: Verificar atividade de usuarios antes do deploy

**Descoberta em:** v2.3.0
**Status:** NOVA — incorporada na Etapa 0 da skill

**Problema:** Sem verificar sessoes e acoes recentes, o deploy pode derrubar a
plataforma enquanto usuarios estao ativamente usando. Isso causa perda de trabalho
nao salvo (ex: comentario sendo digitado, card sendo editado).

**Solucao — usar tabela `action` (atividade real), NAO `session` (ver licao #14):**
```bash
# Usuarios com atividade recente (fonte REAL)
sudo -u postgres psql -h 127.0.0.1 -d planka -c "
  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE created_at > now() - interval '30 minutes') as ativos_30min,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at > now() - interval '3 hours') as ativos_3h
  FROM action;"

# Detalhe por usuario (ultimas 3h)
sudo -u postgres psql -h 127.0.0.1 -d planka -c "
  SELECT u.name, a.type, a.created_at
  FROM action a JOIN user_account u ON a.user_id = u.id
  WHERE a.created_at > now() - interval '3 hours'
  ORDER BY a.created_at DESC LIMIT 10;"
```

**Classificacao:**
- **0 usuarios ativos (30min)**: Janela ideal — deploy imediato
- **1-2 usuarios ativos**: Informar operador, sugerir aguardar ou comunicar
- **3+ usuarios ativos**: Recomendar adiar ou comunicar todos antes

---

## Licao #20: Recriar venv Python no servidor apos cada deploy

**Descoberta em:** v2.3.0
**Status:** NOVA — incorporada na Etapa 4 da skill

**Problema:** O venv Python (`.venv/`) e copiado do macOS no tarball. No macOS,
o symlink aponta para `python3.13` (path local). No Linux (Ubuntu 25.04), esse
path nao existe, resultando em broken symlink. O `npm rebuild` falha no postinstall
(`setup-python`), mas isso NAO impede os nativos de compilar (licao #17).

**Consequencia:** Apprise (notificacoes Google Chat, Slack, etc) nao funciona.
O app roda normalmente, mas notificacoes externas ficam silenciosamente quebradas.

**Solucao — adicionar apos npm rebuild na Etapa 4:**
```bash
# Recriar venv Python (symlinks macOS sao incompativeis com Linux)
cd /opt/a4tunados_mural/server
rm -rf .venv
python3 -m venv .venv
.venv/bin/pip3 install -r requirements.txt
.venv/bin/python3 -c "import apprise; print('Apprise OK: ' + apprise.__version__)"
```

**IMPORTANTE:** Isso deve ser feito em CADA deploy, nao apenas quando notificacoes falham.
O venv sempre vira quebrado do macOS.

---

## Tabela Resumo

| # | Licao | Categoria | Deploy |
|---|-------|-----------|--------|
| 1 | npm install + rebuild sem args | Dependencias | v2.1.1+v2.1.2 |
| 2 | NUNCA cp -r dir/ dest/ | Filesystem | v2.1.1+v2.1.2 |
| 3 | COPYFILE_DISABLE=1 tar | macOS | v2.1.1 |
| 4 | pm2 flush antes de restart | Diagnostico | v2.1.2 |
| 5 | HTTP curl fonte de verdade | Verificacao | v2.1.2 |
| 6 | Verificar nesting apos restore | Filesystem | v2.1.1+v2.1.2 |
| 7 | Testar avatares via HTTP | Verificacao | v2.1.2 |
| 8 | Attachments em private/ | Paths | v2.1.1 |
| 9 | NUNCA deletar backups | Politica | Permanente |
| 10 | ecosystem usa app.js | Configuracao | v2.1.0 |
| 11 | Limpar ._* apos extract | macOS | v2.1.1 |
| 12 | 127.0.0.1 nao localhost | Rede | Setup |
| 13 | Avatar column e JSON | Schema | v2.2.0 |
| 14 | Session table e `session` | Schema | v2.2.0 |
| 15 | Sem migrations = downtime minimo | Planejamento | v2.2.0 |
| 16 | Teste de avatares com extensao do DB | Verificacao | v2.2.1 |
| 17 | python3 venv falha — inofensivo | Diagnostico | v2.2.1 |
| 18 | Verificar branch + merge flow --no-ff | Git/Processo | v2.2.1 |
| 19 | Verificar atividade de usuarios | Processo | v2.3.0 |
| 20 | Recriar venv Python no servidor | Python/Apprise | v2.3.0 |
