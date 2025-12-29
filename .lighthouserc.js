module.exports = {
  ci: {
    collect: {
      url: ['https://www.pinteya.com'],
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
}

