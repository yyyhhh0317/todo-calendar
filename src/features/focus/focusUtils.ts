/**
 * 高亮与计时相关工具函数
 */

import type { Importance } from '@/features/tasks/taskTypes'

/**
 * 根据重要程度返回对应的视觉样式类名
 */
export function getImportanceClasses(importance: Importance): {
  border: string
  bg: string
  text: string
  shadow: string
} {
  switch (importance) {
    case 'critical':
      return {
        border: 'border-danger-300/70',
        bg: 'bg-gradient-to-br from-danger-50/60 to-white',
        text: 'text-danger-700',
        shadow: 'shadow-important',
      }
    case 'important':
      return {
        border: 'border-accent-300/60',
        bg: 'bg-gradient-to-br from-accent-50/50 to-white',
        text: 'text-accent-700',
        shadow: 'shadow-card',
      }
    default:
      return {
        border: 'border-brand-200/40',
        bg: 'bg-white',
        text: 'text-ink',
        shadow: 'shadow-card',
      }
  }
}

/**
 * 判断计时器是否处于可交互状态（运行中或暂停中）
 */
export function isTimerInteractive(status: string): boolean {
  return status === 'running' || status === 'paused'
}

/**
 * 计算倒计时进度百分比
 */
export function getTimerProgress(
  elapsedSeconds: number,
  durationMinutes?: number,
): number {
  if (!durationMinutes || durationMinutes <= 0) return 0
  const total = durationMinutes * 60
  return Math.min(100, (elapsedSeconds / total) * 100)
}
