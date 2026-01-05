/**
 * Hook para manejar la carga de variantes del producto
 * Extrae lógica de carga desde props o API, incluyendo fix para SINTETICO CONVERLUX
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ProductVariant, getProductVariants, findVariantByCapacity } from '@/lib/api/product-variants'
import { ProductWithCategory } from '@/types/api'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/error-handling/centralized-error-handler'

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  stock: number
  description?: string
  colors?: any[]
  capacities?: string[]
  slug?: string
}

interface UseProductVariantsOptions {
  product: Product | null
  open: boolean
  fullProductData: ProductWithCategory | null
  hasInitialized: React.MutableRefObject<boolean>
  selectedCapacity: string
  setVariants: (variants: ProductVariant[]) => void
  setSelectedVariant: (variant: ProductVariant | null) => void
  setSelectedFinish: (finish: string) => void
}

/**
 * Hook para cargar variantes del producto
 */
export const useProductVariants = ({
  product,
  open,
  fullProductData,
  hasInitialized,
  selectedCapacity,
  setVariants,
  setSelectedVariant,
  setSelectedFinish,
}: UseProductVariantsOptions) => {
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Función para cargar variantes desde API
  const loadVariants = useCallback(async () => {
    if (!product) return
    
    setLoadingVariants(true)
    try {
      // Validar ID numérico antes de consultar API
      let productIdNum = typeof product.id === 'number' ? product.id : Number(product.id)
      
      // FIX ESPECÍFICO: Si es SINTETICO CONVERLUX y el ID es 38, usar el ID 34 que tiene las variantes
      console.log('🔍 DEBUG: Producto cargando variantes:', {
        name: product.name,
        id: productIdNum,
        isSinteticoConverlux: product.name?.toLowerCase().includes('sintético converlux')
      })
      
      if (product.name?.toLowerCase().includes('sintético converlux') && productIdNum === 38) {
        console.log('🔧 FIX: Cambiando ID de 38 a 34 para SINTETICO CONVERLUX')
        productIdNum = 34
      }
      
      console.log('🔍 DEBUG: ID final para cargar variantes:', productIdNum)
      
      if (!Number.isFinite(productIdNum) || productIdNum <= 0) {
        console.warn('⚠️ ID de producto inválido al cargar variantes:', product?.id)
        setVariants([])
        return
      }

      // Detectar si debemos unir variantes entre productos hermanos por mismo finish
      const slugText = ((fullProductData as any)?.slug || (fullProductData as any)?.variant_slug || '') as string
      const nameText = (fullProductData?.name || product?.name || '') as string
      const isImpregnante = /impregnante/i.test(nameText)
      const danzkeFamily = /impregnante-danzke/i.test(slugText) || /danzke/i.test(nameText)

      // Extraer acabado desde slug (brillante|satinado)
      let finishFromSlug: string | null = null
      if (slugText) {
        if (/-brillant[e-]?/i.test(slugText) || /-brillo-/i.test(slugText)) finishFromSlug = 'Brillante'
        else if (/-satinad[oa]-/i.test(slugText)) finishFromSlug = 'Satinado'
      }

      // Si es impregnate Danzke y tenemos finish, buscar productos hermanos con el mismo finish
      let aggregatedVariants: ProductVariant[] = []
      if (isImpregnante && danzkeFamily && finishFromSlug) {
        try {
          const baseLike = `%-${finishFromSlug.toLowerCase()}-petrilac`
          // Traer todos los productos hermanos con el mismo finish
          const { data: siblingProducts } = await supabase
            .from('products')
            .select('id, slug, name, price, discounted_price, medida, is_active')
            .ilike('slug', `impregnante-danzke-%${baseLike}`)
            .eq('is_active', true)

          const siblingIds = (siblingProducts || []).map((p: any) => p.id)

          if (siblingIds.length > 0) {
            const { data: siblingVariants } = await supabase
              .from('product_variants')
              .select('id, product_id, aikon_id, variant_slug, color_name, color_hex, measure, finish, price_list, price_sale, stock, is_active, is_default, image_url')
              .in('product_id', siblingIds)
              .eq('is_active', true)

            aggregatedVariants = (siblingVariants || []) as unknown as ProductVariant[]

            // Variantes sintéticas para productos sin filas en variants
            const productsWithoutVariants = (siblingProducts || []).filter((p: any) =>
              !(siblingVariants || []).some((v: any) => v.product_id === p.id)
            )
            for (const p of productsWithoutVariants) {
              const measure = (p.medida || '').toString().trim()
              if (measure) {
                aggregatedVariants.push({
                  id: `synthetic-${p.id}` as any,
                  measure,
                  finish: finishFromSlug,
                  price_list: Number(p.price) || undefined,
                  price_sale: Number(p.discounted_price) || undefined,
                  stock: undefined,
                  is_active: true,
                  is_default: false,
                })
              }
            }

            // CRÍTICO: Mapear precios correctos por capacidad+finish desde productos hermanos
            // Esto evita que se muestren precios incorrectos al cambiar capacidad
            const priceMap = new Map<string, { price_list: number, price_sale: number }>()
            for (const p of siblingProducts || []) {
              const measure = (p.medida || '').toString().trim()
              if (measure) {
                priceMap.set(measure, {
                  price_list: Number(p.price) || 0,
                  price_sale: Number(p.discounted_price) || Number(p.price) || 0
                })
              }
            }

            // Actualizar precios de variantes existentes con los correctos
            aggregatedVariants = aggregatedVariants.map(v => {
              const correctPrices = priceMap.get(v.measure || '')
              if (correctPrices) {
                return {
                  ...v,
                  price_list: correctPrices.price_list,
                  price_sale: correctPrices.price_sale
                }
              }
              return v
            })
          }
        } catch (e) {
          console.warn('⚠️ No se pudieron cargar variantes hermanas por finish:', e)
        }
      }

      let variantsData: ProductVariant[] = []
      if (aggregatedVariants.length > 0) {
        variantsData = aggregatedVariants
      } else {
        const productVariantsRes = await getProductVariants(productIdNum)
        variantsData = (productVariantsRes && (productVariantsRes as any).data)
          ? (productVariantsRes as any).data
          : []
      }
      // ✅ CORREGIDO: Asegurar que variantsData sea siempre un array
      setVariants(Array.isArray(variantsData) ? variantsData : [])
      
      // Inicializar selectedVariant con la variante default (solo una vez)
      if (variantsData.length > 0 && !hasInitialized.current) {
        const defaultVariant = variantsData.find(v => v.is_default) || variantsData[0]
        setSelectedVariant(defaultVariant)
        
        // Inicializar selectedFinish desde variante default
        if (defaultVariant?.finish) {
          setSelectedFinish(defaultVariant.finish)
        }
        
        hasInitialized.current = true
        
        console.debug('🎯 Variante default inicializada:', {
          id: defaultVariant.id,
          measure: defaultVariant.measure,
          color_name: defaultVariant.color_name,
          finish: defaultVariant.finish,
          stock: defaultVariant.stock,
        })
      }
      
      // Log detallado de medidas y stock por variante para depurar
      try {
        // ✅ CORREGIDO: Asegurar que variantsData sea un array antes de usar .map()
        const safeVariantsData = Array.isArray(variantsData) ? variantsData : []
        console.debug('📦 ShopDetailModal: Variants overview (measure, stock, price, color_name)', safeVariantsData.map(v => ({
          id: v.id,
          measure: v.measure,
          color_name: v.color_name,
          finish: v.finish,
          stock: v.stock,
          price_list: v.price_list,
          price_sale: v.price_sale,
        })))
      } catch {}
      // Si ya hay una capacidad seleccionada, enlazar inmediatamente la variante correcta
      if (selectedCapacity && variantsData.length > 0) {
        const v = findVariantByCapacity(variantsData, selectedCapacity)
        setSelectedVariant(v || null)
        if (v) {
          console.debug('🧩 Variante enlazada tras carga:', {
            id: v.id,
            measure: v.measure,
            stock: v.stock,
          })
        }
      }
      console.debug('🧪 ShopDetailModal: Variantes cargadas', {
        productId: productIdNum,
        count: variantsData.length,
        sample: variantsData[0],
      })
    } catch (error) {
      logError('❌ Error cargando variantes:', error)
      setVariants([])
    } finally {
      setLoadingVariants(false)
    }
  }, [product, fullProductData, hasInitialized, selectedCapacity, setVariants, setSelectedVariant, setSelectedFinish])

  // Cargar variantes cuando se abre el modal
  useEffect(() => {
    console.log('🔄 ShopDetailModal useEffect[2]: open =', open, 'product =', product?.name)
    if (open && product) {
      console.log('🔄 ShopDetailModal useEffect[2]: Cargando variantes y productos relacionados')
      
      // PRIORIDAD 1: Usar variantes pasadas explícitamente via prop
      const productVariants = (product as any)?.variants
      if (productVariants && Array.isArray(productVariants) && productVariants.length > 0) {
        console.log('✅ ShopDetailModal: Usando variantes pasadas via prop:', productVariants.length)
        // ✅ CORREGIDO: Asegurar que productVariants sea siempre un array
        const safeProductVariants = Array.isArray(productVariants) ? productVariants : []
        console.log('🎨 Colores en variantes:', safeProductVariants.map((v: any) => v.color_name).filter(Boolean))
        setVariants(safeProductVariants)
        
        // Inicializar selectedVariant con la variante default (solo una vez)
        if (!hasInitialized.current) {
          const defaultVariant = safeProductVariants.find((v: any) => v.is_default) || safeProductVariants[0]
          setSelectedVariant(defaultVariant)
          
          // Inicializar selectedFinish desde variante default
          if (defaultVariant?.finish) {
            setSelectedFinish(defaultVariant.finish)
          }
          
          hasInitialized.current = true
          
          console.debug('🎯 Variante default inicializada (from props):', {
            id: defaultVariant?.id,
            measure: defaultVariant?.measure,
            color_name: defaultVariant?.color_name,
            finish: defaultVariant?.finish,
          })
        }
        // No cargar desde API si ya tenemos variantes
      } else {
        console.log('⚠️ ShopDetailModal: No hay variantes en product, cargando desde API')
        loadVariants()
      }
    }
  }, [open, product, loadVariants, hasInitialized, setVariants, setSelectedVariant, setSelectedFinish])

  return {
    loadingVariants,
    loadVariants,
  }
}

