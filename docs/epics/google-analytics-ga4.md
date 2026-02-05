# Epic: Google Analytics 4 (GA4) Integration

## Overview

Implement comprehensive Google Analytics 4 tracking across the WhatsHappening site to gain insights into user behavior, feature adoption, and engagement patterns. This integration will be privacy-compliant with proper consent management.

## Goals

1. **Understand User Behavior** - Track how users interact with predictions, data modules, and features
2. **Measure Engagement** - Quantify content engagement (scroll depth, time on page, media interactions)
3. **Track Conversions** - Monitor key actions (email signups, alert subscriptions, widget embeds)
4. **Monitor Performance** - Track errors and performance issues affecting users
5. **Privacy Compliance** - Implement GDPR/CCPA-compliant consent management

---

## Technical Implementation

### 1. GA4 Configuration (`frontend/js/ga4-config.js`)

```javascript
/**
 * GA4 Configuration Module
 * Centralized Google Analytics 4 setup and configuration
 */

const GA4_CONFIG = {
  measurementId: 'G-XXXXXXXXXX', // Replace with actual Measurement ID
  
  // Debug mode for development
  debug: location.hostname === 'localhost',
  
  // Default consent state (conservative - deny until user consents)
  defaultConsent: {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted'
  },
  
  // Custom dimensions
  customDimensions: {
    theme: 'dimension1',           // light/dark/system
    language: 'dimension2',        // User's language preference
    emailSubscribed: 'dimension3', // true/false
    pushEnabled: 'dimension4',     // true/false
    pwaInstalled: 'dimension5'     // true/false
  },
  
  // Content grouping
  contentGroups: {
    main: 'Main Dashboard',
    analytics: 'Analytics Dashboard',
    readings: 'Readings Page',
    embed: 'Embed Widget'
  }
};

export { GA4_CONFIG };
```

### 2. GA4 Core Module (`frontend/js/ga4.js`)

```javascript
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
    
    console.log('[GA4] Initialized with consent mode');
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
    
    console.log(`[GA4] Consent ${granted ? 'granted' : 'denied'}`);
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
    window.gtag('set', 'user_properties', properties);
  }
}

// Singleton instance
const ga4 = new GA4Tracker();
export default ga4;
```

### 3. Consent Banner Component (`frontend/js/components/consent-banner.js`)

```javascript
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
    this.banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-text">
          <span class="consent-icon">🍪</span>
          <p>We use analytics to improve your experience. Your data stays anonymous and is never sold.</p>
        </div>
        <div class="consent-actions">
          <button class="consent-btn consent-btn-accept" id="consent-accept">Accept</button>
          <button class="consent-btn consent-btn-decline" id="consent-decline">Decline</button>
          <button class="consent-btn consent-btn-settings" id="consent-settings">Settings</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.banner);
    
    // Bind events
    document.getElementById('consent-accept').addEventListener('click', () => this.accept());
    document.getElementById('consent-decline').addEventListener('click', () => this.decline());
    document.getElementById('consent-settings').addEventListener('click', () => this.showSettings());
    
    // Show with animation
    requestAnimationFrame(() => {
      this.banner.classList.add('visible');
    });
  }

  accept() {
    ga4.updateConsent(true);
    this.hide();
    
    // Track consent granted
    ga4.track('consent_granted', {
      consent_type: 'analytics'
    });
  }

  decline() {
    ga4.updateConsent(false);
    this.hide();
  }

  hide() {
    this.banner.classList.remove('visible');
    setTimeout(() => {
      this.banner.remove();
    }, 300);
  }

  showSettings() {
    // Open privacy settings modal
    window.dispatchEvent(new CustomEvent('open-privacy-settings'));
  }
}

const consentBanner = new ConsentBanner();
export default consentBanner;
```

---

## Event Tracking Specification

### Category: Page Views & Navigation

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `page_view` | Page load/navigation | `page_path`, `page_title`, `page_location` |
| `navigation_click` | Navigation link clicked | `link_text`, `link_url`, `nav_section` |
| `external_link` | External link clicked | `link_url`, `link_domain` |
| `back_to_top` | Back to top button clicked | `scroll_depth` |

### Category: User Interactions

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `module_expand` | Data module expanded | `module_id`, `module_name` |
| `module_collapse` | Data module collapsed | `module_id`, `module_name` |
| `prediction_click` | Prediction item clicked | `prediction_id`, `outcome_type`, `confidence` |
| `alert_dismiss` | Pattern alert dismissed | `alert_id`, `alert_type` |
| `theme_change` | Theme toggled | `from_theme`, `to_theme` |
| `language_change` | Language changed | `from_lang`, `to_lang` |

