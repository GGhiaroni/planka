/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import Cookies from 'js-cookie';

import Config from '../constants/Config';

const io = sailsIOClient(socketIOClient);

io.sails.path = `${Config.BASE_PATH}/socket.io`;
io.sails.autoConnect = false;
io.sails.reconnection = true;
io.sails.useCORSRouteToGetCookie = false;
io.sails.environment = import.meta.env.MODE;

const { socket } = io;

socket.connect = socket._connect; // eslint-disable-line no-underscore-dangle

// Workaround sails.io.js v1.2.1 + socket.io-client v4 incompat:
// socket.request retorna undefined em vez de chamar callback no upgrade WS,
// causando "Cannot destructure property 'item'" em fetchCore.
// Substituicao por fetch REST puro — backend responde no mesmo /api/* via HTTP.
// WS continua usado para realtime push (subscribe events).
['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
  socket[method.toLowerCase()] = async (url, data, headers) => {
    const opts = { method, headers: { ...(headers || {}) }, credentials: 'include' };
    const token = Cookies.get(Config.ACCESS_TOKEN_KEY);
    if (token && !opts.headers.Authorization) {
      opts.headers.Authorization = `Bearer ${token}`;
    }
    if (data !== undefined && method !== 'GET') {
      opts.body = JSON.stringify(data);
      opts.headers['Content-Type'] = 'application/json';
    }
    let fullUrl = `${Config.BASE_PATH || ''}/api${url}`;
    if (data !== undefined && method === 'GET') {
      const qs = new URLSearchParams(
        Object.entries(data).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = typeof v === 'object' ? JSON.stringify(v) : v;
          return acc;
        }, {}),
      ).toString();
      if (qs) fullUrl += `?${qs}`;
    }
    const res = await fetch(fullUrl, opts);
    if (!res.ok) {
      let body;
      try { body = await res.json(); } catch (e) { body = { code: res.status, message: res.statusText }; }
      const err = new Error(body.message || res.statusText);
      err.body = body;
      err.status = res.status;
      throw err;
    }
    if (res.status === 204) return undefined;
    return res.json();
  };
});

export default socket;
