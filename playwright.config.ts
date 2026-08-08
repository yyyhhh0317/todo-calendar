import { defineConfig } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'

/**
 * Playwright E2E 配置
 * - webServer 自动启动 vite dev server
 * - 全链路用例：任务创建 → 拆分 → 拖拽排期 → 完成 → 计时
 * - outputDir 放系统临时目录，避免本地 safe-delete 沙箱拦截 test-results 清理
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(os.tmpdir(), 'todo-calendar-playwright'),
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ['list'],
        [
          'html',
          {
            open: 'never',
            outputFolder: path.join(os.tmpdir(), 'todo-calendar-playwright-report'),
          },
        ],
      ]
    : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
