# Procedimentos de Bootstrap — Tuninho DevOps Hostinger Alfa

> Procedimentos para configurar o servidor Hostinger Alfa pela primeira vez
> ou adicionar um novo projeto ao servidor ja configurado.

---

## Bootstrap do Servidor (primeira vez absoluta)

### 1. Atualizar sistema

```bash
apt-get update && apt-get upgrade -y
```

### 2. Instalar Node.js 22.x LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v  # Deve retornar v22.x.x
npm -v   # Deve retornar 10.x.x
```

### 3. Instalar PM2

```bash
npm install -g pm2
pm2 -v
pm2 startup  # Configura auto-start no boot
```

### 4. Instalar Nginx

```bash
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v
```

### 5. Instalar Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --version
```

### 6. Instalar SQLite (se nao presente)

```bash
apt-get install -y sqlite3
sqlite3 --version
```

### 7. Criar estrutura base

```bash
mkdir -p /opt/hostinger-alfa/nginx/sites
mkdir -p /opt/hostinger-alfa/backups
```

### 8. Configurar Nginx para usar sites customizados

Adicionar ao `nginx.conf` (se nao existir):
```bash
# Verificar se ja inclui
grep 'hostinger-alfa' /etc/nginx/nginx.conf

# Se nao, adicionar dentro do bloco http {}:
# include /opt/hostinger-alfa/nginx/sites/*.conf;
```

**Alternativa (mais segura):** usar symlinks em `/etc/nginx/sites-enabled/` (preferido).

### 9. Configurar firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 10. Verificar

```bash
echo "=== OS ==="
cat /etc/os-release

echo "=== Node ==="
node -v

echo "=== PM2 ==="
pm2 -v

echo "=== Nginx ==="
nginx -v

echo "=== Certbot ==="
certbot --version

echo "=== SQLite ==="
sqlite3 --version

echo "=== Disco ==="
df -h /

echo "=== Firewall ==="
ufw status
```

---

## Bootstrap de Novo Projeto (servidor ja configurado)

### 1. Criar diretorio do projeto

```bash
mkdir -p /opt/hostinger-alfa/{projeto}
mkdir -p /opt/hostinger-alfa/{projeto}/logs
```

### 2. Atribuir porta

Consultar server-registry para proxima porta disponivel.
Convencao: comecar em 3001, incrementar para cada projeto.

```bash
# Verificar portas em uso
ss -tlnp | grep LISTEN
```

### 3. Verificar DNS

```bash
dig +short {dominio}
# Deve retornar 31.97.243.191
```

### 4. Configurar Nginx

Criar config em `/opt/hostinger-alfa/nginx/sites/{projeto}.conf`
(usar template de `references/nginx-templates.md`)

```bash
ln -sf /opt/hostinger-alfa/nginx/sites/{projeto}.conf /etc/nginx/sites-enabled/{projeto}.conf
nginx -t
systemctl reload nginx
```

### 5. Obter SSL

```bash
certbot --nginx -d {dominio} --non-interactive --agree-tos --email victorgaudio@4tuna.com.br
certbot certificates | grep {dominio}
```

### 6. Criar .env.production

```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > /opt/hostinger-alfa/{projeto}/.env.production << EOF
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="https://{dominio}"
NODE_ENV="production"
PORT={porta}
EOF
```

### 7. Criar ecosystem.config.js

```bash
cat > /opt/hostinger-alfa/{projeto}/ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: '{projeto}',
    script: 'node_modules/.bin/next',
    args: 'start -p {porta}',
    cwd: '/opt/hostinger-alfa/{projeto}',
    env: {
      NODE_ENV: 'production',
      PORT: {porta}
    },
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/opt/hostinger-alfa/{projeto}/logs/pm2-error.log',
    out_file: '/opt/hostinger-alfa/{projeto}/logs/pm2-out.log'
  }]
}
PM2
```

### 8. Deploy da aplicacao

Seguir Stages 3 → 5 do fluxo principal.

### 9. Atualizar sidecar e server-registry

Criar `projects/{projeto}/config.md` e atualizar `server-registry.json`.

---

## Checklist de Bootstrap

- [ ] Runtimes verificados/instalados
- [ ] Diretorio do projeto criado
- [ ] Porta atribuida (sem conflito)
- [ ] DNS configurado e propagado
- [ ] Nginx reverse proxy configurado
- [ ] nginx -t OK
- [ ] SSL obtido via certbot
- [ ] .env.production criado com secrets
- [ ] ecosystem.config.js criado
- [ ] App deployada e rodando
- [ ] HTTP 200 local e HTTPS 200 externo
- [ ] Sidecar criado
- [ ] Server-registry atualizado
