// ===================================
// PINTEYA E-COMMERCE - DYNAMIC SEO TEXT GENERATOR
// Generador de textos SEO dinámicos para productos y categorías
// ===================================

import { ProductSEOData, CategorySEOData } from './dynamic-seo-manager'

/**
 * Genera texto SEO optimizado para productos
 */
export async function generateProductSEOText(product: ProductSEOData): Promise<string> {
  const baseDescription = product.description || `${product.name} de la marca ${product.brand}`

  // Construir descripción SEO optimizada
  let seoText = `Compra ${product.name} de ${product.brand} en Pinteya E-commerce. `

  // Agregar descripción del producto
  if (baseDescription.length > 0) {
    seoText += `${baseDescription.substring(0, 100)}${baseDescription.length > 100 ? '...' : ''} `
  }

  // Agregar información de precio y disponibilidad
  seoText += `Precio: $${product.price.toLocaleString('es-AR')} ${product.currency}. `

  if (product.availability === 'InStock') {
    seoText += 'Disponible ahora. '
  } else if (product.availability === 'PreOrder') {
    seoText += 'Disponible para pre-orden. '
  }

  // Agregar categoría
  seoText += `Categoría: ${product.category}. `

  // Agregar beneficios
  seoText +=
    'Envío gratis en compras superiores a $50.000. Garantía de calidad. Atención personalizada.'

  return seoText
}

/**
 * Genera texto SEO optimizado para categorías
 */
export async function generateCategorySEOText(category: CategorySEOData): Promise<string> {
  let seoText = `Descubre nuestra amplia selección de ${category.name.toLowerCase()} en Pinteya E-commerce. `

  // Agregar descripción de la categoría
  if (category.description) {
    seoText += `${category.description} `
  }

  // Agregar información de productos
  seoText += `Contamos con ${category.productCount} productos disponibles en esta categoría. `

  // Agregar subcategorías si existen
  if (category.subcategories && category.subcategories.length > 0) {
    seoText += `Incluye: ${category.subcategories.join(', ')}. `
  }

  // Agregar beneficios y llamada a la acción
  seoText +=
    'Productos de calidad, precios competitivos y envío gratis en compras superiores a $50.000. '
  seoText +=
    'Compra online con la confianza de una empresa especializada en pinturería, ferretería y corralón.'

  return seoText
}

/**
 * Genera keywords dinámicas para productos
 */
export function generateProductKeywords(product: ProductSEOData): string[] {
  const keywords = [
    product.name.toLowerCase(),
    product.brand.toLowerCase(),
    product.category.toLowerCase(),
    'pinturería online',
    'comprar online',
    'envío gratis',
    'argentina',
    'pinteya',
  ]

  // Agregar subcategoría si existe
  if (product.subcategory) {
    keywords.push(product.subcategory.toLowerCase())
  }

  // Agregar palabras clave específicas según la categoría
  const categoryKeywords = getCategorySpecificKeywords(product.category)
  keywords.push(...categoryKeywords)

  // Remover duplicados y retornar
  return [...new Set(keywords)]
}

/**
 * Genera keywords dinámicas para categorías
 */
export function generateCategoryKeywords(category: CategorySEOData): string[] {
  const keywords = [
    category.name.toLowerCase(),
    'pinturería online',
    'ferretería',
    'corralón',
    'productos de calidad',
    'envío gratis',
    'argentina',
    'pinteya',
  ]

  // Agregar subcategorías como keywords
  if (category.subcategories) {
    keywords.push(...category.subcategories.map(sub => sub.toLowerCase()))
  }

  // Agregar palabras clave específicas según la categoría
  const categoryKeywords = getCategorySpecificKeywords(category.name)
  keywords.push(...categoryKeywords)

  // Remover duplicados y retornar
  return [...new Set(keywords)]
}

/**
 * Obtiene palabras clave específicas según la categoría
 */
function getCategorySpecificKeywords(categoryName: string): string[] {
  const category = categoryName.toLowerCase()

  if (category.includes('pintura') || category.includes('esmalte')) {
    return ['pintura', 'esmalte', 'color', 'decoración', 'pared', 'interior', 'exterior']
  }

  if (category.includes('herramienta') || category.includes('ferretería')) {
    return ['herramientas', 'ferretería', 'construcción', 'reparación', 'bricolage']
  }

  if (category.includes('adhesivo') || category.includes('pegamento')) {
    return ['adhesivo', 'pegamento', 'unión', 'fijación', 'reparación']
  }

  if (category.includes('limpieza') || category.includes('mantenimiento')) {
    return ['limpieza', 'mantenimiento', 'cuidado', 'higiene', 'desinfección']
  }

  if (category.includes('jardín') || category.includes('exterior')) {
    return ['jardín', 'exterior', 'plantas', 'riego', 'paisajismo']
  }

  return ['construcción', 'hogar', 'mejoras']
}

/**
 * Optimiza el título para SEO
 */
export function optimizeTitleForSEO(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) {
    return title
  }

  // Truncar manteniendo palabras completas
  const truncated = title.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated.substring(0, maxLength - 3) + '...'
}

/**
 * Optimiza la descripción para SEO
 */
export function optimizeDescriptionForSEO(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description
  }

  // Truncar manteniendo palabras completas
  const truncated = description.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated.substring(0, maxLength - 3) + '...'
}
