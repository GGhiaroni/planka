# Templates Nginx — Tuninho DevOps Hostinger Alfa

> Templates de configuracao Nginx para reverse proxy com SSL.
> Adaptar variaveis {PROJETO}, {DOMINIO}, {PORTA} para cada projeto.

---

## Template: Next.js Reverse Proxy (HTTP only — pre-SSL)

Usar este template ANTES de executar certbot. O certbot adicionara as diretivas SSL automaticamente.

```nginx
# /opt/hostinger-alfa/nginx/sites/{PROJETO}.conf
# Gerado por tuninho-devops-hostinger

server {
    listen 80;
    server_name {DOMINIO};

    # Limites para upload de arquivos
    client_max_body_size 10M;

    # Proxy para Next.js
    location / {
        proxy_pass http://127.0.0.1:{PORTA};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para assets estaticos do Next.js
    location /_next/static {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Cache para imagens otimizadas do Next.js
    location /_next/image {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 60d;
        access_log off;
    }

    # Arquivos estaticos em /public
    location /uploads {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 30d;
        access_log off;
    }
}
```

---

## Template: Pos-certbot (referencia)

Apos `certbot --nginx`, o arquivo sera modificado automaticamente para incluir:

```nginx
server {
    listen 80;
    server_name {DOMINIO};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {DOMINIO};

    ssl_certificate /etc/letsencrypt/live/{DOMINIO}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMINIO}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:{PORTA};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    location /_next/image {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 60d;
        access_log off;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:{PORTA};
        expires 30d;
        access_log off;
    }
}
```

---

## Template: Aplicacao Estatica (SPA/Vite)

Para projetos que sao apenas arquivos estaticos (sem Node server):

```nginx
server {
    listen 80;
    server_name {DOMINIO};

    root /opt/hostinger-alfa/{PROJETO}/dist;
    index index.html;

    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Comandos uteis

```bash
# Testar configuracao antes de aplicar
nginx -t

# Recarregar sem downtime
systemctl reload nginx

# Ver logs de erro
tail -50 /var/log/nginx/error.log

# Ver logs de acesso
tail -50 /var/log/nginx/access.log

# Listar sites habilitados
ls -la /etc/nginx/sites-enabled/

# Verificar certificados SSL
certbot certificates

# Renovar certificados (manual, normalmente automatico)
certbot renew --dry-run

# Ver configuracao ativa de um site
nginx -T | grep -A 30 "server_name {DOMINIO}"
```

---

## Regras

1. **SEMPRE** usar `nginx -t` antes de `systemctl reload nginx`
2. **SEMPRE** usar 127.0.0.1, NUNCA localhost no proxy_pass
3. **NUNCA** editar configs diretamente em `/etc/nginx/sites-enabled/` — editar em `/opt/hostinger-alfa/nginx/sites/` e usar symlink
4. **SEMPRE** definir `client_max_body_size` compativel com o projeto (BatutaManager: 10M)
5. **SEMPRE** incluir headers de proxy (Host, X-Real-IP, X-Forwarded-*)
