/**
 * 本地持久化工具
 * 首版使用 localStorage，后续可迁移到 IndexedDB
 */

const STORAGE_PREFIX = 'todo-calendar:'

/**
 * 读取持久化数据
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[persistence] 读取 ${key} 失败:`, err)
    return null
  }
}

/**
 * 写入持久化数据
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[persistence] 写入 ${key} 失败:`, err)
  }
}

/**
 * 清除指定持久化数据
 */
export function removeFromStorage(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

/** 持久化键名常量 */
export const STORAGE_KEYS = {
  tasks: 'tasks',
  taskBlocks: 'task-blocks',
  scheduleEntries: 'schedule-entries',
  importantDays: 'important-days',
  timerSessions: 'timer-sessions',
  ui: 'ui',
} as const
