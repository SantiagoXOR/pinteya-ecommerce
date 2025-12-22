'use client'

import { useState } from 'react'
import { AdminCard } from '../ui/AdminCard'
import { Table, Search, Database } from '@/lib/optimized-imports'
import { TableInfo } from '@/hooks/admin/useDatabase'

interface TablesListProps {
  tables: TableInfo[]
  loading: boolean
  onTableSelect: (tableName: string) => void
  schema: string
  onSchemaChange: (schema: string) => void
}

export function TablesList({
  tables,
  loading,
  onTableSelect,
  schema,
  onSchemaChange,
}: TablesListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A'
    return num.toLocaleString('es-AR')
  }

  return (
    <AdminCard title='Tablas de Base de Datos'>
      <div className='space-y-4'>
        {/* Filtros */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Buscar tabla...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
          <select
            value={schema}
            onChange={(e) => onSchemaChange(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='public'>Esquema: public</option>
          </select>
        </div>

        {/* Lista de tablas */}
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className='text-center py-8 text-gray-600'>
            <Database className='w-12 h-12 mx-auto mb-4 text-gray-400' />
            <p>No se encontraron tablas</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Nombre</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Esquema</th>
                  <th className='text-right py-3 px-4 font-medium text-gray-700'>Registros</th>
                  <th className='text-right py-3 px-4 font-medium text-gray-700'>Columnas</th>
                  <th className='text-center py-3 px-4 font-medium text-gray-700'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map((table) => (
                  <tr
                    key={`${table.schema}.${table.name}`}
                    className='border-b border-gray-100 hover:bg-gray-50 transition-colors'
                  >
                    <td className='py-3 px-4'>
                      <div className='flex items-center space-x-2'>
                        <Table className='w-4 h-4 text-gray-400' />
                        <span className='font-medium text-gray-900'>{table.name}</span>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-gray-600'>{table.schema}</td>
                    <td className='py-3 px-4 text-right text-gray-600'>
                      {formatNumber(table.recordCount)}
                    </td>
                    <td className='py-3 px-4 text-right text-gray-600'>
                      {formatNumber(table.columns)}
                    </td>
                    <td className='py-3 px-4 text-center'>
                      <button
                        onClick={() => onTableSelect(table.name)}
                        className='text-blue-600 hover:text-blue-800 font-medium text-sm'
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminCard>
  )
}
