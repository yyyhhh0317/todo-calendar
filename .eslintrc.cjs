module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', '_shared', 'playwright-report', 'test-results'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    // 测试文件（单测 / E2E / 配置文件）：不适用 react-refresh 组件导出规则
    {
      files: ['e2e/**', 'playwright.config.ts', 'src/**/*.test.ts'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}
