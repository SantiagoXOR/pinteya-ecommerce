// ===================================
// CONFIGURACIÓN DE CATEGORÍAS
// ===================================
// Configuración centralizada para el carrusel dinámico de productos por categoría

export interface CategoryConfig {
  title: string
  subtitle: string
  iconUrl: string // URL de la imagen del icono
  color: string
  bgGradient: string
  badgeColor: string
  textColor?: string
  slug: string | null
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  // Default - Envío Gratis (sin categoría seleccionada)
  default: {
    title: 'Envío Gratis',
    subtitle: 'Llega hoy en Córdoba Capital',
    iconUrl: '/images/icons/icon-envio.svg',
    color: 'green',
    bgGradient: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-green-500',
    textColor: 'text-green-700',
    slug: null,
  },
  
  // Categoría: Paredes
  paredes: {
    title: 'Pinturas para Paredes',
    subtitle: 'Látex, sintéticos y revestimientos',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/interiores.webp',
    color: 'blue',
    bgGradient: 'from-blue-50 to-cyan-50',
    badgeColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    slug: 'paredes',
  },
  
  // Categoría: Metales y Maderas
  'metales-y-maderas': {
    title: 'Metales y Maderas',
    subtitle: 'Esmaltes, barnices y protectores',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/maderas.webp',
    color: 'orange',
    bgGradient: 'from-orange-50 to-amber-50',
    badgeColor: 'bg-orange-500',
    textColor: 'text-orange-700',
    slug: 'metales-y-maderas',
  },
  
  // Categoría: Techos
  techos: {
    title: 'Impermeabilizantes',
    subtitle: 'Membranas líquidas y selladores',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/techos.webp',
    color: 'red',
    bgGradient: 'from-red-50 to-rose-50',
    badgeColor: 'bg-red-500',
    textColor: 'text-red-700',
    slug: 'techos',
  },
  
  // Categoría: Complementos
  complementos: {
    title: 'Herramientas y Accesorios',
    subtitle: 'Pinceles, rodillos y más',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/profesionales.webp',
    color: 'purple',
    bgGradient: 'from-purple-50 to-violet-50',
    badgeColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    slug: 'complementos',
  },
  
  // Categoría: Antihumedad
  antihumedad: {
    title: 'Antihumedad',
    subtitle: 'Soluciones contra la humedad',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/humedades.webp',
    color: 'teal',
    bgGradient: 'from-teal-50 to-cyan-50',
    badgeColor: 'bg-teal-500',
    textColor: 'text-teal-700',
    slug: 'antihumedad',
  },
  
  // Categoría: Piscinas
  piscina: {
    title: 'Piscinas y Agua',
    subtitle: 'Pinturas especiales para piscinas',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/piscinas.webp',
    color: 'sky',
    bgGradient: 'from-sky-50 to-blue-50',
    badgeColor: 'bg-sky-500',
    textColor: 'text-sky-700',
    slug: 'piscina',
  },
}

// Helper para obtener configuración por slug
export const getCategoryConfig = (slug: string | null): CategoryConfig => {
  if (!slug) return CATEGORY_CONFIGS.default
  return CATEGORY_CONFIGS[slug] || CATEGORY_CONFIGS.default
}

// Lista de slugs de categorías disponibles
export const CATEGORY_SLUGS = Object.keys(CATEGORY_CONFIGS).filter(key => key !== 'default')

