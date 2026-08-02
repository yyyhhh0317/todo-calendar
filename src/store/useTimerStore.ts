/**
 * 计时器状态管理
 * 支持正向计时（stopwatch）和固定时长倒计时（countdown）
 * 首版规则：同一时间只允许一个运行中计时器
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
}

function loadInitialSessions(): TimerSession[] {
  return loadFromStorage<TimerSession[]>(STORAGE_KEYS.timerSessions) ?? []
}

export const useTimerStore = create<TimerState>((set, get) => {
  const persist = () => {
    const { timerSessions } = get()
    saveToStorage(STORAGE_KEYS.timerSessions, timerSessions)
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
        timerSessions: s.timerSessions.map((t) =>
          t.id === activeTimerId
            ? { ...t, status: 'paused' as TimerStatus, pausedAt: new Date().toISOString() }
            : t,
        ),
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
        timerSessions: s.timerSessions.map((t) =>
          t.id === activeTimerId
            ? { ...t, status: 'finished' as TimerStatus, finishedAt: new Date().toISOString() }
            : t,
        ),
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
            return {
              timerSessions: s.timerSessions.map((t) =>
                t.id === activeTimerId
                  ? {
                      ...t,
                      elapsedSeconds: targetSeconds,
                      status: 'finished' as TimerStatus,
                      finishedAt: new Date().toISOString(),
                    }
                  : t,
              ),
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
  }
})
