/**
 * Servicio de validación de direcciones usando Google Maps API
 * Valida que las direcciones estén dentro de Córdoba Capital
 */

export interface AddressValidationResult {
  isValid: boolean
  isInCordobaCapital: boolean
  formattedAddress?: string
  coordinates?: {
    lat: number
    lng: number
  }
  error?: string
  suggestions?: string[]
}

export interface GeocodingResult {
  results: Array<{
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    address_components: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
  }>
  status: string
}

// Coordenadas aproximadas de Córdoba Capital
const CORDOBA_CAPITAL_BOUNDS = {
  north: -31.25,
  south: -31.55,
  east: -64.05,
  west: -64.35
}

// Componentes de dirección que indican Córdoba Capital
const CORDOBA_CAPITAL_INDICATORS = [
  'Córdoba',
  'Cordoba',
  'Córdoba Capital',
  'Cordoba Capital'
]

/**
 * Valida si una dirección está dentro de Córdoba Capital
 */
export async function validateAddressInCordobaCapital(
  address: string,
  apiKey?: string
): Promise<AddressValidationResult> {
  try {
    // Usar la API key del proyecto o la proporcionada
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    // Si no hay API key, usar validación básica
    if (!finalApiKey) {
      return validateAddressBasic(address)
    }

    // Usar Google Maps Geocoding API
    const geocodingResult = await geocodeAddress(address, finalApiKey)
    
    if (geocodingResult.status !== 'OK' || !geocodingResult.results.length) {
      return {
        isValid: false,
        isInCordobaCapital: false,
        error: 'No se pudo encontrar la dirección'
      }
    }

    const result = geocodingResult.results[0]
    const coordinates = result.geometry.location
    const addressComponents = result.address_components

    // Verificar si está dentro de los límites geográficos de Córdoba Capital
    const isInBounds = isWithinCordobaCapitalBounds(coordinates)
    
    // Verificar componentes de dirección
    const hasCordobaComponent = addressComponents.some(component => 
      component.types.includes('locality') && 
      CORDOBA_CAPITAL_INDICATORS.some(indicator => 
        component.long_name.toLowerCase().includes(indicator.toLowerCase())
      )
    )

    // Verificar también en administrative_area_level_1 (provincia)
    const hasCordobaProvince = addressComponents.some(component => 
      component.types.includes('administrative_area_level_1') && 
      CORDOBA_CAPITAL_INDICATORS.some(indicator => 
        component.long_name.toLowerCase().includes(indicator.toLowerCase())
      )
    )

    const isInCordobaCapital = isInBounds && (hasCordobaComponent || hasCordobaProvince)

    return {
      isValid: true,
      isInCordobaCapital,
      formattedAddress: result.formatted_address,
      coordinates,
      error: isInCordobaCapital ? undefined : 'La dirección debe estar en Córdoba Capital'
    }

  } catch (error) {
    console.error('Error validando dirección:', error)
    return {
      isValid: false,
      isInCordobaCapital: false,
      error: 'Error al validar la dirección'
    }
  }
}

/**
 * Validación básica sin API (fallback)
 */
function validateAddressBasic(address: string): AddressValidationResult {
  const addressLower = address.toLowerCase()
  
  // Verificar si contiene indicadores de Córdoba
  const hasCordobaIndicator = CORDOBA_CAPITAL_INDICATORS.some(indicator =>
    addressLower.includes(indicator.toLowerCase())
  )

  return {
    isValid: hasCordobaIndicator,
    isInCordobaCapital: hasCordobaIndicator,
    error: hasCordobaIndicator ? undefined : 'La dirección debe estar en Córdoba Capital'
  }
}

/**
 * Verifica si las coordenadas están dentro de los límites de Córdoba Capital
 */
function isWithinCordobaCapitalBounds(coordinates: { lat: number; lng: number }): boolean {
  return (
    coordinates.lat >= CORDOBA_CAPITAL_BOUNDS.south &&
    coordinates.lat <= CORDOBA_CAPITAL_BOUNDS.north &&
    coordinates.lng >= CORDOBA_CAPITAL_BOUNDS.west &&
    coordinates.lng <= CORDOBA_CAPITAL_BOUNDS.east
  )
}

/**
 * Obtiene coordenadas de una dirección usando Google Maps Geocoding API
 */
async function geocodeAddress(address: string, apiKey: string): Promise<GeocodingResult> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=ar&language=es`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Error en la API de Google Maps: ${response.status}`)
  }
  
  return await response.json()
}

/**
 * Obtiene sugerencias de direcciones para autocompletado
 */
export async function getAddressSuggestions(
  query: string,
  apiKey?: string
): Promise<string[]> {
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!finalApiKey || query.length < 3) {
    return []
  }

  try {
    const encodedQuery = encodeURIComponent(`${query}, Córdoba, Argentina`)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${finalApiKey}&types=address&region=ar&components=country:ar&language=es`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    return data.predictions?.map((prediction: any) => prediction.description) || []
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error)
    return []
  }
}

/**
 * Valida una dirección en tiempo real mientras el usuario escribe
 */
export function createAddressValidator(apiKey?: string) {
  let timeoutId: NodeJS.Timeout | null = null

  return {
    validate: (address: string, callback: (result: AddressValidationResult) => void) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        if (address.trim().length < 5) {
          callback({
            isValid: false,
            isInCordobaCapital: false,
            error: 'La dirección debe tener al menos 5 caracteres'
          })
          return
        }

        const result = await validateAddressInCordobaCapital(address, apiKey)
        callback(result)
      }, 500) // Debounce de 500ms
    },
    
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  }
}