### Category: Content Engagement

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `scroll_depth` | Scroll milestone reached | `percent_scrolled`, `pixel_depth` |
| `time_on_page` | Time milestone reached | `seconds_elapsed`, `page_path` |
| `content_visibility` | Section becomes visible | `section_id`, `visibility_time` |
| `chart_interaction` | User interacts with chart | `chart_id`, `interaction_type` |

### Category: Form Submissions

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `form_start` | User starts filling form | `form_id`, `form_name` |
| `form_submit` | Form submitted | `form_id`, `form_name`, `success` |
| `email_signup` | Email subscription | `signup_source`, `preferences` |
| `email_signup_error` | Signup failed | `error_type`, `error_message` |

### Category: Feature Usage

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `share_click` | Share button clicked | `share_platform`, `content_type` |
| `share_complete` | Share completed | `share_platform`, `content_type` |
| `calendar_add` | Event added to calendar | `calendar_type`, `event_type` |
| `notification_enable` | Push notifications enabled | `notification_type` |
| `notification_disable` | Push notifications disabled | `notification_type` |
| `pwa_install` | PWA install triggered | `install_source` |
| `pwa_install_complete` | PWA installed | `platform` |

### Category: Conversions

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `signup` | User signs up | `signup_method`, `signup_source` |
| `subscription` | User subscribes | `subscription_type`, `tier` |
| `widget_embed` | Widget embed code copied | `widget_type`, `customization` |

### Category: Errors

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `error` | Application error | `error_type`, `error_message`, `error_stack` |
| `api_error` | API request failed | `endpoint`, `status_code`, `error_message` |
| `load_error` | Resource failed to load | `resource_type`, `resource_url` |

---

## Implementation Files

### Files to Create

| File | Purpose |
|------|---------|
| `frontend/js/ga4-config.js` | GA4 configuration and settings |
| `frontend/js/ga4.js` | Core tracking module |
| `frontend/js/ga4-events.js` | Event tracking implementations |
| `frontend/js/components/consent-banner.js` | Consent banner UI |
| `frontend/css/consent-banner.css` | Consent banner styles |
| `docs/analytics-events.md` | Event documentation |

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/index.html` | Add consent banner, load GA4 module |
| `frontend/analytics.html` | Add GA4 tracking |
| `frontend/readings.html` | Add GA4 tracking |
| `frontend/embed.html` | Add GA4 tracking (lightweight) |
| `frontend/js/app.js` | Initialize GA4, add event tracking |
| `frontend/js/email-signup.js` | Track signup events |
| `frontend/js/share.js` | Track share events |
| `frontend/js/preferences.js` | Track preference changes |
| `frontend/js/notifications.js` | Track notification events |
| `frontend/js/pwa.js` | Track PWA install events |
| `frontend/css/styles.css` | Import consent banner styles |

---

## Privacy & Compliance

### Data Collection Principles

1. **Minimal Collection** - Only collect what's needed for product improvement
2. **Anonymization** - No PII collected; IP anonymization enabled
3. **User Control** - Easy opt-out at any time
4. **Transparency** - Clear documentation of what's tracked

### Consent Management

- **Default State**: Analytics denied until explicit consent
- **Consent Storage**: LocalStorage (persists across sessions)
- **Opt-Out**: Available in settings and via `window.whAnalytics.optOut()`
- **Data Deletion**: Link to Google's data deletion request

### Cookie/Storage Usage

| Storage | Purpose | Duration |
|---------|---------|----------|
| `_ga` | GA4 client ID | 2 years |
| `_ga_*` | GA4 session ID | Session |
| `wh_analytics_consent` | Consent preference | Permanent |

---

## Testing Checklist

- [ ] GA4 loads only after consent granted
- [ ] Events appear in GA4 DebugView
- [ ] Consent banner shows on first visit
- [ ] Consent preference persists across sessions
- [ ] Opt-out stops all tracking
- [ ] No PII in any event parameters
- [ ] All custom events documented
- [ ] Error tracking captures stack traces
- [ ] Page views track correctly on SPA navigation
- [ ] Works with ad blockers (degrades gracefully)

---

## Success Metrics

After implementation, we should be able to answer:

1. Which data modules are most popular?
2. What's the email signup conversion rate?
3. How do users discover the site? (referrers)
4. What's the average session duration?
5. Which predictions get the most engagement?
6. What percentage of users enable notifications?
7. How many users install the PWA?
8. What's the scroll depth distribution?
9. Which pages have the highest bounce rate?
10. What errors are users encountering?

---

## Labels

`pm:queued`, `type:feature`, `scope:frontend`, `priority:medium`

## Dependencies

- None (self-contained implementation)

## Estimated Effort

- **Frontend**: 2-3 days
- **Testing**: 1 day
- **Documentation**: 0.5 days
- **Total**: ~4 days
