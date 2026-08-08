/**
 * 存储迁移管线测试
 * 验证 v1→v2 迁移：字段补全、孤儿数据清理、meta 版本写入、幂等性、损坏保护、容量估算
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest'

// ---- 模拟 localStorage（vitest 默认 node 环境无 localStorage）----
class MockStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v))
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  get length() {
    return this.map.size
  }
  dump() {
    return this.map
  }
}

const mock = new MockStorage()
Object.defineProperty(globalThis, 'localStorage', {
  value: mock,
  writable: true,
})

import {
  ensureStorageMigrated,
  readStorageMeta,
  loadFromStorage,
  estimateStorageUsage,
  DATA_VERSION,
  STORAGE_KEYS,
} from './persistence'
import './migrations' // 注册迁移（副作用）

const PREFIX = 'todo-calendar:'

function seedV1Data() {
  mock.setItem(PREFIX + 'tasks', JSON.stringify([
    { id: 't1', title: '写周报', estimatedMinutes: 60, importance: 'normal', isStarred: false, status: 'todo', createdAt: '2026-08-01', updatedAt: '2026-08-01' },
    { id: 't2', title: '修 bug', estimatedMinutes: 30, importance: 'important', isStarred: false, status: 'done', totalMinutesSpent: 15, createdAt: '2026-08-02', updatedAt: '2026-08-02' },
  ]))
  mock.setItem(PREFIX + 'task-blocks', JSON.stringify([
    { id: 'b1', taskId: 't1', durationMinutes: 60, order: 0, status: 'unscheduled', isStarred: false },
    { id: 'b2', taskId: 't2', durationMinutes: 30, order: 0, status: 'done', isStarred: false },
    { id: 'b3', taskId: 'GHOST_TASK', durationMinutes: 30, order: 0, status: 'unscheduled', isStarred: false },
  ]))
  mock.setItem(PREFIX + 'schedule-entries', JSON.stringify([
    { id: 'e1', taskId: 't1', blockId: 'b1', date: '2026-08-10', startTime: '09:00', endTime: '10:00', viewSource: 'week' },
    { id: 'e2', taskId: 'GHOST_TASK', blockId: 'b3', date: '2026-08-10', startTime: '10:00', endTime: '10:30', viewSource: 'week' },
    { id: 'e3', taskId: 't2', blockId: 'GHOST_BLOCK', date: '2026-08-11', viewSource: 'month' },
  ]))
  mock.setItem(PREFIX + 'important-days', JSON.stringify([{ id: 'd1', date: '2026-08-10', importance: 'critical' }]))
  mock.setItem(PREFIX + 'timer-sessions', JSON.stringify([
    { id: 's1', mode: 'stopwatch', taskId: 't1', status: 'finished', elapsedSeconds: 3600 },
  ]))
}

beforeEach(() => {
  mock.clear()
})

afterEach(() => {
  mock.clear()
})

describe('存储迁移管线 v1 → v2', () => {
  it('迁移成功并写入 meta 版本', () => {
    seedV1Data()
    const result = ensureStorageMigrated()
    expect(result.migrated).toBe(true)
    expect(result.to).toBe(DATA_VERSION)
    const meta = readStorageMeta()
    expect(meta?.dataVersion).toBe(DATA_VERSION)
    expect(typeof meta?.migratedAt).toBe('string')
  })

  it('tasks 补全 totalMinutesSpent，已有值保持不变', () => {
    seedV1Data()
    ensureStorageMigrated()
    const tasks = loadFromStorage<Array<Record<string, unknown>>>(STORAGE_KEYS.tasks)!
    expect(tasks[0].totalMinutesSpent).toBe(0)
    expect(tasks[1].totalMinutesSpent).toBe(15)
  })

  it('timerSessions 补全 accountedMinutes', () => {
    seedV1Data()
    ensureStorageMigrated()
    const sessions = loadFromStorage<Array<Record<string, unknown>>>(STORAGE_KEYS.timerSessions)!
    expect(sessions[0].accountedMinutes).toBe(0)
  })

  it('清理孤儿 taskBlocks（引用不存在 taskId）', () => {
    seedV1Data()
    ensureStorageMigrated()
    const blocks = loadFromStorage<Array<Record<string, unknown>>>(STORAGE_KEYS.taskBlocks)!
    expect(blocks).toHaveLength(2)
    expect(blocks.some((b) => b.id === 'b3')).toBe(false)
  })

  it('清理孤儿 scheduleEntries（blockId/taskId 无效）', () => {
    seedV1Data()
    ensureStorageMigrated()
    const entries = loadFromStorage<Array<Record<string, unknown>>>(STORAGE_KEYS.scheduleEntries)!
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('e1')
  })

  it('迁移前建立 backup 快照', () => {
    seedV1Data()
    ensureStorageMigrated()
    expect(mock.dump().has(PREFIX + 'backup:tasks')).toBe(true)
    expect(mock.dump().has(PREFIX + 'backup:task-blocks')).toBe(true)
  })

  it('幂等：二次运行不重复迁移', () => {
    seedV1Data()
    ensureStorageMigrated()
    const second = ensureStorageMigrated()
    expect(second.migrated).toBe(false)
  })

  it('无旧数据（空存储）时安全通过', () => {
    const result = ensureStorageMigrated()
    expect(result.migrated).toBe(true)
    expect(result.from).toBe(1)
  })
})

describe('损坏数据保护', () => {
  it('JSON 损坏时返回 null 并备份原始内容', () => {
    mock.setItem(PREFIX + 'important-days', '{broken json!!')
    const value = loadFromStorage(STORAGE_KEYS.importantDays)
    expect(value).toBeNull()
    expect(mock.dump().get(PREFIX + 'corrupted:important-days')).toBe('{broken json!!')
  })
})

describe('容量估算', () => {
  it('估算用量为数字且大于 0', () => {
    seedV1Data()
    ensureStorageMigrated()
    const usage = estimateStorageUsage()
    expect(typeof usage.used).toBe('number')
    expect(usage.used).toBeGreaterThan(0)
    expect(usage.quota).toBe(5 * 1024 * 1024)
    expect(usage.ratio).toBeGreaterThan(0)
    expect(usage.ratio).toBeLessThanOrEqual(1)
  })
})
