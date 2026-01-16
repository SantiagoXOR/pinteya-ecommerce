'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, Star, Edit, Trash2 } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { useProductNotifications } from '@/hooks/admin/useProductNotifications'

interface ProductVariant {
  id: number
  product_id: number
  aikon_id: number
  color_name?: string
  measure?: string
  finish?: string
  price_list: number
  price_sale?: number
  stock: number
  is_active: boolean
  is_default: boolean
  image_url?: string
}

interface VariantActionsProps {
  variant: ProductVariant
  productId: string | number
  onEdit: (variant: ProductVariant) => void
}

export function VariantActions({ variant, productId, onEdit }: VariantActionsProps) {
  const queryClient = useQueryClient()
  const notifications = useProductNotifications()
  const [isDeleting, setIsDeleting] = useState(false)

  // Mutation: Duplicar variante
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/products/variants/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: variant.id, productId }),
      })
      if (!res.ok) throw new Error('Error al duplicar variante')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId.toString()] })
      notifications.showSuccess('Variante duplicada exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al duplicar:', error)
    },
  })

  // Mutation: Toggle activo/inactivo
  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(`/api/products/${productId}/variants/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId.toString()] })
      notifications.showSuccess('Estado actualizado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al actualizar estado:', error)
    },
  })

  // Mutation: Marcar como default
  const setDefaultMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/products/${productId}/variants/set-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: variant.id }),
      })
      if (!res.ok) throw new Error('Error al marcar como predeterminada')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId.toString()] })
      notifications.showSuccess('Variante predeterminada actualizada')
    },
    onError: (error: any) => {
      console.error('Error al actualizar:', error)
    },
  })

  // Mutation: Eliminar variante
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/variants/${variant.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error al eliminar variante')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId.toString()] })
      notifications.showSuccess('Variante eliminada exitosamente')
      setIsDeleting(false)
    },
    onError: (error: any) => {
      console.error('Error al eliminar:', error)
      setIsDeleting(false)
    },
  })

  const handleDuplicate = () => {
    duplicateMutation.mutate()
  }

  const handleToggleActive = () => {
    toggleActiveMutation.mutate(!variant.is_active)
  }

  const handleSetDefault = () => {
    if (variant.is_default) {
      notifications.showInfo('Esta variante ya es la predeterminada')
      return
    }

    if (!variant.is_active) {
      notifications.showError('No se puede marcar una variante inactiva como predeterminada')
      return
    }

    if (confirm('¿Marcar como predeterminada? Se desmarcará la actual.')) {
      setDefaultMutation.mutate()
    }
  }

  const handleDelete = () => {
    if (confirm('¿Eliminar esta variante? Esta acción no se puede deshacer.')) {
      setIsDeleting(true)
      deleteMutation.mutate()
    }
  }

  return (
    <div className='flex items-center space-x-1'>
      {/* Duplicar */}
      <button
        type='button'
        onClick={handleDuplicate}
        disabled={duplicateMutation.isPending}
        className='inline-flex items-center p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50'
        title='Duplicar variante'
      >
        <Copy className='w-4 h-4' />
      </button>

      {/* Activar/Desactivar */}
      <button
        type='button'
        onClick={handleToggleActive}
        disabled={toggleActiveMutation.isPending}
        className={cn(
          'inline-flex items-center p-1.5 rounded transition-colors disabled:opacity-50',
          variant.is_active
            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        )}
        title={variant.is_active ? 'Desactivar variante' : 'Activar variante'}
      >
        {variant.is_active ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
      </button>

      {/* Marcar como default */}
      <button
        type='button'
        onClick={handleSetDefault}
        disabled={setDefaultMutation.isPending || variant.is_default}
        className={cn(
          'inline-flex items-center p-1.5 rounded transition-colors disabled:opacity-50',
          variant.is_default
            ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
        )}
        title={variant.is_default ? 'Ya es predeterminada' : 'Marcar como predeterminada'}
      >
        <Star className={cn('w-4 h-4', variant.is_default && 'fill-current')} />
      </button>

      {/* Editar */}
      <button
        type='button'
        onClick={() => onEdit(variant)}
        className='inline-flex items-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors'
        title='Editar variante'
      >
        <Edit className='w-4 h-4' />
      </button>

      {/* Eliminar */}
      <button
        type='button'
        onClick={handleDelete}
        disabled={isDeleting || deleteMutation.isPending}
        className='inline-flex items-center p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50'
        title='Eliminar variante'
      >
        <Trash2 className='w-4 h-4' />
      </button>
    </div>
  )
}

