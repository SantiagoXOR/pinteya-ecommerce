/**
 * Script para corregir el rol de administrador de santiago@xor.com.ar
 * Ejecutar con: node scripts/fix-santiago-admin.js
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');

async function fixSantiagoAdmin() {
  try {
    console.log('🔄 Corrigiendo rol admin para santiago@xor.com.ar...');

    const email = 'santiago@xor.com.ar';

    // 1. Buscar usuario en Clerk
    console.log(`🔍 Buscando usuario ${email} en Clerk...`);
    
    const users = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (users.data.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`);
    }

    const user = users.data[0];
    console.log(`✅ Usuario encontrado: ${user.id}`);
    console.log(`📧 Email: ${user.emailAddresses[0]?.emailAddress}`);
    console.log(`👤 Nombre: ${user.firstName} ${user.lastName}`);

    // 2. Verificar metadata actual
    console.log('\n📋 Metadata actual:');
    console.log('Public metadata:', JSON.stringify(user.publicMetadata, null, 2));
    console.log('Private metadata:', JSON.stringify(user.privateMetadata, null, 2));

    const currentRole = user.publicMetadata?.role || user.privateMetadata?.role;
    console.log(`🎭 Rol actual: ${currentRole || 'undefined'}`);

    if (currentRole === 'admin') {
      console.log('✅ El usuario ya tiene rol admin configurado');
      return;
    }

    // 3. Actualizar metadata
    console.log('\n🔄 Actualizando metadata...');
    
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin'
      },
      privateMetadata: {
        ...user.privateMetadata,
        role: 'admin',
        permissions: {
          admin_access: true,
          monitoring_access: true,
          system_admin: true,
          products_read: true,
          products_create: true,
          products_update: true,
          products_delete: true
        },
        last_sync: new Date().toISOString(),
        updated_by: 'fix_script'
      }
    });

    console.log('✅ Metadata actualizada exitosamente');

    // 4. Verificar cambios
    console.log('\n🔍 Verificando cambios...');
    
    const updatedUser = await clerkClient.users.getUser(user.id);
    console.log('Nueva metadata pública:', JSON.stringify(updatedUser.publicMetadata, null, 2));
    console.log('Nueva metadata privada:', JSON.stringify(updatedUser.privateMetadata, null, 2));

    console.log('\n🎉 ¡Rol admin configurado exitosamente!');
    console.log('💡 Ahora el usuario puede acceder a las APIs enterprise');
    console.log('🔄 Es posible que necesites cerrar sesión y volver a iniciar sesión');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Detalles:', error.errors);
    }
    process.exit(1);
  }
}

// Verificar variables de entorno
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ Error: CLERK_SECRET_KEY no está configurado');
  console.log('💡 Asegúrate de que el archivo .env.local tenga CLERK_SECRET_KEY');
  process.exit(1);
}

// Ejecutar
fixSantiagoAdmin()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
