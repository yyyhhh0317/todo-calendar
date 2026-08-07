/**
 * 主题状态管理
 * 支持 light / dark / system 三种模式
 * - system：跟随 prefers-color-scheme
 * - light / dark：手动覆盖
 * 主题持久化到 localStorage，刷新后保留
 */
import { create } from 'zustand'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence'

export type ThemeMode = 'light' | 'dark' | 'system'

/** 实际生效的主题（system 解析后的真实值） */
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  /** 用户选择的模式 */
  mode: ThemeMode
  /** 解析后的实际主题（system 模式下根据系统偏好计算） */
  resolved: ResolvedTheme
  /** 设置模式 */
  setMode: (mode: ThemeMode) => void
  /** 系统主题变化时，重新解析 resolved（仅 system 模式下生效） */
  syncWithSystem: () => void
}

/** 读取系统主题偏好 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 根据模式计算实际主题 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

/** 将实际主题应用到 <html> 元素 */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function loadPersistedMode(): ThemeMode {
  const saved = loadFromStorage<ThemeMode>(STORAGE_KEYS.theme)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = loadPersistedMode()
  const initialResolved = resolveTheme(initialMode)
  // 初始化时立即应用主题，避免闪烁
  applyTheme(initialResolved)

  return {
    mode: initialMode,
    resolved: initialResolved,

    setMode: (mode) => {
      const resolved = resolveTheme(mode)
      applyTheme(resolved)
      saveToStorage(STORAGE_KEYS.theme, mode)
      set({ mode, resolved })
    },

    syncWithSystem: () => {
      const { mode } = get()
      if (mode !== 'system') return
      const resolved = getSystemTheme()
      applyTheme(resolved)
      set({ resolved })
    },
  }
})
