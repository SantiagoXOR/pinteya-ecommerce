'use client'

import React, { useState } from 'react'
import {
  Activity,
  Filter,
  Calendar,
  RefreshCw,
  Download,
  Search,
  ChevronDown,
  User,
  ShoppingCart,
  Shield,
  Settings,
  LogIn,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useUserActivity,
  useActivityCategories,
  useActivityFormatter,
} from '@/hooks/useUserActivity'

export function ActivityLog() {
  const {
    activities,
    isLoading,
    error,
    pagination,
    stats,
    loadMore,
    refreshActivities,
    filters,
    setFilters,
  } = useUserActivity()

  const { categories, getCategoryInfo } = useActivityCategories()
  const { formatAction, formatTimeAgo } = useActivityFormatter()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('')

  // Función para aplicar filtros
  const applyFilters = () => {
    const newFilters: any = {
      limit: 20,
      offset: 0,
    }

    if (selectedCategory) {
      newFilters.category = selectedCategory
    }

    if (dateRange) {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }

      newFilters.startDate = startDate.toISOString()
    }

    setFilters(newFilters)
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedCategory('')
    setDateRange('')
    setSearchTerm('')
    setFilters({ limit: 20, offset: 0 })
  }

  // Función para obtener icono de categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <LogIn className='h-4 w-4' />
      case 'profile':
        return <User className='h-4 w-4' />
      case 'order':
        return <ShoppingCart className='h-4 w-4' />
      case 'security':
        return <Shield className='h-4 w-4' />
      case 'session':
        return <Monitor className='h-4 w-4' />
      case 'preference':
        return <Settings className='h-4 w-4' />
      default:
        return <Activity className='h-4 w-4' />
    }
  }

  // Filtrar actividades por término de búsqueda
  const filteredActivities = activities.filter(
    activity =>
      !searchTerm ||
      formatAction(activity.action).toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <Activity className='h-6 w-6 text-blue-500' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-600'>Total Actividades</p>
                <p className='text-xl font-bold text-gray-900'>{stats.totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(stats.byCategory)
          .slice(0, 3)
          .map(([category, count]) => {
            const categoryInfo = getCategoryInfo(category)
            return (
              <Card key={category}>
                <CardContent className='p-4'>
                  <div className='flex items-center'>
                    {getCategoryIcon(category)}
                    <div className='ml-3'>
                      <p className='text-sm font-medium text-gray-600'>{categoryInfo.label}</p>
                      <p className='text-xl font-bold text-gray-900'>{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Filter className='h-5 w-5 mr-2' />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <Input
                placeholder='Buscar actividad...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full'
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder='Todas las categorías' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder='Período de tiempo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>Todo el tiempo</SelectItem>
                <SelectItem value='24h'>Últimas 24 horas</SelectItem>
                <SelectItem value='7d'>Últimos 7 días</SelectItem>
                <SelectItem value='30d'>Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>

            <div className='flex space-x-2'>
              <Button onClick={applyFilters} className='flex-1'>
                Aplicar
              </Button>
              <Button variant='outline' onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Actividades */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center'>
              <Activity className='h-5 w-5 mr-2' />
              Actividades Recientes ({pagination.total})
            </CardTitle>
            <div className='flex space-x-2'>
              <Button variant='outline' size='sm' onClick={refreshActivities} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && activities.length === 0 ? (
            <div className='flex items-center justify-center h-32'>
              <RefreshCw className='h-6 w-6 animate-spin text-gray-400' />
              <span className='ml-2 text-gray-600'>Cargando actividades...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-32'>
              <span className='text-red-600'>
                {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
              </span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className='text-center py-8'>
              <Activity className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>No se encontraron actividades</p>
              <p className='text-sm text-gray-500 mt-1'>
                Intenta ajustar los filtros o realizar alguna acción
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredActivities.map(activity => {
                const categoryInfo = getCategoryInfo(activity.category)
                return (
                  <div
                    key={activity.id}
                    className='flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className={`p-2 rounded-full bg-${categoryInfo.color}-100`}>
                      {getCategoryIcon(activity.category)}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-sm font-medium text-gray-900'>
                          {formatAction(activity.action)}
                        </h4>
                        <div className='flex items-center space-x-2'>
                          <Badge
                            variant='secondary'
                            className={`bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800`}
                          >
                            {categoryInfo.label}
                          </Badge>
                          <span className='text-xs text-gray-500'>
                            {formatTimeAgo(activity.created_at)}
                          </span>
                        </div>
                      </div>

                      {activity.description && (
                        <p className='text-sm text-gray-600 mt-1'>{activity.description}</p>
                      )}

                      <div className='flex items-center space-x-4 mt-2 text-xs text-gray-500'>
                        {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                        <span>{new Date(activity.created_at).toLocaleString()}</span>
                      </div>

                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className='mt-2'>
                          <summary className='text-xs text-gray-500 cursor-pointer hover:text-gray-700'>
                            Ver detalles
                          </summary>
                          <pre className='text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-x-auto'>
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Botón Cargar Más */}
              {pagination.hasMore && (
                <div className='text-center pt-4'>
                  <Button variant='outline' onClick={loadMore} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <ChevronDown className='h-4 w-4 mr-2' />
                        Cargar Más
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
