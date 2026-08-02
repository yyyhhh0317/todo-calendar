/**
 * 极重要标记切换
 * 支持任务级（importance: normal / important / critical）
 * 和日期级（toggle on/off）
 */
import { useTaskStore } from '@/store/useTaskStore'
import type { Importance } from '@/features/tasks/taskTypes'
import { FlagIcon } from '@/shared/components/Icons'
import { cn } from '@/shared/utils/cn'

const IMPORTANCE_OPTIONS: { value: Importance; label: string }[] = [
  { value: 'normal', label: '普通' },
  { value: 'important', label: '重要' },
  { value: 'critical', label: '极重要' },
]

interface TaskImportanceToggleProps {
  taskId: string
  importance: Importance
  compact?: boolean
}

/** 任务级重要程度切换 */
export function TaskImportanceToggle({
  taskId,
  importance,
  compact = false,
}: TaskImportanceToggleProps) {
  const { updateTask } = useTaskStore()

  if (compact) {
    return (
      <button
        onClick={() => {
          const next: Importance =
            importance === 'normal' ? 'important' : importance === 'important' ? 'critical' : 'normal'
          updateTask(taskId, { importance: next })
        }}
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors',
          importance === 'normal'
            ? 'text-ink-muted hover:bg-brand-50'
            : importance === 'important'
              ? 'text-accent-600 bg-accent-50'
              : 'text-danger-600 bg-danger-50',
        )}
        title={`重要程度：${importance === 'normal' ? '普通' : importance === 'important' ? '重要' : '极重要'}`}
      >
        <FlagIcon size={13} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {IMPORTANCE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => updateTask(taskId, { importance: opt.value })}
          className={cn(
            'h-7 px-2.5 text-xs rounded-md transition-colors',
            importance === opt.value
              ? opt.value === 'critical'
                ? 'bg-danger-500 text-white'
                : opt.value === 'important'
                  ? 'bg-accent-500 text-white'
                  : 'bg-brand-500 text-white'
              : 'bg-white/60 text-ink-muted hover:bg-brand-50',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface DayImportanceToggleProps {
  date: string
}

/** 日期级重要标记切换（on/off，默认 important） */
export function DayImportanceToggle({ date }: DayImportanceToggleProps) {
  const { importantDays, toggleImportantDay } = useTaskStore()
  const isImportant = importantDays.some((d) => d.date === date)

  return (
    <button
      onClick={() => toggleImportantDay(date)}
      className={cn(
        'inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-md transition-colors',
        isImportant
          ? 'bg-danger-500 text-white'
          : 'bg-white/60 text-ink-muted hover:bg-danger-50 hover:text-danger-600',
      )}
      title={isImportant ? '取消日期重要标记' : '标记为重要日期'}
    >
      <FlagIcon size={13} />
      {isImportant ? '重要日期' : '标记重要'}
    </button>
  )
}
