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
import { SettingsPanel } from '@/features/settings/components/SettingsPanel'
import { StatsPanel } from '@/features/stats/components/StatsPanel'
import { ShortcutsHelp } from '@/shared/components/ShortcutsHelp'
import { useTicker } from '@/features/focus/useTicker'
import { useKeyboard } from '@/shared/hooks/useKeyboard'
import { useTaskStore } from '@/store/useTaskStore'
import { useUIStore } from '@/store/useUIStore'
import { useThemeStore } from '@/store/useThemeStore'
import { setMinutesSpentSync } from '@/store/useTimerStore'
import type { DragBlockPayload, DropTarget } from '@/features/drag/dragTypes'
import { detectConflicts, buildScheduleEntryInput } from '@/features/schedule/scheduleUtils'
import { formatDuration } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'

interface Notice {
  message: string
  type: 'error' | 'info' | 'success'
}

/** 旧数据兼容：为没有 totalMinutesSpent 的存量任务补齐默认值 */
function migrateTasksMinuteField<T extends { totalMinutesSpent?: number }>(
  tasks: T[],
): T[] {
  let changed = false
  const next = tasks.map((t) => {
    if ('totalMinutesSpent' in t) return t
    changed = true
    return { ...t, totalMinutesSpent: 0 }
  })
  return changed ? next : tasks
}

export default function App() {
  const { scheduleBlock, removeScheduleEntry, scheduleEntries, tasks, taskBlocks, addMinutesSpent } =
    useTaskStore()
  useTicker()

  // 初始化：1) 绑定计时器→任务用时的同步回调 2) 兼容老数据补齐 totalMinutesSpent
  useEffect(() => {
    setMinutesSpentSync(addMinutesSpent)
    // 老数据兼容：只在确实需要时写回
    const state = useTaskStore.getState()
    const migrated = migrateTasksMinuteField(state.tasks)
    if (migrated !== state.tasks) {
      useTaskStore.setState({ tasks: migrated })
    }
  }, [addMinutesSpent])

  // 监听系统主题变化：当用户选择"跟随系统"时，自动同步
  const { syncWithSystem } = useThemeStore()
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => syncWithSystem()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [syncWithSystem])

  const [timerPanelOpen, setTimerPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const { setViewMode, goToToday, navigatePrev, navigateNext } = useUIStore()

  const closeTopmostPanel = useCallback(() => {
    // 按优先级关闭：快捷键帮助 > 统计 > 设置 > 计时器
    if (shortcutsOpen) {
      setShortcutsOpen(false)
    } else if (statsOpen) {
      setStatsOpen(false)
      setSettingsOpen(false)
    } else if (settingsOpen) {
      setSettingsOpen(false)
    } else if (timerPanelOpen) {
      setTimerPanelOpen(false)
    }
  }, [shortcutsOpen, statsOpen, settingsOpen, timerPanelOpen])

  // 聚焦任务创建输入框
  const focusTaskInput = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="添加新任务..."]',
    )
    input?.focus()
  }, [])

  // 全局键盘快捷键
  useKeyboard([
    { key: 'n', handler: focusTaskInput },
    { key: 't', handler: () => setTimerPanelOpen((v) => !v) },
    { key: 's', handler: () => setSettingsOpen((v) => !v) },
    { key: 'w', handler: () => setViewMode('week') },
    { key: 'm', handler: () => setViewMode('month') },
    { key: 'h', handler: goToToday },
    { key: 'ArrowLeft', handler: navigatePrev },
    { key: 'ArrowRight', handler: navigateNext },
    { key: '?', handler: () => setShortcutsOpen((v) => !v) },
    { key: 'Escape', handler: closeTopmostPanel, allowInInput: true },
  ])

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
        <TopBar
          onOpenTimer={() => setTimerPanelOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />

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

      {/* 设置面板弹窗 */}
      {settingsOpen && !statsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/10 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-slide-up">
            <SettingsPanel
              onClose={() => setSettingsOpen(false)}
              onOpenStats={() => setStatsOpen(true)}
            />
          </div>
        </div>
      )}

      {/* 统计面板弹窗 */}
      {statsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/10 backdrop-blur-sm"
          onClick={() => {
            setStatsOpen(false)
            setSettingsOpen(false)
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-slide-up">
            <StatsPanel
              onClose={() => {
                setStatsOpen(false)
                setSettingsOpen(false)
              }}
            />
          </div>
        </div>
      )}

      {/* 快捷键帮助弹窗 */}
      {shortcutsOpen && <ShortcutsHelp onClose={() => setShortcutsOpen(false)} />}

      {/* 迷你悬浮计时条 */}
      <MiniTimerBar onExpand={() => setTimerPanelOpen(true)} />
    </DndProvider>
  )
}
