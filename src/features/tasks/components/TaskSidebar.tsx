/**
 * 任务侧栏
 * 任务栏用于创建、拆分、筛选、拖拽和查看当天任务
 * 宽度固定约 30%
 */
import { useMemo } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useUIStore } from '@/store/useUIStore'
import { shouldShowInDayView } from '../taskTypes'
import { formatFullDate, fromDateKey, toDateKey } from '@/shared/utils/date'
import { TaskComposer } from './TaskComposer'
import { TaskCard } from './TaskCard'
import { SegmentedControl } from '@/shared/components/SegmentedControl'
import { useState } from 'react'

type FilterMode = 'today' | 'unscheduled' | 'all'

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: 'today', label: '当天' },
  { value: 'unscheduled', label: '未安排' },
  { value: 'all', label: '全部' },
]

export function TaskSidebar() {
  const { tasks, taskBlocks, scheduleEntries } = useTaskStore()
  const { selectedDate } = useUIStore()
  const [filter, setFilter] = useState<FilterMode>('today')

  const today = toDateKey(new Date())

  const filteredTasks = useMemo(() => {
    // 先按创建时间倒序
    const sorted = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (filter === 'all') {
      return sorted.filter((t) => shouldShowInDayView(t, selectedDate, today))
    }

    if (filter === 'unscheduled') {
      return sorted.filter((t) => {
        if (t.status === 'done') return false
        const blocks = taskBlocks.filter((b) => b.taskId === t.id)
        return blocks.every((b) => b.status === 'unscheduled')
      })
    }

    // today：当天已安排或日期级待定的任务
    return sorted.filter((t) => {
      if (!shouldShowInDayView(t, selectedDate, today)) return false
      const blocks = taskBlocks.filter((b) => b.taskId === t.id)
      const blockIds = new Set(blocks.map((b) => b.id))
      const hasEntryOnDate = scheduleEntries.some(
        (e) => blockIds.has(e.blockId) && e.date === selectedDate,
      )
      // 未安排的也显示在当天列表中
      return hasEntryOnDate || blocks.some((b) => b.status === 'unscheduled')
    })
  }, [tasks, taskBlocks, scheduleEntries, filter, selectedDate, today])

  const completedCount = filteredTasks.filter((t) => t.status === 'done').length

  return (
    <aside className="flex flex-col h-full min-w-0 overflow-hidden glass-panel rounded-4xl">
      {/* 选中日期标题 */}
      <div className="px-4 py-3 border-b border-brand-200/30">
        <div className="text-xs text-ink-muted">选中日期</div>
        <div className="text-sm font-bold text-ink">{formatFullDate(fromDateKey(selectedDate))}</div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {/* 任务创建表单 */}
        <TaskComposer />

        {/* 筛选 */}
        <div className="flex items-center justify-between mb-3">
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
            className="text-xs"
          />
          <span className="text-[11px] text-ink-muted shrink-0 ml-2">
            {filteredTasks.length} 项{completedCount > 0 && ` · ${completedCount} 已完成`}
          </span>
        </div>

        {/* 任务列表 */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-300">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm text-ink-muted">
              {filter === 'today'
                ? '当天还没有任务'
                : filter === 'unscheduled'
                  ? '没有未安排的任务'
                  : '还没有任何任务'}
            </p>
            <p className="text-xs text-ink-muted/70 mt-1">在上方表单创建新任务</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const blocks = taskBlocks.filter((b) => b.taskId === task.id)
              const blockIds = new Set(blocks.map((b) => b.id))
              const entries = scheduleEntries.filter((e) => blockIds.has(e.blockId))
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  blocks={blocks}
                  entries={entries}
                />
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
