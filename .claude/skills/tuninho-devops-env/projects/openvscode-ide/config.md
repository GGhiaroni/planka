# Env Catalog — openvscode-ide

> Catalog leve para projeto vendor third-party (Gitpod openvscode-server) com **GitHub OAuth via oauth2-proxy**.
> Substitui o registro anterior de `coder-7ftr` (descontinuado em 2026-05-01).

## Projeto

- **project_name**: openvscode-ide
- **project_path**: `/docker/openvscode-ide`
- **env_file**: `/docker/openvscode-ide/.env` (perm 600)
- **process_manager**: `docker compose` (2 serviços: `server` + `oauth2-proxy`)
- **environments**: apenas `production`

## environments.production

- **port (host)**: 4180 (entry point é o oauth2-proxy)
- **port (interno)**: 3000 (openvscode-server, expose-only na rede do compose)
- **port_bind**: `127.0.0.1:4180:4180` (loopback only — público via nginx)
- **domain**: `dev.ide.tuninho.ai`
- **access_url**: `https://dev.ide.tuninho.ai`
- **auth**: GitHub OAuth via oauth2-proxy, restrito a `victorgaudio`
- **public_vars**: nenhum hardcoded em `.env`
- **sensitive_vars**:
  - `GITHUB_CLIENT_ID` — Client ID do OAuth App (não é segredo no sentido criptográfico, mas tratado como sensitive por convenção)
  - `GITHUB_CLIENT_SECRET` — Client Secret do OAuth App (sensível!)
  - `OAUTH2_PROXY_COOKIE_SECRET` — chave de assinatura do cookie (16/24/32 bytes UTF-8)

## Persistência

- **Volume Docker nomeado**: `openvscode-ide_workspace` → `/home/workspace` no container `server`
- **db_path**: N/A
- **backup_strategy**: `tar czf` do volume; não automatizado

## Isolation matrix

| Aspecto | Status |
|---|---|
| Múltiplas instâncias prod neste host | Não |
| Compartilha porta com outro projeto | Não (4180 exclusiva) |
| Compartilha DB | N/A |
| Compartilha rede Docker | Não (`openvscode-ide_default` isolada) |
| Compartilha OAuth App com outro projeto | **Não** — OAuth Apps GitHub têm callback fixo por domínio; cada subdomínio precisa do seu App |

## Notas

- **Vendor third-party**: imagens `gitpod/openvscode-server:latest` e `quay.io/oauth2-proxy/oauth2-proxy:latest`.
- **Auth crítico**: openvscode-server **não suporta OAuth nativamente**. oauth2-proxy é o único guarda da plataforma. Se ele cair, o openvscode interno fica inacessível (porta `3000` é só rede interna).
- **Sidecar de operação**: `.claude/skills/tuninho-devops-hostinger/projects/hostinger-alfa/openvscode-ide/config.md`
- **Ports config**: `.claude/skills/tuninho-portas-em-automatico/projects/openvscode-ide/config.md`

---

**Catalog v2.0.0** — atualizado 2026-05-01 com migração para GitHub OAuth via oauth2-proxy.
