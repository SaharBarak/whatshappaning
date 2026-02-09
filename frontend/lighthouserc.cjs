/**
 * Lighthouse CI Configuration
 * 
 * Performance monitoring and accessibility auditing for CI/CD pipeline.
 * Runs on every PR to detect performance regressions.
 * 
 * Performance budgets derived from performance-budget.json
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './',
      url: [
        'http://localhost/index.html',
        'http://localhost/analytics.html'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 2
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      assertions: {
        // ── Performance assertions (from performance-budget.json targets) ──
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],

        // Resource budgets
        'resource-summary:document:size': ['warn', { maxNumericValue: 51200 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 102400 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 30720 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 102400 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 102400 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 512000 }],
        'resource-summary:script:count': ['warn', { maxNumericValue: 15 }],
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 10 }],

        // ── Accessibility assertions ──
        'categories:accessibility': ['error', { minScore: 0.95 }],

        // Critical accessibility audits
        'aria-allowed-attr': 'error',
        'aria-hidden-body': 'error',
        'aria-hidden-focus': 'error',
        'aria-required-attr': 'error',
        'aria-roles': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
        'button-name': 'error',
        'bypass': 'warn',
        'color-contrast': 'warn',
        'document-title': 'error',
        'duplicate-id-active': 'error',
        'duplicate-id-aria': 'error',
        'form-field-multiple-labels': 'warn',
        'frame-title': 'error',
        'heading-order': 'warn',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'input-image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'warn',
        'listitem': 'warn',
        'meta-viewport': 'error',
        'object-alt': 'error',
        'tabindex': 'warn',
        'td-headers-attr': 'warn',
        'th-has-data-cells': 'warn',
        'valid-lang': 'warn',
        'video-caption': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
