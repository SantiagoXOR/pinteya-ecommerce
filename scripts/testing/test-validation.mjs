import fetch from 'node-fetch'

async function testValidation() {
  try {
    console.log('🔍 Testing address validation API...')

    const testAddress = {
      street: 'Av. Córdoba 1234',
      city: 'Córdoba',
      state: 'Córdoba',
      postal_code: '5000',
      country: 'Argentina',
    }

    console.log('📍 Test address:', testAddress)

    const response = await fetch('http://localhost:3000/api/user/addresses/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAddress),
    })

    console.log('📡 Response status:', response.status)

    const result = await response.json()
    console.log('📋 Validation result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Error testing validation:', error.message)
  }
}

testValidation()
