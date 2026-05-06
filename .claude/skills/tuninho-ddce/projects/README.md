# Modulos Sidecar por Projeto — Tuninho DDCE

> Cada subpasta contem configuracoes e aprendizados **especificos** de um projeto.
> O conteudo aqui e a **excecao** — tudo que for universal fica no SKILL.md e references/.

## Conceito

A skill DDCE e generica e funciona em qualquer projeto. Porem, alguns projetos
tem particularidades (changelog customizado, version file especifico, licoes que
so se aplicam aquele contexto). Essas particularidades ficam no sidecar.

## Como funciona

1. A skill verifica se existe `projects/{nome_projeto}/config.md` ao executar etapas
   que podem ter customizacao (ex: Etapa 15 — changelog)
2. Se existir: segue as instrucoes do sidecar
3. Se NAO existir: usa o comportamento generico (varredura automatica, perguntar ao operador)
4. Ao final da operacao, se houve descoberta project-specific, salvar no sidecar

## Estrutura

```
projects/
├── README.md                    (este arquivo)
├── a4tunados_mural/
│   └── config.md                (config + licoes mural-specific)
└── {outro_projeto}/
    └── config.md                (config + licoes do projeto)
```

## Regra de ouro

**Sidecar e excecao.** Se um aprendizado ou regra pode beneficiar QUALQUER projeto,
ele vai para `references/licoes-aprendidas.md` ou para o SKILL.md generico.
So vai para o sidecar o que e estritamente especifico de um unico projeto.
