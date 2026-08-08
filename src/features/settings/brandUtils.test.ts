/**
 * 主题色生成工具单测
 */
import { describe, expect, it } from 'vitest'
import { generatePalette, PRESET_BRANDS } from './brandUtils'

describe('generatePalette 色板生成', () => {
  it('500 与 default 等于主色', () => {
    const p = generatePalette('#6c5ce7')
    expect(p.default).toBe('108, 92, 231')
    expect(p['500']).toBe('108, 92, 231')
  })

  it('色阶从浅到深单调变化（50 最浅、900 最深）', () => {
    const p = generatePalette('#6c5ce7')
    const parse = (s: string) => s.split(', ').map(Number)
    const lum = (rgb: number[]) => rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114
    const levels = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const
    const luminances = levels.map((l) => lum(parse(p[l])))
    for (let i = 1; i < luminances.length; i++) {
      expect(luminances[i]).toBeLessThan(luminances[i - 1])
    }
  })

  it('浅色阶接近白色、深色阶接近黑色', () => {
    const p = generatePalette('#ff0000')
    expect(p['50']).toBe('255, 235, 235')
    expect(p['900']).toBe('82, 0, 0')
  })

  it('支持 3 位 HEX 缩写', () => {
    const p = generatePalette('#6ce')
    expect(p['500']).toBe('102, 204, 238')
  })

  it('预设色板均为合法 6 位 HEX', () => {
    for (const preset of PRESET_BRANDS) {
      expect(preset.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
