#!/usr/bin/env node
/*!
 * tuninho-mural CLI — v0.10.0
 *
 * Modes (19):
 *   connect, list-cards, fetch-card, fetch-comments, create-card, update-card,
 *   comment, comment-correction, setup-card, create-list, export-result,
 *   sync, card-result, list-labels, add-label, remove-label,
 *   fetch-attachments, attach-evidence, card-evidence  (v0.10.0 attachments)
 *
 * v0.10.0 (card 1766766663711065657 — 2026-05-03): attachments — 3 modos novos:
 *   - fetch-attachments: lista anexos via getCard.included.attachments + opcional
 *     download-to folder. Para downloads, Bearer pode 401 (Planka session-bound) —
 *     usar data.url em browser autenticado.
 *   - attach-evidence: upload single file + create comment com attachmentIds.
 *   - card-evidence: batch upload de uma pasta inteira (regex filter, concurrency
 *     configurável) + 1 comment markdown agrupando tudo. Usado em DDCE Etapa 11/15.X
 *     com `--folder fase_NN/evidencias/`.
 * Cooperacao: requer mural-api-client v0.2.0+ (com listAttachments delegado a getCard
 * e fix bug Planka #1352 ordem multipart).
 *
 * v0.7.0 (Op 138 Card 138 — 2026-05-01): destino "tuninho-ai" (board Dev) via
 * factory pattern. Modos `comment`, `card-result`, `card-validated` aceitam
 * flag `--origin tuninho-ai|mural-a4tunados`. MinimalMuralClient extraido para
 * `clients/planka-client.js` + novo `clients/tuninho-ai-client.js` que usa
 * endpoint `/api/admin/dev-mural/incoming-comment` com bearer CSS_INBOUND_BEARER.
 *
 * Usage:
 *   node mural-cli.js <mode> [options]
 *   node mural-cli.js comment --card 138 --origin tuninho-ai --text "..." --env prod
 *
 * Novos modes v0.3.1 (Op 05 aprendizados consolidados):
 *   fetch-comments        GET /api/cards/:id/comments (fetch-card nao inclui)
 *   setup-card            3 acoes atomicas: create + add operador membro card +
 *                         ensure tuninho membro board. GAP-OP05-002.
 *   create-list           POST /api/boards/:boardId/lists. Usado quando precisa
 *                         criar list "em teste/validando" etc.
 *   comment-correction    Adiciona comment com prefix de correcao linkando ao
 *                         anterior. Pattern Op 05 "autonomous-report mentiu".
 *   comment --redact-check  Dry-run: escaneia patterns de secret. Sem flag,
 *                           bloqueia por default se detecta; `--allow-secrets`
 *                           override explicito (GAP-OP05-004).
 *
 * Env source: _a4tunados/env/mural/.env.mural.{dev|stage|prod}
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// v0.7.0 (Op 138 Card 138): clients extraidos para clients/ — pattern factory
// permite multiplos destinos (mural a4tunados Planka, board Dev tuninho.ai, futuros).
import { PlankaClient } from './clients/planka-client.js';
import { TuninhoAiClient } from './clients/tuninho-ai-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve repo root — skill lives at .claude/skills/tuninho-mural/cli/
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
const MURAL_API_CLIENT_PATH = join(REPO_ROOT, 'services', 'mural-api-client', 'index.js');
const ENV_DIR_MURAL = join(REPO_ROOT, '_a4tunados', 'env', 'mural');
const ENV_DIR_TUNINHO_AI = join(REPO_ROOT, '_a4tunados', 'env', 'tuninho-ai');
// Backwards compat: ENV_DIR aponta para mural por default (pre-v0.7.0)
const ENV_DIR = ENV_DIR_MURAL;
const SESSION_TRACKER_PATH = join(REPO_ROOT, '.claude', 'session-tracker.json');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function parseEnvFile(path) {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Origin detection heuristic (v0.7.0 Op 138 Card 138)
// Card de tuninho-ai (board Dev) usa chat_id numerico curto (1-N, hoje max ~140).
// Card do mural a4tunados (Planka) usa snowflake-like IDs (≥12 dígitos).
// ---------------------------------------------------------------------------

function detectOriginByCardId(cardId) {
  if (!cardId) return null;
  const id = String(cardId);
  if (/^\d+$/.test(id)) {
    const n = Number(id);
    if (n < 100000) return 'tuninho-ai';
    if (n >= 100000000000) return 'mural-a4tunados';
  }
  return null; // ambiguo — flag --origin obrigatoria
}

// ---------------------------------------------------------------------------
// Factory loadClient — escolhe driver baseado em origin.
//
// Origin "mural-a4tunados" (default — backwards compat): carrega Planka client
//   * env: _a4tunados/env/mural/.env.mural.{dev|stage|prod}
//   * vars: MURAL_API_URL, MURAL_TUNINHO_TOKEN
//   * client: services/mural-api-client (se existir) OR PlankaClient (clients/planka-client.js)
//
// Origin "tuninho-ai": carrega TuninhoAiClient (board Dev tuninho.ai)
//   * env: _a4tunados/env/tuninho-ai/.env.tuninho-ai.{dev|prod}
//   * vars: CSS_INBOUND_BEARER, TUNINHO_AI_BASE_URL
//   * client: clients/tuninho-ai-client.js
// ---------------------------------------------------------------------------

async function loadClient(originOrEnv, maybeEnv) {
  // Backwards compat: loadClient(env) — string env name only, default origin = mural-a4tunados
  // New API: loadClient(origin, env)
  let origin;
  let env;
  if (maybeEnv === undefined && (originOrEnv === undefined || originOrEnv === 'dev' || originOrEnv === 'stage' || originOrEnv === 'prod')) {
    origin = 'mural-a4tunados';
    env = originOrEnv;
  } else {
    origin = originOrEnv || 'mural-a4tunados';
    env = maybeEnv;
  }
  const envName = env || 'dev';

  if (origin === 'tuninho-ai') {
    const envFile = join(ENV_DIR_TUNINHO_AI, `.env.tuninho-ai.${envName}`);
    const config = parseEnvFile(envFile);
    if (!config) {
      console.error(`[tuninho-mural] Missing env file: ${envFile}`);
      console.error(`                create it with CSS_INBOUND_BEARER and TUNINHO_AI_BASE_URL`);
      process.exit(1);
    }
    const { CSS_INBOUND_BEARER, TUNINHO_AI_BASE_URL } = config;
    if (!CSS_INBOUND_BEARER || !TUNINHO_AI_BASE_URL) {
      console.error(`[tuninho-mural] ${envFile} missing CSS_INBOUND_BEARER or TUNINHO_AI_BASE_URL`);
      process.exit(1);
    }
    const client = new TuninhoAiClient({
      baseUrl: TUNINHO_AI_BASE_URL,
      token: CSS_INBOUND_BEARER,
      origin: 'mural-cli',
    });
    return { client, config, envName, origin, clientKind: 'TuninhoAiClient' };
  }

  // origin === 'mural-a4tunados' (default)
  const envFile = join(ENV_DIR_MURAL, `.env.mural.${envName}`);
  const config = parseEnvFile(envFile);
  if (!config) {
    console.error(`[tuninho-mural] Missing env file: ${envFile}`);
    console.error(`                create it with MURAL_API_URL and MURAL_TUNINHO_TOKEN`);
    process.exit(1);
  }

  const { MURAL_API_URL, MURAL_TUNINHO_TOKEN } = config;
  if (!MURAL_API_URL || !MURAL_TUNINHO_TOKEN) {
    console.error(`[tuninho-mural] ${envFile} missing MURAL_API_URL or MURAL_TUNINHO_TOKEN`);
    process.exit(1);
  }

  // Tentar services/mural-api-client (Op 23), fallback para PlankaClient (extraido em v0.7.0)
  let client;
  let clientKind = 'services/mural-api-client';
  try {
    const mod = await import(MURAL_API_CLIENT_PATH);
    const MuralApiClient = mod.MuralApiClient || mod.default;
    if (!MuralApiClient) throw new Error('services/mural-api-client: export MuralApiClient ausente');
    client = new MuralApiClient({ baseUrl: MURAL_API_URL, token: MURAL_TUNINHO_TOKEN });
  } catch {
    clientKind = 'PlankaClient (clients/planka-client.js)';
    client = new PlankaClient({ baseUrl: MURAL_API_URL, token: MURAL_TUNINHO_TOKEN });
  }

  return { client, config, envName, origin, clientKind };
}

// ---------------------------------------------------------------------------
// Retry queue em session-tracker.json (leve — nao bloqueante)
// ---------------------------------------------------------------------------

function enqueuePendingExport(entry) {
  try {
    const dir = dirname(SESSION_TRACKER_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    let tracker = {};
    if (existsSync(SESSION_TRACKER_PATH)) {
      try {
        tracker = JSON.parse(readFileSync(SESSION_TRACKER_PATH, 'utf-8'));
      } catch {
        tracker = {};
      }
    }
    const list = Array.isArray(tracker.card_mural_export_pending)
      ? tracker.card_mural_export_pending
      : [];
    list.push(entry);
    tracker.card_mural_export_pending = list;
    writeFileSync(SESSION_TRACKER_PATH, JSON.stringify(tracker, null, 2));
  } catch (err) {
    console.error(`[tuninho-mural] Warning: nao consegui gravar retry queue: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers de card-result
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// redactSecrets — helper v0.3.0 (Op 05 GAP-OP05-004)
// Escaneia `text` por 13 padroes de secret conhecidos e retorna:
//   { matches: [{pattern, preview}], safe: bool }
// preview = primeiros 12 chars + '***' + length (nao expoe o secret).
// ---------------------------------------------------------------------------
const SECRET_PATTERNS = [
  { name: 'OpenRouter', re: /sk-or-v1-[a-zA-Z0-9_-]{32,}/g },
  { name: 'Anthropic API', re: /sk-ant-api03-[a-zA-Z0-9_-]{90,}/g },
  { name: 'OpenAI/generic sk-', re: /sk-[a-zA-Z0-9]{40,}/g },
  { name: 'Google/Firebase API', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Google OAuth token', re: /ya29\.[0-9A-Za-z_-]{20,}/g },
  { name: 'GitHub PAT', re: /ghp_[0-9A-Za-z]{36,}/g },
  { name: 'GitHub OAuth', re: /gho_[0-9A-Za-z]{36,}/g },
  { name: 'Slack bot', re: /xoxb-[0-9]{10,}-[0-9]{10,}-[0-9a-zA-Z]{24,}/g },
  { name: 'Slack user', re: /xoxp-[0-9]{10,}-[0-9]{10,}-[0-9]{10,}-[0-9a-f]{32,}/g },
  { name: 'JWT', re: /eyJ[a-zA-Z0-9_=-]+\.eyJ[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_.+/=-]+/g },
  { name: 'Private key PEM', re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PRIVATE )?PRIVATE KEY-----/g },
  { name: 'Airtable PAT', re: /pat-[0-9a-f]{32,}/g },
  { name: 'SendGrid', re: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g },
];

function redactSecrets(text) {
  const matches = [];
  for (const { name, re } of SECRET_PATTERNS) {
    const found = [...(text.matchAll(re) || [])];
    for (const m of found) {
      const s = m[0];
      matches.push({
        pattern: name,
        preview: `${s.slice(0, 12)}***(${s.length}chars)`,
      });
    }
  }
  return { matches, safe: matches.length === 0 };
}

function stripFrontmatter(content) {
  const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : content;
}

// ---------------------------------------------------------------------------
// resolveTopPositionForList — helper v0.11.0 (card 1767551614240949263 — 2026-05-04)
// Calcula a position que coloca o card no TOPO da lista destino.
// Planka: position ascendente (menor = topo).
//   - Lista vazia: 65536 (default razoavel)
//   - Lista com cards: min(positions)/2, com piso 1 (evita 0 ou negativo)
// Motivacao: ao mover de lista X para lista Y, queremos que o card movido
// seja o PRIMEIRO da lista Y, pra ficar evidente "qual foi o ultimo movimentado".
// Sem isso, novos cards iam pro fim (position default 65536) e operador
// precisava scrollar pra encontrar.
// Operador, 2026-05-04: "sempre que mover de uma coluna para outra o card
// precisa estar no topo da lista no ato da movimentacao"
// ---------------------------------------------------------------------------
function resolveTopPositionForList(boardResp, targetListId) {
  const cards = (boardResp?.included?.cards || []).filter(
    (c) => c && c.listId === targetListId,
  );
  if (cards.length === 0) return 65536;
  const positions = cards
    .map((c) => Number(c.position))
    .filter((n) => Number.isFinite(n));
  if (positions.length === 0) return 65536;
  const minPos = Math.min(...positions);
  return Math.max(1, Math.floor(minPos / 2));
}

function extractCardSection(content, cardId) {
  const re = new RegExp(`##\\s+\\[${cardId}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+\\[|$)`);
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

function buildComplianceTable(contractYaml) {
  // Parser YAML leve: pega cada obrigacao (id + status + result). Nao tenta
  // parse completo (evita dependencia de js-yaml). Faz match linha-a-linha.
  const obligations = [];
  let current = null;
  for (const rawLine of contractYaml.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const idMatch = line.match(/^\s*-\s+id:\s+["']?([A-Z0-9\-_]+)["']?\s*$/);
    if (idMatch) {
      if (current && current.id) obligations.push(current);
      current = { id: idMatch[1], status: null, result: null };
      continue;
    }
    if (current) {
      const statusMatch = line.match(/^\s+status:\s+["']?([A-Z_]+)["']?\s*$/);
      if (statusMatch) current.status = statusMatch[1];
      const resultMatch = line.match(/^\s+result:\s+["']?([A-Z_]+)["']?\s*$/);
      if (resultMatch && !current.result) current.result = resultMatch[1];
    }
  }
  if (current && current.id) obligations.push(current);

  const compliancePctMatch = contractYaml.match(/compliance_pct:\s+["']?([^"'\n]+)["']?/);
  const compliancePct = compliancePctMatch ? compliancePctMatch[1].trim() : 'n/a';

  if (!obligations.length) return { table: '', compliancePct };
  const rows = obligations.map(
    (o) => `| ${o.id} | ${o.status || 'n/a'} | ${o.result || '-'} |`,
  );
  return {
    table:
      '| Obrigacao | Status | Resultado |\n|-----------|--------|-----------|\n' +
      rows.join('\n'),
    compliancePct,
  };
}

async function assertRealUser(client, envName) {
  if (!client.users || !client.users.getMe) {
    // services/mural-api-client legado pode nao expor users.getMe;
    // usar request generico se disponivel, senao pular
    try {
      // MinimalMuralClient expoe via this.users.getMe; fallback se ausente
      const resp = await (client.users?.getMe?.() ||
        (client._request && client._request('GET', '/api/users/me')));
      if (!resp) return { ok: true, skipped: true };
      return _checkUserResp(resp, envName);
    } catch (err) {
      return { ok: true, skipped: true, warning: err.message };
    }
  }
  try {
    const resp = await client.users.getMe();
    return _checkUserResp(resp, envName);
  } catch (err) {
    return { ok: false, error: err.message, status: err.status };
  }
}

function _checkUserResp(resp, envName) {
  const it = resp?.item || {};
  const id = it.id ? String(it.id) : '';
  const isInternalVirtual = !id || id.toLowerCase().includes('internal');
  if (isInternalVirtual) {
    return {
      ok: false,
      isInternalVirtual: true,
      error:
        `Autenticacao resolveu User.INTERNAL virtual. O patch Op 23 do hook ` +
        `current-user/index.js esta ausente OU o user tuninho (1770000000000000001) ` +
        `nao esta seeded no DB. Ver L-REV-04-01 da Op 04 card-isolated-infra.`,
    };
  }
  return { ok: true, userId: id, username: it.username, role: it.role };
}

// ---------------------------------------------------------------------------
// Helpers — attachments (v0.10.0)
// ---------------------------------------------------------------------------

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  md: 'text/markdown',
  txt: 'text/plain',
  log: 'text/plain',
  json: 'application/json',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  zip: 'application/zip',
};

function mimeFromExt(filename) {
  const m = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (!m) return 'application/octet-stream';
  return MIME_BY_EXT[m[1].toLowerCase()] || 'application/octet-stream';
}

async function loadFileAsBlob(path) {
  const { readFileSync } = await import('node:fs');
  const { basename } = await import('node:path');
  const buffer = readFileSync(path);
  const filename = basename(path);
  const mimeType = mimeFromExt(filename);
  return { buffer, filename, mimeType };
}

async function listFilesByFilter(folder, filterRegex) {
  const { readdirSync } = await import('node:fs');
  const { join: pjoin } = await import('node:path');
  const entries = readdirSync(folder, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && filterRegex.test(e.name))
    .map((e) => pjoin(folder, e.name))
    .sort();
}

// pAll — concurrency-limited Promise.all (cap N simultaneous tasks)
async function pAll(tasks, limit = 3) {
  const results = new Array(tasks.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(null).map(async () => {
    while (cursor < tasks.length) {
      const i = cursor;
      cursor += 1;
      results[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

const modes = {
  async connect(args) {
    const { client, envName, clientKind } = await loadClient(args.env);
    const health = await client.healthCheck();
    console.log(`[tuninho-mural] Connected to ${client.baseUrl} (env: ${envName})`);
    console.log(`  - client: ${clientKind}`);
    console.log(`  - health: ${health.ok ? 'OK' : 'FAIL'}`);
    if (health.version) console.log(`  - planka: ${health.version}`);
    if (!health.ok) {
      console.log(`  - error: ${health.error}`);
      process.exit(1);
    }
  },

  async 'list-cards'(args) {
    if (!args.board) {
      console.error('Usage: list-cards --board <id> [--env dev|stage|prod]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const board = await client.boards.getBoard(args.board);
    const cards = board?.included?.cards || [];
    console.log(`[tuninho-mural] Board "${board?.item?.name}" has ${cards.length} cards`);
    cards.forEach((c) => {
      console.log(`  - ${c.id}  ${c.name || '(no name)'}`);
    });
    console.log('\nFull JSON:');
    console.log(JSON.stringify(board, null, 2));
  },

  async 'fetch-card'(args) {
    if (!args.card) {
      console.error('Usage: fetch-card --card <id> [--env dev|stage|prod]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const card = await client.cards.getCard(args.card);
    console.log(`[tuninho-mural] Card ${card?.item?.id}: ${card?.item?.name}`);
    console.log(`  description: ${(card?.item?.description || '').slice(0, 80)}...`);
    const included = card?.included || {};
    console.log(`  included keys: ${Object.keys(included).join(', ')}`);
    console.log(`  memberships: ${included.cardMemberships?.length || 0}`);
    console.log(`  labels: ${included.cardLabels?.length || 0}`);
    console.log(`  task lists: ${included.taskLists?.length || 0}`);
    console.log(`  attachments: ${included.attachments?.length || 0}`);
    console.log('\nFull JSON:');
    console.log(JSON.stringify(card, null, 2));
  },

  // Card 1762662734295467499 (v0.12.0): diagnostics do board claudeWorkspace
  // Usado para validar pre-flight do dispatcher (claude-sessions-service Card 467499)
  async 'get-board-workspace'(args) {
    if (!args.board) {
      console.error('Usage: get-board-workspace --board <id> [--origin mural-a4tunados] [--env dev|stage|prod]');
      process.exit(1);
    }
    const origin = args.origin || 'mural-a4tunados';
    if (origin !== 'mural-a4tunados') {
      console.error(`[tuninho-mural] get-board-workspace: only origin=mural-a4tunados supported (got: ${origin})`);
      process.exit(1);
    }
    const { client } = await loadClient(origin, args.env);
    if (!client.boards.getClaudeWorkspace) {
      console.error('[tuninho-mural] PlankaClient.boards.getClaudeWorkspace not available — bump skill to v0.12.0+');
      process.exit(1);
    }
    const result = await client.boards.getClaudeWorkspace(args.board);
    console.log(`[tuninho-mural] Board ${args.board} — claudeWorkspace:`);
    if (!result.workspace) {
      console.log('  (not configured — claudeWorkspace is null)');
    } else {
      console.log(`  - primary: ${result.primary || '(none)'}`);
      if (result.secondary && result.secondary.length > 0) {
        result.secondary.forEach((p, i) => {
          console.log(`  - secondary (${i + 1}): ${p}`);
        });
      }
    }
    console.log('\nFull JSON:');
    console.log(JSON.stringify({ boardId: args.board, ...result }, null, 2));
  },

  async 'create-card'(args) {
    if (!args.list || !args.name) {
      console.error(
        'Usage: create-card --list <id> --name "Title" [--description "md"] [--type project|story] [--env ...]',
      );
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const values = {
      name: args.name,
      type: args.type || 'project',
      position: Date.now(),
    };
    if (args.description) values.description = args.description;
    const result = await client.cards.createCard(args.list, values);
    console.log(`[tuninho-mural] Card created: ${result?.item?.id}`);
    console.log(JSON.stringify(result, null, 2));
  },

  async 'update-card'(args) {
    if (!args.card) {
      console.error(
        'Usage: update-card --card <id> [--name "..."] [--description "..."] [--state <state>] [--list <id>] [--position <n>] [--env ...]',
      );
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const values = {};
    if (args.name) values.name = args.name;
    if (args.description) values.description = args.description;
    if (args.state) values.state = args.state;
    if (args.list) {
      values.listId = args.list;
      // v0.11.0 — TOPO da lista destino quando operador nao passa --position explicito
      if (args.position !== undefined) {
        values.position = Number(args.position);
      } else {
        // Buscar boardResp pra resolver topo da lista destino
        try {
          const cardResp = await client.cards.getCard(args.card);
          const boardId = cardResp?.item?.boardId;
          if (boardId) {
            const boardResp = await client.boards.getBoard(boardId);
            values.position = resolveTopPositionForList(boardResp, args.list);
          } else {
            values.position = 65536;
          }
        } catch {
          values.position = 65536;
        }
      }
    }
    if (Object.keys(values).length === 0) {
      console.error('[tuninho-mural] No fields to update');
      process.exit(1);
    }
    const result = await client.cards.updateCard(args.card, values);
    console.log(`[tuninho-mural] Card ${args.card} updated`);
    console.log(JSON.stringify(result, null, 2));
  },

  async comment(args) {
    if (!args.card || !args.text) {
      console.error(
        'Usage: comment --card <id> --text "markdown" [--origin tuninho-ai|mural-a4tunados] [--redact-check] [--allow-secrets] [--env ...]',
      );
      process.exit(1);
    }
    // v0.3.1: redact-secrets pre-check (Regra #30 mural / GAP-OP05-004)
    const scan = redactSecrets(args.text);
    if (!scan.safe) {
      console.error(`\n⚠  [redact-secrets] ${scan.matches.length} padrao(oes) de secret detectado(s):`);
      for (const m of scan.matches) {
        console.error(`   - ${m.pattern}: ${m.preview}`);
      }
      if (args['redact-check']) {
        console.error('\n[redact-check] modo dry-run: NAO postou comment.');
        process.exit(2);
      }
      if (!args['allow-secrets']) {
        console.error('\nBloqueado por default. Opcoes:');
        console.error('  1. Editar texto removendo secrets');
        console.error('  2. Passar --allow-secrets se trade-off for aceito (ambiente restrito)');
        console.error('  3. Usar --redact-check pra dry-run');
        process.exit(2);
      }
      console.error('\n[allow-secrets] override aceito. Postando mesmo assim.\n');
    } else if (args['redact-check']) {
      console.log('[redact-check] OK: zero secrets detectados. (dry-run, nao postou)');
      return;
    }

    // v0.7.0 (Op 138): origin-aware. Flag explicita > heuristica cardId > default mural-a4tunados.
    const origin = args.origin || detectOriginByCardId(args.card) || 'mural-a4tunados';
    const { client, clientKind } = await loadClient(origin, args.env);
    console.log(`[tuninho-mural] origin=${origin} clientKind=${clientKind}`);
    const result = await client.comments.createComment(args.card, args.text, { origin: 'mural-cli' });
    console.log(`[tuninho-mural] Comment created: ${result?.item?.id || result?.commentId || '(no id returned)'}`);
    console.log(JSON.stringify(result, null, 2));
  },

  // ---------------------------------------------------------------------------
  // v0.3.1 — Novos modes consolidando aprendizados Op 05
  // ---------------------------------------------------------------------------

  async 'fetch-comments'(args) {
    if (!args.card) {
      console.error('Usage: fetch-comments --card <id> [--env dev|stage|prod]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const result = await client.comments.listComments(args.card);
    const items = result?.items || [];
    console.log(`[tuninho-mural] Card ${args.card} tem ${items.length} comments`);
    for (const c of items) {
      const preview = (c.text || '').replace(/\n/g, ' ').slice(0, 80);
      console.log(`  - [${c.createdAt}] ${c.id}: ${preview}${c.text.length > 80 ? '...' : ''}`);
    }
    console.log('\nFull JSON:');
    console.log(JSON.stringify(result, null, 2));
  },

  async 'create-list'(args) {
    if (!args.board || !args.name) {
      console.error(
        'Usage: create-list --board <id> --name "Title" [--type active|archive|trash] [--position <n>] [--env ...]',
      );
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const values = {
      name: args.name,
      type: args.type || 'active',
      position: Number(args.position) || Date.now() & 0xfffff,
    };
    const result = await client.lists.createList(args.board, values);
    console.log(`[tuninho-mural] List created: ${result?.item?.id} — "${result?.item?.name}"`);
    console.log(JSON.stringify(result, null, 2));
  },

  async 'setup-card'(args) {
    if (!args.list || !args.name) {
      console.error(
        'Usage: setup-card --list <id> --name "Title" [--description "md"] ' +
          '[--operator-user-id <id>] [--tuninho-user-id <id>] [--board <id>] [--env ...]\n' +
          '  Fluxo atomico (3 acoes):\n' +
          '    1. create-card\n' +
          '    2. add operador como membro do card (se --operator-user-id)\n' +
          '    3. ensure tuninho como membro do board (se --tuninho-user-id + --board)\n' +
          '  Motivado por GAP-OP05-002 (autocomplete @tuninho nao funcionava).',
      );
      process.exit(1);
    }
    const { client } = await loadClient(args.env);

    // (1) Create card
    const cardValues = {
      name: args.name,
      type: args.type || 'project',
      position: Date.now(),
    };
    if (args.description) cardValues.description = args.description;
    const created = await client.cards.createCard(args.list, cardValues);
    const cardId = created?.item?.id;
    console.log(`[setup-card] 1/3 card criado: ${cardId}`);

    // (2) Add operador como membro do card
    if (args['operator-user-id']) {
      try {
        await client.cardMemberships.create(cardId, args['operator-user-id']);
        console.log(`[setup-card] 2/3 operador ${args['operator-user-id']} adicionado ao card`);
      } catch (err) {
        console.warn(`[setup-card] 2/3 WARN add operador: ${err.message} (status=${err.status})`);
      }
    } else {
      console.log('[setup-card] 2/3 SKIP: --operator-user-id nao passado');
    }

    // (3) Ensure tuninho membership no board
    if (args['tuninho-user-id'] && args.board) {
      try {
        const memberships = await client.boards.getMemberships(args.board);
        const items = memberships?.items || memberships || [];
        const already = items.some((m) => String(m.userId) === String(args['tuninho-user-id']));
        if (already) {
          console.log(`[setup-card] 3/3 tuninho ja membro do board ${args.board}`);
        } else {
          await client.boards.createMembership(args.board, args['tuninho-user-id'], 'editor');
          console.log(`[setup-card] 3/3 tuninho ${args['tuninho-user-id']} adicionado ao board ${args.board}`);
        }
      } catch (err) {
        console.warn(`[setup-card] 3/3 WARN ensure board membership: ${err.message} (status=${err.status})`);
      }
    } else {
      console.log('[setup-card] 3/3 SKIP: --tuninho-user-id ou --board nao passados');
    }

    console.log(`\n[tuninho-mural] setup-card COMPLETO. cardId=${cardId}`);
    console.log(JSON.stringify(created, null, 2));
  },

  async 'comment-correction'(args) {
    if (!args.card || !args['original-comment-id'] || !args.text) {
      console.error(
        'Usage: comment-correction --card <id> --original-comment-id <id> ' +
          '--text "o que corrige" [--reason "motivo"] [--env ...]\n' +
          '  Adiciona comment com prefix de errata apontando pro comment anterior.\n' +
          '  Planka nao tem threading nativo — padrao "errata por referencia".\n' +
          '  Pattern Op 05 (autonomous-report mentiu, precisou correcao pos-operador).',
      );
      process.exit(1);
    }
    const prefix = `⚠ **ERRATA de comment ${args['original-comment-id']}**`;
    const reason = args.reason ? `\n\n**Motivo**: ${args.reason}` : '';
    const body = `${prefix}${reason}\n\n---\n\n${args.text}`;

    // redact-secrets tambem aqui
    const scan = redactSecrets(body);
    if (!scan.safe && !args['allow-secrets']) {
      console.error(`⚠ [redact-secrets] secret detectado no corpo da errata. Use --allow-secrets pra override.`);
      process.exit(2);
    }

    const { client } = await loadClient(args.env);
    const result = await client.comments.createComment(args.card, body);
    console.log(`[tuninho-mural] Errata comment criado: ${result?.item?.id} -> corrige ${args['original-comment-id']}`);
    console.log(JSON.stringify(result, null, 2));
  },

  async 'export-result'(args) {
    if (!args.card || !args.results) {
      console.error('Usage: export-result --card <id> --results <path> [--env ...]');
      process.exit(1);
    }
    if (!existsSync(args.results)) {
      console.error(`[tuninho-mural] Results file not found: ${args.results}`);
      process.exit(1);
    }
    const content = readFileSync(args.results, 'utf-8');
    const extracted = extractCardSection(content, args.card);
    const text = extracted || content;
    if (extracted) {
      console.log(`[tuninho-mural] Extracted section for card ${args.card} (${text.length} chars)`);
    }
    const { client } = await loadClient(args.env);
    const result = await client.comments.createComment(args.card, text);
    console.log(`[tuninho-mural] Result exported as comment: ${result?.item?.id}`);
  },

  async sync() {
    console.log(`[tuninho-mural] sync mode not fully implemented in v0.2.1 — use list-cards + manual diff`);
  },

  // ---------------------------------------------------------------------------
  // card-result (v0.2.1) — fluxo card-isolated completo
  // ---------------------------------------------------------------------------

  async 'card-result'(args) {
    if (!args.card || !args.results) {
      console.error(
        'Usage: card-result --card <id> --results <path> [--pr-url <url>] [--contract-path <path>]\n' +
          '       [--mark-validating] (DEFAULT em fluxo card-isolated; cria lista "Validando" se nao existir)\n' +
          '       [--mark-done] (apenas apos validacao humana — use card-validated mode pra fechar ciclo)\n' +
          '       [--target-list <name>] (opcional, override da lista alvo, default "Validando")\n' +
          '       [--done-list <id>] (legado, equivalente a --mark-done; preserva compat)\n' +
          '       [--dry-run] [--env ...]',
      );
      process.exit(1);
    }
    if (!existsSync(args.results)) {
      console.error(`[tuninho-mural] Results file not found: ${args.results}`);
      process.exit(1);
    }
    const dryRun = !!args['dry-run'];
    // v0.5.0: card-isolated agora termina em "Validando" (validacao humana
    // pendente) por padrao. --mark-done legado preservado para compat retroativa
    // mas e desencorajado em fluxo card-isolated; use card-validated apos
    // operador validar. --mark-validating e o default novo, --target-list permite
    // override (ex: "Em Review", "QA").
    const markDoneLegacy = !!args['mark-done'];
    const markValidating = !!args['mark-validating'] || (!markDoneLegacy && !args['target-list']);
    const targetListName = args['target-list']
      ? String(args['target-list'])
      : markDoneLegacy
        ? 'Done'
        : 'Validando';
    // v0.7.0 (Op 138): origin guard. card-result e Planka-only por enquanto
    // (depende de cards.getCard, lists.*, cardMemberships). tuninho-ai
    // destination so suporta `comment` mode em v0.7.0.
    const origin = args.origin || detectOriginByCardId(args.card) || 'mural-a4tunados';
    if (origin === 'tuninho-ai') {
      console.error('[tuninho-mural] card-result mode NAO suporta destino tuninho-ai em v0.7.0.');
      console.error('                Para postar resultado em card do board Dev tuninho.ai, use:');
      console.error('                  node mural-cli.js comment --card <chatId> --origin tuninho-ai --text "..."');
      console.error('                + mover card manualmente via dev.tuninho.ai/app');
      process.exit(1);
    }
    const { client, config, envName, clientKind } = await loadClient(origin, args.env);

    console.log(`[tuninho-mural] card-result (env=${envName}, origin=${origin}, client=${clientKind}${dryRun ? ', DRY-RUN' : ''})`);

    // Etapa 1 — healthCheck
    const health = await client.healthCheck();
    if (!health.ok) {
      console.error(`[tuninho-mural] healthCheck FAIL: ${health.error || 'unknown'}`);
      enqueuePendingExport({
        queued_at: new Date().toISOString(),
        card: args.card,
        env: envName,
        results: args.results,
        pr_url: args['pr-url'] || null,
        contract_path: args['contract-path'] || null,
        error: `healthCheck: ${health.error}`,
      });
      console.error(`  queued in ${SESSION_TRACKER_PATH}.card_mural_export_pending[]`);
      process.exit(2);
    }
    console.log(`  ✓ healthCheck OK (Planka ${health.version || 'n/a'})`);

    // Etapa 2 — assertRealUser (evita post como INTERNAL virtual silenciosamente)
    const userCheck = await assertRealUser(client, envName);
    if (userCheck.skipped) {
      console.log(`  ~ users.getMe nao disponivel (client antigo) — pulando check`);
    } else if (!userCheck.ok) {
      console.error(`[tuninho-mural] assertRealUser FAIL: ${userCheck.error}`);
      if (userCheck.isInternalVirtual && (envName === 'prod' || envName === 'stage')) {
        console.error(`  Remediacao: ver SKILL.md secao "Pre-flight prod" + L-REV-04-01.`);
        console.error(`  Bloqueio critico em prod/stage. Abortando.`);
        process.exit(3);
      }
      console.error(`  Continuando com aviso (env=${envName}, nao-prod).`);
    } else {
      console.log(`  ✓ autenticado como ${userCheck.username || userCheck.userId} (role=${userCheck.role})`);
    }

    // Etapa 3 — getCard (valida acesso + colhe boardId/listId)
    let card;
    try {
      const resp = await client.cards.getCard(args.card);
      card = resp?.item;
      if (!card) throw new Error('Empty card response');
    } catch (err) {
      console.error(`[tuninho-mural] getCard FAIL (status=${err.status}): ${err.message}`);
      if (err.status === 404 && (envName === 'prod' || envName === 'stage')) {
        console.error(`  Causa provavel: tuninho bot sem board_membership na board do card.`);
        console.error(`  Remediacao automatizada: pendente em v0.3.0 (ensure-board-membership).`);
        console.error(`  Manual: ver SKILL.md secao "Pre-flight prod > ensure-board-membership".`);
      }
      process.exit(4);
    }
    console.log(`  ✓ card "${card.name}" encontrado (boardId=${card.boardId}, listId=${card.listId})`);

    // Etapa 4 — montar comentario
    const resultsRaw = readFileSync(args.results, 'utf-8');
    const sectionSpecific = extractCardSection(resultsRaw, args.card);
    const body = sectionSpecific || stripFrontmatter(resultsRaw);

    const headerTitle = markValidating
      ? `# Entrega tecnica — aguardando validacao — ${card.name}`
      : `# Entrega — ${card.name}`;
    const headerLines = [headerTitle, ''];
    if (args['pr-url']) headerLines.push(`**PR**: ${args['pr-url']}`);
    headerLines.push(`**Fluxo**: card-isolated (tuninho-mural v0.5.0 card-result, env=${envName})`);
    if (markValidating) {
      headerLines.push(`**Estado**: \`${targetListName}\` — validacao humana pendente`);
      headerLines.push(`**Como validar**: testa o que foi entregue, comenta aqui ajustes pedidos ou um "validado" final.`);
    }
    headerLines.push('');
    headerLines.push('---');
    headerLines.push('');
    headerLines.push('## Resultado');
    headerLines.push('');
    const header = headerLines.join('\n');

    let complianceSection = '';
    if (args['contract-path'] && existsSync(args['contract-path'])) {
      const contractYaml = readFileSync(args['contract-path'], 'utf-8');
      const { table, compliancePct } = buildComplianceTable(contractYaml);
      if (table) {
        complianceSection = `\n\n---\n\n## Compliance Contract\n\n${table}\n\n**compliance_pct**: ${compliancePct}\n`;
      }
    }

    const footer = `\n\n_Entregue via tuninho-mural v0.2.1 — card-result mode_`;
    const comment = `${header}${body}${complianceSection}${footer}`;

    if (dryRun) {
      console.log('---- DRY-RUN preview (comment body, first 2000 chars) ----');
      console.log(comment.length > 2000 ? comment.slice(0, 2000) + '\n...[truncated]' : comment);
      console.log(`---- end preview (${comment.length} chars total) ----`);
      console.log(`  would POST /api/cards/${args.card}/comments`);
      if (markDone) {
        console.log(`  would resolve "done" list on board ${card.boardId} and PATCH card listId`);
      }
      console.log(`[tuninho-mural] ✅ dry-run OK`);
      return;
    }

    // Etapa 5 — POST comment
    let commentId = null;
    try {
      const resp = await client.comments.createComment(args.card, comment);
      commentId = resp?.item?.id;
      console.log(`  ✓ comment posted (id=${commentId})`);
    } catch (err) {
      console.error(`[tuninho-mural] createComment FAIL: ${err.message} (status=${err.status})`);
      enqueuePendingExport({
        queued_at: new Date().toISOString(),
        card: args.card,
        env: envName,
        stage: 'createComment',
        error: err.message,
      });
      process.exit(5);
    }

    // Etapa 6 — resolver lista alvo (default: "Validando" em fluxo card-isolated;
    // legacy: "Done" se --mark-done passado). v0.5.0: auto-cria a lista alvo
    // se nao existe na board (tipico em primeira operacao card-isolated num
    // projeto novo do mural — operador nao precisa criar manualmente).
    let movedTo = null;
    let movedToListName = null;
    let listCreated = false;
    if (markValidating || markDoneLegacy || args['target-list'] || args['done-list']) {
      let targetListId = args['done-list']; // legacy alias
      // BUGFIX 2026-05-06 (Card 1768281088850920655 pos-mortem): boardResp em outer scope
      // pra estar disponivel no `if (targetListId)` block subsequente que faz move
      let boardResp = null;
      if (!targetListId) {
        try {
          boardResp = await client.boards.getBoard(card.boardId);
          const lists =
            boardResp?.included?.lists ||
            boardResp?.item?.lists ||
            [];
          const wanted = String(targetListName).toLowerCase();
          const target = lists.find(
            (l) =>
              l &&
              typeof l.name === 'string' &&
              l.name.toLowerCase() === wanted,
          );
          if (target) {
            targetListId = target.id;
          } else {
            // Auto-criar a lista (somente em fluxo "Validando" — para Done
            // exigimos lista existente para nao virar dump-ground em boards
            // que ainda nao tem o conceito).
            const isValidatingFlow = wanted === 'validando' || wanted === 'em validacao' || wanted === 'em validação' || wanted === 'validation' || wanted === 'review';
            if (isValidatingFlow) {
              try {
                const createResp = await client.lists.createList(card.boardId, {
                  name: targetListName,
                  type: 'active',
                  position: Date.now() & 0xfffff,
                });
                targetListId = createResp?.item?.id;
                listCreated = !!targetListId;
                if (listCreated) {
                  console.log(`  ✓ lista "${targetListName}" auto-criada (id=${targetListId}) — primeira vez nesta board`);
                }
              } catch (createErr) {
                console.error(
                  `[tuninho-mural] Warning: nao consegui auto-criar lista "${targetListName}": ${createErr.message}. ` +
                    `Comentario postado mas card nao foi movido.`,
                );
              }
            } else {
              console.error(
                `[tuninho-mural] Warning: lista "${targetListName}" nao encontrada na board ${card.boardId}. ` +
                  `Auto-criacao desabilitada para esta lista (so "Validando" e auto-criada). ` +
                  `Comentario postado mas card nao foi movido.`,
              );
              console.error(
                `  Listas disponiveis: ${lists.map((l) => l && l.name).filter(Boolean).join(', ') || 'nenhuma'}`,
              );
            }
          }
        } catch (err) {
          console.error(
            `[tuninho-mural] getBoard FAIL para resolver lista alvo: ${err.message}. ` +
              `Card nao foi movido.`,
          );
        }
      }
      if (targetListId) {
        // v0.11.0 — TOPO da lista destino quando operador nao passa --position explicito
        const movePosition = args.position !== undefined
          ? Number(args.position)
          : resolveTopPositionForList(boardResp, targetListId);
        try {
          await client.cards.updateCard(args.card, {
            listId: targetListId,
            position: movePosition,
          });
          movedTo = targetListId;
          movedToListName = targetListName;
          console.log(`  ✓ card movido para list ${targetListId} ("${targetListName}") position=${movePosition} (topo)`);
        } catch (err) {
          console.error(
            `[tuninho-mural] updateCard FAIL: ${err.message} (status=${err.status}). ` +
              `Comentario postado mas card nao foi movido — PASS_COM_RESSALVAS.`,
          );
        }
      }
    }

    // Saida JSON para consumo programatico (tuninho-ddce/fix-suporte)
    const cardUrl = `${config.MURAL_API_URL.replace(/\/$/, '')}/cards/${args.card}`;
    const out = {
      ok: true,
      cardId: args.card,
      cardName: card.name,
      cardUrl,
      commentId,
      boardId: card.boardId,
      listBefore: card.listId,
      listAfter: movedTo || card.listId,
      // v0.5.0: estado intencional do card apos card-result
      // - "validating" (default novo): aguarda validacao humana
      // - "done" (legado --mark-done): finalizado direto (desencorajado)
      // - null: comentario postado mas nao foi movido
      cardState: movedTo
        ? markDoneLegacy && targetListName === 'Done'
          ? 'done'
          : 'validating'
        : null,
      movedToListName,
      listCreated,
      // markedDone preservado para compat retroativa (consumidores antigos)
      markedDone: Boolean(movedTo) && movedTo === card.listId ? false : (markDoneLegacy && Boolean(movedTo)),
      markedValidating: markValidating && Boolean(movedTo),
      env: envName,
      ts: new Date().toISOString(),
    };
    console.log('---- result ----');
    console.log(JSON.stringify(out, null, 2));
    console.log(`[tuninho-mural] ✅ card-result OK: ${cardUrl}`);
  },

  // ---------------------------------------------------------------------------
  // card-validated (v0.5.0) — encerramento card-isolated apos validacao humana
  //
  // Quando rodar: depois que o operador validou em prod (sem mais ajustes a
  // pedir) e ja rodou tuninho-escriba + tuninho-da-comlurb. Move o card de
  // "Validando" (ou qualquer lista intermediaria) pra "Done" + posta um
  // comentario de fechamento curto referenciando o seal.
  //
  // Diferenca de card-result --mark-done: este modo pressupoe que tudo ja
  // foi documentado e selado; nao re-anexa results.md ou compliance table.
  // ---------------------------------------------------------------------------
  async 'card-validated'(args) {
    if (!args.card) {
      console.error(
        'Usage: card-validated --card <id> [--summary "1 linha"] [--escriba-ref <path>] [--seal-ref <path>] [--dry-run] [--env ...]',
      );
      process.exit(1);
    }
    const dryRun = !!args['dry-run'];
    // v0.7.0 (Op 138): origin guard. card-validated e Planka-only (depende de
    // cards.getCard + lists.* + move). tuninho-ai destination so suporta `comment`.
    const origin = args.origin || detectOriginByCardId(args.card) || 'mural-a4tunados';
    if (origin === 'tuninho-ai') {
      console.error('[tuninho-mural] card-validated mode NAO suporta destino tuninho-ai em v0.7.0.');
      console.error('                Para fechar ciclo de validacao em card do board Dev tuninho.ai, use:');
      console.error('                  node mural-cli.js comment --card <chatId> --origin tuninho-ai --text "✅ Validado"');
      console.error('                + mover card pra "Done" manualmente via dev.tuninho.ai/app');
      process.exit(1);
    }
    const { client, config, envName, clientKind } = await loadClient(origin, args.env);

    console.log(`[tuninho-mural] card-validated (env=${envName}, origin=${origin}, client=${clientKind}${dryRun ? ', DRY-RUN' : ''})`);

    const health = await client.healthCheck();
    if (!health.ok) {
      console.error(`[tuninho-mural] healthCheck FAIL: ${health.error || 'unknown'}`);
      process.exit(2);
    }
    console.log(`  ✓ healthCheck OK`);

    let card;
    try {
      const resp = await client.cards.getCard(args.card);
      card = resp?.item;
      if (!card) throw new Error('Empty card response');
    } catch (err) {
      console.error(`[tuninho-mural] getCard FAIL: ${err.message}`);
      process.exit(4);
    }
    console.log(`  ✓ card "${card.name}" encontrado`);

    // Resolver lista "Done"
    const boardResp = await client.boards.getBoard(card.boardId);
    const lists =
      boardResp?.included?.lists ||
      boardResp?.item?.lists ||
      [];
    const doneList = lists.find(
      (l) => l && typeof l.name === 'string' && l.name.toLowerCase() === 'done',
    );
    if (!doneList) {
      console.error(
        `[tuninho-mural] Lista "Done" nao encontrada. Listas disponiveis: ${lists.map((l) => l && l.name).filter(Boolean).join(', ') || 'nenhuma'}`,
      );
      console.error(`  Crie a lista "Done" manualmente ou use --target-list "<nome>" no card-result.`);
      process.exit(6);
    }

    // Comentario curto de fechamento
    const summary = args.summary ? String(args.summary) : 'Validacao concluida — sem mais ajustes pendentes.';
    const lines = [
      `# Validado e selado`,
      '',
      summary,
      '',
    ];
    if (args['escriba-ref']) lines.push(`**Escriba**: \`${args['escriba-ref']}\``);
    if (args['seal-ref']) lines.push(`**Seal Comlurb**: \`${args['seal-ref']}\``);
    lines.push('');
    lines.push('_Movido para Done via tuninho-mural v0.5.0 card-validated mode_');
    const comment = lines.join('\n');

    if (dryRun) {
      console.log('---- DRY-RUN preview ----');
      console.log(comment);
      console.log(`  would POST comment + move to list ${doneList.id} ("Done")`);
      return;
    }

    // POST comment + move pra Done
    let commentId = null;
    try {
      const resp = await client.comments.createComment(args.card, comment);
      commentId = resp?.item?.id;
      console.log(`  ✓ comment posted (id=${commentId})`);
    } catch (err) {
      console.error(`[tuninho-mural] createComment FAIL: ${err.message}`);
      process.exit(5);
    }

    // v0.11.0 — TOPO da lista "Done" quando operador nao passa --position explicito
    const donePosition = args.position !== undefined
      ? Number(args.position)
      : resolveTopPositionForList(boardResp, doneList.id);
    try {
      await client.cards.updateCard(args.card, {
        listId: doneList.id,
        position: donePosition,
      });
      console.log(`  ✓ card movido para "Done" (id=${doneList.id}) position=${donePosition} (topo)`);
    } catch (err) {
      console.error(
        `[tuninho-mural] updateCard FAIL: ${err.message}. Comentario postado mas card nao foi movido.`,
      );
      process.exit(7);
    }

    const cardUrl = `${config.MURAL_API_URL.replace(/\/$/, '')}/cards/${args.card}`;
    const out = {
      ok: true,
      cardId: args.card,
      cardName: card.name,
      cardUrl,
      commentId,
      cardState: 'done',
      listBefore: card.listId,
      listAfter: doneList.id,
      env: envName,
      ts: new Date().toISOString(),
    };
    console.log('---- result ----');
    console.log(JSON.stringify(out, null, 2));
    console.log(`[tuninho-mural] ✅ card-validated OK: ${cardUrl}`);
  },

  // Op 06 T3.7 — labels CRUD (v0.5.0)
  async 'list-labels'(args) {
    if (!args.board) throw new Error('--board <boardId> required');
    const { client } = await loadClient(args.env);
    const labels = await client.labels.listBoardLabels(args.board);
    console.log(JSON.stringify(labels, null, 2));
  },

  async 'add-label'(args) {
    if (!args.card) throw new Error('--card <cardId> required');
    if (!args.board) throw new Error('--board <boardId> required');
    if (!args.label) throw new Error('--label <name> required');
    const { client } = await loadClient(args.env);
    const labels = await client.labels.listBoardLabels(args.board);
    let existing = labels.find(l => l.name === args.label);
    if (!existing) {
      const created = await client.labels.createLabel(args.board, {
        name: args.label,
        color: args.color || 'red-burgundy',
      });
      existing = created?.item;
      console.log(`[tuninho-mural] label criado: ${existing.id}`);
    }
    try {
      const result = await client.labels.addToCard(args.card, existing.id);
      console.log(JSON.stringify({ ok: true, labelId: existing.id, result: result?.item || null }, null, 2));
    } catch (err) {
      if (err.status === 409) {
        console.log(JSON.stringify({ ok: true, labelId: existing.id, note: 'already on card' }, null, 2));
      } else { throw err; }
    }
  },

  async 'remove-label'(args) {
    if (!args.card) throw new Error('--card <cardId> required');
    if (!args.board) throw new Error('--board <boardId> required');
    if (!args.label) throw new Error('--label <name> required');
    const { client } = await loadClient(args.env);
    const labels = await client.labels.listBoardLabels(args.board);
    const existing = labels.find(l => l.name === args.label);
    if (!existing) {
      console.log(JSON.stringify({ ok: true, skipped: true, reason: 'label not found in board' }, null, 2));
      return;
    }
    try {
      await client.labels.removeFromCard(args.card, existing.id);
      console.log(JSON.stringify({ ok: true, labelId: existing.id, removed: true }, null, 2));
    } catch (err) {
      if (err.status === 404) {
        console.log(JSON.stringify({ ok: true, skipped: true, reason: 'not on card' }, null, 2));
      } else { throw err; }
    }
  },

  // ---------------------------------------------------------------------------
  // Attachments (v0.10.0 — card 1766766663711065657 "Trabalhar com anexos do mural")
  // ---------------------------------------------------------------------------

  // List + (optionally) download a card's attachments.
  // Usage: fetch-attachments --card <id> [--download-to <folder>] [--env dev|stage|prod]
  async 'fetch-attachments'(args) {
    if (!args.card) {
      console.error('Usage: fetch-attachments --card <id> [--download-to <folder>] [--env ...]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const list = await client.attachments.listAttachments(args.card);
    const items = list?.items || [];
    const summary = items.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      url: a.data?.url || null,
      sizeInBytes: a.data?.sizeInBytes || null,
      mimeType: a.data?.mimeType || null,
      createdAt: a.createdAt,
    }));
    console.log(JSON.stringify({ ok: true, count: items.length, items: summary }, null, 2));

    if (args['download-to'] && items.length > 0) {
      const { mkdirSync, writeFileSync } = await import('node:fs');
      const { join: pjoin } = await import('node:path');
      mkdirSync(args['download-to'], { recursive: true });
      let saved = 0;
      let failed = 0;
      for (const a of items) {
        if (a.type !== 'file') continue; // skip link attachments
        try {
          const buf = await client.attachments.downloadFile(a.id, a.name);
          const dest = pjoin(args['download-to'], `${a.id}_${a.name}`);
          writeFileSync(dest, Buffer.from(buf));
          saved += 1;
        } catch (err) {
          // Bearer-auth limitation upstream — log + continue
          failed += 1;
          console.error(`  [WARN] download failed for ${a.id} (${a.name}): ${err.message}`);
        }
      }
      console.log(`\n[fetch-attachments] downloaded ${saved}/${items.length} (${failed} failed). Folder: ${args['download-to']}`);
      if (failed > 0) {
        console.error('  Note: Planka /attachments/{id}/download endpoint requires session-bound token; Bearer may 401. Use data.url in browser instead.');
      }
    }
  },

  // Upload a single file as a card attachment + create a comment referencing it.
  // Usage: attach-evidence --card <id> --file <path> [--text <markdown>] [--env ...]
  async 'attach-evidence'(args) {
    if (!args.card || !args.file) {
      console.error('Usage: attach-evidence --card <id> --file <path> [--text <markdown>] [--env ...]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const { existsSync } = await import('node:fs');
    if (!existsSync(args.file)) {
      console.error(`File not found: ${args.file}`);
      process.exit(1);
    }
    const { buffer, filename, mimeType } = await loadFileAsBlob(args.file);
    const upload = await client.attachments.uploadFile(args.card, buffer, filename, mimeType);
    const attachId = upload?.item?.id;
    if (!attachId) {
      console.error('Upload failed: no id in response');
      process.exit(1);
    }
    const text = args.text
      ? `${args.text}\n\n_Anexo_: \`${filename}\` (id: ${attachId})`
      : `📎 Evidência: \`${filename}\` (id: ${attachId})`;
    const comment = await client.comments.createComment(args.card, text, [attachId]);
    console.log(JSON.stringify({
      ok: true,
      attachment_id: attachId,
      filename,
      comment_id: comment?.item?.id || null,
    }, null, 2));
  },

  // Batch-upload all evidence files from a folder + create one comment listing all.
  // Usage: card-evidence --card <id> --folder <path> [--text <markdown header>]
  //        [--filter <regex>] [--concurrency <n>] [--env ...]
  async 'card-evidence'(args) {
    if (!args.card || !args.folder) {
      console.error('Usage: card-evidence --card <id> --folder <path> [--text <md header>] [--filter <regex>] [--concurrency <n>] [--env ...]');
      process.exit(1);
    }
    const { client } = await loadClient(args.env);
    const { existsSync } = await import('node:fs');
    if (!existsSync(args.folder)) {
      console.error(`Folder not found: ${args.folder}`);
      process.exit(1);
    }
    const filterRegex = args.filter
      ? new RegExp(args.filter, 'i')
      : /\.(png|jpe?g|gif|webp|svg|pdf|md|txt|log|json|ya?ml)$/i;
    const concurrency = parseInt(args.concurrency || '3', 10) || 3;

    const files = await listFilesByFilter(args.folder, filterRegex);
    if (files.length === 0) {
      console.log(JSON.stringify({ ok: true, count: 0, message: 'No matching files in folder.' }, null, 2));
      return;
    }

    const tasks = files.map((path) => async () => {
      const { buffer, filename, mimeType } = await loadFileAsBlob(path);
      const up = await client.attachments.uploadFile(args.card, buffer, filename, mimeType);
      return { path, filename, attachment_id: up?.item?.id || null, mimeType };
    });

    const uploads = await pAll(tasks, concurrency);
    const ids = uploads.map((u) => u.attachment_id).filter(Boolean);

    const header = args.text || '## 📎 Evidências da operação';
    const lines = uploads.map((u) =>
      `- \`${u.filename}\` (mime: ${u.mimeType}) → \`attachment_id=${u.attachment_id}\``,
    );
    const md = `${header}\n\n${lines.join('\n')}`;

    const comment = await client.comments.createComment(args.card, md, ids);
    console.log(JSON.stringify({
      ok: true,
      count: ids.length,
      total_files: files.length,
      attachment_ids: ids,
      comment_id: comment?.item?.id || null,
      folder: args.folder,
    }, null, 2));
  },
};

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  const args = parseArgs(argv.slice(1));

  if (!mode || !modes[mode]) {
    console.log('tuninho-mural CLI v0.10.0');
    console.log('');
    console.log('Modes:');
    console.log('  connect              Test connection to mural');
    console.log('  list-cards           List cards of a board');
    console.log('  fetch-card           Get full card context (sem comments — use fetch-comments)');
    console.log('  fetch-comments       Get comments of a card (v0.3.1)');
    console.log('  create-card          Create a new card');
    console.log('  update-card          Update card fields');
    console.log('  setup-card           Create + add operador card + ensure tuninho board (atomic) (v0.3.1)');
    console.log('  create-list          Create new list in board (v0.3.1)');
    console.log('  comment              Add comment (com redact-secrets pre-check) (v0.3.1 endurecido)');
    console.log('  comment-correction   Add errata comment linkando ao anterior (v0.3.1)');
    console.log('  export-result        Export a results.md as a comment (simples)');
    console.log('  card-result          Fluxo card-isolated tecnico (default: move pra "Validando", auto-cria lista; --mark-done legado)');
    console.log('  card-validated       Encerra ciclo apos validacao humana (move pra "Done", comment de fechamento)');
    console.log('  sync                 Sync local cards with mural (partial)');
    console.log('  list-labels          List labels of a board (v0.5.0)');
    console.log('  add-label            Add label to card (cria se nao existe) (v0.5.0)');
    console.log('  remove-label         Remove label from card (v0.5.0)');
    console.log('  fetch-attachments    List card attachments (+ optional download) (v0.10.0)');
    console.log('  attach-evidence      Upload 1 file + comment with attachmentIds (v0.10.0)');
    console.log('  card-evidence        Batch upload folder + 1 markdown comment (v0.10.0)');
    console.log('');
    console.log('Global options: --env dev|stage|prod (default: dev)');
    console.log('Comment flags (v0.3.1): --redact-check (dry-run) | --allow-secrets (override)');
    process.exit(mode ? 1 : 0);
  }

  try {
    await modes[mode](args);
  } catch (err) {
    console.error(`[tuninho-mural] Error: ${err.message}`);
    if (err.status) console.error(`  status: ${err.status}`);
    if (err.body) console.error(`  body: ${JSON.stringify(err.body).slice(0, 300)}`);
    process.exit(1);
  }
}

main();
