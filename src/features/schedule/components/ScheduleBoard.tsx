/**
 * 排期面板
 * 控制周/月视图切换和日期导航
 * 左侧排期区占 70%
 */
import { useUIStore } from '@/store/useUIStore'
import { WeekView } from './WeekView'
import { MonthView } from './MonthView'

export function ScheduleBoard() {
  const { viewMode } = useUIStore()

  return (
    <section className="flex flex-col h-full min-w-0 overflow-hidden glass-panel rounded-4xl">
      <div className="flex-1 min-h-0">{viewMode === 'week' ? <WeekView /> : <MonthView />}</div>
    </section>
  )
}
