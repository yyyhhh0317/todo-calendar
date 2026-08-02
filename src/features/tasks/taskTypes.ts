/**
 * 任务相关类型定义
 * 来自 spec 的 TypeScript 类型草案
 */

/** 任务整体状态 */
export type TaskStatus = 'todo' | 'partial' | 'scheduled' | 'done'

/** 任务块状态 */
export type BlockStatus = 'unscheduled' | 'scheduled' | 'done'

/** 优先级 */
export type Priority = 'low' | 'medium' | 'high'

/** 重要程度 */
export type Importance = 'normal' | 'important' | 'critical'

/** 任务本体 - 描述"要做什么" */
export interface Task {
  id: string
  title: string
  notes?: string
  estimatedMinutes: number
  priority?: Priority
  importance: Importance
  /** ISO datetime，用于任务目标倒计时 */
  targetAt?: string
  /** 完成后是否作为当天纪念保留 */
  isStarred: boolean
  status: TaskStatus
  completedAt?: string
  /** YYYY-MM-DD，用于判断历史日期展示 */
  completedDate?: string
  createdAt: string
  updatedAt: string
}

/** 任务块 - 描述"这件事如何切分" */
export interface TaskBlock {
  id: string
  taskId: string
  title?: string
  /** 该块的时长（分钟） */
  durationMinutes: number
  /** 在任务内的顺序 */
  order: number
  status: BlockStatus
  isStarred: boolean
  completedAt?: string
  /** YYYY-MM-DD，拆分块级完成时记录 */
  completedDate?: string
}

/**
 * 判断任务是否应在某天的日视图/右侧任务栏显示
 * 来自 spec 的展示过滤规则：
 * - 未完成 → 显示
 * - 已完成且当天完成且星标 → 显示
 * - 已完成且今天完成且选中今天 → 显示
 * - 其他已完成 → 不显示
 */
export function shouldShowInDayView(
  task: Task,
  selectedDate: string,
  today: string,
): boolean {
  if (task.status !== 'done') return true
  if (task.completedDate === selectedDate && task.isStarred) return true
  if (task.completedDate === today && selectedDate === today) return true
  return false
}
