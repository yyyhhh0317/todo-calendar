/**
 * 排期工具单测：冲突检测、endTime 计算、日期排期聚合
 */
import { describe, expect, it } from 'vitest'
import type { ScheduleEntry } from './scheduleTypes'
import { detectConflicts, buildScheduleEntryInput, getEntriesForDate } from './scheduleUtils'

function makeEntry(partial: Partial<ScheduleEntry> & { id: string }): ScheduleEntry {
  return {
    taskId: 'task-1',
    blockId: 'block-1',
    date: '2026-08-10',
    viewSource: 'week',
    ...partial,
  } as ScheduleEntry
}

describe('detectConflicts 冲突检测', () => {
  const existing: ScheduleEntry[] = [
    makeEntry({ id: 'e1', taskId: 't1', blockId: 'b1', date: '2026-08-10', startTime: '09:00', endTime: '10:00' }),
    makeEntry({ id: 'e2', taskId: 't2', blockId: 'b2', date: '2026-08-10', startTime: '14:00', endTime: '15:30' }),
    makeEntry({ id: 'e3', taskId: 't3', blockId: 'b3', date: '2026-08-11', startTime: '09:00', endTime: '10:00' }),
  ]

  it('同一日期时间重叠 → 冲突', () => {
    const conflicts = detectConflicts('2026-08-10', '09:30', 60, existing)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].id).toBe('e1')
  })

  it('边界紧贴不重叠（end == start）→ 无冲突', () => {
    const conflicts = detectConflicts('2026-08-10', '10:00', 60, existing)
    expect(conflicts).toHaveLength(0)
  })

  it('完全包含在已有区间内 → 冲突', () => {
    const conflicts = detectConflicts('2026-08-10', '14:30', 30, existing)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].id).toBe('e2')
  })

  it('跨越已有区间 → 冲突', () => {
    const conflicts = detectConflicts('2026-08-10', '13:30', 120, existing)
    expect(conflicts).toHaveLength(1)
  })

  it('不同日期 → 无冲突', () => {
    const conflicts = detectConflicts('2026-08-12', '09:00', 60, existing)
    expect(conflicts).toHaveLength(0)
  })

  it('排除自身（移动场景）→ 无冲突', () => {
    const conflicts = detectConflicts('2026-08-10', '09:00', 60, existing, 'e1')
    expect(conflicts).toHaveLength(0)
  })

  it('已有 entry 无 startTime（月视图粗排）→ 不参与冲突', () => {
    const withRough = [
      ...existing,
      makeEntry({ id: 'e4', date: '2026-08-10', viewSource: 'month' }),
    ]
    const conflicts = detectConflicts('2026-08-10', '09:00', 60, withRough)
    // e1 被 e4 前移后仍应只冲突 e1
    expect(conflicts.some((c) => c.id === 'e4')).toBe(false)
  })

  it('无 endTime 时按 60 分钟默认时长判断', () => {
    const noEnd = [
      makeEntry({ id: 'e5', date: '2026-08-10', startTime: '09:00' }),
    ]
    // 09:30 落在 09:00-10:00 内 → 冲突
    expect(detectConflicts('2026-08-10', '09:30', 30, noEnd)).toHaveLength(1)
    // 10:00 恰好边界 → 无冲突
    expect(detectConflicts('2026-08-10', '10:00', 30, noEnd)).toHaveLength(0)
  })

  it('空排期 → 无冲突', () => {
    expect(detectConflicts('2026-08-10', '09:00', 60, [])).toHaveLength(0)
  })
})

describe('buildScheduleEntryInput', () => {
  it('自动计算 endTime', () => {
    const input = buildScheduleEntryInput('t1', 'b1', '2026-08-10', '09:00', 90, 'week')
    expect(input).toEqual({
      taskId: 't1',
      blockId: 'b1',
      date: '2026-08-10',
      startTime: '09:00',
      endTime: '10:30',
      viewSource: 'week',
    })
  })

  it('跨小时边界正确计算', () => {
    const input = buildScheduleEntryInput('t1', 'b1', '2026-08-10', '22:00', 90, 'week')
    expect(input.endTime).toBe('23:30')
  })
})

describe('getEntriesForDate', () => {
  const entries: ScheduleEntry[] = [
    makeEntry({ id: 'e1', date: '2026-08-10', startTime: '14:00', endTime: '15:00' }),
    makeEntry({ id: 'e2', date: '2026-08-10', startTime: '09:00', endTime: '10:00' }),
    makeEntry({ id: 'e3', date: '2026-08-10', viewSource: 'month' }),
    makeEntry({ id: 'e4', date: '2026-08-11', startTime: '09:00', endTime: '10:00' }),
  ]

  it('只返回目标日期且按开始时间升序', () => {
    const result = getEntriesForDate(entries, '2026-08-10')
    expect(result).toHaveLength(3)
    // 无 startTime 的排到末尾
    expect(result[0].id).toBe('e2')
    expect(result[1].id).toBe('e1')
    expect(result[2].id).toBe('e3')
  })

  it('无排期的日期返回空数组', () => {
    expect(getEntriesForDate(entries, '2026-08-12')).toHaveLength(0)
  })
})
