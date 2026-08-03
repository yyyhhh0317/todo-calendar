/**
 * 任务状态管理
 * 管理任务本体、任务块、排期记录、重要日期
 */
import { create } from 'zustand'
import type {
  Task,
  TaskBlock,
  BlockStatus,
  TaskStatus,
} from '@/features/tasks/taskTypes'
import type { ScheduleEntry, ImportantDay } from '@/features/schedule/scheduleTypes'
import { generateId } from '@/shared/utils/id'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence'

interface TaskState {
  tasks: Task[]
  taskBlocks: TaskBlock[]
  scheduleEntries: ScheduleEntry[]
  importantDays: ImportantDay[]

  // 任务 CRUD
  createTask: (input: {
    title: string
    notes?: string
    estimatedMinutes: number
    priority?: Task['priority']
    importance?: Task['importance']
    targetAt?: string
  }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStar: (id: string) => void
  completeTask: (id: string, extraMinutesSpent?: number) => void
  uncompleteTask: (id: string) => void
  /** 完成单个块：保留任务，重算任务状态（全部块完成时任务自动 done） */
  completeBlock: (blockId: string, extraMinutesSpent?: number) => void
  /** 撤销单块完成 */
  uncompleteBlock: (blockId: string) => void
  /** 累加任务实际用时（由计时器在暂停/结束时调用） */
  addMinutesSpent: (taskId: string, minutes: number) => void

  // 任务块
  splitTask: (taskId: string, blockCount: number) => void
  addBlock: (taskId: string, durationMinutes?: number) => void
  updateBlock: (id: string, patch: Partial<TaskBlock>) => void
  deleteBlock: (id: string) => void

  // 排期
  scheduleBlock: (entry: Omit<ScheduleEntry, 'id'>) => ScheduleEntry
  updateScheduleEntry: (id: string, patch: Partial<ScheduleEntry>) => void
  removeScheduleEntry: (id: string) => void

  // 重要日期
  toggleImportantDay: (date: string, importance?: ImportantDay['importance']) => void
}

/** 计算任务状态 */
function deriveTaskStatus(blocks: TaskBlock[]): TaskStatus {
  if (blocks.length === 0) return 'todo'
  const doneCount = blocks.filter((b) => b.status === 'done').length
  const scheduledCount = blocks.filter((b) => b.status === 'scheduled').length
  if (doneCount === blocks.length) return 'done'
  if (scheduledCount > 0 || doneCount > 0) return 'partial'
  return 'todo'
}

/** 计算任务块状态 */
function deriveBlockStatus(entry: ScheduleEntry | undefined, isDone: boolean): BlockStatus {
  if (isDone) return 'done'
  if (entry) return 'scheduled'
  return 'unscheduled'
}

function loadInitial<T>(key: string, fallback: T): T {
  return loadFromStorage<T>(key) ?? fallback
}

export const useTaskStore = create<TaskState>((set, get) => {
  // 持久化副作用
  const persist = () => {
    const { tasks, taskBlocks, scheduleEntries, importantDays } = get()
    saveToStorage(STORAGE_KEYS.tasks, tasks)
    saveToStorage(STORAGE_KEYS.taskBlocks, taskBlocks)
    saveToStorage(STORAGE_KEYS.scheduleEntries, scheduleEntries)
    saveToStorage(STORAGE_KEYS.importantDays, importantDays)
  }

  return {
    tasks: loadInitial(STORAGE_KEYS.tasks, [] as Task[]),
    taskBlocks: loadInitial(STORAGE_KEYS.taskBlocks, [] as TaskBlock[]),
    scheduleEntries: loadInitial(STORAGE_KEYS.scheduleEntries, [] as ScheduleEntry[]),
    importantDays: loadInitial(STORAGE_KEYS.importantDays, [] as ImportantDay[]),

    createTask: (input) => {
      const now = new Date().toISOString()
      const task: Task = {
        id: generateId('task'),
        title: input.title,
        notes: input.notes,
        estimatedMinutes: input.estimatedMinutes,
        priority: input.priority ?? 'medium',
        importance: input.importance ?? 'normal',
        targetAt: input.targetAt,
        isStarred: false,
        status: 'todo',
        totalMinutesSpent: 0,
        createdAt: now,
        updatedAt: now,
      }
      // 默认生成一个与总时长相同的块
      const block: TaskBlock = {
        id: generateId('block'),
        taskId: task.id,
        durationMinutes: input.estimatedMinutes,
        order: 0,
        status: 'unscheduled',
        isStarred: false,
      }
      set((s) => ({
        tasks: [...s.tasks, task],
        taskBlocks: [...s.taskBlocks, block],
      }))
      persist()
      return task
    },

    updateTask: (id, patch) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
        ),
      }))
      persist()
    },

    deleteTask: (id) => {
      set((s) => {
        const blockIds = s.taskBlocks.filter((b) => b.taskId === id).map((b) => b.id)
        return {
          tasks: s.tasks.filter((t) => t.id !== id),
          taskBlocks: s.taskBlocks.filter((b) => b.taskId !== id),
          scheduleEntries: s.scheduleEntries.filter((e) => !blockIds.includes(e.blockId)),
        }
      })
      persist()
    },

    toggleTaskStar: (id) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, isStarred: !t.isStarred, updatedAt: new Date().toISOString() }
            : t,
        ),
      }))
      persist()
    },

    completeTask: (id, extraMinutesSpent) => {
      const now = new Date().toISOString()
      const today = now.slice(0, 10)
      set((s) => {
        const blockIds = s.taskBlocks.filter((b) => b.taskId === id).map((b) => b.id)
        return {
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'done',
                  completedAt: now,
                  completedDate: today,
                  totalMinutesSpent: t.totalMinutesSpent + (extraMinutesSpent ?? 0),
                  updatedAt: now,
                }
              : t,
          ),
          taskBlocks: s.taskBlocks.map((b) =>
            b.taskId === id
              ? { ...b, status: 'done', completedAt: now, completedDate: today }
              : b,
          ),
          // 完成任务时自动移除所有排期：左侧时间格不再占位
          scheduleEntries: s.scheduleEntries.filter((e) => !blockIds.includes(e.blockId)),
        }
      })
      persist()
    },

    addMinutesSpent: (taskId, minutes) => {
      if (minutes <= 0) return
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, totalMinutesSpent: t.totalMinutesSpent + minutes, updatedAt: new Date().toISOString() }
            : t,
        ),
      }))
      persist()
    },

    uncompleteTask: (id) => {
      const now = new Date().toISOString()
      set((s) => {
        const blocks = s.taskBlocks.filter((b) => b.taskId === id)
        const hasScheduled = blocks.some((b) => {
          const entry = s.scheduleEntries.find((e) => e.blockId === b.id)
          return entry !== undefined
        })
        const newStatus: TaskStatus = hasScheduled ? 'partial' : 'todo'
        return {
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: newStatus,
                  completedAt: undefined,
                  completedDate: undefined,
                  updatedAt: now,
                }
              : t,
          ),
          taskBlocks: s.taskBlocks.map((b) =>
            b.taskId === id
              ? {
                  ...b,
                  status: deriveBlockStatus(
                    s.scheduleEntries.find((e) => e.blockId === b.id),
                    false,
                  ),
                  completedAt: undefined,
                  completedDate: undefined,
                }
              : b,
          ),
        }
      })
      persist()
    },

    completeBlock: (blockId, extraMinutesSpent) => {
      const now = new Date().toISOString()
      const today = now.slice(0, 10)
      set((s) => {
        const block = s.taskBlocks.find((b) => b.id === blockId)
        if (!block) return s
        const taskId = block.taskId
        // 标记该块为 done
        const updatedBlocks = s.taskBlocks.map((b) =>
          b.id === blockId
            ? { ...b, status: 'done' as BlockStatus, completedAt: now, completedDate: today }
            : b,
        )
        // 重算任务状态：所有块 done → done，否则 → partial/todo
        const taskBlocks = updatedBlocks.filter((b) => b.taskId === taskId)
        const newTaskStatus = deriveTaskStatus(taskBlocks)
        return {
          taskBlocks: updatedBlocks,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: newTaskStatus,
                  totalMinutesSpent: t.totalMinutesSpent + (extraMinutesSpent ?? 0),
                  completedAt: newTaskStatus === 'done' ? now : t.completedAt,
                  completedDate: newTaskStatus === 'done' ? today : t.completedDate,
                  updatedAt: now,
                }
              : t,
          ),
          // 移除该块的排期
          scheduleEntries: s.scheduleEntries.filter((e) => e.blockId !== blockId),
        }
      })
      persist()
    },

    uncompleteBlock: (blockId) => {
      const now = new Date().toISOString()
      set((s) => {
        const block = s.taskBlocks.find((b) => b.id === blockId)
        if (!block) return s
        const taskId = block.taskId
        const updatedBlocks = s.taskBlocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                status: deriveBlockStatus(
                  s.scheduleEntries.find((e) => e.blockId === blockId),
                  false,
                ) as BlockStatus,
                completedAt: undefined,
                completedDate: undefined,
              }
            : b,
        )
        const taskBlocks = updatedBlocks.filter((b) => b.taskId === taskId)
        const newTaskStatus = deriveTaskStatus(taskBlocks)
        return {
          taskBlocks: updatedBlocks,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: newTaskStatus,
                  completedAt: newTaskStatus === 'done' ? t.completedAt : undefined,
                  completedDate: newTaskStatus === 'done' ? t.completedDate : undefined,
                  updatedAt: now,
                }
              : t,
          ),
        }
      })
      persist()
    },

    splitTask: (taskId, blockCount) => {
      set((s) => {
        const task = s.tasks.find((t) => t.id === taskId)
        if (!task) return s
        const perBlock = Math.floor(task.estimatedMinutes / blockCount)
        const remainder = task.estimatedMinutes - perBlock * blockCount
        const newBlocks: TaskBlock[] = Array.from({ length: blockCount }, (_, i) => ({
          id: generateId('block'),
          taskId,
          durationMinutes: perBlock + (i === 0 ? remainder : 0),
          order: i,
          status: 'unscheduled',
          isStarred: false,
        }))
        // 旧块即将被替换，需同步清理这些旧块关联的排期记录，避免孤儿数据导致后续冲突检测误报
        const oldBlockIds = s.taskBlocks.filter((b) => b.taskId === taskId).map((b) => b.id)
        return {
          taskBlocks: [
            ...s.taskBlocks.filter((b) => b.taskId !== taskId),
            ...newBlocks,
          ],
          scheduleEntries: s.scheduleEntries.filter((e) => !oldBlockIds.includes(e.blockId)),
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'todo', updatedAt: new Date().toISOString() } : t,
          ),
        }
      })
      persist()
    },

    updateBlock: (id, patch) => {
      set((s) => ({
        taskBlocks: s.taskBlocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }))
      persist()
    },

    addBlock: (taskId, durationMinutes) => {
      set((s) => {
        const taskBlocks = s.taskBlocks.filter((b) => b.taskId === taskId)
        const maxOrder = taskBlocks.reduce((max, b) => Math.max(max, b.order), -1)
        const newBlock: TaskBlock = {
          id: generateId('block'),
          taskId,
          durationMinutes: durationMinutes ?? 30,
          order: maxOrder + 1,
          status: 'unscheduled',
          isStarred: false,
        }
        return { taskBlocks: [...s.taskBlocks, newBlock] }
      })
      persist()
    },

    deleteBlock: (id) => {
      set((s) => ({
        taskBlocks: s.taskBlocks.filter((b) => b.id !== id),
        scheduleEntries: s.scheduleEntries.filter((e) => e.blockId !== id),
      }))
      persist()
    },

    scheduleBlock: (entryInput) => {
      const entry: ScheduleEntry = { ...entryInput, id: generateId('entry') }
      set((s) => {
        const updatedBlocks = s.taskBlocks.map((b) => {
          if (b.id !== entry.blockId) return b
          const hasEntry = true
          return {
            ...b,
            status: deriveBlockStatus(hasEntry ? entry : undefined, b.status === 'done'),
          }
        })
        const taskIds = new Set(
          updatedBlocks.filter((b) => b.id === entry.blockId).map((b) => b.taskId),
        )
        const updatedTasks = s.tasks.map((t) => {
          if (!taskIds.has(t.id)) return t
          const taskBlocks = updatedBlocks.filter((b) => b.taskId === t.id)
          return { ...t, status: deriveTaskStatus(taskBlocks), updatedAt: new Date().toISOString() }
        })
        return {
          scheduleEntries: [...s.scheduleEntries, entry],
          taskBlocks: updatedBlocks,
          tasks: updatedTasks,
        }
      })
      persist()
      return entry
    },

    updateScheduleEntry: (id, patch) => {
      set((s) => ({
        scheduleEntries: s.scheduleEntries.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      }))
      persist()
    },

    removeScheduleEntry: (id) => {
      set((s) => {
        const entry = s.scheduleEntries.find((e) => e.id === id)
        if (!entry) return s
        const updatedBlocks = s.taskBlocks.map((b) =>
          b.id === entry.blockId
            ? { ...b, status: deriveBlockStatus(undefined, b.status === 'done') as BlockStatus }
            : b,
        )
        const updatedTasks = s.tasks.map((t) => {
          if (t.id !== entry.taskId) return t
          const taskBlocks = updatedBlocks.filter((b) => b.taskId === t.id)
          return { ...t, status: deriveTaskStatus(taskBlocks), updatedAt: new Date().toISOString() }
        })
        return {
          scheduleEntries: s.scheduleEntries.filter((e) => e.id !== id),
          taskBlocks: updatedBlocks,
          tasks: updatedTasks,
        }
      })
      persist()
    },

    toggleImportantDay: (date, importance = 'important') => {
      set((s) => {
        const existing = s.importantDays.find((d) => d.date === date)
        if (existing) {
          return {
            importantDays: s.importantDays.filter((d) => d.date !== date),
          }
        }
        const newDay: ImportantDay = {
          id: generateId('day'),
          date,
          importance,
        }
        return { importantDays: [...s.importantDays, newDay] }
      })
      persist()
    },
  }
})
