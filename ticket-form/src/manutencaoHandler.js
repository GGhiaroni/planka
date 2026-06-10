'use strict';

const {
  createCardInList,
  createCardCustomFieldGroups,
  attachLabel,
  getChamadosListId,
  getChamadosBoardId,
  getAtendimentoListId,
  getAtendimentoBoardId,
  getLabelIdOnBoard,
  uploadAttachmentsFromMulter,
} = require('./planka');
const supabase = require('./supabase');

const TIPOS_SERVICO = ['Venda', 'Locação', 'Assistência Técnica'];
const DEMANDAS_VALIDAS = ['Elétrica', 'Rede', 'Alvenaria', 'Disjuntor'];

// Mapeia o "Tipo de Serviço" do form pro rótulo colorido aplicado no card.
// Venda + Locação → equipe vai *instalar* algo; Assistência Técnica → suporte.
// Os rótulos são criados pelo seed nos boards Operacional e Atendimento.
const TIPO_LABEL_MAP = {
  Venda: 'INSTALAÇÃO',
  Locação: 'INSTALAÇÃO',
  'Assistência Técnica': 'ASSISTÊNCIA TÉCNICA',
};

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

// Creates one card on a target list and applies the standard chamado payload:
// custom fields, optional label, optional attachments. Reused for both the
// Operacional and Atendimento cards (the chamado is intentionally mirrored
// since the spec is "atendimento recebe e encaminha para o operacional").
// Returns the created card item.
async function createChamadoCard({ listId, cardName, customFieldGroups, labelId, files }) {
  const { item: card } = await createCardInList(listId, cardName, '');
  await createCardCustomFieldGroups(card.id, customFieldGroups);
  if (labelId) await attachLabel(card.id, labelId);
  if (files && files.length > 0) {
    await uploadAttachmentsFromMulter(card.id, files);
  }
  return card;
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
  const tipoServico = String(data.tipoServico).trim();
  if (!TIPOS_SERVICO.includes(tipoServico)) {
    return res.status(400).json({ error: `Tipo de serviço inválido: ${data.tipoServico}` });
  }

  // Resolve target lists + label IDs ahead of time so an inexistent board
  // fails the request *before* we partially create cards across boards.
  let operacionalListId;
  let atendimentoListId;
  let operacionalLabelId = null;
  let atendimentoLabelId = null;
  try {
    operacionalListId = await getChamadosListId();
    atendimentoListId = await getAtendimentoListId();

    const tipoLabelName = TIPO_LABEL_MAP[tipoServico];
    if (tipoLabelName) {
      const [opBoardId, atBoardId] = await Promise.all([
        getChamadosBoardId(),
        getAtendimentoBoardId(),
      ]);
      [operacionalLabelId, atendimentoLabelId] = await Promise.all([
        getLabelIdOnBoard(opBoardId, tipoLabelName),
        getLabelIdOnBoard(atBoardId, tipoLabelName),
      ]);
    }
  } catch (err) {
    console.error('[ticket-form] failed to resolve Planka IDs:', err.message);
    return res.status(500).json({
      error:
        'Não foi possível localizar os boards "Operacional" ou "Atendimento". Verifique se eles existem no Planka.',
    });
  }

  const os = generateOsNumber();
  const now = new Date();
  const openedAt = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
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

  const customFieldsForSupabase = customFieldGroups.reduce((acc, group) => {
    acc[group.name] = group.fields.reduce((m, f) => {
      m[f.name] = f.value;
      return m;
    }, {});
    return acc;
  }, {});

  try {
    // Cria o card no Operacional + Atendimento em paralelo. Os 2 são
    // independentes (o espelhamento de estado entra em um PR seguinte).
    const [opCard, atCard] = await Promise.all([
      createChamadoCard({
        listId: operacionalListId,
        cardName,
        customFieldGroups,
        labelId: operacionalLabelId,
        files: req.files,
      }),
      createChamadoCard({
        listId: atendimentoListId,
        cardName,
        customFieldGroups,
        labelId: atendimentoLabelId,
        files: req.files,
      }),
    ]);

    // Mirror to Supabase (best-effort). Logamos o card "principal"
    // (Operacional) na tabela cards e referenciamos o gêmeo do Atendimento
    // no payload do evento — assim a sincronização futura tem como achar
    // o par sem precisar de uma tabela nova.
    Promise.all([
      supabase.logFormSubmission({
        formType: 'chamado',
        payload: data,
        plankaCardId: opCard.id,
        osNumber: os,
        status: 'created',
      }),
      supabase.upsertCard({
        planka_id: String(opCard.id),
        board_id: opCard.boardId ? String(opCard.boardId) : null,
        list_id: opCard.listId ? String(opCard.listId) : null,
        project_name: 'PDView ERP',
        board_name: 'Operacional',
        list_name: 'CHAMADOS',
        name: cardName,
        description: opCard.description || null,
        labels: operacionalLabelId ? [{ name: TIPO_LABEL_MAP[tipoServico] }] : [],
        custom_fields: customFieldsForSupabase,
      }),
      supabase.upsertCard({
        planka_id: String(atCard.id),
        board_id: atCard.boardId ? String(atCard.boardId) : null,
        list_id: atCard.listId ? String(atCard.listId) : null,
        project_name: 'PDView ERP',
        board_name: 'Atendimento',
        list_name: 'CHAMADOS',
        name: cardName,
        description: atCard.description || null,
        labels: atendimentoLabelId ? [{ name: TIPO_LABEL_MAP[tipoServico] }] : [],
        custom_fields: customFieldsForSupabase,
      }),
      supabase.logCardEvent({
        plankaCardId: opCard.id,
        eventType: 'form_submit_chamado',
        data: {
          source: 'ticket-form',
          os_number: os,
          opened_at: openedAt,
          tipo_servico: tipoServico,
          tipo_label: TIPO_LABEL_MAP[tipoServico] || null,
          vendedor: String(data.vendedor).trim(),
          demandas,
          attachments: Array.isArray(req.files) ? req.files.length : 0,
          mirror_atendimento_card_id: String(atCard.id),
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
