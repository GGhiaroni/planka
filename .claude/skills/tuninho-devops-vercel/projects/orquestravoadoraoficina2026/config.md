# Config Deploy Vercel — Oficina Orquestra Voadora 2026

> Configuracao especifica do orquestravoadoraoficina2026 no Vercel (operacoes4tuna).
> Este arquivo NUNCA e sincronizado pelo updater.
> Criado em: 2026-03-30 (bootstrap manual — primeiro deploy via CLI)

---

## Identificacao

| Item | Valor |
|------|-------|
| **Projeto Vercel** | orquestravoadoraoficina2026 |
| **Scope** | a4tunados-projects |
| **Project ID** | prj_XaJszuaiS109WXHwd3vAOlBs33TW |
| **Org ID** | team_v8Y69iaGVxAGUfNtlNA2mV57 |
| **Repo** | operacoes4tuna/orquestravoadoraoficina2026 |
| **Local path** | /Users/vcg/development/baile55/TesteGoogleForms |
| **Dominio** | oficinaorquestravoadora2026.55jam.com.br |
| **Dominio Vercel** | orquestravoadoraoficina2026.vercel.app |
| **Deploy flow** | direct |

## Tech Stack

| Item | Valor |
|------|-------|
| **Framework** | Python/Flask |
| **Runtime Vercel** | @vercel/python |
| **Entry point** | api/index.py (WSGI wrapper) |
| **Templates** | templates/ (Jinja2 HTML) |
| **Static** | static/ (CSS, JS) |
| **Build config** | vercel.json (routes + includeFiles) |

## Verificacao Pos-Deploy

| Check | Comando |
|-------|---------|
| **HTTP principal** | `curl -s -o /dev/null -w "%{http_code}" https://oficinaorquestravoadora2026.55jam.com.br/` |
| **HTTP inscricoes** | `curl -s -o /dev/null -w "%{http_code}" https://oficinaorquestravoadora2026.55jam.com.br/inscricoes/` |
| **Funcionalidade critica** | Preencher formulario de avaliacao e verificar que submissao funciona |

## Variaveis de Ambiente (nomes)

| Variavel | Descricao |
|----------|-----------|
| `GOOGLE_CREDENTIALS_JSON` | JSON completo do service account Google Sheets |
| `SPREADSHEET_ID` | ID da planilha de avaliacao (fallback hardcoded) |
| `INSCRICOES_SPREADSHEET_ID` | ID da planilha de inscricoes (fallback hardcoded) |

## DNS

| Item | Valor |
|------|-------|
| **Provider** | Registro.br (conta VICGA74) |
| **Email** | operacoes@4tuna.com.br |
| **Tipo** | CNAME → cname.vercel-dns.com |
| **SSL** | Auto-provisioned by Vercel |

## Historico de Deploys

| Data | Tipo | Commits | Incidentes |
|------|------|---------|------------|
| 2026-03-30 | CLI direto | fix: radio Caixa habilitado | Deploy via GitHub integration bloqueado pelo Hobby plan. Resolvido com CLI. |

## Licoes Especificas

1. **Hobby plan bloqueia autores nao-donos** (2026-03-30): Vercel passou a checar autoria de commits. Deploys de commits por `victorgaudio` sao bloqueados mesmo quando merge commit e de `operacoes4tuna`. Solucao: deploy via CLI.
2. **Nome do diretorio local** (2026-03-30): O diretorio se chama `TesteGoogleForms` (maiusculas), o que causa erro no Vercel CLI ao tentar criar projeto. Solucao: sempre linkar explicitamente com `--project orquestravoadoraoficina2026`.
3. **Vercel CLI versao** (2026-03-30): O sistema pode ter versao antiga do `vercel` instalada globalmente. Sempre usar `npx vercel@latest` para garantir versao atual.
