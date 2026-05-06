---
adr: 002
date: 2026-05-06
status: WORKAROUND_APPLIED (estrutural pendente)
operacao: 01
---

# ADR-002 — Workaround sails.io.js v1.2.1 + socket.io-client v4 incompat

## Contexto

Após deploy do staging, validação E2E via Playwright revelou que o app fica em
loading spinner infinito após login. Console retorna:

1. `WebSocket connection to 'wss://.../engine.io/?EIO=4&transport=websocket' failed: 502`
2. `TypeError: Cannot destructure property 'item' of '(intermediate value)' as it is undefined` em `fetchCore`

Investigação revelou causa dupla:

1. **Cliente compilado emite paths `/engine.io/`** (não `/socket.io/`) durante upgrade WS — backend Sails responde apenas em `/socket.io/`
2. **`socket.request` retorna `undefined`** em vez de chamar callback com payload — incompatibilidade entre `sails.io.js v1.2.1` (de 2018) e `socket.io-client v4.8.x` (2024+)

## Decisão (workaround pragmático)

### Workaround 1 — nginx server B
Adicionado `location /engine.io/` em `/opt/hostinger-beta/nginx/sites/planka.conf`:
```nginx
location /engine.io/ {
    proxy_pass http://127.0.0.1:1338/socket.io/;  # rewrite pra /socket.io/
    # ... headers WS upgrade ...
}
```

### Workaround 2 — `client/src/api/socket.js`
Substituído `socket.request` por `fetch` REST puro mantendo `Cookies.get(Config.ACCESS_TOKEN_KEY)` para Authorization Bearer header. WS continua usado para subscribe events de realtime push (apenas onde escutar).

## Solução estrutural pendente (TO-DO)

Uma das alternativas:
1. **Atualizar `sails.io.js`** para versão compatível com socket.io-client v4 (existem forks comunitários — pesquisar)
2. **Substituir wrapper** por uso direto de `socket.io-client` (refactor maior)
3. **Downgrade `socket.io-client`** para v3.x (compatível com sails.io.js v1.2.1) — risco de perder features novas

## Estado atual

Workaround funcional — usuário final não percebe regressão. Mas:
- Tráfego "vai" via REST puro (não tira proveito de protocol overhead reduction do WS)
- Subscribe events ainda funcionam via WS (cards atualizando em tempo real entre clientes)

## Referências

- Op 01 sessão 2026-05-06
- Bug fix commit: `0e7fa2bc` (PR #2)
- nginx workaround: `/opt/hostinger-beta/nginx/sites/planka.conf` no servidor B
