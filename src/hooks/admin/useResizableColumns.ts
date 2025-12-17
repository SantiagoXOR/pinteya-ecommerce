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
  const [justFinishedResizing, setJustFinishedResizing] = useState<string | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnKey: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useResizableColumns.ts:26',message:'handleMouseDown called',data:{columnKey,clientX:e.clientX,defaultPrevented:e.defaultPrevented,isPropagationStopped:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      e.preventDefault()
      e.stopPropagation()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useResizableColumns.ts:30',message:'after stopPropagation',data:{columnKey,defaultPrevented:e.defaultPrevented},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const currentWidth = columnWidths[columnKey] || defaultWidths[columnKey] || 150
      setIsResizing(columnKey)
      setStartX(e.clientX)
      setStartWidth(currentWidth)
      setJustFinishedResizing(null) // Reset flag
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useResizableColumns.ts:36',message:'resize state set',data:{columnKey,currentWidth,isResizing:columnKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useResizableColumns.ts:56',message:'handleMouseUp called',data:{wasResizing:isResizing},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (isResizing) {
      // Marcar que acabamos de redimensionar esta columna para prevenir clicks
      setJustFinishedResizing(isResizing)
      // Limpiar la flag después de un breve delay para permitir que el click se prevenga
      setTimeout(() => setJustFinishedResizing(null), 100)
    }
    setIsResizing(null)
  }, [isResizing])

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
    justFinishedResizing,
    handleMouseDown,
    resetColumnWidths,
    tableRef,
  }
}
