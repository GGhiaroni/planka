/*!
 * tuninho-ai-client.js — Cliente HTTP para o board Dev do tuninho.ai
 *
 * Criado na Op 138 (Card Isolated 138 — Foundation Origin-Aware) para habilitar
 * destino "tuninho-ai" no tuninho-mural CLI. Espelha pattern do
 * `card-comment-poster.js` no claude-sessions-service (REFERENCIA CANONICA).
 *
 * Endpoint backend: POST `${TUNINHO_AI_BASE_URL}/api/admin/dev-mural/incoming-comment`
 * Auth: Authorization Bearer ${CSS_INBOUND_BEARER}
 *
 * Mapeamento conceitual:
 *   - cardId no contexto Planka → chatId numerico do board Dev (chat_id em dev_card_comments)
 *   - text do comment → body do comment com author_kind='tuninho'
 *   - origin → marcador de origem ("mural-cli", "mural-helper", etc) salvo em comment_origin
 *
 * NAO suporta cards.updateCard, boards.*, lists.* — board Dev e read-only do
 * lado do mural-cli (operacoes de UI sao feitas pelo proprio operador no app
 * dev.tuninho.ai). So `comments.createComment` e `healthCheck` sao implementados.
 */

export class TuninhoAiClient {
  constructor({ baseUrl, token, origin = 'mural-cli' }) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    this.token = token;
    this.defaultOrigin = origin;
    this.origin = 'tuninho-ai';

    // API shape MINIMA — compativel com chamadas que mural-cli faz para destino tuninho-ai
    this.cards = {
      getCard: (_id) => Promise.reject(new Error('tuninho-ai destination does not support cards.getCard')),
      createCard: (_listId, _values) => Promise.reject(new Error('tuninho-ai destination does not support cards.createCard')),
      updateCard: (_id, _values) => Promise.reject(new Error('tuninho-ai destination does not support cards.updateCard — use the board Dev UI at dev.tuninho.ai/app')),
    };
    this.comments = {
      // text e o body do comment; options.origin opcional sobrescreve defaultOrigin
      createComment: async (cardId, text, options = {}) => {
        const chatId = Number(cardId);
        if (!Number.isFinite(chatId) || chatId <= 0) {
          throw new Error(`tuninho-ai destination requires numeric cardId (chat_id), got: ${cardId}`);
        }
        const origin = options.origin || this.defaultOrigin;
        return this._request('POST', '/api/admin/dev-mural/incoming-comment', {
          chatId,
          text,
          origin,
        });
      },
      listComments: (_cardId) => Promise.reject(new Error('tuninho-ai destination does not support comments.listComments via this client — use SQL audit on dev_card_comments')),
    };
    this.boards = {
      getBoard: (_id) => Promise.reject(new Error('tuninho-ai destination does not support boards.* — board Dev is a singleton kind="dev"')),
      getMemberships: (_id) => Promise.reject(new Error('tuninho-ai destination does not support boards.getMemberships')),
      createMembership: (_id, _userId, _role) => Promise.reject(new Error('tuninho-ai destination does not support boards.createMembership')),
    };
    this.lists = {
      createList: (_boardId, _values) => Promise.reject(new Error('tuninho-ai destination does not support lists.* — columns are managed at dev.tuninho.ai/app')),
    };
    this.cardMemberships = {
      create: (_cardId, _userId) => Promise.reject(new Error('tuninho-ai destination does not support cardMemberships')),
    };
    this.users = {
      getMe: () => Promise.reject(new Error('tuninho-ai destination does not support users.getMe via this client')),
      list: () => Promise.reject(new Error('tuninho-ai destination does not support users.list via this client')),
    };
    this.labels = {
      listBoardLabels: (_boardId) => Promise.reject(new Error('tuninho-ai destination does not support labels.* — board Dev does not use Planka labels')),
      createLabel: (_boardId, _values) => Promise.reject(new Error('tuninho-ai destination does not support labels.*')),
      addToCard: (_cardId, _labelId) => Promise.reject(new Error('tuninho-ai destination does not support labels.*')),
      removeFromCard: (_cardId, _labelId) => Promise.reject(new Error('tuninho-ai destination does not support labels.*')),
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
      // /api/board e endpoint publico do tuninho.ai (retorna 200 mesmo sem auth)
      const r = await fetch(`${this.baseUrl}/api/board`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return { ok: r.ok, status: r.status };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

export default TuninhoAiClient;
