#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - ASIGNAR ROL ADMIN
 * Asigna rol admin a santiago@xor.com.ar en Supabase y Clerk
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('👑 ASIGNADOR DE ROL ADMIN - PINTEYA E-COMMERCE')
console.log('Asignando rol admin a santiago@xor.com.ar...\n')

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Obtiene el ID del rol admin
 */
async function getAdminRoleId() {
  console.log('🔍 Obteniendo ID del rol admin...')

  const { data, error } = await supabase
    .from('user_roles')
    .select('id, role_name')
    .eq('role_name', 'admin')
    .single()

  if (error) {
    throw new Error(`Error obteniendo rol admin: ${error.message}`)
  }

  if (!data) {
    throw new Error('Rol admin no encontrado en la base de datos')
  }

  console.log(`✅ Rol admin encontrado: ID ${data.id}`)
  return data.id
}

/**
 * Busca el usuario por email
 */
async function findUserByEmail(email) {
  console.log(`🔍 Buscando usuario: ${email}...`)

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      `
      id,
      clerk_user_id,
      email,
      first_name,
      last_name,
      role_id,
      is_active,
      user_roles (
        id,
        role_name,
        permissions
      )
    `
    )
    .eq('email', email)
    .single()

  if (error) {
    throw new Error(`Error buscando usuario: ${error.message}`)
  }

  if (!data) {
    throw new Error(`Usuario ${email} no encontrado`)
  }

  console.log(`✅ Usuario encontrado: ID ${data.id}`)
  console.log(`📋 Rol actual: ${data.user_roles?.role_name || 'Sin rol'}`)
  console.log(`🆔 Clerk ID: ${data.clerk_user_id || 'No asignado'}`)

  return data
}

/**
 * Actualiza el rol del usuario
 */
async function updateUserRole(userId, adminRoleId) {
  console.log(`🔄 Actualizando rol del usuario ${userId} a admin (${adminRoleId})...`)

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      role_id: adminRoleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) {
    throw new Error(`Error actualizando rol: ${error.message}`)
  }

  console.log('✅ Rol actualizado exitosamente en Supabase')
  return data
}

/**
 * Verifica la actualización
 */
async function verifyUpdate(email) {
  console.log('🔍 Verificando actualización...')

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      `
      id,
      email,
      role_id,
      user_roles (
        role_name,
        permissions
      )
    `
    )
    .eq('email', email)
    .single()

  if (error) {
    throw new Error(`Error verificando actualización: ${error.message}`)
  }

  console.log(`✅ Verificación exitosa:`)
  console.log(`   - Email: ${data.email}`)
  console.log(`   - Rol: ${data.user_roles?.role_name}`)
  console.log(`   - Role ID: ${data.role_id}`)

  return data
}

/**
 * Función principal
 */
async function main() {
  try {
    const email = 'santiago@xor.com.ar'

    console.log('🚀 Iniciando proceso de asignación de rol admin...\n')

    // Paso 1: Obtener ID del rol admin
    const adminRoleId = await getAdminRoleId()

    // Paso 2: Buscar usuario
    const user = await findUserByEmail(email)

    // Paso 3: Verificar si ya es admin
    if (user.user_roles?.role_name === 'admin') {
      console.log('✅ El usuario ya tiene rol admin')
      console.log('🎯 No se requieren cambios')
      return
    }

    // Paso 4: Actualizar rol
    await updateUserRole(user.id, adminRoleId)

    // Paso 5: Verificar actualización
    await verifyUpdate(email)

    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE!')
    console.log(`👑 ${email} ahora tiene rol admin en Supabase`)

    console.log('\n📋 Próximos pasos:')
    console.log('1. Ejecutar sincronización con Clerk: npm run sync-admin-role')
    console.log('2. Verificar que el usuario pueda acceder al panel admin')
    console.log('3. Probar funcionalidades administrativas')
  } catch (error) {
    console.error('\n❌ ERROR EN EL PROCESO:', error.message)
    console.log('\n🔧 Soluciones posibles:')
    console.log('1. Verificar que las variables de entorno estén configuradas')
    console.log('2. Confirmar que el usuario existe en Supabase')
    console.log('3. Verificar que el rol admin existe en user_roles')
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  getAdminRoleId,
  findUserByEmail,
  updateUserRole,
  verifyUpdate,
}
