/**
 * Frontend Configuration
 * Handles API URL detection and application settings
 */

// Detect API URL based on environment
function getApiUrl() {
  const hostname = window.location.hostname;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // GitHub Pages deployment
  if (hostname.includes('github.io')) {
    return 'https://whatshappening-api-89qq.onrender.com';
  }

  // Render.com static site deployment
  if (hostname.includes('onrender.com')) {
    return 'https://whatshappening-api-89qq.onrender.com';
  }

  // Vercel deployment
  if (hostname.includes('vercel.app')) {
    return 'https://whatshappening-api-89qq.onrender.com';
  }

  // Netlify deployment
  if (hostname.includes('netlify.app')) {
    return 'https://whatshappening-api-89qq.onrender.com';
  }

  // Production - adjust domain as needed
  if (window.location.protocol === 'https:') {
    return window.API_URL || `${window.location.protocol}//${hostname.replace('www.', 'api.')}`;
  }

  return 'http://localhost:3000';
}

export const config = {
  // API Settings
  apiUrl: getApiUrl(),

  // Refresh intervals (in milliseconds)
  autoRefreshInterval: 30 * 60 * 1000, // 30 minutes
  staleDataThreshold: 60 * 60 * 1000,  // 1 hour
  recentDataThreshold: 5 * 60 * 1000,  // 5 minutes

  // Cache settings
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes

  // UI Settings
  animationDuration: 300, // ms
  expandAnimationDuration: 300, // ms

  // Pattern alert threshold
  patternMatchThreshold: 0.8, // 80%

  // Prediction display
  maxVisibleFactors: 5,

  // Module order for display
  moduleOrder: [
    'moon', 'tzolkin', 'dreamspell', 'parasha',
    'gematria', 'numerology', 'iching', 'tarot',
    'solar', 'schumann', 'cosmic', 'astrology',
    'markets', 'geophysical', 'sentiment', 'news'
  ],

  // Module display configuration
  modules: {
    moon: { icon: '🌙', name: 'MOON' },
    tzolkin: { icon: '🔆', name: 'TZOLKIN' },
    dreamspell: { icon: '🌈', name: 'DREAMSPELL' },
    parasha: { icon: '📜', name: 'PARASHA' },
    gematria: { icon: '🔢', name: 'GEMATRIA' },
    numerology: { icon: '🔮', name: 'NUMEROLOGY' },
    iching: { icon: '☯️', name: 'I CHING' },
    tarot: { icon: '🎴', name: 'TAROT' },
    solar: { icon: '☀️', name: 'SOLAR' },
    schumann: { icon: '🌍', name: 'SCHUMANN' },
    cosmic: { icon: '☄️', name: 'COSMIC' },
    astrology: { icon: '♈', name: 'ASTROLOGY' },
    markets: { icon: '📈', name: 'MARKETS' },
    geophysical: { icon: '🌍', name: 'GEO' },
    sentiment: { icon: '😰', name: 'SENTIMENT' },
    news: { icon: '📰', name: 'NEWS' }
  },

  // Outcome display names
  outcomeNames: {
    spx_direction: 'S&P 500 Direction',
    spx_volatile: 'Market Volatility',
    btc_direction: 'Bitcoin Direction',
    btc_volatile: 'BTC Volatility',
    vix_spike: 'VIX Spike',
    gold_direction: 'Gold Direction',
    major_quake: 'Major Earthquake (M6+)',
    quake_above_avg: 'Above Avg Seismic Activity',
    geomag_storm: 'Geomagnetic Storm',
    sentiment_drop: 'Sentiment Drop',
    fear_spike: 'Fear Spike'
  },

  // Feature display names
  featureNames: {
    mercury_retrograde: 'Mercury Retrograde',
    venus_retrograde: 'Venus Retrograde',
    mars_retrograde: 'Mars Retrograde',
    moon_phase: 'Moon Phase',
    moon_sign: 'Moon Sign',
    moon_void_of_course: 'Void of Course Moon',
    kp_index: 'Kp Index',
    vix: 'VIX Level',
    fear_greed_crypto: 'Crypto Fear/Greed',
    fear_greed_cnn: 'CNN Fear/Greed',
    sun_sign: 'Sun Sign',
    tzolkin_tone: 'Tzolkin Tone',
    tzolkin_sign: 'Tzolkin Day Sign',
    dreamspell_kin: 'Dreamspell Kin',
    numerology_day: 'Universal Day Number',
    day_of_week: 'Day of Week',
    eclipse_proximity: 'Eclipse Proximity',
    major_aspects_count: 'Major Aspects',
    planets_retrograde_count: 'Retrograde Planets',
    solar_flare_class: 'Solar Flare Class',
    sunspot_number: 'Sunspot Number',
    solar_wind_speed: 'Solar Wind Speed',
    schumann_amplitude: 'Schumann Amplitude',
    quake_count_24h: 'Quake Count (24h)',
    quake_max_magnitude: 'Max Quake Magnitude'
  }
};

export default config;
