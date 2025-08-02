#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - ACTUALIZAR METADATA CLERK
 * Actualiza metadata de usuario en Clerk usando API REST
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔄 ACTUALIZADOR METADATA CLERK - PINTEYA E-COMMERCE');
console.log('Actualizando metadata de usuario en Clerk...\n');

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
 * Hace una request a la API de Clerk
 */
function makeClerkRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData ? JSON.parse(responseData) : null
          };
          resolve(result);
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Busca usuario en Clerk por email
 */
async function findClerkUserByEmail(email) {
  console.log(`🔍 Buscando ${email} en Clerk...`);
  
  try {
    const response = await makeClerkRequest(`/users?email_address=${encodeURIComponent(email)}`);
    
    if (response.statusCode !== 200) {
      throw new Error(`Clerk API error: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data || response.data.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`);
    }
    
    const user = response.data[0];
    console.log(`✅ Usuario encontrado en Clerk:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email_addresses[0]?.email_address}`);
    console.log(`   - Rol actual: ${user.public_metadata?.role || user.private_metadata?.role || 'Sin rol'}`);
    
    return user;
  } catch (error) {
    throw new Error(`Error buscando usuario en Clerk: ${error.message}`);
  }
}

/**
 * Actualiza metadata del usuario en Clerk
 */
async function updateClerkUserMetadata(userId, metadata) {
  console.log(`🔄 Actualizando metadata para usuario ${userId}...`);
  
  try {
    const response = await makeClerkRequest(`/users/${userId}/metadata`, 'PATCH', metadata);
    
    if (response.statusCode !== 200) {
      throw new Error(`Error actualizando metadata: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    
    console.log('✅ Metadata actualizada exitosamente en Clerk');
    console.log(`   - Public role: ${response.data.public_metadata?.role}`);
    console.log(`   - Private role: ${response.data.private_metadata?.role}`);
    
    return response.data;
  } catch (error) {
    throw new Error(`Error actualizando metadata: ${error.message}`);
  }
}

/**
 * Busca usuario en Supabase
 */
async function findSupabaseUser(email) {
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
 * Función principal
 */
async function main() {
  try {
    const email = 'santiago@xor.com.ar';
    
    console.log('🚀 Iniciando actualización de metadata...\n');
    
    // Paso 1: Buscar usuario en Supabase
    const supabaseUser = await findSupabaseUser(email);
    
    // Verificar que sea admin
    if (supabaseUser.user_roles?.role_name !== 'admin') {
      throw new Error(`Usuario ${email} no tiene rol admin en Supabase (rol actual: ${supabaseUser.user_roles?.role_name})`);
    }
    
    // Paso 2: Buscar usuario en Clerk
    const clerkUser = await findClerkUserByEmail(email);
    
    // Paso 3: Verificar si ya está configurado
    const currentRole = clerkUser.public_metadata?.role || clerkUser.private_metadata?.role;
    if (currentRole === 'admin') {
      console.log('✅ El usuario ya tiene rol admin en Clerk');
      console.log('🎯 No se requieren cambios');
      return;
    }
    
    // Paso 4: Preparar metadata
    const metadata = {
      public_metadata: {
        ...clerkUser.public_metadata,
        role: 'admin',
        supabase_user_id: supabaseUser.id,
        last_sync: new Date().toISOString()
      },
      private_metadata: {
        ...clerkUser.private_metadata,
        role: 'admin',
        permissions: supabaseUser.user_roles?.permissions || {},
        supabase_role_id: supabaseUser.role_id,
        role_name: supabaseUser.user_roles?.role_name,
        last_sync: new Date().toISOString()
      }
    };
    
    // Paso 5: Actualizar metadata
    await updateClerkUserMetadata(clerkUser.id, metadata);
    
    // Paso 6: Actualizar clerk_user_id en Supabase si es necesario
    if (!supabaseUser.clerk_user_id || supabaseUser.clerk_user_id !== clerkUser.id) {
      console.log('🔄 Actualizando clerk_user_id en Supabase...');
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          clerk_user_id: clerkUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', supabaseUser.id);
      
      if (error) {
        console.error(`❌ Error actualizando clerk_user_id: ${error.message}`);
      } else {
        console.log('✅ clerk_user_id actualizado en Supabase');
      }
    }
    
    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!');
    console.log(`👑 ${email} ahora tiene rol admin en Clerk`);
    
    console.log('\n📋 Próximos pasos:');
    console.log('1. Hacer logout y login en la aplicación');
    console.log('2. Verificar acceso al panel admin');
    console.log('3. Los cambios pueden tardar 1-2 minutos en propagarse');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA ACTUALIZACIÓN:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar que el usuario tenga rol admin en Supabase');
    console.log('2. Confirmar que CLERK_SECRET_KEY esté configurado correctamente');
    console.log('3. Verificar conectividad con la API de Clerk');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  findClerkUserByEmail,
  updateClerkUserMetadata,
  findSupabaseUser,
  makeClerkRequest
};
