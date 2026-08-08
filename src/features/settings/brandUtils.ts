/**
 * 主题色生成工具
 * 从一个主色（HEX）生成完整的 brand 色板（50~900 + DEFAULT）
 * 算法：按亮度阶梯插值 主色 ↔ 白（浅色）/ 黑（深色），保持色相与饱和度
 */

/** 色板形状：DEFAULT 用 500，各色阶为 "r, g, b" 字符串（供 CSS var 使用） */
export interface BrandPalette {
  default: string
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

/** 把 HEX 转成 [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(h, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

/** 把 [r, g, b] 转成 "r, g, b" 字符串 */
function rgbToString(rgb: [number, number, number]): string {
  return rgb.join(', ')
}

/** 在 from 与 to 之间按 t(0~1) 线性插值 */
function mix(from: [number, number, number], to: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ]
}

/**
 * 从主色生成品牌色板
 * 500 = 主色；50~400 向白色插值；600~900 向黑色插值
 */
export function generatePalette(hex: string): BrandPalette {
  const base = hexToRgb(hex)
  const white: [number, number, number] = [255, 255, 255]
  const black: [number, number, number] = [0, 0, 0]

  return {
    default: rgbToString(base),
    50: rgbToString(mix(base, white, 0.92)),
    100: rgbToString(mix(base, white, 0.84)),
    200: rgbToString(mix(base, white, 0.7)),
    300: rgbToString(mix(base, white, 0.52)),
    400: rgbToString(mix(base, white, 0.3)),
    500: rgbToString(base),
    600: rgbToString(mix(base, black, 0.2)),
    700: rgbToString(mix(base, black, 0.38)),
    800: rgbToString(mix(base, black, 0.55)),
    900: rgbToString(mix(base, black, 0.68)),
  }
}

/** 预设主题色（品牌色主色） */
export const PRESET_BRANDS: { name: string; color: string }[] = [
  { name: '紫罗兰', color: '#6c5ce7' }, // 默认
  { name: '靛蓝', color: '#4361ee' },
  { name: '青碧', color: '#0ea5e9' },
  { name: '翡翠', color: '#10b981' },
  { name: '珊瑚', color: '#f97316' },
  { name: '绯红', color: '#e11d48' },
]

/** 把色板应用到 document 的 CSS 变量上 */
export function applyBrandPalette(palette: BrandPalette): void {
  const root = document.documentElement
  root.style.setProperty('--brand-rgb', palette.default)
  root.style.setProperty('--brand-50-rgb', palette['50'])
  root.style.setProperty('--brand-100-rgb', palette['100'])
  root.style.setProperty('--brand-200-rgb', palette['200'])
  root.style.setProperty('--brand-300-rgb', palette['300'])
  root.style.setProperty('--brand-400-rgb', palette['400'])
  root.style.setProperty('--brand-500-rgb', palette['500'])
  root.style.setProperty('--brand-600-rgb', palette['600'])
  root.style.setProperty('--brand-700-rgb', palette['700'])
  root.style.setProperty('--brand-800-rgb', palette['800'])
  root.style.setProperty('--brand-900-rgb', palette['900'])
}
