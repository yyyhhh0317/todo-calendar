/**
 * 统计回顾面板
 * 纯 SVG 图表，零依赖
 */
import { useMemo } from 'react'
import { Button } from '@/shared/components/Button'
import { CloseIcon, ChartIcon } from '@/shared/components/Icons'
import { useTaskStore } from '@/store/useTaskStore'
import { formatDuration } from '@/shared/utils/time'
import { fromDateKey } from '@/shared/utils/date'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  getStatsSummary,
  getDailyScheduled,
  getLastNDays,
  getHeatmapData,
  getHeatmapLevel,
} from '../statsUtils'
import { cn } from '@/shared/utils/cn'

interface StatsPanelProps {
  onClose: () => void
}

const HEATMAP_WEEKS = 8
const BAR_DAYS = 14

const HEATMAP_COLORS = [
  'bg-brand-100',
  'bg-brand-300',
  'bg-brand-400',
  'bg-brand-500',
  'bg-brand-600',
]

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function StatsPanel({ onClose }: StatsPanelProps) {
  const { tasks, taskBlocks, scheduleEntries } = useTaskStore()

  const summary = useMemo(
    () => getStatsSummary(tasks, scheduleEntries, taskBlocks),
    [tasks, scheduleEntries, taskBlocks],
  )

  const barDays = useMemo(() => getLastNDays(BAR_DAYS), [])
  const dailyScheduled = useMemo(
    () => getDailyScheduled(scheduleEntries, taskBlocks, barDays),
    [scheduleEntries, taskBlocks, barDays],
  )
  const maxMinutes = Math.max(...dailyScheduled.map((d) => d.minutes), 60)

  const heatmap = useMemo(() => getHeatmapData(tasks, HEATMAP_WEEKS), [tasks])

  const overestimate = summary.totalEstimatedMinutes > 0 && summary.totalActualMinutes > 0
    ? summary.totalActualMinutes > summary.totalEstimatedMinutes
    : false

  return (
    <div className="glass-panel p-5 w-[420px] max-h-[80vh] overflow-y-auto scrollbar-thin space-y-5 animate-slide-up">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartIcon size={18} className="text-accent-500" />
          <h2 className="text-base font-bold text-ink">统计回顾</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭" className="!h-8 !w-8">
          <CloseIcon size={16} />
        </Button>
      </div>

      {/* 摘要卡片 */}
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard
          label="完成率"
          value={`${summary.completionRate}%`}
          sub={`${summary.doneTasks} / ${summary.totalTasks} 个任务`}
          color="brand"
        />
        <SummaryCard
          label="预估总时长"
          value={formatDuration(summary.totalEstimatedMinutes)}
          sub={`实际 ${formatDuration(summary.totalActualMinutes)}`}
          color={overestimate ? 'danger' : 'accent'}
        />
        <SummaryCard
          label="排期总时长"
          value={formatDuration(summary.totalScheduledMinutes)}
          sub={`本周排期`}
          color="accent"
        />
        <SummaryCard
          label="实际用时"
          value={formatDuration(summary.totalActualMinutes)}
          sub={`预估 ${formatDuration(summary.totalEstimatedMinutes)}`}
          color={overestimate ? 'danger' : 'brand'}
        />
      </div>

      {/* 预估 vs 实际对比条 */}
      {summary.totalEstimatedMinutes > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-ink-muted">预估 vs 实际</h3>
          <div className="space-y-1">
            <ComparisonBar
              label="预估"
              minutes={summary.totalEstimatedMinutes}
              maxMinutes={Math.max(summary.totalEstimatedMinutes, summary.totalActualMinutes)}
              colorClass="bg-brand-400"
            />
            <ComparisonBar
              label="实际"
              minutes={summary.totalActualMinutes}
              maxMinutes={Math.max(summary.totalEstimatedMinutes, summary.totalActualMinutes)}
              colorClass={overestimate ? 'bg-danger-400' : 'bg-accent-400'}
            />
          </div>
          {overestimate && (
            <p className="text-xs text-danger-600 font-medium">
              实际用时超出预估 {formatDuration(summary.totalActualMinutes - summary.totalEstimatedMinutes)}
            </p>
          )}
        </div>
      )}

      {/* 每日排期柱状图 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted">最近 {BAR_DAYS} 天排期时长</h3>
        <div className="flex items-end gap-[3px] h-24 px-1">
          {dailyScheduled.map((d) => {
            const height = d.minutes === 0 ? 2 : Math.max(4, (d.minutes / maxMinutes) * 88)
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
                style={{ height: '100%' }}
              >
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-colors',
                    d.minutes > 0 ? 'bg-brand-400 group-hover:bg-brand-500' : 'bg-brand-100',
                  )}
                  style={{ height: `${height}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 px-1.5 py-0.5 rounded bg-ink/80 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {format(fromDateKey(d.date), 'M/d', { locale: zhCN })}: {formatDuration(d.minutes)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted px-1">
          <span>{format(fromDateKey(barDays[0]), 'M月d日', { locale: zhCN })}</span>
          <span>{format(fromDateKey(barDays[barDays.length - 1]), 'M月d日', { locale: zhCN })}</span>
        </div>
      </div>

      {/* 完成率热力图 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted">完成热力图（最近 {HEATMAP_WEEKS} 周）</h3>
        <div className="flex gap-1">
          {/* 星期标签 */}
          <div className="flex flex-col gap-[3px] mr-1 pt-0.5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="w-3 h-3 text-[9px] text-ink-muted flex items-center justify-center">
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
          {/* 热力图网格 */}
          <div className="flex gap-[3px] overflow-x-auto scrollbar-thin">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors',
                      HEATMAP_COLORS[getHeatmapLevel(cell.count)],
                    )}
                    title={`${cell.date}: ${cell.count} 个任务完成`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* 图例 */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-ink-muted">
          <span>少</span>
          {HEATMAP_COLORS.map((c, i) => (
            <div key={i} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
          ))}
          <span>多</span>
        </div>
      </div>

      {/* 空状态 */}
      {summary.totalTasks === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-2">
            <ChartIcon size={22} className="text-brand-300" />
          </div>
          <p className="text-xs text-ink-muted">暂无数据</p>
          <p className="text-[11px] text-ink-muted/60 mt-0.5">开始创建任务来跟踪你的时间吧</p>
        </div>
      )}
    </div>
  )
}

/** 摘要卡片 */
function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: 'brand' | 'accent' | 'danger'
}) {
  const colorMap = {
    brand: 'text-brand-600',
    accent: 'text-accent-600',
    danger: 'text-danger-600',
  }
  return (
    <div className="rounded-xl bg-white/60 border border-brand-200/40 px-3 py-2.5">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={cn('text-lg font-bold tabular-nums', colorMap[color])}>{value}</div>
      <div className="text-[10px] text-ink-muted">{sub}</div>
    </div>
  )
}

/** 对比条 */
function ComparisonBar({
  label,
  minutes,
  maxMinutes,
  colorClass,
}: {
  label: string
  minutes: number
  maxMinutes: number
  colorClass: string
}) {
  const percent = maxMinutes === 0 ? 0 : Math.round((minutes / maxMinutes) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-muted w-8 shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-brand-100/60 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-12 text-right shrink-0">
        {formatDuration(minutes)}
      </span>
    </div>
  )
}
