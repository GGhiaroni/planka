'use strict';

const { CONTACT_REASONS } = require('./config');
const { createCard } = require('./planka');

async function submitHandler(req, res) {
  const { motivo, descricao } = req.body || {};

  if (!motivo || !CONTACT_REASONS.includes(motivo)) {
    return res.status(400).json({ error: 'Motivo inválido.' });
  }

  if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
    return res.status(400).json({ error: 'A descrição não pode estar vazia.' });
  }

  if (descricao.length > 10_000) {
    return res.status(400).json({ error: 'Descrição muito longa (máximo 10.000 caracteres).' });
  }

  try {
    const name = `[${motivo}] ${descricao.trim().slice(0, 60)}`;
    await createCard(name, descricao.trim());
    return res.json({ ok: true });
  } catch (err) {
    console.error('[ticket-form] Error creating Planka card:', err.message);
    return res.status(502).json({ error: 'Erro ao criar o chamado. Tente novamente em instantes.' });
  }
}

module.exports = { submitHandler };
