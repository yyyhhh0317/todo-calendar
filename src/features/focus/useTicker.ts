/**
 * 计时器 tick hook
 * 当有活跃计时器时，每秒推进计时
 */
import { useEffect } from 'react'
import { useTimerStore } from '@/store/useTimerStore'

export function useTicker() {
  const activeTimerId = useTimerStore((s) => s.activeTimerId)
  const tick = useTimerStore((s) => s.tick)

  useEffect(() => {
    if (!activeTimerId) return
    const interval = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimerId, tick])
}
