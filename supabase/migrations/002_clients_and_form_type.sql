-- =============================================================================
-- Clients table + form_type 'comercial' (06/2026)
-- =============================================================================
-- Quando o time de vendas preenche o formulário de Pedido de Venda, salvamos
-- também o cliente numa tabela canônica (não só o snapshot bruto em
-- form_submissions). Os outros formulários (Pedido de Arte e Chamado Técnico)
-- consultam essa tabela pra autopreencher os campos do cliente quando o
-- usuário digita o nome.
--
-- Como aplicar: cole o arquivo no Supabase Dashboard → SQL Editor → Run.
-- =============================================================================

-- Inclui 'comercial' no check constraint do form_submissions. O handler já
-- vinha tentando gravar com esse valor desde o PR do form comercial — só não
-- entrava porque o constraint barrava.
alter table public.form_submissions
  drop constraint if exists form_submissions_form_type_check;

alter table public.form_submissions
  add constraint form_submissions_form_type_check
  check (form_type in ('design', 'chamado', 'comercial'));

-- --- Clients (cadastro canônico vindo dos formulários de Pedido de Venda) ----
-- Um único registro por (nome normalizado). Re-submissões do mesmo cliente
-- atualizam os campos que vieram preenchidos (deixa o que já tinha se vier
-- vazio — `coalesce` no upsert do handler).
create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  -- Coluna gerada serve de chave de match: case-insensitive, sem espaços
  -- nas pontas. Quando o usuário digita "Posto Mineirão" no form de artes,
  -- o autocomplete bate aqui.
  name_normalized text generated always as (lower(trim(name))) stored,
  cnpj            text,
  tipo            text,        -- 'Posto' | 'Varejo' | 'Igreja'
  bandeira        text,        -- só para tipo=Posto
  segmento        text,        -- só para tipo=Varejo
  denominacao     text,        -- só para tipo=Igreja
  cidade          text,
  estado          text,
  responsavel     text,
  telefone        text,
  status          text,        -- status da negociação
  observacoes     text,
  ultimo_vendedor text,
  last_submission_id uuid references public.form_submissions(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Match principal do autocomplete é por nome normalizado.
create unique index if not exists clients_name_normalized_idx
  on public.clients (name_normalized);

-- CNPJ pode ser usado como chave secundária quando o time tiver o número.
create index if not exists clients_cnpj_idx
  on public.clients (cnpj) where cnpj is not null;

-- updated_at desc — pra ordenar resultados do typeahead pelos mais recentes.
create index if not exists clients_updated_at_idx
  on public.clients (updated_at desc);

-- Acesso só via service_role (mesma postura das outras tabelas). O endpoint
-- /api/clientes/search no ticket-form usa o secret key e devolve o resultado
-- ao browser.
alter table public.clients enable row level security;
