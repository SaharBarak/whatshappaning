/**
 * Lightweight Error Tracking Module
 * 
 * Captures unhandled errors, promise rejections, and performance issues.
 * Reports to the backend /api/errors endpoint when available,
 * falls back to console logging.
 * 
 * No external dependencies (Sentry-free, lightweight alternative).
 */

const ErrorTracker = (() => {
  'use strict';

  const CONFIG = {
    maxErrors: 50,           // Max errors to store in memory
    flushInterval: 30000,    // Flush to backend every 30s
    maxRetries: 2,           // Max retry attempts for failed reports
    sampleRate: 1.0,         // Report 100% of errors (reduce in high-traffic)
    enabled: true
  };

  const errorBuffer = [];
  let flushTimer = null;
  let backendUrl = null;

  /**
   * Initialize error tracking
   * @param {Object} options - Configuration options
   * @param {string} options.backendUrl - Backend API base URL
   * @param {number} options.sampleRate - Error sampling rate (0-1)
   */
  function init(options = {}) {
    if (options.backendUrl) backendUrl = options.backendUrl;
    if (options.sampleRate !== undefined) CONFIG.sampleRate = options.sampleRate;

    // Global error handler
    window.addEventListener('error', (event) => {
      captureError({
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || null
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      captureError({
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || null
      });
    });

    // Performance observer for long tasks (>50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Only report tasks >100ms
              captureError({
                type: 'long_task',
                message: `Long task detected: ${Math.round(entry.duration)}ms`,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch {
        // PerformanceObserver for longtask not supported
      }

      // Core Web Vitals tracking
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            reportMetric(entry.name, entry.startTime);
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });
      } catch {
        // Paint observer not supported
      }

      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            reportMetric('largest-contentful-paint', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // LCP observer not supported
      }

      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            reportMetric('cumulative-layout-shift', clsValue);
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {
        // CLS observer not supported
      }
    }

    // Periodic flush
    flushTimer = setInterval(flush, CONFIG.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', flush);

    console.debug('[ErrorTracker] Initialized');
  }

  /**
   * Capture an error event
   */
  function captureError(errorData) {
    if (!CONFIG.enabled) return;
    if (Math.random() > CONFIG.sampleRate) return;

    const entry = {
      ...errorData,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    errorBuffer.push(entry);

    // Trim buffer if too large
    if (errorBuffer.length > CONFIG.maxErrors) {
      errorBuffer.splice(0, errorBuffer.length - CONFIG.maxErrors);
    }

    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('[ErrorTracker]', entry.type, entry.message);
    }
  }

  /**
   * Report a performance metric
   */
  function reportMetric(name, value) {
    captureError({
      type: 'performance_metric',
      message: `${name}: ${Math.round(value * 100) / 100}`,
      metric: name,
      value: value
    });
  }

  /**
   * Manually capture an error
   */
  function capture(error, context = {}) {
    captureError({
      type: 'manual',
      message: error.message || String(error),
      stack: error.stack || null,
      ...context
    });
  }

  /**
   * Flush error buffer to backend
   */
  async function flush() {
    if (errorBuffer.length === 0) return;
    if (!backendUrl) return;

    const errors = errorBuffer.splice(0, errorBuffer.length);

    try {
      const response = await fetch(`${backendUrl}/api/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true // Ensure delivery on page unload
      });

      if (!response.ok) {
        // Put errors back in buffer for retry
        errorBuffer.unshift(...errors.slice(0, CONFIG.maxErrors - errorBuffer.length));
      }
    } catch {
      // Network failure - put errors back
      errorBuffer.unshift(...errors.slice(0, CONFIG.maxErrors - errorBuffer.length));
    }
  }

  /**
   * Get current error buffer (for debugging)
   */
  function getErrors() {
    return [...errorBuffer];
  }

  /**
   * Destroy the error tracker
   */
  function destroy() {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    CONFIG.enabled = false;
  }

  return { init, capture, flush, getErrors, destroy };
})();

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
  // Will be initialized by app.js with proper backend URL
  window.ErrorTracker = ErrorTracker;
}

export default ErrorTracker;
