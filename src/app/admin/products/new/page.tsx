'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { ProductFormMinimal } from '@/components/admin/products/ProductFormMinimal'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { toast } from 'react-hot-toast'
import { Save, X } from '@/lib/optimized-imports'

interface ProductFormData {
  name: string
  description?: string
  short_description?: string
  category_id: number // ✅ CORREGIDO: number (no string) - alineado con BD y schemas Zod
  status: 'active' | 'inactive' | 'draft'
  price: number
  compare_price?: number
  cost_price?: number
  track_inventory: boolean
  stock: number
  low_stock_threshold?: number
  allow_backorder: boolean
  seo_title?: string
  seo_description?: string
  slug?: string
  images?: Array<{
    url: string
    alt?: string
    is_primary?: boolean
  }>
  variants?: Array<{
    name: string
    options: string[]
  }>
}

// API function to create product (USANDO API SIMPLIFICADA)
async function createProduct(data: ProductFormData) {
  console.log('🚀 Creating product with data:', data)

  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  // ✅ IMPORTANTE: Verificar response.ok ANTES de leer el body
  if (!response.ok) {
    // Leer el body solo cuando hay error
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    const errorMessage = errorData.error || errorData.message || `Error ${response.status}: Error al crear producto`
    console.error('❌ Error creating product:', errorMessage, errorData)
    throw new Error(errorMessage)
  }

  // Leer el body solo cuando la respuesta es exitosa
  const result = await response.json()
  console.log('📝 API Response:', result)
  return result
}

export default function NewProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isFormDirty, setIsFormDirty] = useState(false)
  const submitFormRef = useRef<(() => void) | null>(null)

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: data => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })

      // Show success message
      toast.success('Producto creado exitosamente')

      // Redirect to product detail or list
      router.push(`/admin/products/${data.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = async (data: ProductFormData) => {
    await createProductMutation.mutateAsync(data)
  }

  const handleCancel = () => {
    router.push('/admin/products')
  }

  const isDirtyCheckRef = useRef<(() => boolean) | null>(null)

  const handleFormReady = (submitForm: () => void, isDirty: () => boolean) => {
    submitFormRef.current = submitForm
    isDirtyCheckRef.current = isDirty
    setIsFormDirty(isDirty())
  }

  // Actualizar isDirty periódicamente
  useEffect(() => {
    if (!isDirtyCheckRef.current) return

    const interval = setInterval(() => {
      if (isDirtyCheckRef.current) {
        setIsFormDirty(isDirtyCheckRef.current())
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const handleCreate = () => {
    if (submitFormRef.current) {
      submitFormRef.current()
    }
  }

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos', href: '/admin/products' },
    { label: 'Nuevo Producto' },
  ]

  const actions = (
    <>
      <button
        onClick={handleCancel}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap'
      >
        <X className='w-4 h-4' />
        <span>Cancelar</span>
      </button>
      <button
        onClick={handleCreate}
        disabled={createProductMutation.isPending || !isFormDirty}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <Save className='w-4 h-4' />
        <span>Crear</span>
      </button>
    </>
  )

  return (
    <AdminLayout breadcrumbs={breadcrumbs} actions={actions}>
      <AdminContentWrapper>
        <ProductFormMinimal
          mode='create'
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProductMutation.isPending}
          onFormReady={handleFormReady}
        />
      </AdminContentWrapper>
    </AdminLayout>
  )
}
