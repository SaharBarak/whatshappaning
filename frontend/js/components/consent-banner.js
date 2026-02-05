/**
 * Privacy Consent Banner Component
 * GDPR/CCPA compliant consent management
 */

import ga4 from '../ga4.js';

class ConsentBanner {
  constructor() {
    this.banner = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Check if consent already given
    const consent = localStorage.getItem('wh_analytics_consent');
    if (consent) {
      this.initialized = true;
      return;
    }
    
    this.render();
    this.initialized = true;
  }

  render() {
    this.banner = document.createElement('div');
    this.banner.className = 'consent-banner';
    this.banner.setAttribute('role', 'dialog');
    this.banner.setAttribute('aria-labelledby', 'consent-title');
    this.banner.setAttribute('aria-describedby', 'consent-description');
    
    this.banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-text">
          <span class="consent-icon" aria-hidden="true">🍪</span>
          <p id="consent-description">We use analytics to improve your experience. Your data stays anonymous and is never sold.</p>
        </div>
        <div class="consent-actions">
          <button class="consent-btn consent-btn-accept" id="consent-accept" aria-label="Accept analytics cookies">Accept</button>
          <button class="consent-btn consent-btn-decline" id="consent-decline" aria-label="Decline analytics cookies">Decline</button>
          <button class="consent-btn consent-btn-settings" id="consent-settings" aria-label="Open privacy settings">Settings</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.banner);
    
    // Bind events
    document.getElementById('consent-accept').addEventListener('click', () => this.accept());
    document.getElementById('consent-decline').addEventListener('click', () => this.decline());
    document.getElementById('consent-settings').addEventListener('click', () => this.showSettings());
    
    // Handle keyboard navigation
    this.banner.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.decline();
      }
    });
    
    // Show with animation
    requestAnimationFrame(() => {
      this.banner.classList.add('visible');
    });
    
    // Focus the accept button for accessibility
    setTimeout(() => {
      document.getElementById('consent-accept')?.focus();
    }, 100);
  }

  accept() {
    ga4.updateConsent(true);
    this.hide();
    
    // Track consent granted (will be sent after consent is processed)
    ga4.track('consent_granted', {
      consent_type: 'analytics'
    });
  }

  decline() {
    ga4.updateConsent(false);
    this.hide();
  }

  hide() {
    if (!this.banner) return;
    
    this.banner.classList.remove('visible');
    setTimeout(() => {
      this.banner.remove();
      this.banner = null;
    }, 300);
  }

  showSettings() {
    // Open privacy settings modal
    window.dispatchEvent(new CustomEvent('open-privacy-settings'));
    
    // For now, if no settings modal exists, show a simple dialog
    if (!document.querySelector('.privacy-settings-modal')) {
      this.showSimpleSettings();
    }
  }

  showSimpleSettings() {
    const modal = document.createElement('div');
    modal.className = 'privacy-settings-modal';
    modal.innerHTML = `
      <div class="privacy-settings-content">
        <h2>Privacy Settings</h2>
        <div class="privacy-option">
          <label>
            <input type="checkbox" id="analytics-toggle" checked>
            <span>Analytics Cookies</span>
          </label>
          <p class="privacy-option-desc">Help us understand how you use our site to improve your experience.</p>
        </div>
        <div class="privacy-actions">
          <button class="privacy-btn privacy-btn-save" id="privacy-save">Save Preferences</button>
          <button class="privacy-btn privacy-btn-cancel" id="privacy-cancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    document.getElementById('privacy-save').addEventListener('click', () => {
      const analyticsEnabled = document.getElementById('analytics-toggle').checked;
      ga4.updateConsent(analyticsEnabled);
      modal.remove();
      this.hide();
    });
    
    document.getElementById('privacy-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }
}

const consentBanner = new ConsentBanner();
export default consentBanner;
