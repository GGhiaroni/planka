# Protocolo de Controle DDCE

> Referencia detalhada para o protocolo Control que roda durante a fase EXECUTION.
> Control e um validador estruturado, nao um processo paralelo.

---

## Principio Fundamental

Control **NAO modifica nada**. Control apenas:
1. Verifica que a execucao segue o plano
2. Detecta desvios
3. Informa o operador
4. Registra em checkpoints.md

---

## Checklist Pre-Tarefa (6 itens)

Executar ANTES de iniciar cada tarefa:

- [ ] **1. Posicao no plano**: Ler `{NN}_2_DEFINE_PLAN_{nome}.md` e localizar
  a fase e tarefa atuais. Confirmar que a tarefa a iniciar e a PROXIMA na sequencia.

- [ ] **2. Tarefa anterior concluida**: Ler `fase_NN/checklist.md` e confirmar
  que a tarefa imediatamente anterior esta marcada `[x]`.

- [ ] **3. Pre-requisitos atendidos**: Verificar se ha dependencias da tarefa
  (ex: outra tarefa precisa estar concluida, arquivo precisa existir).

- [ ] **4. Contexto disponivel**: Verificar que temos informacoes suficientes
  para executar a tarefa (arquivos lidos, padroes identificados).

- [ ] **5. Validacao Reuse-First (se tipo ADAPTACAO)**: Verificar que a funcionalidade
  base (campo "Base existente" da tarefa) existe e esta acessivel. Ler o codigo da
  funcionalidade base para confirmar que a abordagem de adaptacao planejada e viavel.
  Se a base mudou desde o DISCOVER (outro dev alterou, refactor, etc), PARAR e reavaliar.

- [ ] **6. Registro**: Anotar em `fase_NN/checkpoints.md`:
  ```
  ### {DATA} — T{N}.{M}: {nome}
  - PRE-CHECK: Sequencia OK, pre-requisitos OK
  - Inicio: {HH:MM}
  ```

### Se Pre-Check FALHAR

**Desvio de sequencia** (tarefa fora de ordem):
1. PARAR imediatamente
2. Informar operador: "Desvio do plano detectado: tentei iniciar T{X} mas T{Y} ainda nao foi concluida"
3. Opcoes:
   - (a) Voltar a tarefa correta
   - (b) Atualizar plano justificando a mudanca de ordem
4. Registrar desvio em checkpoints.md

**Pre-requisito nao atendido**:
1. PARAR
2. Informar operador: "Pre-requisito pendente para T{N}.{M}: {descricao}"
3. Resolver pre-requisito antes de prosseguir

---

## Checklist Pos-Tarefa (5 itens)

Executar APOS concluir cada tarefa:

- [ ] **1. Criterios atendidos**: Reler definicao da tarefa no plano e verificar
  que TODOS os criterios foram atendidos (arquivos criados, funcionalidades
  implementadas, testes passando).

- [ ] **2. Arquivos corretos**: Verificar que os arquivos criados/modificados
  correspondem ao que foi planejado (nao mais, nao menos).

- [ ] **3. Funcionalidade original preservada (se tipo ADAPTACAO)**: Verificar que
  a funcionalidade base continua funcionando para seu uso original. Se ha testes
  existentes para a funcionalidade base, confirmar que ainda passam. Se nao ha
  testes, verificar manualmente que o comportamento original nao foi quebrado.

- [ ] **4. Marcar checklist**: Atualizar `fase_NN/checklist.md` marcando `[x]`.

- [ ] **5. Registro**: Anotar em `fase_NN/checkpoints.md`:
  ```
  - POST-CHECK: Criterios atendidos? OK
  - POST-CHECK ADAPTACAO: Funcionalidade original preservada? OK | N/A
  - Arquivos: {lista de arquivos criados/modificados}
  - Fim: {HH:MM}
  ```

### Se Pos-Check FALHAR

**Tarefa incompleta**:
1. PARAR
2. Listar o que falta: "T{N}.{M} incompleta. Faltam: {lista}"
3. Completar antes de avancar
4. NAO marcar `[x]` ate completar

**Arquivos inesperados** (mais ou menos que o planejado):
1. Registrar divergencia em checkpoints.md
2. Se justificavel: documentar motivo e prosseguir
3. Se nao justificavel: corrigir

