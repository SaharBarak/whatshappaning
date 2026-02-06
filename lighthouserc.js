/**
 * Lighthouse CI Configuration
 * 
 * Used for automated accessibility auditing in CI/CD pipeline.
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './',
      url: [
        'http://localhost/index.html',
        'http://localhost/analytics.html'
      ],
      numberOfRuns: 1
    },
    assert: {
      assertions: {
        // Accessibility assertions
        'categories:accessibility': ['error', { minScore: 0.7 }],
        
        // Specific accessibility audits
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
