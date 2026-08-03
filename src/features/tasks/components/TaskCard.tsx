/**
 * 任务卡片
 * 显示任务名、时间信息、拆分块状态、完成按钮和星标按钮
 * 集成倒计时徽标、重要程度切换、拆分编辑器入口
 */
import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Task, TaskBlock } from '../taskTypes'
import type { ScheduleEntry } from '@/features/schedule/scheduleTypes'
import { useTaskStore } from '@/store/useTaskStore'
import { useTimerStore } from '@/store/useTimerStore'
import { Button } from '@/shared/components/Button'
import {
  CheckIcon,
  StarIcon,
  TrashIcon,
  SplitIcon,
} from '@/shared/components/Icons'
import { formatDuration } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'
import { TaskCountdownBadge } from '@/features/focus/components/CountdownBadge'
import { TaskImportanceToggle } from '@/features/focus/components/ImportanceToggle'
import { TaskSplitEditor } from './TaskSplitEditor'

interface TaskCardProps {
  task: Task
  blocks: TaskBlock[]
  entries: ScheduleEntry[]
  compact?: boolean
}

function formatElapsedHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function TaskCard({ task, blocks, entries, compact = false }: TaskCardProps) {
  const { toggleTaskStar, completeTask, uncompleteTask, deleteTask, splitTask } = useTaskStore()
  const { startTimer, pauseTimer, resumeTimer, activeTimerId, timerSessions } = useTimerStore()
  const [splitEditorOpen, setSplitEditorOpen] = useState(false)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      blockId: blocks[0]?.id,
      taskId: task.id,
      source: 'sidebar',
    },
    disabled: blocks.length === 0 || task.status === 'done',
  })

  const isDone = task.status === 'done'
  const isImportant = task.importance !== 'normal'
  const totalScheduled = blocks.filter((b) => b.status === 'scheduled' || b.status === 'done').length
  const totalDuration = blocks.reduce((sum, b) => sum + b.durationMinutes, 0)

  // 当前任务是否是活跃计时器的关联任务
  const activeTimer = timerSessions.find((t) => t.id === activeTimerId) ?? null
  const hasActiveTimer = activeTimer?.taskId === task.id
  const isTimerRunningGlobally = !!activeTimer && activeTimer.status === 'running'
  const isTimerRunningHere = hasActiveTimer && activeTimer.status === 'running'
  const isTimerPausedHere = hasActiveTimer && activeTimer.status === 'paused'
  const elapsed = activeTimer?.elapsedSeconds ?? 0

  const cardClass = cn(
    'task-chip',
    isImportant && 'important',
    isDone && 'completed',
    task.isStarred && 'starred',
    isDragging && 'opacity-50',
  )

  const handleStartTimer = () => {
    if (isTimerRunningGlobally) return
    startTimer({ mode: 'stopwatch', taskId: task.id })
  }

  // 点击完成：1) 如果有该任务的活跃计时器 → 结账（返回未计费增量）  2) completeTask 带增量统一写入  3) 排期自动清理
  const handleCompleteTask = () => {
    if (isDone) {
      uncompleteTask(task.id)
      return
    }
    // settleTimerForTask 结束会话并返回未计费的增量分钟数（不通过 sync 加费，避免双重计费）
    const extra = hasActiveTimer
      ? useTimerStore.getState().settleTimerForTask(task.id)
      : 0
    completeTask(task.id, extra)
  }

  return (
    <div className={cardClass}>
      {/* 拖拽手柄区域 */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          'cursor-grab active:cursor-grabbing',
          task.status === 'done' && 'cursor-default',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn('font-semibold text-sm text-ink flex-1 min-w-0', isDone && 'line-through opacity-60')}>
            <span className="block truncate">{task.title}</span>
          </h4>
          {task.importance === 'critical' && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-danger-100 text-danger-700">
              极重要
            </span>
          )}
          {task.importance === 'important' && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700">
              重要
            </span>
          )}
        </div>

        {!compact && task.notes && (
          <p className="text-xs text-ink-muted mt-1 line-clamp-2">{task.notes}</p>
        )}

        {/* 倒计时徽标 */}
        {task.targetAt && !isDone && (
          <div className="mt-1.5">
            <TaskCountdownBadge task={task} />
          </div>
        )}

        {/* 元信息 + 累计用时 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-ink-muted">
          <span className="font-mono">
            预估 {formatDuration(totalDuration)}
          </span>
          {(task.totalMinutesSpent ?? 0) > 0 && (
            <span className={cn(
              'font-mono',
              task.totalMinutesSpent >= task.estimatedMinutes ? 'text-danger-600' : 'text-accent-600',
            )}>
              · 实际 {formatDuration(task.totalMinutesSpent)}
            </span>
          )}
          {blocks.length > 1 && (
            <span className="inline-flex items-center gap-0.5">
              <SplitIcon size={11} />
              {blocks.length} 块 · 已安排 {totalScheduled}
            </span>
          )}
          {entries.length > 0 && (
            <span className="text-accent-600">
              {entries[0].startTime && `${entries[0].startTime} `}
              {entries[0].date === new Date().toISOString().slice(0, 10) ? '今天' : entries[0].date}
            </span>
          )}
        </div>

        {/* 活跃计时器显示条：当该任务有活跃计时器时显示 */}
        {hasActiveTimer && !isDone && (
          <div
            className={cn(
              'mt-2 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg font-mono text-[11px] tabular-nums',
              isTimerRunningHere ? 'bg-accent-50 text-accent-700 border border-accent-200 animate-pulse-soft'
                : 'bg-brand-50 text-brand-700 border border-brand-200',
            )}
          >
            <span className="flex items-center gap-1 font-semibold">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  isTimerRunningHere ? 'bg-accent-500 animate-ping-soft' : 'bg-brand-400',
                )}
              />
              {isTimerRunningHere ? '计时中' : isTimerPausedHere ? '已暂停' : '会话'}
            </span>
            <span className="text-base font-bold tracking-tight tabular-nums">
              {formatElapsedHMS(elapsed)}
            </span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-brand-200/20 flex-wrap">
        <Button
          variant={isDone ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleCompleteTask}
          className="!h-7 !px-2.5"
          title={isDone ? '撤销完成' : '完成该任务（自动移除排期并记录累计用时）'}
        >
          <CheckIcon size={13} />
          {isDone ? '已完成' : '完成'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn('!h-7 !w-7', task.isStarred && 'text-star-500 hover:text-star-600')}
          onClick={() => toggleTaskStar(task.id)}
          title={task.isStarred ? '取消星标' : '星标纪念'}
        >
          <StarIcon size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="!h-7 !w-7"
          onClick={() => splitTask(task.id, 2)}
          title="拆分为 2 块"
          disabled={isDone}
        >
          <SplitIcon size={13} />
        </Button>

        {/* 计时器控制：开始 / 暂停 / 恢复 */}
        {!isDone && (
          <>
            {!hasActiveTimer ? (
              <Button
                variant="ghost"
                size="icon"
                className="!h-7 !w-7"
                onClick={handleStartTimer}
                title={isTimerRunningGlobally ? '其他任务计时中' : '开始专注计时'}
                disabled={isTimerRunningGlobally}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </Button>
            ) : (
              <>
                {isTimerRunningHere ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="!h-7 !w-7"
                    onClick={pauseTimer}
                    title="暂停计时"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="!h-7 !w-7 text-accent-600"
                    onClick={resumeTimer}
                    title="恢复计时"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </Button>
                )}
              </>
            )}
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="!h-7 !w-7 ml-auto text-ink-muted hover:text-danger-500"
          onClick={() => deleteTask(task.id)}
          title="删除任务"
        >
          <TrashIcon size={13} />
        </Button>
      </div>

      {/* 重要程度切换（展开时显示） */}
      {!isDone && (
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-brand-200/20">
          <span className="text-[10px] text-ink-muted">重要程度</span>
          <TaskImportanceToggle taskId={task.id} importance={task.importance} />
        </div>
      )}

      {/* 拆分编辑器展开区 */}
      {splitEditorOpen && (
        <div className="mt-2 pt-2 border-t border-brand-200/20">
          <TaskSplitEditor task={task} blocks={blocks} onClose={() => setSplitEditorOpen(false)} />
        </div>
      )}

      {/* 拆分编辑器入口按钮（当有多块时显示） */}
      {blocks.length > 1 && !isDone && !splitEditorOpen && (
        <button
          onClick={() => setSplitEditorOpen(true)}
          className="w-full mt-2 pt-2 border-t border-brand-200/20 text-[11px] text-brand-600 hover:text-brand-700 font-medium"
        >
          编辑拆分块 →
        </button>
      )}
    </div>
  )
}
