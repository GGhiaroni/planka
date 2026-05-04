/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const STORAGE_KEY = 'planka:collapsed-lists';
const CHANGE_EVENT = 'planka:collapsed-lists-change';

const readSet = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const writeSet = (set) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const isListCollapsed = (listId) => readSet().has(listId);

export const setListCollapsed = (listId, collapsed) => {
  const set = readSet();
  if (collapsed) {
    set.add(listId);
  } else {
    set.delete(listId);
  }
  writeSet(set);
};

export const subscribeCollapsedLists = (handler) => {
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};
