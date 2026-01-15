'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { ProductFormMinimal } from '@/components/admin/products/ProductFormMinimal'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { toast } from 'react-hot-toast'
import { AlertCircle, Save, X } from '@/lib/optimized-imports'

interface Product {
  id: string
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

interface ProductFormData extends Omit<Product, 'id'> {}

// API functions
async function fetchProduct(productId: string): Promise<Product> {
  // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
  const response = await fetch(`/api/admin/products/${productId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    // ✅ CORREGIDO: Obtener el mensaje de error del servidor
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `Error ${response.status}: Error al cargar producto`)
  }

  const data = await response.json()
  return data.data
}

async function updateProduct(productId: string, data: ProductFormData) {
  console.log('📤 Enviando actualización:', { productId, data })
  
  // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar producto')
  }

  const result = await response.json()
  console.log('📥 Respuesta recibida:', result)
  return result
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = params.id as string
  const [isFormDirty, setIsFormDirty] = useState(false)
  const submitFormRef = useRef<(() => void) | null>(null)
  const isDirtyCheckRef = useRef<(() => boolean) | null>(null)

  // Fetch product data
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
    staleTime: 0, // Siempre considerar los datos como obsoletos
    refetchOnMount: 'always', // Siempre refetch al montar
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => updateProduct(productId, data),
    onSuccess: async (data) => {
      console.log('✅ Actualización exitosa, datos recibidos:', data)
      
      // ✅ CORREGIDO: Invalidar todas las queries relevantes incluyendo stats
      await queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
      await queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })
      await queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      await queryClient.invalidateQueries({ queryKey: ['admin-products-stats'] })
      
      // Refetch inmediato para asegurar datos frescos
      await queryClient.refetchQueries({ queryKey: ['admin-product', productId] })
      await queryClient.refetchQueries({ queryKey: ['product-variants', productId] })
      await queryClient.refetchQueries({ queryKey: ['admin-products-stats'] })

      // Show success message
      toast.success('Producto actualizado exitosamente')

      // Pequeño delay antes de redirigir para asegurar que los datos se carguen
      setTimeout(() => {
        router.push(`/admin/products/${productId}`)
      }, 100)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = async (data: ProductFormData) => {
    await updateProductMutation.mutateAsync(data)
  }

  const handleCancel = () => {
    router.push(`/admin/products/${productId}`)
  }

  const handleFormReady = (submitForm: () => void, isDirty: () => boolean) => {
    submitFormRef.current = submitForm
    isDirtyCheckRef.current = isDirty
    setIsFormDirty(isDirty())
  }

  // Actualizar isDirty periódicamente y también cuando cambien los datos del producto
  useEffect(() => {
    if (!isDirtyCheckRef.current) return

    // Actualizar inmediatamente cuando se cargan los datos del producto
    setIsFormDirty(isDirtyCheckRef.current())

    const interval = setInterval(() => {
      if (isDirtyCheckRef.current) {
        setIsFormDirty(isDirtyCheckRef.current())
      }
    }, 200) // ✅ Reducido a 200ms para mayor responsividad

    return () => clearInterval(interval)
  }, [product]) // ✅ Agregar product como dependencia para actualizar cuando se cargan los datos

  const handleSave = () => {
    if (submitFormRef.current) {
      submitFormRef.current()
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title='Cargando...'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600'></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !product) {
    return (
      <AdminLayout title='Error'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Producto no encontrado</h3>
            <p className='text-gray-600'>
              El producto que intentas editar no existe o no tienes permisos para modificarlo.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos', href: '/admin/products' },
    { label: product.name, href: `/admin/products/${productId}` },
    { label: 'Editar' },
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
        onClick={handleSave}
        disabled={updateProductMutation.isPending || isLoading}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <Save className='w-4 h-4' />
        <span>Guardar</span>
      </button>
    </>
  )

  return (
    <AdminLayout breadcrumbs={breadcrumbs} actions={actions}>
      <AdminContentWrapper>
        <ProductFormMinimal
          mode='edit'
          productId={productId}
          initialData={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateProductMutation.isPending}
          onFormReady={handleFormReady}
        />
      </AdminContentWrapper>
    </AdminLayout>
  )
}
