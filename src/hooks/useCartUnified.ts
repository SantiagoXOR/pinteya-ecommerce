// ===================================
// HOOK UNIFICADO: useCartUnified
// ===================================
// Centraliza la lógica de agregado al carrito, normalizando distintos
// formatos de producto hacia el CartItem del slice de Redux.

import { useMemo } from 'react'
import { useCart } from './useCart'
import type { CartItem } from '@/redux/features/cart-slice'
import { normalizeAttributes } from '@/lib/utils/variant-normalizer'

type Attributes = {
  color?: string
  medida?: string // tamaño/capacidad
  finish?: string // acabado
}

export interface AddProductOptions {
  quantity?: number
  attributes?: Attributes
  image?: string
  variant_id?: number | string
}

// Helpers de conversión seguros
const toNumber = (v: any, fallback = 0): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : fallback
}

const pickTitle = (input: any): string =>
  input?.title ?? input?.name ?? input?.products?.name ?? ''

const pickId = (input: any): number =>
  toNumber(input?.id ?? input?.product_id ?? input?.products?.id)

const pickPrice = (input: any): { price: number; discountedPrice: number } => {
  const price = toNumber(input?.price ?? input?.products?.price)
  const discounted = toNumber(
    input?.discountedPrice ?? input?.discounted_price ?? input?.products?.discounted_price,
    price
  )
  return { price, discountedPrice: discounted || price }
}

const pickQuantity = (input: any, opts?: AddProductOptions): number => {
  return toNumber(opts?.quantity ?? input?.quantity ?? 1, 1)
}

const pickImages = (input: any, opts?: AddProductOptions): CartItem['imgs'] => {
  // Prioridad: estructura ya normalizada -> arreglo de imágenes -> imagen única
  const imgs = input?.imgs
  const imagesArr = input?.images ?? input?.products?.images
  const singleImage = opts?.image ?? input?.image

  if (imgs && typeof imgs === 'object') return imgs
  if (Array.isArray(imagesArr)) {
    return {
      thumbnails: imagesArr.length ? [imagesArr[0]] : [],
      previews: imagesArr,
    }
  }
  if (singleImage) {
    return {
      thumbnails: [singleImage],
      previews: [singleImage],
    }
  }
  return undefined
}

const pickAttributes = (input: any, opts?: AddProductOptions): Attributes | undefined => {
  const source =
    opts?.attributes ??
    input?.attributes ??
    input?.variants ??
    input?.selectedVariants ??
    input?.variant

  if (!source) return undefined

  const color =
    source?.color ?? source?.selectedColor ?? source?.colorName ?? source?.Colour ?? source?.Color
  const medida =
    source?.medida ??
    source?.size ??
    source?.selectedCapacity ??
    source?.capacity ??
    source?.SelectedSize
  const finish =
    source?.finish ?? source?.acabado ?? source?.Finishing ?? source?.terminacion ?? source?.finishName

  if (!color && !medida && !finish) return undefined
  return normalizeAttributes({ color, medida, finish })
}

const pickVariantId = (input: any, opts?: AddProductOptions): number | string | undefined => {
  // Prioridad: opts -> input.variant_id -> input.currentVariant?.id -> input.selectedVariant?.id -> input.variant?.id
  if (opts?.variant_id !== undefined) return opts.variant_id
  if (input?.variant_id !== undefined) return input.variant_id
  if (input?.currentVariant?.id !== undefined) return input.currentVariant.id
  if (input?.selectedVariant?.id !== undefined) return input.selectedVariant.id
  if (input?.variant?.id !== undefined) return input.variant.id
  return undefined
}

export const normalizeToCartItem = (
  input: any,
  opts?: AddProductOptions
): CartItem => {
  const id = pickId(input)
  const title = pickTitle(input)
  const { price, discountedPrice } = pickPrice(input)
  const quantity = pickQuantity(input, opts)
  const imgs = pickImages(input, opts)
  const attributes = pickAttributes(input, opts)
  const variant_id = pickVariantId(input, opts)

  const normalized: CartItem = {
    id,
    title,
    price,
    discountedPrice,
    quantity,
    ...(imgs ? { imgs } : {}),
    ...(attributes ? { attributes } : {}),
    ...(variant_id !== undefined ? { variant_id } : {}),
  }

  return normalized
}

// Hook expuesto: un único punto de entrada para agregar productos
export const useCartUnified = () => {
  const { addToCart } = useCart()

  const addProduct = useMemo(() => {
    return (input: any, opts?: AddProductOptions) => {
      const item = normalizeToCartItem(input, opts)
      addToCart(item)
    }
  }, [addToCart])

  return { addProduct }
}

export default useCartUnified