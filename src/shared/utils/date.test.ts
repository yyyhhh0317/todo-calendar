/**
 * 日期工具单测
 */
import { describe, expect, it } from 'vitest'
import {
  toDateKey,
  fromDateKey,
  getWeekStart,
  getWeekEnd,
  getWeekDays,
  getMonthGridDays,
  navigateWeek,
  navigateMonth,
  isSameDate,
  isInSameMonth,
  daysBetween,
  formatWeekRange,
  formatMonthTitle,
} from './date'

describe('toDateKey / fromDateKey', () => {
  it('Date → YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 7, 10))).toBe('2026-08-10')
  })

  it('字符串透传归一化', () => {
    expect(toDateKey('2026-08-10')).toBe('2026-08-10')
  })

  it('YYYY-MM-DD → Date（本地时区，无偏移）', () => {
    const d = fromDateKey('2026-08-10')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(10)
  })

  it('toDateKey(fromDateKey(x)) 恒等', () => {
    expect(toDateKey(fromDateKey('2026-08-10'))).toBe('2026-08-10')
  })
})

describe('周计算（周一起始）', () => {
  const wed = new Date(2026, 7, 12) // 2026-08-12 周三

  it('getWeekStart 返回周一', () => {
    const start = getWeekStart(wed)
    expect(start.getDay()).toBe(1)
    expect(toDateKey(start)).toBe('2026-08-10')
  })

  it('getWeekEnd 返回周日', () => {
    const end = getWeekEnd(wed)
    expect(end.getDay()).toBe(0)
    expect(toDateKey(end)).toBe('2026-08-16')
  })

  it('getWeekDays 返回 7 天且有序', () => {
    const days = getWeekDays(wed)
    expect(days).toHaveLength(7)
    expect(toDateKey(days[0])).toBe('2026-08-10')
    expect(toDateKey(days[6])).toBe('2026-08-16')
  })
})

describe('月视图网格', () => {
  it('2026-08 网格 42 天，从 7 月补齐日开始', () => {
    const days = getMonthGridDays(new Date(2026, 7, 10))
    // 2026-08-01 是周六（周一起始 → 7/27 开始）；8/31 是周一 → endOfWeek 到 9/6，共 6 周
    expect(toDateKey(days[0])).toBe('2026-07-27')
    expect(days.length).toBe(42)
    expect(toDateKey(days[days.length - 1])).toBe('2026-09-06')
  })

  it('包含 8 月所有日期', () => {
    const keys = getMonthGridDays(new Date(2026, 7, 10)).map(toDateKey)
    expect(keys).toContain('2026-08-01')
    expect(keys).toContain('2026-08-31')
  })
})

describe('日期导航', () => {
  it('navigateWeek 前后移动一周', () => {
    const base = new Date(2026, 7, 10)
    expect(toDateKey(navigateWeek(base, 'next'))).toBe('2026-08-17')
    expect(toDateKey(navigateWeek(base, 'prev'))).toBe('2026-08-03')
  })

  it('navigateMonth 前后移动一月', () => {
    const base = new Date(2026, 7, 10)
    expect(toDateKey(navigateMonth(base, 'next'))).toBe('2026-09-10')
    expect(toDateKey(navigateMonth(base, 'prev'))).toBe('2026-07-10')
  })
})

describe('日期判断与区间', () => {
  it('isSameDate 同一天', () => {
    expect(isSameDate(new Date(2026, 7, 10), new Date(2026, 7, 10))).toBe(true)
    expect(isSameDate(new Date(2026, 7, 10), new Date(2026, 7, 11))).toBe(false)
  })

  it('isInSameMonth 属于同一月', () => {
    expect(isInSameMonth(new Date(2026, 7, 5), new Date(2026, 7, 20))).toBe(true)
    expect(isInSameMonth(new Date(2026, 6, 31), new Date(2026, 7, 1))).toBe(false)
  })

  it('daysBetween 天数差', () => {
    expect(daysBetween(new Date(2026, 7, 1), new Date(2026, 7, 10))).toBe(9)
  })
})

describe('标题格式化', () => {
  it('formatMonthTitle', () => {
    expect(formatMonthTitle(new Date(2026, 7, 10))).toBe('2026年8月')
  })

  it('formatWeekRange 同月简写', () => {
    expect(formatWeekRange(new Date(2026, 7, 12))).toBe('8月10日 - 16日')
  })
})
