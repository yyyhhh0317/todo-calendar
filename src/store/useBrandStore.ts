/**
 * 主题色状态管理
 * 管理品牌色板（brand 色板），支持预设色板选择 + 自定义主色
 * 持久化到 localStorage，刷新后保留
 */
import { create } from 'zustand'
import { loadFromStorage, saveToStorage } from './persistence'
import { generatePalette, applyBrandPalette, PRESET_BRANDS, type BrandPalette } from '@/features/settings/brandUtils'

const BRAND_KEY = 'brand'

interface BrandState {
  /** 当前主色 HEX */
  color: string
  /** 当前色板（由主色生成） */
  palette: BrandPalette
  /** 设置主色（自动生成色板并应用） */
  setColor: (hex: string) => void
  /** 重置为默认紫罗兰 */
  reset: () => void
}

function loadColor(): string {
  const saved = loadFromStorage<string>(BRAND_KEY)
  // 校验是合法 HEX
  if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) return saved
  return PRESET_BRANDS[0].color
}

export const useBrandStore = create<BrandState>((set) => {
  const initialColor = loadColor()
  const initialPalette = generatePalette(initialColor)
  // 初始化时立即应用品牌色，避免默认色一闪
  applyBrandPalette(initialPalette)

  return {
    color: initialColor,
    palette: initialPalette,

    setColor: (hex) => {
      const palette = generatePalette(hex)
      applyBrandPalette(palette)
      saveToStorage(BRAND_KEY, hex)
      set({ color: hex, palette })
    },

    reset: () => {
      const hex = PRESET_BRANDS[0].color
      const palette = generatePalette(hex)
      applyBrandPalette(palette)
      saveToStorage(BRAND_KEY, hex)
      set({ color: hex, palette })
    },
  }
})

export { PRESET_BRANDS }
