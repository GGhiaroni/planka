# Licoes Aprendidas — Tuninho Portas em Automatico

> Vazia inicialmente. Sera preenchida a cada execucao real da skill.
>
> Cada licao documentada registra um padrao de gap, problema descoberto ou
> aprendizado meta sobre o proprio design da skill.

---

## Licoes

### #1 — Filtro de relevancia para plan files (descoberto na primeira execucao v0.1.0)

- **Descoberta em**: Op 23 sessao 03 — primeira execucao real de `portas-em-automatico.sh` no MARCO 3
- **Contexto**: Script `coletar-plan-files.sh` v0.1.0 inicial escaneava `~/.claude/plans/` + `~/.claude/todos/` com filtro apenas de mtime (-30 dias) e tamanho (> 10 bytes). Resultado: copiou 38 arquivos que nao tinham nada a ver com a Op 23 (eram plans de outros projetos/sessoes do operador, nomes tipo `goofy-frolicking-snowglobe`, `mellow-snuggling-fairy`, etc).
- **Gap/Problema**: poluicao do `handoffs/raw_sessions/plan_files/` com plan files de outros projetos. ~/.claude/plans/ e COMPARTILHADO entre todos os projetos Claude Code do operador — mtime sozinho nao distingue por projeto.
- **Acao corretiva (aplicada em v0.1.0 mesmo)**:
  1. Script agora **filtra por relevancia** — `grep -qF $PROJ_ROOT $f` para cada plan file, so copia se o conteudo referencia o projeto corrente
  2. Tamanho minimo aumentado de 10 → 100 bytes
  3. `~/.claude/todos/` **desabilitado por default** — arquivos efemeros de TodoWrite (2 bytes cada) nao servem como contexto de handoff
  4. Limpeza dos 38 arquivos polucionados executada manualmente
- **Licao meta**: **filtros de tempo + tamanho sao insuficientes** para coleta de plan files — precisa de filtro de conteudo (grep). Plan files do Claude Code sao globais ao usuario, nao ao projeto.
- **Pendente v0.2.0**: habilitar coleta de ~/.claude/todos/ se o operador pedir explicitamente (flag `--include-todos`). Coleta de JSONLs ja e filtrada naturalmente porque `~/.claude/projects/{slug}/` ja e per-project.

---

## Referencias cruzadas

- **tuninho-ddce** `references/licoes-aprendidas.md` — Licao #60 documenta a origem
  estrutural desta skill (virada de chave multi-sessao)
- **tuninho-qa** `references/licoes-aprendidas.md` — Licoes #14-17 sao REGRAS
  MASTER petreas que motivaram a separacao de responsabilidades entre
  portas-em-automatico (coleta + pre-flight) e audit-handoff (validacao profunda)

---

*Parte da skill tuninho-portas-em-automatico v0.1.0*
