# Licoes Aprendidas — Tuninho Fix Suporte

> Documento vivo. Atualizado apos CADA execucao do fix-suporte via Stage 9.

---

## Licoes

### #1: Response byte count identifica erro exato sem reproduzir

- **Descoberta em:** Op 18, orquestravoadoraoficina2026 (2026-04-07)
- **Contexto:** 11 erros HTTP 500 em 3 alunos tentando pagar matricula
- **Problema:** Error log nao tinha detalhes dos 500 especificos
- **Solucao:** Coluna 10 do nginx access log (body_bytes_sent) = 67 bytes.
  67 bytes = `{"error": "cpfCnpj invalid or already exists for another customer"}`.
  Identificou causa raiz (CPF com digitos faltantes) sem precisar reproduzir.

### #2: Google Sheets remove zeros a esquerda de campos numericos

- **Descoberta em:** Op 18 (2026-04-07)
- **Contexto:** 62 CPFs importados do Sheets com 10 digitos (faltando zero)
- **Problema:** Sheets trata CPF como numero e remove leading zeros
- **Solucao:** zfill(11) em todo ponto de entrada de CPF (import, backend, frontend)

### #3: Queries bulk no SQLite durante requests causam database lock

- **Descoberta em:** Op 18 (2026-04-07)
- **Contexto:** Migracao de 138 UPDATEs via CLI enquanto Gunicorn servia requests
- **Problema:** sqlite3 CLI cria conexao separada que compete com workers
- **Solucao:** Rodar queries bulk em horario de baixo trafego ou via endpoint admin

### #4: CPF corrigido no contrato deve propagar para inscricao

- **Descoberta em:** Op 18 (2026-04-07)
- **Contexto:** Usuario corrigia CPF no contrato, mas pagamento usava CPF original
- **Problema:** matriculas.contrato_cpf e inscricoes.cpf sao campos diferentes
- **Solucao:** Sync automatico: ao assinar contrato, se CPF mudou, UPDATE inscricoes.cpf

### #5: sqlite3.Row nao tem .get() — usar row['campo'] sempre

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Commit ab4c6d1 usou `mat.get('asaas_customer_id')` em sqlite3.Row
- **Problema:** sqlite3.Row suporta `row['campo']` mas NAO `.get()`. So dicts Python tem `.get()`.
  Em todo o codebase, `row['campo']` era usado em centenas de pontos sem problema.
  O unico `.get()` em Row era o bug. Quebrou /painel para 45 usuarios com matricula.
- **Solucao:** Usar `row['campo']` sempre. NUNCA `.get()` em resultado de query SQLite.

### #6: Escopo deve corresponder EXATAMENTE ao pedido do operador

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Operador pediu edicao de CPF e RG. Implementacao incluiu nome e telefone.
- **Problema:** Nome e telefone afetam Firebase Auth, SMS (Twilio) e login. Expansao
  autonoma sem aprovacao do operador criou risco adicional desnecessario.
- **Solucao:** Confirmar escopo item a item antes de implementar. Stage 6 (Scope Gate).

### #7: Planos "futuros" NAO devem ser executados na sessao atual

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Plano `plano_campos_editaveis_carteirinha.md` dizia "Status: PLANEJADO —
  nao executado. Para operacao futura exclusiva." Foi executado na hora sem DDCE.
- **Problema:** Bypass do fluxo DDCE resultou em deploy sem gates de aprovacao
- **Solucao:** Respeitar marcacao de status. Se diz "futuro", e futuro.

### #8: Testar com TODOS os perfis de usuario antes de deploy

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Bug afetava so 18% dos usuarios (com matricula). Testes com outros perfis passavam.
- **Problema:** Deploy validado apenas com usuario sem matricula nao detectou o crash
- **Solucao:** Test matrix obrigatoria: com matricula+asaas, com matricula-asaas, sem matricula,
  sem inscricao, admin. Script funcional no sidecar.

### #9: Git flow e inegociavel

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Fix e deploy foram feitos sem branch, sem PR, direto na branch de trabalho
- **Problema:** Sem rastreabilidade git, sem possibilidade de review, sem historico limpo
- **Solucao:** `git checkout -b fix/{slug}` como PRIMEIRA acao. Merge via --no-ff. Deploy via skill.

### #10: Mapear TODOS os usuarios afetados com timeline

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** 15 usuarios afetados, mas operador so sabia de 2 que reclamaram
- **Problema:** Sem mapeamento proativo, a dimensao do incidente foi subestimada
- **Solucao:** Stage 2 trilha 2b (Impact Assessment) + trilha 2c (Timeline). 30 min buckets.
  Identificar por nome quando possivel. Registrar os nao identificados.

### #11: Conhecer ferramentas ja implementadas antes de alegar limitacao

- **Descoberta em:** Op 19 (2026-04-08)
- **Contexto:** Firebase Analytics com 17 eventos + `firebaseSetUserId()` estavam documentados
  no vault, mas o fix-suporte nao sabia e afirmou que nao era possivel identificar usuarios
- **Problema:** Vault nao foi lido com profundidade suficiente no Stage 0
- **Solucao:** Stage 0 expandido: ler vault COMPLETO incluindo `implementacao/`, `funcionalidades/`.
  Listar ferramentas ja implementadas no resumo de contexto.

---

## Tabela Resumo

| # | Titulo | Severidade | Projeto |
|---|--------|------------|---------|
| 1 | Byte count identifica erro | Tecnica | Geral |
| 2 | Sheets remove zeros CPF | P1 | orquestravoadora |
| 3 | Bulk queries causam DB lock | P1 | Geral (SQLite) |
| 4 | contrato_cpf deve sync inscricao | P0 | orquestravoadora |
| 5 | sqlite3.Row nao tem .get() | P0 | Geral (SQLite) |
| 6 | Escopo deve corresponder ao pedido | Processo | Geral |
| 7 | Planos futuros nao executar na sessao | Processo | Geral |
| 8 | Testar com todos os perfis | Processo | Geral |
| 9 | Git flow inegociavel | Processo | Geral |
| 10 | Mapear todos os afetados | Processo | Geral |
| 11 | Conhecer ferramentas implementadas | Processo | Geral |
