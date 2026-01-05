import { useState, useEffect, useCallback } from 'react'
import { ApiResponse } from '@/types/api'

interface DatabaseStats {
  totalTables: number
  totalRecords: number
  schemas: Array<{
    name: string
    tableCount: number
  }>
}

interface TableInfo {
  name: string
  schema: string
  recordCount: number | null
  columns: number | null
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

interface TableDetails {
  name: string
  schema: string
  recordCount: number | null
  columns: ColumnInfo[]
  indexes: string[]
  foreignKeys: Array<{
    column: string
    referencesTable: string
    referencesColumn: string
  }>
}

export function useDatabase() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<TableDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schema, setSchema] = useState('public')

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/database/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<DatabaseStats> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al obtener estadísticas')
      }

      setStats(result.data)
    } catch (err) {
      console.error('Error fetching database stats:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTables = useCallback(
    async (schemaName: string = schema) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/database/tables?schema=${schemaName}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result: ApiResponse<TableInfo[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Error al obtener tablas')
        }

        setTables(result.data)
        setSchema(schemaName)
      } catch (err) {
        console.error('Error fetching tables:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    },
    [schema]
  )

  const fetchTableDetails = useCallback(
    async (tableName: string, schemaName: string = schema) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/admin/database/tables/${tableName}?schema=${schemaName}`,
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result: ApiResponse<TableDetails> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Error al obtener detalles de tabla')
        }

        setSelectedTable(result.data)
      } catch (err) {
        console.error('Error fetching table details:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    },
    [schema]
  )

  useEffect(() => {
    fetchStats()
    fetchTables()
  }, [fetchStats, fetchTables])

  return {
    stats,
    tables,
    selectedTable,
    loading,
    error,
    schema,
    setSchema,
    fetchStats,
    fetchTables,
    fetchTableDetails,
    clearSelectedTable: () => setSelectedTable(null),
  }
}
