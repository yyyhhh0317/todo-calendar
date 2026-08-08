/**
 * E2E 全链路测试：任务创建 → 拆分 → 拖拽排期 → 完成 → 计时
 * 注意：右侧任务栏渲染的是 TaskBlockCard（v0.3 两区拆分后按块展示）
 * - 时长显示为「1h」格式（无"预估"前缀）
 * - 拆分入口在未安排区头部的「拆分首批任务」
 * - 完成任务后卡片默认从侧栏消失（shouldShowInDayView 过滤），筛选"已完成"可查看
 */
import { test, expect, taskCard, miniTimer } from './helpers'

test.describe('任务创建', () => {
  test('创建任务后出现在未安排区，显示时长', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    const card = taskCard(page, '写周报')
    await expect(card).toBeVisible()
    await expect(card).toContainText('1h') // TaskBlockCard 时长格式
    await expect(card).toContainText('未安排')
  })

  test('空标题不能提交', async ({ freshPage: page }) => {
    const submit = page.locator('button[type="submit"]').first()
    await expect(submit).toBeDisabled()
    await page.fill('input[placeholder="添加新任务..."]', '   ')
    await expect(submit).toBeDisabled()
  })
})

test.describe('任务拆分', () => {
  test('通过「拆分首批任务」拆为 2 块，显示 #1 #2', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    // 拆分入口：未安排区头部快捷按钮
    await page.getByRole('button', { name: '拆分首批任务' }).click()

    await expect(taskCard(page, '#1')).toBeVisible()
    await expect(taskCard(page, '#2')).toBeVisible()
  })
})

test.describe('拖拽排期', () => {
  test('拖到周视图时间格完成排期', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    const card = taskCard(page, '写周报')
    const handleBox = await card.locator('[class*="cursor-grab"]').first().boundingBox()
    const targetBox = await page.locator('[data-e2e-week-slot]').first().boundingBox()
    expect(handleBox).not.toBeNull()
    expect(targetBox).not.toBeNull()
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
      { steps: 10 },
    )
    await page.mouse.up()

    await expect(page.locator('[data-e2e-placed-task]', { hasText: '写周报' }).first()).toBeVisible()
  })

  test('拖回任务栏取消排期', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    // 先排期（手动 mouse 拖拽，避免 dragTo 对 dnd-kit 的不稳定问题）
    const card = taskCard(page, '写周报')
    const handleBox = await card.locator('[class*="cursor-grab"]').first().boundingBox()
    const targetBox = await page.locator('[data-e2e-week-slot]').first().boundingBox()
    expect(handleBox).not.toBeNull()
    expect(targetBox).not.toBeNull()
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
      { steps: 10 },
    )
    await page.mouse.up()

    const placed = page.locator('[data-e2e-placed-task]', { hasText: '写周报' }).first()
    await expect(placed).toBeVisible()

    // 拖回侧栏：从已安排块拖到侧栏 droppable
    const placedBox = await placed.boundingBox()
    const sidebarBox = await page.locator('[data-e2e-sidebar]').boundingBox()
    expect(placedBox).not.toBeNull()
    expect(sidebarBox).not.toBeNull()
    await page.mouse.move(placedBox!.x + placedBox!.width / 2, placedBox!.y + placedBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      sidebarBox!.x + sidebarBox!.width / 2,
      sidebarBox!.y + sidebarBox!.height / 2,
      { steps: 10 },
    )
    await page.mouse.up()

    await expect(page.locator('[data-e2e-placed-task]', { hasText: '写周报' })).toHaveCount(0)
  })
})

test.describe('任务完成', () => {
  test('完成任务后卡片从侧栏消失，筛选"已完成"可查看', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    const card = taskCard(page, '写周报')
    await card.getByTitle('完成该任务（自动移除排期并记录累计用时）').click()

    // 完成后默认从侧栏消失
    await expect(card).toHaveCount(0)

    // 筛选"已完成"后重新出现
    await page.getByRole('button', { name: '已完成' }).click()
    const doneCard = taskCard(page, '写周报')
    await expect(doneCard).toBeVisible()
    await expect(doneCard).toContainText('已完成')
  })
})

test.describe('专注计时', () => {
  test('启动计时器后显示计时中并出现迷你计时条', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')

    const card = taskCard(page, '写周报')
    await card.getByTitle('开始专注计时').click()

    await expect(card).toContainText('计时中')
    // 迷你计时条出现，秒数开始累加（等待超过 1s）
    const timer = miniTimer(page)
    await expect(timer).toBeVisible()
    await expect(timer).toContainText(/00:0[1-9]/)
  })
})

test.describe('搜索与筛选', () => {
  test('关键词搜索只显示匹配任务', async ({ freshPage: page }) => {
    await page.fill('input[placeholder="添加新任务..."]', '写周报')
    await page.click('button[type="submit"]')
    await page.fill('input[placeholder="添加新任务..."]', '修 Bug')
    await page.click('button[type="submit"]')

    await page.fill('input[placeholder*="搜索"]', '周报')
    await expect(taskCard(page, '写周报')).toBeVisible()
    await expect(taskCard(page, '修 Bug')).toHaveCount(0)
  })
})
