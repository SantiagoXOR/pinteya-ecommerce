// =====================================================
// TENANT LOCATION HELPER
// Descripción: Helper para obtener coordenadas y límites de mapa según el tenant
// =====================================================

import { TenantPublicConfig } from './types'

/**
 * Coordenadas y límites geográficos por ciudad/tenant
 */
export interface LocationConfig {
  center: {
    lat: number
    lng: number
  }
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  cityName: string
  provinceName: string
  validationKeywords: string[] // Palabras clave para validar direcciones
}

/**
 * Configuraciones de ubicación por tenant slug
 */
const LOCATION_CONFIGS: Record<string, LocationConfig> = {
  pinteya: {
    center: { lat: -31.4201, lng: -64.1888 }, // Córdoba Capital
    bounds: {
      north: -31.25,
      south: -31.55,
      east: -64.05,
      west: -64.35,
    },
    cityName: 'Córdoba Capital',
    provinceName: 'Córdoba',
    validationKeywords: ['córdoba', 'cordoba', 'capital'],
  },
  pintemas: {
    center: { lat: -31.6539, lng: -64.4281 }, // Alta Gracia
    bounds: {
      north: -31.55, // Límite norte (hacia Córdoba)
      south: -31.75, // Límite sur
      east: -64.30,  // Límite este
      west: -64.55,  // Límite oeste
    },
    cityName: 'Alta Gracia',
    provinceName: 'Córdoba',
    validationKeywords: ['alta gracia', 'altagracia', 'córdoba', 'cordoba'],
  },
}

/**
 * Configuración por defecto (Córdoba Capital)
 */
const DEFAULT_LOCATION: LocationConfig = LOCATION_CONFIGS.pinteya

/**
 * Obtiene la configuración de ubicación para un tenant
 */
export function getTenantLocationConfig(tenant: TenantPublicConfig | null): LocationConfig {
  if (!tenant) {
    return DEFAULT_LOCATION
  }

  // Intentar obtener por slug primero
  if (tenant.slug && LOCATION_CONFIGS[tenant.slug]) {
    return LOCATION_CONFIGS[tenant.slug]
  }

  // Si no hay por slug, intentar por ciudad de contacto
  if (tenant.contactCity) {
    const cityLower = tenant.contactCity.toLowerCase()
    
    // Buscar coincidencias parciales
    for (const [slug, config] of Object.entries(LOCATION_CONFIGS)) {
      if (config.cityName.toLowerCase().includes(cityLower) || 
          cityLower.includes(config.cityName.toLowerCase())) {
        return config
      }
    }
  }

  // Fallback a configuración por defecto
  return DEFAULT_LOCATION
}

/**
 * Obtiene el centro del mapa para un tenant
 */
export function getTenantMapCenter(tenant: TenantPublicConfig | null): { lat: number; lng: number } {
  return getTenantLocationConfig(tenant).center
}

/**
 * Obtiene los límites del mapa para un tenant
 */
export function getTenantMapBounds(tenant: TenantPublicConfig | null): {
  north: number
  south: number
  east: number
  west: number
} {
  return getTenantLocationConfig(tenant).bounds
}

/**
 * Obtiene el nombre de la ciudad para un tenant
 */
export function getTenantCityName(tenant: TenantPublicConfig | null): string {
  return getTenantLocationConfig(tenant).cityName
}

/**
 * Obtiene el nombre de la provincia para un tenant
 */
export function getTenantProvinceName(tenant: TenantPublicConfig | null): string {
  return getTenantLocationConfig(tenant).provinceName
}

/**
 * Valida si una dirección pertenece a la zona de servicio del tenant
 */
export function validateTenantAddress(
  address: string,
  addressComponents: google.maps.GeocoderAddressComponent[],
  tenant: TenantPublicConfig | null
): boolean {
  const config = getTenantLocationConfig(tenant)
  const addressLower = address.toLowerCase()

  // Verificar palabras clave en la dirección
  const hasKeyword = config.validationKeywords.some(keyword => 
    addressLower.includes(keyword.toLowerCase())
  )

  if (!hasKeyword) {
    return false
  }

  // Verificar en los componentes de la dirección
  const locality = addressComponents.find(component => 
    component.types.includes('locality')
  )
  
  const administrativeAreaLevel1 = addressComponents.find(component => 
    component.types.includes('administrative_area_level_1')
  )

  // Verificar que la provincia sea Córdoba
  const isCordobaProvince = 
    administrativeAreaLevel1?.long_name?.toLowerCase().includes('córdoba') ||
    administrativeAreaLevel1?.long_name?.toLowerCase().includes('cordoba') ||
    administrativeAreaLevel1?.short_name?.toLowerCase().includes('córdoba') ||
    administrativeAreaLevel1?.short_name?.toLowerCase().includes('cordoba')

  if (!isCordobaProvince) {
    return false
  }

  // Para pintemas, verificar que sea Alta Gracia específicamente
  if (tenant?.slug === 'pintemas') {
    const isAltaGracia = 
      locality?.long_name?.toLowerCase().includes('alta gracia') ||
      locality?.long_name?.toLowerCase().includes('altagracia') ||
      addressLower.includes('alta gracia') ||
      addressLower.includes('altagracia')
    
    return isAltaGracia || false
  }

  // Para pinteya, verificar que sea Córdoba Capital
  if (tenant?.slug === 'pinteya') {
    const isCordobaCapital = 
      locality?.long_name?.toLowerCase().includes('córdoba') ||
      locality?.long_name?.toLowerCase().includes('cordoba') ||
      addressLower.includes('córdoba capital') ||
      addressLower.includes('cordoba capital')
    
    return isCordobaCapital || false
  }

  return true
}

/**
 * Verifica si unas coordenadas están dentro de los límites del tenant
 */
export function isWithinTenantBounds(
  lat: number,
  lng: number,
  tenant: TenantPublicConfig | null
): boolean {
  const bounds = getTenantMapBounds(tenant)
  
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  )
}
