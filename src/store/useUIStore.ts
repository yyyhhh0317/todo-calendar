/**
 * UI 状态管理
 * 管理当前视图、当前周/月、选中日期等界面状态
 */
import { create } from 'zustand'
import { navigateMonth, navigateWeek, toDateKey } from '@/shared/utils/date'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence'

export type ViewMode = 'week' | 'month'

interface UIState {
  /** 当前视图模式 */
  viewMode: ViewMode
  /** 周视图的参考日期（默认今天所在周） */
  weekRefDate: string
  /** 月视图的参考日期（默认今天所在月） */
  monthRefDate: string
  /** 当前选中的日期（YYYY-MM-DD） */
  selectedDate: string

  // 动作
  setViewMode: (mode: ViewMode) => void
  goToToday: () => void
  navigatePrev: () => void
  navigateNext: () => void
  setSelectedDate: (date: string) => void
  /** 点击月历某天，切换到该天所在周的周视图 */
  jumpToWeekFromDate: (date: string) => void
}

function todayKey(): string {
  return toDateKey(new Date())
}

interface PersistedUI {
  viewMode: ViewMode
  weekRefDate: string
  monthRefDate: string
  selectedDate: string
}

function loadPersistedUI(): Partial<PersistedUI> {
  return loadFromStorage<PersistedUI>(STORAGE_KEYS.ui) ?? {}
}

const today = todayKey()

export const useUIStore = create<UIState>((set, get) => {
  const persisted = loadPersistedUI()

  // 持久化副作用
  const persist = () => {
    const { viewMode, weekRefDate, monthRefDate, selectedDate } = get()
    saveToStorage(STORAGE_KEYS.ui, { viewMode, weekRefDate, monthRefDate, selectedDate })
  }

  return {
    viewMode: persisted.viewMode ?? 'week',
    weekRefDate: persisted.weekRefDate ?? today,
    monthRefDate: persisted.monthRefDate ?? today,
    selectedDate: persisted.selectedDate ?? today,

    setViewMode: (mode) => {
      set({ viewMode: mode })
      persist()
    },

    goToToday: () => {
      const t = todayKey()
      set({ weekRefDate: t, monthRefDate: t, selectedDate: t })
      persist()
    },

    navigatePrev: () => {
      const { viewMode, weekRefDate, monthRefDate } = get()
      if (viewMode === 'week') {
        set({ weekRefDate: toDateKey(navigateWeek(new Date(weekRefDate), 'prev')) })
      } else {
        set({ monthRefDate: toDateKey(navigateMonth(new Date(monthRefDate), 'prev')) })
      }
      persist()
    },

    navigateNext: () => {
      const { viewMode, weekRefDate, monthRefDate } = get()
      if (viewMode === 'week') {
        set({ weekRefDate: toDateKey(navigateWeek(new Date(weekRefDate), 'next')) })
      } else {
        set({ monthRefDate: toDateKey(navigateMonth(new Date(monthRefDate), 'next')) })
      }
      persist()
    },

    setSelectedDate: (date) => {
      set({ selectedDate: date })
      persist()
    },

    jumpToWeekFromDate: (date) => {
      set({
        viewMode: 'week',
        weekRefDate: date,
        selectedDate: date,
      })
      persist()
    },
  }
})
