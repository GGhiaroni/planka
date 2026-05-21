---
card_id: "1778610132976928537"
operacao: card-isolated
data: 2026-05-19
tipo: card_original
titulo: "Atualização ENV hostinger"
board_id: "1754032365966984963"
list_id: "1754033666612266764"
creator: "victorgaudio"
created_at: "2026-05-19T19:20:50.336Z"
labels: ["1769160767896028874"]
---

## [1778610132976928537] Atualização ENV hostinger

### Description

dei o push la pro github, na branch deploy/staging!

ai pros proximos passos na vps, preciso da tua ajuda:

No VPS Hostinger

ssh root@VPS
cd /opt/planka
git pull origin master
Adiciona no .env (do VPS, não no repo):

SUPABASE_URL=https://gyplupcueedpttkmxckk.supabase.co
SUPABASE_SECRET_KEY=sb_secret_REDACTED_ROTATION_PENDING_CARD_928537
# Nota da escriba: a chave real foi posted pelo operador no body original do card mural
# e populada na VPS .env durante a operacao. GitHub secret scanning push protection
# bloqueou o commit verbatim — chave redacted aqui no vault. Rotacao continua pendente
# (Pendencia 1 do report-executivo do card). Apos rotacao operador atualiza .env VPS
# e este arquivo pode ser mantido REDACTED permanentemente (chave antiga invalidada).
Rebuild os 2 containers afetados:

docker compose -f docker-compose.prod.yml --env-file .env up -d --build planka ticket-form
O --build força reconstrução das imagens (planka pra incluir utils/supabase.js, ticket-form pra incluir o novo supabase.js). Os outros (postgres, caddy) ficam intactos.

4. Validação em produção
   Cria um card em https://pdviewerp-stagging.fourtuna.com.br/ ou submete um form em https://form-pdviewerp-stagging.fourtuna.com.br/, e roda no SQL Editor do Supabase:

select event_type, planka_card_id, data, created_at
from card_events
order by created_at desc
limit 10;

select form_type, planka_card_id, created_at
from form_submissions
order by created_at desc
limit 10;
Quando aparecer linhas → produção tá espelhando OK.

Resumo curto: enquanto você não fizer o git push + merge + redeploy no VPS com as 2 env vars novas, a produção continua sem tocar no Supabase. O Supabase só vai receber dados depois desses 3 passos.

### Comments

> [victorgaudio]: @tuninho executa esse card pf.
