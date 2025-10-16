import { validateAddressInCordobaCapital, getAddressSuggestions } from '../addressValidation'

// Mock de fetch para las pruebas
global.fetch = jest.fn()

describe('AddressValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateAddressInCordobaCapital', () => {
    it('debería validar correctamente una dirección en Córdoba Capital', async () => {
      const mockGeocodingResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Av. Corrientes 1234, Córdoba, Córdoba, Argentina',
            geometry: {
              location: {
                lat: -31.4201,
                lng: -64.1888
              }
            },
            address_components: [
              {
                long_name: 'Córdoba',
                short_name: 'Córdoba',
                types: ['locality', 'political']
              }
            ]
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      })

      const result = await validateAddressInCordobaCapital(
        'Av. Corrientes 1234, Córdoba',
        'test-api-key'
      )

      expect(result.isValid).toBe(true)
      expect(result.isInCordobaCapital).toBe(true)
      expect(result.formattedAddress).toBe('Av. Corrientes 1234, Córdoba, Córdoba, Argentina')
      expect(result.coordinates).toEqual({ lat: -31.4201, lng: -64.1888 })
    })

    it('debería rechazar una dirección fuera de Córdoba Capital', async () => {
      const mockGeocodingResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Av. Corrientes 1234, Buenos Aires, Argentina',
            geometry: {
              location: {
                lat: -34.6037,
                lng: -58.3816
              }
            },
            address_components: [
              {
                long_name: 'Buenos Aires',
                short_name: 'Buenos Aires',
                types: ['locality', 'political']
              }
            ]
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      })

      const result = await validateAddressInCordobaCapital(
        'Av. Corrientes 1234, Buenos Aires',
        'test-api-key'
      )

      expect(result.isValid).toBe(true)
      expect(result.isInCordobaCapital).toBe(false)
      expect(result.error).toBe('La dirección debe estar en Córdoba Capital')
    })

    it('debería usar validación básica cuando no hay API key', async () => {
      const result = await validateAddressInCordobaCapital('Av. Corrientes 1234, Córdoba')

      expect(result.isValid).toBe(true)
      expect(result.isInCordobaCapital).toBe(true)
    })

    it('debería rechazar dirección sin Córdoba en validación básica', async () => {
      const result = await validateAddressInCordobaCapital('Av. Corrientes 1234, Buenos Aires')

      expect(result.isValid).toBe(false)
      expect(result.isInCordobaCapital).toBe(false)
      expect(result.error).toBe('La dirección debe estar en Córdoba Capital')
    })

    it('debería manejar errores de la API correctamente', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const result = await validateAddressInCordobaCapital(
        'Av. Corrientes 1234, Córdoba',
        'test-api-key'
      )

      expect(result.isValid).toBe(false)
      expect(result.isInCordobaCapital).toBe(false)
      expect(result.error).toBe('Error al validar la dirección')
    })

    it('debería manejar respuesta de API sin resultados', async () => {
      const mockGeocodingResponse = {
        status: 'ZERO_RESULTS',
        results: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      })

      const result = await validateAddressInCordobaCapital(
        'Dirección inexistente',
        'test-api-key'
      )

      expect(result.isValid).toBe(false)
      expect(result.isInCordobaCapital).toBe(false)
      expect(result.error).toBe('No se pudo encontrar la dirección')
    })

    it('debería validar coordenadas dentro de los límites de Córdoba Capital', async () => {
      const mockGeocodingResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Av. Colón 1000, Córdoba, Córdoba, Argentina',
            geometry: {
              location: {
                lat: -31.4000, // Dentro de los límites
                lng: -64.2000  // Dentro de los límites
              }
            },
            address_components: [
              {
                long_name: 'Córdoba',
                short_name: 'Córdoba',
                types: ['locality', 'political']
              }
            ]
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      })

      const result = await validateAddressInCordobaCapital(
        'Av. Colón 1000, Córdoba',
        'test-api-key'
      )

      expect(result.isValid).toBe(true)
      expect(result.isInCordobaCapital).toBe(true)
    })

    it('debería rechazar coordenadas fuera de los límites de Córdoba Capital', async () => {
      const mockGeocodingResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Av. Corrientes 1234, Córdoba, Córdoba, Argentina',
            geometry: {
              location: {
                lat: -32.0000, // Fuera de los límites (muy al sur)
                lng: -64.0000  // Fuera de los límites (muy al este)
              }
            },
            address_components: [
              {
                long_name: 'Córdoba',
                short_name: 'Córdoba',
                types: ['locality', 'political']
              }
            ]
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      })

      const result = await validateAddressInCordobaCapital(
        'Av. Corrientes 1234, Córdoba',
        'test-api-key'
      )

      expect(result.isValid).toBe(true)
      expect(result.isInCordobaCapital).toBe(false)
      expect(result.error).toBe('La dirección debe estar en Córdoba Capital')
    })
  })

  describe('getAddressSuggestions', () => {
    it('debería obtener sugerencias de direcciones', async () => {
      const mockSuggestionsResponse = {
        predictions: [
          {
            description: 'Av. Corrientes 1234, Córdoba, Córdoba, Argentina'
          },
          {
            description: 'Av. Corrientes 567, Córdoba, Córdoba, Argentina'
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestionsResponse
      })

      const suggestions = await getAddressSuggestions('Av. Corrientes', 'test-api-key')

      expect(suggestions).toEqual([
        'Av. Corrientes 1234, Córdoba, Córdoba, Argentina',
        'Av. Corrientes 567, Córdoba, Córdoba, Argentina'
      ])
    })

    it('debería retornar array vacío cuando no hay API key', async () => {
      const suggestions = await getAddressSuggestions('Av. Corrientes')

      expect(suggestions).toEqual([])
    })

    it('debería retornar array vacío cuando la query es muy corta', async () => {
      const suggestions = await getAddressSuggestions('Av', 'test-api-key')

      expect(suggestions).toEqual([])
    })

    it('debería manejar errores de la API de sugerencias', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const suggestions = await getAddressSuggestions('Av. Corrientes', 'test-api-key')

      expect(suggestions).toEqual([])
    })
  })
})