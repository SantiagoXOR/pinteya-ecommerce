'use client'

import { useState } from 'react'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { DatabaseOverview } from '@/components/admin/database/DatabaseOverview'
import { TablesList } from '@/components/admin/database/TablesList'
import { TableDetails } from '@/components/admin/database/TableDetails'
import { useDatabase } from '@/hooks/admin/useDatabase'
import { Database } from '@/lib/optimized-imports'

export function DatabasePageClient() {
  const {
    stats,
    tables,
    selectedTable,
    loading,
    error,
    schema,
    setSchema,
    fetchTables,
    fetchTableDetails,
    clearSelectedTable,
  } = useDatabase()

  const handleTableSelect = (tableName: string) => {
    fetchTableDetails(tableName, schema)
  }

  return (
    <AdminContentWrapper>
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 text-white'>
          <div className='flex items-center space-x-3'>
            <Database className='w-8 h-8' />
            <div>
              <h1 className='text-3xl font-bold'>Base de Datos</h1>
              <p className='text-orange-100 mt-1'>Herramientas de gestión y visualización</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {/* Vista general */}
        <DatabaseOverview stats={stats} loading={loading} />

        {/* Detalles de tabla seleccionada */}
        {selectedTable && (
          <TableDetails tableDetails={selectedTable} onClose={clearSelectedTable} />
        )}

        {/* Lista de tablas */}
        <TablesList
          tables={tables}
          loading={loading}
          onTableSelect={handleTableSelect}
          schema={schema}
          onSchemaChange={(newSchema) => {
            setSchema(newSchema)
            fetchTables(newSchema)
          }}
        />
      </div>
    </AdminContentWrapper>
  )
}
