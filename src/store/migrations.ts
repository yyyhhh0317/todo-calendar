/**
 * 数据迁移定义
 * 每个版本迁移负责 fromVersion -> fromVersion+1
 * 迁移只允许做"补全/修复/结构升级"，不允许丢数据
 */
import { registerMigration, type MigrationHelpers, STORAGE_KEYS } from './persistence'
import type { Task } from '@/features/tasks/taskTypes'
import type { TaskBlock } from '@/features/tasks/taskTypes'
import type { ScheduleEntry } from '@/features/schedule/scheduleTypes'
import type { TimerSession } from '@/features/focus/focusTypes'

/**
 * v1 -> v2
 * 历史数据（无版本标记）统一升级：
 * 1. tasks 补全 totalMinutesSpent 默认值（原 App.tsx 临时补丁，收编进管线）
 * 2. timerSessions 补全 accountedMinutes 默认值（原 useTimerStore 临时兼容，收编进管线）
 * 3. 清理孤儿数据：taskBlocks 引用不存在的 taskId、scheduleEntries 引用不存在的 blockId/taskId
 */
registerMigration(1, (h: MigrationHelpers) => {
  // 1. tasks 补全 totalMinutesSpent
  const tasks = h.read<Array<Partial<Task> & { id: string }>>(STORAGE_KEYS.tasks)
  if (tasks) {
    let changed = false
    const next = tasks.map((t) => {
      if (typeof t.totalMinutesSpent === 'number') return t
      changed = true
      return { ...t, totalMinutesSpent: 0 }
    })
    if (changed) h.write(STORAGE_KEYS.tasks, next)
  }

  // 2. timerSessions 补全 accountedMinutes
  const sessions = h.read<Array<Partial<TimerSession> & { id: string }>>(STORAGE_KEYS.timerSessions)
  if (sessions) {
    let changed = false
    const next = sessions.map((s) => {
      if (typeof s.accountedMinutes === 'number') return s
      changed = true
      return { ...s, accountedMinutes: 0 }
    })
    if (changed) h.write(STORAGE_KEYS.timerSessions, next)
  }

  // 3. 孤儿数据清理：先算有效 id 集合，再过滤
  const taskIds = new Set(tasks?.map((t) => t.id) ?? [])

  const blocks = h.read<Array<Partial<TaskBlock> & { id: string; taskId: string }>>(
    STORAGE_KEYS.taskBlocks,
  )
  if (blocks) {
    const validBlocks = blocks.filter((b) => taskIds.has(b.taskId))
    if (validBlocks.length !== blocks.length) {
      h.write(STORAGE_KEYS.taskBlocks, validBlocks)
    }
  }

  const entries = h.read<Array<Partial<ScheduleEntry> & { id: string; blockId: string; taskId: string }>>(
    STORAGE_KEYS.scheduleEntries,
  )
  if (entries) {
    const validBlockIds = new Set(
      blocks?.filter((b) => taskIds.has(b.taskId)).map((b) => b.id) ?? [],
    )
    const validEntries = entries.filter(
      (e) => taskIds.has(e.taskId) && validBlockIds.has(e.blockId),
    )
    if (validEntries.length !== entries.length) {
      h.write(STORAGE_KEYS.scheduleEntries, validEntries)
    }
  }
})
