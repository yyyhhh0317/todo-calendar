/**
 * 应用根组件
 * 固定工作台结构：左侧排期画布（70%），右侧任务侧栏（30%）
 */
import { useCallback, useEffect, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndProvider } from '@/features/drag/DndProvider'
import { TopBar } from '@/features/schedule/components/TopBar'
import { ScheduleBoard } from '@/features/schedule/components/ScheduleBoard'
import { TaskSidebar } from '@/features/tasks/components/TaskSidebar'
import { TimerPanel } from '@/features/focus/components/TimerPanel'
import { MiniTimerBar } from '@/features/focus/components/MiniTimerBar'
import { useTicker } from '@/features/focus/useTicker'
import { useTaskStore } from '@/store/useTaskStore'
import type { DragBlockPayload, DropTarget } from '@/features/drag/dragTypes'
import { detectConflicts, buildScheduleEntryInput } from '@/features/schedule/scheduleUtils'
import { formatDuration } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'

interface Notice {
  message: string
  type: 'error' | 'info' | 'success'
}

export default function App() {
  const { scheduleBlock, removeScheduleEntry, scheduleEntries, tasks, taskBlocks } = useTaskStore()
  useTicker()

  const [timerPanelOpen, setTimerPanelOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const showNotice = useCallback((message: string, type: Notice['type'] = 'info') => {
    setNotice({ message, type })
  }, [])

  // 提示自动消失
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const payload = active.data.current as DragBlockPayload | undefined
      const target = over.data.current as DropTarget | undefined
      if (!payload || !target) return

      // 拖回任务栏 → 移除排期
      if (target.type === 'sidebar') {
        if (payload.entryId) {
          removeScheduleEntry(payload.entryId)
          showNotice('已移回未安排区', 'info')
        }
        return
      }

      // 拖到周视图时间格
      if (target.type === 'week-slot') {
        const block = taskBlocks.find((b) => b.id === payload.blockId)
        if (!block) return

        // 冲突检测
        const conflicts = detectConflicts(
          target.date,
          target.startTime,
          block.durationMinutes,
          scheduleEntries,
          payload.entryId,
        )
        if (conflicts.length > 0) {
          const conflictTask = tasks.find((t) => t.id === conflicts[0].taskId)
          showNotice(
            `该时间段与「${conflictTask?.title ?? '已有任务'}」冲突，请选择其他时间`,
            'error',
          )
          return
        }

        // 若已有排期，先移除旧的
        if (payload.entryId) {
          removeScheduleEntry(payload.entryId)
        }
        scheduleBlock(
          buildScheduleEntryInput(
            payload.taskId,
            payload.blockId,
            target.date,
            target.startTime,
            block.durationMinutes,
            'week',
          ),
        )
        return
      }

      // 拖到月视图日期格
      if (target.type === 'month-day') {
        if (payload.entryId) {
          removeScheduleEntry(payload.entryId)
        }
        scheduleBlock({
          taskId: payload.taskId,
          blockId: payload.blockId,
          date: target.date,
          startTime: undefined,
          endTime: undefined,
          viewSource: 'month',
        })
        showNotice('已安排到日期，可在周视图细调时间', 'success')
        return
      }
    },
    [scheduleBlock, removeScheduleEntry, scheduleEntries, taskBlocks, tasks, showNotice],
  )

  const renderDragOverlay = useCallback(
    (payload: DragBlockPayload | null) => {
      if (!payload) return null
      const task = tasks.find((t) => t.id === payload.taskId)
      const block = taskBlocks.find((b) => b.id === payload.blockId)
      if (!task || !block) return null
      return (
        <div className="placed-task px-3 py-2 max-w-[200px]">
          <div className="font-semibold text-sm truncate">{task.title}</div>
          <div className="opacity-80 text-[10px] font-mono">{formatDuration(block.durationMinutes)}</div>
        </div>
      )
    },
    [tasks, taskBlocks],
  )

  return (
    <DndProvider onDragEnd={handleDragEnd} renderDragOverlay={renderDragOverlay}>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        <TopBar onOpenTimer={() => setTimerPanelOpen(true)} />

        {/* 内联提示条 */}
        {notice && (
          <div
            className={cn(
              'px-4 py-2 text-sm font-medium border-b animate-fade-in',
              notice.type === 'error'
                ? 'bg-danger-50 text-danger-700 border-danger-200'
                : notice.type === 'success'
                  ? 'bg-success-50 text-success-700 border-success-200'
                  : 'bg-brand-50 text-brand-700 border-brand-200',
            )}
            role="alert"
          >
            {notice.message}
          </div>
        )}

        <main className="flex-1 min-h-0 grid gap-3 p-3 [grid-template-columns:7fr_3fr]">
          <ScheduleBoard />
          <TaskSidebar />
        </main>
      </div>

      {/* 计时器面板弹窗 */}
      {timerPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/10 backdrop-blur-sm"
          onClick={() => setTimerPanelOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-slide-up">
            <TimerPanel onClose={() => setTimerPanelOpen(false)} />
          </div>
        </div>
      )}

      {/* 迷你悬浮计时条 */}
      <MiniTimerBar onExpand={() => setTimerPanelOpen(true)} />
    </DndProvider>
  )
}
