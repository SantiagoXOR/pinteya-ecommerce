#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - SINCRONIZAR ADMIN CON CLERK
 * Sincroniza el rol admin de Supabase con Clerk metadata
 */

const { createClient } = require('@supabase/supabase-js');
const { clerkClient } = require('@clerk/nextjs/server');
require('dotenv').config({ path: '.env.local' });

console.log('🔄 SINCRONIZADOR ADMIN CLERK - PINTEYA E-COMMERCE');
console.log('Sincronizando rol admin con Clerk...\n');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey || !clerkSecretKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('- CLERK_SECRET_KEY:', !!clerkSecretKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Busca usuario en Supabase
 */
async function findUserInSupabase(email) {
  console.log(`🔍 Buscando ${email} en Supabase...`);
  
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
      user_roles (
        id,
        role_name,
        permissions
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
  console.log(`   - ID: ${data.id}`);
  console.log(`   - Rol: ${data.user_roles?.role_name || 'Sin rol'}`);
  console.log(`   - Clerk ID: ${data.clerk_user_id || 'No asignado'}`);
  
  return data;
}

/**
 * Busca usuario en Clerk
 */
async function findUserInClerk(email) {
  console.log(`🔍 Buscando ${email} en Clerk...`);
  
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email]
    });
    
    if (!users.data || users.data.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`);
    }
    
    const user = users.data[0];
    console.log(`✅ Usuario encontrado en Clerk:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.emailAddresses[0]?.emailAddress}`);
    console.log(`   - Rol actual: ${user.publicMetadata?.role || user.privateMetadata?.role || 'Sin rol'}`);
    
    return user;
  } catch (error) {
    throw new Error(`Error buscando usuario en Clerk: ${error.message}`);
  }
}

/**
 * Actualiza metadata en Clerk
 */
async function updateClerkMetadata(clerkUserId, supabaseUser) {
  console.log(`🔄 Actualizando metadata en Clerk para ${clerkUserId}...`);
  
  try {
    const updatedUser = await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role: 'admin',
        supabase_user_id: supabaseUser.id,
        last_sync: new Date().toISOString()
      },
      privateMetadata: {
        role: 'admin',
        permissions: supabaseUser.user_roles?.permissions || {},
        supabase_role_id: supabaseUser.role_id,
        role_name: supabaseUser.user_roles?.role_name,
        last_sync: new Date().toISOString()
      }
    });
    
    console.log('✅ Metadata actualizada exitosamente en Clerk');
    console.log(`   - Public role: ${updatedUser.publicMetadata?.role}`);
    console.log(`   - Private role: ${updatedUser.privateMetadata?.role}`);
    
    return updatedUser;
  } catch (error) {
    throw new Error(`Error actualizando metadata en Clerk: ${error.message}`);
  }
}

/**
 * Actualiza clerk_user_id en Supabase
 */
async function updateSupabaseClerkId(supabaseUserId, clerkUserId) {
  console.log(`🔄 Actualizando clerk_user_id en Supabase...`);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      clerk_user_id: clerkUserId,
      updated_at: new Date().toISOString()
    })
    .eq('id', supabaseUserId)
    .select();
  
  if (error) {
    throw new Error(`Error actualizando clerk_user_id: ${error.message}`);
  }
  
  console.log('✅ clerk_user_id actualizado en Supabase');
  return data;
}

/**
 * Verifica la sincronización
 */
async function verifySyncronization(email) {
  console.log('🔍 Verificando sincronización...');
  
  try {
    // Verificar en Supabase
    const supabaseUser = await findUserInSupabase(email);
    
    // Verificar en Clerk
    const clerkUser = await findUserInClerk(email);
    
    const supabaseRole = supabaseUser.user_roles?.role_name;
    const clerkRole = clerkUser.publicMetadata?.role;
    
    console.log('\n📊 ESTADO DE SINCRONIZACIÓN:');
    console.log(`   - Supabase rol: ${supabaseRole}`);
    console.log(`   - Clerk rol: ${clerkRole}`);
    console.log(`   - Sincronizado: ${supabaseRole === clerkRole ? '✅ SÍ' : '❌ NO'}`);
    
    return {
      synchronized: supabaseRole === clerkRole,
      supabaseRole,
      clerkRole,
      supabaseUser,
      clerkUser
    };
  } catch (error) {
    console.error('❌ Error verificando sincronización:', error.message);
    return { synchronized: false, error: error.message };
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const email = 'santiago@xor.com.ar';
    
    console.log('🚀 Iniciando sincronización de rol admin...\n');
    
    // Paso 1: Buscar usuario en Supabase
    const supabaseUser = await findUserInSupabase(email);
    
    // Verificar que sea admin
    if (supabaseUser.user_roles?.role_name !== 'admin') {
      throw new Error(`Usuario ${email} no tiene rol admin en Supabase (rol actual: ${supabaseUser.user_roles?.role_name})`);
    }
    
    // Paso 2: Buscar usuario en Clerk
    const clerkUser = await findUserInClerk(email);
    
    // Paso 3: Verificar si ya está sincronizado
    const currentClerkRole = clerkUser.publicMetadata?.role || clerkUser.privateMetadata?.role;
    if (currentClerkRole === 'admin') {
      console.log('✅ El usuario ya tiene rol admin en Clerk');
      console.log('🎯 Sincronización ya completada');
      return;
    }
    
    // Paso 4: Actualizar metadata en Clerk
    await updateClerkMetadata(clerkUser.id, supabaseUser);
    
    // Paso 5: Actualizar clerk_user_id en Supabase si es necesario
    if (!supabaseUser.clerk_user_id || supabaseUser.clerk_user_id !== clerkUser.id) {
      await updateSupabaseClerkId(supabaseUser.id, clerkUser.id);
    }
    
    // Paso 6: Verificar sincronización
    const verification = await verifySyncronization(email);
    
    if (verification.synchronized) {
      console.log('\n🎉 SINCRONIZACIÓN COMPLETADA EXITOSAMENTE!');
      console.log(`👑 ${email} ahora tiene rol admin en Clerk y Supabase`);
    } else {
      console.log('\n⚠️  Sincronización completada pero verificación falló');
      console.log('🔧 Puede requerir unos minutos para que los cambios se propaguen');
    }
    
    console.log('\n📋 Próximos pasos:');
    console.log('1. Hacer logout y login en la aplicación');
    console.log('2. Verificar acceso al panel admin');
    console.log('3. Probar funcionalidades administrativas');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA SINCRONIZACIÓN:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar que el usuario tenga rol admin en Supabase');
    console.log('2. Confirmar que las variables de entorno estén configuradas');
    console.log('3. Verificar conectividad con Clerk API');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  findUserInSupabase,
  findUserInClerk,
  updateClerkMetadata,
  updateSupabaseClerkId,
  verifySyncronization
};
