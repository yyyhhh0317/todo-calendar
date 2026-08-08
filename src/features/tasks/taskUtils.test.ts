/**
 * 任务工具与任务类型单测
 */
import { describe, expect, it } from 'vitest'
import { getTaskProgress } from './taskUtils'
import { shouldShowInDayView, type Task } from './taskTypes'

function makeTask(partial: Partial<Task>): Task {
  return {
    id: 't1',
    title: '任务',
    estimatedMinutes: 60,
    importance: 'normal',
    isStarred: false,
    status: 'todo',
    totalMinutesSpent: 0,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...partial,
  }
}

describe('getTaskProgress 进度计算', () => {
  it('空块返回 0 进度', () => {
    expect(getTaskProgress([])).toEqual({ done: 0, scheduled: 0, total: 0, percent: 0 })
  })

  it('部分完成计算正确百分比', () => {
    const blocks = [
      { status: 'done' },
      { status: 'scheduled' },
      { status: 'unscheduled' },
      { status: 'done' },
    ]
    expect(getTaskProgress(blocks)).toEqual({ done: 2, scheduled: 1, total: 4, percent: 50 })
  })

  it('全部完成 100%', () => {
    const blocks = [{ status: 'done' }, { status: 'done' }]
    expect(getTaskProgress(blocks).percent).toBe(100)
  })
})

describe('shouldShowInDayView 日视图展示过滤', () => {
  const today = '2026-08-08'

  it('未完成任务始终显示', () => {
    const task = makeTask({ status: 'todo', completedDate: undefined })
    expect(shouldShowInDayView(task, '2026-08-08', today)).toBe(true)
  })

  it('已完成且当天完成且选中今天 → 显示', () => {
    const task = makeTask({ status: 'done', completedDate: today })
    expect(shouldShowInDayView(task, today, today)).toBe(true)
  })

  it('已完成且当天完成但选中其他日期 → 不显示', () => {
    const task = makeTask({ status: 'done', completedDate: today })
    expect(shouldShowInDayView(task, '2026-08-09', today)).toBe(false)
  })

  it('已完成且星标 → 选中完成日期时显示（作为纪念保留）', () => {
    const task = makeTask({ status: 'done', completedDate: '2026-08-01', isStarred: true })
    expect(shouldShowInDayView(task, '2026-08-01', today)).toBe(true)
  })

  it('已完成且星标但选中其他日期 → 不显示', () => {
    const task = makeTask({ status: 'done', completedDate: '2026-08-01', isStarred: true })
    expect(shouldShowInDayView(task, '2026-08-02', today)).toBe(false)
  })

  it('已完成且非今天完成 → 不显示（除非星标）', () => {
    const task = makeTask({ status: 'done', completedDate: '2026-08-01' })
    expect(shouldShowInDayView(task, today, today)).toBe(false)
  })
})
