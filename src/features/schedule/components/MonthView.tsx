/**
 * 月视图
 * 月历网格，每一天展示当天已安排任务的摘要
 * 点击日期切换到该日期所在周
 */
import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  getMonthGridDays,
  formatMonthTitle,
  toDateKey,
  fromDateKey,
  checkIsToday,
  isInSameMonth,
} from '@/shared/utils/date'
import { useUIStore } from '@/store/useUIStore'
import { useTaskStore } from '@/store/useTaskStore'
import type { ScheduleEntry } from '../scheduleTypes'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const MAX_VISIBLE_ENTRIES = 3

interface MonthDayCellProps {
  date: Date
  isCurrentMonth: boolean
  entries: ScheduleEntry[]
}

function MonthDayCell({ date, isCurrentMonth, entries }: MonthDayCellProps) {
  const dayKey = toDateKey(date)
  const { selectedDate, setSelectedDate, jumpToWeekFromDate } = useUIStore()
  const { tasks, importantDays } = useTaskStore()

  const { setNodeRef, isOver } = useDroppable({
    id: `month-${dayKey}`,
    data: { type: 'month-day', date: dayKey },
  })

  const isToday = checkIsToday(date)
  const isSelected = selectedDate === dayKey
  const importantDay = importantDays.find((d) => d.date === dayKey)
  const isCriticalDay = importantDay?.importance === 'critical'
  const isImportantDay = importantDay?.importance === 'important'
  const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES)
  const hiddenCount = entries.length - MAX_VISIBLE_ENTRIES

  const handleClick = () => {
    setSelectedDate(dayKey)
  }

  const handleDoubleClick = () => {
    jumpToWeekFromDate(dayKey)
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group relative flex flex-col min-h-[88px] p-1.5 border border-brand-200/15 cursor-pointer transition-colors ${
        isOver ? 'bg-brand-100/60 border-brand-400' : 'hover:bg-brand-50/40'
      } ${
        !isCurrentMonth ? 'opacity-40' : ''
      } ${
        isSelected ? 'ring-2 ring-brand-400 ring-inset' : ''
      } ${
        isCriticalDay
          ? 'bg-gradient-to-br from-danger-50/70 to-white border-danger-300/50'
          : isImportantDay
            ? 'bg-gradient-to-br from-accent-50/60 to-white border-accent-200/40'
            : ''
      }`}
    >
      {/* 日期数字 */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`inline-flex items-center justify-center text-xs font-semibold w-6 h-6 rounded-full ${
            isToday
              ? 'bg-brand-500 text-white'
              : isCriticalDay
                ? 'text-danger-600'
                : isImportantDay
                  ? 'text-accent-600'
                  : 'text-ink'
          }`}
        >
          {date.getDate()}
        </span>
        {importantDay && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCriticalDay ? 'bg-danger-500' : 'bg-accent-400'
            }`}
            title={isCriticalDay ? '极重要日期' : '重要日期'}
          />
        )}
      </div>

      {/* 任务摘要 */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {visibleEntries.map((entry) => {
          const task = tasks.find((t) => t.id === entry.taskId)
          if (!task) return null
          const isDone = task.status === 'done'
          const isCritical = task.importance === 'critical'
          const isImportant = task.importance === 'important'
          return (
            <div
              key={entry.id}
              className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                isDone
                  ? 'bg-success-100/60 text-success-700 line-through'
                  : isCritical
                    ? 'bg-danger-100/70 text-danger-700 font-semibold'
                    : isImportant
                      ? 'bg-accent-100/70 text-accent-700'
                      : 'bg-brand-100/60 text-brand-700'
              }`}
              title={task.title}
            >
              {entry.startTime && (
                <span className="font-mono opacity-70 mr-1">{entry.startTime}</span>
              )}
              {task.title}
            </div>
          )
        })}
        {hiddenCount > 0 && (
          <div className="text-[10px] text-ink-muted px-1">+{hiddenCount} 更多</div>
        )}
      </div>
    </div>
  )
}

export function MonthView() {
  const { monthRefDate } = useUIStore()
  const { scheduleEntries } = useTaskStore()

  const gridDays = useMemo(
    () => getMonthGridDays(fromDateKey(monthRefDate)),
    [monthRefDate],
  )

  const entriesByDay = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>()
    for (const entry of scheduleEntries) {
      const list = map.get(entry.date) ?? []
      list.push(entry)
      map.set(entry.date, list)
    }
    return map
  }, [scheduleEntries])

  const monthRef = fromDateKey(monthRefDate)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 星期表头 */}
      <div className="grid grid-cols-7 border-b border-brand-200/30 bg-white/40">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center py-2 text-xs font-semibold border-r border-brand-200/20 last:border-r-0 ${
              i >= 5 ? 'text-danger-500/70' : 'text-ink-muted'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 月历网格 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-7 gap-0">
          {gridDays.map((day) => {
            const dayKey = toDateKey(day)
            return (
              <MonthDayCell
                key={dayKey}
                date={day}
                isCurrentMonth={isInSameMonth(day, monthRef)}
                entries={entriesByDay.get(dayKey) ?? []}
              />
            )
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-ink-muted border-t border-brand-200/30 bg-white/30">
        <span>{formatMonthTitle(monthRef)}</span>
        <span>双击日期可切换到周视图</span>
      </div>
    </div>
  )
}
