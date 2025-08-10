#!/usr/bin/env node

/**
 * Script para asignar rol de admin a un usuario en Clerk
 * Uso: node scripts/clerk-assign-admin.js <email_del_usuario>
 */

require('dotenv').config({ path: '.env.local' })

async function assignAdminRole(userEmail) {
  try {
    console.log(`🔍 Buscando usuario con email: ${userEmail}`)
    
    // Importar Clerk dinámicamente
    const { clerkClient } = await import('@clerk/clerk-sdk-node')
    
    // Buscar usuario por email
    const users = await clerkClient.users.getUserList({
      emailAddress: [userEmail]
    })
    
    if (users.length === 0) {
      console.error(`❌ No se encontró usuario con email: ${userEmail}`)
      return false
    }
    
    const user = users[0]
    console.log(`✅ Usuario encontrado: ${user.id} - ${user.firstName} ${user.lastName}`)
    
    // Verificar rol actual
    const currentRole = user.publicMetadata?.role || user.privateMetadata?.role
    console.log(`📋 Rol actual: ${currentRole || 'Sin rol'}`)
    
    if (currentRole === 'admin') {
      console.log(`ℹ️  El usuario ya tiene rol de admin`)
      return true
    }
    
    // Asignar rol de admin en publicMetadata
    console.log(`🔧 Asignando rol de admin...`)
    
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin'
      }
    })
    
    console.log(`✅ Rol de admin asignado exitosamente`)
    
    // Verificar la asignación
    const updatedUser = await clerkClient.users.getUser(user.id)
    const newRole = updatedUser.publicMetadata?.role
    
    console.log(`🔍 Verificación - Nuevo rol: ${newRole}`)
    
    if (newRole === 'admin') {
      console.log(`🎉 ¡Rol de admin asignado y verificado correctamente!`)
      return true
    } else {
      console.error(`❌ Error: El rol no se asignó correctamente`)
      return false
    }
    
  } catch (error) {
    console.error(`❌ Error al asignar rol de admin:`, error)
    return false
  }
}

async function listAllUsers() {
  try {
    console.log(`🔍 Listando todos los usuarios...`)
    
    const { clerkClient } = await import('@clerk/clerk-sdk-node')
    
    const users = await clerkClient.users.getUserList({
      limit: 50
    })
    
    console.log(`📋 Usuarios encontrados: ${users.length}`)
    console.log(``)
    
    users.forEach((user, index) => {
      const email = user.emailAddresses?.[0]?.emailAddress || 'Sin email'
      const role = user.publicMetadata?.role || user.privateMetadata?.role || 'Sin rol'
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre'
      
      console.log(`${index + 1}. ${email}`)
      console.log(`   Nombre: ${name}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Rol: ${role}`)
      console.log(`   Creado: ${new Date(user.createdAt).toLocaleDateString()}`)
      console.log(``)
    })
    
  } catch (error) {
    console.error(`❌ Error al listar usuarios:`, error)
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`📋 Uso del script:`)
    console.log(``)
    console.log(`  Asignar rol de admin:`)
    console.log(`  node scripts/clerk-assign-admin.js <email_del_usuario>`)
    console.log(``)
    console.log(`  Listar todos los usuarios:`)
    console.log(`  node scripts/clerk-assign-admin.js --list`)
    console.log(``)
    console.log(`📋 Ejemplos:`)
    console.log(`  node scripts/clerk-assign-admin.js santiago@xor.com.ar`)
    console.log(`  node scripts/clerk-assign-admin.js --list`)
    return
  }
  
  if (args[0] === '--list') {
    await listAllUsers()
    return
  }
  
  const userEmail = args[0]
  
  if (!userEmail.includes('@')) {
    console.error(`❌ Email inválido: ${userEmail}`)
    return
  }
  
  console.log(`🚀 Iniciando asignación de rol de admin en Clerk...`)
  console.log(`📧 Email del usuario: ${userEmail}`)
  console.log(``)
  
  const success = await assignAdminRole(userEmail)
  
  if (success) {
    console.log(``)
    console.log(`🎉 ¡Proceso completado exitosamente!`)
    console.log(``)
    console.log(`📋 Próximos pasos:`)
    console.log(`1. El usuario debe cerrar sesión y volver a iniciar sesión`)
    console.log(`2. Visitar /debug-auth para verificar el rol`)
    console.log(`3. Intentar acceder a /admin`)
  } else {
    console.log(``)
    console.log(`❌ El proceso falló. Revisa los errores arriba.`)
  }
}

// Verificar variables de entorno
if (!process.env.CLERK_SECRET_KEY) {
  console.error(`❌ Error: CLERK_SECRET_KEY no está configurado`)
  console.log(``)
  console.log(`📋 Configura la variable de entorno en .env.local:`)
  console.log(`CLERK_SECRET_KEY=tu_clerk_secret_key`)
  process.exit(1)
}

main().catch(console.error)
