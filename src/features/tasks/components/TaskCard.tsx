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

export function TaskCard({ task, blocks, entries, compact = false }: TaskCardProps) {
  const { toggleTaskStar, completeTask, uncompleteTask, deleteTask, splitTask } = useTaskStore()
  const { startTimer, activeTimerId } = useTimerStore()
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
  const isTimerRunning = !!activeTimerId

  const cardClass = cn(
    'task-chip',
    isImportant && 'important',
    isDone && 'completed',
    task.isStarred && 'starred',
    isDragging && 'opacity-50',
  )

  const handleStartTimer = () => {
    if (isTimerRunning) return
    startTimer({ mode: 'stopwatch', taskId: task.id })
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

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-ink-muted">
          <span className="font-mono">{formatDuration(totalDuration)}</span>
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
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-brand-200/20">
        <Button
          variant={isDone ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => (isDone ? uncompleteTask(task.id) : completeTask(task.id))}
          className="!h-7 !px-2.5"
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

        {!isDone && (
          <Button
            variant="ghost"
            size="icon"
            className="!h-7 !w-7"
            onClick={handleStartTimer}
            title={isTimerRunning ? '已有计时器运行中' : '开始专注计时'}
            disabled={isTimerRunning}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </Button>
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
