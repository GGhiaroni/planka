# Absorcao de Sidecar — Tuninho Fix Suporte

> Protocolo de aprendizado auto-incremental. Apos CADA sessao de fix-suporte,
> o sidecar do projeto DEVE crescer com informacoes novas.

---

## Principio

O sidecar e a memoria persistente do projeto. Cada sessao de suporte descobre
informacoes que serao valiosas em sessoes futuras. Se essas informacoes nao forem
absorvidas, o proximo incidente vai exigir a mesma investigacao do zero.

**Regra:** Ao final de CADA sessao, independente do resultado, o sidecar DEVE
ser atualizado com TUDO que foi aprendido.

---

## O Que Absorver

### 1. Known Issues (OBRIGATORIO se houve resolucao)

Formato padrao:
```markdown
### #{N} — {titulo descritivo} (P{N}, {status})
- **Data**: {YYYY-MM-DD}
- **Sintoma**: {o que o usuario/operador viu}
- **Root cause**: {causa raiz com cadeia de evidencias}
- **Fix**: {o que foi feito, commits, queries}
- **Operacao**: Op {N}
- **Prevencao**: {como evitar que aconteca de novo}
- **Usuarios afetados**: {N dispositivos, N identificados}
- **Agravantes**: {fatores que pioraram o incidente}
```

### 2. Comandos de Investigacao (se novos comandos foram uteis)

Adicionar na secao `## Comandos de Investigacao` com:
- Categoria (DB, Logs, Servicos, Rede)
- Comando exato (copy-paste ready)
- Quando usar (em que cenario esse comando e util)

### 3. Padroes de Dados (se novos padroes descobertos)

Adicionar na secao `## Padroes de Dados` com:
- Campo/tabela afetada
- Formato correto vs incorreto
- Validacao que existe vs que falta
- Bugs historicos nesse campo

### 4. Gaps de Observabilidade (se faltou informacao durante investigacao)

Adicionar na secao `## Gaps de Observabilidade` com:
- O que faltou (ex: user_id no log)
- Impacto (ex: nao identificamos 10 de 15 usuarios)
- Pendencia gerada (referencia ao arquivo de pendencia)

### 5. Dados de Impacto (OBRIGATORIO para P0/P1)

Adicionar na secao `## Impacto por Incidente` com:
- Data e horario do incidente
- Usuarios afetados (total e identificados por nome)
- Timeline resumida (inicio, pico, fim)
- Referencia ao chamado

### 6. Padroes de Integracoes Externas (se descoberto comportamento novo)

Adicionar na secao `## Integracoes Externas` com:
- Servico (Asaas, Firebase, Twilio)
- Comportamento descoberto (ex: resposta de 67 bytes = CPF invalido)
- Credencial usada e ambiente (prod/sandbox)

### 7. Ferramentas do Projeto (se descoberto algo que nao estava documentado)

Adicionar na secao `## Ferramentas Implementadas` com:
- Nome da ferramenta (ex: Firebase Analytics)
- Status (ativo, parcial, inativo)
- Helpers disponiveis (ex: firebaseSetUserId() em firebase-init.js:48)
- O que falta ativar (ex: setUserId nunca chamado)

---

## Formato de Apresentacao ao Operador

Ao final da sessao (Stage 12), apresentar as mudancas como DIFF:

```
ABSORCAO DE SIDECAR — {projeto}

NOVAS ENTRADAS:
  [1] Known Issue #{N}: {titulo}
  [2] Novo comando: {descricao}
  [3] Gap observabilidade: {descricao}

ATUALIZACOES:
  [4] Known Issue #{M}: atualizado status/prevencao
  [5] Integracao {nome}: novo comportamento documentado

Aprovar individualmente? (s/n/selecionar)
```

### Workflow de Aprovacao

1. Operador recebe a lista
2. Opcoes:
   - **s**: Aprovar todas, bump sidecar version
   - **n**: Nenhuma aprovada (raro — documentar motivo)
   - **selecionar**: Operador escolhe quais aprovar (ex: "1,3,5")
3. Itens aprovados sao incorporados no sidecar
4. Itens rejeitados sao descartados (sem registro)

---

## Regras de Bump de Versao

| Mudanca | Bump | Exemplo |
|---------|------|---------|
| Novo known_issue | Patch (x.x.+1) | 1.1.0 → 1.1.1 |
| Novo comando de investigacao | Patch | |
| Novo padrao de dados | Patch | |
| Nova secao no sidecar | Minor (x.+1.0) | 1.1.0 → 1.2.0 |
| Reestruturacao do sidecar | Major (+1.0.0) | 1.1.0 → 2.0.0 |

---

## Checklist de Absorcao (Stage 12)

Antes de encerrar a sessao, o fix-suporte DEVE verificar:

- [ ] Houve novo known_issue? Se sim, adicionado ao sidecar?
- [ ] Houve novos comandos de investigacao uteis? Se sim, adicionados?
- [ ] Houve novos padroes de dados descobertos? Se sim, adicionados?
- [ ] Faltou informacao durante a investigacao? Se sim, gap registrado?
- [ ] Usuarios foram afetados? Se sim, impacto registrado?
- [ ] Descobrimos comportamento novo de integracao externa? Se sim, registrado?
- [ ] Descobrimos ferramenta do projeto nao documentada? Se sim, registrada?
- [ ] Versao do sidecar bumped?
- [ ] Operador aprovou as mudancas?
