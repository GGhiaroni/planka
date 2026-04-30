'use strict';

const {
  createCardInList,
  createCardCustomFieldGroups,
  attachLabel,
} = require('./planka');
const { PLANKA_CHAMADOS_LIST_ID, PRIORITY_LABELS } = require('./config');

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

function buildDescription(data, os, openedAt) {
  const lines = [
    `> Chamado aberto via formulário em ${openedAt}`,
    `> OS Nº: ${os}`,
    '',
    '---',
    '## Identificação',
    `**Cliente:** ${data.cliente}`,
    data.rede && `**Rede:** ${data.rede}`,
    `**Bandeira:** ${data.bandeira}`,
    '',
    '## Localização',
    data.endereco && `**Endereço:** ${data.endereco}`,
    `**Cidade:** ${data.cidade}`,
    `**Estado:** ${data.estado}`,
    data.cep && `**CEP:** ${data.cep}`,
    '',
    '## Chamado',
    `**Prioridade:** ${data.prioridade}`,
    `**Garantia:** ${data.garantia}`,
    '',
    '**Motivo:**',
    data.motivo,
  ].filter(Boolean);

  return lines.join('\n');
}

async function manutencaoHandler(req, res) {
  if (!PLANKA_CHAMADOS_LIST_ID) {
    return res
      .status(500)
      .json({ error: 'Serviço não configurado (PLANKA_CHAMADOS_LIST_ID ausente).' });
  }

  const data = req.body || {};

  // Validation
  const required = ['cliente', 'bandeira', 'cidade', 'estado', 'motivo', 'garantia', 'prioridade'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return res.status(400).json({ error: `Campo obrigatório ausente: ${field}` });
    }
  }

  const labelId = PRIORITY_LABELS[data.prioridade];
  if (!labelId) {
    return res.status(400).json({ error: `Prioridade inválida: ${data.prioridade}` });
  }

  const os = generateOsNumber();
  const now = new Date();
  const openedAt = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dataAbertura = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const cardName = String(data.cliente).trim();

  const customFieldGroup = {
    name: 'Dados do Chamado',
    fields: [
      { name: 'OS Nº', value: os },
      { name: 'Cliente', value: data.cliente, showOnFrontOfCard: true },
      data.rede && { name: 'Rede', value: data.rede },
      { name: 'Bandeira ou Tipo', value: data.bandeira, showOnFrontOfCard: true },
      { name: 'Cidade', value: data.cidade, showOnFrontOfCard: true },
      { name: 'Estado', value: data.estado },
      { name: 'Data de Abertura', value: dataAbertura },
      { name: 'Motivo do Chamado', value: data.motivo },
      { name: 'Garantia', value: data.garantia },
      data.endereco && { name: 'Endereço', value: data.endereco },
      data.cep && { name: 'CEP', value: data.cep },
      // Inicialmente vazio — preenchido pelo técnico quando mover o card
      // de "Em Execução" para "Executados".
      { name: 'Resolução do Chamado', value: '—' },
    ].filter(Boolean),
  };

  try {
    const { item: card } = await createCardInList(PLANKA_CHAMADOS_LIST_ID, cardName, '');
    await attachLabel(card.id, labelId);
    await createCardCustomFieldGroups(card.id, [customFieldGroup]);
    return res.json({ ok: true, os });
  } catch (err) {
    console.error('[ticket-form] manutencao card creation failed:', err.message);
    return res.status(502).json({ error: 'Erro ao abrir o chamado. Tente novamente.' });
  }
}

module.exports = { manutencaoHandler };
