/**
 * 类名拼接工具
 * 过滤 falsy 值后用空格连接
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
