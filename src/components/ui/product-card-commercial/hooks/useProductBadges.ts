'use client'

import React from 'react'
import { 
  extractProductCapacity, 
  formatProductBadges, 
  type ProductBadgeInfo, 
  type ExtractedProductInfo, 
  detectProductType 
} from '@/utils/product-utils'
import { findVariantByCapacity } from '@/lib/api/product-variants'
import { normalizeMeasure } from '../utils/measure-utils'
import type { ProductVariant, BadgeConfig } from '../types'

interface UseProductBadgesOptions {
  title?: string
  slug?: string
  variants?: ProductVariant[]
  description?: string
  features?: Record<string, any>
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  brand?: string
  badgeConfig?: BadgeConfig
  price?: number
  medida?: string
}

interface UseProductBadgesResult {
  intelligentBadges: ProductBadgeInfo[]
  resolvedFinish: string
  resolvedFinishSource: string
  extractedInfo: ExtractedProductInfo
  isImpregnante: boolean
}

/**
 * Hook para manejar badges inteligentes del producto
 */
export const useProductBadges = ({
  title,
  slug,
  variants,
  description,
  features,
  specifications,
  dimensions,
  weight,
  brand,
  badgeConfig,
  price,
  medida
}: UseProductBadgesOptions): UseProductBadgesResult => {
  const isImpregnante = (title || '').toLowerCase().includes('impregnante')

  // Extraer información del producto para badges inteligentes
  const extractedInfo = React.useMemo(() => {
    if (!title) return {}
    
    // Crear objeto con datos estructurados de la base de datos
    const databaseData = {
      features: features || {},
      specifications: specifications || {},
      dimensions: dimensions || {},
      weight: weight || 0,
      brand: brand || '',
    }
    
    const result = extractProductCapacity(title, variants, description, databaseData, slug)
    
    return result
  }, [title, slug, variants, description, features, specifications, dimensions, weight, brand])

  // Determinar acabado priorizando datos directos de variantes
  const priceBasedFinish = React.useMemo(() => {
    if (!variants || variants.length === 0) return undefined

    const roughlyEqual = (a?: number | null, b?: number | null) => {
      if (a == null || b == null) return false
      const diff = Math.abs(a - b)
      const dynamicTolerance = Math.max(100, 0.01 * Math.max(a, b))
      return diff <= dynamicTolerance
    }

    const normalizeFinish = (val?: string | null) => {
      if (!val) return ''
      const s = val.toString().trim().toLowerCase()
      if (/(brillante|gloss)/i.test(s)) return 'brillante'
      if (/(satinado|satin|semi\s*brillo)/i.test(s)) return 'satinado'
      if (/(mate)/i.test(s)) return 'mate'
      return s
    }

    const medidaNorm = normalizeMeasure(medida)

    // Si todas las variantes comparten el mismo acabado, usarlo directamente
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

    // Coincidencia combinada (medida + precio)
    if (medidaNorm && typeof price === 'number') {
      const sameMeasure = variants.filter(v => normalizeMeasure(v.measure) === medidaNorm)
      candidate = sameMeasure.find(v =>
        roughlyEqual(v.price_sale ?? null, price) || roughlyEqual(v.price_list ?? null, price)
      )
    }

    // Ranking por precio dentro de la misma medida
    if (!candidate && medidaNorm) {
      const sameMeasure = variants.filter(v => normalizeMeasure(v.measure) === medidaNorm)
      if (sameMeasure.length > 0) {
        const effectivePrice = (v: ProductVariant) =>
          typeof v.price_sale === 'number' && v.price_sale > 0
            ? v.price_sale
            : (typeof v.price_list === 'number' ? v.price_list : Number.POSITIVE_INFINITY)

        if (typeof price === 'number' && sameMeasure.length > 0) {
          let best: ProductVariant = sameMeasure[0]!
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
          candidate = sameMeasure.find(v => v.is_default) || sameMeasure[0]
        }
      }
    }

    // Solo medida
    if (!candidate && medidaNorm) {
      const byCapacity = findVariantByCapacity(variants as any, medida as any)
      candidate = (byCapacity as any) || undefined
    }

    // Solo precio
    if (!candidate && typeof price === 'number') {
      candidate = variants.find(
        v => roughlyEqual(v.price_sale ?? null, price) || roughlyEqual(v.price_list ?? null, price)
      )
    }

    // Fallback: default o primera variante
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
    const forceSlugFinish = isImpregnante
    const infoForBadges: ExtractedProductInfo = {
      ...extractedInfo,
      finish: forceSlugFinish
        ? (extractedInfo as any)?.finish
        : ((extractedInfo as any)?.finish || priceBasedFinish || medidaBasedFinish),
    }

    const pt = detectProductType(title || '')
    const isSandpaper = pt?.id === 'lijas' || /\blija\b/i.test(title || '')
    const effectiveBadgeConfig = {
      ...badgeConfig,
      showGrit: isSandpaper ? true : (badgeConfig?.showGrit ?? true),
      productType: pt
    }
    const badges = formatProductBadges(infoForBadges, effectiveBadgeConfig)

    // Regla anti-duplicados para acabados
    const finishBadges = badges.filter(b => b.type === 'finish')
    let processedBadges = badges
    if (finishBadges.length > 1) {
      const brillante = finishBadges.find(b => (b.value || '').toLowerCase() === 'brillante')
      const chosenFinish = brillante || finishBadges[0]
      if (chosenFinish) {
        processedBadges = [...badges.filter(b => b.type !== 'finish'), chosenFinish]
      }
    }

    // Regla anti-duplicados para granos (lijas)
    const gritBadges = processedBadges.filter(b => b.type === 'grit')
    if (gritBadges.length > 1 && gritBadges[0]) {
      const chosenGrit = gritBadges[0]
      processedBadges = [...processedBadges.filter(b => b.type !== 'grit'), chosenGrit]
    }

    // Regla anti-duplicados entre tipos diferentes para lijas
    const gritBadge = processedBadges.find(b => b.type === 'grit')
    const capacityBadge = processedBadges.find(b => b.type === 'capacity')
    
    if (gritBadge && capacityBadge && 
        gritBadge.displayText === capacityBadge.displayText &&
        gritBadge.displayText.includes('Grano')) {
      processedBadges = processedBadges.filter(b => !(b.type === 'capacity' && b.displayText === gritBadge.displayText))
    }

    // Guardia adicional para brillante vs satinado
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

    // Orden requerido: capacidad → acabado → colores
    const capacityBadges = processedBadges.filter(b => b.type === 'capacity')
    const finishOnly = processedBadges.filter(b => b.type === 'finish')
    const colorBadges = processedBadges.filter(b => b.type === 'color-circle' || b.type === 'color')
    const others = processedBadges.filter(
      b => b.type !== 'capacity' && b.type !== 'finish' && b.type !== 'color-circle' && b.type !== 'color'
    )

    return [...capacityBadges, ...finishOnly, ...colorBadges, ...others]
  }, [extractedInfo, badgeConfig, title, priceBasedFinish, medidaBasedFinish, isImpregnante])

  // Resolución final del acabado
  const resolvedFinish = React.useMemo(() => {
    if (isImpregnante) {
      return (((extractedInfo as any)?.finish || '') as string)
    }
    return (((extractedInfo as any)?.finish || priceBasedFinish || medidaBasedFinish || '') as string)
  }, [priceBasedFinish, medidaBasedFinish, extractedInfo, isImpregnante])

  const resolvedFinishSource = React.useMemo(() => {
    if ((extractedInfo as any)?.finish) return 'extracted'
    if (!isImpregnante && priceBasedFinish) return 'price+measure'
    if (!isImpregnante && medidaBasedFinish) return 'measure-only'
    return 'unknown'
  }, [priceBasedFinish, medidaBasedFinish, extractedInfo, isImpregnante])

  return {
    intelligentBadges,
    resolvedFinish,
    resolvedFinishSource,
    extractedInfo,
    isImpregnante
  }
}

