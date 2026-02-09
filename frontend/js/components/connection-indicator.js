/**
 * Connection Status Indicator
 * Shows real-time connection state in the header.
 * EPIC-017 (#149)
 */

import { ConnectionState, onConnectionStateChange, getConnectionState } from '../websocket.js';

const LABELS = {
  [ConnectionState.CONNECTED]:    { text: 'Live',         cssClass: 'live' },
  [ConnectionState.CONNECTING]:   { text: 'Connecting…',  cssClass: 'connecting' },
  [ConnectionState.RECONNECTING]: { text: 'Reconnecting…', cssClass: 'reconnecting' },
  [ConnectionState.DISCONNECTED]: { text: 'Offline',      cssClass: 'disconnected' },
  [ConnectionState.FALLBACK]:     { text: 'Polling',      cssClass: 'fallback' },
};

/**
 * Bind the existing .live-indicator in the header to WS state.
 * Call once during app init.
 */
export function initConnectionIndicator() {
  const dot = document.querySelector('.live-dot');
  const text = document.querySelector('.live-text');
  if (!dot || !text) return;

  function update(state) {
    const info = LABELS[state] || LABELS[ConnectionState.DISCONNECTED];
    text.textContent = info.text;

    // Swap CSS modifier on the dot
    dot.className = 'live-dot';
    dot.classList.add(`live-dot--${info.cssClass}`);
  }

  // Set initial state
  update(getConnectionState());

  // React to changes
  onConnectionStateChange(update);
}

export default { initConnectionIndicator };
