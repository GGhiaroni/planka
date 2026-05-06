# Projects — Tuninho Fix Suporte

Cada subpasta contem um `sidecar.md` com conhecimento especifico do projeto
para suporte emergencial.

## Estrutura

```
projects/
├── {nome_do_projeto}/
│   └── sidecar.md
```

## Conteudo do sidecar

- Metadata do projeto (stack, portas, DB, dominio)
- Caminhos do vault, env-catalog, deploy sidecar
- Integracoes externas (APIs, credenciais, comportamentos)
- Padroes de dados (validacoes, formatos, regras de negocio)
- Comandos de investigacao (queries DB, logs, servicos)
- Issues conhecidos com resolucoes
- Procedimentos de backup

## Regras

- Sidecars sao **acumulativos** — nunca remover issues, apenas adicionar
- Cada execucao do fix-suporte (Stage 9) bumpa a versao do sidecar
- Sidecars sao sincronizados via tuninho-updater (push/pull)
- O sidecar e fonte secundaria — o vault do escriba e a fonte principal
