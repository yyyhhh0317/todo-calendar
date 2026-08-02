/**
 * 任务创建表单
 * 任务名称、预计总时间、备注、优先级、重要程度
 */
import { useState, type FormEvent } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { Button } from '@/shared/components/Button'
import { PlusIcon } from '@/shared/components/Icons'
import type { Importance, Priority } from '../taskTypes'
import { cn } from '../taskUtils'

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

const IMPORTANCE_OPTIONS: { value: Importance; label: string; className: string }[] = [
  { value: 'normal', label: '普通', className: '' },
  { value: 'important', label: '重要', className: 'text-accent-600' },
  { value: 'critical', label: '极重要', className: 'text-danger-600' },
]

export function TaskComposer() {
  const { createTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [importance, setImportance] = useState<Importance>('normal')
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || estimatedMinutes <= 0) return
    createTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      estimatedMinutes,
      priority,
      importance,
    })
    // 重置
    setTitle('')
    setNotes('')
    setEstimatedMinutes(60)
    setPriority('medium')
    setImportance('normal')
    setExpanded(false)
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-3 mb-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="添加新任务..."
          className="flex-1 h-9 px-3 text-sm bg-white/70 border border-brand-200/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-ink-muted/60"
          maxLength={80}
        />
        <Button type="submit" variant="primary" size="icon" disabled={!title.trim()} className="!h-9 !w-9">
          <PlusIcon size={18} />
        </Button>
      </div>

      {expanded && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-muted shrink-0 w-16">预计时长</label>
            <input
              type="number"
              min={5}
              max={1440}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-20 h-8 px-2 text-sm font-mono bg-white/70 border border-brand-200/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-xs text-ink-muted">分钟</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-muted shrink-0 w-16">优先级</label>
            <div className="flex gap-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md transition-colors',
                    priority === opt.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/60 text-ink-muted hover:bg-brand-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-muted shrink-0 w-16">重要程度</label>
            <div className="flex gap-1">
              {IMPORTANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImportance(opt.value)}
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md transition-colors',
                    importance === opt.value
                      ? 'bg-brand-500 text-white'
                      : cn('bg-white/60 hover:bg-brand-50', opt.className),
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="备注（可选）"
            rows={2}
            className="w-full px-3 py-1.5 text-sm bg-white/70 border border-brand-200/40 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-ink-muted/60"
            maxLength={200}
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              收起
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!title.trim()}>
              创建任务
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
