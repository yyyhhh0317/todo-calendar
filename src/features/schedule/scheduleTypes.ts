/**
 * 排期相关类型定义
 */

/** 排期来源视图 */
export type ScheduleViewSource = 'week' | 'month'

/** 排期记录 - 描述"某个任务块被安排到哪里" */
export interface ScheduleEntry {
  id: string
  taskId: string
  blockId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm，月视图日期级安排可为空 */
  startTime?: string
  /** HH:mm，月视图日期级安排可为空 */
  endTime?: string
  viewSource: ScheduleViewSource
}

/** 极重要日期 - 日期级高亮，独立于任务优先级 */
export interface ImportantDay {
  id: string
  /** YYYY-MM-DD */
  date: string
  title?: string
  importance: 'important' | 'critical'
  /** ISO datetime，用于日期目标倒计时 */
  targetAt?: string
}
