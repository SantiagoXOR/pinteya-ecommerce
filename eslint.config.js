const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  // Extend Next.js ESLint config
  ...compat.extends('next/core-web-vitals'),
  
  // Files to lint
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Disable problematic rules
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-assign-module-variable': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react/display-name': 'off',
      'react/no-children-prop': 'off',
      'react/jsx-no-undef': 'off',
      'import/no-anonymous-default-export': 'off',
      'jsx-a11y/alt-text': 'off',
      'jsx-a11y/role-supports-aria-props': 'off',
    },
  },
  
  // Files to ignore
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'storybook-static/**',
      '.jest-cache/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'tests/reports/**',
      'tests/results.json',
      'tests/results.xml',
      '*.log',
      '*.logs',
      '.env*',
      '*.d.ts',
      '.tsbuildinfo',
      'public/test-images.html',
      '__tests__/performance/lazy-loading.test.ts',
      '.mcp-logs.json',
      'docs/**',
      'design-system/**',
      'supabase/**',
      'sql/**',
      'database/**',
      'scripts/**',
      'config/**',
      'e2e/**',
      '__mocks__/**',
      'src/stories/**',
      'src/lib/clerk.ts',
      'src/types/clerk.ts',
      'vercel.json',
      'vercel-storybook.json',
      'tsconfig.json',
      'next.config.js',
      'jest.config.js',
      'jest.setup.js',
      'lighthouserc.js',
      '.storybook/**',
      'middleware.ts',
      'auth.ts',
      'src/auth.ts',
    ],
  },
]