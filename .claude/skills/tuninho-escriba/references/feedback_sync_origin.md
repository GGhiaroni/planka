### Feedback: Push feat branch + sync completo no final do Git Flow

- **Operador**: victorgaudio
- **Data**: 2026-04-02
- **Problema**: Apos o Escriba fazer commit na feat branch e merge --no-ff para develop, a feat branch local nao e pushada para origin. O operador precisa ir manualmente no VSCode fazer sync/publish branch.
- **Expectativa**: O Escriba deve, ao final do fluxo git, garantir que TUDO esteja sincronizado com origin — branches, commits, refs.
- **Solucao**: Adicionar Etapa 7.5 com sync completo: push feat branch, fetch --prune, verificar que nao ha divergencias.
