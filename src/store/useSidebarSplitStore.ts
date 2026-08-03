/**
 * 右侧任务栏两区（未安排 / 已安排）的分隔比例
 */
import { create } from 'zustand'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence'

const DEFAULT_UNSCHEDULED_RATIO = 0.6 // 未安排区默认占 60%
const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

interface SidebarSplitState {
  unscheduledRatio: number
  setUnscheduledRatio: (ratio: number) => void
}

function clamp(v: number) {
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, v))
}

export const useSidebarSplitStore = create<SidebarSplitState>((set, get) => {
  const persist = () => {
    saveToStorage(STORAGE_KEYS.sidebarSplit, {
      unscheduledRatio: get().unscheduledRatio,
    })
  }

  const loaded = loadFromStorage<{ unscheduledRatio?: number }>(STORAGE_KEYS.sidebarSplit)
  const initial = clamp(loaded?.unscheduledRatio ?? DEFAULT_UNSCHEDULED_RATIO)

  return {
    unscheduledRatio: initial,
    setUnscheduledRatio: (r) => {
      set({ unscheduledRatio: clamp(r) })
      persist()
    },
  }
})
