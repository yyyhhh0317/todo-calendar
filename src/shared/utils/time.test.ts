/**
 * 时间工具单测
 */
import { describe, expect, it } from 'vitest'
import {
  formatTargetCountdown,
  diffInMinutes,
  minutesUntil,
  formatDuration,
  formatStopwatch,
  timeStringToMinutes,
  minutesToTimeString,
  calcEndTime,
} from './time'

describe('formatTargetCountdown 倒计时格式化', () => {
  it('过期返回 已到期', () => {
    expect(formatTargetCountdown(0)).toBe('已到期')
    expect(formatTargetCountdown(-5)).toBe('已到期')
  })

  it('>= 3 天只显示天数', () => {
    expect(formatTargetCountdown(3 * 1440)).toBe('3 天')
    expect(formatTargetCountdown(3 * 1440 + 60)).toBe('3 天')
  })

  it('1-2 天显示 天 + 小时', () => {
    expect(formatTargetCountdown(1440 + 120)).toBe('1 天 2 小时')
  })

  it('不足 1 天显示 小时 + 分钟', () => {
    expect(formatTargetCountdown(60 + 30)).toBe('1 小时 30 分钟')
    expect(formatTargetCountdown(30)).toBe('0 小时 30 分钟')
  })
})

describe('diffInMinutes / minutesUntil', () => {
  it('计算两个时间点分钟差', () => {
    expect(diffInMinutes('2026-08-10T09:00:00', '2026-08-10T10:30:00')).toBe(90)
  })

  it('minutesUntil 未来为正、过去为负', () => {
    const now = new Date('2026-08-10T09:00:00')
    expect(minutesUntil('2026-08-10T10:00:00', now)).toBe(60)
    expect(minutesUntil('2026-08-10T08:00:00', now)).toBe(-60)
  })
})

describe('formatDuration 时长格式化', () => {
  it('格式化为 h/m 组合', () => {
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(-10)).toBe('0m')
  })
})

describe('formatStopwatch 秒表格式化', () => {
  it('mm:ss 格式', () => {
    expect(formatStopwatch(0)).toBe('00:00')
    expect(formatStopwatch(65)).toBe('01:05')
    expect(formatStopwatch(3599)).toBe('59:59')
  })

  it('超过 1 小时用 hh:mm:ss', () => {
    expect(formatStopwatch(3600)).toBe('01:00:00')
    expect(formatStopwatch(3661)).toBe('01:01:01')
  })
})

describe('timeStringToMinutes / minutesToTimeString / calcEndTime', () => {
  it('HH:mm → 分钟数', () => {
    expect(timeStringToMinutes('00:00')).toBe(0)
    expect(timeStringToMinutes('08:30')).toBe(510)
    expect(timeStringToMinutes('22:00')).toBe(1320)
  })

  it('分钟数 → HH:mm', () => {
    expect(minutesToTimeString(0)).toBe('00:00')
    expect(minutesToTimeString(510)).toBe('08:30')
    expect(minutesToTimeString(23 * 60 + 59)).toBe('23:59')
  })

  it('calcEndTime 计算结束时间', () => {
    expect(calcEndTime('09:00', 30)).toBe('09:30')
    expect(calcEndTime('09:00', 90)).toBe('10:30')
    expect(calcEndTime('22:30', 60)).toBe('23:30')
  })
})
