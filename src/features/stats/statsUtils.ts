/**
 * 统计计算工具函数
 */
import type { Task, TaskBlock } from '@/features/tasks/taskTypes'
import type { ScheduleEntry } from '@/features/schedule/scheduleTypes'
import { toDateKey } from '@/shared/utils/date'
import { eachDayOfInterval, subDays } from 'date-fns'

/** 每日完成数 */
export interface DailyCompletion {
  date: string
  count: number
}

/** 每日排期时长（分钟） */
export interface DailyScheduled {
  date: string
  minutes: number
}

/**
 * 获取最近 N 天的日期数组（含今天）
 */
export function getLastNDays(n: number): string[] {
  const today = new Date()
  const start = subDays(today, n - 1)
  return eachDayOfInterval({ start, end: today }).map(toDateKey)
}

/**
 * 统计每日完成任务数
 */
export function getDailyCompletions(tasks: Task[], days: string[]): DailyCompletion[] {
  const map = new Map<string, number>()
  for (const t of tasks) {
    if (t.status === 'done' && t.completedDate) {
      map.set(t.completedDate, (map.get(t.completedDate) ?? 0) + 1)
    }
  }
  return days.map((date) => ({ date, count: map.get(date) ?? 0 }))
}

/**
 * 统计每日排期时长（分钟）
 */
export function getDailyScheduled(
  entries: ScheduleEntry[],
  blocks: TaskBlock[],
  days: string[],
): DailyScheduled[] {
  const blockMap = new Map(blocks.map((b) => [b.id, b]))
  const map = new Map<string, number>()
  for (const e of entries) {
    const block = blockMap.get(e.blockId)
    if (!block) continue
    map.set(e.date, (map.get(e.date) ?? 0) + block.durationMinutes)
  }
  return days.map((date) => ({ date, minutes: map.get(date) ?? 0 }))
}

/** 整体统计摘要 */
export interface StatsSummary {
  totalTasks: number
  doneTasks: number
  completionRate: number
  totalEstimatedMinutes: number
  totalActualMinutes: number
  totalScheduledMinutes: number
}

/**
 * 计算整体统计摘要
 */
export function getStatsSummary(
  tasks: Task[],
  entries: ScheduleEntry[],
  blocks: TaskBlock[],
): StatsSummary {
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const totalEstimatedMinutes = tasks.reduce((s, t) => s + t.estimatedMinutes, 0)
  const totalActualMinutes = tasks.reduce((s, t) => s + (t.totalMinutesSpent ?? 0), 0)
  const blockMap = new Map(blocks.map((b) => [b.id, b]))
  const totalScheduledMinutes = entries.reduce((s, e) => {
    const block = blockMap.get(e.blockId)
    return s + (block?.durationMinutes ?? 0)
  }, 0)

  return {
    totalTasks,
    doneTasks,
    completionRate: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    totalEstimatedMinutes,
    totalActualMinutes,
    totalScheduledMinutes,
  }
}

/** 热力图单元格 */
export interface HeatmapCell {
  date: string
  count: number
  weekIndex: number
  dayOfWeek: number // 0=周一, 6=周日
}

/**
 * 生成热力图数据（按周排列）
 */
export function getHeatmapData(tasks: Task[], weeks: number): HeatmapCell[][] {
  const totalDays = weeks * 7
  const days = getLastNDays(totalDays)

  const completionMap = new Map<string, number>()
  for (const t of tasks) {
    if (t.status === 'done' && t.completedDate) {
      completionMap.set(t.completedDate, (completionMap.get(t.completedDate) ?? 0) + 1)
    }
  }

  // 按周分组（每周从周一开始）
  const result: HeatmapCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d
      const date = days[dayOffset]
      if (!date) continue
      week.push({
        date,
        count: completionMap.get(date) ?? 0,
        weekIndex: w,
        dayOfWeek: d,
      })
    }
    result.push(week)
  }
  return result
}

/**
 * 根据完成数返回热力图颜色等级（0-4）
 */
export function getHeatmapLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}
