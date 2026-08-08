/**
 * 已安排任务块 - 显示在周视图时间格内
 */
import { useDraggable } from '@dnd-kit/core'
import type { Task, TaskBlock } from '@/features/tasks/taskTypes'
import type { ScheduleEntry } from '../scheduleTypes'
import { formatDuration } from '@/shared/utils/time'

interface ScheduledTaskBlockProps {
  entry: ScheduleEntry
  task: Task
  block: TaskBlock
}

export function ScheduledTaskBlock({ entry, task, block }: ScheduledTaskBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: {
      blockId: block.id,
      taskId: task.id,
      source: 'schedule',
      entryId: entry.id,
    },
  })

  const isCritical = task.importance === 'critical'
  const isImportant = task.importance === 'important'
  const isDone = block.status === 'done'

  const importanceClass = isCritical
    ? 'bg-gradient-to-br from-danger-400 to-danger-600 ring-1 ring-danger-300'
    : isImportant
      ? 'bg-gradient-to-br from-accent-400 to-accent-600 ring-1 ring-accent-300'
      : ''

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-e2e-placed-task
      className={`placed-task h-full flex flex-col justify-start overflow-hidden cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isDone ? 'opacity-70' : ''} ${importanceClass}`}
      title={`${task.title} · ${formatDuration(block.durationMinutes)}`}
    >
      <div className="font-semibold truncate flex items-center gap-1">
        {isCritical && (
          <span className="shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
        <span className="truncate">{task.title}</span>
      </div>
      <div className="opacity-80 text-[10px] font-mono">
        {entry.startTime} · {formatDuration(block.durationMinutes)}
      </div>
    </div>
  )
}
