'use strict';

const {
  createCardInList,
  createCardCustomFieldGroups,
  getChamadosListId,
  uploadAttachmentsFromMulter,
} = require('./planka');
const supabase = require('./supabase');

const TIPOS_SERVICO = ['Venda', 'Locação', 'Assistência Técnica'];
const DEMANDAS_VALIDAS = ['Elétrica', 'Rede', 'Alvenaria', 'Disjuntor'];

function generateOsNumber() {
  const now = new Date();
  const ymdhms =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  return `${ymdhms}-017`;
}

// Multer/express turns repeated multipart keys into an array, single values
// stay as a string, and absence is undefined. Normalize to a clean array of
// valid options.
function normalizeDemandas(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((v) => String(v).trim()).filter((v) => DEMANDAS_VALIDAS.includes(v));
}

// Format YYYY-MM-DD (HTML date input) as DD/MM/YYYY for human display.
function formatDateBr(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

async function manutencaoHandler(req, res) {
  const data = req.body || {};

  // Validation — exactly the fields from the paper form.
  const required = [
    'cliente',
    'nomeContato',
    'telefoneContato',
    'vendedor',
    'dataChamado',
    'prazoExecucao',
    'tipoServico',
    'enderecoServico',
  ];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return res.status(400).json({ error: `Campo obrigatório ausente: ${field}` });
    }
  }
  if (!TIPOS_SERVICO.includes(String(data.tipoServico).trim())) {
    return res.status(400).json({ error: `Tipo de serviço inválido: ${data.tipoServico}` });
  }

  let chamadosListId;
  try {
    chamadosListId = await getChamadosListId();
  } catch (err) {
    console.error('[ticket-form] failed to resolve Planka IDs:', err.message);
    return res.status(500).json({
      error:
        'Não foi possível localizar o board "Chamados Técnicos". Verifique se ele existe no Planka.',
    });
  }

  const os = generateOsNumber();
  const now = new Date();
  const openedAt = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const tipoServico = String(data.tipoServico).trim();
  const cliente = String(data.cliente).trim();
  const demandas = normalizeDemandas(data.demandas);
  const observacoes = data.observacoes ? String(data.observacoes).trim() : '';

  const cardName = `[${tipoServico}] ${cliente}`;

  const customFieldGroups = [
    {
      name: 'Identificação',
      fields: [
        { name: 'OS Nº', value: os },
        { name: 'Cliente', value: cliente, showOnFrontOfCard: true },
        { name: 'Tipo de Serviço', value: tipoServico, showOnFrontOfCard: true },
        { name: 'Nome do Contato', value: String(data.nomeContato).trim() },
        { name: 'Telefone do Contato', value: String(data.telefoneContato).trim() },
        { name: 'Vendedor', value: String(data.vendedor).trim() },
      ],
    },
    {
      name: 'Serviço',
      fields: [
        { name: 'Data do Chamado', value: formatDateBr(String(data.dataChamado).trim()) },
        { name: 'Prazo de Execução', value: String(data.prazoExecucao).trim() },
        { name: 'Endereço do Serviço', value: String(data.enderecoServico).trim() },
        demandas.length > 0 && { name: 'Demandas', value: demandas.join(', ') },
      ].filter(Boolean),
    },
  ];

  if (observacoes) {
    customFieldGroups.push({
      name: 'Observações',
      fields: [{ name: 'Observações', value: observacoes }],
    });
  }

  try {
    const { item: card } = await createCardInList(chamadosListId, cardName, '');
    await createCardCustomFieldGroups(card.id, customFieldGroups);

    // Upload any optional image attachments (best-effort, never blocks).
    const uploadedCount = await uploadAttachmentsFromMulter(card.id, req.files);

    // Mirror to Supabase (best-effort).
    Promise.all([
      supabase.logFormSubmission({
        formType: 'chamado',
        payload: data,
        plankaCardId: card.id,
        osNumber: os,
        status: 'created',
      }),
      supabase.upsertCard({
        planka_id: String(card.id),
        board_id: card.boardId ? String(card.boardId) : null,
        list_id: card.listId ? String(card.listId) : null,
        project_name: 'PDView ERP',
        board_name: 'Chamados Técnicos',
        list_name: 'Em Espera',
        name: cardName,
        description: card.description || null,
        labels: [],
        custom_fields: customFieldGroups.reduce((acc, group) => {
          acc[group.name] = group.fields.reduce((m, f) => {
            m[f.name] = f.value;
            return m;
          }, {});
          return acc;
        }, {}),
      }),
      supabase.logCardEvent({
        plankaCardId: card.id,
        eventType: 'form_submit_chamado',
        data: {
          source: 'ticket-form',
          os_number: os,
          opened_at: openedAt,
          tipo_servico: tipoServico,
          vendedor: String(data.vendedor).trim(),
          demandas,
          attachments: uploadedCount,
        },
      }),
    ]).catch(() => undefined);

    return res.json({ ok: true, os });
  } catch (err) {
    console.error('[ticket-form] manutencao card creation failed:', err.message);
    supabase
      .logFormSubmission({
        formType: 'chamado',
        payload: data,
        osNumber: os,
        status: 'failed',
        errorMessage: err.message,
      })
      .catch(() => undefined);
    return res.status(502).json({ error: 'Erro ao abrir o chamado. Tente novamente.' });
  }
}

module.exports = { manutencaoHandler };
