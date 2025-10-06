#!/usr/bin/env node

/**
 * 🚨 SCRIPT DE AUDITORÍA DE SEGURIDAD CLERK
 *
 * Investiga la vulnerabilidad crítica donde usuarios estándar
 * pueden acceder a rutas admin sin autorización.
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const { createClerkClient } = require('@clerk/nextjs/server')

async function auditClerkSecurity() {
  console.log('🚨 INICIANDO AUDITORÍA DE SEGURIDAD CLERK')
  console.log('=====================================')

  try {
    // Verificar variables de entorno
    console.log('\n1. VERIFICANDO VARIABLES DE ENTORNO:')
    console.log(
      'CLERK_SECRET_KEY:',
      process.env.CLERK_SECRET_KEY ? '✅ Configurada' : '❌ Faltante'
    )
    console.log(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:',
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Faltante'
    )

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY no está configurada')
      return
    }

    // Crear cliente de Clerk
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    console.log('\n2. LISTANDO USUARIOS Y SUS ROLES:')
    console.log('================================')

    // Obtener lista de usuarios
    const users = await clerkClient.users.getUserList({
      limit: 10,
    })

    console.log(`Total de usuarios encontrados: ${users.length}`)

    for (const user of users) {
      console.log('\n--- USUARIO ---')
      console.log('ID:', user.id)
      console.log('Email:', user.emailAddresses[0]?.emailAddress || 'Sin email')
      console.log('Nombre:', user.firstName, user.lastName)

      // Verificar metadata público
      console.log('Public Metadata:', JSON.stringify(user.publicMetadata, null, 2))
      console.log('Private Metadata:', JSON.stringify(user.privateMetadata, null, 2))

      // Verificar rol específicamente
      const publicRole = user.publicMetadata?.role
      const privateRole = user.privateMetadata?.role

      console.log('Rol en publicMetadata:', publicRole || 'NO DEFINIDO')
      console.log('Rol en privateMetadata:', privateRole || 'NO DEFINIDO')

      const isAdmin = publicRole === 'admin' || privateRole === 'admin'
      console.log('¿Es Admin?:', isAdmin ? '✅ SÍ' : '❌ NO')

      if (isAdmin) {
        console.log('🔑 USUARIO ADMIN IDENTIFICADO')
      } else {
        console.log('👤 Usuario estándar')
      }
    }

    console.log('\n3. VERIFICANDO CONFIGURACIÓN DE ROLES:')
    console.log('=====================================')

    // Buscar usuario admin específico
    const adminUsers = users.filter(
      user => user.publicMetadata?.role === 'admin' || user.privateMetadata?.role === 'admin'
    )

    console.log(`Usuarios con rol admin: ${adminUsers.length}`)

    if (adminUsers.length === 0) {
      console.error('🚨 PROBLEMA CRÍTICO: NO HAY USUARIOS ADMIN CONFIGURADOS')
      console.error('Esto explica por qué la verificación está fallando')
    }

    // Verificar usuario específico santiago@xor.com.ar
    const santiagoUser = users.find(user =>
      user.emailAddresses.some(email => email.emailAddress === 'santiago@xor.com.ar')
    )

    if (santiagoUser) {
      console.log('\n4. VERIFICANDO USUARIO SANTIAGO (ADMIN ESPERADO):')
      console.log('===============================================')
      console.log('ID:', santiagoUser.id)
      console.log('Public Metadata:', JSON.stringify(santiagoUser.publicMetadata, null, 2))
      console.log('Private Metadata:', JSON.stringify(santiagoUser.privateMetadata, null, 2))

      const hasAdminRole =
        santiagoUser.publicMetadata?.role === 'admin' ||
        santiagoUser.privateMetadata?.role === 'admin'

      if (!hasAdminRole) {
        console.error('🚨 PROBLEMA ENCONTRADO: Santiago no tiene rol admin en Clerk')
        console.error('ACCIÓN REQUERIDA: Configurar rol admin en Clerk Dashboard')
        console.log('\n🔧 PASOS PARA CONFIGURAR ROL ADMIN:')
        console.log('1. Ir a https://dashboard.clerk.com')
        console.log('2. Seleccionar proyecto Pinteya')
        console.log('3. Ir a Users > santiago@xor.com.ar')
        console.log('4. En Public metadata agregar: {"role": "admin"}')
        console.log('5. Guardar cambios')

        // Intentar configurar automáticamente
        console.log('\n🤖 INTENTANDO CONFIGURAR ROL AUTOMÁTICAMENTE...')
        try {
          await clerkClient.users.updateUserMetadata(santiagoUser.id, {
            publicMetadata: {
              ...santiagoUser.publicMetadata,
              role: 'admin',
            },
          })
          console.log('✅ ROL ADMIN CONFIGURADO AUTOMÁTICAMENTE')
        } catch (error) {
          console.error('❌ Error configurando rol automáticamente:', error.message)
        }
      } else {
        console.log('✅ Santiago tiene rol admin correctamente configurado')
      }
    } else {
      console.error('❌ Usuario santiago@xor.com.ar no encontrado en Clerk')
    }

    console.log('\n5. RECOMENDACIONES DE SEGURIDAD:')
    console.log('===============================')

    if (adminUsers.length === 0) {
      console.log('🔧 ACCIÓN REQUERIDA: Configurar rol admin en Clerk Dashboard')
      console.log('   1. Ir a Clerk Dashboard')
      console.log('   2. Seleccionar usuario santiago@xor.com.ar')
      console.log('   3. Agregar metadata: { "role": "admin" }')
      console.log('   4. Guardar cambios')
    }

    console.log('\n✅ AUDITORÍA COMPLETADA')
  } catch (error) {
    console.error('❌ ERROR EN AUDITORÍA:', error)
    console.error('Stack:', error.stack)
  }
}

// Ejecutar auditoría
auditClerkSecurity().catch(console.error)
