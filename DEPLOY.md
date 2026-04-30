# Deploy na Hostinger (ou qualquer VPS Linux)

Guia passo a passo pra colocar Planka customizado + formulários no ar com HTTPS automático.

## Pré-requisitos no VPS

- **Hostinger VPS** (recomendado: KVM 2 ou superior — 2GB RAM, pra build do client não estourar memória)
- **Ubuntu 22.04+** ou **Debian 12+**
- Acesso SSH como root (ou usuário com sudo)
- 2 domínios/subdomínios apontados pro IP do VPS (registros DNS tipo `A`):
  - `app.seudominio.com.br` → Planka
  - `formularios.seudominio.com.br` → ticket-form

---

## 1. Conectar no VPS

```bash
ssh root@SEU_IP_DO_VPS
```

## 2. Instalar Docker + Docker Compose

```bash
# Atualiza pacotes
apt update && apt upgrade -y

# Instala Docker oficial
curl -fsSL https://get.docker.com | sh

# Verifica
docker --version
docker compose version
```

## 3. Clonar o projeto

```bash
cd /opt
git clone https://github.com/SEU_USUARIO/planka.git
cd planka
```

> Se o repo é privado, configure SSH key ou use HTTPS com token.

## 4. Configurar variáveis de ambiente

```bash
cp .env.example .env

# Gera secrets fortes
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "SECRET_KEY=$(openssl rand -hex 64)"
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)"

# Edite o .env e cole os valores gerados, mais os domínios
nano .env
```

**Mínimo necessário pra subir:** `PLANKA_DOMAIN`, `FORM_DOMAIN`, `LETSENCRYPT_EMAIL`, `POSTGRES_PASSWORD`, `SECRET_KEY`, `ADMIN_*`, `PLANKA_FORM_*`. Os IDs (`PLANKA_LIST_ID`, etc.) preenchemos depois.

## 5. Confirmar que os DNS estão apontando

```bash
dig +short app.seudominio.com.br      # deve retornar o IP do VPS
dig +short formularios.seudominio.com.br
```

> Se não estiver, **espere a propagação antes de continuar**, senão o Caddy não consegue gerar o certificado SSL.

## 6. Primeira subida (sem o ticket-form)

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build planka postgres caddy
```

Isso:
- Faz o build da imagem customizada do Planka (~3-5 min na primeira vez)
- Sobe Postgres + Planka + Caddy
- O Caddy provisiona SSL automaticamente

Acompanhe os logs até estabilizar:
```bash
docker compose -f docker-compose.prod.yml logs -f planka caddy
```

Quando ver `Server lifted in ...` no log do planka, está pronto.

## 7. Configurar Planka

Acesse `https://app.seudominio.com.br` e faça login com as credenciais admin do `.env`.

Crie:

### Board "Design" (artes)
- Projeto: **Design**
- Board: **Design** (defaultView: kanban — padrão)
- Lista: **Demanda** (e outras se quiser: Produção, Aprovação, Entregue)

### Board "Chamados Técnicos" (manutenção)
- Projeto: **Chamados Técnicos**
- Board: **Chamados Técnicos** (defaultView: **table** — alterar via Mais ações → Editar)
- Listas: **Em Espera**, **Em Execução**, **Executados**
- 8 etiquetas de prioridade (Rótulos no board):
  - 🟢 BAIXA PRIORIDADE — `bright-moss`
  - 🟡 MÉDIA GRAVIDADE — `egg-yellow`
  - 🔴 URGÊNCIA — `berry-red`
  - 🩵 EM TRATAMENTO — `turquoise-sea`
  - 🔵 ATUALIZAÇÃO DO TRATAMENTO — `midnight-blue`
  - 🟠 PENDÊNCIAS DE INSTALAÇÃO — `pumpkin-orange`
  - 💗 EM ESPERA — `pink-tulip`
  - 🟣 MÁXIMA PRIORIDADE — `lilac-eyes`

## 8. Coletar os IDs

Abra o Planka, abra o DevTools (F12) → aba **Network** → clique em qualquer card → veja a resposta JSON: ela contém `listId` e os `labelIds` da board. Anote.

Ou via API direto no terminal do VPS:
```bash
TOKEN=$(curl -s -X POST https://app.seudominio.com.br/api/access-tokens \
  -H 'Content-Type: application/json' \
  -d '{"emailOrUsername":"admin","password":"SUA_SENHA_ADMIN"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['item'])")

curl -s https://app.seudominio.com.br/api/projects \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Você verá os IDs de projetos, boards e listas. Pra labels, busque no board específico:
```bash
curl -s https://app.seudominio.com.br/api/boards/BOARD_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## 9. Preencher .env e subir o ticket-form

Edite o `.env` com os IDs coletados:
```env
PLANKA_LIST_ID=<id da lista Demanda no board Design>
PLANKA_CHAMADOS_LIST_ID=<id da lista Em Espera no board Chamados>
PRIORITY_LABELS=BAIXA PRIORIDADE:<id>,MÉDIA GRAVIDADE:<id>,URGÊNCIA:<id>,...
```

Suba o ticket-form:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d ticket-form
```

Acesse `https://formularios.seudominio.com.br` — deve carregar a landing com os 2 formulários.

---

## Operação no dia-a-dia

### Ver logs
```bash
docker compose -f docker-compose.prod.yml logs -f          # tudo
docker compose -f docker-compose.prod.yml logs -f planka   # só Planka
```

### Reiniciar um serviço (após editar .env)
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d ticket-form
```

### Atualizar o código
```bash
cd /opt/planka
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Backup do banco
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres planka > planka-backup-$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
cat planka-backup-XXXXXXXX.sql | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres planka
```

### Parar tudo
```bash
docker compose -f docker-compose.prod.yml down
```

> **Atenção:** `down -v` apaga os volumes (banco, anexos, certificados). Use só com backup.

---

## Troubleshooting

### Caddy não consegue gerar SSL
- Verifique que os DNS estão propagados: `dig +short SEU_DOMINIO`
- Verifique que portas 80 e 443 estão abertas no firewall do VPS:
  ```bash
  ufw allow 80/tcp && ufw allow 443/tcp && ufw reload
  ```
- Veja logs: `docker compose -f docker-compose.prod.yml logs caddy`

### Build do Planka falha por falta de memória
- VPS muito pequena (1 GB RAM). Soluções:
  - Upgrade pra 2 GB+
  - OU build local na sua máquina e push pra registry, depois pull no VPS
  - OU adicione swap temporário:
    ```bash
    fallocate -l 2G /swapfile && chmod 600 /swapfile
    mkswap /swapfile && swapon /swapfile
    ```

### Formulário retorna erro 502
- O ticket-form não consegue falar com Planka. Verifique:
  ```bash
  docker compose -f docker-compose.prod.yml logs ticket-form
  ```
- Cheque se `PLANKA_FORM_EMAIL` / `PLANKA_FORM_PASSWORD` estão corretos
- Cheque se `PLANKA_LIST_ID` aponta pra uma lista existente
