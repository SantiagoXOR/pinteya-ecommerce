'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface ColumnWidths {
  [key: string]: number
}

interface UseResizableColumnsProps {
  defaultWidths?: ColumnWidths
  minWidth?: number
  maxWidth?: number
}

export function useResizableColumns({
  defaultWidths = {},
  minWidth = 50,
  maxWidth = 800,
}: UseResizableColumnsProps = {}) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(defaultWidths)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnKey: string) => {
      e.preventDefault()
      e.stopPropagation()
      
      const currentWidth = columnWidths[columnKey] || defaultWidths[columnKey] || 150
      setIsResizing(columnKey)
      setStartX(e.clientX)
      setStartWidth(currentWidth)
    },
    [columnWidths, defaultWidths]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const diff = e.clientX - startX
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff))

      setColumnWidths((prev) => ({
        ...prev,
        [isResizing]: newWidth,
      }))
    },
    [isResizing, startX, startWidth, minWidth, maxWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const resetColumnWidths = useCallback(() => {
    setColumnWidths(defaultWidths)
  }, [defaultWidths])

  return {
    columnWidths,
    isResizing,
    handleMouseDown,
    resetColumnWidths,
    tableRef,
  }
}
