module.exports = {
  ci: {
    collect: {
      url: ['https://www.pintemas.com'],
      numberOfRuns: 3,
      settings: {
        throttlingMethod: 'simulate',
        throttling: {
          cpuSlowdownMultiplier: 4,
          rttMs: 150,
          throughputKbps: 1600,
        },
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 915,
        },
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