**Funcionalidade original quebrada** (para tarefas ADAPTACAO):
1. PARAR imediatamente
2. Reverter mudancas que quebraram a funcionalidade original
3. Reavaliar: adaptacao ainda e viavel ou devemos mudar para NOVO?
4. Informar operador da situacao e decisao
5. Registrar em checkpoints.md como desvio

---

## Checklist Transicao de Fase (7 itens)

O checklist mais rigoroso. Executar ao final de cada fase, ANTES de liberar transicao:

- [ ] **1. Todas as tarefas [x]**: TODAS as tarefas da fase marcadas como
  concluidas em `fase_NN/checklist.md`.

- [ ] **2. Validacao automatizada aprovada**: Validacao automatica executada com 100% passing.
  Evidencias salvas em `fase_NN/evidencias/`.

- [ ] **3. Operador aprovou**: Validacao humana concluida com aprovacao expressa.

- [ ] **4. Aprendizados capturados**: `fase_NN/aprendizados.md` preenchido
  com licoes desta fase.

- [ ] **5. Status atualizado**: `fase_NN/checkpoints.md` contem blocos
  "Visao Produto" e "Visao Dev" preenchidos.

- [ ] **6. Escriba invocado**: tuninho-escriba executado para documentar a fase.

- [ ] **7. Aprendizados operacao**: `aprendizados_operacao.md` atualizado
  com licoes consolidadas.

### Se Transicao FALHAR

**Item pendente**:
1. Identificar quais itens estao pendentes
2. Completar cada um antes de prosseguir
3. NAO liberar transicao com qualquer item FALSO

**Operador nao aprovou**:
1. Coletar feedback
2. Se precisa de correcao: voltar para Etapa 10 (tarefas)
3. Se precisa de nova tarefa: atualizar plano (Etapa 12.1)
4. Re-executar checklist apos correcoes

---

## Procedimento de Desvio do Plano

Quando um desvio e detectado em qualquer ponto:

### 1. Registrar o Desvio

Em `fase_NN/checkpoints.md`:
```markdown
### {DATA} — DESVIO DETECTADO
- **Tipo**: Sequencia / Criterio / Escopo / Outro
- **Descricao**: {o que aconteceu vs o que era esperado}
- **Causa**: {por que desviou}
```

### 2. Informar o Operador

Apresentar:
- O que o plano dizia
- O que aconteceu na realidade
- Opcoes de correcao

### 3. Decidir Caminho

| Opcao | Quando usar | Acao |
|-------|-------------|------|
| Corrigir | Desvio acidental | Voltar ao plano original |
| Atualizar | Desvio justificado | Modificar plano com justificativa |
| Pausar | Desvio grave | Handoff + revisao completa do plano |

### 4. Registrar Decisao

```markdown
- **Decisao**: {corrigir/atualizar/pausar}
- **Justificativa**: {por que esta opcao}
- **Plano atualizado**: {sim/nao — se sim, versao do plano atualizada}
```

---

## Procedimento de Atualizacao do Plano

Quando o plano precisa ser atualizado durante a execucao:

1. **Identificar mudanca**: O que precisa mudar e por que
2. **Avaliar impacto**: Quais fases/tarefas sao afetadas
3. **Propor atualizacao**: Apresentar ao operador
4. **Aguardar aprovacao**: GATE — operador deve aprovar
5. **Atualizar artefato**: Editar `{NN}_2_DEFINE_PLAN_{nome}.md`
   - Incrementar `versao` no frontmatter (ex: "1.0" -> "1.1")
   - Adicionar nota de atualizacao no final do plano
6. **Atualizar checklists**: Atualizar `fase_NN/checklist.md` se tarefas mudaram
7. **Registrar**: Anotar em checkpoints.md com motivo e aprovacao

---

## Resumo Visual

```
PRE-TAREFA ────> EXECUCAO ────> POS-TAREFA
     │               │               │
     │  5 checks      │  Implementar  │  4 checks
     │  Se falha:     │  conforme     │  Se falha:
     │  PARAR         │  plano        │  PARAR
     ▼               ▼               ▼
  Registro        Trabalho        Registro
  em checkpoints  real            em checkpoints

TRANSICAO DE FASE:
  7 checks (todos devem passar)
  Se qualquer falha: PARAR + completar
```
