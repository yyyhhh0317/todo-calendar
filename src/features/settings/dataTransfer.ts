/**
 * 数据导入导出
 * 基于 localStorage 实现全量 JSON 备份与恢复
 */
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/store/persistence'

/** 备份格式版本 */
const BACKUP_VERSION = 1

/** 需要导出的持久化键名列表 */
const EXPORT_KEYS = [
  STORAGE_KEYS.tasks,
  STORAGE_KEYS.taskBlocks,
  STORAGE_KEYS.scheduleEntries,
  STORAGE_KEYS.importantDays,
  STORAGE_KEYS.timerSessions,
  STORAGE_KEYS.ui,
  STORAGE_KEYS.sidebarSplit,
] as const

/** 备份数据结构 */
export interface BackupData {
  version: number
  exportedAt: string
  app: string
  data: Record<string, unknown>
}

/**
 * 收集当前所有持久化数据
 */
export function collectBackupData(): BackupData {
  const data: Record<string, unknown> = {}
  for (const key of EXPORT_KEYS) {
    const value = loadFromStorage<unknown>(key)
    if (value !== null) {
      data[key] = value
    }
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'todo-calendar',
    data,
  }
}

/**
 * 触发浏览器下载 JSON 备份文件
 */
export function downloadBackup(): void {
  const backup = collectBackupData()
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `todo-calendar-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 校验结果 */
export interface ValidationResult {
  ok: boolean
  data?: BackupData
  error?: string
}

/**
 * 校验导入的 JSON 字符串是否为合法备份
 */
export function validateImport(raw: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'JSON 格式错误，无法解析' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: '备份数据结构无效' }
  }

  const obj = parsed as Record<string, unknown>
  if (obj.app !== 'todo-calendar') {
    return { ok: false, error: '该文件不是 Todo Calendar 备份文件' }
  }
  if (typeof obj.version !== 'number') {
    return { ok: false, error: '备份缺少版本信息' }
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    return { ok: false, error: '备份数据内容缺失' }
  }

  return { ok: true, data: obj as unknown as BackupData }
}

/**
 * 从备份恢复数据（覆盖当前数据）
 * 写入 localStorage 后刷新页面以重置所有 store 状态
 */
export function restoreBackup(backup: BackupData): void {
  for (const key of EXPORT_KEYS) {
    const value = (backup.data as Record<string, unknown>)[key]
    if (value !== undefined) {
      saveToStorage(key, value)
    }
  }
  // 刷新页面，让所有 store 从 localStorage 重新初始化
  window.location.reload()
}