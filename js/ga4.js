/**
 * Google Analytics 4 Core Module
 * Handles initialization, consent management, and event tracking
 */

import { GA4_CONFIG } from './ga4-config.js';

class GA4Tracker {
  constructor() {
    this.initialized = false;
    this.consentGranted = false;
    this.eventQueue = [];
  }

  /**
   * Initialize GA4 with consent mode
   */
  async init() {
    if (this.initialized) return;
    
    // Load gtag.js
    await this.loadGtagScript();
    
    // Configure with default consent
    window.gtag('consent', 'default', GA4_CONFIG.defaultConsent);
    
    // Initialize GA4
    window.gtag('js', new Date());
    window.gtag('config', GA4_CONFIG.measurementId, {
      debug_mode: GA4_CONFIG.debug,
      send_page_view: false // We'll send manually for SPA behavior
    });
    
    this.initialized = true;
    
    // Check for existing consent
    this.checkExistingConsent();
    
    // Process queued events
    this.processQueue();
    
    if (GA4_CONFIG.debug) {
      console.log('[GA4] Initialized with consent mode');
    }
  }

  /**
   * Load the gtag.js script dynamically
   */
  loadGtagScript() {
    return new Promise((resolve, reject) => {
      if (window.gtag) {
        resolve();
        return;
      }
      
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_CONFIG.measurementId}`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Update consent state
   */
  updateConsent(granted) {
    this.consentGranted = granted;
    
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied'
    });
    
    // Store preference
    localStorage.setItem('wh_analytics_consent', granted ? 'granted' : 'denied');
    
    if (granted) {
      this.processQueue();
    }
    
    if (GA4_CONFIG.debug) {
      console.log(`[GA4] Consent ${granted ? 'granted' : 'denied'}`);
    }
  }

  /**
   * Check for existing consent preference
   */
  checkExistingConsent() {
    const stored = localStorage.getItem('wh_analytics_consent');
    if (stored === 'granted') {
      this.updateConsent(true);
    }
  }

  /**
   * Track an event
   */
  track(eventName, params = {}) {
    const event = { name: eventName, params };
    
    if (!this.initialized || !this.consentGranted) {
      this.eventQueue.push(event);
      return;
    }
    
    window.gtag('event', eventName, params);
    
    if (GA4_CONFIG.debug) {
      console.log('[GA4] Event:', eventName, params);
    }
  }

  /**
   * Process queued events after consent
   */
  processQueue() {
    if (!this.consentGranted) return;
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      window.gtag('event', event.name, event.params);
    }
  }

  /**
   * Track page view
   */
  pageView(pagePath, pageTitle) {
    this.track('page_view', {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title,
      page_location: window.location.href
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    if (window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }
  }

  /**
   * Get consent status
   */
  hasConsent() {
    return this.consentGranted;
  }

  /**
   * Opt out of analytics
   */
  optOut() {
    this.updateConsent(false);
    // Clear any existing GA cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }
}

// Singleton instance
const ga4 = new GA4Tracker();

// Expose for global access
window.whAnalytics = {
  track: (event, params) => ga4.track(event, params),
  optOut: () => ga4.optOut(),
  hasConsent: () => ga4.hasConsent()
};

export default ga4;
