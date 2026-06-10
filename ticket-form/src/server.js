'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const { PORT, CONTACT_REASONS } = require('./config');
const { submitHandler } = require('./handler');
const { gformsHandler } = require('./gformsHandler');
const { manutencaoHandler } = require('./manutencaoHandler');
const { comercialHandler } = require('./comercialHandler');
const { fetchBoardCards } = require('./planka');
const supabase = require('./supabase');

const app = express();

// Multer middleware for image uploads on the form endpoints. Stored in memory
// because we forward each file to Planka's attachments API right away — no
// reason to hit disk. Multer is a no-op on JSON requests (it only handles
// multipart/form-data), so the existing Google Apps Script webhook path
// keeps working untouched.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, max 10 files
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Expose config to the frontend so the dropdown is always in sync with server validation.
app.get('/api/config', (_req, res) => {
  res.json({ reasons: CONTACT_REASONS });
});

app.post('/api/submit', submitHandler);

// Webhook called by Google Apps Script on form submission (JSON) and by the
// artes form (multipart with optional image attachments).
app.post('/api/gforms', upload.array('anexos', 10), gformsHandler);

// Maintenance ticket form submission (optional image attachments)
app.post('/api/manutencao', upload.array('anexos', 10), manutencaoHandler);

// Atualização Comercial (Posto/Varejo/Igreja unificado, optional attachments)
app.post('/api/comercial', upload.array('anexos', 10), comercialHandler);

// Typeahead de clientes — alimenta o autocomplete dos forms de Pedido de
// Arte e Chamado Técnico. Retorna `[]` se Supabase desabilitado ou se o
// termo for muito curto (<2 chars) — comportamento silencioso, o front
// só mostra dropdown quando vier resultado.
app.get('/api/clientes/search', async (req, res) => {
  const q = String(req.query.q || '');
  const limit = Math.min(parseInt(req.query.limit || '10', 10) || 10, 25);
  const items = await supabase.searchClients(q, limit);
  res.json({ items });
});

// Cards listing for table view
app.get('/api/cards', async (_req, res) => {
  try {
    const cards = await fetchBoardCards();
    res.json({ items: cards });
  } catch (err) {
    console.error('[ticket-form] Failed to fetch cards:', err.message);
    res.status(502).json({ error: 'Erro ao buscar os cards.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ticket-form] Listening on http://0.0.0.0:${PORT}`);
});
