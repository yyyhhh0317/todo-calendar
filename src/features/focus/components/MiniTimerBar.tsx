/**
 * 迷你悬浮计时条
 * 计时器运行时显示在右下角，点击可展开完整面板
 */
import { useTimerStore } from '@/store/useTimerStore'
import { useTaskStore } from '@/store/useTaskStore'
import { formatStopwatch } from '@/shared/utils/time'
import { PauseIcon, PlayIcon } from '@/shared/components/Icons'
import { cn } from '@/shared/utils/cn'

interface MiniTimerBarProps {
  onExpand: () => void
}

export function MiniTimerBar({ onExpand }: MiniTimerBarProps) {
  const { activeTimerId, timerSessions, pauseTimer, resumeTimer } = useTimerStore()
  const { tasks } = useTaskStore()

  if (!activeTimerId) return null

  const timer = timerSessions.find((t) => t.id === activeTimerId)
  if (!timer || timer.status === 'finished') return null

  const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId) : null
  const remainingSeconds =
    timer.mode === 'countdown' && timer.durationMinutes
      ? Math.max(0, timer.durationMinutes * 60 - timer.elapsedSeconds)
      : timer.elapsedSeconds

  return (
    <button
      onClick={onExpand}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-glass border border-brand-200/50 shadow-card-hover hover:shadow-glass transition-all animate-slide-up group"
    >
      {/* 运行指示灯 */}
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          timer.status === 'running' ? 'bg-accent-500 animate-pulse' : 'bg-star-500',
        )}
      />

      {/* 计时数字 */}
      <span className="text-sm font-mono font-bold tabular-nums text-ink">
        {timer.mode === 'countdown' ? formatStopwatch(remainingSeconds) : formatStopwatch(timer.elapsedSeconds)}
      </span>

      {/* 任务名 */}
      {task && (
        <span className="text-xs text-ink-muted max-w-[100px] truncate hidden sm:inline">
          {task.title}
        </span>
      )}

      {/* 暂停/继续按钮（阻止冒泡） */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          timer.status === 'running' ? pauseTimer() : resumeTimer()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            timer.status === 'running' ? pauseTimer() : resumeTimer()
          }
        }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-ink-muted hover:text-brand-600 hover:bg-brand-50 cursor-pointer"
        title={timer.status === 'running' ? '暂停' : '继续'}
      >
        {timer.status === 'running' ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
      </span>
    </button>
  )
}
