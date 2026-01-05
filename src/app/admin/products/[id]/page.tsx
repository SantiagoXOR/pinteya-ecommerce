'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import Image from 'next/image'
import {
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  BarChart3,
  Star,
  Calendar,
  Tag,
  AlertCircle,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  short_description?: string
  price: number
  compare_price?: number
  cost_price?: number
  stock: number
  category_id: number // ✅ CORREGIDO: number (no string) - alineado con BD y schemas Zod
  category_name?: string
  image_url?: string
  status: 'active' | 'inactive' | 'draft'
  track_inventory: boolean
  allow_backorder: boolean
  low_stock_threshold?: number
  seo_title?: string
  seo_description?: string
  slug?: string
  created_at: string
  updated_at: string
}

// API function to fetch product
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

// Status Badge Component
function StatusBadge({ status }: { status: Product['status'] }) {
  const statusConfig = {
    active: {
      label: 'Activo',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    inactive: {
      label: 'Inactivo',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    draft: {
      label: 'Borrador',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }

  const config = statusConfig[status] || {
    label: status || 'Desconocido',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
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
    staleTime: 0, // Siempre considerar los datos como obsoletos
    refetchOnMount: 'always', // Siempre refetch al montar
  })

  const handleEdit = () => {
    router.push(`/admin/products/${productId}/edit`)
  }

  const handleDelete = () => {
    // TODO: Implement delete confirmation modal
    console.log('Delete product:', productId)
  }

  const handleViewPublic = () => {
    // Usar slug si está disponible, sino usar ID
    const productSlug = product?.slug
    const productUrl = productSlug ? `/products/${productSlug}` : `/products/${productId}`
    window.open(productUrl, '_blank')
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
              El producto que buscas no existe o no tienes permisos para verlo.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos', href: '/admin/products' },
    { label: product.name },
  ]

  const actions = (
    <>
      <button
        onClick={handleViewPublic}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap'
      >
        <Eye className='w-4 h-4' />
        <span>Ver Público</span>
      </button>

      <button
        onClick={handleEdit}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap'
      >
        <Edit className='w-4 h-4' />
        <span>Editar</span>
      </button>

      <button
        onClick={handleDelete}
        className='inline-flex items-center justify-center gap-2 px-3 py-2 h-10 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap'
      >
        <Trash2 className='w-4 h-4' />
        <span>Eliminar</span>
      </button>
    </>
  )

  return (
    <AdminLayout
      title={product.name}
      breadcrumbs={breadcrumbs}
      actions={actions}
      className='pb-10'
    >
      <div className='space-y-5 sm:space-y-6'>
        {/* Header Info */}
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6'>
          <AdminCard className='p-4 sm:p-6'>
            <div className='text-center'>
              <DollarSign className='w-8 h-8 text-green-600 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                ${product.price.toLocaleString('es-AR')}
              </div>
              <div className='text-sm text-gray-600'>Precio de Venta</div>
              {product.compare_price && product.compare_price > product.price && (
                <div className='text-xs text-gray-500 line-through mt-1'>
                  ${product.compare_price.toLocaleString('es-AR')}
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className='p-4 sm:p-6'>
            <div className='text-center'>
              <Package className='w-8 h-8 text-blue-600 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>{product.stock}</div>
              <div className='text-sm text-gray-600'>Unidades en Stock</div>
              {product.stock <= (product.low_stock_threshold || 0) && (
                <div className='text-xs text-orange-700 font-medium mt-1'>Stock Bajo</div>
              )}
            </div>
          </AdminCard>

          <AdminCard className='p-4 sm:p-6'>
            <div className='text-center'>
              <BarChart3 className='w-8 h-8 text-purple-600 mx-auto mb-2' />
              <div className='text-2xl font-bold text-gray-900'>
                {product.cost_price
                  ? `${(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
              <div className='text-sm text-gray-600'>Margen de Ganancia</div>
            </div>
          </AdminCard>

          <AdminCard className='p-4 sm:p-6'>
            <div className='text-center'>
              <Tag className='w-8 h-8 text-orange-600 mx-auto mb-2' />
              <div className='text-lg font-bold text-gray-900 mb-2'>
                <StatusBadge status={product.status} />
              </div>
              <div className='text-sm text-gray-600'>Estado</div>
            </div>
          </AdminCard>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
          {/* Product Details */}
          <div className='xl:col-span-2 space-y-4 sm:space-y-6 order-2 xl:order-1'>
            <AdminCard title='Información del Producto' className='p-4 sm:p-6'>
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>{product.name}</h3>
                  {product.short_description && (
                    <p className='text-gray-600 mb-4'>{product.short_description}</p>
                  )}
                  {product.description && (
                    <div className='prose prose-sm max-w-none'>
                      <p className='text-gray-700'>{product.description}</p>
                    </div>
                  )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Categoría:</span>
                    <p className='text-sm text-gray-900'>
                      {product.category_name || 'Sin categoría'}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-500'>SKU:</span>
                    <p className='text-sm text-gray-900'>{product.id}</p>
                  </div>
                  {(product as any).brand && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Marca:</span>
                      <p className='text-sm text-gray-900'>{(product as any).brand}</p>
                    </div>
                  )}
                  {(product as any).medida && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Medida:</span>
                      <p className='text-sm text-gray-900'>{(product as any).medida}</p>
                    </div>
                  )}
                  {(product as any).color && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Color:</span>
                      <p className='text-sm text-gray-900'>{(product as any).color}</p>
                    </div>
                  )}
                  {(product as any).aikon_id && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Código Aikon:</span>
                      <p className='text-sm text-gray-900 font-mono'>{(product as any).aikon_id}</p>
                    </div>
                  )}
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Creado:</span>
                    <p className='text-sm text-gray-900'>
                      {new Date(product.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Actualizado:</span>
                    <p className='text-sm text-gray-900'>
                      {new Date(product.updated_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </AdminCard>

            {/* Pricing Details */}
            <AdminCard title='Detalles de Precios' className='p-4 sm:p-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                <div>
                  <span className='text-sm font-medium text-gray-500'>Precio de Venta</span>
                  <p className='text-lg font-bold text-gray-900'>
                    ${product.price.toLocaleString('es-AR')}
                  </p>
                </div>
                {(product as any).discounted_price && (
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Precio con Descuento</span>
                    <p className='text-lg font-bold text-green-600'>
                      ${Number((product as any).discounted_price).toLocaleString('es-AR')}
                    </p>
                    <p className='text-xs text-green-600 mt-1'>
                      {Math.round(((product.price - Number((product as any).discounted_price)) / product.price) * 100)}% OFF
                    </p>
                  </div>
                )}
                {product.compare_price && (
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Precio de Comparación</span>
                    <p className='text-lg font-bold text-gray-900'>
                      ${product.compare_price.toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
                {product.cost_price && (
                  <div>
                    <span className='text-sm font-medium text-gray-500'>Precio de Costo</span>
                    <p className='text-lg font-bold text-gray-900'>
                      ${product.cost_price.toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            </AdminCard>

            {/* Inventory Details */}
            <AdminCard title='Gestión de Inventario' className='p-4 sm:p-6'>
              <div className='space-y-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-sm font-medium text-gray-500'>Rastrear Inventario:</span>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      product.track_inventory
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {product.track_inventory ? 'Sí' : 'No'}
                  </span>
                </div>

                {product.track_inventory && (
                  <>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='text-sm font-medium text-gray-500'>Stock Actual:</span>
                      <span className='text-sm font-bold text-gray-900'>
                        {product.stock} unidades
                      </span>
                    </div>

                    {product.low_stock_threshold && (
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <span className='text-sm font-medium text-gray-500'>
                          Umbral Stock Bajo:
                        </span>
                        <span className='text-sm text-gray-900'>
                          {product.low_stock_threshold} unidades
                        </span>
                      </div>
                    )}

                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='text-sm font-medium text-gray-500'>
                        Permitir Pedidos Pendientes:
                      </span>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          product.allow_backorder
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {product.allow_backorder ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </AdminCard>
          </div>

          {/* Sidebar */}
          <div className='space-y-4 sm:space-y-6 order-1 xl:order-2'>
            {/* Product Image */}
            <AdminCard title='Imagen Principal' className='p-4 sm:p-6'>
              <div className='aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={300}
                    height={300}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Package className='w-16 h-16 text-gray-400' />
                  </div>
                )}
              </div>
            </AdminCard>

            {/* SEO Information */}
            {(product.seo_title || product.seo_description || product.slug) && (
              <AdminCard title='Información SEO' className='p-4 sm:p-6'>
                <div className='space-y-3'>
                  {product.seo_title && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Título SEO:</span>
                      <p className='text-sm text-gray-900'>{product.seo_title}</p>
                    </div>
                  )}

                  {product.seo_description && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>Descripción SEO:</span>
                      <p className='text-sm text-gray-900'>{product.seo_description}</p>
                    </div>
                  )}

                  {product.slug && (
                    <div>
                      <span className='text-sm font-medium text-gray-500'>URL:</span>
                      <p className='text-sm text-gray-900 break-all'>/productos/{product.slug}</p>
                    </div>
                  )}
                </div>
              </AdminCard>
            )}

            {/* Quick Actions */}
            <AdminCard title='Acciones Rápidas' className='p-4 sm:p-6'>
              <div className='space-y-3'>
                <button
                  onClick={handleEdit}
                  className='w-full flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 transition-colors'
                >
                  <Edit className='w-4 h-4' />
                  <span>Editar Producto</span>
                </button>

                <button
                  onClick={handleViewPublic}
                  className='w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <Eye className='w-4 h-4' />
                  <span>Ver en Tienda</span>
                </button>

                <button
                  onClick={handleDelete}
                  className='w-full flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                  <span>Eliminar Producto</span>
                </button>
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
