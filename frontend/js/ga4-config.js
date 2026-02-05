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
