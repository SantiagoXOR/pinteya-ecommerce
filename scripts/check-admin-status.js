#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - VERIFICADOR DE ESTADO ADMIN
 * Verifica el estado del rol admin en Supabase y proporciona instrucciones
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('👑 VERIFICADOR DE ESTADO ADMIN - PINTEYA E-COMMERCE');
console.log('Verificando estado del rol admin...\n');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verifica el estado del usuario en Supabase
 */
async function checkSupabaseStatus(email) {
  console.log(`🔍 Verificando ${email} en Supabase...`);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      clerk_user_id,
      email,
      first_name,
      last_name,
      role_id,
      is_active,
      created_at,
      updated_at,
      user_roles (
        id,
        role_name,
        permissions,
        description
      )
    `)
    .eq('email', email)
    .single();
  
  if (error) {
    throw new Error(`Error buscando usuario en Supabase: ${error.message}`);
  }
  
  if (!data) {
    throw new Error(`Usuario ${email} no encontrado en Supabase`);
  }
  
  console.log(`✅ Usuario encontrado en Supabase:`);
  console.log(`   📧 Email: ${data.email}`);
  console.log(`   🆔 ID: ${data.id}`);
  console.log(`   👤 Nombre: ${data.first_name || 'No especificado'} ${data.last_name || ''}`);
  console.log(`   👑 Rol: ${data.user_roles?.role_name || 'Sin rol'}`);
  console.log(`   🔗 Clerk ID: ${data.clerk_user_id || 'No asignado'}`);
  console.log(`   ✅ Activo: ${data.is_active ? 'Sí' : 'No'}`);
  console.log(`   📅 Creado: ${new Date(data.created_at).toLocaleString()}`);
  console.log(`   🔄 Actualizado: ${new Date(data.updated_at).toLocaleString()}`);
  
  return data;
}

/**
 * Verifica todos los usuarios admin
 */
async function checkAllAdmins() {
  console.log('\n👥 Verificando todos los usuarios admin...');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      clerk_user_id,
      email,
      first_name,
      last_name,
      is_active,
      user_roles (
        role_name
      )
    `)
    .eq('user_roles.role_name', 'admin')
    .eq('is_active', true);
  
  if (error) {
    console.error('❌ Error obteniendo usuarios admin:', error.message);
    return [];
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No se encontraron usuarios admin activos');
    return [];
  }
  
  console.log(`✅ Encontrados ${data.length} usuarios admin activos:`);
  data.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.clerk_user_id ? 'Sincronizado' : 'No sincronizado'})`);
  });
  
  return data;
}

/**
 * Proporciona instrucciones para configurar admin en Clerk
 */
function provideClerkInstructions(user) {
  console.log('\n📋 INSTRUCCIONES PARA CONFIGURAR ADMIN EN CLERK:');
  console.log('=================================================');
  
  console.log('\n🔗 Opción 1: Dashboard de Clerk (RECOMENDADO)');
  console.log('1. Ve a: https://dashboard.clerk.com');
  console.log('2. Selecciona tu aplicación');
  console.log('3. Ve a "Users" en el menú lateral');
  console.log(`4. Busca el usuario: ${user.email}`);
  console.log(`5. Haz clic en el usuario (ID: ${user.clerk_user_id})`);
  console.log('6. Ve a la pestaña "Metadata"');
  console.log('7. En "Public metadata" agrega:');
  console.log('   {');
  console.log('     "role": "admin"');
  console.log('   }');
  console.log('8. En "Private metadata" agrega:');
  console.log('   {');
  console.log('     "role": "admin",');
  console.log(`     "supabase_user_id": "${user.id}",`);
  console.log(`     "supabase_role_id": ${user.role_id},`);
  console.log('     "permissions": {},');
  console.log(`     "last_sync": "${new Date().toISOString()}"`);
  console.log('   }');
  console.log('9. Guarda los cambios');
  
  console.log('\n🔧 Opción 2: API de Clerk');
  console.log('1. Obtén una CLERK_SECRET_KEY válida del dashboard');
  console.log('2. Actualiza la variable en .env.local');
  console.log('3. Ejecuta: npm run update-clerk-metadata');
  
  console.log('\n⚡ Opción 3: Webhook (Automático)');
  console.log('1. Configura el CLERK_WEBHOOK_SECRET correcto');
  console.log('2. El usuario hace logout/login');
  console.log('3. El webhook sincroniza automáticamente');
}

/**
 * Función principal
 */
async function main() {
  try {
    const email = 'santiago@xor.com.ar';
    
    console.log('🚀 Iniciando verificación de estado admin...\n');
    
    // Verificar usuario específico
    const user = await checkSupabaseStatus(email);
    
    // Verificar todos los admins
    await checkAllAdmins();
    
    // Análisis del estado
    console.log('\n📊 ANÁLISIS DEL ESTADO:');
    console.log('======================');
    
    if (user.user_roles?.role_name === 'admin') {
      console.log('✅ Usuario tiene rol admin en Supabase');
      
      if (user.clerk_user_id) {
        console.log('✅ Usuario tiene Clerk ID asignado');
        console.log('🎯 Solo falta sincronizar metadata en Clerk');
        
        // Proporcionar instrucciones
        provideClerkInstructions(user);
        
      } else {
        console.log('⚠️  Usuario NO tiene Clerk ID asignado');
        console.log('🔧 Necesita hacer login primero para generar el Clerk ID');
      }
    } else {
      console.log('❌ Usuario NO tiene rol admin en Supabase');
      console.log('🔧 Ejecuta: npm run assign-admin-role');
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('1. Configurar metadata en Clerk (ver instrucciones arriba)');
    console.log('2. Hacer logout y login en la aplicación');
    console.log('3. Verificar acceso al panel admin');
    console.log('4. Los cambios pueden tardar 1-2 minutos en propagarse');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  checkSupabaseStatus,
  checkAllAdmins,
  provideClerkInstructions
};
