# Modulos Sidecar por Projeto — Tuninho DevOps Vercel

> Cada subpasta contem configuracoes de deploy **especificas** de um projeto
> no Vercel (conta operacoes4tuna). O conteudo aqui e a **excecao** — tudo que for
> universal fica no SKILL.md e references/.

## Conceito

A skill DevOps Vercel gerencia deploys de multiplos projetos na mesma conta Vercel.
Cada projeto tem particularidades: dominio, framework, env vars, verificacoes pos-deploy.
Essas particularidades ficam no sidecar (aqui).

## Como funciona

1. Ao iniciar um deploy, a skill identifica o projeto (pelo cwd ou perguntando)
2. Carrega `projects/{nome_projeto}/config.md` com todas as configs de deploy
3. Se NAO existir: entra no sub-fluxo de Bootstrap (Stage 0B) para criar o sidecar
4. Ao final do bootstrap, o sidecar e criado automaticamente com os dados descobertos

## Estrutura

```
projects/
├── README.md                              (este arquivo — pode ser atualizado pelo updater)
├── orquestravoadoraoficina2026/
│   └── config.md                          (config deploy — NUNCA sincronizado)
└── {outro_projeto}/
    └── config.md                          (config deploy do projeto — NUNCA sincronizado)
```

## Regras

1. **Sidecar e excecao.** Configs universais da conta Vercel vao no SKILL.md.
   So vai para o sidecar o que e estritamente especifico de um unico projeto.
2. **NUNCA sincronizado pelo updater** — sidecars sao locais a cada projeto.
3. **Unica excecao**: este README.md (template) pode ser atualizado via pull.
4. **Acumulativo**: cada novo projeto que usar esta skill ganha seu proprio sidecar.
   Assim a skill acumula conhecimento sobre todos os projetos na conta Vercel.
