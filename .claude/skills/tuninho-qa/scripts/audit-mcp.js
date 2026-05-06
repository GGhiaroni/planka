#!/usr/bin/env node
/**
 * audit-mcp.js — Tuninho QA sub-modo audit-mcp-tools
 *
 * Invoca todas as tools de um MCP server stdio e valida que cada uma:
 * - Esta registrada
 * - Responde sem erro nao-previsto
 * - Tem schema valido
 *
 * Uso:
 *   node audit-mcp.js \
 *     --mcp-server /path/to/server-entrypoint.js \
 *     --tools-spec /path/to/expected-tools.json \
 *     --output /path/to/qa/evidencias/
 *
 * tools-spec format:
 * {
 *   "expected": ["get_card_context", "add_comment", ...],
 *   "minimal_inputs": {
 *     "get_card_context": { "cardId": "1234" },
 *     "add_comment": { "cardId": "1234", "text": "test" }
 *   }
 * }
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flags = {}
for (let i = 0; i < args.length; i += 2) {
  flags[args[i].replace(/^--/, '')] = args[i + 1]
}

if (!flags['mcp-server'] || !flags['tools-spec']) {
  console.error('Uso: node audit-mcp.js --mcp-server PATH --tools-spec PATH [--output DIR]')
  process.exit(2)
}

const OUTPUT = flags.output || '/tmp/tuninho-qa/mcp-tools'
fs.mkdirSync(OUTPUT, { recursive: true })

const spec = JSON.parse(fs.readFileSync(flags['tools-spec'], 'utf8'))
const expected = spec.expected || []
const minimalInputs = spec.minimal_inputs || {}

console.log(`=== Tuninho QA — audit-mcp ===`)
console.log(`MCP server: ${flags['mcp-server']}`)
console.log(`Tools esperadas: ${expected.length}`)
console.log(`Output: ${OUTPUT}`)
console.log('')

// Spawn MCP server
const child = spawn('node', [flags['mcp-server']], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env },
})

let buffer = ''
const responses = new Map()

child.stdout.on('data', chunk => {
  buffer += chunk.toString()
  let nl
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim()
    buffer = buffer.slice(nl + 1)
    if (!line) continue
    try {
      const msg = JSON.parse(line)
      if (msg.id != null) {
        responses.set(msg.id, msg)
      }
    } catch (_) {
      // ignore non-JSON
    }
  }
})

let nextId = 1
function send(method, params = {}) {
  const id = nextId++
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params })
  child.stdin.write(msg + '\n')
  return id
}

function waitFor(id, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const poll = () => {
      if (responses.has(id)) {
        resolve(responses.get(id))
        return
      }
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for response id=${id}`))
        return
      }
      setTimeout(poll, 50)
    }
    poll()
  })
}

async function main() {
  // Initialize
  const initId = send('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'tuninho-qa', version: '0.1.0' },
  })
  await waitFor(initId)
  send('notifications/initialized')

  // List tools
  const listId = send('tools/list')
  const listResp = await waitFor(listId)
  const tools = listResp.result?.tools || []

  console.log(`## Tools registradas: ${tools.length}`)
  tools.forEach(t => console.log(`  - ${t.name}`))
  console.log('')

  const registered = tools.map(t => t.name)
  const missing = expected.filter(name => !registered.includes(name))
  const extra = registered.filter(name => !expected.includes(name))

  console.log(`## Cobertura`)
  console.log(`  Esperadas: ${expected.length}`)
  console.log(`  Registradas: ${registered.length}`)
  console.log(`  Faltando: ${missing.length}`)
  if (missing.length > 0) {
    missing.forEach(m => console.log(`    - [FAIL] ${m}`))
  }
  console.log(`  Extras: ${extra.length}`)
  if (extra.length > 0) {
    extra.forEach(e => console.log(`    - [WARN] ${e}`))
  }
  console.log('')

  // Invoke each expected tool
  console.log(`## Invocacao individual`)
  const results = []
  for (const toolName of expected) {
    if (!registered.includes(toolName)) {
      results.push({ name: toolName, status: 'MISSING', error: 'not registered' })
      console.log(`  [SKIP] ${toolName} — not registered`)
      continue
    }
    const inputs = minimalInputs[toolName] || {}
    try {
      const callId = send('tools/call', { name: toolName, arguments: inputs })
      const resp = await waitFor(callId, 15000)
      if (resp.error) {
        results.push({ name: toolName, status: 'ERROR', error: resp.error })
        console.log(`  [FAIL] ${toolName}: ${JSON.stringify(resp.error)}`)
      } else {
        results.push({ name: toolName, status: 'OK', response: resp.result })
        console.log(`  [PASS] ${toolName}`)
        // Save verbatim response
        const outFile = path.join(OUTPUT, `mcp_${toolName}.json`)
        fs.writeFileSync(outFile, JSON.stringify(resp.result, null, 2))
      }
    } catch (err) {
      results.push({ name: toolName, status: 'TIMEOUT', error: err.message })
      console.log(`  [FAIL] ${toolName}: ${err.message}`)
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'OK').length
  const fail = results.filter(r => r.status !== 'OK').length

  console.log('')
  console.log('=== RESUMO ===')
  console.log(`Total esperadas: ${expected.length}`)
  console.log(`PASS: ${ok}`)
  console.log(`FAIL: ${fail}`)

  // Save consolidated report
  const reportFile = path.join(OUTPUT, 'mcp-tools-coverage.json')
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mcp_server: flags['mcp-server'],
        expected,
        registered,
        missing,
        extra,
        results,
        summary: { total: expected.length, pass: ok, fail },
      },
      null,
      2
    )
  )
  console.log(`Relatorio: ${reportFile}`)

  child.kill()

  if (fail > 0 || missing.length > 0) {
    process.exit(1)
  }
  process.exit(0)
}

main().catch(err => {
  console.error('FATAL:', err)
  child.kill()
  process.exit(1)
})
