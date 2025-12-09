'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/core/utils'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { Heart, Eye, Star, ShoppingCart, AlertCircle } from '@/lib/optimized-imports'
import { ShopDetailModal } from '@/components/ShopDetails/ShopDetailModal'
import { useCartUnified } from '@/hooks/useCartUnified'
import { trackAddToCart as trackGA4AddToCart } from '@/lib/google-analytics'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { useAnalytics } from '@/components/Analytics/SimpleAnalyticsProvider'
import { 
  extractProductCapacity, 
  formatProductBadges, 
  type ProductBadgeInfo, 
  type ExtractedProductInfo, 
  detectProductType 
} from '@/utils/product-utils'
import { findVariantByCapacity } from '@/lib/api/product-variants'
import { PAINT_COLORS, type ColorOption } from '@/components/ui/advanced-color-picker'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ChevronRight } from '@/lib/optimized-imports'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'
import { toast } from 'react-hot-toast'

// Verificar que Framer Motion esté disponible
const isFramerMotionAvailable = false // Deshabilitado para usar fallbacks CSS

// Componentes fallback para cuando Framer Motion no esté disponible
const MotionDiv = 'div'
const MotionButton = 'button'

// Interfaces para variantes de productos
export interface ProductVariant {
  id?: string | number
  measure?: string
  color_name?: string
  color_hex?: string
  finish?: string
  price_list?: number
  price_sale?: number
  stock?: number
  is_active?: boolean
  is_default?: boolean
  image_url?: string
}

// Configuración de badges inteligentes
export interface BadgeConfig {
  showCapacity?: boolean
  showColor?: boolean
  showFinish?: boolean
  showMaterial?: boolean
  showGrit?: boolean
  showDimensions?: boolean
  showWeight?: boolean
  showBrand?: boolean
  maxBadges?: number
}

export interface CommercialProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string
  title?: string
  slug?: string
  brand?: string
  price?: number
  originalPrice?: number
  discount?: string
  isNew?: boolean
  cta?: string
  stock?: number
  productId?: number | string
  onAddToCart?: () => void
  showCartAnimation?: boolean
  
  // Información de cuotas
  installments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  
  // Información de envío
  freeShipping?: boolean
  shippingText?: string
  deliveryLocation?: string
  
  // Nuevas props para sistema de badges inteligente
  variants?: ProductVariant[]
  description?: string
  badgeConfig?: BadgeConfig
  
  // Nuevas props para datos estructurados de la base de datos
  features?: Record<string, any>
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  // Campos directos de la base de datos
  color?: string
  medida?: string
}

