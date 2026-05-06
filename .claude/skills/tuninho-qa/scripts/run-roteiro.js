#!/usr/bin/env node
/**
 * run-roteiro.js — Tuninho QA modo 7 (post-check)
 *
 * Le um roteiro YAML e gera instrucoes para o Claude Code executar via
 * MCP Playwright (mcp__playwright__*).
 *
 * Este script NAO executa o Playwright diretamente — ele gera o plano de
 * execucao que o Claude deve seguir. A execucao acontece via tool calls
 * do MCP Playwright pela conversa ativa.
 *
 * Uso:
 *   node run-roteiro.js \
 *     --roteiro /path/to/fase_06/qa/roteiros.yaml \
 *     --tarefa T6.1 \
 *     --output /path/to/fase_06/qa/relatorio-tarefa-T6.1.md
 */

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flags = {}
for (let i = 0; i < args.length; i += 2) {
  flags[args[i].replace(/^--/, '')] = args[i + 1]
}

if (!flags.roteiro) {
  console.error('Uso: node run-roteiro.js --roteiro PATH [--tarefa T{N}.{M}] [--output PATH]')
  process.exit(2)
}

const yamlText = fs.readFileSync(flags.roteiro, 'utf8')

// Parser YAML minimalista (so o suficiente para o nosso template)
function parseRoteiros(text) {
  const lines = text.split('\n')
  const result = { roteiros: [] }
  let current = null
  let context = null
  let arrayContext = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue

    const match = line.match(/^(\s*)(- )?([\w_]+):\s*(.*)$/)
    if (!match) {
      // Continuation of array item
      const m2 = line.match(/^(\s*)- (.+)$/)
      if (m2 && arrayContext) {
        arrayContext.push(m2[2].replace(/^["']|["']$/g, ''))
      }
      continue
    }

    const [, indent, dash, key, value] = match
    const depth = indent.length

    if (dash && key === 'tarefa') {
      current = { tarefa: value.replace(/^["']|["']$/g, '') }
      result.roteiros.push(current)
      context = current
      arrayContext = null
    } else if (current && depth >= 4) {
      if (!value && key) {
        // Object or array start
        current[key] = []
        arrayContext = current[key]
      } else if (value) {
        if (key === 'objetivo' || key === 'tarefa') {
          current[key] = value.replace(/^["']|["']$/g, '')
        } else {
          current[key] = value.replace(/^["']|["']$/g, '')
        }
      }
    }
  }

  return result
}

const parsed = parseRoteiros(yamlText)
const tarefaFilter = flags.tarefa
const roteiros = tarefaFilter
  ? parsed.roteiros.filter(r => r.tarefa === tarefaFilter)
  : parsed.roteiros

if (roteiros.length === 0) {
  console.error(`Nenhum roteiro encontrado${tarefaFilter ? ` para ${tarefaFilter}` : ''}`)
  process.exit(1)
}

// Gerar plano de execucao (markdown que o Claude vai seguir)
let plan = `# Plano de Execucao QA — ${roteiros.length} roteiro(s)\n\n`
plan += `Roteiro: ${flags.roteiro}\n`
plan += `Gerado em: ${new Date().toISOString()}\n\n`
plan += `## Instrucoes para o Claude\n\n`
plan += `Para cada roteiro abaixo:\n`
plan += `1. Verificar pre_condicoes (rodar comandos de check)\n`
plan += `2. Executar passos_playwright via mcp__playwright__browser_*\n`
plan += `3. Capturar screenshots em fase_NN/evidencias/\n`
plan += `4. Usar Read tool para abrir CADA screenshot e interpretar visualmente\n`
plan += `5. Validar criterios_sucesso (todos devem PASS)\n`
plan += `6. Validar criterios_bloqueio (todos devem ser AUSENTES)\n`
plan += `7. Comparar com interpretacao_esperada\n`
plan += `8. Marcar PASS ou FAIL no relatorio\n\n`
plan += `---\n\n`

for (const r of roteiros) {
  plan += `## Tarefa ${r.tarefa}\n\n`
  plan += `**Objetivo**: ${r.objetivo || '(nao especificado)'}\n\n`

  if (r.pre_condicoes && r.pre_condicoes.length > 0) {
    plan += `### Pre-condicoes\n`
    r.pre_condicoes.forEach(p => (plan += `- [ ] ${p}\n`))
    plan += '\n'
  }

  if (r.passos_playwright && r.passos_playwright.length > 0) {
    plan += `### Passos Playwright\n`
    r.passos_playwright.forEach((p, i) => (plan += `${i + 1}. ${p}\n`))
    plan += '\n'
  }

  if (r.criterios_sucesso && r.criterios_sucesso.length > 0) {
    plan += `### Criterios de sucesso (TODOS devem PASS)\n`
    r.criterios_sucesso.forEach(c => (plan += `- [ ] ${c}\n`))
    plan += '\n'
  }

  if (r.criterios_bloqueio && r.criterios_bloqueio.length > 0) {
    plan += `### Criterios de bloqueio (TODOS devem ser AUSENTES)\n`
    r.criterios_bloqueio.forEach(c => (plan += `- [ ] ${c}\n`))
    plan += '\n'
  }

  plan += `---\n\n`
}

if (flags.output) {
  fs.mkdirSync(path.dirname(flags.output), { recursive: true })
  fs.writeFileSync(flags.output, plan)
  console.log(`Plano salvo em: ${flags.output}`)
} else {
  console.log(plan)
}
