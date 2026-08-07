/**
 * 任务筛选状态管理
 * 管理搜索关键词和筛选条件（不持久化，默认会话级状态即可；
 * 但保留持久化能力以备后续需要）
 */
import { create } from 'zustand'

/** 状态筛选值 */
export type StatusFilter = 'all' | 'todo' | 'partial' | 'done'

/** 重要程度筛选值 */
export type ImportanceFilter = 'all' | 'normal' | 'important' | 'critical'

interface FilterState {
  /** 搜索关键词（按任务标题模糊匹配，不区分大小写） */
  keyword: string
  /** 状态筛选 */
  status: StatusFilter
  /** 重要程度筛选 */
  importance: ImportanceFilter

  // 动作
  setKeyword: (keyword: string) => void
  setStatus: (status: StatusFilter) => void
  setImportance: (importance: ImportanceFilter) => void
  /** 重置所有筛选条件 */
  reset: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  keyword: '',
  status: 'all',
  importance: 'all',

  setKeyword: (keyword) => set({ keyword }),
  setStatus: (status) => set({ status }),
  setImportance: (importance) => set({ importance }),
  reset: () => set({ keyword: '', status: 'all', importance: 'all' }),
}))
