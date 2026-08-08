/**
 * 设置面板
 * 提供主题切换、数据导出、导入、统计回顾入口
 */
import { useRef, useState, useMemo } from 'react'
import { Button } from '@/shared/components/Button'
import {
  SettingsIcon,
  DownloadIcon,
  UploadIcon,
  ChartIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
} from '@/shared/components/Icons'
import { useThemeStore, type ThemeMode } from '@/store/useThemeStore'
import { useBrandStore, PRESET_BRANDS } from '@/store/useBrandStore'
import { downloadBackup, validateImport, restoreBackup } from '../dataTransfer'
import {
  estimateStorageUsage,
  STORAGE_WARN_RATIO,
  getMigrationIssue,
  getStorageIssue,
} from '@/store/persistence'
import { cn } from '@/shared/utils/cn'

interface SettingsPanelProps {
  onClose: () => void
  onOpenStats: () => void
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <SunIcon size={14} /> },
  { value: 'dark', label: '暗色', icon: <MoonIcon size={14} /> },
  { value: 'system', label: '跟随系统', icon: <MonitorIcon size={14} /> },
]

export function SettingsPanel({ onClose, onOpenStats }: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null)
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore()
  const { color: brandColor, setColor: setBrandColor, reset: resetBrand } = useBrandStore()

  // 存储健康状态（每次打开面板时计算）
  const storage = useMemo(() => estimateStorageUsage(), [])
  const migrationIssue = useMemo(() => getMigrationIssue(), [])
  const storageIssue = useMemo(() => getStorageIssue(), [])
  const overWarn = storage.ratio >= STORAGE_WARN_RATIO
  const usedMB = (storage.used / 1024 / 1024).toFixed(2)
  const quotaMB = (storage.quota / 1024 / 1024).toFixed(0)

  const handleExport = () => {
    downloadBackup()
    setMessage({ text: '备份文件已开始下载', type: 'success' })
  }

  const handleImportClick = () => {
    fileRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const raw = reader.result as string
      const result = validateImport(raw)
      if (!result.ok || !result.data) {
        setMessage({ text: result.error ?? '导入失败', type: 'error' })
        return
      }
      if (!confirm('导入将覆盖当前所有数据，确定继续吗？')) {
        setMessage({ text: '已取消导入', type: 'info' })
        return
      }
      restoreBackup(result.data)
    }
    reader.onerror = () => {
      setMessage({ text: '文件读取失败', type: 'error' })
    }
    reader.readAsText(file)
    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }

  return (
    <div className="glass-panel p-5 w-80 space-y-4 animate-slide-up">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon size={18} className="text-brand-500" />
          <h2 className="text-base font-bold text-ink">设置</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭" className="!h-8 !w-8">
          <CloseIcon size={16} />
        </Button>
      </div>

      {/* 外观 - 主题切换 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">外观</h3>
        <div className="flex gap-1 p-1 bg-white/40 border border-brand-200/40 rounded-xl">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setThemeMode(opt.value)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-lg transition-all',
                themeMode === opt.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50',
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* 主题色自定义 */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-ink-muted">主题色</span>
            <button
              onClick={resetBrand}
              className="text-[10px] text-ink-muted/70 hover:text-brand-600 font-medium"
              title="恢复默认紫罗兰"
            >
              重置
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {PRESET_BRANDS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => setBrandColor(preset.color)}
                title={preset.name}
                aria-label={`主题色 ${preset.name}`}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  brandColor === preset.color
                    ? 'border-ink ring-2 ring-brand-400 ring-offset-1'
                    : 'border-white/60 hover:scale-110',
                )}
                style={{ backgroundColor: preset.color }}
              />
            ))}
            <label
              className="w-7 h-7 rounded-full border-2 border-dashed border-brand-300 flex items-center justify-center cursor-pointer hover:bg-brand-50 transition-colors"
              title="自定义颜色"
            >
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-0 h-0 opacity-0 absolute"
                aria-label="自定义主题色"
              />
              <span className="text-[10px] font-bold text-brand-500">+</span>
            </label>
          </div>
          <div className="mt-1.5 text-[10px] text-ink-muted/60">浅色 / 暗色主题均跟随主题色</div>
        </div>
      </div>

      {/* 数据安全 - 存储状态 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">数据安全</h3>

        {migrationIssue && (
          <div className="px-3 py-2 rounded-lg bg-danger-50 border border-danger-200 text-xs text-danger-700">
            数据迁移失败：{migrationIssue.message}
          </div>
        )}
        {storageIssue && (
          <div className="px-3 py-2 rounded-lg bg-danger-50 border border-danger-200 text-xs text-danger-700">
            {storageIssue.message}
          </div>
        )}

        <div className="px-3 py-2.5 rounded-xl bg-white/60 border border-brand-200/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-semibold text-ink">本地存储空间</div>
            <div className={cn('text-xs font-medium', overWarn ? 'text-danger-700' : 'text-ink-muted')}>
              {usedMB} MB / {quotaMB} MB
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full', overWarn ? 'bg-danger-500' : 'bg-brand-500')}
              style={{ width: `${Math.min(100, storage.ratio * 100)}%` }}
            />
          </div>
          {overWarn && (
            <div className="mt-1.5 text-xs text-danger-700">
              存储空间即将用完，建议立即导出备份并清理已完成任务
            </div>
          )}
        </div>
      </div>

      {/* 数据管理 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">数据管理</h3>

        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 hover:bg-white border border-brand-200/40 transition-colors text-left"
        >
          <DownloadIcon size={18} className="text-brand-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">导出备份</div>
            <div className="text-xs text-ink-muted">下载 JSON 备份文件</div>
          </div>
        </button>

        <button
          onClick={handleImportClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 hover:bg-white border border-brand-200/40 transition-colors text-left"
        >
          <UploadIcon size={18} className="text-accent-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">导入恢复</div>
            <div className="text-xs text-ink-muted">从 JSON 备份恢复（覆盖当前数据）</div>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 统计回顾 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">统计回顾</h3>
        <button
          onClick={onOpenStats}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 hover:bg-white border border-brand-200/40 transition-colors text-left"
        >
          <ChartIcon size={18} className="text-accent-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">查看统计</div>
            <div className="text-xs text-ink-muted">用时分析、完成率热力图</div>
          </div>
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-lg text-xs font-medium',
            message.type === 'error'
              ? 'bg-danger-50 text-danger-700'
              : message.type === 'success'
                ? 'bg-success-50 text-success-700'
                : 'bg-brand-50 text-brand-700',
          )}
        >
          {message.text}
        </div>
      )}

      {/* 版本信息 */}
      <div className="pt-3 border-t border-brand-200/20 text-center">
        <span className="text-xs text-ink-muted">Todo Calendar v0.7.0</span>
      </div>
    </div>
  )
}
