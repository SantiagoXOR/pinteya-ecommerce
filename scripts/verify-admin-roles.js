#!/usr/bin/env node

/**
 * Script de Verificación del Sistema de Roles
 * Verifica que el sistema de roles esté correctamente configurado
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const ADMIN_EMAILS = [
  'santiago@xor.com.ar',
  'pinturasmascolor@gmail.com',
  'pinteya.app@gmail.com',
]

async function verifyRoleSystem() {
  console.log('🔍 Verificando Sistema de Roles...\n')

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no configuradas')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
    process.exit(1)
  }

  console.log('✅ Variables de entorno configuradas\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Verificar que existe la tabla user_roles
  console.log('1️⃣ Verificando tabla user_roles...')
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('id, role_name, display_name')
    .order('role_name')

  if (rolesError) {
    console.error('❌ Error consultando user_roles:', rolesError.message)
    process.exit(1)
  }

  console.log(`✅ Tabla user_roles existe con ${roles.length} roles:`)
  roles.forEach((role) => {
    console.log(`   - ${role.role_name} (${role.display_name})`)
  })
  console.log()

  // 2. Verificar que existe el rol admin
  console.log('2️⃣ Verificando rol admin...')
  const adminRole = roles.find((r) => r.role_name === 'admin')

  if (!adminRole) {
    console.error('❌ Error: Rol "admin" no encontrado')
    console.error('   Ejecuta la migración: 20250729000001_create_user_roles_system.sql')
    process.exit(1)
  }

  console.log(`✅ Rol admin encontrado (ID: ${adminRole.id})\n`)

  // 3. Verificar la tabla user_profiles
  console.log('3️⃣ Verificando tabla user_profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)

  if (profilesError) {
    console.error('❌ Error consultando user_profiles:', profilesError.message)
    console.error('   Ejecuta la migración: 20250729000001_create_user_roles_system.sql')
    process.exit(1)
  }

  console.log('✅ Tabla user_profiles existe\n')

  // 4. Verificar administradores registrados
  console.log('4️⃣ Verificando administradores registrados...')
  const { data: admins, error: adminsError } = await supabase
    .from('user_profiles')
    .select(
      `
      email,
      is_active,
      is_verified,
      user_roles:role_id (
        role_name
      )
    `
    )
    .eq('user_roles.role_name', 'admin')
    .eq('is_active', true)

  if (adminsError) {
    console.error('❌ Error consultando administradores:', adminsError.message)
    process.exit(1)
  }

  console.log(`✅ Encontrados ${admins.length} administradores:\n`)

  const adminEmails = admins.map((a) => a.email)

  admins.forEach((admin) => {
    const verified = admin.is_verified ? '✅ Verificado' : '⚠️  No verificado'
    console.log(`   📧 ${admin.email} - ${verified}`)
  })
  console.log()

  // 5. Verificar que todos los admins esperados están registrados
  console.log('5️⃣ Verificando emails administrativos esperados...')
  let allRegistered = true

  ADMIN_EMAILS.forEach((email) => {
    if (adminEmails.includes(email)) {
      console.log(`   ✅ ${email} - Registrado`)
    } else {
      console.log(`   ❌ ${email} - NO registrado`)
      allRegistered = false
    }
  })
  console.log()

  if (!allRegistered) {
    console.error('⚠️  Algunos administradores no están registrados')
    console.error('   Ejecuta la migración: 20250110_register_admin_users.sql')
    console.error('   O ejecuta manualmente:')
    console.error(`   SELECT public.add_admin_user('email@example.com');`)
    console.log()
  }

  // 6. Verificar que existe el trigger
  console.log('6️⃣ Verificando trigger auto_create_user_profile...')
  const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tgname, tgenabled 
      FROM pg_trigger 
      WHERE tgname = 'trigger_auto_create_user_profile';
    `,
  })

  // Si no existe la función exec_sql, intentamos otra forma
  if (triggersError) {
    console.log('⚠️  No se puede verificar trigger automáticamente')
    console.log('   Verifica manualmente en Supabase SQL Editor:')
    console.log(
      '   SELECT tgname FROM pg_trigger WHERE tgname = \'trigger_auto_create_user_profile\';'
    )
    console.log()
  }

  // Resumen final
  console.log('═══════════════════════════════════════════════════════')
  console.log('📊 RESUMEN DE VERIFICACIÓN')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`✅ Tabla user_roles: ${roles.length} roles`)
  console.log(`✅ Rol admin: Existe (ID: ${adminRole.id})`)
  console.log(`✅ Tabla user_profiles: Existe`)
  console.log(`${allRegistered ? '✅' : '⚠️'} Administradores: ${admins.length}/${ADMIN_EMAILS.length} registrados`)
  console.log('═══════════════════════════════════════════════════════')

  if (allRegistered && admins.length >= ADMIN_EMAILS.length) {
    console.log('\n🎉 Sistema de roles completamente configurado!')
    console.log('   Ahora puedes hacer login con cualquiera de los emails admin.')
  } else {
    console.log('\n⚠️  Configuración incompleta.')
    console.log('   Revisa los errores arriba y ejecuta las migraciones faltantes.')
  }

  console.log()
}

// Ejecutar verificación
verifyRoleSystem().catch((error) => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})

