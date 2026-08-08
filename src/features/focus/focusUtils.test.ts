/**
 * 专注/高亮工具单测
 */
import { describe, expect, it } from 'vitest'
import { getImportanceClasses, isTimerInteractive, getTimerProgress } from './focusUtils'

describe('getImportanceClasses 重要程度样式', () => {
  it('critical 返回红色系', () => {
    const c = getImportanceClasses('critical')
    expect(c.border).toContain('danger')
    expect(c.text).toContain('danger')
  })

  it('important 返回强调色系', () => {
    const c = getImportanceClasses('important')
    expect(c.border).toContain('accent')
  })

  it('normal 返回品牌色中性样式', () => {
    const c = getImportanceClasses('normal')
    expect(c.border).toContain('brand')
    expect(c.bg).toBe('bg-white')
  })
})

describe('isTimerInteractive 计时器交互状态', () => {
  it('running / paused 可交互', () => {
    expect(isTimerInteractive('running')).toBe(true)
    expect(isTimerInteractive('paused')).toBe(true)
  })

  it('finished / idle 不可交互', () => {
    expect(isTimerInteractive('finished')).toBe(false)
    expect(isTimerInteractive('idle')).toBe(false)
    expect(isTimerInteractive('')).toBe(false)
  })
})

describe('getTimerProgress 倒计时进度', () => {
  it('无时长返回 0', () => {
    expect(getTimerProgress(30, undefined)).toBe(0)
    expect(getTimerProgress(30, 0)).toBe(0)
    expect(getTimerProgress(30, -5)).toBe(0)
  })

  it('计算进度百分比', () => {
    // 10 分钟倒计时，已过 5 分钟 = 50%
    expect(getTimerProgress(300, 10)).toBe(50)
  })

  it('进度不超过 100', () => {
    expect(getTimerProgress(9999, 1)).toBe(100)
  })
})
