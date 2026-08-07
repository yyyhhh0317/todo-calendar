/**
 * 全局键盘快捷键 Hook
 * 统一管理应用的快捷键绑定
 *
 * 规则：
 * - 在 input/textarea/select/contentEditable 中输入时，除 allowInInput 的快捷键外不触发
 * - 不拦截带 Ctrl/Cmd/Meta/Alt 修饰键的组合键（让浏览器原生行为生效）
 * - 按键不区分大小写
 */
import { useEffect, useRef } from 'react'

export interface KeyboardShortcut {
  /** 按键名称，如 'n', 'Escape', 'ArrowLeft', '?' */
  key: string
  handler: () => void
  /** 是否在输入框中也生效（默认 false，只有 Esc 建议 true） */
  allowInInput?: boolean
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (INPUT_TAGS.has(target.tagName)) return true
  if (target.isContentEditable) return true
  return false
}

export function useKeyboard(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 不拦截带修饰键的组合键
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const keyLower = e.key.toLowerCase()
      const typing = isTyping(e.target)

      for (const shortcut of shortcutsRef.current) {
        if (keyLower !== shortcut.key.toLowerCase()) continue

        // 在输入框中时，只有 allowInInput 的快捷键才触发
        if (typing && !shortcut.allowInInput) continue

        e.preventDefault()
        shortcut.handler()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
