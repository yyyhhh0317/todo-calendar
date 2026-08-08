/**
 * 本地持久化工具
 * v0.5 升级：引入数据版本号与迁移机制、容量监控、损坏数据保护
 * - 所有业务数据共享一个全局版本号（meta key 记录）
 * - 应用启动时执行 ensureStorageMigrated()，把旧版本数据逐级升级到最新
 * - 写入时估算容量，接近配额上限时告警；QuotaExceeded 时记录 issue
 * - 读取时若 JSON 损坏，原始字符串自动备份到 corrupted:<key>，避免数据彻底丢失
 */

export const STORAGE_PREFIX = 'todo-calendar:'

/** 当前数据格式版本。任何破坏性结构变更都应 +1 并注册迁移函数 */
export const DATA_VERSION = 2

/** meta 信息 */
export interface StorageMeta {
  dataVersion: number
  /** ISO datetime，最近一次成功迁移时间 */
  migratedAt?: string
}

const META_KEY = 'meta'
const ISSUE_STORAGE = 'storage-issue'
const ISSUE_MIGRATION = 'migration-issue'

/**
 * 读取持久化数据
 * 损坏时把原始字符串备份到 corrupted:<key> 兜底，返回 null
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      // 数据损坏：备份原始字符串，避免用户数据彻底丢失
      try {
        localStorage.setItem(STORAGE_PREFIX + 'corrupted:' + key, raw)
      } catch {
        /* 备份失败忽略（可能空间不足） */
      }
      console.error(`[persistence] ${key} 数据损坏，原始内容已备份到 corrupted:${key}`)
      return null
    }
  } catch (err) {
    console.warn(`[persistence] 读取 ${key} 失败:`, err)
    return null
  }
}

/**
 * 写入持久化数据
 * 捕获 QuotaExceededError，记录 storage-issue 供 UI 提示
 */
export function saveToStorage<T>(key: string, value: T): { ok: boolean; reason?: 'quota' | 'error' } {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    return { ok: true }
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    if (isQuota) {
      console.error(`[persistence] 写入 ${key} 失败：存储空间已满`)
      markStorageIssue('存储空间已满，请立即导出备份以防数据丢失')
    } else {
      console.warn(`[persistence] 写入 ${key} 失败:`, err)
    }
    return { ok: false, reason: isQuota ? 'quota' : 'error' }
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
  sidebarSplit: 'sidebar-split',
  taskFilter: 'task-filter',
  theme: 'theme',
} as const

// ---------- meta 版本管理 ----------

/** 读取 meta（无 meta 视为历史 v1 数据） */
export function readStorageMeta(): StorageMeta | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + META_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw) as StorageMeta
    if (typeof parsed.dataVersion !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/** 写入 meta */
export function writeStorageMeta(meta: StorageMeta): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + META_KEY, JSON.stringify(meta))
  } catch (err) {
    console.warn('[persistence] 写入 meta 失败:', err)
  }
}

// ---------- 迁移机制 ----------

export interface MigrationHelpers {
  /** 读取某 key（无前缀），等同 loadFromStorage */
  read: <T>(key: string) => T | null
  /** 写入某 key（无前缀），等同 saveToStorage */
  write: (key: string, value: unknown) => void
}

/** 迁移注册表：fromVersion -> 迁移函数（负责 v -> v+1） */
export type Migration = (helpers: MigrationHelpers) => void
export const MIGRATIONS: Record<number, Migration> = {}

/** 注册从 fromVersion 迁移到 fromVersion+1 的函数 */
export function registerMigration(fromVersion: number, fn: Migration): void {
  MIGRATIONS[fromVersion] = fn
}

/** 把某 key 的原始值备份到 backup:<key>（迁移前调用，作为安全网） */
function backupKey(key: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw !== null) {
      localStorage.setItem(STORAGE_PREFIX + 'backup:' + key, raw)
    }
  } catch {
    /* 备份失败忽略 */
  }
}

/**
 * 确保数据已迁移到最新版本。
 * 必须在任何 store 初始化读取 localStorage 之前调用（见 bootstrap.ts）。
 */
export function ensureStorageMigrated(): { migrated: boolean; from: number; to: number } {
  const meta = readStorageMeta()
  const from = meta?.dataVersion ?? 1
  if (from >= DATA_VERSION) {
    return { migrated: false, from, to: from }
  }

  const helpers: MigrationHelpers = {
    read: <T>(key: string) => loadFromStorage<T>(key),
    write: (key, value) => {
      saveToStorage(key, value)
    },
  }

  try {
    // 迁移前为所有业务 key 建立备份快照
    for (const key of Object.values(STORAGE_KEYS)) {
      backupKey(key)
    }
    let version = from
    while (version < DATA_VERSION) {
      const fn = MIGRATIONS[version]
      if (fn) fn(helpers)
      version++
    }
    writeStorageMeta({ dataVersion: version, migratedAt: new Date().toISOString() })
    clearIssue(ISSUE_MIGRATION)
    console.info(`[persistence] 数据迁移完成 v${from} → v${version}`)
    return { migrated: true, from, to: version }
  } catch (err) {
    const msg = `数据迁移失败（v${from} → v${DATA_VERSION}）`
    console.error(`[persistence] ${msg}:`, err)
    markIssue(ISSUE_MIGRATION, `${msg}，原始数据已保留在 backup:<key> 中，请导出备份或联系开发者`)
    return { migrated: false, from, to: from }
  }
}

// ---------- 容量监控 ----------

/** localStorage 常见配额：5MB（UTF-16 每字符 2 字节） */
export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024
/** 警告阈值：用量占比超过该值提示导出备份 */
export const STORAGE_WARN_RATIO = 0.8

export interface StorageUsage {
  /** 已用字节数（仅统计本应用 todo-calendar: 前缀的 key） */
  used: number
  /** 配额字节数 */
  quota: number
  /** 用量占比 0~1 */
  ratio: number
}

/** 估算当前存储用量（只统计本应用前缀的 key） */
export function estimateStorageUsage(): StorageUsage {
  let used = 0
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(STORAGE_PREFIX)) continue
    const v = localStorage.getItem(k) ?? ''
    // UTF-16：每字符 2 字节
    used += (k.length + v.length) * 2
  }
  return { used, quota: STORAGE_QUOTA_BYTES, ratio: used / STORAGE_QUOTA_BYTES }
}

// ---------- 健康状态（供 UI 提示） ----------

interface StorageIssue {
  message: string
  at: string
}

function markIssue(key: string, message: string): void {
  try {
    const issue: StorageIssue = { message, at: new Date().toISOString() }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(issue))
  } catch {
    /* 忽略 */
  }
}

function markStorageIssue(message: string): void {
  markIssue(ISSUE_STORAGE, message)
}

function clearIssue(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* 忽略 */
  }
}

function readIssue(key: string): StorageIssue | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return null
    return JSON.parse(raw) as StorageIssue
  } catch {
    return null
  }
}

/** 当前是否有存储空间问题（Quota 写满） */
export function getStorageIssue(): StorageIssue | null {
  return readIssue(ISSUE_STORAGE)
}

/** 清除存储空间告警（用户处理后调用） */
export function clearStorageIssue(): void {
  clearIssue(ISSUE_STORAGE)
}

/** 当前是否有迁移失败问题 */
export function getMigrationIssue(): StorageIssue | null {
  return readIssue(ISSUE_MIGRATION)
}

/** 清除迁移失败告警 */
export function clearMigrationIssue(): void {
  clearIssue(ISSUE_MIGRATION)
}
