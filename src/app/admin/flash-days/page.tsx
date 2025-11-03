'use client'

import { useState, useEffect } from 'react'
import { 
  Gift, 
  Users, 
  Trophy, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  Smartphone,
  Monitor,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Participant {
  id: string
  phone_number: string
  phone_normalized: string
  device_type: string
  status: 'pending' | 'contacted' | 'winner' | 'duplicate'
  participated_at: string
  whatsapp_opened: boolean
  ip_address?: string
  browser_language?: string
  screen_resolution?: string
  timezone?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

interface Statistics {
  total: number
  pending: number
  contacted: number
  winners: number
  duplicates: number
}

export default function FlashDaysAdminPanel() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [raffling, setRaffling] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Cargar participantes
  const loadParticipants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/flash-days/participants?${params}`)
      const data = await response.json()

      if (data.success) {
        setParticipants(data.participants || [])
        setStatistics(data.statistics)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Realizar sorteo
  const handleRaffle = async () => {
    if (!confirm('¿Estás seguro de realizar el sorteo? Se seleccionarán 3 ganadores.')) {
      return
    }

    setRaffling(true)
    try {
      const response = await fetch('/api/flash-days/raffle', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        alert(`¡Sorteo realizado! ${data.winners.length} ganadores seleccionados.`)
        loadParticipants()
      } else {
        alert(data.message || 'Error al realizar sorteo')
      }
    } catch (error) {
      console.error('Error in raffle:', error)
      alert('Error al realizar sorteo')
    } finally {
      setRaffling(false)
    }
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    const csv = [
      ['Teléfono', 'Estado', 'Dispositivo', 'Fecha', 'WhatsApp Abierto', 'IP', 'UTM Source'].join(','),
      ...participants.map(p =>
        [
          p.phone_number,
          p.status,
          p.device_type,
          new Date(p.participated_at).toLocaleDateString('es-AR'),
          p.whatsapp_opened ? 'Sí' : 'No',
          p.ip_address || '',
          p.utm_source || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flash-days-participantes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  useEffect(() => {
    loadParticipants()
  }, [page, statusFilter, searchTerm])

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-black mb-2'>Pintura Flash Days - Sorteo</h1>
              <p className='text-purple-100'>Panel de administración y gestión de participantes</p>
            </div>
            <Gift className='w-16 h-16 opacity-50' />
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-600 text-sm font-medium'>Total Participantes</span>
                <Users className='w-5 h-5 text-blue-500' />
              </div>
              <p className='text-3xl font-black text-gray-900'>{statistics.total}</p>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-600 text-sm font-medium'>Pendientes</span>
                <AlertCircle className='w-5 h-5 text-yellow-500' />
              </div>
              <p className='text-3xl font-black text-gray-900'>{statistics.pending}</p>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-600 text-sm font-medium'>Contactados</span>
                <CheckCircle className='w-5 h-5 text-green-500' />
              </div>
              <p className='text-3xl font-black text-gray-900'>{statistics.contacted}</p>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-600 text-sm font-medium'>Ganadores</span>
                <Trophy className='w-5 h-5 text-purple-500' />
              </div>
              <p className='text-3xl font-black text-gray-900'>{statistics.winners}</p>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-600 text-sm font-medium'>Duplicados</span>
                <XCircle className='w-5 h-5 text-red-500' />
              </div>
              <p className='text-3xl font-black text-gray-900'>{statistics.duplicates}</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8'>
          <div className='flex flex-wrap items-center gap-4'>
            {/* Búsqueda */}
            <div className='flex-1 min-w-[300px]'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='Buscar por número de teléfono...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none'
                />
              </div>
            </div>

            {/* Filtro de estado */}
            <div className='flex items-center gap-2'>
              <Filter className='w-5 h-5 text-gray-400' />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none'
              >
                <option value='all'>Todos</option>
                <option value='pending'>Pendientes</option>
                <option value='contacted'>Contactados</option>
                <option value='winner'>Ganadores</option>
                <option value='duplicate'>Duplicados</option>
              </select>
            </div>

            {/* Botones de acción */}
            <button
              onClick={loadParticipants}
              disabled={loading}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50'
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            <button
              onClick={handleExportCSV}
              className='px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium flex items-center gap-2 transition-colors'
            >
              <Download className='w-5 h-5' />
              Exportar CSV
            </button>

            <button
              onClick={handleRaffle}
              disabled={raffling || (statistics?.winners || 0) > 0}
              className='px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Trophy className='w-5 h-5' />
              {raffling ? 'Sorteando...' : statistics?.winners ? 'Ya hay ganadores' : 'Sortear Ganadores'}
            </button>
          </div>
        </div>

        {/* Tabla de participantes */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    Teléfono
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    Dispositivo
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    Fecha
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    WhatsApp
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'>
                    UTM
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
                      Cargando participantes...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
                      No hay participantes
                    </td>
                  </tr>
                ) : (
                  participants.map(participant => (
                    <tr key={participant.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='font-medium text-gray-900'>{participant.phone_number}</div>
                        <div className='text-xs text-gray-500'>{participant.ip_address}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            participant.status === 'winner'
                              ? 'bg-purple-100 text-purple-800'
                              : participant.status === 'contacted'
                              ? 'bg-green-100 text-green-800'
                              : participant.status === 'duplicate'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {participant.status === 'winner' && '🏆 Ganador'}
                          {participant.status === 'contacted' && '✓ Contactado'}
                          {participant.status === 'duplicate' && '✗ Duplicado'}
                          {participant.status === 'pending' && '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2 text-gray-700'>
                          {participant.device_type === 'mobile' ? (
                            <Smartphone className='w-4 h-4' />
                          ) : (
                            <Monitor className='w-4 h-4' />
                          )}
                          <span className='text-sm capitalize'>{participant.device_type}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2 text-gray-700'>
                          <Calendar className='w-4 h-4' />
                          <span className='text-sm'>
                            {new Date(participant.participated_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {participant.whatsapp_opened ? (
                          <span className='text-green-600 text-sm font-medium flex items-center gap-1'>
                            <Eye className='w-4 h-4' />
                            Abrió
                          </span>
                        ) : (
                          <span className='text-gray-400 text-sm'>No abrió</span>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {participant.utm_source ? (
                          <div className='text-xs'>
                            <div className='text-gray-900 font-medium'>{participant.utm_source}</div>
                            {participant.utm_campaign && (
                              <div className='text-gray-500'>{participant.utm_campaign}</div>
                            )}
                          </div>
                        ) : (
                          <span className='text-gray-400 text-sm'>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Anterior
              </button>

              <span className='text-gray-700 font-medium'>
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

