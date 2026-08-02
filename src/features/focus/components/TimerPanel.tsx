/**
 * 计时器面板
 * 支持正向计时（stopwatch）和固定时长倒计时（countdown）
 * 启动、暂停、继续、结束
 */
import { useState } from 'react'
import { useTimerStore } from '@/store/useTimerStore'
import { useTaskStore } from '@/store/useTaskStore'
import { Button } from '@/shared/components/Button'
import { SegmentedControl } from '@/shared/components/SegmentedControl'
import {
  PlayIcon,
  PauseIcon,
  TimerIcon,
  CheckIcon,
} from '@/shared/components/Icons'
import { formatStopwatch } from '@/shared/utils/time'
import type { TimerMode } from '../focusTypes'
import { cn } from '@/shared/utils/cn'

const COUNTDOWN_PRESETS = [
  { minutes: 15, label: '15 分钟' },
  { minutes: 25, label: '25 分钟' },
  { minutes: 45, label: '45 分钟' },
  { minutes: 60, label: '1 小时' },
]

interface TimerPanelProps {
  onClose?: () => void
}

export function TimerPanel({ onClose }: TimerPanelProps) {
  const { activeTimerId, timerSessions, startTimer, pauseTimer, resumeTimer, finishTimer } =
    useTimerStore()
  const { tasks } = useTaskStore()

  const [mode, setMode] = useState<TimerMode>('stopwatch')
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [taskId, setTaskId] = useState<string | undefined>(undefined)

  const activeTimer = activeTimerId
    ? timerSessions.find((t) => t.id === activeTimerId)
    : null

  const activeTask = activeTimer?.taskId
    ? tasks.find((t) => t.id === activeTimer.taskId)
    : null

  // 倒计时模式剩余秒数
  const remainingSeconds =
    activeTimer?.mode === 'countdown' && activeTimer.durationMinutes
      ? Math.max(0, activeTimer.durationMinutes * 60 - activeTimer.elapsedSeconds)
      : activeTimer?.elapsedSeconds ?? 0

  const progress =
    activeTimer?.mode === 'countdown' && activeTimer.durationMinutes
      ? Math.min(100, (activeTimer.elapsedSeconds / (activeTimer.durationMinutes * 60)) * 100)
      : 0

  const handleStart = () => {
    startTimer({
      mode,
      taskId,
      durationMinutes: mode === 'countdown' ? durationMinutes : undefined,
    })
  }

  return (
    <div className="glass-panel p-4 w-80 space-y-3 animate-slide-up">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <TimerIcon size={16} />
          计时器
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="!h-7 !px-2">
            关闭
          </Button>
        )}
      </div>

      {activeTimer ? (
        // 运行中 / 暂停中 的计时器显示
        <div className="space-y-3">
          {/* 计时显示 */}
          <div className="text-center py-2">
            <div
              className={cn(
                'text-4xl font-mono font-bold tabular-nums',
                activeTimer.status === 'finished'
                  ? 'text-success-600'
                  : activeTimer.mode === 'countdown' && remainingSeconds < 60
                    ? 'text-danger-600'
                    : 'text-ink',
              )}
            >
              {activeTimer.mode === 'countdown'
                ? formatStopwatch(remainingSeconds)
                : formatStopwatch(activeTimer.elapsedSeconds)}
            </div>
            <div className="text-xs text-ink-muted mt-1">
              {activeTimer.mode === 'stopwatch' ? '正向计时' : `倒计时 ${activeTimer.durationMinutes} 分钟`}
              {activeTask && ` · ${activeTask.title}`}
            </div>
          </div>

          {/* 倒计时进度条 */}
          {activeTimer.mode === 'countdown' && (
            <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* 状态标签 */}
          <div className="flex justify-center">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                activeTimer.status === 'running'
                  ? 'bg-accent-100 text-accent-700'
                  : activeTimer.status === 'paused'
                    ? 'bg-star-100 text-star-600'
                    : 'bg-success-100 text-success-700',
              )}
            >
              {activeTimer.status === 'running' && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              )}
              {activeTimer.status === 'running' ? '运行中' : activeTimer.status === 'paused' ? '已暂停' : '已完成'}
            </span>
          </div>

          {/* 控制按钮 */}
          {activeTimer.status !== 'finished' && (
            <div className="flex items-center gap-2">
              {activeTimer.status === 'running' ? (
                <Button variant="secondary" size="md" onClick={pauseTimer} className="flex-1">
                  <PauseIcon size={16} />
                  暂停
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={resumeTimer} className="flex-1">
                  <PlayIcon size={16} />
                  继续
                </Button>
              )}
              <Button variant="danger" size="md" onClick={finishTimer} className="flex-1">
                <CheckIcon size={16} />
                结束
              </Button>
            </div>
          )}

          {activeTimer.status === 'finished' && (
            <div className="text-center text-xs text-ink-muted">
              本次计时 {formatStopwatch(activeTimer.elapsedSeconds)}
            </div>
          )}
        </div>
      ) : (
        // 配置新计时器
        <div className="space-y-3">
          {/* 模式选择 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">模式</span>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { value: 'stopwatch', label: '正向计时' },
                { value: 'countdown', label: '倒计时' },
              ]}
            />
          </div>

          {/* 倒计时时长选择 */}
          {mode === 'countdown' && (
            <div className="space-y-2">
              <span className="text-xs text-ink-muted">时长</span>
              <div className="grid grid-cols-2 gap-1.5">
                {COUNTDOWN_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    onClick={() => setDurationMinutes(preset.minutes)}
                    className={cn(
                      'h-9 text-xs rounded-lg transition-colors',
                      durationMinutes === preset.minutes
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/60 text-ink-muted hover:bg-brand-50',
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 关联任务（可选） */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-ink-muted">关联任务（可选）</span>
              <select
                value={taskId ?? ''}
                onChange={(e) => setTaskId(e.target.value || undefined)}
                className="w-full h-9 px-2 text-sm bg-white/70 border border-brand-200/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">不关联</option>
                {tasks.slice(0, 20).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" size="md" onClick={handleStart} className="w-full">
            <PlayIcon size={16} />
            开始计时
          </Button>
        </div>
      )}
    </div>
  )
}
