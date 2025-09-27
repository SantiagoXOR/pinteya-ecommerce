'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { ProductForm } from '@/components/admin/products/ProductForm'
import { toast } from 'react-hot-toast'

interface ProductFormData {
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

  const result = await response.json()
  console.log('📝 API Response:', result)

  if (!response.ok) {
    throw new Error(result.error || 'Error al crear producto')
  }

  return response.json()
}

export default function NewProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

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

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos', href: '/admin/products' },
    { label: 'Nuevo Producto' },
  ]

  return (
    <AdminLayout title='Crear Nuevo Producto' breadcrumbs={breadcrumbs}>
      <ProductForm
        mode='create'
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createProductMutation.isPending}
      />
    </AdminLayout>
  )
}
