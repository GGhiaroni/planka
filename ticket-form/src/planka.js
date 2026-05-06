'use strict';

const { PLANKA_URL, PLANKA_EMAIL, PLANKA_PASSWORD, PLANKA_LIST_ID } = require('./config');

// Module-level token cache shared across all requests in this process.
let tokenCache = { token: null, expiresAt: 0 };

// Decode the `exp` claim from a JWT payload without any library.
// Returns the expiry as Unix seconds, or Infinity if it cannot be decoded.
function decodeTokenExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp : Infinity;
  } catch {
    return Infinity;
  }
}

async function getToken() {
  const SAFETY_BUFFER_MS = 60_000; // refresh 60s before expiry
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - SAFETY_BUFFER_MS) {
    return tokenCache.token;
  }

  const res = await fetch(`${PLANKA_URL}/api/access-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: PLANKA_EMAIL, password: PLANKA_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Planka login failed with status ${res.status}`);
  }

  const { item: token } = await res.json();
  const expiresAt = decodeTokenExpiry(token) * 1000; // seconds → ms
  tokenCache = { token, expiresAt };
  return token;
}

async function createCardInList(listId, name, descricao) {
  const token = await getToken();

  const body = { type: 'project', name, position: 65536 };
  if (descricao && String(descricao).trim().length > 0) {
    body.description = descricao;
  }

  const res = await fetch(`${PLANKA_URL}/api/lists/${listId}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    tokenCache = { token: null, expiresAt: 0 };
    return createCardInList(listId, name, descricao);
  }

  if (!res.ok) {
    throw new Error(`Planka card creation failed with status ${res.status}`);
  }

  return res.json();
}

// Backward-compatible wrapper for the existing Pedido de Artes flow.
async function createCard(name, descricao) {
  return createCardInList(PLANKA_LIST_ID, name, descricao);
}

async function attachLabel(cardId, labelId) {
  const token = await getToken();
  const res = await fetch(`${PLANKA_URL}/api/cards/${cardId}/card-labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ labelId }),
  });
  if (!res.ok) {
    console.error(`[ticket-form] Failed to attach label ${labelId}: ${res.status}`);
  }
}

async function createCardCustomFieldGroups(cardId, groups) {
  const token = await getToken();

  let position = 65536;

  for (const group of groups) {
    if (!group.fields || group.fields.length === 0) continue;

    const groupRes = await fetch(`${PLANKA_URL}/api/cards/${cardId}/custom-field-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: group.name, position }),
    });

    if (!groupRes.ok) {
      console.error(`[ticket-form] Failed to create group "${group.name}": ${groupRes.status}`);
      continue;
    }

    const { item: groupItem } = await groupRes.json();
    const groupId = groupItem.id;
    position += 65536;

    let fieldPosition = 65536;
    for (const field of group.fields) {
      const fieldRes = await fetch(
        `${PLANKA_URL}/api/custom-field-groups/${groupId}/custom-fields`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: field.name,
            position: fieldPosition,
            showOnFrontOfCard: !!field.showOnFrontOfCard,
          }),
        },
      );

      if (!fieldRes.ok) {
        console.error(`[ticket-form] Failed to create field "${field.name}": ${fieldRes.status}`);
        continue;
      }

      const { item: fieldItem } = await fieldRes.json();
      const fieldId = fieldItem.id;
      fieldPosition += 65536;

      const valueRes = await fetch(
        `${PLANKA_URL}/api/cards/${cardId}/custom-field-values/customFieldGroupId:${groupId}:customFieldId:${fieldId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: field.value }),
        },
      );

      if (!valueRes.ok) {
        console.error(
          `[ticket-form] Failed to set value for "${field.name}": ${valueRes.status}`,
        );
      }
    }
  }
}

async function fetchBoardCards() {
  const token = await getToken();

  // 1. Get the list to find its boardId
  const listRes = await fetch(`${PLANKA_URL}/api/lists/${PLANKA_LIST_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Failed to fetch list: ${listRes.status}`);
  const listData = await listRes.json();
  const boardId = listData.item.boardId;

  // 2. Get the full board with all cards and lists
  const boardRes = await fetch(`${PLANKA_URL}/api/boards/${boardId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!boardRes.ok) throw new Error(`Failed to fetch board: ${boardRes.status}`);
  const boardData = await boardRes.json();

  const lists = (boardData.included?.lists || []).reduce((map, l) => {
    map[l.id] = l.name || l.type;
    return map;
  }, {});

  const cards = (boardData.included?.cards || []).map((card) => ({
    id: card.id,
    name: card.name,
    description: card.description || '',
    listName: lists[card.listId] || '',
    createdAt: card.createdAt,
    fields: parseDescription(card.description || ''),
  }));

  return cards;
}

// Parse structured markdown description into key-value pairs.
function parseDescription(description) {
  const data = {};
  const regex = /\*\*(.+?):\*\*\s*(.+)/g;
  let match;
  while ((match = regex.exec(description)) !== null) {
    data[match[1].trim()] = match[2].trim();
  }

  // Extract "Card aberto em" timestamp
  const tsMatch = description.match(/Card aberto via formulário(?: preenchido[^e]*)? em (.+)/);
  if (tsMatch) data['Aberto Em'] = tsMatch[1].trim();

  return data;
}

module.exports = {
  createCard,
  createCardInList,
  createCardCustomFieldGroups,
  attachLabel,
  fetchBoardCards,
};
