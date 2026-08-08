/**
 * 周视图
 * 顶部列头固定周一到周日并显示日期
 * 左侧时间轴以 30 分钟为最小粒度，视觉上按 1 小时分隔
 * 拖拽任务块时，悬停的时间格会显示跨多格的半透明吸附预览
 */
import { useMemo } from 'react'
import { useDroppable, useDndContext } from '@dnd-kit/core'
import {
  getWeekDays,
  formatDayHeader,
  fromDateKey,
  toDateKey,
  checkIsToday,
  isSameDate,
} from '@/shared/utils/date'
import { useUIStore } from '@/store/useUIStore'
import { useTaskStore } from '@/store/useTaskStore'
import { formatDuration, minutesToTimeString, timeStringToMinutes } from '@/shared/utils/time'
import type { ScheduleEntry } from '../scheduleTypes'
import type { DragBlockPayload, WeekDropTarget } from '@/features/drag/dragTypes'
import { ScheduledTaskBlock } from './ScheduledTaskBlock'

/** 时间格起始小时（8:00） */
const START_HOUR = 8
/** 时间格结束小时（22:00） */
const END_HOUR = 22
/** 每小时对应的行数（2 行 = 30 分钟一格） */
const SLOTS_PER_HOUR = 2
/** 一格对应分钟数 */
const SLOT_MINUTES = 60 / SLOTS_PER_HOUR
/** 一格高度 px */
const SLOT_HEIGHT = 28

/** 生成时间轴标签 */
function getTimeLabels(): { label: string; minutes: number }[] {
  const labels: { label: string; minutes: number }[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    labels.push({ label: minutesToTimeString(h * 60), minutes: h * 60 })
  }
  return labels
}

/** 总行数 */
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR

interface DroppableSlotProps {
  dayKey: string
  slotIndex: number
  children?: React.ReactNode
}

