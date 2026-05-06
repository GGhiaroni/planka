# Sidecar — openvscode-ide

> Vendor third-party (Gitpod openvscode-server) rodando via Docker Compose em hostinger-alfa,
> com **GitHub OAuth via oauth2-proxy** restringindo acesso a `victorgaudio`.
> **Sem source git nosso** — imagem upstream `gitpod/openvscode-server:latest` é a fonte de verdade.
> Substitui o experimento anterior com `coder-7ftr` (descontinuado em 2026-05-01 após teste rápido —
> volumes Docker `coder-7ftr_coder-data` e `coder-7ftr_db` preservados pra rollback se necessário).

## Projeto

- **Nome**: openvscode-ide
- **Perfil**: `docker-vendor` (proposto — segundo caso na frota; primeiro foi coder-7ftr, descontinuado)
- **Stack**: Gitpod openvscode-server (`gitpod/openvscode-server:latest`) **+ oauth2-proxy** (`quay.io/oauth2-proxy/oauth2-proxy:latest`) — autenticação GitHub OAuth na frente
- **Domínio**: `dev.ide.tuninho.ai` (DNS A → 31.97.243.191, AAAA → 2a02:4780:14:f829::1)
- **Porta do host**: `4180` (oauth2-proxy é o entry point); bind `127.0.0.1:4180:4180`
- **Porta interna do openvscode** (rede compose, não exposta no host): `3000` (canônica do openvscode-server)
- **Servidor**: hostinger-alfa
- **App path**: `/docker/openvscode-ide/`
- **Deploy mode**: `IN_PLACE` (sem tarball/SCP — `docker compose pull && docker compose up -d`)
- **Bootstrap**: 2026-05-01 (substitui coder-7ftr no mesmo domínio; OAuth adicionado no mesmo dia substituindo connection token inicial)

## Topologia

```
Browser
  ↓ HTTPS (cert Let's Encrypt em dev.ide.tuninho.ai)
nginx (host:443)
  ↓ proxy_pass http://127.0.0.1:4180
oauth2-proxy (container openvscode-ide-oauth2)
  • Valida cookie _oauth2_proxy; se ausente, redireciona pra GitHub
  • Após callback, valida que user é victorgaudio, seta cookie de 7 dias
  ↓ http://server:3000 (rede interna do compose)
openvscode-server (container openvscode-ide, sem auth interna)
```

## Particularidades de deploy

### Containers
- **`openvscode-ide`** (`gitpod/openvscode-server:latest`):
  - User `1000:1000` (workspace `/home/workspace` owned por UID 1000)
  - Sem build local — pull do Docker Hub
  - Sem socket Docker (diferente do Coder; openvscode NÃO orquestra outros containers)
  - **NÃO expõe porta no host** — só `expose: 3000` (acessível via rede interna do compose). Garante que oauth2-proxy é o único caminho público.
  - Entrypoint customizado: roda `--host 0.0.0.0 --port 3000 --without-connection-token` (auth é responsabilidade do oauth2-proxy). **`--without-connection-token` é obrigatório**: ao sobrescrever o entrypoint, perdemos o flag default da imagem, e sem ele openvscode gera token random e exige na URL → oauth2-proxy recebe 403 ao proxar.
- **`openvscode-ide-oauth2`** (`quay.io/oauth2-proxy/oauth2-proxy:latest`):
  - Bind `127.0.0.1:4180:4180` (loopback only — público via nginx)
  - Provider `github`, restrição `--github-user=victorgaudio`
  - Cookie de sessão `_oauth2_proxy` (Secure, HttpOnly, expire 168h = 7 dias)
  - `--reverse-proxy=true` (confia em `X-Forwarded-*` do nginx; necessário pra gerar redirect URLs HTTPS)
  - `depends_on: server (service_healthy)` — só sobe quando openvscode passou healthcheck
- **Restart policy**: `unless-stopped` em ambos
- **Healthcheck do openvscode**: `curl http://127.0.0.1:3000/` aceitando `200|302|403` (403 é estado normal sem auth interna; o que importa é o server atendendo). Intervalo 30s, retries 3, start_period 15s.

### Persistência

Um volume Docker nomeado:
- `openvscode-ide_workspace` → `/home/workspace` no container (todo o trabalho do user)

