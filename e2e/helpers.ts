/**
 * E2E 测试公共工具
 * freshPage fixture：每次测试前清空 localStorage，保证用例隔离
 */
import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ freshPage: Page }>({
  freshPage: async ({ page }, use) => {
    // 先进入应用再清空存储，避免应用启动写入 meta 后残留
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
    await use(page)
  },
})

export { expect }

/** 按标题定位任务卡片（未安排区 / 已安排区均匹配） */
export function taskCard(page: Page, title: string) {
  return page.locator('.task-chip', { hasText: title }).first()
}

/** 迷你计时条 */
export function miniTimer(page: Page) {
  return page.locator('[data-e2e-mini-timer]')
}
