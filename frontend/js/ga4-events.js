/**
 * GA4 Event Tracking Module
 * Standardized event tracking implementations
 */

import ga4 from './ga4.js';

/**
 * Navigation Events
 */
export const navigationEvents = {
  /**
   * Track navigation link click
   */
  linkClick(linkText, linkUrl, navSection = 'main') {
    ga4.track('navigation_click', {
      link_text: linkText,
      link_url: linkUrl,
      nav_section: navSection
    });
  },

  /**
   * Track external link click
   */
  externalLink(linkUrl) {
    const url = new URL(linkUrl, window.location.origin);
    ga4.track('external_link', {
      link_url: linkUrl,
      link_domain: url.hostname
    });
  },

  /**
   * Track back to top button
   */
  backToTop(scrollDepth) {
    ga4.track('back_to_top', {
      scroll_depth: scrollDepth
    });
  }
};

/**
 * User Interaction Events
 */
export const interactionEvents = {
  /**
   * Track module expand
   */
  moduleExpand(moduleId, moduleName) {
    ga4.track('module_expand', {
      module_id: moduleId,
      module_name: moduleName
    });
  },

  /**
   * Track module collapse
   */
  moduleCollapse(moduleId, moduleName) {
    ga4.track('module_collapse', {
      module_id: moduleId,
      module_name: moduleName
    });
  },

  /**
   * Track prediction click
   */
  predictionClick(predictionId, outcomeType, confidence) {
    ga4.track('prediction_click', {
      prediction_id: predictionId,
      outcome_type: outcomeType,
      confidence: confidence
    });
  },

  /**
   * Track alert dismiss
   */
  alertDismiss(alertId, alertType) {
    ga4.track('alert_dismiss', {
      alert_id: alertId,
      alert_type: alertType
    });
  },

  /**
   * Track theme change
   */
  themeChange(fromTheme, toTheme) {
    ga4.track('theme_change', {
      from_theme: fromTheme,
      to_theme: toTheme
    });
  },

  /**
   * Track language change
   */
  languageChange(fromLang, toLang) {
    ga4.track('language_change', {
      from_lang: fromLang,
      to_lang: toLang
    });
  }
};

/**
 * Content Engagement Events
 */
export const engagementEvents = {
  // Scroll depth tracking state
  _scrollMilestones: new Set(),
  _timeOnPageStart: Date.now(),
  _timeOnPageMilestones: new Set(),

  /**
   * Initialize scroll depth tracking
   */
  initScrollTracking() {
    const milestones = [25, 50, 75, 90, 100];
    
    const trackScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !this._scrollMilestones.has(milestone)) {
          this._scrollMilestones.add(milestone);
          ga4.track('scroll_depth', {
            percent_scrolled: milestone,
            pixel_depth: window.scrollY
          });
        }
      });
    };

    // Throttled scroll handler
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          trackScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  },

  /**
   * Initialize time on page tracking
   */
  initTimeTracking() {
    const milestones = [30, 60, 180, 300, 600]; // seconds
    
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - this._timeOnPageStart) / 1000);
      
      milestones.forEach(milestone => {
        if (elapsed >= milestone && !this._timeOnPageMilestones.has(milestone)) {
          this._timeOnPageMilestones.add(milestone);
          ga4.track('time_on_page', {
            seconds_elapsed: milestone,
            page_path: window.location.pathname
          });
        }
      });
    }, 5000); // Check every 5 seconds
  },

  /**
   * Track content visibility (for intersection observer)
   */
  contentVisible(sectionId, visibilityTime = 0) {
    ga4.track('content_visibility', {
      section_id: sectionId,
      visibility_time: visibilityTime
    });
  },

  /**
   * Track chart interaction
   */
  chartInteraction(chartId, interactionType) {
    ga4.track('chart_interaction', {
      chart_id: chartId,
      interaction_type: interactionType
    });
  },

  /**
   * Reset tracking for new page
   */
  reset() {
    this._scrollMilestones.clear();
    this._timeOnPageMilestones.clear();
    this._timeOnPageStart = Date.now();
  }
};

/**
 * Form Events
 */
