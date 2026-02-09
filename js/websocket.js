/**
 * WebSocket Client Module
 * Real-time dashboard updates with reconnect logic and polling fallback.
 * EPIC-017 (#149)
 */

import { config } from './config.js';

// --- State ---
let ws = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let heartbeatTimer = null;
let fallbackPollTimer = null;
let onDataCallback = null;
let intentionallyClosed = false;

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 30000;
const FALLBACK_POLL_INTERVAL_MS = 60000;

// --- Connection State ---
export const ConnectionState = Object.freeze({
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  FALLBACK: 'fallback',
});

let currentState = ConnectionState.DISCONNECTED;
const stateListeners = new Set();

function setState(newState) {
  if (newState === currentState) return;
  const prev = currentState;
  currentState = newState;
  stateListeners.forEach((fn) => {
    try { fn(newState, prev); } catch (e) { console.error('[WS] state listener error', e); }
  });
}

export function getConnectionState() {
  return currentState;
}

export function onConnectionStateChange(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

// --- WebSocket URL ---
function getWsUrl() {
  const api = config.apiUrl;
  const wsProtocol = api.startsWith('https') ? 'wss' : 'ws';
  const host = api.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${host}/ws`;
}

// --- Exponential Backoff ---
function getReconnectDelay() {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, reconnectAttempts), MAX_DELAY_MS);
  // Add jitter ±25%
  return delay * (0.75 + Math.random() * 0.5);
}

// --- Connect ---
export function connect(onData) {
  if (onData) onDataCallback = onData;
  intentionallyClosed = false;
  doConnect();
}

function doConnect() {
  cleanup();
  setState(reconnectAttempts === 0 ? ConnectionState.CONNECTING : ConnectionState.RECONNECTING);

  try {
    ws = new WebSocket(getWsUrl());
  } catch (e) {
    console.error('[WS] Failed to create WebSocket:', e);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[WS] Connected');
    reconnectAttempts = 0;
    setState(ConnectionState.CONNECTED);
    stopFallbackPolling();
    startHeartbeat();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      console.warn('[WS] Bad message:', e);
    }
  };

  ws.onerror = (event) => {
    console.warn('[WS] Error', event);
  };

  ws.onclose = (event) => {
    console.log(`[WS] Closed (code=${event.code})`);
    stopHeartbeat();

    if (!intentionallyClosed) {
      scheduleReconnect();
    } else {
      setState(ConnectionState.DISCONNECTED);
    }
  };
}

// --- Message Handling ---
function handleMessage(msg) {
  switch (msg.type) {
    case 'data':
    case 'update':
      if (onDataCallback && msg.payload) {
        onDataCallback(msg.payload);
      }
      break;
    case 'pong':
      // heartbeat acknowledged
      break;
    default:
      console.log('[WS] Unknown message type:', msg.type);
  }
}

// --- Heartbeat ---
function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// --- Reconnect ---
function scheduleReconnect() {
  if (intentionallyClosed) return;

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[WS] Max reconnect attempts reached, falling back to polling');
    setState(ConnectionState.FALLBACK);
    startFallbackPolling();
    return;
  }

  const delay = getReconnectDelay();
  reconnectAttempts++;
  console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  setState(ConnectionState.RECONNECTING);

  reconnectTimer = setTimeout(doConnect, delay);
}

// --- Fallback Polling ---
function startFallbackPolling() {
  stopFallbackPolling();
  fallbackPollTimer = setInterval(async () => {
    try {
      const [currentRes, predictionsRes] = await Promise.all([
        fetch(`${config.apiUrl}/api/current`).then((r) => r.json()),
        fetch(`${config.apiUrl}/api/predictions`).then((r) => r.json()),
      ]);
      if (onDataCallback) {
        onDataCallback({ current: currentRes, predictions: predictionsRes });
      }
      // Try WS again periodically
      reconnectAttempts = 0;
      doConnect();
    } catch (e) {
      console.warn('[WS] Fallback poll failed:', e);
    }
  }, FALLBACK_POLL_INTERVAL_MS);
}

function stopFallbackPolling() {
  if (fallbackPollTimer) {
    clearInterval(fallbackPollTimer);
    fallbackPollTimer = null;
  }
}

// --- Disconnect ---
export function disconnect() {
  intentionallyClosed = true;
  cleanup();
  if (ws) {
    ws.close(1000, 'Client disconnect');
    ws = null;
  }
  setState(ConnectionState.DISCONNECTED);
}

function cleanup() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  stopHeartbeat();
}

export default {
  connect,
  disconnect,
  getConnectionState,
  onConnectionStateChange,
  ConnectionState,
};
