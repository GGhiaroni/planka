# Checklist de Deploy — Tuninho DevOps Vercel

> Checklist rapido para referencia durante deploys.
> O fluxo completo esta no SKILL.md.

---

## Pre-Deploy

- [ ] Ler `references/licoes-aprendidas.md`
- [ ] Carregar sidecar do projeto (`projects/{projeto}/config.md`)
- [ ] Verificar identidade: `npx vercel@latest whoami` → `operacoes4tuna`
- [ ] Verificar projeto linkado: `.vercel/project.json` existe
- [ ] Verificar mudancas nao-commitadas: `git status --short`

## Deploy

- [ ] Executar: `npx vercel@latest --prod --yes`
- [ ] Aguardar output `readyState: READY`
- [ ] Capturar URL do deploy

## Pos-Deploy

- [ ] HTTP check: `curl -s -o /dev/null -w "%{http_code}" https://{dominio}/`
- [ ] Verificar funcionalidade critica (conforme sidecar)
- [ ] Atualizar historico de deploys no sidecar

## Rollback (se necessario)

- [ ] `npx vercel@latest rollback --yes --scope a4tunados-projects`
- [ ] Verificar que rollback restaurou versao anterior
- [ ] Registrar incidente no sidecar e licoes-aprendidas
