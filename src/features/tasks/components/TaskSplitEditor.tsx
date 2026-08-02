/**
 * 任务拆分编辑器
 * 处理拆分块数、每块时长和总时长校验
 * 所有块时长之和不应超过任务预计总时长，除非用户确认调整总时长
 */
import { useState, useMemo } from 'react'
import type { Task, TaskBlock } from '../taskTypes'
import { useTaskStore } from '@/store/useTaskStore'
import { Button } from '@/shared/components/Button'
import { SplitIcon, PlusIcon, TrashIcon } from '@/shared/components/Icons'
import { formatDuration } from '@/shared/utils/time'
import { cn } from '../taskUtils'

interface TaskSplitEditorProps {
  task: Task
  blocks: TaskBlock[]
  onClose?: () => void
}

export function TaskSplitEditor({ task, blocks, onClose }: TaskSplitEditorProps) {
  const { splitTask, updateBlock, deleteBlock, updateTask, addBlock } = useTaskStore()
  const [blockCount, setBlockCount] = useState(Math.max(blocks.length, 1))

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.order - b.order),
    [blocks],
  )

  const totalBlockMinutes = sortedBlocks.reduce((sum, b) => sum + b.durationMinutes, 0)
  const isOverBudget = totalBlockMinutes > task.estimatedMinutes
  const isUnderBudget = totalBlockMinutes < task.estimatedMinutes

  const handleAddBlock = () => {
    // 手动添加一块，时长为剩余预算（至少 15 分钟）或默认 30 分钟
    const remaining = task.estimatedMinutes - totalBlockMinutes
    const newDuration = remaining > 0 ? Math.max(Math.min(remaining, 60), 15) : 30
    addBlock(task.id, newDuration)
    setBlockCount((n) => n + 1)
  }

  const handleAdjustTotal = () => {
    updateTask(task.id, { estimatedMinutes: totalBlockMinutes })
  }

  return (
    <div className="glass-panel p-3 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <SplitIcon size={14} />
          拆分任务
        </h4>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="!h-7 !px-2">
            关闭
          </Button>
        )}
      </div>

      {/* 预算概览 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">
          预计总时长 <span className="font-mono font-semibold text-ink">{formatDuration(task.estimatedMinutes)}</span>
        </span>
        <span className={cn(
          'font-mono font-semibold',
          isOverBudget ? 'text-danger-600' : isUnderBudget ? 'text-star-600' : 'text-success-600',
        )}>
          已分配 {formatDuration(totalBlockMinutes)}
        </span>
      </div>

      {/* 预算超支提示 */}
      {isOverBudget && (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-danger-50 border border-danger-200 text-xs text-danger-700">
          <span>块时长总和超出预计 {formatDuration(totalBlockMinutes - task.estimatedMinutes)}</span>
          <button
            onClick={handleAdjustTotal}
            className="font-semibold underline hover:no-underline"
          >
            调整总时长
          </button>
        </div>
      )}

      {/* 块列表 */}
      <div className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
        {sortedBlocks.map((block, index) => (
          <div
            key={block.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/60 border border-brand-200/30"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <input
              type="number"
              min={5}
              step={5}
              value={block.durationMinutes}
              onChange={(e) =>
                updateBlock(block.id, { durationMinutes: Math.max(5, Number(e.target.value)) })
              }
              className="w-16 h-7 px-2 text-xs font-mono bg-white/80 border border-brand-200/40 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-xs text-ink-muted">分钟</span>
            <span className={cn(
              'ml-auto text-[10px] px-1.5 py-0.5 rounded-full',
              block.status === 'done'
                ? 'bg-success-100 text-success-700'
                : block.status === 'scheduled'
                  ? 'bg-accent-100 text-accent-700'
                  : 'bg-brand-50 text-ink-muted',
            )}>
              {block.status === 'done' ? '已完成' : block.status === 'scheduled' ? '已安排' : '未安排'}
            </span>
            {sortedBlocks.length > 1 && (
              <button
                onClick={() => deleteBlock(block.id)}
                className="shrink-0 w-6 h-6 rounded-md text-ink-muted hover:text-danger-500 hover:bg-danger-50 flex items-center justify-center"
                title="删除该块"
              >
                <TrashIcon size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 快速拆分 */}
      <div className="flex items-center gap-2 pt-2 border-t border-brand-200/20">
        <span className="text-xs text-ink-muted shrink-0">快速拆分</span>
        <div className="flex gap-1">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => {
                setBlockCount(n)
                splitTask(task.id, n)
              }}
              className={cn(
                'h-7 px-2.5 text-xs rounded-md transition-colors',
                blockCount === n
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/60 text-ink-muted hover:bg-brand-50',
              )}
            >
              {n} 块
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddBlock}
          className="!h-7 ml-auto"
        >
          <PlusIcon size={13} />
          加一块
        </Button>
      </div>
    </div>
  )
}
