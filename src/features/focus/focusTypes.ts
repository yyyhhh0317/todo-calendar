/**
 * 高亮与计时相关类型定义
 */

/** 计时器模式：正向计时 / 固定时长倒计时 */
export type TimerMode = 'stopwatch' | 'countdown'

/** 计时器状态 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

/** 计时器会话 */
export interface TimerSession {
  id: string
  mode: TimerMode
  /** 关联的任务 ID（可选） */
  taskId?: string
  /** 关联的任务块 ID（可选） */
  blockId?: string
  status: TimerStatus
  startedAt?: string
  pausedAt?: string
  finishedAt?: string
  /** 倒计时模式必填，单位分钟 */
  durationMinutes?: number
  /** 已经过的秒数，正向计时与暂停恢复都依赖该字段 */
  elapsedSeconds: number
}