**Backup recomendado** (não automatizado):
```bash
docker run --rm -v openvscode-ide_workspace:/from -v /opt/hostinger-alfa/backups/openvscode-ide:/to alpine \
  tar czf /to/workspace-$(date +%F).tgz -C /from .
```

### Rede

- Rede Docker isolada: `openvscode-ide_default`
- DNS interno do Compose resolve `server` → container do openvscode (oauth2-proxy fala com `http://server:3000`)
- Único caminho público: `127.0.0.1:4180` → nginx → mundo externo via `dev.ide.tuninho.ai`

## Auth — GitHub OAuth via oauth2-proxy

**Crítico**: openvscode-server **não suporta OAuth nativamente** (é "minimal bits required to run VS Code in a server scenario"). Por isso o oauth2-proxy fica na frente, intercepta todo request, valida sessão, e só repassa pro openvscode quando autenticado.

### OAuth App no GitHub
- **Tipo**: OAuth App tradicional (não GitHub App, não Firebase)
- **Application name**: `Tuninho IDE Dev (openvscode)` (ou similar — escolha do operador no momento de registrar)
- **Homepage URL**: `https://dev.ide.tuninho.ai`
- **Authorization callback URL**: `https://dev.ide.tuninho.ai/oauth2/callback` (path padrão do oauth2-proxy)
- **NÃO É** o mesmo App do `tuninho-ide-web` — OAuth Apps tradicionais têm callback fixo num único host; reuso impossível por design do GitHub. Cada subdomínio precisa do seu próprio App.

### Restrição de usuário
- `OAUTH2_PROXY_GITHUB_USERS=victorgaudio` no compose
- Qualquer outro user GitHub que tente logar (mesmo se autorizar o App) é bloqueado pelo oauth2-proxy com 403 + log `not in allowed_users list`

### Fluxo de login
1. Browser visita `https://dev.ide.tuninho.ai/`
2. oauth2-proxy detecta ausência do cookie `_oauth2_proxy` → 302 → `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=https%3A%2F%2Fdev.ide.tuninho.ai%2Foauth2%2Fcallback&scope=user%3Aemail+read%3Auser&state=...`
3. GitHub autentica user; redireciona pra `https://dev.ide.tuninho.ai/oauth2/callback?code=...&state=...`
4. oauth2-proxy troca `code` por access_token via `https://github.com/login/oauth/access_token`
5. Pega perfil em `https://api.github.com/user`; valida que `login == victorgaudio`
6. Seta cookie `_oauth2_proxy` (sessão de 7 dias) e redireciona pra `/`
7. openvscode carrega normalmente (oauth2-proxy proxa internamente)

### Endpoints administrativos do oauth2-proxy
- `/oauth2/sign_in` — página de login (raramente usada com `--skip-provider-button=true`)
- `/oauth2/sign_out` — limpa cookie e redireciona
- `/oauth2/userinfo` — retorna JSON com user logado (útil pra debug)
- `/oauth2/auth` — endpoint de validação (HTTP 200 se autenticado, 401 se não)

### Rotacionar credenciais
- **Client Secret**: gerar novo no GitHub, atualizar `GITHUB_CLIENT_SECRET` em `.env`, `docker compose up -d --force-recreate oauth2-proxy`. Sessões existentes não invalidam (cookie é validado localmente).
- **Cookie Secret**: `NEW=$(openssl rand -hex 16)`, atualizar `OAUTH2_PROXY_COOKIE_SECRET`, recreate. **Invalida todos os cookies existentes** — todos os users precisam relogar.
- **Adicionar/remover user da whitelist**: editar `OAUTH2_PROXY_GITHUB_USERS` no compose (vírgula separa múltiplos), recreate.

## Env vars produção

Arquivo: `/docker/openvscode-ide/.env` (perm 600).

**Sensitive**:
- `GITHUB_CLIENT_ID` — Client ID do OAuth App no GitHub (público; ID identificador, não secret real)
- `GITHUB_CLIENT_SECRET` — Client Secret do OAuth App (sensível!)
- `OAUTH2_PROXY_COOKIE_SECRET` — chave de assinatura do cookie de sessão (16/24/32 bytes; gerada via `openssl rand -hex 16`)

**Hardcoded no compose** (não secrets):
- Endereços, portas, callback URL, escopo OAuth, lista de users permitidos

## docker-compose.yml (estado atual no servidor)

