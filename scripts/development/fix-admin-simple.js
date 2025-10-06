/**
 * Script simple para corregir rol admin usando API REST de Clerk
 * Ejecutar con: node scripts/fix-admin-simple.js
 */

const https = require('https')

async function makeClerkRequest(path, method = 'GET', data = null) {
  const secretKey = process.env.CLERK_SECRET_KEY

  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY no está configurado en .env.local')
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, res => {
      let responseData = ''

      res.on('data', chunk => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`))
          }
        } catch (error) {
          reject(new Error(`Error parsing response: ${error.message}`))
        }
      })
    })

    req.on('error', error => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function fixSantiagoAdmin() {
  try {
    console.log('🔄 Corrigiendo rol admin para santiago@xor.com.ar...')

    const email = 'santiago@xor.com.ar'

    // 1. Buscar usuario por email
    console.log(`🔍 Buscando usuario ${email}...`)

    const users = await makeClerkRequest(`/v1/users?email_address=${encodeURIComponent(email)}`)

    if (!users || users.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`)
    }

    const user = users[0]
    console.log(`✅ Usuario encontrado: ${user.id}`)
    console.log(`📧 Email: ${user.email_addresses[0]?.email_address}`)
    console.log(`👤 Nombre: ${user.first_name} ${user.last_name}`)

    // 2. Verificar metadata actual
    console.log('\n📋 Metadata actual:')
    console.log('Public metadata:', JSON.stringify(user.public_metadata, null, 2))
    console.log('Private metadata:', JSON.stringify(user.private_metadata, null, 2))

    const currentRole = user.public_metadata?.role || user.private_metadata?.role
    console.log(`🎭 Rol actual: ${currentRole || 'undefined'}`)

    if (currentRole === 'admin') {
      console.log('✅ El usuario ya tiene rol admin configurado')
      return
    }

    // 3. Actualizar metadata
    console.log('\n🔄 Actualizando metadata...')

    const updateData = {
      public_metadata: {
        ...user.public_metadata,
        role: 'admin',
      },
      private_metadata: {
        ...user.private_metadata,
        role: 'admin',
        permissions: {
          admin_access: true,
          monitoring_access: true,
          system_admin: true,
          products_read: true,
          products_create: true,
          products_update: true,
          products_delete: true,
        },
        last_sync: new Date().toISOString(),
        updated_by: 'fix_script_simple',
      },
    }

    const updatedUser = await makeClerkRequest(`/v1/users/${user.id}`, 'PATCH', updateData)

    console.log('✅ Metadata actualizada exitosamente')

    // 4. Verificar cambios
    console.log('\n🔍 Verificando cambios...')
    console.log('Nueva metadata pública:', JSON.stringify(updatedUser.public_metadata, null, 2))
    console.log('Nueva metadata privada:', JSON.stringify(updatedUser.private_metadata, null, 2))

    console.log('\n🎉 ¡Rol admin configurado exitosamente!')
    console.log('💡 Ahora el usuario puede acceder a las APIs enterprise')
    console.log('🔄 Es posible que necesites cerrar sesión y volver a iniciar sesión')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Verificar variables de entorno
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ Error: CLERK_SECRET_KEY no está configurado')
  console.log('💡 Asegúrate de que el archivo .env.local tenga CLERK_SECRET_KEY')
  process.exit(1)
}

// Ejecutar
fixSantiagoAdmin()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
