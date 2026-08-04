/**
 * 顶部工具栏
 * 放置应用标题、周/月视图切换、今天按钮、上一周/下一周或上一月/下一月按钮
 */
import { useUIStore } from '@/store/useUIStore'
import { useTimerStore } from '@/store/useTimerStore'
import {
  formatMonthTitle,
  formatWeekRange,
  fromDateKey,
} from '@/shared/utils/date'
import { Button } from '@/shared/components/Button'
import { SegmentedControl } from '@/shared/components/SegmentedControl'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  TimerIcon,
  SettingsIcon,
} from '@/shared/components/Icons'

interface TopBarProps {
  onOpenTimer?: () => void
  onOpenSettings?: () => void
}

export function TopBar({ onOpenTimer, onOpenSettings }: TopBarProps = {}) {
  const { viewMode, setViewMode, goToToday, navigatePrev, navigateNext, weekRefDate, monthRefDate } =
    useUIStore()
  const { activeTimerId } = useTimerStore()

  const rangeLabel =
    viewMode === 'week'
      ? formatWeekRange(fromDateKey(weekRefDate))
      : formatMonthTitle(fromDateKey(monthRefDate))

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-brand-200/30 bg-white/40 backdrop-blur-glass">
      {/* 左侧：标题 */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm shrink-0">
          <CalendarIcon size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink leading-tight truncate">Todo Calendar</h1>
          <p className="text-xs text-ink-muted leading-tight truncate">时间安排工作台</p>
        </div>
      </div>

      {/* 中间：日期导航 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={navigatePrev} aria-label="上一个">
          <ChevronLeftIcon />
        </Button>
        <span className="text-sm font-semibold text-ink min-w-[140px] text-center tabular-nums">
          {rangeLabel}
        </span>
        <Button variant="ghost" size="icon" onClick={navigateNext} aria-label="下一个">
          <ChevronRightIcon />
        </Button>
        <Button variant="secondary" size="sm" onClick={goToToday} className="ml-2">
          今天
        </Button>
      </div>

      {/* 右侧：视图切换 + 计时器入口 */}
      <div className="flex items-center gap-3">
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'week', label: '周视图' },
            { value: 'month', label: '月视图' },
          ]}
        />
        <Button
          variant={activeTimerId ? 'primary' : 'ghost'}
          size="icon"
          onClick={onOpenTimer}
          aria-label="计时器"
          title="计时器"
        >
          <TimerIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="设置"
          title="设置"
        >
          <SettingsIcon />
        </Button>
      </div>
    </header>
  )
}
