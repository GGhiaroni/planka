# Environment Catalog — Orquestra Voadora Oficina 2026

**Version:** 1.0.0 | **Generated:** 2026-04-06 | **Scan Mode:** bootstrap

## Produção

| Campo | Valor |
|-------|-------|
| **Porta** | 3040 |
| **Domínio** | oficinaorquestravoadora2026.55jam.com.br |
| **Process Manager** | systemd (orquestravoadora.service) |
| **Banco de Dados** | SQLite (orquestravoadora.db) |
| **Python** | 3.13.7 |
| **SSL** | Let's Encrypt (expira 2026-07-01) |
| **Env File** | /opt/hostinger-alfa/orquestravoadora/.env.production |
| **Health Check** | https://oficinaorquestravoadora2026.55jam.com.br/ |
| **Restart** | `systemctl reload orquestravoadora` |

## Desenvolvimento (Tuninho IDE)

| Campo | Valor |
|-------|-------|
| **Porta** | 3041 |
| **Domínio** | localhost |
| **Startup** | `source venv/bin/activate && python app.py` |
| **Banco de Dados** | SQLite local (./orquestravoadora.db) — schema vazio |
| **Env File** | .env (FLASK_ENV=development) |
| **Health Check** | http://localhost:3041/ |

## Isolation Matrix

| Recurso | Produção | Desenvolvimento |
|---------|----------|-----------------|
| Porta HTTP | 3040 | 3041 |
| Banco de Dados | /opt/hostinger-alfa/orquestravoadora/orquestravoadora.db | ./orquestravoadora.db |
| Env File | .env.production (via systemd EnvironmentFile) | .env (via load_dotenv override=True) |
| Flask Env | production | development |

## Riscos de Estado Compartilhado

- **Firebase**: Projeto jamov-95fda compartilhado. Mesmos users em dev e prod.
- **Asaas**: Chave de produção compartilhada. Cuidado com cobranças reais em dev.
- **Google Sheets**: Spreadsheet compartilhada. Dev pode escrever dados reais.
- **Twilio**: WHATSAPP_PRODUCTION_MODE=false é o safety lock em dev.

## Nota Importante

`load_dotenv(override=True)` é obrigatório no app.py porque o Tuninho IDE herda PORT=3847 do sistema. Sem override, o .env do projeto é ignorado para variáveis já definidas no ambiente.