const CommercialProductCard = React.forwardRef<HTMLDivElement, CommercialProductCardProps>(
  (
    {
      className,
      image,
      title,
      slug,
      brand,
      price,
      originalPrice,
      discount,
      isNew = false,
      cta = 'Agregar al carrito',
      stock = 0,
      productId,
      onAddToCart,
      showCartAnimation = true,
      installments,
      freeShipping = false,
      shippingText,
      deliveryLocation,
      variants,
      description,
      badgeConfig = {
        showCapacity: true,
        showColor: true,
        showFinish: true,
        // Priorizamos acabado y color sobre otros datos para los badges del grid
        showMaterial: false,
        showGrit: false,
        showDimensions: false,
        showWeight: false,
        showBrand: false,
        maxBadges: 4
      },
      features,
      specifications,
      dimensions,
      weight,
      children,
      color,
      medida,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [isAddingToCart, setIsAddingToCart] = React.useState(false)
    const [isWishlisted, setIsWishlisted] = React.useState(false)
    const [showQuickActions, setShowQuickActions] = React.useState(false)
    const [showShopDetailModal, setShowShopDetailModal] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)
    const [currentImageSrc, setCurrentImageSrc] = React.useState(image || '/images/products/placeholder.svg')
    const [selectedColor, setSelectedColor] = React.useState<string | undefined>(undefined)
    const [selectedQuantity, setSelectedQuantity] = React.useState<number>(1)
    const [selectedMeasure, setSelectedMeasure] = React.useState<string | undefined>(undefined)
    const [cartAddCount, setCartAddCount] = React.useState<number>(0)
    const [showColorsSheet, setShowColorsSheet] = React.useState(false)
    const [showSuccessToast, setShowSuccessToast] = React.useState(false)
    // Ref para ignorar clics justo después de cerrar el modal (evita re-apertura por burbujeo)
    const ignoreClicksUntilRef = React.useRef<number>(0)
    // Unificado: usamos el hook central para agregar productos
    const { addProduct } = useCartUnified()
    const router = useRouter()
    const cartItems = useAppSelector(selectCartItems) // Obtener items del carrito
    const { trackCartAction } = useAnalytics() // Analytics propio

    // Obtener cantidad actual del producto en el carrito
    const currentCartQuantity = React.useMemo(() => {
      if (!productId) return 0
      const item = cartItems.find(item => String(item.id) === String(productId))
      return item?.quantity || 0
    }, [cartItems, productId])

    // Handler para el modal - DEBE estar en el nivel superior del componente
    const handleModalOpenChange = React.useCallback((open: boolean) => {
      console.log('🔄 [CommercialProductCard] onOpenChange llamado:', { 
        open, 
        currentState: showShopDetailModal,
        productTitle: title 
      })
      
      console.log('📝 [CommercialProductCard] Estado va a cambiar de', showShopDetailModal, 'a', open)
      
      // Forzar actualización del estado usando función callback
      setShowShopDetailModal(prevState => {
        console.log('🔧 [CommercialProductCard] Estado anterior:', prevState, ', nuevo:', open)
        return open
      })
      
      // Si el modal se está cerrando, ignorar clics en el card por un breve período
      if (!open) {
        ignoreClicksUntilRef.current = Date.now() + 300 // 300ms de ventana anti-click fantasma
        console.log('🛡️ [CommercialProductCard] Activando guardia anti-click fantasma hasta:', ignoreClicksUntilRef.current)
        // No forzar redirección al cerrar; mantener la ubicación actual
      }

      console.log('✅ [CommercialProductCard] setShowShopDetailModal llamado con:', open)
    }, [showShopDetailModal, title, router])

    // ============================================================================
    // SISTEMA DE BADGES INTELIGENTE
    // ============================================================================
    
    // Extraer información del producto para badges inteligentes
    const extractedInfo = React.useMemo(() => {
      if (!title) return {}
      
      // Crear objeto con datos estructurados de la base de datos
      const databaseData = {
        features,
        specifications,
        dimensions,
        weight,
        brand,
        // ✅ NO incluir color/medida legacy - usar solo variantes
        // color: color,
        // medida: medida
      }
      
      const result = extractProductCapacity(title, variants, description, databaseData, slug)
      
      return result
    }, [title, slug, variants, description, features, specifications, dimensions, weight, brand, color, medida])

    // Utilidad simple para oscurecer colores HEX (para texturas)
    const darkenHex = React.useCallback((hex: string, amount = 0.2) => {
      try {
        const h = hex.replace('#', '')
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
        const r = Math.max(0, Math.min(255, ((bigint >> 16) & 255) * (1 - amount)))
        const g = Math.max(0, Math.min(255, ((bigint >> 8) & 255) * (1 - amount)))
        const b = Math.max(0, Math.min(255, (bigint & 255) * (1 - amount)))
        return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`
      } catch {
        return hex
      }
    }, [])

    // Helper para convertir nombres de colores a códigos hexadecimales
    const getColorHexFromName = React.useCallback((colorName: string): string => {
      const colorMap: Record<string, string> = {
        // Colores básicos (blanco con tono gris sutil para diferenciarlo del fondo)
        'blanco': '#F5F5F5',
        'white': '#F5F5F5',
        'negro': '#000000',
        'black': '#000000',
        'rojo': '#DC2626',
        'red': '#DC2626',
        'azul': '#2563EB',
        'blue': '#2563EB',
        'verde': '#16A34A',
        'green': '#16A34A',
        'amarillo': '#EAB308',
        'yellow': '#EAB308',
        'naranja': '#EA580C',
        'orange': '#EA580C',
        'gris': '#9CA3AF',
        'gray': '#9CA3AF',
        'grey': '#9CA3AF',
        'marron': '#92400E',
        'marrón': '#92400E',
        'brown': '#92400E',
        'rosa': '#EC4899',
        'pink': '#EC4899',
        'violeta': '#9333EA',
        'purple': '#9333EA',
        'celeste': '#38BDF8',
        'cyan': '#06B6D4',
        'turquesa': '#14B8A6',
        'teal': '#14B8A6',
        'beige': '#D4C5B9',
        'crema': '#FEF3C7',
        'cream': '#FEF3C7',
        
        // Tonos de madera (Impregnantes)
        'natural': '#D4A574',
        'roble': '#8B4513',
        'oak': '#8B4513',
        'caoba': '#6B3410',
        'mahogany': '#6B3410',
        'cedro': '#D2691E',
        'cedar': '#D2691E',
        'nogal': '#654321',
        'walnut': '#654321',
        'pino': '#DEB887',
        'pine': '#DEB887',
        'teca': '#8B7355',
        'teak': '#8B7355',
        'wengué': '#3C2415',
        'wenge': '#3C2415',
        'cerezo': '#8B4049',
        'cherry': '#8B4049',
        'alerce': '#B8956D',
        'larch': '#B8956D',
        
        // Colores sintéticos adicionales
        'bordó': '#800020',
        'bordo': '#800020',
        'burgundy': '#800020',
        'fucsia': '#FF00FF',
        'magenta': '#D946EF',
        'lima': '#84CC16',
        'lime': '#84CC16',
        'oliva': '#808000',
        'olive': '#808000',
        'plateado': '#C0C0C0',
        'silver': '#C0C0C0',
        'dorado': '#FFD700',
        'gold': '#FFD700',
        'cristal': '#F0F8FF',
        'crystal': '#F0F8FF',
        'transparente': 'rgba(240, 248, 255, 0.85)',
        'transparent': 'rgba(240, 248, 255, 0.85)',
        'incoloro': 'rgba(245, 245, 245, 0.85)',
        'colorless': 'rgba(245, 245, 245, 0.85)',
        
        // Colores adicionales comunes
        'verde oscuro': '#047857',
        'dark green': '#047857',
        'azul oscuro': '#1E3A8A',
        'dark blue': '#1E3A8A',
        'rojo oscuro': '#991B1B',
        'dark red': '#991B1B',
        'verde claro': '#86EFAC',
        'light green': '#86EFAC',
        'azul claro': '#BFDBFE',
        'light blue': '#BFDBFE',
        'terracota': '#C2410C',
        'terracotta': '#C2410C',
        'arena': '#E9D7C3',
        'sand': '#E9D7C3',
      }
      const normalized = colorName.toLowerCase().trim()
      return colorMap[normalized] || '#9CA3AF' // gris por defecto
    }, [])

    const isImpregnante = (title || '').toLowerCase().includes('impregnante')

    // Determinar acabado priorizando datos directos de variantes (finish consistente)
    const priceBasedFinish = React.useMemo(() => {
      if (!variants || variants.length === 0) return undefined

      const roughlyEqual = (a?: number | null, b?: number | null) => {
        if (a == null || b == null) return false
        const diff = Math.abs(a - b)
        const dynamicTolerance = Math.max(100, 0.01 * Math.max(a, b)) // 1% o $100
        return diff <= dynamicTolerance
      }

      // Normalizar nombre de acabado a valores canónicos
      const normalizeFinish = (val?: string | null) => {
        if (!val) return ''
        const s = val.toString().trim().toLowerCase()
        if (/(brillante|gloss)/i.test(s)) return 'brillante'
        if (/(satinado|satin|semi\s*brillo)/i.test(s)) return 'satinado'
        if (/(mate)/i.test(s)) return 'mate'
        return s
      }

      // Normalizador robusto de medidas/capacidades (4L, 4 LT, 4 litros, 4 lts.)
      const normalize = (value?: string | null): string => {
        if (!value) return ''
        const up = value.toString().trim().toUpperCase()
        const noSpaces = up.replace(/\s+/g, '')
        const noPunct = noSpaces.replace(/[.\-_/]/g, '')
        const replacedKg = noPunct.replace(/(KGS|KILO|KILOS)$/i, 'KG')
        const replacedL = replacedKg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
        return replacedL
      }

      const medidaNorm = normalize(medida)

      // 0) Si todas las variantes comparten el mismo acabado, usarlo directamente
      const uniqueFinishes = Array.from(
        new Set(
          (variants || [])
            .map(v => normalizeFinish(v.finish))
            .filter(f => !!f)
        )
      )
      if (uniqueFinishes.length === 1) {
        const only = uniqueFinishes[0]
        return only ? only.charAt(0).toUpperCase() + only.slice(1) : undefined
      }

      let candidate: ProductVariant | undefined

      // 1) Coincidencia combinada (medida + precio) — la más precisa
      if (medidaNorm && typeof price === 'number') {
        // Buscar variantes que coincidan por medida normalizada y luego por precio
        const sameMeasure = variants.filter(v => normalize(v.measure) === medidaNorm)
        candidate = sameMeasure.find(v =>
          roughlyEqual(v.price_sale ?? null, price) || roughlyEqual(v.price_list ?? null, price)
        )
      }

      // 2) Ranking por precio dentro de la misma medida (selección por precio más cercano)
      if (!candidate && medidaNorm) {
        const sameMeasure = variants.filter(v => normalize(v.measure) === medidaNorm)
        if (sameMeasure.length > 0) {
          const effectivePrice = (v: ProductVariant) =>
            typeof v.price_sale === 'number' && v.price_sale > 0
              ? v.price_sale
              : (typeof v.price_list === 'number' ? v.price_list : Number.POSITIVE_INFINITY)

          if (typeof price === 'number') {
            // Elegir la variante cuyo precio efectivo sea más cercano al del card
            let best: ProductVariant = sameMeasure[0]
            let bestDist = Math.abs(effectivePrice(best) - price)
            for (const v of sameMeasure.slice(1)) {
              const p = effectivePrice(v)
              const dist = Math.abs(p - price)
              if (dist < bestDist || (dist === bestDist && p > effectivePrice(best))) {
                best = v
                bestDist = dist
              }
            }
            candidate = best
          } else {
            // Si no hay precio del card, priorizar la variante por defecto o la primera encontrada
            candidate = sameMeasure.find(v => v.is_default) || sameMeasure[0]
          }
        }
      }

      // 3) Solo medida
      if (!candidate && medidaNorm) {
        const byCapacity = findVariantByCapacity(variants as any, medida as any)
        candidate = (byCapacity as any) || undefined
      }

      // 3) Solo precio
      if (!candidate && typeof price === 'number') {
        candidate = variants.find(
          v => roughlyEqual(v.price_sale ?? null, price) || roughlyEqual(v.price_list ?? null, price)
        )
      }

      // 4) Fallback: default o primera variante
      if (!candidate) {
        candidate = variants.find(v => v.is_default) || variants[0]
      }

      const finish = (candidate?.finish || '').toString().trim()
      return finish ? finish.charAt(0).toUpperCase() + finish.slice(1).toLowerCase() : undefined
    }, [variants, price, medida])

    // Fallback: Determinar acabado por medida cuando no coincide el precio
    const medidaBasedFinish = React.useMemo(() => {
      if (!variants || variants.length === 0 || !medida) return undefined
      const byMeasure = findVariantByCapacity(variants as any, medida as any) as any
      const finish = (byMeasure?.finish || '').toString().trim()
      return finish ? finish.charAt(0).toUpperCase() + finish.slice(1).toLowerCase() : undefined
    }, [variants, medida])

    // Generar badges inteligentes basados en la configuración
    const intelligentBadges = React.useMemo(() => {
      console.group(`🎨 [ProductCardCommercial] Generando badges para "${title}"`)
      console.log('📋 extractedInfo:', extractedInfo)
      console.log('⚙️ badgeConfig:', badgeConfig)
      // Para impregnantes: el acabado debe venir del slug/nombre, no de precio/medida
      const forceSlugFinish = isImpregnante
      const infoForBadges: ExtractedProductInfo = {
        ...extractedInfo,
        // Priorizar SIEMPRE el acabado extraído del slug/nombre; para impregnantes no se usan heurísticas
        finish: forceSlugFinish
          ? (extractedInfo as any)?.finish
          : ((extractedInfo as any)?.finish || priceBasedFinish || medidaBasedFinish),
      }
      // Habilitar automáticamente el badge de grano para productos de lijas
      const pt = detectProductType(title || '')
      const isSandpaper = pt?.id === 'lijas' || /\blija\b/i.test(title || '')
      const effectiveBadgeConfig = {
        ...badgeConfig,
        // Mostrar siempre el grano para lijas; el util detecta el grano aunque no esté en extractedInfo
        showGrit: isSandpaper ? true : (badgeConfig?.showGrit ?? true),
        // Pasar el tipo de producto para controlar badges específicos
        productType: pt
      }
      const badges = formatProductBadges(infoForBadges, effectiveBadgeConfig)

      // Regla anti-duplicados para acabados:
      // - Si vienen múltiples badges de tipo "finish", priorizar "Brillante"
      // - Si no hay "Brillante", mantener solo el primero
      // - Evita casos con "Satinado" y "Brillante" a la vez (se muestra solo "Brillante")
      const finishBadges = badges.filter(b => b.type === 'finish')
      let processedBadges = badges
      if (finishBadges.length > 1) {
        const brillante = finishBadges.find(b => (b.value || '').toLowerCase() === 'brillante')
        const chosenFinish = brillante || finishBadges[0]
        processedBadges = [...badges.filter(b => b.type !== 'finish'), chosenFinish]
      }

      // Regla anti-duplicados para granos (lijas):
      // - Si vienen múltiples badges de tipo "grit", mantener solo el primero
      const gritBadges = processedBadges.filter(b => b.type === 'grit')
      console.log(`🔍 [${title}] Badges de grano encontrados: ${gritBadges.length}`, gritBadges)
      if (gritBadges.length > 1) {
        const chosenGrit = gritBadges[0]
        processedBadges = [...processedBadges.filter(b => b.type !== 'grit'), chosenGrit]
        console.warn(`⚠️ [${title}] Se encontraron ${gritBadges.length} badges de grano duplicados, manteniendo solo el primero:`, chosenGrit)
      }

      // Regla anti-duplicados entre tipos diferentes para lijas:
      // - Si hay un badge de "grit" y un badge de "capacity" con el mismo valor "Grano X", 
      //   mantener solo el badge de "grit" (más específico)
      const gritBadge = processedBadges.find(b => b.type === 'grit')
      const capacityBadge = processedBadges.find(b => b.type === 'capacity')
      
      if (gritBadge && capacityBadge && 
          gritBadge.displayText === capacityBadge.displayText &&
          gritBadge.displayText.includes('Grano')) {
        console.log(`🔍 [${title}] Encontrado badge duplicado entre grit y capacity:`, {
          grit: gritBadge.displayText,
          capacity: capacityBadge.displayText
        })
        // Mantener solo el badge de grit, eliminar el de capacity
        processedBadges = processedBadges.filter(b => !(b.type === 'capacity' && b.displayText === gritBadge.displayText))
        console.warn(`⚠️ [${title}] Eliminado badge de capacity duplicado, manteniendo solo grit:`, gritBadge.displayText)
      }

      // Guardia adicional: si hay un acabado "Brillante" seleccionado,
      // eliminar cualquier aparición de "Satinado" aunque venga por error
      // como otro tipo de badge (p.ej. color o material).
      const hasBrillante = processedBadges.some(
        b => b.type === 'finish' && (b.value || '').toLowerCase() === 'brillante'
      )
      if (hasBrillante) {
        processedBadges = processedBadges.filter(
          b => !(
            (b.type === 'finish' || b.type === 'color' || b.type === 'material') &&
            (b.value || '').toLowerCase() === 'satinado'
          )
        )
      }

      console.log('🎯 Badges generados:', processedBadges)
      console.log(`📊 Total badges: ${processedBadges.length}`)
      
      if (badges.length === 0) {
        console.warn('⚠️ NO SE GENERARON BADGES - Verificar:')
        console.log('  - extractedInfo tiene datos?', Object.keys(extractedInfo).length > 0)
        console.log('  - badgeConfig permite mostrar badges?', badgeConfig)
        console.log('  - Datos específicos:', { 
          capacity: extractedInfo.capacity, 
          color: extractedInfo.color,
          showCapacity: badgeConfig?.showCapacity,
          showColor: badgeConfig?.showColor
        })
      }
      
      // Orden requerido: capacidad (ej. 1L) → acabado (Brillante/Satinado) → colores
      const capacityBadges = processedBadges.filter(b => b.type === 'capacity')
      const finishOnly = processedBadges.filter(b => b.type === 'finish')
      const colorBadges = processedBadges.filter(b => b.type === 'color-circle' || b.type === 'color')
      const others = processedBadges.filter(
        b => b.type !== 'capacity' && b.type !== 'finish' && b.type !== 'color-circle' && b.type !== 'color'
      )

      const orderedBadges = [...capacityBadges, ...finishOnly, ...colorBadges, ...others]

      console.groupEnd()
      return orderedBadges
    }, [extractedInfo, badgeConfig, title, priceBasedFinish])

    // Resolución final del acabado y su origen para depuración/atributos data
    const resolvedFinish = React.useMemo(() => {
      // Mantener consistencia: primero lo extraído (slug/nombre). Para impregnantes, NO usar inferencias
      if (isImpregnante) {
        return (((extractedInfo as any)?.finish || '') as string)
      }
      return (((extractedInfo as any)?.finish || priceBasedFinish || medidaBasedFinish || '') as string)
    }, [priceBasedFinish, medidaBasedFinish, extractedInfo, isImpregnante])

    const resolvedFinishSource = React.useMemo(() => {
      if ((extractedInfo as any)?.finish) return 'extracted'
      // Para impregnantes, nunca reportar heurísticas como fuente
      if (!isImpregnante && priceBasedFinish) return 'price+measure'
      if (!isImpregnante && medidaBasedFinish) return 'measure-only'
      return 'unknown'
    }, [priceBasedFinish, medidaBasedFinish, extractedInfo, isImpregnante])

    // Función para abrir el modal
    const handleOpenModal = React.useCallback(() => {
      setShowShopDetailModal(true)
    }, [])

    // Función para manejar errores de imagen con fallback automático
    const handleImageError = React.useCallback(() => {
      console.group(`🖼️ [CommercialProductCard] Error de imagen - Producto ID: ${productId}`)
      console.error(`❌ URL fallida: ${currentImageSrc}`)
      console.log(`📦 Título del producto: ${title}`)
      console.log(`🏷️ Marca: ${brand}`)
      console.log(`🔄 Estado anterior imageError: ${imageError}`)
      
      if (!imageError) {
        setImageError(true)
        setCurrentImageSrc('/images/products/placeholder.svg')
        console.log(`✅ Fallback aplicado: /images/products/placeholder.svg`)
      } else {
        console.warn(`⚠️ Ya se había aplicado fallback anteriormente`)
      }
      console.groupEnd()
    }, [currentImageSrc, imageError, productId, title, brand])

    // Logging detallado para debugging de imágenes
    React.useEffect(() => {
      console.group(`🖼️ [CommercialProductCard] Debugging imagen para producto: ${title}`);
      console.log('📦 Product data completo:', { productId, title, brand, price });
      console.log('🔗 image prop:', image);
      console.log('🎯 currentImageSrc actual:', currentImageSrc);
      console.log('❌ imageError estado:', imageError);
      console.groupEnd();
    }, [productId, title, brand, price, image, currentImageSrc, imageError]);

    // Actualizar imagen cuando cambie la prop
    React.useEffect(() => {
      if (image && image !== currentImageSrc) {
        console.log(`🔄 [CommercialProductCard] Actualizando imagen para ${title}:`, {
          from: currentImageSrc,
          to: image
        });
        setCurrentImageSrc(image);
        setImageError(false);
      }
    }, [image, currentImageSrc, title])

    // Función para manejar el clic en el card
    const handleCardClick = React.useCallback(
      (e: React.MouseEvent) => {
        // Ignorar clics si estamos dentro de la ventana anti-click post-cierre
        if (Date.now() < ignoreClicksUntilRef.current) {
          e.preventDefault()
          e.stopPropagation()
          console.log('🛑 [CommercialProductCard] Click ignorado por guardia anti-click fantasma')
          return
        }
        // Evitar que se abra el modal si se hace clic en el botón de agregar al carrito
        if ((e.target as HTMLElement).closest('[data-testid="add-to-cart"]')) {
          return
        }
        // Evitar propagación de eventos que puedan interferir con el modal
        e.preventDefault()
        e.stopPropagation()
        handleOpenModal()
      },
      [handleOpenModal]
    )

    // Calcular si mostrar envío gratis automáticamente con umbral global
    const config = useDesignSystemConfig()
    const autoFreeShipping = price ? dsShouldShowFreeShipping(price, config) : false
    const shouldShowFreeShipping = Boolean(freeShipping || autoFreeShipping)

    // Extraer medidas únicas del array de variantes para el badge de medidas
    const uniqueMeasures = React.useMemo(() => {
      if (!variants || variants.length === 0) {
        console.log(`⚠️ [${title}] Sin variantes disponibles para extraer medidas`)
        return []
      }
      
      console.log(`📦 [${title}] Variantes recibidas:`, variants.map(v => ({
        measure: v.measure,
        color_name: v.color_name,
        stock: v.stock
      })))
      
      const measures = variants
        .map(v => v.measure)
        .filter((m): m is string => Boolean(m))
      
      console.log(`📏 [${title}] Medidas extraídas antes de deduplicar:`, measures)
      
      // Eliminar duplicados y ordenar
      const result = Array.from(new Set(measures)).sort((a, b) => {
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.localeCompare(b)
      })
      
      console.log(`✅ [${title}] Medidas únicas finales:`, result)
      
      return result
    }, [variants, title])

    // Extraer colores únicos del array de variantes para el selector
    // Usa la misma lógica que el modal: extrae color_name y busca en PAINT_COLORS
    const uniqueColors = React.useMemo(() => {
      const colorsMap = new Map<string, { name: string; hex: string }>()
      
      if (!variants || variants.length === 0) {
        console.log(`⚠️ [${title}] Sin variantes para extraer colores`)
        return []
      }
      
      if (variants && variants.length > 0) {
        // Primero extraer todos los color_name únicos
        const uniqueColorNames = new Set<string>()
        variants.forEach(v => {
          if (v.color_name && v.color_name.trim() !== '') {
            uniqueColorNames.add(v.color_name)
          }
        })
        
        // Convertir cada color_name a hex usando PAINT_COLORS o el helper
        Array.from(uniqueColorNames).forEach(colorName => {
          // Buscar si existe en PAINT_COLORS (igual que el modal)
          const existingColor = PAINT_COLORS.find(c => 
            c.name.toLowerCase() === colorName.toLowerCase() ||
            c.displayName.toLowerCase() === colorName.toLowerCase() ||
            c.id.toLowerCase() === colorName.toLowerCase()
          )
          
          if (existingColor) {
            colorsMap.set(existingColor.hex, { name: colorName, hex: existingColor.hex })
          } else {
            // Fallback: usar el helper para convertir nombre a hex
            const hexFromName = getColorHexFromName(colorName)
            colorsMap.set(hexFromName, { name: colorName, hex: hexFromName })
          }
        })
      }
      
      const result = Array.from(colorsMap.values())
      console.log(`🎨 [${title}] Colores únicos extraídos:`, result)
      
      // NO agregar color por defecto para productos que no deberían tener color
      // (pinceles, lijas, cintas, masillas, rodillos, etc.)
      const productNameLower = (title || '').toLowerCase()
      const shouldNotHaveColor = 
        productNameLower.includes('pincel') ||
        productNameLower.includes('brocha') ||
        productNameLower.includes('rodillo') ||
        productNameLower.includes('lija') ||
        productNameLower.includes('cinta') ||
        productNameLower.includes('papel') ||
        productNameLower.includes('poximix') ||
        productNameLower.includes('masilla') ||
        productNameLower.includes('enduido')
      
      if (shouldNotHaveColor) {
        console.log(`🚫 [${title}] Producto sin selector de color`)
        return []
      }
      
      // Si no hay colores pero sí hay medidas, agregar "Incoloro" por defecto para otros productos
      if (result.length === 0 && variants.some(v => v.measure)) {
        console.log(`➕ [${title}] Agregando color "Incoloro" por defecto`)
        return [{ name: 'Incoloro', hex: 'rgba(245, 245, 245, 0.85)' }]
      }
      
      return result
    }, [variants, getColorHexFromName, title])

    // Establecer color por defecto al cargar
    React.useEffect(() => {
      if (!selectedColor && uniqueColors.length > 0) {
        setSelectedColor(uniqueColors[0].hex)
      }
    }, [selectedColor, uniqueColors])

    // Establecer medida por defecto al cargar
    React.useEffect(() => {
      if (!selectedMeasure && uniqueMeasures.length > 0) {
        setSelectedMeasure(uniqueMeasures[0])
      }
    }, [selectedMeasure, uniqueMeasures])

    // Helper para separar número y unidad en medidas
    const parseMeasure = React.useCallback((measure: string): { number: string; unit: string } => {
      // Para "N°10", "N°15", etc. (pinceles/brochas) o "N120", "N180" (lijas)
      const nMatch = measure.match(/^(N°|Nº|n°|nº|N|n)\s*(\d+)$/i)
      if (nMatch) {
        return { number: nMatch[2], unit: 'N°' }
      }
      
      // Para "Grano 60", "Grano 80", etc.
      const granoMatch = measure.match(/^(grano)\s*(\d+)$/i)
      if (granoMatch) {
        return { number: granoMatch[2], unit: 'Grano' }
      }
      
      // Regex para separar número de unidad (ej: "4L" -> "4" + "L")
      const match = measure.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
      if (match) {
        return { number: match[1], unit: match[2].toUpperCase() }
      }
      
      return { number: measure, unit: '' }
    }, [])

    // Extraer la unidad común de todas las medidas (para mostrarla una vez)
    const commonUnit = React.useMemo(() => {
      if (uniqueMeasures.length === 0) return ''
      const { unit } = parseMeasure(uniqueMeasures[0])
      return unit
    }, [uniqueMeasures, parseMeasure])

    // Sincronizar precio con variante seleccionada
    const currentVariant = React.useMemo(() => {
      if (!variants || variants.length === 0) return null
      
      // LOG: Mostrar todas las variantes disponibles
      console.log('📦 Variantes disponibles:', variants.map(v => ({
        measure: v.measure,
        color_name: v.color_name,
        color_hex: v.color_hex,
        price_sale: v.price_sale,
        price_list: v.price_list
      })))
      
      console.log('🎯 Buscando variante para:', { selectedMeasure, selectedColor })
      
      // Buscar variante que coincida con color y medida seleccionados
      // Estrategia de búsqueda flexible:
      
      let matchingVariant = null
      
      // Estrategia 1: Coincidencia exacta (color + medida)
      if (selectedMeasure && selectedColor) {
        matchingVariant = variants.find(v => {
          const colorMatch = v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
          const measureMatch = v.measure === selectedMeasure
          return colorMatch && measureMatch
        })
        console.log('🔍 Estrategia 1 (exacta):', matchingVariant ? 'Encontrada' : 'No encontrada')
      }
      
      // Estrategia 2: Solo por medida (común cuando hay 1 solo color)
      if (!matchingVariant && selectedMeasure) {
        matchingVariant = variants.find(v => v.measure === selectedMeasure)
        console.log('🔍 Estrategia 2 (por medida):', matchingVariant ? 'Encontrada' : 'No encontrada')
      }
      
      // Estrategia 3: Solo por color
      if (!matchingVariant && selectedColor) {
        matchingVariant = variants.find(v => 
          v.color_hex === selectedColor || getColorHexFromName(v.color_name || '') === selectedColor
        )
        console.log('🔍 Estrategia 3 (por color):', matchingVariant ? 'Encontrada' : 'No encontrada')
      }
      
      // Estrategia 4: Fallback a primera variante
      if (!matchingVariant && variants.length > 0) {
        matchingVariant = variants[0]
        console.log('🔍 Estrategia 4 (fallback a primera)')
      }
      
      console.log('✅ Variante seleccionada:', {
        measure: matchingVariant?.measure,
        color: matchingVariant?.color_name,
        price_sale: matchingVariant?.price_sale,
        price_list: matchingVariant?.price_list
      })
      
      return matchingVariant || null
    }, [variants, selectedColor, selectedMeasure, getColorHexFromName])

    // Precio dinámico basado en la variante seleccionada
    const displayPrice = React.useMemo(() => {
      console.log('💰 [displayPrice] Calculando precio:', {
        currentVariant,
        selectedColor,
        selectedMeasure,
        variants: variants?.length,
        price
      })
      
      if (currentVariant) {
        // Priorizar price_sale sobre price_list
        const variantPrice = currentVariant.price_sale || currentVariant.price_list || price
        console.log('💰 Usando precio de variante:', variantPrice)
        return variantPrice
      }
      
      console.log('💰 Usando precio base:', price)
      return price
    }, [currentVariant, price, selectedColor, selectedMeasure, variants])

    // Precio original para mostrar tachado (si hay descuento)
    const displayOriginalPrice = React.useMemo(() => {
      if (currentVariant && currentVariant.price_sale && currentVariant.price_list) {
        return currentVariant.price_list
      }
      return originalPrice
    }, [currentVariant, originalPrice])

    // Handler para agregar al carrito con color y medida seleccionados
    const handleAddToCart = React.useCallback(
      async (e?: React.MouseEvent) => {
        if (e) {
          e.stopPropagation() // Evitar que se propague al card
        }

        if (isAddingToCart || stock === 0) return

        // Validar stock disponible antes de agregar
        const quantityToAdd = 1
        const totalQuantityAfterAdd = currentCartQuantity + quantityToAdd

        if (stock !== undefined && stock > 0 && totalQuantityAfterAdd > stock) {
          toast.error(`Stock insuficiente. Solo hay ${stock} unidades disponibles. Ya tienes ${currentCartQuantity} en el carrito.`)
          console.warn('⚠️ CommercialProductCard: Cantidad solicitada excede el stock disponible', {
            stock,
            currentCartQuantity,
            quantityToAdd,
            totalQuantityAfterAdd
          })
          return
        }

        if (showCartAnimation) {
          setIsAddingToCart(true)
          setTimeout(() => setIsAddingToCart(false), 1000)
        }

        try {
          // Buscar el nombre del color seleccionado
          const selectedColorData = uniqueColors.find(c => c.hex === selectedColor)
          
          // Construir objeto de producto para el carrito
          const productData = {
            id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
            name: title || 'Producto',
            price: displayPrice || price || 0,
            discounted_price: currentVariant?.price_sale || undefined,
            images: image ? [image] : [],
            variants: variants || [],
            quantity: 1,
          }

          // Atributos seleccionados (color, medida, finish)
          const attributes = {
            color: selectedColorData?.name || selectedColor || '',
            medida: selectedMeasure || '',
            finish: currentVariant?.finish || '',
          }

          console.log('🛒 Agregando al carrito desde card:', { productData, attributes })

          // Usar addProduct del hook directamente con atributos seleccionados
          addProduct(productData, { quantity: 1, attributes })
          
          // 📊 ANALYTICS: Track add to cart
          try {
            const category = brand || 'Producto'
            const productPrice = productData.discounted_price || productData.price

            // Google Analytics
            trackGA4AddToCart(
              String(productData.id),
              productData.name,
              category,
              productPrice,
              1,
              'ARS'
            )

            // Meta Pixel
            // ✅ CORREGIDO: Si hay una variante seleccionada, usar su ID para que coincida con el feed XML
            const contentIdForMeta = currentVariant?.id
              ? String(currentVariant.id)
              : String(productData.id)
            
            trackMetaAddToCart(
              productData.name,
              contentIdForMeta,
              category,
              productPrice,
              'ARS'
            )

            // 📊 Analytics propio - Trackear add_to_cart
            trackCartAction('add', String(productData.id), {
              productName: productData.name,
              category,
              price: productPrice,
              quantity: 1,
              currency: 'ARS',
            })

            console.debug('[Analytics] Add to cart tracked:', {
              id: productData.id,
              name: productData.name,
              category,
              price: productPrice,
            })
          } catch (analyticsError) {
            console.warn('[Analytics] Error tracking add to cart:', analyticsError)
          }
          
          // Incrementar el contador de agregados
          setCartAddCount(prev => prev + 1)
          
          // NO llamar onAddToCart para evitar duplicación - addProduct ya agrega al carrito
          // Mantener el color y medida seleccionados (no resetear)
        } catch (error) {
          console.error('Error al agregar al carrito:', error)
        }
      },
      [isAddingToCart, stock, currentCartQuantity, showCartAnimation, selectedColor, selectedMeasure, uniqueColors, displayPrice, price, currentVariant, productId, title, image, variants, addProduct]
    )
    
    return (
      <div
        ref={ref}
        className={cn(
          // Mobile-first: diseño compacto para 2 columnas
          'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer',
          // Mobile: más compacto
          'h-[300px] sm:h-[360px]',
          // Tablet y desktop: tamaño completo
          'md:h-[450px] lg:h-[500px]',
          'md:rounded-2xl',
          'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
          'transform-gpu will-change-transform',
          className
        )}
        data-testid='commercial-product-card'
        data-product-id={String(productId || '')}
        data-finish={resolvedFinish || ''}
        data-finish-source={resolvedFinishSource}
        data-medida={medida || ''}
        data-price={price !== undefined ? String(price) : ''}
        data-variants-count={Array.isArray(variants) ? String(variants.length) : '0'}
        style={{
          transformOrigin: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={() => {
          setIsHovered(true)
          setShowQuickActions(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowQuickActions(false)
        }}
        onClick={handleCardClick}
        {...props}
      >
        {/* Icono de envío gratis - Alineado horizontalmente con el botón de carrito */}
        {shouldShowFreeShipping && (
          <div className='absolute right-2 md:right-3 top-2 md:top-2.5 z-30 pointer-events-none select-none flex items-center'>
            <Image
              src='/images/icons/icon-envio.svg'
              alt='Envío gratis'
              width={36}
              height={36}
              className='h-7 sm:h-8 md:h-9 w-auto object-contain drop-shadow'
              priority
              unoptimized
            />
          </div>
        )}

        {/* Badge "Nuevo" en esquina superior derecha - Debajo del icono de envío */}
        {isNew && (
          <span
            className='absolute top-12 md:top-14 right-2 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-40 shadow'
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* Contenedor de imagen completa con degradado - Responsive */}
        <div className='relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-1 md:mb-2 flex-1'>
          {currentImageSrc && !imageError ? (
            <Image
              src={currentImageSrc}
              alt={title || 'Producto'}
              fill
              className='object-contain scale-125 z-0'
              sizes="(max-width: 640px) 153px, (max-width: 1024px) 200px, 250px" // ⚡ OPTIMIZACIÓN: Tamaños específicos para evitar cargar 384px cuando se muestra 153px
              priority={false}
              loading="lazy"
              onError={handleImageError}
              onLoad={() => {
                console.log(`✅ [CommercialProductCard] Imagen cargada exitosamente - Producto ID: ${productId}`)
                console.log(`📸 URL: ${currentImageSrc}`)
                // Reset error state si la imagen carga correctamente
                if (imageError && currentImageSrc !== '/images/products/placeholder.svg') {
                  console.log(`🔄 Reseteando estado de error para imagen corregida`)
                  setImageError(false)
                }
              }}
            />
          ) : (
            <div className='flex items-center justify-center w-full h-full z-0 bg-gray-50'>
              <div className='text-center p-4'>
                <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-xs text-gray-500'>Imagen no disponible</p>
              </div>
            </div>
          )}

          {/* Degradado suave hacia blanco en la parte inferior - Responsive */}
          <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none' />

          {/* Quick Actions eliminados - Ya no se muestran los botones de wishlist y quick view */}
        </div>

        {/* Badge de medidas eliminado según solicitud del usuario */}

        {/* Content con transición suave - Responsive */}
        <div className='relative z-20 text-left p-1.5 md:p-2 bg-white -mt-2 md:-mt-3 flex-shrink-0 rounded-b-xl md:rounded-b-2xl'>
          {/* Marca del producto - Responsive */}
          {brand && (
            <div className='text-xs md:text-sm uppercase text-gray-400 font-normal tracking-wide mb-0.5'>
              {brand}
            </div>
          )}

          {/* Título del producto - Con mejor contraste y responsive */}
          <h3 className='font-medium text-gray-600 text-sm md:text-lg line-clamp-2 leading-[1.1] mb-1'>
            {title}
          </h3>

          {/* Precios - Optimizados para el gradiente y responsive */}
          <div className='flex flex-col items-start space-y-1'>
            {/* Precios en línea horizontal - Responsive */}
            <div className='flex items-center gap-1 md:gap-2'>
              {/* Precio actual - Grande y destacado, responsive (sin decimales) */}
              <div
                className='text-base sm:text-lg md:text-2xl font-bold drop-shadow-sm'
                style={{ color: '#EA5A17' }}
              >
                {
                  `$${(displayPrice ?? 0).toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
                }
              </div>

              {/* Badge de descuento inline con el precio */}
              {discount && (
                <div
                  className='inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded shadow-sm'
                  style={{ backgroundColor: '#EA5A17' }}
                >
                  <span className='font-extrabold text-[10px] sm:text-[11px] text-white leading-none'>
                    {discount}
                  </span>
                  <span className='uppercase text-[7px] sm:text-[8px] font-semibold text-white leading-none -mt-[1px]'>
                    OFF
                  </span>
                </div>
              )}

              {/* Precio anterior tachado - Responsive (sin decimales) */}
              {displayOriginalPrice && displayOriginalPrice > (displayPrice || 0) && (
                <div className='text-gray-500 line-through text-xs md:text-sm drop-shadow-sm'>
                  {
                    `$${displayOriginalPrice.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                  }
                </div>
              )}
            </div>

            {/* Cuotas ocultas temporalmente por solicitud del usuario */}
          </div>

          {/* Barra: Color + Medidas → debajo del precio/título */}
          <div className='w-full mt-2 md:mt-2.5'>
            <div className='flex flex-col gap-1.5'>
              {/* Primera línea: Colores - Carrusel horizontal */}
              {uniqueColors.length > 0 && (
                <div className='relative flex items-center justify-between gap-2'>
                  <div className='relative flex-1 min-w-0 overflow-visible'>
                    <div className='flex items-center gap-1 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-1 pr-16' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {uniqueColors.map((colorData, index) => {
                        const darker = darkenHex(colorData.hex, 0.35)
                        const woodTexture = isImpregnante ? {
                          backgroundImage: [
                            'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05))',
                            `repeating-linear-gradient(90deg, ${darker} 0 2px, transparent 2px 10px)`,
                            `repeating-linear-gradient(100deg, ${darker} 0 1px, transparent 1px 8px)`,
                            `radial-gradient(ellipse at 30% 45%, ${darker.replace('rgb','rgba').replace(')',',0.18)')} 0 3px, rgba(0,0,0,0) 4px)`,
                            'radial-gradient(ellipse at 70% 65%, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 3px)'
                          ].join(', '),
                          backgroundSize: '100% 100%, 12px 100%, 14px 100%, 100% 100%, 100% 100%',
                          backgroundBlendMode: 'multiply' as const
                        } : {}
                        return (
                          <button
                            key={`${colorData.hex}-${index}`}
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedColor(colorData.hex)
                            }}
                            title={colorData.name}
                            className={cn(
                              'w-6 h-6 flex-shrink-0 rounded-full border-2 border-gray-200 shadow-sm transition-all hover:scale-110',
                              selectedColor === colorData.hex && 'ring-2 ring-[#EA5A17] ring-offset-0',
                              (colorData.name.toLowerCase().includes('incoloro') || 
                               colorData.name.toLowerCase().includes('transparente') ||
                               colorData.name.toLowerCase().includes('transparent')) && 'backdrop-blur-md'
                            )}
                            style={{
                              backgroundColor: colorData.hex === '#FFFFFF' || colorData.hex === '#ffffff' ? '#F5F5F5' : colorData.hex,
                              ...(colorData.name.toLowerCase().includes('incoloro') || 
                                  colorData.name.toLowerCase().includes('transparente') ||
                                  colorData.name.toLowerCase().includes('transparent') 
                                ? { backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,200,200,0.3) 0px, rgba(200,200,200,0.3) 2px, transparent 2px, transparent 4px)' }
                                : {}),
                              ...woodTexture
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                  {/* Nombre del color seleccionado a la derecha */}
                  {selectedColor && (
                    <div className='flex-shrink-0 z-10'>
                      <span className='text-[9px] md:text-[10px] text-gray-500 uppercase whitespace-nowrap'>
                        {uniqueColors.find(c => c.hex === selectedColor)?.name || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Segunda línea: Medidas - Carrusel horizontal */}
              {uniqueMeasures.length > 0 && (
                <div className='relative flex items-center justify-between gap-2'>
                  <div className='relative flex-1 min-w-0 overflow-visible'>
                    <div className='flex items-center gap-1 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-1 pr-16' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {uniqueMeasures.map((measure, index) => {
                        const { number } = parseMeasure(measure)
                        return (
                          <button
                            key={measure}
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMeasure(measure)
                            }}
                            className={cn(
                              'w-6 h-6 flex-shrink-0 rounded-full text-xs font-bold transition-all hover:scale-110 flex items-center justify-center border-2 border-gray-200 shadow-sm',
                              selectedMeasure === measure
                                ? 'bg-[#facc15] text-[#EA5A17]'
                                : 'bg-gray-50 text-gray-600'
                            )}
                          >
                            {number}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Unidad + Botón ">" a la derecha (solo si hay selección) */}
                  {selectedMeasure && (
                    <div className='flex items-center gap-1 flex-shrink-0 z-10'>
                      {commonUnit && (
                        <span className='text-[9px] md:text-[10px] text-gray-400 font-light whitespace-nowrap'>
                          {commonUnit}
                        </span>
                      )}
                      {(uniqueColors.length > 1 || uniqueMeasures.length > 1) && (
                        <Sheet open={showColorsSheet} onOpenChange={setShowColorsSheet}>
                          <SheetTrigger asChild>
                            <button
                              type='button'
                              onClick={(e) => e.stopPropagation()}
                              aria-label='Ver todas las opciones de color y medidas'
                              className='px-1 py-0.5 flex-shrink-0 text-[#EA5A17] hover:text-[#d14d0f] bg-transparent flex items-center justify-center transition-colors'
                              title='Ver todas las opciones'
                            >
                              <ChevronRight className='w-4 h-4 md:w-5 md:h-5' />
                            </button>
                          </SheetTrigger>
                          <SheetContent 
                            side='bottom' 
                            className='h-[50vh] md:h-auto md:max-h-[60vh]'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SheetHeader>
                              <SheetTitle>Seleccionar Opciones</SheetTitle>
                            </SheetHeader>
                            <div className='space-y-4 mt-4 overflow-y-auto max-h-[40vh] md:max-h-[50vh] p-2'>
                              {/* Sección de Colores */}
                              {uniqueColors.length > 0 && (
                                <div>
                                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Color</h3>
                                  <div className='grid grid-cols-4 md:grid-cols-5 gap-3'>
                                    {uniqueColors.map((colorData) => {
                                      const darker = darkenHex(colorData.hex, 0.35)
                                      const woodTexture = isImpregnante ? {
                                        backgroundImage: [
                                          'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05))',
                                          `repeating-linear-gradient(90deg, ${darker} 0 2px, transparent 2px 10px)`,
                                          `repeating-linear-gradient(100deg, ${darker} 0 1px, transparent 1px 8px)`,
                                          `radial-gradient(ellipse at 30% 45%, ${darker.replace('rgb','rgba').replace(')',',0.18)')} 0 3px, rgba(0,0,0,0) 4px)`,
                                          'radial-gradient(ellipse at 70% 65%, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 3px)'
                                        ].join(', '),
                                        backgroundSize: '100% 100%, 12px 100%, 14px 100%, 100% 100%, 100% 100%',
                                        backgroundBlendMode: 'multiply' as const
                                      } : {}
                                      
                                      return (
                                        <div key={colorData.hex} className='flex flex-col items-center gap-1'>
                                          <button
                                            type='button'
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setSelectedColor(colorData.hex)
                                              // NO cerrar el sheet, dejar que el usuario confirme con el botón "Listo"
                                            }}
                                            title={colorData.name}
                                            className={cn(
                                              'w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-gray-200 shadow-sm transition-all hover:scale-110 active:scale-95',
                                              selectedColor === colorData.hex && 'ring-2 ring-[#EA5A17] ring-offset-1',
                                              (colorData.name.toLowerCase().includes('incoloro') || 
                                               colorData.name.toLowerCase().includes('transparente') ||
                                               colorData.name.toLowerCase().includes('transparent')) && 'backdrop-blur-md'
                                            )}
                                            style={{
                                              backgroundColor: colorData.hex === '#FFFFFF' || colorData.hex === '#ffffff' ? '#F5F5F5' : colorData.hex,
                                              ...(colorData.name.toLowerCase().includes('incoloro') || 
                                                  colorData.name.toLowerCase().includes('transparente') ||
                                                  colorData.name.toLowerCase().includes('transparent') 
                                                ? { backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,200,200,0.3) 0px, rgba(200,200,200,0.3) 2px, transparent 2px, transparent 4px)' }
                                                : {}),
                                              ...woodTexture
                                            }}
                                          />
                                          <span className='text-[9px] md:text-[10px] text-gray-600 text-center max-w-[70px] truncate'>
                                            {colorData.name}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Sección de Medidas */}
                              {uniqueMeasures.length > 0 && (
                                <div>
                                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Medida</h3>
                                  <div className='grid grid-cols-4 md:grid-cols-5 gap-2'>
                                    {uniqueMeasures.map((measure) => {
                                      const { number } = parseMeasure(measure)
                                      return (
                                        <button
                                          key={measure}
                                          type='button'
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedMeasure(measure)
                                            // NO cerrar el sheet, dejar que el usuario confirme con el botón "Listo"
                                          }}
                                          className={cn(
                                            'h-12 md:h-14 rounded-lg text-sm md:text-base font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center',
                                            selectedMeasure === measure
                                              ? 'bg-[#facc15] text-[#EA5A17] border-2 border-[#facc15] shadow-sm'
                                              : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#EA5A17]'
                                          )}
                                        >
                                          <span className='font-bold'>{number}</span>
                                          <span className='text-xs ml-0.5 font-normal'>{commonUnit}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Botón "Listo" centrado abajo - Agrega al carrito y cierra */}
                            <div className='flex justify-center pt-4 pb-2 border-t border-gray-200 mt-4'>
                              <button
                                type='button'
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  // Agregar al carrito
                                  await handleAddToCart(e)
                                  // Mostrar toast de éxito
                                  setShowSuccessToast(true)
                                  setTimeout(() => setShowSuccessToast(false), 2000)
                                  // Esperar un momento para que se vea la animación antes de cerrar
                                  setTimeout(() => setShowColorsSheet(false), 800)
                                }}
                                disabled={isAddingToCart || stock === 0}
                                className={cn(
                                  'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md',
                                  stock === 0 || isAddingToCart
                                    ? 'bg-gray-200 cursor-not-allowed'
                                    : 'bg-[#facc15] hover:bg-[#f5c000] hover:scale-105 active:scale-95',
                                  isAddingToCart && 'animate-pulse'
                                )}
                              >
                                {isAddingToCart ? (
                                  <div className='w-5 h-5 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin' />
                                ) : (
                                  <svg className='w-6 h-6 text-[#EA5A17] transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                                  </svg>
                                )}
                              </button>
                            </div>
                            
                            {/* Toast de éxito - Aparece cuando se agrega al carrito */}
                            {showSuccessToast && (
                              <div className='absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 fade-in duration-300 z-50'>
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                </svg>
                                <span className='font-medium text-sm'>¡Agregado al carrito!</span>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {children}

        {/* Botón circular de carrito - Arriba del card, alineado con el icono de envío */}
        <button
          type='button'
          onClick={handleAddToCart}
          disabled={isAddingToCart || stock === 0}
          data-testid='add-to-cart'
          data-testid-btn='add-to-cart-btn'
          aria-label='Agregar al carrito'
          className={cn(
            'absolute left-2 md:left-3 top-2 md:top-2.5 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 transform-gpu will-change-transform',
            stock === 0
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500'
          )}
          style={{
            backgroundColor: stock !== 0 ? '#facc15' : undefined,
          }}
        >
          {isAddingToCart ? (
            <div className='w-4 h-4 md:w-5 md:h-5 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin' />
          ) : stock === 0 ? (
            <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-gray-500' />
          ) : cartAddCount > 0 ? (
            <span className='font-bold text-sm md:text-base text-[#EA5A17]'>
              +{cartAddCount}
            </span>
          ) : (
            <ShoppingCart className='w-4 h-4 md:w-5 md:h-5 text-[#EA5A17]' />
          )}
        </button>

        {/* Shop Detail Modal: siempre montado, controlado por la prop open */}
        <ShopDetailModal
          open={showShopDetailModal}
          onOpenChange={handleModalOpenChange}
          product={{
            id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
            name: title || '',
            slug: slug || '',
            price: displayPrice || price || 0,
            originalPrice: displayOriginalPrice || originalPrice,
            image: image || '',
            brand: brand || '',
            stock: stock || 0,
            description: description || '',
            colors: uniqueColors.length > 0 ? uniqueColors.map(c => ({
              id: c.name.toLowerCase().replace(/\s+/g, '-'),
              name: c.name.toLowerCase(),
              displayName: c.name,
              hex: c.hex,
              category: '',
              family: '',
              isPopular: false,
              description: `Color ${c.name}`
            })) : undefined,
            capacities: uniqueMeasures.length > 0 ? uniqueMeasures : [],
            variants: variants && variants.length > 0 ? variants : undefined,
          }}
          onAddToCart={(productData, variants) => {
            console.log('Agregando al carrito:', productData, variants)

            // Mapear datos del modal al CartItem esperado por Redux
            const images: string[] = Array.isArray((productData as any).images)
              ? (productData as any).images
              : (productData as any).image
              ? [(productData as any).image]
              : []

            // Precio original y con descuento (no mezclar)
            const rawOriginal = (productData as any).price ?? originalPrice
            const originalParsed =
              typeof rawOriginal === 'string' ? parseFloat(rawOriginal) : Number(rawOriginal)

            const rawDiscounted = (productData as any).discounted_price ?? (productData as any).price_sale
            const discountedParsed =
              rawDiscounted !== undefined
                ? typeof rawDiscounted === 'string'
                  ? parseFloat(rawDiscounted)
                  : Number(rawDiscounted)
                : undefined

            let parsedId = typeof (productData as any).id === 'string'
              ? parseInt((productData as any).id, 10)
              : Number((productData as any).id)
            if (isNaN(parsedId)) {
              parsedId = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId)
            }

            // NUEVA VALIDACIÓN: No usar Date.now() - mejor rechazar
            if (isNaN(parsedId) || parsedId <= 0) {
              console.error('❌ ID de producto inválido, no se puede agregar al carrito:', { productData, productId })
              return // No agregar al carrito
            }

            const cover = images[0] || '/images/products/placeholder.svg'
            const imgsPayload = {
              thumbnails: [cover],
              previews: images.length ? images : [cover],
            }

            const quantityFromModal = Number((variants as any)?.quantity) || 1

            // Atributos seleccionados para mostrar en el carrito
            // PRIORIDAD: Selecciones del modal > Datos del producto > Fallback card (solo como último recurso)
            const attributes = {
              color:
                (variants as any)?.selectedColor || 
                (variants as any)?.color || 
                (productData as any)?.color || 
                '', // No usar selectedColor del card como fallback (puede estar stale)
              medida:
                (variants as any)?.selectedCapacity ||
                (variants as any)?.capacity ||
                (productData as any)?.capacity ||
                (productData as any)?.medida ||
                '', // No usar selectedMeasure del card como fallback (puede estar stale)
              finish: (variants as any)?.finish || '', // Agregar finish para impregnantes Danzke
            }
            
            console.log('🎯 Atributos desde modal:', attributes)

            // Servicio unificado: normaliza y agrega
            addProduct(
              {
                ...productData,
                id: parsedId, // Ya validado arriba
                name: (productData as any).name || title || 'Producto',
                price: Number.isFinite(originalParsed) ? originalParsed : 0,
                discounted_price:
                  discountedParsed !== undefined && Number.isFinite(discountedParsed)
                    ? (discountedParsed as number)
                    : undefined,
                images: (imgsPayload as any)?.previews ?? (productData as any)?.images ?? [],
                variants,
                quantity: quantityFromModal,
              },
              { quantity: quantityFromModal, attributes }
            )
          }}
        />
      </div>
    )
  }
)

CommercialProductCard.displayName = 'CommercialProductCard'

export { CommercialProductCard }