export const formEvents = {
  /**
   * Track form start
   */
  formStart(formId, formName) {
    ga4.track('form_start', {
      form_id: formId,
      form_name: formName
    });
  },

  /**
   * Track form submit
   */
  formSubmit(formId, formName, success = true) {
    ga4.track('form_submit', {
      form_id: formId,
      form_name: formName,
      success: success
    });
  },

  /**
   * Track email signup
   */
  emailSignup(signupSource, preferences = []) {
    ga4.track('email_signup', {
      signup_source: signupSource,
      preferences: preferences.join(',')
    });
  },

  /**
   * Track email signup error
   */
  emailSignupError(errorType, errorMessage) {
    ga4.track('email_signup_error', {
      error_type: errorType,
      error_message: errorMessage
    });
  }
};

/**
 * Feature Usage Events
 */
export const featureEvents = {
  /**
   * Track share button click
   */
  shareClick(sharePlatform, contentType = 'page') {
    ga4.track('share_click', {
      share_platform: sharePlatform,
      content_type: contentType
    });
  },

  /**
   * Track share complete
   */
  shareComplete(sharePlatform, contentType = 'page') {
    ga4.track('share_complete', {
      share_platform: sharePlatform,
      content_type: contentType
    });
  },

  /**
   * Track calendar add
   */
  calendarAdd(calendarType, eventType) {
    ga4.track('calendar_add', {
      calendar_type: calendarType,
      event_type: eventType
    });
  },

  /**
   * Track notification enable
   */
  notificationEnable(notificationType) {
    ga4.track('notification_enable', {
      notification_type: notificationType
    });
  },

  /**
   * Track notification disable
   */
  notificationDisable(notificationType) {
    ga4.track('notification_disable', {
      notification_type: notificationType
    });
  },

  /**
   * Track PWA install trigger
   */
  pwaInstall(installSource) {
    ga4.track('pwa_install', {
      install_source: installSource
    });
  },

  /**
   * Track PWA install complete
   */
  pwaInstallComplete(platform) {
    ga4.track('pwa_install_complete', {
      platform: platform
    });
  },

  /**
   * Track export action
   */
  exportData(exportFormat, contentType = 'data') {
    ga4.track('export_data', {
      export_format: exportFormat,
      content_type: contentType
    });
  }
};

/**
 * Conversion Events
 */
export const conversionEvents = {
  /**
   * Track signup
   */
  signup(signupMethod, signupSource) {
    ga4.track('signup', {
      signup_method: signupMethod,
      signup_source: signupSource
    });
  },

  /**
   * Track subscription
   */
  subscription(subscriptionType, tier = 'free') {
    ga4.track('subscription', {
      subscription_type: subscriptionType,
      tier: tier
    });
  },

  /**
   * Track widget embed code copy
   */
  widgetEmbed(widgetType, customization = {}) {
    ga4.track('widget_embed', {
      widget_type: widgetType,
      customization: JSON.stringify(customization)
    });
  }
};

/**
 * Error Events
 */
export const errorEvents = {
  /**
   * Track application error
   */
  error(errorType, errorMessage, errorStack = '') {
    ga4.track('error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit length
      error_stack: errorStack.substring(0, 500)
    });
  },

  /**
   * Track API error
   */
  apiError(endpoint, statusCode, errorMessage) {
    ga4.track('api_error', {
      endpoint: endpoint,
      status_code: statusCode,
      error_message: errorMessage.substring(0, 100)
    });
  },

  /**
   * Track resource load error
   */
  loadError(resourceType, resourceUrl) {
    ga4.track('load_error', {
      resource_type: resourceType,
      resource_url: resourceUrl
    });
  },

  /**
   * Initialize global error tracking
   */
  initErrorTracking() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.error(
        'unhandled_error',
        event.message || 'Unknown error',
        event.error?.stack || ''
      );
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(
        'unhandled_promise',
        event.reason?.message || String(event.reason),
        event.reason?.stack || ''
      );
    });
  }
};

/**
 * Initialize all automatic tracking
 */
export function initAutoTracking() {
  engagementEvents.initScrollTracking();
  engagementEvents.initTimeTracking();
  errorEvents.initErrorTracking();
  
  // Track initial page view
  ga4.pageView();
}

export default {
  navigation: navigationEvents,
  interaction: interactionEvents,
  engagement: engagementEvents,
  form: formEvents,
  feature: featureEvents,
  conversion: conversionEvents,
  error: errorEvents,
  initAutoTracking
};
