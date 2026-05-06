# Dev-Bypass Auth Template (v3.4.2)

> **Quando usar**: projeto em prod controlado com auth real (Firebase, Auth0, Clerk,
> NextAuth) onde o agente precisa validar fluxos pos-login via Playwright sem ter
> credenciais OAuth reais.

> **Quando NAO usar**: projetos publicos sem auth, projetos em prod compartilhada
> com usuarios reais ativos. Em ambos os casos, prefira mock auth em ambiente de
> staging dedicado.

## Componentes do template (3 arquivos + 3 envs)

### 1. Endpoint de login dev-bypass

`src/app/api/auth/dev-bypass/route.ts` (Next.js App Router) — adaptar para outros frameworks:

```ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Dev bypass login para testes controlados em prod.
 *
 * Ativacao: env vars `DEV_BYPASS_SECRET` + `DEV_BYPASS_USER_ID` setadas no servidor.
 * Sem essas envs, o endpoint retorna 404 (rota inexistente para qualquer outro contexto).
 *
 * Uso: GET /api/auth/dev-bypass?secret=XXX
 *   - Se secret bate: seta cookie `x-dev-bypass=XXX` (httpOnly, sameSite=lax) e redireciona para /app
 *   - Se nao bate: 401
 *
 * Para revogar: unset DEV_BYPASS_SECRET no env do PM2 + restart.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.DEV_BYPASS_SECRET;
  const userId = process.env.DEV_BYPASS_USER_ID;
  if (!expected || !userId) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const provided = req.nextUrl.searchParams.get('secret');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const redirectTo = req.nextUrl.searchParams.get('redirect') || '/app';
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.set('x-dev-bypass', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60, // 1h
  });
  return res;
}
```

### 2. Patch no middleware/proxy

Adicionar no `src/proxy.ts` (ou `middleware.ts`) ANTES da logica de auth normal:

```ts
// Dev bypass auth (controlled prod testing).
// Ativo SO se ambas envs estiverem setadas + cookie x-dev-bypass valido.
// Em prod normal essas envs nao existem — fail-safe.
// Para revogar: unset DEV_BYPASS_SECRET + restart PM2.
if (process.env.DEV_BYPASS_SECRET && process.env.DEV_BYPASS_USER_ID) {
  const bypassCookie = req.cookies.get('x-dev-bypass')?.value;
  if (bypassCookie && bypassCookie === process.env.DEV_BYPASS_SECRET) {
    const uid = Number(process.env.DEV_BYPASS_USER_ID);
    if (Number.isFinite(uid) && uid > 0) {
      const headers = new Headers(req.headers);
      headers.set('x-user-id', String(uid));
      headers.set('x-user-email', process.env.DEV_BYPASS_USER_EMAIL || 'dev-bypass@local');
      headers.set('x-user-role', 'member');
      return NextResponse.next({ request: { headers } });
    }
  }
}
```

Adicionar `/api/auth/dev-bypass` na lista PUBLIC_PREFIXES (rotas sem auth).

### 3. Envs no servidor

Adicionar ao `.env.production` E ao `ecosystem.config.js` (env block):

```
DEV_BYPASS_SECRET=$(openssl rand -hex 16)   # gerar valor aleatorio
DEV_BYPASS_USER_ID=1                         # uid de um usuario existente
DEV_BYPASS_USER_EMAIL=admin@example.com      # opcional, fallback dev-bypass@local
```

Ecosystem patch (sed no servidor):

```bash
SECRET=$(openssl rand -hex 16)
sed -i "/PORT: '3100'/a\\      DEV_BYPASS_SECRET: '\${SECRET}',\\n      DEV_BYPASS_USER_ID: '1',\\n      DEV_BYPASS_USER_EMAIL: 'admin@example.com'," /opt/.../ecosystem.config.js
pm2 delete {projeto} && pm2 start ecosystem.config.js && pm2 save
```

## Stage 6.5 — Validacao prod E2E via dev-bypass

Apos deploy autonomous + Stage 6 (curl smoke), se projeto tem auth-gated UI:

```ts
// Playwright (mcp__playwright__browser_run_code)
async (page) => {
  await page.context().addCookies([{
    name: 'x-dev-bypass',
    value: '<SECRET>',
    domain: 'dev.tuninho.ai',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);
  await page.goto('https://dev.tuninho.ai/app');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'evidencias/prod-logged.png', fullPage: true });
  // Smoke E2E nas funcoes principais do escopo do card/op
  const consoleErrors = await page.evaluate(() => {/* extract */});
  return { ok: consoleErrors.length === 0, errors: consoleErrors };
}
```

**Read tool obrigatorio** no screenshot resultante para interpretacao visual (Licao #31). Sem isso, nao se sabe se o usuario real teria visto o que voce viu.

## Revogacao pos-validacao

```bash
ssh -i .../id_ed25519 root@SERVER
sed -i '/^DEV_BYPASS_/d' /opt/.../app/.env.production
sed -i '/DEV_BYPASS_/d' /opt/.../app/ecosystem.config.js
pm2 delete {projeto} && pm2 start /opt/.../app/ecosystem.config.js && pm2 save
```

Cookie httpOnly expira sozinho em 1h. Endpoint vira 404 sem as envs.

## Auditoria

Adicionar entrada em `_a4tunados/deploys/{server}/dev-bypass-{TS}.log`:

```
DEV_BYPASS_ACTIVATED: {ISO_TS}
SECRET_PREFIX: {first 6 chars}
USER_ID: {uid}
PURPOSE: {motivo — ex: "validacao card-isolated 1760885350227510504"}
REVOKED_AT: {pos-revogacao}
```

Operacoes que ativam dev-bypass DEVEM revoga-lo na Etapa 17 (Comlurb seal final),
exceto se operador explicitamente pedir para manter por mais tempo.

## Caso canonico

Op 04 card-isolated tuninho.ai card 1760885350227510504 "Listas e Cards" (2026-04-25)
— operador pediu *"Cara precisamos resolver o auth para prod pra vc testar o que esta deployado. Está em prod controlado, portanto não é grave. Faça isso pf"* depois de
o agente ter parado em "auth e complexo" e feito validacao apenas via curl + DB
inspection. O dev-bypass implementado virou template reusavel.
