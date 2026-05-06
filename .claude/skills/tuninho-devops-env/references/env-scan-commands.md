# Comandos de Scan — Referencia Rapida

## Processos
```bash
pm2 jlist 2>/dev/null                                    # PM2 JSON list
systemctl list-units --type=service --state=running      # systemd services
ps aux | grep -E "node|next-server|gunicorn|python"      # Processos relevantes
```

## Portas
```bash
ss -tlnp                                                 # TCP listeners com PID
ss -tln                                                  # TCP listeners (sem PID, nao precisa sudo)
lsof -i -P -n | grep LISTEN                             # Alternativa
```

## Nginx
```bash
ls -la /etc/nginx/sites-enabled/                         # Sites ativos
nginx -t 2>&1                                            # Validar config
grep -r "server_name\|proxy_pass" /etc/nginx/sites-enabled/  # Dominos e ports
```

## Database
```bash
find /opt/ -name "*.db" -not -path "*/node_modules/*"    # SQLite files
find /opt/ -name "schema.prisma" -not -path "*/node_modules/*"  # Prisma
grep -r "DATABASE_URL" /opt/ --include=".env*"           # Connection strings
```

## Environment Variables
```bash
grep -r "process\.env\." *.js server/*.js | grep -oP 'process\.env\.\K\w+' | sort -u  # No codigo
cat ecosystem.config.* 2>/dev/null                       # PM2 config
cat .env* 2>/dev/null                                    # .env files
cat dev.sh 2>/dev/null | grep "^export"                  # dev.sh exports
```

## tmux
```bash
tmux list-sessions 2>/dev/null                           # Sessoes ativas
tmux list-sessions -F "#{session_name}" | sed 's/_[0-9]*_.*//' | sort -u  # Prefixes unicos
```

## SSL/TLS
```bash
certbot certificates 2>/dev/null                         # Let's Encrypt certs
ls /etc/letsencrypt/live/                                # Cert directories
openssl x509 -enddate -noout -in /etc/letsencrypt/live/{domain}/fullchain.pem  # Expiry
```

## Dependencies
```bash
node --version && npm --version && pm2 --version         # Node ecosystem
tmux -V && nginx -v 2>&1 && python3 --version            # System tools
claude --version 2>/dev/null                              # Claude CLI
```

## Secrets (NAO catalogar valores, apenas existencia)
```bash
find /opt/ -name ".jwt-secret" -o -name ".github-oauth"  # Secret files
grep -ri "SECRET\|API_KEY\|TOKEN" /opt/*/. --include=".env*" | grep -v node_modules  # Env secrets
```
