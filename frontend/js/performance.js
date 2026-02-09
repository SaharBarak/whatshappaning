/**
 * Performance Monitoring Module
 *
 * Tracks Core Web Vitals and reports performance metrics.
 * Uses the web-vitals library for accurate measurements when available,
 * falls back to PerformanceObserver API.
 */

// Try to load web-vitals from CDN for more accurate measurements
let webVitalsLoaded = false;
async function loadWebVitals() {
  try {
    const module = await import('https://unpkg.com/web-vitals@4/dist/web-vitals.js');
    if (module) {
      webVitalsLoaded = true;
      // Use web-vitals library for accurate measurements
      module.onLCP((metric) => logMetric('LCP', metric.value, getRating('LCP', metric.value)));
      module.onFID((metric) => logMetric('FID', metric.value, getRating('FID', metric.value)));
      module.onCLS((metric) => logMetric('CLS', metric.value, getRating('CLS', metric.value)));
      module.onFCP((metric) => logMetric('FCP', metric.value, getRating('FCP', metric.value)));
      module.onTTFB((metric) => logMetric('TTFB', metric.value, getRating('TTFB', metric.value)));
      module.onINP((metric) => logMetric('INP', metric.value, getRating('INP', metric.value)));
      console.log('[Web Vitals] Using web-vitals library for accurate measurements');
    }
  } catch (e) {
    console.log('[Web Vitals] web-vitals library unavailable, using PerformanceObserver fallback');
  }
}

// Performance budget thresholds (based on Google recommendations)
const BUDGET = {
  LCP: 2500,   // Largest Contentful Paint: < 2.5s (good)
  FID: 100,    // First Input Delay: < 100ms (good)
  CLS: 0.1,    // Cumulative Layout Shift: < 0.1 (good)
  FCP: 1800,   // First Contentful Paint: < 1.8s (good)
  TTFB: 800,   // Time to First Byte: < 800ms (good)
  INP: 200     // Interaction to Next Paint: < 200ms (good)
};

// Collected metrics
const metrics = {};

/**
 * Get performance rating based on thresholds
 */
function getRating(metric, value) {
  const thresholds = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500]
  };

  const [good, poor] = thresholds[metric] || [Infinity, Infinity];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Log metric to console and store
 */
function logMetric(name, value, rating) {
  metrics[name] = { value, rating, timestamp: Date.now() };

  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  const formatted = name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`;

  console.log(`[Web Vitals] ${emoji} ${name}: ${formatted} (${rating})`);

  // Check against budget
  if (BUDGET[name] && value > BUDGET[name]) {
    console.warn(`[Performance Budget] ${name} exceeds target: ${formatted} > ${BUDGET[name]}${name === 'CLS' ? '' : 'ms'}`);
  }
}

/**
 * Observe Largest Contentful Paint (LCP)
 */
function observeLCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const value = lastEntry.startTime;
      logMetric('LCP', value, getRating('LCP', value));
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }
}

/**
 * Observe First Input Delay (FID)
 */
function observeFID() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      const value = firstEntry.processingStart - firstEntry.startTime;
      logMetric('FID', value, getRating('FID', value));
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
function observeCLS() {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries = [];

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          // If the entry is within 1s of the last entry and within 5s of first entry, extend session
          if (sessionEntries.length &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            // Start new session
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          // Update CLS if session value is larger
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            logMetric('CLS', clsValue, getRating('CLS', clsValue));
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // CLS not supported
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
function observeFCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        const value = fcpEntry.startTime;
        logMetric('FCP', value, getRating('FCP', value));
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // FCP not supported
  }
}

/**
 * Observe Interaction to Next Paint (INP)
 */
function observeINP() {
  if (!('PerformanceObserver' in window)) return;

  let maxINP = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // INP is the maximum interaction latency
        const duration = entry.duration;
        if (duration > maxINP) {
          maxINP = duration;
          logMetric('INP', maxINP, getRating('INP', maxINP));
        }
      }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (e) {
    // INP not supported
  }
}

/**
 * Measure Time to First Byte (TTFB)
 */
function measureTTFB() {
  if (!('performance' in window) || !performance.getEntriesByType) return;

  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const nav = navEntries[0];
    const value = nav.responseStart - nav.requestStart;
    logMetric('TTFB', value, getRating('TTFB', value));
  }
}

/**
 * Measure resource loading performance
 */
function measureResources() {
  if (!('performance' in window) || !performance.getEntriesByType) return;

  const resources = performance.getEntriesByType('resource');
  const summary = {
    total: resources.length,
    js: { count: 0, size: 0, duration: 0 },
    css: { count: 0, size: 0, duration: 0 },
    img: { count: 0, size: 0, duration: 0 },
    font: { count: 0, size: 0, duration: 0 },
    other: { count: 0, size: 0, duration: 0 }
  };

  for (const resource of resources) {
    const type = getResourceType(resource.name);
    const size = resource.transferSize || 0;
    const duration = resource.duration || 0;

    summary[type].count++;
    summary[type].size += size;
    summary[type].duration += duration;
  }

  // Log summary
  console.log('[Resource Timing]', {
    total: summary.total,
    js: `${summary.js.count} files, ${formatBytes(summary.js.size)}`,
    css: `${summary.css.count} files, ${formatBytes(summary.css.size)}`,
    img: `${summary.img.count} files, ${formatBytes(summary.img.size)}`,
    font: `${summary.font.count} files, ${formatBytes(summary.font.size)}`
  });

  metrics.resources = summary;
}

/**
 * Get resource type from URL
 */
function getResourceType(url) {
  if (url.match(/\.js(\?|$)/i)) return 'js';
  if (url.match(/\.css(\?|$)/i)) return 'css';
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?|$)/i)) return 'img';
  if (url.match(/\.(woff|woff2|ttf|otf|eot)(\?|$)/i)) return 'font';
  return 'other';
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get all collected metrics
 */
function getMetrics() {
  return { ...metrics };
}

/**
 * Send metrics to analytics endpoint (if configured)
 */
function reportMetrics(endpoint) {
  if (!endpoint) return;

  const payload = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    metrics: getMetrics(),
    userAgent: navigator.userAgent,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      rtt: navigator.connection.rtt,
      downlink: navigator.connection.downlink
    } : null
  };

  // Use sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  } else {
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }
}

/**
 * Initialize performance monitoring
 */
function init() {
  // Wait for page load to measure some metrics
  if (document.readyState === 'complete') {
    startObserving();
  } else {
    window.addEventListener('load', startObserving);
  }
}

/**
 * Start all observers
 */
function startObserving() {
  // Try web-vitals library first, fall back to manual observers
  loadWebVitals().then(() => {
    if (!webVitalsLoaded) {
      // Fallback: use manual PerformanceObserver
      setTimeout(() => {
        measureTTFB();
        observeFCP();
        observeLCP();
        observeFID();
        observeCLS();
        observeINP();
      }, 0);
    }

    // Measure resources after a delay
    setTimeout(measureResources, 3000);
  });

  // Report metrics on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Could send to an analytics endpoint here
      console.log('[Web Vitals] Final metrics:', getMetrics());
    }
  });
}

// Export for use
export {
  init,
  getMetrics,
  reportMetrics,
  BUDGET
};

export default {
  init,
  getMetrics,
  reportMetrics,
  BUDGET
};
