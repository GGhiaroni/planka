#!/usr/bin/env node
/**
 * card-question.js — tuninho-mural v0.6.0+
 *
 * Posta uma entrevista em lote (1-4 perguntas, 2-4 opções cada) num card
 * mural Planka. Pattern user-friendly que substitui "1 pergunta async por
 * comentário" da era pré-Op 07.
 *
 * Uso:
 *   node card-question.js --card <id> --questions <path-json>
 *
 * Schema do JSON:
 *   {
 *     "card_id": "1759969264564962580",
 *     "auto_close_after_hours": 4,
 *     "questions": [
 *       {
 *         "header": "Profundidade",
 *         "question": "Qual a meta de profundidade?",
 *         "options": [
 *           {"label": "Paridade total", "description": "...", "recommended": true},
 *           {"label": "Tiers por escopo", "description": "..."}
 *         ]
 *       }
 *     ]
 *   }
 */

const fs = require('fs');
const path = require('path');

function buildComment(spec) {
  const lines = [];
  lines.push(`🎯 Tuninho — preciso de ${spec.questions.length} decisão(ões):`);
  lines.push('');

  spec.questions.forEach((q, i) => {
    const num = i + 1;
    lines.push(`**P${num} — ${q.header}:** ${q.question}`);
    lines.push('');
    q.options.forEach((opt, j) => {
      const letter = String.fromCharCode(97 + j); // a, b, c, d
      const tag = opt.recommended ? ' [Recommended]' : '';
      lines.push(`${letter}) **${opt.label}** — ${opt.description}${tag}`);
    });
    lines.push('');
  });

  lines.push('---');
  lines.push('Responda no comentário com formato: `P1: a, P2: b, P3: c`');
  lines.push('(ou texto livre se nenhuma opção se encaixa — será classificada como "Other")');

  if (spec.auto_close_after_hours) {
    lines.push('');
    lines.push(`_Auto-resposta após ${spec.auto_close_after_hours}h se nenhuma resposta. Agente postará escolha + racional._`);
  }

  return lines.join('\n');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--card') opts.card_id = args[++i];
    else if (args[i] === '--questions') opts.questions_path = args[++i];
    else if (args[i] === '--dry-run') opts.dry_run = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  if (!opts.questions_path) {
    console.error('FAIL: --questions <path> obrigatório');
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(opts.questions_path, 'utf-8'));
  if (opts.card_id) spec.card_id = opts.card_id;

  const comment = buildComment(spec);

  if (opts.dry_run) {
    console.log('=== DRY-RUN — comment seria postado ===');
    console.log(comment);
    return;
  }

  // Real post via mural-cli
  const muralCli = path.join(__dirname, 'mural-cli.js');
  const { execSync } = require('child_process');
  try {
    execSync(`node ${muralCli} comment-add --card ${spec.card_id} --body ${JSON.stringify(comment)}`,
             { stdio: 'inherit' });
    console.log(`✓ Comment posted no card ${spec.card_id}`);
  } catch (e) {
    console.error('FAIL: erro ao postar via mural-cli:', e.message);
    process.exit(1);
  }
}

main();
