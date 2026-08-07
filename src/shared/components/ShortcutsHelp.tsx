/**
 * 快捷键帮助弹窗
 * 显示所有可用的键盘快捷键
 */
import { CloseIcon } from '@/shared/components/Icons'

interface ShortcutsHelpProps {
  onClose: () => void
}

interface ShortcutItem {
  keys: string
  desc: string
}

const SHORTCUT_GROUPS: { title: string; items: ShortcutItem[] }[] = [
  {
    title: '任务',
    items: [{ keys: 'N', desc: '聚焦新建任务输入框' }],
  },
  {
    title: '导航',
    items: [
      { keys: '←', desc: '上一周 / 月' },
      { keys: '→', desc: '下一周 / 月' },
      { keys: 'H', desc: '回到今天' },
      { keys: 'W', desc: '切换到周视图' },
      { keys: 'M', desc: '切换到月视图' },
    ],
  },
  {
    title: '面板',
    items: [
      { keys: 'T', desc: '切换计时器面板' },
      { keys: 'S', desc: '打开设置' },
      { keys: '?', desc: '显示快捷键帮助' },
      { keys: 'Esc', desc: '关闭当前弹窗' },
    ],
  },
]

export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-6 w-[420px] max-w-[90vw] animate-slide-up"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink">键盘快捷键</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-brand-50 text-ink-muted hover:text-ink transition-colors"
            aria-label="关闭"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.keys}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/50"
                  >
                    <span className="text-sm text-ink">{item.desc}</span>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-semibold text-ink bg-white border border-brand-200/60 rounded-md shadow-sm">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 pt-3 border-t border-brand-200/30 text-xs text-ink-muted text-center">
          在输入框中输入时，除 Esc 外快捷键不触发
        </p>
      </div>
    </div>
  )
}
