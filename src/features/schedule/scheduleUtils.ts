/**
 * 排期相关工具函数
 * 包含冲突检测、时间计算等
 */
import type { ScheduleEntry } from './scheduleTypes'
import { calcEndTime, timeStringToMinutes } from '@/shared/utils/time'

/**
 * 检测新的排期是否会与已存在的排期发生时间冲突
 * 冲突定义：同一天内，时间区间 [startTime, endTime) 有重叠
 *
 * @param date 目标日期 YYYY-MM-DD
 * @param startTime 开始时间 HH:mm
 * @param durationMinutes 时长（分钟）
 * @param existingEntries 同一视图已有的排期记录
 * @param excludeEntryId 需要排除的 entry ID（用于移动场景）
 * @returns 冲突的 entry 数组，空数组表示无冲突
 */
export function detectConflicts(
  date: string,
  startTime: string,
  durationMinutes: number,
  existingEntries: ScheduleEntry[],
  excludeEntryId?: string,
): ScheduleEntry[] {
  const newStart = timeStringToMinutes(startTime)
  const newEnd = newStart + durationMinutes

  return existingEntries.filter((entry) => {
    if (entry.date !== date) return false
    if (entry.id === excludeEntryId) return false
    if (!entry.startTime) return false

    const existStart = timeStringToMinutes(entry.startTime)
    const existEnd = entry.endTime
      ? timeStringToMinutes(entry.endTime)
      : existStart + 60 // 无 endTime 时默认 60 分钟

    // 区间重叠：newStart < existEnd && existStart < newEnd
    return newStart < existEnd && existStart < newEnd
  })
}

/**
 * 根据开始时间和时长生成完整的 ScheduleEntry 输入
 * 自动计算 endTime
 */
export function buildScheduleEntryInput(
  taskId: string,
  blockId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  viewSource: 'week' | 'month',
): Omit<ScheduleEntry, 'id'> {
  return {
    taskId,
    blockId,
    date,
    startTime,
    endTime: calcEndTime(startTime, durationMinutes),
    viewSource,
  }
}

/**
 * 获取某天的所有排期（按开始时间排序）
 */
export function getEntriesForDate(
  entries: ScheduleEntry[],
  date: string,
): ScheduleEntry[] {
  return entries
    .filter((e) => e.date === date)
    .sort((a, b) => {
      const aTime = a.startTime ? timeStringToMinutes(a.startTime) : 9999
      const bTime = b.startTime ? timeStringToMinutes(b.startTime) : 9999
      return aTime - bTime
    })
}

/**
 * 计算某天的总排期时长（分钟）
 */
export function getTotalScheduledMinutesForDate(
  entries: ScheduleEntry[],
  date: string,
): number {
  return getEntriesForDate(entries, date).reduce((sum, e) => {
    if (!e.startTime || !e.endTime) return sum
    return sum + (timeStringToMinutes(e.endTime) - timeStringToMinutes(e.startTime))
  }, 0)
}
