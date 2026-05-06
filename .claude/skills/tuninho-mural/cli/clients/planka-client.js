/*!
 * planka-client.js — Cliente HTTP para o mural a4tunados (Planka)
 *
 * Extraido de mural-cli.js (linhas 87-171) na Op 138 (Card Isolated 138 — Foundation Origin-Aware).
 * Espelha a API shape usada pela CLI (client.cards.*, client.comments.*, client.boards.*).
 *
 * Origin: 'mural-a4tunados' (Planka). Para destino tuninho-ai (board Dev tuninho.ai),
 * ver clients/tuninho-ai-client.js.
 */

export class PlankaClient {
  constructor({ baseUrl, token }) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    this.token = token;
    this.origin = 'mural-a4tunados';
    // API shape compativel com services/mural-api-client:
    this.cards = {
      getCard: (id) => this._request('GET', `/api/cards/${id}`),
      createCard: (listId, values) => this._request('POST', `/api/lists/${listId}/cards`, values),
      updateCard: (id, values) => this._request('PATCH', `/api/cards/${id}`, values),
    };
    this.comments = {
      createComment: (cardId, text) => this._request('POST', `/api/cards/${cardId}/comments`, { text }),
      listComments: (cardId) => this._request('GET', `/api/cards/${cardId}/comments`),
    };
    this.boards = {
      getBoard: (id) => this._request('GET', `/api/boards/${id}`),
      getMemberships: (id) => this._request('GET', `/api/boards/${id}/memberships`),
      createMembership: (id, userId, role = 'editor') =>
        this._request('POST', `/api/boards/${id}/memberships`, { userId, role }),
      // Card 1762662734295467499 (v0.12.0): extrai claudeWorkspace para diagnostics e
      // pre-flight do dispatcher (claude-sessions-service Card 467499 multi-source).
      getClaudeWorkspace: async (id) => {
        const res = await this._request('GET', `/api/boards/${id}`);
        const cw = res?.item?.claudeWorkspace;
        if (cw === null || cw === undefined) {
          return { workspace: null, primary: null };
        }
        if (Array.isArray(cw)) {
          return {
            workspace: cw,
            primary: cw.length > 0 ? cw[0] : null,
            secondary: cw.slice(1),
          };
        }
        return { workspace: [cw], primary: cw, secondary: [] };
      },
    };
    this.lists = {
      createList: (boardId, values) =>
        this._request('POST', `/api/boards/${boardId}/lists`, values),
    };
    this.cardMemberships = {
      create: (cardId, userId) =>
        this._request('POST', `/api/cards/${cardId}/memberships`, { userId }),
    };
    this.users = {
      getMe: () => this._request('GET', '/api/users/me'),
      list: () => this._request('GET', '/api/users'),
    };
    this.labels = {
      listBoardLabels: (boardId) =>
        this._request('GET', `/api/boards/${boardId}`).then(r => r?.included?.labels || []),
      createLabel: (boardId, values) =>
        this._request('POST', `/api/boards/${boardId}/labels`, values),
      addToCard: (cardId, labelId) =>
        this._request('POST', `/api/cards/${cardId}/labels`, { labelId }),
      removeFromCard: (cardId, labelId) =>
        this._request('DELETE', `/api/cards/${cardId}/labels/${labelId}`),
    };
  }

  async _request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const init = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, init);
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${method} ${path}`);
      err.status = res.status;
      err.body = parsed || text;
      throw err;
    }
    return parsed;
  }

  async healthCheck() {
    try {
      const r = await this._request('GET', '/api/config');
      return { ok: true, version: r?.item?.version || null };
    } catch (err) {
      return { ok: false, error: err.message, status: err.status };
    }
  }
}

export default PlankaClient;
