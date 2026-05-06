# Protocolo Advogado do Diabo — Tuninho Fix Suporte

> Auto-desafio estruturado ANTES de prosseguir com o fix.
> Objetivo: encontrar falhas no diagnostico e riscos no fix ANTES que cheguem a producao.

---

## Quando Executar

- **P0/P1:** OBRIGATORIO. Todas as 6 perguntas. Bloqueio se 2+ sem resposta.
- **P2:** Recomendado. Perguntas 1, 2, 3, 6. Sem bloqueio (mas documentar gaps).
- **P3:** Opcional. Apenas pergunta 6 (riscos do fix).

---

## As 6 Perguntas

### 1. O que pode dar errado com esse fix?

**Foco:** O fix em si pode causar novos problemas?

Checklist:
- [ ] O fix toca algum code path compartilhado com outras features?
- [ ] O fix altera schema de dados ou formato de resposta?
- [ ] O fix tem efeitos colaterais em integracoes externas (Asaas, Firebase, Twilio)?
- [ ] O fix foi testado com TODOS os perfis de usuario?

**Formato de resposta:**
- COM evidencia: "Testei com 47 usuarios com matricula, 20 sem, 12 rotas admin. Zero falhas."
- SEM evidencia: "INSUFICIENTE — nao testei com usuario sem inscricao"

### 2. E se estivermos errados sobre a causa raiz?

**Foco:** Existe outra explicacao plausivel para os sintomas?

Checklist:
- [ ] Apresentamos pelo menos 2 hipoteses na investigacao?
- [ ] A contra-hipotese foi testada e refutada?
- [ ] Temos 3+ fontes independentes confirmando?
- [ ] O bug foi reproduzido em ambiente isolado?

**Formato de resposta:**
- COM evidencia: "Hipotese 2 (timeout de DB) refutada: logs mostram que nao ha timeouts. Reproducao isolada confirma sqlite3.Row sem .get()."
- SEM evidencia: "INSUFICIENTE — nao testamos a hipotese alternativa"

### 3. Que edge cases nao testamos?

**Foco:** Combinacoes de dados ou estados que podem quebrar.

Checklist por projeto (adaptar ao sidecar):
- [ ] Usuario novo (sem dados historicos)
- [ ] Usuario com dados parciais (inscricao sem matricula)
- [ ] Usuario com dados completos (matricula + pagamentos + asaas)
- [ ] Dados nulos ou vazios em campos opcionais
- [ ] Dados com caracteres especiais (acentos, emojis, UTF-8)
- [ ] Requests simultaneas (race condition)
- [ ] Sessao expirada (token Firebase vencido)

**Formato de resposta:**
- COM evidencia: "Script de teste funcional executado para 5 perfis distintos, incluindo admin."
- SEM evidencia: "INSUFICIENTE — nao testamos usuario com sessao expirada"

### 4. Que outros usuarios podem estar afetados que nao encontramos?

**Foco:** O mapeamento de impacto esta completo?

Checklist:
- [ ] Mapeamos TODOS os dispositivos unicos com erro (nao so os que reclamaram)?
- [ ] Reconstruimos timeline completa (30 min buckets)?
- [ ] Verificamos se o bug pode afetar endpoints ALEM do reportado?
- [ ] Verificamos Firebase Analytics (se disponivel)?
- [ ] Verificamos nginx logs (IPs reais) vs gunicorn logs?

**Formato de resposta:**
- COM evidencia: "15 dispositivos unicos com 500. 5 identificados por nome. 10 nao identificaveis por falta de user_id no log — registrado como pendencia."
- SEM evidencia: "INSUFICIENTE — nao verificamos logs do nginx pra IPs reais"

### 5. Isso e sintoma de um problema mais profundo?

**Foco:** O bug e isolado ou indica falha sistemica?

Checklist:
- [ ] O padrao (ex: .get() em sqlite3.Row) existe em OUTROS pontos do codigo?
- [ ] O processo que permitiu esse bug (deploy sem teste) pode permitir outros?
- [ ] Ha gaps de observabilidade que impediram deteccao mais rapida?
- [ ] Ha pendencias de seguranca ou qualidade nao resolvidas?

**Formato de resposta:**
- COM evidencia: "grep -n '.get(' app.py encontrou 18 usos, todos em dicts Python exceto a linha 412. Problema isolado ao commit."
- SEM evidencia: "INSUFICIENTE — nao verificamos se o padrao existe em outros arquivos"

### 6. O fix introduz riscos novos?

**Foco:** Estamos trocando um problema por outro?

Checklist:
- [ ] O fix e reversivel? Em quanto tempo?
- [ ] O fix altera comportamento de features que funcionavam?
- [ ] O fix tem dependencias externas (API, config, env)?
- [ ] Qual o plano se o fix falhar?
- [ ] O backup esta pronto e testado?

**Formato de resposta:**
- COM evidencia: "Revert completo do commit. Rollback: copiar 5 arquivos do backup + restart. Tempo: <15s. Backup verificado: 305 users, integridade OK."
- SEM evidencia: "INSUFICIENTE — nao fizemos backup antes da mudanca"

---

## Criterio de Bloqueio

| Severidade | Perguntas | Bloqueio se |
|------------|-----------|-------------|
| P0 | 1-6 (todas) | 2+ perguntas com "INSUFICIENTE" |
| P1 | 1-6 (todas) | 2+ perguntas com "INSUFICIENTE" |
| P2 | 1,2,3,6 | Apenas registro, sem bloqueio |
| P3 | 6 | Apenas registro, sem bloqueio |

**Se bloqueado:** PARAR. Identificar quais perguntas estao insuficientes.
Voltar a investigacao (Stage 2/3) para coletar evidencias faltantes.
Nao prosseguir para o fix ate que todas as perguntas estejam respondidas com evidencia.

---

## Registro no Chamado

O resultado do Devil's Advocate DEVE constar no chamado (Stage 11):

```markdown
## Advogado do Diabo (Stage 4)
| # | Pergunta | Resposta | Status |
|---|----------|----------|--------|
| 1 | Riscos do fix | {resposta} | COM EVIDENCIA |
| 2 | Causa raiz correta? | {resposta} | COM EVIDENCIA |
| 3 | Edge cases | {resposta} | COM EVIDENCIA |
| 4 | Mais afetados? | {resposta} | COM EVIDENCIA |
| 5 | Problema mais profundo? | {resposta} | COM EVIDENCIA |
| 6 | Novos riscos? | {resposta} | COM EVIDENCIA |
```
