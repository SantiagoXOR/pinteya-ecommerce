'use client'

import { AdminCard } from '../ui/AdminCard'
import { Table, X, Database, Key } from '@/lib/optimized-imports'
import { TableDetails as TableDetailsType } from '@/hooks/admin/useDatabase'

interface TableDetailsProps {
  tableDetails: TableDetailsType | null
  onClose: () => void
}

export function TableDetails({ tableDetails, onClose }: TableDetailsProps) {
  if (!tableDetails) return null

  return (
    <AdminCard
      title={`Detalles: ${tableDetails.name}`}
      actions={
        <button
          onClick={onClose}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <X className='w-5 h-5' />
        </button>
      }
    >
      <div className='space-y-6'>
        {/* Información general */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600 mb-1'>Esquema</p>
            <p className='font-medium text-gray-900'>{tableDetails.schema}</p>
          </div>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600 mb-1'>Registros</p>
            <p className='font-medium text-gray-900'>
              {tableDetails.recordCount !== null
                ? tableDetails.recordCount.toLocaleString('es-AR')
                : 'N/A'}
            </p>
          </div>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600 mb-1'>Columnas</p>
            <p className='font-medium text-gray-900'>{tableDetails.columns.length}</p>
          </div>
        </div>

        {/* Columnas */}
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2'>
            <Database className='w-5 h-5' />
            <span>Columnas</span>
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-2 px-4 font-medium text-gray-700'>Nombre</th>
                  <th className='text-left py-2 px-4 font-medium text-gray-700'>Tipo</th>
                  <th className='text-center py-2 px-4 font-medium text-gray-700'>Nullable</th>
                  <th className='text-left py-2 px-4 font-medium text-gray-700'>Default</th>
                </tr>
              </thead>
              <tbody>
                {tableDetails.columns.map((column, index) => (
                  <tr key={index} className='border-b border-gray-100'>
                    <td className='py-2 px-4 font-medium text-gray-900'>{column.name}</td>
                    <td className='py-2 px-4 text-gray-600'>
                      <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm'>
                        {column.type}
                      </span>
                    </td>
                    <td className='py-2 px-4 text-center'>
                      {column.nullable ? (
                        <span className='text-green-600'>Sí</span>
                      ) : (
                        <span className='text-red-600'>No</span>
                      )}
                    </td>
                    <td className='py-2 px-4 text-gray-600'>
                      {column.default || <span className='text-gray-400'>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Índices */}
        {tableDetails.indexes.length > 0 && (
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2'>
              <Key className='w-5 h-5' />
              <span>Índices</span>
            </h3>
            <div className='space-y-2'>
              {tableDetails.indexes.map((index, idx) => (
                <div key={idx} className='p-3 bg-gray-50 rounded-lg'>
                  <code className='text-sm text-gray-900'>{index}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Foreign Keys */}
        {tableDetails.foreignKeys.length > 0 && (
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Relaciones (Foreign Keys)</h3>
            <div className='space-y-2'>
              {tableDetails.foreignKeys.map((fk, idx) => (
                <div key={idx} className='p-3 bg-gray-50 rounded-lg'>
                  <p className='text-sm text-gray-900'>
                    <span className='font-medium'>{fk.column}</span> →{' '}
                    <span className='font-medium'>{fk.referencesTable}.{fk.referencesColumn}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  )
}
