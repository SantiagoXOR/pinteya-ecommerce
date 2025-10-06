#!/usr/bin/env node

/**
 * Script para verificar la configuración de MercadoPago
 * Ejecutar con: node scripts/test-mercadopago.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

console.log('🔧 VERIFICADOR DE CONFIGURACIÓN MERCADOPAGO')
console.log('='.repeat(50))

// Verificar variables de entorno
console.log('\n📋 1. VERIFICANDO VARIABLES DE ENTORNO...')
if (!ACCESS_TOKEN) {
  console.log('❌ MERCADOPAGO_ACCESS_TOKEN no encontrado')
  process.exit(1)
}
if (!PUBLIC_KEY) {
  console.log('❌ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no encontrado')
  process.exit(1)
}

console.log('✅ ACCESS_TOKEN:', ACCESS_TOKEN.substring(0, 20) + '...')
console.log('✅ PUBLIC_KEY:', PUBLIC_KEY.substring(0, 20) + '...')

// Verificar si son credenciales de test
const isTestToken = ACCESS_TOKEN.includes('TEST') || ACCESS_TOKEN.includes('APP_USR')
const isTestPublicKey = PUBLIC_KEY.includes('TEST') || PUBLIC_KEY.includes('APP_USR')

console.log('\n🧪 2. VERIFICANDO ENTORNO...')
console.log('ACCESS_TOKEN es de test:', isTestToken ? '✅ SÍ' : '❌ NO')
console.log('PUBLIC_KEY es de test:', isTestPublicKey ? '✅ SÍ' : '❌ NO')

if (!isTestToken || !isTestPublicKey) {
  console.log('⚠️  ADVERTENCIA: Parece que estás usando credenciales de producción')
  console.log('   Para testing, asegúrate de usar credenciales de SANDBOX/TEST')
}

// Función para hacer requests HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Verificar credenciales con la API
async function verifyCredentials() {
  console.log('\n🔑 3. VERIFICANDO CREDENCIALES CON LA API...')

  try {
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/users/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }

    const response = await makeRequest(options)

    if (response.status === 200) {
      console.log('✅ Credenciales válidas')
      console.log('👤 Usuario:', response.data.first_name, response.data.last_name)
      console.log('📧 Email:', response.data.email)
      console.log('🌍 País:', response.data.site_id)
      console.log('🏪 Tipo:', response.data.user_type)
      return true
    } else {
      console.log('❌ Error al verificar credenciales:', response.status)
      console.log('📄 Respuesta:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message)
    return false
  }
}

// Crear una preferencia de prueba
async function createTestPreference() {
  console.log('\n🛒 4. CREANDO PREFERENCIA DE PRUEBA...')

  try {
    const testPreference = {
      items: [
        {
          title: 'Test Product - Pinteya',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: 'http://localhost:3000/checkout/success',
        failure: 'http://localhost:3000/checkout/failure',
        pending: 'http://localhost:3000/checkout/pending',
      },
      external_reference: 'test-' + Date.now(),
    }

    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }

    const response = await makeRequest(options, testPreference)

    if (response.status === 201) {
      console.log('✅ Preferencia creada exitosamente')
      console.log('🆔 ID:', response.data.id)
      console.log('🔗 Init Point:', response.data.init_point)
      console.log('🔗 Sandbox Init Point:', response.data.sandbox_init_point)
      return response.data
    } else {
      console.log('❌ Error al crear preferencia:', response.status)
      console.log('📄 Respuesta:', response.data)
      return null
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message)
    return null
  }
}

// Mostrar tarjetas de prueba
function showTestCards() {
  console.log('\n💳 5. TARJETAS DE PRUEBA PARA ARGENTINA:')
  console.log('='.repeat(50))

  const testCards = [
    {
      brand: 'Visa',
      number: '4509 9535 6623 3704',
      cvv: '123',
      expiry: '11/25',
      result: '✅ Aprobado',
    },
    {
      brand: 'Mastercard',
      number: '5031 7557 3453 0604',
      cvv: '123',
      expiry: '11/25',
      result: '✅ Aprobado',
    },
    {
      brand: 'American Express',
      number: '3711 803032 57522',
      cvv: '1234',
      expiry: '11/25',
      result: '✅ Aprobado',
    },
    {
      brand: 'Visa (Rechazo)',
      number: '4013 5406 8274 6260',
      cvv: '123',
      expiry: '11/25',
      result: '❌ Fondos insuficientes',
    },
  ]

  testCards.forEach(card => {
    console.log(`${card.brand}:`)
    console.log(`  Número: ${card.number}`)
    console.log(`  CVV: ${card.cvv}`)
    console.log(`  Vencimiento: ${card.expiry}`)
    console.log(`  Resultado: ${card.result}`)
    console.log('')
  })

  console.log('👤 DATOS DEL TITULAR PARA PRUEBAS:')
  console.log('  Nombre: APRO (para aprobado) o OTHE (para rechazado)')
  console.log('  Apellido: APRO o OTHE')
  console.log('  DNI: 12345678')
  console.log('  Email: test@test.com')
}

// Verificar archivos de configuración
function checkConfigFiles() {
  console.log('\n📁 6. VERIFICANDO ARCHIVOS DE CONFIGURACIÓN...')

  const files = [
    '.env.local',
    'src/lib/mercadopago.ts',
    'src/app/api/payments/create-preference/route.ts',
  ]

  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`)
    } else {
      console.log(`❌ ${file} no encontrado`)
    }
  })
}

// Función principal
async function main() {
  checkConfigFiles()

  const credentialsValid = await verifyCredentials()

  if (credentialsValid) {
    const preference = await createTestPreference()

    if (preference) {
      console.log('\n🎉 CONFIGURACIÓN EXITOSA!')
      console.log('='.repeat(50))
      console.log('✅ Credenciales válidas')
      console.log('✅ API funcionando')
      console.log('✅ Preferencia de prueba creada')

      showTestCards()

      console.log('\n🚀 PRÓXIMOS PASOS:')
      console.log('1. Usar las tarjetas de prueba mostradas arriba')
      console.log('2. Probar el checkout en: http://localhost:3000/checkout')
      console.log('3. Usar datos del titular: APRO/APRO/12345678')
      console.log('4. Verificar que las páginas de retorno funcionen')
    } else {
      console.log('\n❌ Error al crear preferencia de prueba')
    }
  } else {
    console.log('\n❌ Credenciales inválidas o problema de conexión')
    console.log('\n🔧 SOLUCIONES:')
    console.log('1. Verificar que las credenciales sean de SANDBOX')
    console.log('2. Regenerar credenciales en MercadoPago Dashboard')
    console.log('3. Verificar conexión a internet')
  }
}

// Ejecutar
main().catch(console.error)
