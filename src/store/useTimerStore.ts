/**
 * 计时器状态管理
 * 支持正向计时（stopwatch）和固定时长倒计时（countdown）
 * 首版规则：同一时间只允许一个运行中计时器
 * 计时器暂停/结束时，会把新增实际分钟数累加回关联任务的 totalMinutesSpent
 */
import { create } from 'zustand'
import type { TimerSession, TimerMode, TimerStatus } from '@/features/focus/focusTypes'
import { generateId } from '@/shared/utils/id'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence'

interface TimerState {
  /** 所有计时器会话历史 */
  timerSessions: TimerSession[]
  /** 当前活跃的计时器 ID（运行中或暂停中） */
  activeTimerId: string | null

  // 动作
  startTimer: (input: {
    mode: TimerMode
    taskId?: string
    blockId?: string
    /** 倒计时模式必填，分钟 */
    durationMinutes?: number
  }) => string
  pauseTimer: () => void
  resumeTimer: () => void
  finishTimer: () => void
  /** 删除计时器会话（仅非运行中） */
  removeTimer: (id: string) => void
  /** 每秒由组件层调用，推进计时 */
  tick: () => void
  /** 获取当前活跃计时器 */
  getActiveTimer: () => TimerSession | null
  /**
   * 完成关联任务时：停止计时器 + 将当前已用秒数计入任务用时后结束会话。
   * 返回应当额外累加的分钟数（供 completeTask 合并写入）
   */
  settleTimerForTask: (taskId: string) => number
}

function loadInitialSessions(): TimerSession[] {
  const raw = loadFromStorage<TimerSession[]>(STORAGE_KEYS.timerSessions)
  if (!raw) return []
  // 旧数据兼容：补全 accountedMinutes 默认值
  return raw.map((s) => ({
    ...s,
    accountedMinutes: (s as TimerSession & { accountedMinutes?: number }).accountedMinutes ?? 0,
  }))
}

/** 从 useTaskStore 同步注入的累加函数（在 store 初始化后调用 setMinutesSpentSync 绑定） */
let minutesSpentSync: ((taskId: string, minutes: number) => void) | null = null
let stopActiveTimer: ((taskId: string) => void) | null = null

/** 外部绑定：计时器 → 任务用时 的同步回调 */
export function setMinutesSpentSync(fn: (taskId: string, minutes: number) => void) {
  minutesSpentSync = fn
}

/** 外部绑定：完成任务时要求计时器停止关联计时 */
export function setActiveTaskTimerStopper(fn: (taskId: string) => void) {
  stopActiveTimer = fn
}

/** 通知计时器：某任务将被完成，请结算其会话用时。返回应追加的分钟数（秒向上取整） */
export function settleActiveTimerForTask(taskId: string): number {
  if (!stopActiveTimer) return 0
  return useTimerStore.getState().settleTimerForTask(taskId)
}

/** 把秒转成分钟（向上取整到 1 分钟） */
function secondsToMinutes(sec: number): number {
  return Math.max(1, Math.ceil(sec / 60))
}

