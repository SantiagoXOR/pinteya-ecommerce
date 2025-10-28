'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { ProductFormMinimal } from '@/components/admin/products/ProductFormMinimal'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { toast } from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  short_description?: string
  category_id: string
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
  const response = await fetch(`/api/admin/products/${productId}`)

  if (!response.ok) {
    throw new Error('Error fetching product')
  }

  const data = await response.json()
  return data.data
}

async function updateProduct(productId: string, data: ProductFormData) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar producto')
  }

  return response.json()
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = params.id as string

  // Fetch product data
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => updateProduct(productId, data),
    onSuccess: data => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })

      // Show success message
      toast.success('Producto actualizado exitosamente')

      // Redirect to product detail
      router.push(`/admin/products/${productId}`)
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

  return (
    <AdminLayout title={`Editar: ${product.name}`} breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <ProductFormMinimal
          mode='edit'
          productId={productId}
          initialData={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateProductMutation.isPending}
        />
      </AdminContentWrapper>
    </AdminLayout>
  )
}
