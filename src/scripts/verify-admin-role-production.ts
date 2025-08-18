// ===================================
// PINTEYA E-COMMERCE - VERIFICACIÓN DE ROLES ADMIN EN PRODUCCIÓN
// ===================================

const { createClerkClient } = require('@clerk/nextjs/server');

/**
 * Script para verificar que la cuenta admin tenga los roles correctos
 * en Clerk para resolver el error 401 en /admin/monitoring
 */

const ADMIN_EMAIL = 'santiago@xor.com.ar';

async function verifyAdminRole() {
  try {
    console.log('🔍 Verificando configuración de roles admin en Clerk...');
    
    // Verificar variables de entorno
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error('❌ CLERK_SECRET_KEY no está configurada');
      return;
    }
    
    console.log('✅ CLERK_SECRET_KEY configurada');
    
    // Crear cliente de Clerk
    const clerkClient = createClerkClient({
      secretKey: clerkSecretKey
    });
    
    // Buscar usuario por email
    console.log(`🔍 Buscando usuario: ${ADMIN_EMAIL}`);
    const users = await clerkClient.users.getUserList({
      emailAddress: [ADMIN_EMAIL]
    });
    
    if (users.data.length === 0) {
      console.error(`❌ Usuario ${ADMIN_EMAIL} no encontrado en Clerk`);
      return;
    }
    
    const user = users.data[0];
    console.log(`✅ Usuario encontrado: ${user.id}`);
    
    // Verificar metadata
    console.log('\n📋 Verificando metadata del usuario:');
    console.log('Public Metadata:', JSON.stringify(user.publicMetadata, null, 2));
    console.log('Private Metadata:', JSON.stringify(user.privateMetadata, null, 2));
    
    // Verificar roles
    const publicRole = user.publicMetadata?.role as string;
    const privateRole = user.privateMetadata?.role as string;
    const isAdmin = publicRole === 'admin' || privateRole === 'admin';
    
    console.log('\n🔐 Verificación de roles:');
    console.log(`Public Role: ${publicRole || 'No configurado'}`);
    console.log(`Private Role: ${privateRole || 'No configurado'}`);
    console.log(`Es Admin: ${isAdmin ? '✅ SÍ' : '❌ NO'}`);
    
    if (!isAdmin) {
      console.log('\n🛠️ SOLUCIÓN REQUERIDA:');
      console.log('El usuario no tiene rol de admin configurado.');
      console.log('Configurar en Clerk Dashboard:');
      console.log('1. Ir a dashboard.clerk.com');
      console.log('2. Seleccionar el usuario santiago@xor.com.ar');
      console.log('3. En la sección "Metadata", agregar:');
      console.log('   Public Metadata: { "role": "admin" }');
      console.log('   O Private Metadata: { "role": "admin" }');
      
      // Intentar configurar automáticamente (solo si tenemos permisos)
      try {
        console.log('\n🔧 Intentando configurar rol automáticamente...');
        await clerkClient.users.updateUser(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            role: 'admin'
          }
        });
        console.log('✅ Rol admin configurado automáticamente en publicMetadata');
      } catch (updateError) {
        console.warn('⚠️ No se pudo configurar automáticamente:', updateError.message);
        console.log('Configurar manualmente en Clerk Dashboard');
      }
    } else {
      console.log('\n✅ CONFIGURACIÓN CORRECTA');
      console.log('El usuario tiene rol de admin configurado correctamente');
    }
    
    // Verificar sesiones activas
    console.log('\n📱 Verificando sesiones activas:');
    const sessions = await clerkClient.sessions.getSessionList({
      userId: user.id
    });
    
    console.log(`Sesiones activas: ${sessions.data.length}`);
    sessions.data.forEach((session, index) => {
      console.log(`Sesión ${index + 1}: ${session.id} - Status: ${session.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando roles admin:', error);
    
    if (error.message.includes('401')) {
      console.log('\n🔑 Error de autenticación:');
      console.log('Verificar que CLERK_SECRET_KEY sea correcta para producción');
    }
    
    if (error.message.includes('403')) {
      console.log('\n🚫 Error de permisos:');
      console.log('La clave de Clerk no tiene permisos para modificar usuarios');
    }
  }
}

// Función para verificar configuración de variables de entorno
function verifyEnvironmentConfig() {
  console.log('\n🌍 Verificando configuración de entorno:');
  
  const requiredVars = [
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let allConfigured = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Configurada (${value.substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${varName}: NO CONFIGURADA`);
      allConfigured = false;
    }
  });
  
  if (!allConfigured) {
    console.log('\n⚠️ Variables de entorno faltantes detectadas');
    console.log('Verificar configuración en Vercel Dashboard o .env.local');
  }
  
  return allConfigured;
}

// Ejecutar verificación
async function main() {
  console.log('🚀 PINTEYA E-COMMERCE - Verificación de Roles Admin');
  console.log('================================================\n');
  
  // Verificar variables de entorno
  const envOk = verifyEnvironmentConfig();
  
  if (envOk) {
    // Verificar roles de admin
    await verifyAdminRole();
  }
  
  console.log('\n================================================');
  console.log('✅ Verificación completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { verifyAdminRole, verifyEnvironmentConfig };
