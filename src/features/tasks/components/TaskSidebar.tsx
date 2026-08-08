/**
 * 任务侧栏（两区拆分版）
 * - 上：未安排区（默认 60%）- 所有尚未排到时间的块
 * - 下：已安排区（默认 40%）- 选中日期范围内已排期的块
 * - 中间分隔条可拖拽调节比例
 * - 拆分任务：每块独立显示为一张卡片
 * - 计时器：已安排 / 未安排 均可启动
 */
import { useCallback, useMemo, useRef } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useUIStore } from '@/store/useUIStore'
import { useSidebarSplitStore } from '@/store/useSidebarSplitStore'
import { useFilterStore } from '@/store/useFilterStore'
import { shouldShowInDayView } from '../taskTypes'
import { formatFullDate, fromDateKey, toDateKey, getWeekStart, getWeekEnd } from '@/shared/utils/date'
import { eachDayOfInterval, addDays } from 'date-fns'
import { TaskComposer } from './TaskComposer'
import { TaskBlockCard } from './TaskBlockCard'
import { TaskSplitEditor } from './TaskSplitEditor'
import { SearchFilterBar } from './SearchFilterBar'
import { cn } from '@/shared/utils/cn'

export function TaskSidebar() {
  const { tasks, taskBlocks, scheduleEntries, splitTask } = useTaskStore()
  const { selectedDate } = useUIStore()
  const { unscheduledRatio, setUnscheduledRatio } = useSidebarSplitStore()
  const { keyword, status, importance } = useFilterStore()

  const today = toDateKey(new Date())

  // 任务筛选匹配（搜索 + 状态 + 重要程度）
  const { hasFilter, matchesFilter } = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const has = kw !== '' || status !== 'all' || importance !== 'all'
    return {
      hasFilter: has,
      matchesFilter: (task: { title: string; status: string; importance: string }) => {
        if (status !== 'all' && task.status !== status) return false
        if (importance !== 'all' && task.importance !== importance) return false
        if (kw !== '' && !task.title.toLowerCase().includes(kw)) return false
        return true
      },
    }
  }, [keyword, status, importance])

  // 用于分隔条拖拽的边界框计算
  const containerRef = useRef<HTMLElement>(null)
  const draggingRef = useRef(false)

  const onDividerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      ;(e.currentTarget as Element).classList.add('cursor-row-resize')
      document.body.style.cursor = 'row-resize'
    },
    [],
  )

  const onDividerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dividerY = e.clientY - rect.top
      // 扣除上下预留的 header（66px）+ 底部安全区，计算新比例
      const headerH = 58 // 选中日期 header 高度
      const composerH = 96 // TaskComposer 约高
      const dividerRow = rect.height - headerH - composerH
      const ratio = (dividerY - headerH - composerH) / dividerRow
      setUnscheduledRatio(ratio)
    },
    [setUnscheduledRatio],
  )

  const onDividerPointerUp = useCallback(() => {
    draggingRef.current = false
    document.body.style.cursor = ''
  }, [])

  // 计算选中日期所在周的起止（周视图：周一到周日），用于已安排区筛选
  const weekRange = useMemo(() => {
    const sel = fromDateKey(selectedDate)
    const s = getWeekStart(sel)
    const e = getWeekEnd(sel)
    const days = eachDayOfInterval({ start: s, end: e })
    void addDays
    return new Set(days.map(toDateKey))
  }, [selectedDate])

  // 整理数据：块 → 任务 → 排期 映射
  const { unscheduledBlocks, scheduledBlocks, taskMap, blockToEntry } = useMemo(() => {
    const tMap: Record<string, typeof tasks[number]> = {}
    for (const t of tasks) tMap[t.id] = t

    // 只保留选中日期应该显示的任务（shouldShowInDayView）
    // 但当用户主动筛选"已完成"状态时，突破 shouldShowInDayView 限制，让已完成任务可见
    // 有筛选条件时，同时按关键词/状态/重要程度过滤
    const visibleTaskIds = new Set(
      tasks
        .filter((t) =>
          status === 'done' ? true : shouldShowInDayView(t, selectedDate, today),
        )
        .filter((t) => !hasFilter || matchesFilter(t))
        .map((t) => t.id),
    )

    // 排期 → 按块聚合
    const entryByBlock: Record<string, (typeof scheduleEntries)[number]> = {}
    for (const e of scheduleEntries) {
      if (!visibleTaskIds.has(e.taskId)) continue
      // 已安排区：展示选中日期所在周 + 月视图待定（无 startTime）
      if (weekRange.has(e.date) || !e.startTime) {
        // 同一块如果有多个日期的排期（极端情况），只保留选中日期的那一条
        const cur = entryByBlock[e.blockId]
        if (!cur || e.date === selectedDate) {
          entryByBlock[e.blockId] = e
        }
      }
    }

    const unscheduled: (typeof taskBlocks)[number][] = []
    const scheduled: (typeof taskBlocks)[number][] = []

    for (const b of taskBlocks) {
      if (!visibleTaskIds.has(b.taskId)) continue
      if (b.status === 'done') {
        const task = tMap[b.taskId]
        // 任务整体已完成：默认不在侧栏显示
        // 但当用户主动筛选"已完成"状态时，显示这些块以便查看历史
        if (task && task.status === 'done' && status !== 'done') continue
        // 部分完成：已完成块归到未安排区，用户可看到并撤销
        unscheduled.push(b)
        continue
      }
      if (entryByBlock[b.id]) {
        scheduled.push(b)
      } else {
        unscheduled.push(b)
      }
    }

    // 已安排按时间排序，未安排按任务创建时间 + 块顺序排序
    unscheduled.sort((a, b) => {
      const ta = tMap[a.taskId]
      const tb = tMap[b.taskId]
      if (ta?.createdAt !== tb?.createdAt)
        return (tb?.createdAt ?? '').localeCompare(ta?.createdAt ?? '')
      return a.order - b.order
    })
    scheduled.sort((a, b) => {
      const ea = entryByBlock[a.id]
      const eb = entryByBlock[b.id]
      // 先按日期，再按开始时间
      const dcmp = (ea?.date ?? '').localeCompare(eb?.date ?? '')
      if (dcmp !== 0) return dcmp
      const ta = (ea?.startTime ?? '23:59').padStart(5, '0')
      const tb = (eb?.startTime ?? '23:59').padStart(5, '0')
      return ta.localeCompare(tb)
    })

    return {
      unscheduledBlocks: unscheduled,
      scheduledBlocks: scheduled,
      taskMap: tMap,
      blockToEntry: entryByBlock,
    }
  }, [tasks, taskBlocks, scheduleEntries, selectedDate, today, weekRange, hasFilter, matchesFilter, status])

  const renderEmpty = (zone: 'unscheduled' | 'scheduled') => (
    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-2">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-300"
        >
          {hasFilter ? (
            <>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </>
          ) : zone === 'unscheduled' ? (
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 16 14" />
            </>
          )}
        </svg>
      </div>
      <p className="text-xs text-ink-muted">
        {hasFilter
          ? '没有匹配的任务'
          : zone === 'unscheduled'
            ? '暂无未安排的任务块'
            : '本周暂未安排任务'}
      </p>
      <p className="text-[11px] text-ink-muted/60 mt-0.5">
        {hasFilter
          ? '尝试调整筛选条件'
          : zone === 'unscheduled'
            ? '拖拽下方的块到左侧日历'
            : '把上方的块拖到左侧日历即可排期'}
      </p>
    </div>
  )

  return (
    <aside
      ref={containerRef}
      className="flex flex-col h-full min-w-0 overflow-hidden glass-panel rounded-4xl"
    >
      {/* 选中日期标题 */}
      <div className="px-4 py-3 border-b border-brand-200/30 shrink-0">
        <div className="text-xs text-ink-muted">选中日期</div>
        <div className="text-sm font-bold text-ink">{formatFullDate(fromDateKey(selectedDate))}</div>
      </div>

      {/* 任务创建表单 */}
      <div className="px-3 pt-3 shrink-0">
        <TaskComposer />
      </div>

      {/* 搜索筛选栏 */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <SearchFilterBar />
      </div>

      {/* 未安排区（可滚动） */}
      <div
        className="flex flex-col min-h-0 overflow-hidden"
        style={{ height: `${unscheduledRatio * 100}%`, flexGrow: 0 }}
      >
        <div className="px-3 pt-3 pb-1 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700">
            <span className="w-2 h-2 rounded-full bg-brand-400" />
            未安排
            <span className="font-normal text-ink-muted/60">· {unscheduledBlocks.length}</span>
          </div>
          {/* 快捷拆分入口：对第一个未完成单块任务可快捷拆分 */}
          {(() => {
            const firstSingleTask = unscheduledBlocks
              .map((b) => taskMap[b.taskId])
              .find((t) => t && t.status !== 'done')
            if (!firstSingleTask) return null
            const blocksForTask = taskBlocks.filter((b) => b.taskId === firstSingleTask.id)
            if (blocksForTask.length > 1) return null
            return (
              <button
                onClick={() => splitTask(firstSingleTask.id, 2)}
                className="text-[10px] text-brand-500 hover:text-brand-600 font-medium"
              >
                拆分首批任务
              </button>
            )
          })()}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2">
          {unscheduledBlocks.length === 0 ? (
            renderEmpty('unscheduled')
          ) : (
            <div className="space-y-2">
              {unscheduledBlocks.map((block) => {
                const task = taskMap[block.taskId]
                if (!task) return null
                const allBlocks = taskBlocks.filter((b) => b.taskId === task.id)
                return (
                  <TaskBlockCard
                    key={block.id}
                    task={task}
                    block={block}
                    allBlocks={allBlocks}
                  />
                )
              })}
              {/* 拆分编辑器入口：多块任务的展开编辑器 */}
              {renderSplitEditors(tasks, taskBlocks, taskMap, unscheduledBlocks)}
            </div>
          )}
        </div>
      </div>

      {/* 拖拽分隔条 */}
      <div
        className={cn(
          'shrink-0 group flex items-center justify-center py-1.5',
          'hover:bg-brand-50 cursor-row-resize select-none touch-none',
          'border-y border-brand-200/20',
        )}
        onPointerDown={onDividerPointerDown}
        onPointerMove={onDividerPointerMove}
        onPointerUp={onDividerPointerUp}
        onPointerCancel={onDividerPointerUp}
      >
        <div className="w-10 h-1 rounded-full bg-brand-200/60 group-hover:bg-brand-300 transition-colors" />
      </div>

      {/* 已安排区（可滚动） */}
      <div
        className="flex flex-col min-h-0 overflow-hidden"
        style={{ height: `${(1 - unscheduledRatio) * 100}%`, flexGrow: 0 }}
      >
        <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 text-[11px] font-semibold text-accent-700 shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent-400" />
          已安排 · 本周
          <span className="font-normal text-ink-muted/60">· {scheduledBlocks.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
          {scheduledBlocks.length === 0 ? (
            renderEmpty('scheduled')
          ) : (
            <div className="space-y-2">
              {scheduledBlocks.map((block) => {
                const task = taskMap[block.taskId]
                if (!task) return null
                const allBlocks = taskBlocks.filter((b) => b.taskId === task.id)
                const entry = blockToEntry[block.id]
                return (
                  <TaskBlockCard
                    key={block.id}
                    task={task}
                    block={block}
                    allBlocks={allBlocks}
                    entry={entry}
                    compact
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

/**
 * 渲染每个多块任务的拆分编辑器（最多一个任务一个，避免重复）
 */
function renderSplitEditors(
  _tasks: ReturnType<typeof useTaskStore.getState>['tasks'],
  _taskBlocks: ReturnType<typeof useTaskStore.getState>['taskBlocks'],
  _taskMap: Record<string, ReturnType<typeof useTaskStore.getState>['tasks'][number]>,
  _unscheduledBlocks: ReturnType<typeof useTaskStore.getState>['taskBlocks'],
) {
  // 拆分编辑器在本版本通过 TaskSplitEditor 单独调用，此处留空
  // （可在后续版本为每个多块任务添加展开按钮）
  void TaskSplitEditor
  return null
}
