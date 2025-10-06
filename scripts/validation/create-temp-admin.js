#!/usr/bin/env node

/**
 * Script temporal para crear un usuario admin de prueba
 * Esto es solo para testing - en producción se debe usar Clerk correctamente
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co'
const supabaseServiceKey = '[SUPABASE_SERVICE_ROLE_KEY_REMOVED]'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTempAdmin() {
  try {
    console.log('🔧 Creando usuario admin temporal...')

    // Verificar si ya existe un rol admin
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role_name', 'admin')
      .single()

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error verificando rol admin:', roleError)
      return
    }

    let adminRoleId

    if (!adminRole) {
      console.log('📝 Creando rol admin...')
      const { data: newRole, error: createRoleError } = await supabase
        .from('user_roles')
        .insert({
          role_name: 'admin',
          display_name: 'Administrador',
          permissions: {
            admin_panel: { access: true },
            products: { create: true, read: true, update: true, delete: true },
            orders: { create: true, read: true, update: true, delete: true },
            users: { create: true, read: true, update: true, delete: true },
          },
          is_active: true,
        })
        .select()
        .single()

      if (createRoleError) {
        console.error('Error creando rol admin:', createRoleError)
        return
      }

      adminRoleId = newRole.id
      console.log('✅ Rol admin creado con ID:', adminRoleId)
    } else {
      adminRoleId = adminRole.id
      console.log('✅ Rol admin ya existe con ID:', adminRoleId)
    }

    // Crear usuario admin temporal
    const tempAdminData = {
      clerk_user_id: 'temp_admin_user_123',
      email: 'admin@pinteya.com',
      first_name: 'Admin',
      last_name: 'Temporal',
      role_id: adminRoleId,
      is_active: true,
      is_verified: true,
    }

    // Verificar si ya existe
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', tempAdminData.email)
      .single()

    if (existingUser) {
      console.log('✅ Usuario admin temporal ya existe')
      console.log('📧 Email:', tempAdminData.email)
      console.log('🆔 Clerk ID:', tempAdminData.clerk_user_id)
      return
    }

    const { data: newUser, error: userError } = await supabase
      .from('user_profiles')
      .insert(tempAdminData)
      .select()
      .single()

    if (userError) {
      console.error('Error creando usuario admin:', userError)
      return
    }

    console.log('🎉 Usuario admin temporal creado exitosamente!')
    console.log('📧 Email:', tempAdminData.email)
    console.log('🆔 Clerk ID:', tempAdminData.clerk_user_id)
    console.log('🔑 Role ID:', adminRoleId)

    console.log('\n⚠️ IMPORTANTE:')
    console.log('Este es un usuario temporal para testing.')
    console.log('En producción, configura Clerk correctamente con roles reales.')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function checkProductStats() {
  try {
    console.log('\n📊 Verificando estadísticas de productos...')

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock, is_active')

    if (error) {
      console.error('Error obteniendo productos:', error)
      return
    }

    const totalProducts = products.length
    const activeProducts = products.filter(p => p.is_active).length
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length
    const noStockProducts = products.filter(p => p.stock === 0).length

    console.log('📈 Estadísticas reales:')
    console.log(`   Total productos: ${totalProducts}`)
    console.log(`   Productos activos: ${activeProducts}`)
    console.log(`   Stock bajo (≤10): ${lowStockProducts}`)
    console.log(`   Sin stock: ${noStockProducts}`)
  } catch (error) {
    console.error('Error verificando estadísticas:', error)
  }
}

async function main() {
  console.log('🚀 CONFIGURACIÓN ADMIN TEMPORAL PINTEYA')
  console.log('=====================================')

  await createTempAdmin()
  await checkProductStats()

  console.log('\n✅ Configuración completada!')
}

main().catch(console.error)