```yaml
services:
  server:
    image: gitpod/openvscode-server:latest
    container_name: openvscode-ide
    restart: unless-stopped
    expose:
      - "3000"
    user: "1000:1000"
    entrypoint:
      - /bin/sh
      - -c
      - |
        exec /home/.openvscode-server/bin/openvscode-server \
          --host 0.0.0.0 \
          --port 3000 \
          --without-connection-token
    volumes:
      - workspace:/home/workspace
    healthcheck:
      test: ["CMD-SHELL", "code=$$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/) && echo $$code | grep -qE '^(200|302|403)$$'"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:latest
    container_name: openvscode-ide-oauth2
    restart: unless-stopped
    depends_on:
      server:
        condition: service_healthy
    ports:
      - "127.0.0.1:4180:4180"
    environment:
      OAUTH2_PROXY_PROVIDER: github
      OAUTH2_PROXY_CLIENT_ID: ${GITHUB_CLIENT_ID}
      OAUTH2_PROXY_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      OAUTH2_PROXY_COOKIE_SECRET: ${OAUTH2_PROXY_COOKIE_SECRET}
      OAUTH2_PROXY_COOKIE_SECURE: "true"
      OAUTH2_PROXY_COOKIE_HTTPONLY: "true"
      OAUTH2_PROXY_COOKIE_EXPIRE: 168h
      OAUTH2_PROXY_HTTP_ADDRESS: 0.0.0.0:4180
      OAUTH2_PROXY_UPSTREAMS: http://server:3000
      OAUTH2_PROXY_REDIRECT_URL: https://dev.ide.tuninho.ai/oauth2/callback
      OAUTH2_PROXY_GITHUB_USERS: victorgaudio
      OAUTH2_PROXY_EMAIL_DOMAINS: "*"
      OAUTH2_PROXY_REVERSE_PROXY: "true"
      OAUTH2_PROXY_SCOPE: "user:email read:org"
      OAUTH2_PROXY_SKIP_PROVIDER_BUTTON: "true"
      OAUTH2_PROXY_PASS_AUTHORIZATION_HEADER: "true"
      OAUTH2_PROXY_WHITELIST_DOMAINS: dev.ide.tuninho.ai

volumes:
  workspace:
```

**Pontos sutis**:
- `expose: ["3000"]` em vez de `ports:` deixa o openvscode acessível só pela rede interna do compose. oauth2-proxy fala com ele via `http://server:3000` (DNS interno do Docker).
- `OAUTH2_PROXY_REVERSE_PROXY: "true"` é crítico — sem ele, oauth2-proxy não confia nos headers `X-Forwarded-Proto`/`X-Forwarded-For` do nginx e gera redirect URLs erradas (HTTP em vez de HTTPS).
- `depends_on: condition: service_healthy` evita race no startup.
- `OAUTH2_PROXY_COOKIE_SECRET` precisa ser **16, 24 ou 32 bytes** (UTF-8) — `openssl rand -hex 16` produz 32 chars hex = 32 bytes válidos. `openssl rand -base64 32` gera 44 chars = inválido.

## Nginx vhost (estado atual)

Localização: `/opt/hostinger-alfa/nginx/sites/openvscode-ide.conf` (symlink em `/etc/nginx/sites-enabled/`).

```nginx
server {
    server_name dev.ide.tuninho.ai;

    client_max_body_size 100M;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;

    location / {
        proxy_pass http://127.0.0.1:4180;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/dev.ide.tuninho.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.ide.tuninho.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = dev.ide.tuninho.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    listen [::]:80;
    server_name dev.ide.tuninho.ai;
    return 404;
}
```

## Sequência operacional

### Recreate (após editar compose ou .env)
```bash
cd /docker/openvscode-ide
docker compose up -d --force-recreate
docker compose ps
docker compose logs -f --tail=20
```

### Atualizar imagens
```bash
cd /docker/openvscode-ide
docker compose pull
docker compose up -d
```

### Logs
```bash
docker logs openvscode-ide-oauth2 --tail 50 -f   # auth events
docker logs openvscode-ide --tail 50 -f          # IDE events
```

### Forçar logout
```bash
# Para um único user, basta o usuário visitar https://dev.ide.tuninho.ai/oauth2/sign_out
# Para invalidar TODAS as sessões, rotacionar OAUTH2_PROXY_COOKIE_SECRET (ver "Rotacionar credenciais")
```

