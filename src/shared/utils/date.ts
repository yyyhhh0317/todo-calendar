/**
 * 日期相关工具函数
 * 基于 date-fns，统一周起始为周一
 */
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  addMonths,
  format,
  isSameDay,
  isToday,
  differenceInCalendarDays,
  type Locale,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

/** 周一作为一周开始的配置 */
export const WEEK_STARTS_ON: 1 = 1 // Monday

/** 默认 locale */
export const defaultLocale: Locale = zhCN

/** 日期格式：YYYY-MM-DD */
export const DATE_FORMAT = 'yyyy-MM-dd'

/**
 * 获取某天的 ISO 日期字符串（YYYY-MM-DD）
 */
export function toDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, DATE_FORMAT)
}

/**
 * 从日期字符串构造 Date（避免时区偏移，按本地时间解析）
 */
export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * 获取某日所在周的周一
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON, locale: defaultLocale })
}

/**
 * 获取某日所在周的周日
 */
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON, locale: defaultLocale })
}

/**
 * 获取某日所在周的完整 7 天数组
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  return eachDayOfInterval({
    start: getWeekStart(date),
    end: getWeekEnd(date),
  })
}

/**
 * 获取某日所在月的第一天
 */
export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date)
}

/**
 * 获取某日所在月的最后一天
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return endOfMonth(date)
}

/**
 * 获取月视图网格所需的日期数组（通常 6 行 × 7 列 = 42 天，包含前后月补齐）
 * 以周一为每周开始
 */
export function getMonthGridDays(date: Date = new Date()): Date[] {
  const monthStart = getMonthStart(date)
  const monthEnd = getMonthEnd(date)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON, locale: defaultLocale })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON, locale: defaultLocale })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

/**
 * 日期导航：上一周 / 下一周 / 上一月 / 下一月
 */
export function navigateWeek(date: Date, direction: 'prev' | 'next'): Date {
  return addWeeks(date, direction === 'prev' ? -1 : 1)
}

export function navigateMonth(date: Date, direction: 'prev' | 'next'): Date {
  return addMonths(date, direction === 'prev' ? -1 : 1)
}

/**
 * 格式化日期头，例如 "周一 8/3"
 */
export function formatDayHeader(date: Date): string {
  return format(date, 'EE M/d', { locale: defaultLocale })
}

/**
 * 格式化短日期，例如 "8月3日"
 */
export function formatShortDate(date: Date): string {
  return format(date, 'M月d日', { locale: defaultLocale })
}

/**
 * 格式化完整日期，例如 "2026年8月3日 周一"
 */
export function formatFullDate(date: Date): string {
  return format(date, 'yyyy年M月d日 EEEE', { locale: defaultLocale })
}

/**
 * 格式化月份标题，例如 "2026年8月"
 */
export function formatMonthTitle(date: Date): string {
  return format(date, 'yyyy年M月', { locale: defaultLocale })
}

/**
 * 格式化周范围标题，例如 "8月3日 - 8月9日"
 */
export function formatWeekRange(date: Date): string {
  const start = getWeekStart(date)
  const end = getWeekEnd(date)
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'M月d日', { locale: defaultLocale })} - ${format(end, 'd日', { locale: defaultLocale })}`
  }
  return `${format(start, 'M月d日', { locale: defaultLocale })} - ${format(end, 'M月d日', { locale: defaultLocale })}`
}

/**
 * 判断是否为今天
 */
export function checkIsToday(date: Date): boolean {
  return isToday(date)
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

/**
 * 判断某天是否属于给定月份（用于月视图中区分当月与补齐日）
 */
export function isInSameMonth(date: Date, monthRef: Date): boolean {
  return date.getMonth() === monthRef.getMonth() && date.getFullYear() === monthRef.getFullYear()
}

/**
 * 计算两个日期之间的天数差
 */
export function daysBetween(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from)
}
