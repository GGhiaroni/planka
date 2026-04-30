'use strict';

const required = (name) => {
  const val = process.env[name];
  if (!val) {
    console.error(`[ticket-form] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
};

const PORT = parseInt(process.env.PORT || '3001', 10);
const PLANKA_URL = required('PLANKA_URL').replace(/\/$/, '');
const PLANKA_EMAIL = required('PLANKA_EMAIL');
const PLANKA_PASSWORD = required('PLANKA_PASSWORD');
const PLANKA_LIST_ID = required('PLANKA_LIST_ID');

const CONTACT_REASONS = (
  process.env.CONTACT_REASONS || 'Manutenção,Financeiro,Troca de Arte'
)
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

// Optional — if set, the /api/gforms endpoint requires this value
// in the X-Webhook-Secret header or ?secret= query param.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || null;

// Board "Chamados Técnicos" — target list where new maintenance tickets land.
const PLANKA_CHAMADOS_LIST_ID = process.env.PLANKA_CHAMADOS_LIST_ID || null;

// Map priority name → label ID on the Chamados Técnicos board.
// Env var format: "BAIXA PRIORIDADE:id,MÉDIA GRAVIDADE:id,..."
const PRIORITY_LABELS = (process.env.PRIORITY_LABELS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .reduce((map, entry) => {
    const idx = entry.lastIndexOf(':');
    if (idx > 0) {
      map[entry.slice(0, idx).trim()] = entry.slice(idx + 1).trim();
    }
    return map;
  }, {});

module.exports = {
  PORT,
  PLANKA_URL,
  PLANKA_EMAIL,
  PLANKA_PASSWORD,
  PLANKA_LIST_ID,
  CONTACT_REASONS,
  WEBHOOK_SECRET,
  PLANKA_CHAMADOS_LIST_ID,
  PRIORITY_LABELS,
};
