/**
 * 数据导入导出单测
 */
import { describe, expect, it } from 'vitest'
import { validateImport, type BackupData } from './dataTransfer'

function makeBackup(overrides: Partial<BackupData> = {}): BackupData {
  return {
    version: 1,
    dataVersion: 1,
    exportedAt: '2026-08-08T00:00:00Z',
    app: 'todo-calendar',
    data: { tasks: [] },
    ...overrides,
  }
}

describe('validateImport 备份校验', () => {
  it('合法备份通过', () => {
    const result = validateImport(JSON.stringify(makeBackup()))
    expect(result.ok).toBe(true)
  })

  it('非 JSON 返回错误', () => {
    const result = validateImport('{not json')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('JSON')
  })

  it('空对象拒绝', () => {
    const result = validateImport('{}')
    expect(result.ok).toBe(false)
  })

  it('非 todo-calendar 应用拒绝', () => {
    const result = validateImport(JSON.stringify(makeBackup({ app: 'other-app' })))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('不是 Todo Calendar')
  })

  it('缺少版本信息拒绝', () => {
    const backup = makeBackup() as unknown as Record<string, unknown>
    delete backup.version
    const result = validateImport(JSON.stringify(backup))
    expect(result.ok).toBe(false)
  })

  it('缺少 data 内容拒绝', () => {
    const backup = makeBackup() as unknown as Record<string, unknown>
    delete backup.data
    const result = validateImport(JSON.stringify(backup))
    expect(result.ok).toBe(false)
  })

  it('旧备份无 dataVersion 时默认视为 v1', () => {
    const backup = makeBackup() as unknown as Record<string, unknown>
    delete backup.dataVersion
    const result = validateImport(JSON.stringify(backup))
    expect(result.ok).toBe(true)
    expect(result.data?.dataVersion).toBe(1)
  })

  it('dataVersion 高于当前应用 → 拒绝并提示升级', () => {
    const result = validateImport(JSON.stringify(makeBackup({ dataVersion: 999 })))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('高于当前应用')
  })
})

describe('collectBackupData', () => {
  // 该函数依赖 localStorage，此处仅验证导出的整体形状由 validateImport 闭环保证
  it('导出的备份可被 validateImport 接受（round-trip）', async () => {
    const { collectBackupData } = await import('./dataTransfer')
    // node 环境无 localStorage，用轻量 polyfill
    const store = new Map<string, string>()
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, String(v)),
        removeItem: (k: string) => void store.delete(k),
        key: (i: number) => [...store.keys()][i] ?? null,
        get length() {
          return store.size
        },
      },
      writable: true,
    })
    const backup = collectBackupData()
    const result = validateImport(JSON.stringify(backup))
    expect(result.ok).toBe(true)
    expect(result.data?.app).toBe('todo-calendar')
    expect(result.data?.version).toBe(1)
  })
})
