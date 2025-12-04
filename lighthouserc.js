module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:6006',
        'http://localhost:6006/?path=/story/design-system-overview--overview',
        'http://localhost:6006/?path=/story/design-system-components-button--all-variants',
        'http://localhost:6006/?path=/story/design-system-components-card--product-grid',
        'http://localhost:6006/?path=/story/design-system-components-badge--ecommerce-badges',
        'http://localhost:6006/?path=/story/design-system-components-input--form-example',
      ],
      startServerCommand: 'npm run storybook',
      startServerReadyPattern: 'Local:.*http://localhost:6006',
      startServerReadyTimeout: 60000,
    },
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility specific
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',

        // Performance specific
        'unused-css-rules': ['warn', { maxLength: 10 }],
        'unused-javascript': ['warn', { maxLength: 10 }],
        'render-blocking-resources': ['warn', { maxLength: 5 }],

        // Best practices
        'is-on-https': 'off', // Disabled for local development
        'uses-http2': 'off', // Disabled for Storybook
        charset: 'error',
        doctype: 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports',
    },
  },
}

// Production configuration
if (process.env.NODE_ENV === 'production') {
  module.exports.ci.collect.url = [
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/',
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/?path=/story/design-system-overview--overview',
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/?path=/story/design-system-components-button--all-variants',
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/?path=/story/design-system-components-card--product-grid',
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/?path=/story/design-system-components-badge--ecommerce-badges',
    'https://santiagoXOR.github.io/pinteya-ecommerce/storybook/?path=/story/design-system-components-input--form-example',
  ]

  // Remove server start for production
  delete module.exports.ci.collect.startServerCommand
  delete module.exports.ci.collect.startServerReadyPattern
  delete module.exports.ci.collect.startServerReadyTimeout

  // Enable HTTPS checks for production
  module.exports.ci.assert.assertions['is-on-https'] = 'error'
}