export const useTimerStore = create<TimerState>((set, get) => {
  const persist = () => {
    const { timerSessions } = get()
    saveToStorage(STORAGE_KEYS.timerSessions, timerSessions)
  }

  /**
   * 将一次会话中新增长的已用时间（以 accountMinutes 为底）换算成整分钟
   * 并写回任务的 totalMinutesSpent，同时更新 accountedMinutes 避免重复计费
   */
  const billElapsedToTask = (session: TimerSession) => {
    if (!session.taskId) return session
    const prev = (session as TimerSession & { accountedMinutes?: number }).accountedMinutes ?? 0
    const totalMins = secondsToMinutes(session.elapsedSeconds)
    const delta = totalMins - prev
    if (delta <= 0) return session
    if (minutesSpentSync) minutesSpentSync(session.taskId, delta)
    return { ...session, accountedMinutes: totalMins } as TimerSession
  }

  return {
    timerSessions: loadInitialSessions(),
    activeTimerId: null,

    startTimer: (input) => {
      const id = generateId('timer')
      const now = new Date().toISOString()
      const session: TimerSession = {
        id,
        mode: input.mode,
        taskId: input.taskId,
        blockId: input.blockId,
        status: 'running',
        startedAt: now,
        durationMinutes: input.durationMinutes,
        elapsedSeconds: 0,
        accountedMinutes: 0,
      }
      set((s) => ({
        timerSessions: [...s.timerSessions, session],
        activeTimerId: id,
      }))
      persist()
      return id
    },

    pauseTimer: () => {
      const { activeTimerId } = get()
      if (!activeTimerId) return
      set((s) => ({
        timerSessions: s.timerSessions.map((t) => {
          if (t.id !== activeTimerId) return t
          const paused = { ...t, status: 'paused' as TimerStatus, pausedAt: new Date().toISOString() }
          return billElapsedToTask(paused)
        }),
      }))
      persist()
    },

    resumeTimer: () => {
      const { activeTimerId } = get()
      if (!activeTimerId) return
      set((s) => ({
        timerSessions: s.timerSessions.map((t) =>
          t.id === activeTimerId
            ? { ...t, status: 'running' as TimerStatus, pausedAt: undefined }
            : t,
        ),
      }))
      persist()
    },

    finishTimer: () => {
      const { activeTimerId } = get()
      if (!activeTimerId) return
      set((s) => ({
        timerSessions: s.timerSessions.map((t) => {
          if (t.id !== activeTimerId) return t
          const finished = { ...t, status: 'finished' as TimerStatus, finishedAt: new Date().toISOString() }
          return billElapsedToTask(finished)
        }),
        activeTimerId: null,
      }))
      persist()
    },

    removeTimer: (id) => {
      set((s) => {
        const target = s.timerSessions.find((t) => t.id === id)
        if (!target || target.status === 'running') return s
        return {
          timerSessions: s.timerSessions.filter((t) => t.id !== id),
          activeTimerId: s.activeTimerId === id ? null : s.activeTimerId,
        }
      })
      persist()
    },

    tick: () => {
      const { activeTimerId } = get()
      if (!activeTimerId) return
      set((s) => {
        const timer = s.timerSessions.find((t) => t.id === activeTimerId)
        if (!timer || timer.status !== 'running') return s

        const nextElapsed = timer.elapsedSeconds + 1

        // 倒计时模式：检查是否到达目标
        if (timer.mode === 'countdown' && timer.durationMinutes) {
          const targetSeconds = timer.durationMinutes * 60
          if (nextElapsed >= targetSeconds) {
            const finished: TimerSession = {
              ...timer,
              elapsedSeconds: targetSeconds,
              status: 'finished',
              finishedAt: new Date().toISOString(),
            }
            const billed = billElapsedToTask(finished)
            return {
              timerSessions: s.timerSessions.map((t) => (t.id === activeTimerId ? billed : t)),
              activeTimerId: null,
            }
          }
        }

        return {
          timerSessions: s.timerSessions.map((t) =>
            t.id === activeTimerId ? { ...t, elapsedSeconds: nextElapsed } : t,
          ),
        }
      })
      persist()
    },

    getActiveTimer: () => {
      const { activeTimerId, timerSessions } = get()
      if (!activeTimerId) return null
      return timerSessions.find((t) => t.id === activeTimerId) ?? null
    },

    settleTimerForTask: (taskId) => {
      const { activeTimerId, timerSessions } = get()
      const active = timerSessions.find((t) => t.id === activeTimerId)
      if (!active || active.taskId !== taskId) return 0

      // 先按当前 elapsedSeconds 结账
      const billed = billElapsedToTask(active)
      const total =
        (billed as TimerSession & { accountedMinutes?: number }).accountedMinutes ??
        secondsToMinutes(active.elapsedSeconds)
      // 结束该会话
      set((s) => ({
        timerSessions: s.timerSessions.map((t) =>
          t.id === activeTimerId
            ? { ...billed, status: 'finished' as TimerStatus, finishedAt: new Date().toISOString() }
            : t,
        ),
        activeTimerId: null,
      }))
      persist()
      return total
    },
  }
})
