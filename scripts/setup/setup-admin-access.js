#!/usr/bin/env node

/**
 * Script para configurar acceso de administrador
 * Configura el rol admin en Clerk para el usuario actual
 */

const https = require('https')

async function setupAdminAccess() {
  console.log('🔧 CONFIGURANDO ACCESO DE ADMINISTRADOR')
  console.log('=====================================')

  try {
    // Paso 1: Verificar que el sitio esté funcionando
    console.log('\n🌐 Verificando sitio...')

    const siteCheck = await makeRequest('https://pinteya.com/api/products', 'GET')
    if (siteCheck.success) {
      console.log('✅ Sitio funcionando correctamente')
    } else {
      throw new Error('Sitio no responde correctamente')
    }

    // Paso 2: Intentar configurar rol admin
    console.log('\n🔑 Configurando rol de administrador...')

    // Esta API está configurada para tu userId específico
    const setupResult = await makeRequest('https://pinteya.com/api/admin/setup-role', 'POST')

    if (setupResult.success) {
      console.log('✅ Rol de administrador configurado exitosamente')
      console.log('📋 Detalles:', setupResult.data)
    } else {
      console.log('⚠️ Error configurando rol:', setupResult.error)

      // Intentar método alternativo
      console.log('\n🔄 Intentando método alternativo...')
      await tryAlternativeSetup()
    }

    // Paso 3: Verificar acceso al panel admin
    console.log('\n🔍 Verificando acceso al panel admin...')

    const adminCheck = await makeRequest('https://pinteya.com/api/admin/products/stats', 'GET')

    if (adminCheck.success) {
      console.log('✅ Acceso al panel admin confirmado')
    } else {
      console.log('❌ Acceso al panel admin denegado')
      console.log('📋 Error:', adminCheck.error)

      // Mostrar instrucciones manuales
      showManualInstructions()
    }

    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. Intenta acceder a: https://pinteya.com/admin')
    console.log('2. Si no funciona, sigue las instrucciones manuales mostradas arriba')
    console.log('3. El rol puede tardar unos minutos en propagarse')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    showManualInstructions()
  }
}

async function tryAlternativeSetup() {
  console.log('🔄 Probando configuración alternativa...')

  // Intentar crear usuario admin enterprise
  const enterpriseResult = await makeRequest(
    'https://pinteya.com/api/admin/create-admin-user-enterprise',
    'POST',
    {
      email: 'santiago@xor.com.ar',
      password: 'SavoirFaire19$',
      firstName: 'Santiago',
      lastName: 'Admin',
    }
  )

  if (enterpriseResult.success) {
    console.log('✅ Usuario admin enterprise creado')
  } else {
    console.log('⚠️ Error en método enterprise:', enterpriseResult.error)
  }
}

function showManualInstructions() {
  console.log('\n📋 INSTRUCCIONES MANUALES:')
  console.log('==========================')
  console.log('')
  console.log('Si el script automático no funcionó, puedes configurar el acceso manualmente:')
  console.log('')
  console.log('🔑 OPCIÓN 1 - Configurar en Clerk Dashboard:')
  console.log('1. Ve a: https://dashboard.clerk.com')
  console.log('2. Selecciona tu aplicación Pinteya')
  console.log('3. Ve a Users → Encuentra tu usuario')
  console.log('4. En "Public metadata" agrega:')
  console.log('   {')
  console.log('     "role": "admin"')
  console.log('   }')
  console.log('5. Guarda los cambios')
  console.log('')
  console.log('🔑 OPCIÓN 2 - Usar Supabase Dashboard:')
  console.log('1. Ve a: https://supabase.com/dashboard')
  console.log('2. Abre el proyecto Pinteya')
  console.log('3. Ve a SQL Editor')
  console.log('4. Ejecuta esta consulta:')
  console.log('')
  console.log('   INSERT INTO user_profiles (')
  console.log('     clerk_user_id, email, first_name, last_name, role_id, is_active')
  console.log('   ) VALUES (')
  console.log("     'TU_CLERK_USER_ID', 'santiago@xor.com.ar', 'Santiago', 'Admin',")
  console.log("     (SELECT id FROM user_roles WHERE role_name = 'admin'), true")
  console.log('   ) ON CONFLICT (clerk_user_id) DO UPDATE SET')
  console.log("     role_id = (SELECT id FROM user_roles WHERE role_name = 'admin'),")
  console.log('     is_active = true;')
  console.log('')
  console.log('🔑 OPCIÓN 3 - Modificar middleware temporalmente:')
  console.log('1. Edita src/middleware.ts')
  console.log('2. Comenta la verificación de roles temporalmente')
  console.log('3. Haz commit y push')
  console.log('4. Accede al admin y configura tu usuario')
  console.log('5. Restaura el middleware')
  console.log('')
  console.log('⚠️ IMPORTANTE: Usa la OPCIÓN 1 (Clerk) que es la más segura')
}

async function makeRequest(url, method, data = null) {
  return new Promise(resolve => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Setup-Script',
      },
    }

    if (data) {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = https.request(options, res => {
      let responseData = ''

      res.on('data', chunk => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData)
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData,
            status: res.statusCode,
            error: res.statusCode >= 400 ? jsonData.error || 'Error desconocido' : null,
          })
        } catch (e) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: responseData,
            status: res.statusCode,
            error: res.statusCode >= 400 ? responseData : null,
          })
        }
      })
    })

    req.on('error', error => {
      resolve({
        success: false,
        error: error.message,
        status: 0,
      })
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Ejecutar
setupAdminAccess().catch(console.error)
