/**
 * 倒计时徽标
 * 显示距离任务目标时间或重要日期的剩余时间
 * 格式规则来自 spec：≥3天显示天数，1-3天显示天+小时，<1天显示小时+分钟
 */
import { useEffect, useState } from 'react'
import type { Task } from '@/features/tasks/taskTypes'
import type { ImportantDay } from '@/features/schedule/scheduleTypes'
import { formatTargetCountdown, minutesUntil } from '@/shared/utils/time'

interface CountdownBadgeProps {
  /** 任务目标时间 ISO datetime */
  targetAt?: string
  /** 可选的样式变体 */
  variant?: 'default' | 'compact' | 'inline'
  /** 是否已过期（过期后显示"已超时"） */
  expiredText?: string
}

export function CountdownBadge({
  targetAt,
  variant = 'default',
  expiredText = '已到期',
}: CountdownBadgeProps) {
  const [, forceUpdate] = useState(0)

  // 每分钟刷新一次（spec 建议）
  useEffect(() => {
    if (!targetAt) return
    const timer = setInterval(() => forceUpdate((n) => n + 1), 60000)
    return () => clearInterval(timer)
  }, [targetAt])

  if (!targetAt) return null

  const diff = minutesUntil(targetAt)
  const isExpired = diff <= 0
  const label = isExpired ? expiredText : formatTargetCountdown(diff)

  const variantClasses = {
    default:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono',
    compact: 'inline-flex items-center text-[10px] font-mono',
    inline: 'inline text-[11px] font-mono',
  }

  const colorClasses = isExpired
    ? 'bg-danger-100 text-danger-700'
    : diff < 1440 // 1 天内
      ? 'bg-danger-100 text-danger-700'
      : diff < 4320 // 3 天内
        ? 'bg-star-100 text-star-600'
        : 'bg-brand-100 text-brand-600'

  if (variant === 'inline') {
    return (
      <span className={`text-danger-600 font-medium`}>
        {isExpired ? expiredText : `D-${label}`}
      </span>
    )
  }

  return (
    <span
      className={`${variantClasses[variant]} ${variant === 'compact' ? '' : colorClasses}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {isExpired ? expiredText : label}
    </span>
  )
}

/**
 * 便捷封装：从任务对象提取 targetAt 并渲染徽标
 */
export function TaskCountdownBadge({ task }: { task: Task }) {
  if (!task.targetAt) return null
  return <CountdownBadge targetAt={task.targetAt} variant="default" />
}

/**
 * 便捷封装：从重要日期对象提取 targetAt 并渲染徽标
 */
export function DayCountdownBadge({ day }: { day: ImportantDay }) {
  if (!day.targetAt) return null
  return <CountdownBadge targetAt={day.targetAt} variant="compact" />
}
