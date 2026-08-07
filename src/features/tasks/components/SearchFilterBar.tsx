/**
 * 任务搜索筛选栏
 * - 搜索框：按标题模糊匹配
 * - 状态筛选 chips：全部 / 待办 / 进行中 / 已完成
 * - 重要程度筛选 chips：全部 / 普通 / 重要 / 极重要
 */
import { useFilterStore, type StatusFilter, type ImportanceFilter } from '@/store/useFilterStore'
import { SearchIcon, CloseIcon } from '@/shared/components/Icons'
import { cn } from '@/shared/utils/cn'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待办' },
  { value: 'partial', label: '进行中' },
  { value: 'done', label: '已完成' },
]

const IMPORTANCE_OPTIONS: { value: ImportanceFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '普通' },
  { value: 'important', label: '重要' },
  { value: 'critical', label: '极重要' },
]

interface ChipProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-6 px-2 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap',
        active
          ? 'bg-brand-500 text-white'
          : 'bg-white/60 text-ink-muted hover:bg-brand-50 hover:text-brand-700',
      )}
    >
      {children}
    </button>
  )
}

export function SearchFilterBar() {
  const { keyword, status, importance, setKeyword, setStatus, setImportance, reset } =
    useFilterStore()

  const hasActiveFilter = keyword !== '' || status !== 'all' || importance !== 'all'

  return (
    <div className="space-y-2">
      {/* 搜索框 */}
      <div className="relative">
        <SearchIcon
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted/60 pointer-events-none"
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索任务..."
          className="w-full h-8 pl-8 pr-7 text-xs bg-white/70 border border-brand-200/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-ink-muted/60"
          maxLength={50}
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-muted/60 hover:text-ink hover:bg-brand-50"
            aria-label="清除搜索"
          >
            <CloseIcon size={12} />
          </button>
        )}
      </div>

      {/* 筛选 chips 行 */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-ink-muted/70 mr-0.5">状态</span>
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={status === opt.value}
            onClick={() => setStatus(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-ink-muted/70 mr-0.5">重要</span>
        {IMPORTANCE_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={importance === opt.value}
            onClick={() => setImportance(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
        {hasActiveFilter && (
          <button
            onClick={reset}
            className="text-[10px] text-danger-500 hover:text-danger-600 font-medium ml-auto"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}
