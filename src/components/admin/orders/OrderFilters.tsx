'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  X,
  Calendar,
  DollarSign,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface OrderFiltersProps {
  filters: any
  updateFilters: (filters: any) => void
  resetFilters: () => void
  className?: string
}

export function OrderFilters({
  filters,
  updateFilters,
  resetFilters,
  className,
}: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // Simple debounce
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value, page: 1 })
    }, 500)
    return () => clearTimeout(timeoutId)
  }

  const hasActiveFilters =
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.payment_status && filters.payment_status !== 'all') ||
    filters.date_from ||
    filters.date_to ||
    filters.min_amount ||
    filters.max_amount

  return (
    <Card className={cn('border-t-4 border-t-blue-500', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Filter className='w-5 h-5' />
            <span>Filtros</span>
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowAdvanced(!showAdvanced)}
              className='text-sm'
            >
              <SlidersHorizontal className='w-4 h-4 mr-2' />
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Avanzados
            </Button>
            {hasActiveFilters && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  resetFilters()
                  setSearchTerm('')
                }}
                className='text-sm'
              >
                <X className='w-4 h-4 mr-2' />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Búsqueda y filtros básicos */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Búsqueda */}
          <div className='lg:col-span-2'>
            <Label htmlFor='search'>Buscar</Label>
            <div className='relative mt-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                id='search'
                placeholder='Número de orden, cliente, email...'
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Estado de Orden */}
          <div>
            <Label htmlFor='status'>Estado de Orden</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={value => {
                const newFilters: any = { page: 1 }
                if (value !== 'all') {
                  newFilters.status = value
                }
                updateFilters(newFilters)
              }}
            >
              <SelectTrigger id='status' className='mt-1'>
                <SelectValue placeholder='Todos los estados' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                <SelectItem value='pending'>Pendiente</SelectItem>
                <SelectItem value='confirmed'>Confirmada</SelectItem>
                <SelectItem value='processing'>En Proceso</SelectItem>
                <SelectItem value='shipped'>Enviada</SelectItem>
                <SelectItem value='delivered'>Entregada</SelectItem>
                <SelectItem value='cancelled'>Cancelada</SelectItem>
                <SelectItem value='refunded'>Reembolsada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado de Pago */}
          <div>
            <Label htmlFor='payment_status'>Estado de Pago</Label>
            <Select
              value={filters.payment_status || 'all'}
              onValueChange={value =>
                updateFilters({
                  payment_status: value === 'all' ? undefined : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger id='payment_status' className='mt-1'>
                <SelectValue placeholder='Todos los pagos' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los pagos</SelectItem>
                <SelectItem value='pending'>Pendiente</SelectItem>
                <SelectItem value='paid'>Pagado</SelectItem>
                <SelectItem value='failed'>Fallido</SelectItem>
                <SelectItem value='refunded'>Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t'>
            {/* Fecha Desde */}
            <div>
              <Label htmlFor='date_from'>
                <Calendar className='w-4 h-4 inline mr-1' />
                Fecha Desde
              </Label>
              <Input
                id='date_from'
                type='date'
                value={filters.date_from || ''}
                onChange={e =>
                  updateFilters({ date_from: e.target.value, page: 1 })
                }
                className='mt-1'
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <Label htmlFor='date_to'>
                <Calendar className='w-4 h-4 inline mr-1' />
                Fecha Hasta
              </Label>
              <Input
                id='date_to'
                type='date'
                value={filters.date_to || ''}
                onChange={e =>
                  updateFilters({ date_to: e.target.value, page: 1 })
                }
                className='mt-1'
              />
            </div>

            {/* Monto Mínimo */}
            <div>
              <Label htmlFor='min_amount'>
                <DollarSign className='w-4 h-4 inline mr-1' />
                Monto Mínimo
              </Label>
              <Input
                id='min_amount'
                type='number'
                min='0'
                step='100'
                placeholder='0'
                value={filters.min_amount || ''}
                onChange={e =>
                  updateFilters({
                    min_amount: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
                className='mt-1'
              />
            </div>

            {/* Monto Máximo */}
            <div>
              <Label htmlFor='max_amount'>
                <DollarSign className='w-4 h-4 inline mr-1' />
                Monto Máximo
              </Label>
              <Input
                id='max_amount'
                type='number'
                min='0'
                step='100'
                placeholder='Sin límite'
                value={filters.max_amount || ''}
                onChange={e =>
                  updateFilters({
                    max_amount: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
                className='mt-1'
              />
            </div>
          </div>
        )}

        {/* Ordenamiento y resultados por página */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t'>
          {/* Ordenar por */}
          <div>
            <Label htmlFor='sort'>Ordenar por</Label>
            <Select
              value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'desc'}`}
              onValueChange={value => {
                const [sort_by, sort_order] = value.split('-')
                updateFilters({ sort_by, sort_order, page: 1 })
              }}
            >
              <SelectTrigger id='sort' className='mt-1'>
                <SelectValue placeholder='Ordenar por...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='created_at-desc'>Más Recientes</SelectItem>
                <SelectItem value='created_at-asc'>Más Antiguos</SelectItem>
                <SelectItem value='total-desc'>Mayor Monto</SelectItem>
                <SelectItem value='total-asc'>Menor Monto</SelectItem>
                <SelectItem value='status-asc'>Estado (A-Z)</SelectItem>
                <SelectItem value='status-desc'>Estado (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados por página */}
          <div>
            <Label htmlFor='limit'>Resultados por página</Label>
            <Select
              value={String(filters.limit || 25)}
              onValueChange={value =>
                updateFilters({ limit: Number(value), page: 1 })
              }
            >
              <SelectTrigger id='limit' className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10 por página</SelectItem>
                <SelectItem value='25'>25 por página</SelectItem>
                <SelectItem value='50'>50 por página</SelectItem>
                <SelectItem value='100'>100 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