function DroppableSlot({ dayKey, slotIndex, children }: DroppableSlotProps) {
  const startTime = minutesToTimeString(START_HOUR * 60 + slotIndex * SLOT_MINUTES)
  const { setNodeRef, isOver } = useDroppable({
    id: `week-${dayKey}-${slotIndex}`,
    data: { type: 'week-slot', date: dayKey, startTime },
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative border border-brand-200/20 transition-colors ${
        isOver ? 'bg-brand-100/60 border-brand-400' : 'bg-brand-50/20'
      }`}
      style={{ height: SLOT_HEIGHT }}
    >
      {children}
    </div>
  )
}

export function WeekView() {
  const { weekRefDate, selectedDate, setSelectedDate } = useUIStore()
  const { scheduleEntries, taskBlocks, tasks, importantDays } = useTaskStore()

  const weekDays = useMemo(() => getWeekDays(fromDateKey(weekRefDate)), [weekRefDate])
  const timeLabels = useMemo(() => getTimeLabels(), [])

  // 按天分组的排期记录
  const entriesByDay = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>()
    for (const entry of scheduleEntries) {
      if (!entry.startTime) continue
      const list = map.get(entry.date) ?? []
      list.push(entry)
      map.set(entry.date, list)
    }
    return map
  }, [scheduleEntries])

  // === 拖拽吸附预览 ===
  // 通过 useDndContext 获取当前拖拽的 active 和悬停的 over
  const { active, over } = useDndContext()

  // 计算拖拽预览信息：{ dayKey, slotIndex, height } | null
  const dragPreview = useMemo(() => {
    if (!active || !over) return null
    // 仅处理任务块拖拽（id 以 'block-' 开头）
    if (typeof active.id !== 'string' || !active.id.startsWith('block-')) return null
    const payload = active.data.current as DragBlockPayload | undefined
    if (!payload) return null
    // 仅处理悬停在周视图时间格上
    const target = over.data.current as WeekDropTarget | undefined
    if (!target || target.type !== 'week-slot') return null

    // 查找拖拽中的块，获取持续时间
    const block = taskBlocks.find((b) => b.id === payload.blockId)
    if (!block) return null

    // 解析悬停目标的 slotIndex
    // over.id 格式：'week-{dayKey}-{slotIndex}'
    const overId = over.id as string
    const parts = overId.split('-')
    const slotIndex = Number(parts[parts.length - 1])
    if (Number.isNaN(slotIndex)) return null

    // 预览高度 = 持续时间对应的高度（与实际任务块一致）
    const height = (block.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT
    // 预览顶部偏移 = slotIndex 对应的 y 坐标
    const top = slotIndex * SLOT_HEIGHT

    return { dayKey: target.date, top, height }
  }, [active, over, taskBlocks])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 周列头 */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-0 border-b border-brand-200/30 bg-white/40 sticky top-0 z-10">
        <div className="border-r border-brand-200/20" />
        {weekDays.map((day) => {
          const dayKey = toDateKey(day)
          const isToday = checkIsToday(day)
          const isSelected = isSameDate(day, fromDateKey(selectedDate))
          const importantDay = importantDays.find((d) => d.date === dayKey)
          const isCriticalDay = importantDay?.importance === 'critical'
          const isImportantDay = importantDay?.importance === 'important'
          return (
            <button
              key={dayKey}
              onClick={() => setSelectedDate(dayKey)}
              className={`relative flex flex-col items-center justify-center py-2 border-r border-brand-200/20 last:border-r-0 transition-colors ${
                isSelected ? 'bg-brand-100/60' : 'hover:bg-brand-50/40'
              } ${
                isCriticalDay
                  ? 'border-b-2 border-b-danger-500'
                  : isImportantDay
                    ? 'border-b-2 border-b-accent-400'
                    : ''
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday ? 'text-brand-600' : 'text-ink-muted'
                }`}
              >
                {formatDayHeader(day).split(' ')[0]}
              </span>
              <span
                className={`text-sm font-bold mt-0.5 ${
                  isToday
                    ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white'
                    : 'text-ink'
                }`}
              >
                {day.getDate()}
              </span>
              {importantDay && (
                <span
                  className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    isCriticalDay ? 'bg-danger-500' : 'bg-accent-400'
                  }`}
                  title={isCriticalDay ? '极重要日期' : '重要日期'}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 时间格主体 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-0">
          {/* 时间轴列 */}
          <div className="border-r border-brand-200/20">
            {timeLabels.map((t) => (
              <div
                key={t.minutes}
                className="flex items-start justify-end pr-1.5 text-[10px] font-mono text-ink-muted/70 border-b border-brand-200/10"
                style={{ height: SLOT_HEIGHT * SLOTS_PER_HOUR }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* 每天的列 */}
          {weekDays.map((day) => {
            const dayKey = toDateKey(day)
            const dayEntries = entriesByDay.get(dayKey) ?? []
            return (
              <div
                key={dayKey}
                className="border-r border-brand-200/20 last:border-r-0 relative"
              >
                {/* 时间格 drop targets */}
                {Array.from({ length: TOTAL_SLOTS }, (_, slotIndex) => {
                  const slotStart = START_HOUR * 60 + slotIndex * SLOT_MINUTES
                  // 该格内是否有已安排任务块
                  const entriesInSlot = dayEntries.filter((e) => {
                    if (!e.startTime) return false
                    const entryStart = timeStringToMinutes(e.startTime)
                    return entryStart >= slotStart && entryStart < slotStart + SLOT_MINUTES
                  })

                  return (
                    <DroppableSlot key={slotIndex} dayKey={dayKey} slotIndex={slotIndex}>
                      {entriesInSlot.map((entry) => {
                        const block = taskBlocks.find((b) => b.id === entry.blockId)
                        const task = tasks.find((t) => t.id === entry.taskId)
                        if (!block || !task) return null
                        const entryStart = timeStringToMinutes(entry.startTime!)
                        const offsetMinutes = entryStart - slotStart
                        return (
                          <div
                            key={entry.id}
                            className="absolute left-0.5 right-0.5 z-10"
                            style={{
                              top: (offsetMinutes / SLOT_MINUTES) * SLOT_HEIGHT,
                              height: (block.durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 2,
                            }}
                          >
                            <ScheduledTaskBlock
                              entry={entry}
                              task={task}
                              block={block}
                            />
                          </div>
                        )
                      })}
                    </DroppableSlot>
                  )
                })}

                {/* 拖拽吸附预览：半透明块显示任务将占据的时长 */}
                {dragPreview && dragPreview.dayKey === dayKey && (
                  <div
                    className="absolute left-0.5 right-0.5 pointer-events-none rounded-lg border-2 border-dashed border-brand-400 bg-brand-400/20 animate-fade-in"
                    style={{
                      top: dragPreview.top + 1,
                      height: dragPreview.height - 2,
                      zIndex: 15,
                    }}
                  />
                )}

                {/* 今日高亮线 */}
                {checkIsToday(day) && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-danger-500 z-20 pointer-events-none"
                    style={{
                      top:
                        ((new Date().getHours() * 60 + new Date().getMinutes() -
                          START_HOUR * 60) /
                          SLOT_MINUTES) *
                        SLOT_HEIGHT,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 底部状态条 */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-ink-muted border-t border-brand-200/30 bg-white/30">
        <span>
          时间范围 {minutesToTimeString(START_HOUR * 60)} - {minutesToTimeString(END_HOUR * 60)}
        </span>
        <span>当前共 {scheduleEntries.length} 条排期</span>
      </div>
    </div>
  )
}

// 重新导出便于使用
export { formatDuration }
