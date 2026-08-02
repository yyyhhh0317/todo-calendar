/**
 * 任务相关工具函数
 */
export { cn } from '@/shared/utils/cn'

/** 获取任务的进度信息 */
export function getTaskProgress(
  blocks: { status: string }[],
): { done: number; scheduled: number; total: number; percent: number } {
  const total = blocks.length
  const done = blocks.filter((b) => b.status === 'done').length
  const scheduled = blocks.filter((b) => b.status === 'scheduled').length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { done, scheduled, total, percent }
}
