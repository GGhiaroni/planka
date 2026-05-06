# Fase 1 — Bootstrap deploy seguro

## Objetivo

Atualizar a imagem Docker `planka-custom:latest` no servidor hostinger-beta com o
código da branch `develop` atual (5 commits novos do dev), fazer restart preservando
volumes, e validar staging acessível em https://pdviewerp-stagging.fourtuna.com.br/
com todas as features novas funcionando em desktop e mobile.

## Tarefas

- [ ] **T1.1**: Backup pg_dump preventivo no servidor B
- [ ] **T1.2**: rsync código local → /opt/hostinger-beta/planka/ (preservando .env)
- [ ] **T1.3**: Validar override compose com `config`
- [ ] **T1.4**: Rebuild imagem `planka-custom:latest`
- [ ] **T1.5**: Restart container `planka` com `--force-recreate`
- [ ] **T1.6**: Smoke + healthcheck pós-deploy
- [ ] **T1.7**: Validação E2E real Playwright multi-viewport + multi-feature

## Validação Automática (Playwright)

1. Navegar https://pdviewerp-stagging.fourtuna.com.br/ em **desktop 1366x800**
2. Login admin com creds do .env
3. Criar/abrir Board
4. Testar 5 features novas:
   - Drag-and-drop intra-coluna (`dc9f6cc4`)
   - 3 opções altura linha planilha (`de1eb9d7`)
   - Coluna colapsada (`0eb2a53e`)
   - Log do board (`9fae494b`)
   - Seed coluna 'Falar com o cliente' (`25a49d8a`)
5. Repetir validação em **mobile 375x667** com adaptação de touch
6. Capturar screenshots E **interpretar visualmente** (Read tool — Licão #31)
7. browser_console_messages = zero erros críticos

## Validação Humana

Operador acompanhará turno-a-turno. Aprovação expressa antes de Fase 2.

## Aprendizados Esperados

- Tempo real do build (cache hit ratio)
- Comportamento de migrations entre versions (se houver schema change)
- Eventual race condition entre nginx proxy e container ready
- Observação se features mobile do dev funcionam touch corretamente

## Riscos

- Build falha por npm ci/lockfile mismatch — mitigação: tag pre-deploy + rollback
- Migrations DB inesperadas — mitigação: pg_dump preventivo (T1.1) + DB já vazio
- nginx config quebrar outros — mitigação: NÃO TOCAR nginx
