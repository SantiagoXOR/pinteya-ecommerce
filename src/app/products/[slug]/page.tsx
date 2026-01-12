'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ShopDetailModal from '@/components/ShopDetails/ShopDetailModal'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getProductBySlug, getProductById } from '@/lib/api/products'
import { getProductImage, getValidImageUrl } from '@/lib/utils/image-helpers'
import { SimplePageLoading } from '@/components/ui/simple-page-loading'
import { trackProductView } from '@/lib/google-analytics'
import { trackViewContent } from '@/lib/meta-pixel'

// Mapea el producto de API al formato m├¡nimo que consume el modal
function mapToModalProduct(apiProduct: any) {
  if (!apiProduct) return null

  // ID
  const idCandidate = (apiProduct as any)?.id
  const id = typeof idCandidate === 'number' ? idCandidate : Number(idCandidate)

  // Precio original (considerar variante por defecto si existe)
  const originalCandidate =
    (apiProduct as any)?.price ??
    (apiProduct as any)?.default_variant?.price_list
  const originalNum =
    typeof originalCandidate === 'number'
      ? originalCandidate
      : Number(String(originalCandidate))

  // Precio con descuento expl├¡cito si est├í disponible
  const discountedCandidate =
    (apiProduct as any)?.discounted_price ??
    (apiProduct as any)?.default_variant?.price_sale
  const discountedNum =
    typeof discountedCandidate === 'number'
      ? discountedCandidate
      : discountedCandidate !== undefined
      ? Number(String(discountedCandidate))
      : undefined

  // Stock (tomar de variante por defecto si aplica)
  const stockCandidate = (apiProduct as any)?.default_variant?.stock ?? (apiProduct as any)?.stock ?? 0
  const stockNum = typeof stockCandidate === 'number' ? stockCandidate : Number(String(stockCandidate))

  // ✅ NUEVO: Usar la misma lógica que ShopDetailModal para obtener imagen
  const sanitize = (u?: string) => (typeof u === 'string' ? u.replace(/[`"]/g, '').trim() : '')
  const urlFrom = (c: any) => {
    if (!c) return ''
    if (typeof c === 'string') return sanitize(c)
    return sanitize(c?.url || c?.image_url)
  }
  
  let mainImage = '/images/products/placeholder.svg'
  
  // ✅ CORREGIDO: Prioridad 1 - image_url desde product_images (API) - VERIFICAR EXPLÍCITAMENTE
  const apiImageUrl = (apiProduct as any)?.image_url
  if (apiImageUrl && typeof apiImageUrl === 'string' && apiImageUrl.trim() !== '') {
    const sanitized = sanitize(apiImageUrl)
    const validated = getValidImageUrl(sanitized)
    if (validated && !validated.includes('placeholder') && validated !== '/images/products/placeholder.svg') {
      mainImage = validated
      console.debug('[mapToModalProduct] ✅ Usando image_url desde API:', mainImage)
    }
  }
  
  // Prioridad 2: Imagen de variante por defecto
  if (mainImage === '/images/products/placeholder.svg' && (apiProduct as any)?.default_variant?.image_url) {
    const variantImage = sanitize((apiProduct as any).default_variant.image_url)
    const validated = getValidImageUrl(variantImage)
    if (validated && !validated.includes('placeholder') && validated !== '/images/products/placeholder.svg') {
      mainImage = validated
      console.debug('[mapToModalProduct] ✅ Usando image_url de variante:', mainImage)
    }
  }
  
  // Prioridad 3: Parsear desde images JSONB
  if (mainImage === '/images/products/placeholder.svg') {
    const candidates: any[] = [
      getProductImage((apiProduct as any)?.images),
      (apiProduct as any)?.image,
    ]
    for (const c of candidates) {
      const candidate = urlFrom(c)
      const validated = getValidImageUrl(candidate)
      if (validated && !validated.includes('placeholder') && validated !== '/images/products/placeholder.svg') {
        mainImage = validated
        console.debug('[mapToModalProduct] ✅ Usando imagen desde images JSONB:', mainImage)
        break
      }
    }
  }
  
  console.debug('[mapToModalProduct] 🔍 Diagnóstico completo de imagen:', {
    mainImage,
    image_url: (apiProduct as any)?.image_url,
    image_url_type: typeof (apiProduct as any)?.image_url,
    image_url_trimmed: (apiProduct as any)?.image_url?.trim?.(),
    default_variant_image_url: (apiProduct as any)?.default_variant?.image_url,
    has_images: !!(apiProduct as any)?.images,
    images_value: (apiProduct as any)?.images
  })

  // ✅ CRÍTICO: Asegurar que image_url esté presente y sea válido
  const finalImageUrl = (apiProduct as any)?.image_url || null
  const finalImage = mainImage !== '/images/products/placeholder.svg' 
    ? mainImage 
    : (finalImageUrl && getValidImageUrl(finalImageUrl) !== '/images/products/placeholder.svg')
      ? getValidImageUrl(finalImageUrl)
      : mainImage
  
  console.debug('[mapToModalProduct] 🎯 Imagen final seleccionada:', {
    finalImage,
    finalImageUrl,
    mainImage,
    apiProduct_image_url: (apiProduct as any)?.image_url
  })

  return {
    id,
    name: (apiProduct as any)?.name || 'Producto',
    price: Number.isFinite(originalNum) ? originalNum : 0,
    originalPrice: discountedNum ? originalNum : undefined,
    discounted_price: discountedNum,
    image: finalImage, // ✅ Usar imagen final calculada
    // ✅ CRÍTICO: Incluir image_url explícitamente - el modal lo necesita
    image_url: finalImageUrl,
    brand: (apiProduct as any)?.brand || 'Producto',
    stock: Number.isFinite(stockNum) ? stockNum : 0,
    description: (apiProduct as any)?.description || '',
    slug: (apiProduct as any)?.slug,
    // Incluir variantes si est├ín disponibles para que el modal las use
    variants: (apiProduct as any)?.variants || [],
    has_variants: (apiProduct as any)?.has_variants || false,
    default_variant: (apiProduct as any)?.default_variant || null,
    // Incluir category para que el modal pueda usar categoryId en productos sugeridos
    category: (apiProduct as any)?.category || null,
    // ✅ NUEVO: Incluir images para compatibilidad con getMainImage
    images: (apiProduct as any)?.images || null,
  }
}

export default function ProductDetailPage() {
  const router = useRouter()
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const { addProduct } = useCartUnified()
  const routeParams = useParams() as { slug?: string }
  const productParam = routeParams?.slug ?? ''

  // Forzar scroll al top cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!productParam || productParam.trim() === '') {
      setLoading(false)
      return
    }

    setLoading(true)
    // AbortController para cancelar request si el componente se desmonta
    const abortController = new AbortController()
    
    ;(async () => {
      try {
        // Detectar si el par├ímetro es un ID num├⌐rico o un slug
        const idNum = Number(productParam)
        const isNumericId = !isNaN(idNum) && idNum > 0 && productParam === String(idNum)
        
        // Usar la funci├│n apropiada seg├║n el tipo de par├ímetro
        const apiProduct = isNumericId 
          ? await getProductById(idNum)
          : await getProductBySlug(productParam)
        
        // Verificar si el componente a├║n est├í montado
        if (abortController.signal.aborted) return
        
        console.debug('[products/[slug]] Producto API (raw):', apiProduct)
        const apiData =
          apiProduct && typeof apiProduct === 'object' && 'data' in (apiProduct as any)
            ? (apiProduct as any).data
            : apiProduct
        console.debug('[products/[slug]] Producto API (desempaquetado):', apiData)
        // ✅ DEBUG: Verificar image_url
        console.debug('[products/[slug]] image_url desde API:', {
          image_url: apiData?.image_url,
          default_variant_image_url: apiData?.default_variant?.image_url,
          has_variants: apiData?.has_variants,
          variant_count: apiData?.variant_count
        })
        
        // ≡ƒöä REDIRECCI├ôN 301: Si se accedi├│ por ID y el producto tiene slug, redirigir a la ruta con slug
        if (isNumericId && apiData?.slug) {
          const newUrl = `/products/${apiData.slug}`
          console.debug('[products/[slug]] Redirigiendo de ID a slug:', newUrl)
          if (!abortController.signal.aborted) {
            router.replace(newUrl)
            return
          }
        }
        
        const mapped = mapToModalProduct(apiData)
        // ✅ DEBUG: Verificar imagen mapeada
        console.debug('[products/[slug]] Imagen mapeada:', {
          image: mapped?.image,
          image_url_original: apiData?.image_url
        })
        if (!mapped) {
          console.warn('[products/[slug]] Producto vac├¡o o sin datos. Verifica respuesta del API.')
        }
        console.debug('[products/[slug]] Producto mapeado para modal:', mapped)
        
        // Verificar nuevamente antes de actualizar estado
        if (!abortController.signal.aborted) {
          setProduct(mapped)
        }

        // ≡ƒôè ANALYTICS: Track product view
        if (mapped && mapped.id && mapped.name && !abortController.signal.aborted) {
          try {
            const price = mapped.discounted_price || mapped.price || 0
            const category = apiData?.category?.name || apiData?.category || 'Sin categor├¡a'
            const productName = mapped.name || 'Producto'
            const productSlugForUrl = mapped.slug || apiData?.slug || productParam
            const productUrl = typeof window !== 'undefined' && productSlugForUrl 
              ? `${window.location.origin}/products/${productSlugForUrl}` 
              : undefined

            // Google Analytics
            trackProductView(
              String(mapped.id),
              productName,
              category,
              price,
              'ARS'
            )

            // Meta Pixel con URL completa para mejor remarketing
            trackViewContent(
              productName,
              category,
              [String(mapped.id)],
              price,
              'ARS',
              productUrl
            )

            console.debug('[Analytics] Product view tracked:', {
              id: mapped.id,
              name: productName,
              category,
              price,
              url: productUrl,
            })
          } catch (analyticsError) {
            console.warn('[Analytics] Error tracking product view:', analyticsError)
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error cargando producto', error)
          // Si el producto no se encuentra, redirigir a 404 o p├ígina de error
          // router.push('/404')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    })()

    // Cleanup: cancelar request si el componente se desmonta
    return () => {
      abortController.abort()
    }
  }, [productParam, router])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Al cerrar el modal, regresar a la ruta anterior sin redirigir a /products
      router.back()
    }
  }, [router])

  const handleAddToCart = useCallback((productData: any, variants: any) => {
    // Usar el hook unificado para normalizar y agregar al carrito
    const images: string[] = Array.isArray(productData?.images)
      ? productData.images
      : productData?.image
      ? [productData.image]
      : []

    const cover = images[0] || '/images/products/placeholder.svg'
    const quantityFromModal = Number(variants?.quantity) || 1

    const attributes = {
      color: variants?.selectedColor ?? variants?.color ?? variants?.colorName,
      medida:
        variants?.selectedCapacity ?? variants?.capacity ?? variants?.size ?? variants?.SelectedSize,
      finish: variants?.finish, // Agregar finish para impregnantes Danzke
    }

    addProduct(productData, {
      quantity: quantityFromModal,
      attributes,
      image: cover,
    })
  }, [addProduct])

  // Render con spinner minimalista mientras carga y como fondo del modal
  return (
    <div>
      {/* Spinner simple mientras carga */}
      {!product && <SimplePageLoading message="Cargando producto..." />}
      
      {/* Cuando el producto est├⌐ cargado, mostrar spinner de fondo + modal */}
      {product && (
        <>
          {/* Spinner simple como fondo para mantener el layout */}
          <div className="pointer-events-none" aria-hidden="true">
            <SimplePageLoading message="Cargando producto..." />
          </div>
          
          {/* Modal sobre el fondo */}
          <ShopDetailModal
            product={product}
            open={open}
            onOpenChange={handleOpenChange}
            onAddToCart={handleAddToCart}
          />
        </>
      )}
    </div>
  )
}