### Verificar quem está logado (não há registro persistente)
```bash
# oauth2-proxy não mantém DB de sessões. Logs mostram quem está acessando:
docker logs openvscode-ide-oauth2 | grep -E "AuthSuccess|AuthFail" | tail -20
```

## Issues conhecidos

- **Imagem `:latest`**: ambas as imagens (`gitpod/openvscode-server` e `oauth2-proxy`) usam tag `:latest`. Recomendado pinar versões em produção. Iteração futura.
- **Scope `read:org` é obrigatório**: oauth2-proxy faz `GET /user/orgs` no fluxo de callback (mesmo com `OAUTH2_PROXY_GITHUB_USERS` configurado), e isso requer scope `read:org` no token. Se ficar só com `user:email`, o callback retorna 500 com `"You need at least read:org scope or user scope to list your organizations"`. Mantenha `OAUTH2_PROXY_SCOPE: "user:email read:org"`. (Aprendizado da Op de bootstrap em 2026-05-01.)
- **Override de entrypoint perde `--without-connection-token` default**: ao customizar o entrypoint do openvscode-server (pra remover flag de token explícito ou ajustar host/port), é fácil esquecer de adicionar `--without-connection-token` — sem ele, o openvscode gera token random no startup e retorna 403 pra qualquer request sem `?tkn=`, fazendo o oauth2-proxy receber 403 ao proxar internamente. Sintoma: AuthSuccess no log do oauth2-proxy, mas `GET /` devolve 403 com 10 bytes de body ("Forbidden\n"). (Aprendizado da Op de bootstrap em 2026-05-01.)
- **Warning `--reverse-proxy` sem `--trusted-proxy-ip`**: oauth2-proxy aceita X-Forwarded-* de qualquer IP. No nosso caso isso é mitigado pelo bind em `127.0.0.1:4180` (só nginx local fala com ele). Pode ser tightenado adicionando `OAUTH2_PROXY_TRUSTED_PROXY_IPS: "127.0.0.1"`.
- **Sem git config global no container**: o user 1000 dentro do container não tem `~/.gitconfig` — precisa configurar `git config --global user.name/email` na primeira sessão do workspace, ou montar `~/.gitconfig` via volume bind.
- **Reuso de OAuth App entre subdomínios é impossível**: GitHub valida `redirect_uri` exato. Cada subdomínio precisa do seu próprio OAuth App (tuninho-ide-web e openvscode-ide têm Apps separados, com client_id/secret próprios).

## Cross-projects no host (verificação de não-conflito)

| Projeto | Porta host | Domínio | Process |
|---|---|---|---|
| maestrofieldmanager | 3001 | maestro.fourtuna.com.br | pm2 |
| familygames | 3030 | familysundaygames.fourtuna.com.br | pm2 |
| orquestravoadora | 3040 | oficinaorquestravoadora2026.55jam.com.br | systemd |
| tuninho-ide-web | 3847 | tuninhoideweb.fourtuna.com.br | pm2 |
| claude-sessions-service | 3848 | (path-based) | pm2 |
| chooz_2026 | 3849 | chooz2026.fourtuna.com.br | pm2 |
| weplus_prototipo | 3850 | weplus.a4tunados.com.br | pm2 |
| **openvscode-ide (oauth2-proxy)** | **4180** | **dev.ide.tuninho.ai** | **docker compose** |

Sem conflito. Próxima porta livre: `3851` (liberada após este redesign — antes era usada como bind do openvscode direto).

## Histórico de Deploys

| Data | Imagens | Tipo | Notas |
|---|---|---|---|
| 2026-05-01 | `gitpod/openvscode-server:latest` | bootstrap (substitui coder-7ftr) | Trocado Coder por openvscode-server. Cert Let's Encrypt reutilizado. Auth inicial via `--connection-token` (modo fallback até OAuth ser configurado). |
| 2026-05-01 | + `quay.io/oauth2-proxy/oauth2-proxy:latest` | OAuth GitHub adicionado | Connection token removido. oauth2-proxy entre nginx e openvscode. Restrição a `victorgaudio`. Bind do openvscode mudou de `127.0.0.1:3851:3000` para `expose: 3000` (rede interna). Bind público virou oauth2-proxy em `127.0.0.1:4180`. |

---

**Sidecar v2.0.0** — atualizado 2026-05-01 com migração para GitHub OAuth via oauth2-proxy. Bump major porque a estrutura de auth e topologia de portas mudou completamente.
