/**
 * DnD Provider - 基于 @dnd-kit/core
 * 提供拖拽上下文，支持任务块在任务栏与排期区之间拖拽
 */
import { type ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState, useCallback } from 'react'
import type { DragBlockPayload } from './dragTypes'

interface DndProviderProps {
  children: ReactNode
  onDragEnd?: (event: DragEndEvent) => void
  renderDragOverlay?: (payload: DragBlockPayload | null) => ReactNode
}

/** 落位动画：轻微弹性 + 更自然的缓动 */
const dropAnimation = {
  ...defaultDropAnimation,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  duration: 220,
}

export function DndProvider({ children, onDragEnd, renderDragOverlay }: DndProviderProps) {
  const [activePayload, setActivePayload] = useState<DragBlockPayload | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const payload = event.active.data.current as DragBlockPayload | undefined
    if (payload) setActivePayload(payload)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActivePayload(null)
      onDragEnd?.(event)
    },
    [onDragEnd],
  )

  const handleDragCancel = useCallback(() => {
    setActivePayload(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={dropAnimation} className="drag-overlay">
        {renderDragOverlay?.(activePayload) ?? null}
      </DragOverlay>
    </DndContext>
  )
}
