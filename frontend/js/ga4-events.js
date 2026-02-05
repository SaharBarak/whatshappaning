/**
 * GA4 Event Tracking Module
 * Standardized event tracking implementations
 */

import ga4 from './ga4.js';

export const navigationEvents = {
  linkClick(linkText, linkUrl, navSection = 'main') {
    ga4.track('navigation_click', { link_text: linkText, link_url: linkUrl, nav_section: navSection });
  },
  externalLink(linkUrl) {
    const url = new URL(linkUrl, window.location.origin);
    ga4.track('external_link', { link_url: linkUrl, link_domain: url.hostname });
  },
  backToTop(scrollDepth) {
    ga4.track('back_to_top', { scroll_depth: scrollDepth });
  }
};

export const interactionEvents = {
  moduleExpand(moduleId, moduleName) {
    ga4.track('module_expand', { module_id: moduleId, module_name: moduleName });
  },
  moduleCollapse(moduleId, moduleName) {
    ga4.track('module_collapse', { module_id: moduleId, module_name: moduleName });
  },
  predictionClick(predictionId, outcomeType, confidence) {
    ga4.track('prediction_click', { prediction_id: predictionId, outcome_type: outcomeType, confidence });
  },
  alertDismiss(alertId, alertType) {
    ga4.track('alert_dismiss', { alert_id: alertId, alert_type: alertType });
  },
  themeChange(fromTheme, toTheme) {
    ga4.track('theme_change', { from_theme: fromTheme, to_theme: toTheme });
  },
  languageChange(fromLang, toLang) {
    ga4.track('language_change', { from_lang: fromLang, to_lang: toLang });
  }
};

export const engagementEvents = {
  _scrollMilestones: new Set(),
  _timeOnPageStart: Date.now(),
  _timeOnPageMilestones: new Set(),

  initScrollTracking() {
    const milestones = [25, 50, 75, 90, 100];
    const trackScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !this._scrollMilestones.has(milestone)) {
          this._scrollMilestones.add(milestone);
          ga4.track('scroll_depth', { percent_scrolled: milestone, pixel_depth: window.scrollY });
        }
      });
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { trackScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  },

  initTimeTracking() {
    const milestones = [30, 60, 180, 300, 600];
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - this._timeOnPageStart) / 1000);
      milestones.forEach(milestone => {
        if (elapsed >= milestone && !this._timeOnPageMilestones.has(milestone)) {
          this._timeOnPageMilestones.add(milestone);
          ga4.track('time_on_page', { seconds_elapsed: milestone, page_path: window.location.pathname });
        }
      });
    }, 5000);
  },

  contentVisible(sectionId, visibilityTime = 0) {
    ga4.track('content_visibility', { section_id: sectionId, visibility_time: visibilityTime });
  },
  chartInteraction(chartId, interactionType) {
    ga4.track('chart_interaction', { chart_id: chartId, interaction_type: interactionType });
  },
  reset() {
    this._scrollMilestones.clear();
    this._timeOnPageMilestones.clear();
    this._timeOnPageStart = Date.now();
  }
};

export const formEvents = {
  formStart(formId, formName) { ga4.track('form_start', { form_id: formId, form_name: formName }); },
  formSubmit(formId, formName, success = true) { ga4.track('form_submit', { form_id: formId, form_name: formName, success }); },
  emailSignup(signupSource, preferences = []) { ga4.track('email_signup', { signup_source: signupSource, preferences: preferences.join(',') }); },
  emailSignupError(errorType, errorMessage) { ga4.track('email_signup_error', { error_type: errorType, error_message: errorMessage }); }
};

export const featureEvents = {
  shareClick(sharePlatform, contentType = 'page') { ga4.track('share_click', { share_platform: sharePlatform, content_type: contentType }); },
  shareComplete(sharePlatform, contentType = 'page') { ga4.track('share_complete', { share_platform: sharePlatform, content_type: contentType }); },
  calendarAdd(calendarType, eventType) { ga4.track('calendar_add', { calendar_type: calendarType, event_type: eventType }); },
  notificationEnable(notificationType) { ga4.track('notification_enable', { notification_type: notificationType }); },
  notificationDisable(notificationType) { ga4.track('notification_disable', { notification_type: notificationType }); },
  pwaInstall(installSource) { ga4.track('pwa_install', { install_source: installSource }); },
  pwaInstallComplete(platform) { ga4.track('pwa_install_complete', { platform }); },
  exportData(exportFormat, contentType = 'data') { ga4.track('export_data', { export_format: exportFormat, content_type: contentType }); }
};

export const conversionEvents = {
  signup(signupMethod, signupSource) { ga4.track('signup', { signup_method: signupMethod, signup_source: signupSource }); },
  subscription(subscriptionType, tier = 'free') { ga4.track('subscription', { subscription_type: subscriptionType, tier }); },
  widgetEmbed(widgetType, customization = {}) { ga4.track('widget_embed', { widget_type: widgetType, customization: JSON.stringify(customization) }); }
};

export const errorEvents = {
  error(errorType, errorMessage, errorStack = '') {
    ga4.track('error', { error_type: errorType, error_message: errorMessage.substring(0, 100), error_stack: errorStack.substring(0, 500) });
  },
  apiError(endpoint, statusCode, errorMessage) {
    ga4.track('api_error', { endpoint, status_code: statusCode, error_message: errorMessage.substring(0, 100) });
  },
  loadError(resourceType, resourceUrl) {
    ga4.track('load_error', { resource_type: resourceType, resource_url: resourceUrl });
  },
  initErrorTracking() {
    window.addEventListener('error', (event) => {
      this.error('unhandled_error', event.message || 'Unknown error', event.error?.stack || '');
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.error('unhandled_promise', event.reason?.message || String(event.reason), event.reason?.stack || '');
    });
  }
};

export function initAutoTracking() {
  engagementEvents.initScrollTracking();
  engagementEvents.initTimeTracking();
  errorEvents.initErrorTracking();
  ga4.pageView();
}

export default { navigation: navigationEvents, interaction: interactionEvents, engagement: engagementEvents, form: formEvents, feature: featureEvents, conversion: conversionEvents, error: errorEvents, initAutoTracking };
