const { Client } = require('@googlemaps/google-maps-services-js')

async function testGooglePlaces() {
  const googleMapsClient = new Client({})
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || 'your_api_key_here'

  try {
    console.log('🔍 Testing Google Places API...')

    const fullAddress = 'Av. Córdoba 1234, Córdoba, Córdoba 5000, Argentina'
    console.log('📍 Address to validate:', fullAddress)

    const geocodeResponse = await googleMapsClient.geocode({
      params: {
        address: fullAddress,
        key: apiKey,
        region: 'ar',
        language: 'es',
      },
    })

    console.log('✅ Google Places API Response:')
    console.log('Status:', geocodeResponse.status)
    console.log('Results count:', geocodeResponse.data.results.length)

    if (geocodeResponse.data.results.length > 0) {
      const result = geocodeResponse.data.results[0]
      console.log('📍 Formatted Address:', result.formatted_address)
      console.log('🌍 Coordinates:', result.geometry.location)
      console.log('🎯 Location Type:', result.geometry.location_type)
      console.log('📋 Types:', result.types)
      console.log('🆔 Place ID:', result.place_id)

      // Calcular confianza
      const confidence =
        result.geometry.location_type === 'ROOFTOP'
          ? 0.95
          : result.geometry.location_type === 'RANGE_INTERPOLATED'
            ? 0.85
            : result.geometry.location_type === 'GEOMETRIC_CENTER'
              ? 0.75
              : 0.65

      console.log('🎯 Confidence:', confidence)

      const validationResult = {
        isValid: true,
        confidence: confidence,
        formatted_address: result.formatted_address,
        coordinates: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        place_id: result.place_id,
        types: result.types,
        components: result.address_components,
      }

      console.log('✅ Final validation result:', JSON.stringify(validationResult, null, 2))
    } else {
      console.log('❌ No results found')
    }
  } catch (error) {
    console.error('❌ Error testing Google Places API:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

testGooglePlaces()
