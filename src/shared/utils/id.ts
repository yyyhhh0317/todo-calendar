/**
 * 生成唯一 ID
 * 优先使用 crypto.randomUUID，回退到时间戳 + 随机数
 */
export function generateId(prefix = ''): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}_${uuid}` : uuid
}
