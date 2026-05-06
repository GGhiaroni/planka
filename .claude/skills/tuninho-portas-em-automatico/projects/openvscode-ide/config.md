# Portas — openvscode-ide

> Vendor third-party (Gitpod openvscode-server) atrás de oauth2-proxy. **Entry point público é a porta do oauth2-proxy** (4180), não a do openvscode (que ficou só interna ao compose).

## Resumo

| Aspecto | Valor |
|---|---|
| **Entry point público (host)** | `4180` (oauth2-proxy) |
| **Bind do entry point** | `127.0.0.1:4180:4180` (loopback only — público via nginx) |
| **Porta interna do openvscode** | `3000` (canônica do upstream); **NÃO exposta no host** — só `expose: 3000` na rede do compose |
| Range | `4180` está fora do range padrão `3000-3999`, mas é a porta canônica do oauth2-proxy upstream — exceção justificada |
| CDP port | N/A |
| Repo root | `/docker/openvscode-ide/` |
| Container `ports:` clause | `oauth2-proxy: ["127.0.0.1:4180:4180"]`; `server: expose: ["3000"]` |

## Arquitetura de duas portas

A topologia atual é em duas camadas:

1. **Pública** (acessada via nginx): `127.0.0.1:4180` — oauth2-proxy. Recebe todo tráfego do mundo externo, valida sessão GitHub OAuth, redireciona pra GitHub se anônimo.
2. **Interna** (rede docker `openvscode-ide_default`): `server:3000` — openvscode-server sem auth. Acessível APENAS pelo oauth2-proxy via DNS interno do compose (`http://server:3000`). Não tem `ports:` no host — `expose: 3000` faz só publicação interna.

Essa separação garante que **não há caminho público pro openvscode sem passar pelo oauth2-proxy**. Mesmo que alguém adivinhe a porta `3000`, ela não escuta no host.

## Por que 4180 está fora do range a4tunados (3000-3999)

- `4180` é a porta canônica do `oauth2-proxy` (default upstream — `--http-address=0.0.0.0:4180`)
- Manter porta upstream-canonical facilita troubleshooting (logs, docs, exemplos)
- A regra de range a4tunados se aplica a serviços a4tunados próprios; vendor pode usar exceção quando há razão
- Caso semelhante anterior: o coder-7ftr (descontinuado) usou 7080 (canônica do Coder) também como exceção

## Particularidades

- **Vendor third-party**: 2 imagens oficiais (`gitpod/openvscode-server`, `quay.io/oauth2-proxy/oauth2-proxy`)
- **`docker-compose.yml`**: 2 serviços, 1 volume, 1 healthcheck, 1 depends_on com condition health
- **Auth via GitHub OAuth**: oauth2-proxy restringe a `victorgaudio` via env var `OAUTH2_PROXY_GITHUB_USERS`
- **Cookie de sessão**: 7 dias, `Secure`, `HttpOnly`, `SameSite=Lax`
- **WebSocket**: openvscode usa Upgrade em `/` (terminal, VS Code remote APIs). oauth2-proxy proxa transparente. Vhost nginx em `/opt/hostinger-alfa/nginx/sites/openvscode-ide.conf` configura headers Upgrade/Connection + `proxy_buffering off` + `proxy_read_timeout 86400s`.

## Cross-check

```bash
# Esperado: docker-proxy em 127.0.0.1:4180
ss -tlnp | grep ':4180 '

# Esperado: VAZIO (porta 3000 do openvscode NÃO está bound no host)
ss -tlnp | grep ':3000 ' && echo "ALERTA: porta interna do openvscode exposta no host!"

# Containers up: openvscode-ide (healthy) + openvscode-ide-oauth2
docker compose -f /docker/openvscode-ide/docker-compose.yml ps
```

Próxima porta a4tunados livre: `3851` (liberada após esta migração — antes era usada como bind do openvscode direto, agora não é mais).

---

**Config v2.0.0** — atualizado 2026-05-01 com migração para arquitetura oauth2-proxy.
