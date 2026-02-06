/**
 * Privacy Consent Banner Component
 * GDPR/CCPA compliant consent management
 */

import ga4 from '../ga4.js';
import { FocusTrap, setupEscapeHandler, announceToScreenReader } from '../a11y.js';

class ConsentBanner {
  constructor() {
    this.banner = null;
    this.initialized = false;
    this.focusTrap = null;
    this.escapeCleanup = null;
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
          <div>
            <h2 id="consent-title" class="consent-title">Cookie Preferences</h2>
            <p id="consent-description">We use analytics to improve your experience. Your data stays anonymous and is never sold.</p>
          </div>
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
    
    // Setup focus trap for keyboard navigation
    this.focusTrap = new FocusTrap(this.banner);
    
    // Setup escape key handler
    this.escapeCleanup = setupEscapeHandler(this.banner, () => this.decline());
    
    // Show with animation
    requestAnimationFrame(() => {
      this.banner.classList.add('visible');
      
      // Activate focus trap and announce to screen readers
      this.focusTrap.activate();
      announceToScreenReader('Cookie consent dialog opened. Accept or decline analytics cookies.');
    });
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
    
    // Deactivate focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }
    
    // Clean up escape handler
    if (this.escapeCleanup) {
      this.escapeCleanup();
      this.escapeCleanup = null;
    }
    
    this.banner.classList.remove('visible');
    
    // Announce to screen readers
    announceToScreenReader('Cookie consent dialog closed');
    
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'privacy-settings-title');
    modal.innerHTML = `
      <div class="privacy-settings-content">
        <h2 id="privacy-settings-title">Privacy Settings</h2>
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
    
    // Create focus trap for the modal
    const settingsFocusTrap = new FocusTrap(modal);
    
    // Close modal function
    const closeModal = () => {
      settingsFocusTrap.deactivate();
      modal.remove();
      announceToScreenReader('Privacy settings closed');
    };
    
    // Bind events
    document.getElementById('privacy-save').addEventListener('click', () => {
      const analyticsEnabled = document.getElementById('analytics-toggle').checked;
      ga4.updateConsent(analyticsEnabled);
      closeModal();
      this.hide();
      announceToScreenReader(analyticsEnabled ? 'Analytics cookies enabled' : 'Analytics cookies disabled');
    });
    
    document.getElementById('privacy-cancel').addEventListener('click', closeModal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close on Escape key
    const escapeHandler = setupEscapeHandler(modal, closeModal);
    
    requestAnimationFrame(() => {
      modal.classList.add('visible');
      settingsFocusTrap.activate();
      announceToScreenReader('Privacy settings dialog opened');
    });
  }
}

const consentBanner = new ConsentBanner();
export default consentBanner;
