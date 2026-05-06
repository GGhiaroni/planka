# Templates de Isolamento

## Template: Isolation Report (terminal output)

```
╔══════════════════════════════════════════════════════════════╗
║          ISOLATION REPORT — {PROJETO}                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Recurso          │ Producao        │ Desenvolvimento        ║
║  ─────────────────┼─────────────────┼───────────────────     ║
║  Porta HTTP       │ {prod_port}     │ {dev_port}             ║
║  tmux prefix      │ {prod_prefix}   │ {dev_prefix}           ║
║  CDP ports        │ {prod_cdp}+     │ {dev_cdp}+             ║
║  Database         │ {prod_db}       │ {dev_db}               ║
║  PM2 service      │ {pm2_name}      │ N/A                    ║
║  Domain           │ {domain}        │ localhost               ║
║  Startup          │ {pm2_config}    │ {dev_script}            ║
║                                                              ║
║  ⚠ RISCOS DE ESTADO COMPARTILHADO:                          ║
║  {risks_list}                                                ║
║                                                              ║
║  ✓ STARTUP DEV: bash {dev_script}                            ║
║  ✗ NUNCA: node server.js (usa defaults de prod)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Template: Cross-Project Conflict Alert

```
⚠ CONFLITO DETECTADO ⚠

Porta {port} em uso por DOIS servicos:
  - {servico_1} ({projeto_1})
  - {servico_2} ({projeto_2})

Sugestao: Alterar {servico_2} para porta {next_available}
Comando: Editar ecosystem.config.cjs e atualizar env PORT
```

## Template: Hook Context Injection (one-liner)

```
ENV: {project} prod:{prod_port} dev:{dev_port} tmux:{dev_prefix} | bash dev.sh para dev
```

## Template: Bootstrap Needed Injection

```
tuninho-devops-env: Catalogo de ambiente NAO encontrado para {project}.
Use /tuninho-devops-env para executar scan completo e catalogar o ambiente.
```

## Template: Stale Catalog Injection

```
tuninho-devops-env: Catalogo de {project} desatualizado ({days}d).
Ultimo scan: {last_scan}. Use /tuninho-devops-env para atualizar.
```
