/**
 * 拖拽相关类型定义
 * 基于 @dnd-kit 的 payload 设计
 */

/** 拖拽数据来源区域 */
export type DragSource = 'sidebar' | 'schedule'

/** 拖拽的 payload 类型 */
export interface DragBlockPayload {
  /** 任务块 ID */
  blockId: string
  /** 所属任务 ID */
  taskId: string
  /** 拖拽来源 */
  source: DragSource
  /** 如果来自排期区，记录原 entry ID 用于移动 */
  entryId?: string
}

/** 放置目标信息 - 周视图 */
export interface WeekDropTarget {
  type: 'week-slot'
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
}

/** 放置目标信息 - 月视图 */
export interface MonthDropTarget {
  type: 'month-day'
  date: string // YYYY-MM-DD
}

/** 放置目标信息 - 任务栏（拖回未安排） */
export interface SidebarDropTarget {
  type: 'sidebar'
}

export type DropTarget = WeekDropTarget | MonthDropTarget | SidebarDropTarget

/** dnd-kit 的 data 传递标识 */
export const DRAG_DATA_KEY = 'application/todo-calendar'
