# Safe Fix Protocol — Tuninho Fix Suporte

> Padroes de correcao segura para producao.

---

## Principio: Menor Mudanca Possivel

Corrigir APENAS o que esta quebrado. Nao refatorar, nao melhorar, nao limpar.
Uma correcao de bug nao e oportunidade de melhoria.

---

## Padrao 1: Data Fix (correcao de dados no banco)

1. **Backup WAL-safe** ANTES de qualquer mudanca:
   ```bash
   sqlite3 {db_path} ".backup /opt/hostinger-alfa/backups/{projeto}_pre-fix_$(date +%Y%m%d_%H%M%S).db"
   ```
2. **Snapshot dos registros afetados** (para audit):
   ```bash
   sqlite3 {db_path} "SELECT * FROM {table} WHERE {condition};" > /opt/hostinger-alfa/backups/snapshot_pre_fix.txt
   ```
3. **Dry-run**: mostrar ao operador o que vai mudar sem executar
4. **Executar a menor query possivel** (UPDATE com WHERE restritivo)
5. **Verificar resultado**: requery para confirmar
6. **Registrar no sidecar known_issues**

---

## Padrao 2: Code Fix (correcao de codigo)

1. **Branch fix/**: `git checkout -b fix/{slug}`
2. **Alterar o minimo de linhas possivel**
3. **Verificar syntax**: `python -m py_compile {file}`
4. **Testar em dev** (porta de dev, dados de teste)
5. **Deploy via skill** (tuninho-devops-*)
6. **Verificar em prod** (health check + reproduzir cenario)

---

## Padrao 3: Deploy Seguro (SELF_DEPLOY)

Para projetos no mesmo servidor (Tuninho IDE → prod):

1. **Backup DB**: sqlite3 .backup (WAL-safe)
2. **Backup codigo**: cp dos arquivos que vao mudar
3. **Copiar arquivos especificos** (nao rsync completo para fixes pequenos)
4. **Restart servico**: systemctl restart {service}
5. **Health check**: HTTP 200 local + HTTPS 200 prod
6. **Cross-project check**: todos os vizinhos respondendo
7. **Documentar rollback command** pronto para usar

---

## Padrao 4: Rollback Rapido

```bash
# Restaurar codigo
cp /opt/hostinger-alfa/backups/{projeto}_pre-fix/app.py /opt/hostinger-alfa/{projeto}/app.py
systemctl restart {service}

# Restaurar banco (se data fix)
cp /opt/hostinger-alfa/backups/{projeto}_pre-fix.db /opt/hostinger-alfa/{projeto}/{db}
systemctl restart {service}

# Verificar
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:{porta}/
```

Tempo de rollback: < 15 segundos.

---

## Padrao 5: Git Flow Obrigatorio

**ANTES de qualquer mudanca em codigo ou dados:**

1. **Criar branch**: `git checkout -b fix/{issue-slug}`
   - Isso e a PRIMEIRA acao do Stage 1 — antes de investigar
   - Se ja existe branch de trabalho: verificar que nao esta em main/develop
2. **Trabalhar na branch**: todas as mudancas (codigo, scripts, dados) acontecem aqui
3. **Merge para develop**: `git checkout develop && git merge --no-ff fix/{slug}`
4. **Deploy**: via tuninho-devops skill (nunca manual)
5. **Documentar**: commit message com referencia ao chamado

**NUNCA modificar arquivos de projeto estando em main ou develop.**
O hook `tuninho-hook-git-flow` bloqueia Write/Edit nessas branches.

---

## Padrao 6: Confirmacao de Escopo (Stage 6)

**ANTES de implementar o fix:**

1. Apresentar: "Pedido original: {verbatim do operador}"
2. Apresentar: "Escopo proposto: {o que vamos mudar}"
3. Comparar: algum item no escopo proposto que NAO estava no pedido?
4. Se sim: aprovacao explicita necessaria para CADA item adicional
5. Registrar decisao no chamado

**Exemplo real (Op 19):** Operador pediu CPF e RG. Implementacao incluiu nome e telefone.
Scope Gate teria pegado: "nome_completo e telefone nao estavam no pedido original."

---

## Padrao 7: Verificacao Pre-Deploy em 5 Perspectivas (Stage 8)

**ANTES de deployar em producao:**

| Perspectiva | O que testar | Criterio |
|-------------|-------------|----------|
| P1 | Usuarios com matricula | TODOS devem retornar 200 no /painel |
| P2 | Usuarios sem matricula (amostra 20) | Todos 200 |
| P3 | Rotas publicas (/, /inscricoes/, etc.) | Status codes corretos |
| P4 | Rotas admin (dashboard, inscricoes, etc.) | Todas 200 |
| P5 | Integridade (DB, systemd, SSL, erros, codigo) | Tudo OK |

**Se QUALQUER perspectiva falhar: NAO deployar. Investigar.**

Usar script de teste funcional do sidecar quando disponivel.

---

## Anti-padroes (NUNCA fazer)

1. **NUNCA** editar arquivo direto em producao sem backup
2. **NUNCA** fazer UPDATE sem WHERE (afeta todos os registros)
3. **NUNCA** deletar dados — desativar com flag (ex: ativo=0)
4. **NUNCA** deploy em horario de pico sem justificativa P0
5. **NUNCA** rodar queries bulk no SQLite enquanto o app esta servindo (database lock)
6. **NUNCA** assumir que o problema e X sem evidencia — investigar primeiro
7. **NUNCA** expandir escopo do fix alem do que o operador pediu sem aprovacao explicita
8. **NUNCA** executar plano marcado "futuro" ou "nao executado" na sessao corrente
9. **NUNCA** afirmar "zero risco" sem ter testado nas 5 perspectivas
10. **NUNCA** modificar codigo estando em branch main ou develop
