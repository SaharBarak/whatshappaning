/**
 * Countdown Timer Component
 * Shows time until next snapshot update + last updated timestamp
 */

import { getSnapshot } from '../api.js';

let timerInterval = null;
let nextUpdateTime = null;
let generatedAtTime = null;

/**
 * Initialize the countdown timer
 * Call after DOM is ready
 */
export async function initCountdown() {
  const container = document.getElementById('update-countdown');
  if (!container) return;

  try {
    const result = await getSnapshot();
    if (result && result.data) {
      nextUpdateTime = result.data.next_update ? new Date(result.data.next_update) : null;
      generatedAtTime = result.data.generated_at ? new Date(result.data.generated_at) : null;
    }
  } catch (e) {
    // Snapshot unavailable
  }

  render(container);
  startTicking(container);
}

function render(container) {
  const countdownStr = getCountdownString();
  const lastUpdatedStr = getLastUpdatedString();

  container.innerHTML = `
    <div class="countdown-inner">
      ${lastUpdatedStr ? `<span class="countdown-updated">Updated ${lastUpdatedStr}</span>` : ''}
      ${countdownStr ? `<span class="countdown-separator">·</span><span class="countdown-next">Next update in ${countdownStr}</span>` : ''}
    </div>
  `;
}

function startTicking(container) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (nextUpdateTime && Date.now() >= nextUpdateTime.getTime()) {
      // Time's up — refresh snapshot
      clearInterval(timerInterval);
      container.innerHTML = `<div class="countdown-inner"><span class="countdown-refreshing">Refreshing data…</span></div>`;
      setTimeout(() => location.reload(), 2000);
      return;
    }
    render(container);
  }, 30_000); // update display every 30s
}

function getCountdownString() {
  if (!nextUpdateTime) return null;
  const diff = nextUpdateTime.getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getLastUpdatedString() {
  if (!generatedAtTime) return null;
  const seconds = Math.floor((Date.now() - generatedAtTime.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function destroyCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
