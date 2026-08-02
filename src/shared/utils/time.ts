/**
 * 时间相关工具函数
 * 包含目标倒计时格式化、时长格式化等
 */

/**
 * 格式化目标倒计时
 * 来自 spec 的倒计时格式规则：
 * - diffMinutes <= 0 → '已到期'
 * - days >= 3 → `${days} 天`
 * - days >= 1 → `${days} 天 ${hours} 小时`
 * - 否则 → `${hours} 小时 ${minutes} 分钟`
 */
export function formatTargetCountdown(diffMinutes: number): string {
  if (diffMinutes <= 0) return '已到期'

  const days = Math.floor(diffMinutes / 1440)
  const hours = Math.floor((diffMinutes % 1440) / 60)
  const minutes = diffMinutes % 60

  if (days >= 3) return `${days} 天`
  if (days >= 1) return `${days} 天 ${hours} 小时`
  return `${hours} 小时 ${minutes} 分钟`
}

/**
 * 计算两个时间点之间的分钟差
 * target 可以是过去或未来
 */
export function diffInMinutes(from: Date | string, to: Date | string): number {
  const fromDate = typeof from === 'string' ? new Date(from) : from
  const toDate = typeof to === 'string' ? new Date(to) : to
  return Math.round((toDate.getTime() - fromDate.getTime()) / 60000)
}

/**
 * 计算距离目标时间的剩余分钟数（未来为正，过去为负）
 */
export function minutesUntil(targetAt: Date | string, now: Date = new Date()): number {
  return diffInMinutes(now, targetAt)
}

/**
 * 将分钟数格式化为可读时长，例如 90 → '1h 30m'，45 → '45m'
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * 将秒数格式化为 mm:ss 或 hh:mm:ss
 */
export function formatStopwatch(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/**
 * 将 "HH:mm" 字符串转换为当天的分钟数（从 00:00 起）
 */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * 将分钟数转换为 "HH:mm" 字符串
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}`
}

/**
 * 根据开始时间和时长（分钟）计算结束时间字符串
 */
export function calcEndTime(startTime: string, durationMinutes: number): string {
  const start = timeStringToMinutes(startTime)
  return minutesToTimeString(start + durationMinutes)
}
