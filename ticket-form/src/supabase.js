'use strict';

/**
 * Supabase client + write helpers used by the ticket-form handlers.
 *
 * Reads:
 *   SUPABASE_URL         e.g. https://gyplupcueedpttkmxckk.supabase.co
 *   SUPABASE_SECRET_KEY  service_role (server-only — never exposed to the form)
 *
 * If either env var is missing, the client is disabled and write helpers
 * become no-ops (logged once). This keeps the form working even when the
 * Supabase mirror is not configured yet.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || null;

let client = null;
let warned = false;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else if (!warned) {
  console.warn(
    '[ticket-form] Supabase mirror disabled — set SUPABASE_URL and SUPABASE_SECRET_KEY to enable.',
  );
  warned = true;
}

function isEnabled() {
  return !!client;
}

/**
 * Insert a row in form_submissions describing what the form posted.
 *
 *   formType: 'design' | 'chamado'
 *   payload:  the raw object that was submitted
 *   plankaCardId: optional — id of the card just created on Planka
 *   osNumber: optional — only for chamado
 *   status: 'created' | 'failed'
 *   errorMessage: optional — only when status='failed'
 */
async function logFormSubmission({
  formType,
  payload,
  plankaCardId = null,
  osNumber = null,
  status = 'created',
  errorMessage = null,
}) {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('form_submissions')
      .insert({
        form_type: formType,
        payload,
        planka_card_id: plankaCardId ? String(plankaCardId) : null,
        os_number: osNumber,
        status,
        error_message: errorMessage,
      })
      .select('id')
      .single();
    if (error) {
      console.error(`[ticket-form] supabase form_submissions failed: ${error.message}`);
      return null;
    }
    return data && data.id;
  } catch (err) {
    console.error(`[ticket-form] supabase form_submissions threw: ${err.message}`);
    return null;
  }
}

/**
 * Upsert the canonical state of a card. Called right after the card is
 * created on Planka, so we already have the snapshot of name + list + labels
 * + custom fields.
 */
async function upsertCard(card) {
  if (!client) return;
  if (!card || !card.planka_id) return;
  try {
    const { error } = await client
      .from('cards')
      .upsert(card, { onConflict: 'planka_id' });
    if (error) {
      console.error(`[ticket-form] supabase cards upsert failed: ${error.message}`);
    }
  } catch (err) {
    console.error(`[ticket-form] supabase cards upsert threw: ${err.message}`);
  }
}

/**
 * Upsert a client record (used pelo form de Pedido de Venda). O match é por
 * nome normalizado (lower + trim). Campos que vierem null/undefined no
 * patch são ignorados pra não apagar dados já cadastrados.
 *
 * Retorna o id do registro upserted, ou null se desabilitado/erro.
 */
async function upsertClient(patch) {
  if (!client) return null;
  if (!patch || !patch.name || !String(patch.name).trim()) return null;
  try {
    const name = String(patch.name).trim();
    const nameNormalized = name.toLowerCase();

    // Procura um cliente existente pelo nome normalizado pra fazer merge
    // dos campos (preserva o que veio antes se a submissão atual deixou em
    // branco). name_normalized é coluna gerada — não vai no select por
    // necessidade, mas serve de chave única no índice.
    const { data: existing } = await client
      .from('clients')
      .select('*')
      .eq('name_normalized', nameNormalized)
      .maybeSingle();

    // Monta payload final: novo onde vier, herda do existente onde não.
    const merged = {
      name,
      cnpj: patch.cnpj ?? existing?.cnpj ?? null,
      tipo: patch.tipo ?? existing?.tipo ?? null,
      bandeira: patch.bandeira ?? existing?.bandeira ?? null,
      segmento: patch.segmento ?? existing?.segmento ?? null,
      denominacao: patch.denominacao ?? existing?.denominacao ?? null,
      cidade: patch.cidade ?? existing?.cidade ?? null,
      estado: patch.estado ?? existing?.estado ?? null,
      responsavel: patch.responsavel ?? existing?.responsavel ?? null,
      telefone: patch.telefone ?? existing?.telefone ?? null,
      status: patch.status ?? existing?.status ?? null,
      observacoes: patch.observacoes ?? existing?.observacoes ?? null,
      ultimo_vendedor: patch.ultimo_vendedor ?? existing?.ultimo_vendedor ?? null,
      last_submission_id: patch.last_submission_id ?? existing?.last_submission_id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await client.from('clients').update(merged).eq('id', existing.id);
      if (error) {
        console.error(`[ticket-form] supabase clients update failed: ${error.message}`);
        return null;
      }
      return existing.id;
    }

    const { data: inserted, error } = await client
      .from('clients')
      .insert(merged)
      .select('id')
      .single();
    if (error) {
      console.error(`[ticket-form] supabase clients insert failed: ${error.message}`);
      return null;
    }
    return inserted && inserted.id;
  } catch (err) {
    console.error(`[ticket-form] supabase clients upsert threw: ${err.message}`);
    return null;
  }
}

/**
 * Busca clientes cujo nome (normalizado) contenha o termo `q`. Usado pelo
 * typeahead nos formulários de Pedido de Arte e Chamado Técnico.
 *
 * Retorna até `limit` registros mais recentes; lista vazia se desabilitado.
 */
async function searchClients(q, limit = 10) {
  if (!client) return [];
  const term = String(q || '').trim().toLowerCase();
  if (term.length < 2) return [];
  try {
    const { data, error } = await client
      .from('clients')
      .select(
        'id,name,cnpj,tipo,bandeira,segmento,denominacao,cidade,estado,responsavel,telefone,updated_at',
      )
      .ilike('name_normalized', `%${term}%`)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error(`[ticket-form] supabase clients search failed: ${error.message}`);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error(`[ticket-form] supabase clients search threw: ${err.message}`);
    return [];
  }
}

/** Append an event to the card_events timeline. Best-effort, never throws. */
async function logCardEvent({ plankaCardId, eventType, data = {}, userEmail = null }) {
  if (!client) return;
  if (!plankaCardId) return;
  try {
    const { error } = await client.from('card_events').insert({
      planka_card_id: String(plankaCardId),
      event_type: eventType,
      data,
      user_email: userEmail,
    });
    if (error) {
      console.error(`[ticket-form] supabase card_events failed: ${error.message}`);
    }
  } catch (err) {
    console.error(`[ticket-form] supabase card_events threw: ${err.message}`);
  }
}

module.exports = {
  isEnabled,
  logFormSubmission,
  upsertCard,
  upsertClient,
  searchClients,
  logCardEvent,
};
