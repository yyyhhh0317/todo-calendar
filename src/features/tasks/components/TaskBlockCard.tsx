/**
 * 任务块卡片（右侧任务栏按块展示）
 * - 拆分的多块任务：每块独立显示为一张卡片
 * - 单块任务：和之前 TaskCard 显示等价
 * - 已安排 / 未安排 均可启动计时器
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
  ClockIcon,
} from '@/shared/components/Icons'
import { formatDuration } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'
import { TaskCountdownBadge } from '@/features/focus/components/CountdownBadge'

interface TaskBlockCardProps {
  task: Task
  block: TaskBlock
  /** 该任务的所有块（用于判断是否拆分任务） */
  allBlocks: TaskBlock[]
  /** 该块对应的排期（如有） */
  entry?: ScheduleEntry
  /** 已安排区显示紧凑模式 */
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

export function TaskBlockCard({ task, block, allBlocks, entry, compact = false }: TaskBlockCardProps) {
  const { toggleTaskStar, completeTask, completeBlock, uncompleteBlock, deleteBlock, deleteTask } =
    useTaskStore()
  const { startTimer, pauseTimer, resumeTimer, activeTimerId, timerSessions, settleTimerForTask } =
    useTimerStore()
  const [, forceRender] = useState(0)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: {
      blockId: block.id,
      taskId: task.id,
      entryId: entry?.id,
      source: 'sidebar',
    },
    disabled: block.status === 'done' || task.status === 'done',
  })

  const isDone = task.status === 'done' || block.status === 'done'
  const isScheduled = !!entry
  const isImportant = task.importance !== 'normal'
  const isSplit = allBlocks.length > 1
  const blockIndex = allBlocks.findIndex((b) => b.id === block.id) + 1
  // 是否还有未完成的兄弟块（用于决定是否显示"完成全部"按钮）
  const hasPendingSiblings = isSplit && allBlocks.some((b) => b.status !== 'done')

  // 当前任务/块是否有活跃计时器（计时器绑定的是 taskId，这里按任务粒度匹配）
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
    startTimer({ mode: 'stopwatch', taskId: task.id, blockId: block.id })
    forceRender((x) => x + 1)
  }

  const handleToggleDone = () => {
    if (isDone) {
      // 撤销此块完成（不影响其他块）
      uncompleteBlock(block.id)
      return
    }
    // 结算活跃计时器：返回的增量分钟由 completeBlock 统一写入，避免双重计费
    const extra = hasActiveTimer ? settleTimerForTask(task.id) : 0
    completeBlock(block.id, extra)
  }

  const handleCompleteAll = () => {
    // 一键完成整个任务（所有块 + 清理所有排期）
    const extra = hasActiveTimer ? settleTimerForTask(task.id) : 0
    completeTask(task.id, extra)
  }

  const handleDelete = () => {
    if (isSplit) {
      deleteBlock(block.id)
    } else {
      deleteTask(task.id)
    }
  }

  return (
    <div className={cardClass}>
      {/* 拖拽手柄区 */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn('cursor-grab active:cursor-grabbing', isDone && 'cursor-default')}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* 标题行：任务标题 + 拆分序号（如有） */}
            <div className="flex items-center gap-1.5">
              {isSplit && (
                <span className="shrink-0 text-[10px] font-bold font-mono text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">
                  #{blockIndex}
                </span>
              )}
              <h4
                className={cn(
                  'font-semibold text-sm text-ink min-w-0 flex-1 truncate',
                  isDone && 'line-through opacity-60',
                )}
              >
                <span className="block truncate">{task.title}</span>
              </h4>
            </div>

            {/* 拆分任务的块标题（如果有） */}
            {!compact && isSplit && block.title && (
              <p className="text-xs text-ink-muted mt-0.5 truncate">{block.title}</p>
            )}

            {/* 任务 notes（仅非紧凑 + 非拆分时显示，避免信息过多） */}
            {!compact && !isSplit && task.notes && (
              <p className="text-xs text-ink-muted mt-1 line-clamp-2">{task.notes}</p>
            )}

            {/* 倒计时徽标 */}
            {task.targetAt && !isDone && (
              <div className="mt-1.5">
                <TaskCountdownBadge task={task} />
              </div>
            )}

            {/* 元信息：时长 + 累计用时 + 状态标签 */}
            <div
              className={cn(
                'flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-ink-muted',
                compact && 'mt-1',
              )}
            >
              <span className="font-mono flex items-center gap-1">
                <ClockIcon size={11} />
                {formatDuration(block.durationMinutes)}
              </span>
              {(task.totalMinutesSpent ?? 0) > 0 && (
                <span
                  className={cn(
                    'font-mono',
                    task.totalMinutesSpent >= task.estimatedMinutes
                      ? 'text-danger-600'
                      : 'text-accent-600',
                  )}
                >
                  · 实际 {formatDuration(task.totalMinutesSpent)}
                </span>
              )}
              {isScheduled && entry && (
                <span className="text-accent-600 font-medium">
                  {entry.startTime && `${entry.startTime} `}
                  {entry.date}
                </span>
              )}
              {!isScheduled && !isDone && (
                <span className="text-brand-500/70">未安排</span>
              )}
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

            {/* 活跃计时器显示条 */}
            {hasActiveTimer && !isDone && (
              <div
                className={cn(
                  'mt-2 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg font-mono text-[11px] tabular-nums',
                  isTimerRunningHere
                    ? 'bg-accent-50 text-accent-700 border border-accent-200 animate-pulse-soft'
                    : 'bg-brand-50 text-brand-700 border border-brand-200',
                )}
              >
                <span className="flex items-center gap-1 font-semibold">
                  <span
                    className={cn(
                      'inline-block w-2 h-2 rounded-full',
                      isTimerRunningHere
                        ? 'bg-accent-500 animate-ping-soft'
                        : 'bg-brand-400',
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
        </div>
      </div>

      {/* 操作按钮 */}
      <div
        className={cn(
          'flex items-center gap-1.5 mt-2 pt-2 border-t border-brand-200/20 flex-wrap',
          compact && 'mt-1.5 pt-1.5',
        )}
      >
        <Button
          variant={isDone ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleToggleDone}
          className="!h-7 !px-2.5"
          title={
            isDone
              ? '撤销此块完成'
              : isSplit
                ? '完成此块（保留任务，自动移除该块排期）'
                : '完成该任务（自动移除排期并记录累计用时）'
          }
        >
          <CheckIcon size={13} />
          {isDone ? '已完成' : isSplit ? '完成此块' : '完成'}
        </Button>

        {/* 多块任务：额外提供"完成全部"按钮 */}
        {isSplit && !isDone && hasPendingSiblings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCompleteAll}
            className="!h-7 !px-2 text-[11px] text-accent-600 hover:text-accent-700"
            title="一键完成整个任务的所有块"
          >
            完成全部
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn('!h-7 !w-7', task.isStarred && 'text-star-500 hover:text-star-600')}
          onClick={() => toggleTaskStar(task.id)}
          title={task.isStarred ? '取消星标' : '星标纪念'}
        >
          <StarIcon size={14} />
        </Button>

        {/* 计时器控制：开始 / 暂停 / 恢复（已安排和未安排均可启动） */}
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
          onClick={handleDelete}
          title={isSplit ? '删除此块' : '删除任务'}
        >
          <TrashIcon size={13} />
        </Button>
      </div>
    </div>
  )
}
