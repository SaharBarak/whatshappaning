/**
 * Email Signup Module
 *
 * Handles email subscription form submission and preferences.
 */

import { config } from './config.js';

// DOM elements
let form = null;
let emailInput = null;
let submitBtn = null;
let messageEl = null;
let toast = null;

/**
 * Initialize email signup functionality
 */
export function initEmailSignup() {
  form = document.getElementById('email-signup-form');
  emailInput = document.getElementById('email-input');
  submitBtn = document.getElementById('email-submit-btn');
  messageEl = document.getElementById('email-signup-message');
  toast = document.getElementById('subscription-toast');

  if (!form) return;

  // Handle form submission
  form.addEventListener('submit', handleSubmit);

  // Check URL params for subscription status
  checkUrlParams();

  // Check if already subscribed (hide form)
  const subscribed = localStorage.getItem('whatshappening-subscribed');
  if (subscribed === 'true') {
    showAlreadySubscribed();
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) return;

  // Get preferences
  const preferences = {
    daily: document.getElementById('pref-daily')?.checked ?? true,
    weekly: document.getElementById('pref-weekly')?.checked ?? false,
    alerts: document.getElementById('pref-alerts')?.checked ?? true
  };

  // Detect timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Disable form
  submitBtn.disabled = true;
  submitBtn.textContent = 'Subscribing...';

  try {
    const response = await fetch(`${config.apiUrl}/api/email/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, preferences, timezone })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Success
      showMessage('Check your inbox to confirm your subscription!', 'success');
      showToast('Confirmation email sent!', 'success');

      // Store in localStorage to hide form on next visit
      localStorage.setItem('whatshappening-subscribed', 'pending');

      // Clear form
      emailInput.value = '';
    } else {
      throw new Error(data.error || 'Subscription failed');
    }
  } catch (err) {
    console.error('Subscription error:', err);
    showMessage(err.message || 'Something went wrong. Please try again.', 'error');
    showToast('Subscription failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
  }
}

/**
 * Show message below form
 */
function showMessage(text, type) {
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = `email-signup-message ${type}`;
  messageEl.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 5000);
}

/**
 * Show toast notification
 */
function showToast(message, type) {
  if (!toast) return;

  const iconEl = document.getElementById('toast-icon');
  const messageEl = document.getElementById('toast-message');

  if (iconEl) {
    iconEl.textContent = type === 'success' ? '\u2714' : '\u2718';
  }
  if (messageEl) {
    messageEl.textContent = message;
  }

  toast.className = `subscription-toast ${type} visible`;

  // Auto-hide after 4 seconds
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

/**
 * Check URL params for subscription confirmation
 */
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('subscribed') === 'true') {
    showToast('Successfully subscribed!', 'success');
    localStorage.setItem('whatshappening-subscribed', 'true');
    showAlreadySubscribed();
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (params.get('unsubscribed') === 'true') {
    showToast('Successfully unsubscribed', 'success');
    localStorage.removeItem('whatshappening-subscribed');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (params.get('error') === 'invalid_token') {
    showToast('Invalid or expired link', 'error');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/**
 * Show already subscribed state
 */
function showAlreadySubscribed() {
  const section = document.getElementById('email-signup-section');
  if (!section) return;

  // Replace form with thank you message
  section.innerHTML = `
    <h2 class="email-signup-title">You're Subscribed!</h2>
    <p class="email-signup-subtitle">You'll receive predictions in your inbox.</p>
    <button class="email-submit-btn" onclick="window.emailSignup.unsubscribe()" style="background: transparent; border-color: rgba(255,255,255,0.5);">
      Manage Preferences
    </button>
  `;
}

/**
 * Open preferences management (redirect to email)
 */
export function openPreferences() {
  // For now, just show a message - full implementation would need the token
  showToast('Check your email for the manage preferences link', 'success');
}

/**
 * Unsubscribe - clears local state
 */
export function unsubscribe() {
  localStorage.removeItem('whatshappening-subscribed');
  showToast('Check your email for the unsubscribe link', 'success');
  // Reload to show form again
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Expose to window for inline handlers
window.emailSignup = {
  openPreferences,
  unsubscribe
};

export default {
  initEmailSignup,
  showToast
};
