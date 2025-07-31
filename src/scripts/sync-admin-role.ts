/**
 * Script para sincronizar roles de Supabase hacia Clerk
 * Soluciona el problema donde santiago@xor.com.ar tiene rol admin en Supabase
 * pero no en Clerk metadata
 */

import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

interface UserProfile {
  id: number;
  clerk_user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: number;
  is_active: boolean;
  user_roles: {
    role_name: string;
    permissions: any;
  } | null;
}

async function syncAdminRole() {
  try {
    console.log('🔄 Iniciando sincronización de roles admin...');

    // 1. Obtener usuarios admin de Supabase
    const { data: adminUsers, error: supabaseError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        user_roles (
          role_name,
          permissions
        )
      `)
      .eq('user_roles.role_name', 'admin')
      .eq('is_active', true);

    if (supabaseError) {
      throw new Error(`Error obteniendo usuarios admin de Supabase: ${supabaseError.message}`);
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No se encontraron usuarios admin en Supabase');
      return;
    }

    console.log(`✅ Encontrados ${adminUsers.length} usuarios admin en Supabase`);

    // 2. Procesar cada usuario admin
    for (const user of adminUsers as UserProfile[]) {
      console.log(`\n🔍 Procesando usuario: ${user.email}`);

      // 3. Buscar usuario en Clerk por email
      try {
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [user.email]
        });

        if (clerkUsers.data.length === 0) {
          console.log(`⚠️  Usuario ${user.email} no encontrado en Clerk`);
          continue;
        }

        const clerkUser = clerkUsers.data[0];
        console.log(`✅ Usuario encontrado en Clerk: ${clerkUser.id}`);

        // 4. Verificar metadata actual
        const currentRole = clerkUser.publicMetadata?.role || clerkUser.privateMetadata?.role;
        console.log(`📋 Rol actual en Clerk: ${currentRole || 'undefined'}`);

        if (currentRole === 'admin') {
          console.log(`✅ Usuario ${user.email} ya tiene rol admin en Clerk`);
          continue;
        }

        // 5. Actualizar metadata en Clerk
        console.log(`🔄 Actualizando rol a 'admin' para ${user.email}...`);
        
        await clerkClient.users.updateUserMetadata(clerkUser.id, {
          publicMetadata: {
            ...clerkUser.publicMetadata,
            role: 'admin'
          },
          privateMetadata: {
            ...clerkUser.privateMetadata,
            role: 'admin',
            permissions: user.user_roles?.permissions || {},
            supabase_role_id: user.role_id,
            last_sync: new Date().toISOString()
          }
        });

        console.log(`✅ Rol actualizado exitosamente para ${user.email}`);

        // 6. Actualizar clerk_user_id en Supabase si es necesario
        if (!user.clerk_user_id) {
          console.log(`🔄 Actualizando clerk_user_id en Supabase...`);
          
          const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({
              clerk_user_id: clerkUser.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Error actualizando clerk_user_id: ${updateError.message}`);
          } else {
            console.log(`✅ clerk_user_id actualizado en Supabase`);
          }
        }

      } catch (clerkError) {
        console.error(`❌ Error procesando usuario ${user.email} en Clerk:`, clerkError);
      }
    }

    console.log('\n🎉 Sincronización completada');

  } catch (error) {
    console.error('❌ Error en sincronización de roles:', error);
    throw error;
  }
}

// Función específica para santiago@xor.com.ar
async function syncSantiagoAdmin() {
  try {
    console.log('🔄 Sincronizando rol admin para santiago@xor.com.ar...');

    const email = 'santiago@xor.com.ar';

    // 1. Verificar en Supabase
    const { data: userProfile, error: supabaseError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        user_roles (
          role_name,
          permissions
        )
      `)
      .eq('email', email)
      .single();

    if (supabaseError) {
      throw new Error(`Error obteniendo usuario de Supabase: ${supabaseError.message}`);
    }

    if (!userProfile) {
      throw new Error(`Usuario ${email} no encontrado en Supabase`);
    }

    console.log(`✅ Usuario encontrado en Supabase con rol: ${userProfile.user_roles?.role_name}`);

    // 2. Buscar en Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (clerkUsers.data.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`);
    }

    const clerkUser = clerkUsers.data[0];
    console.log(`✅ Usuario encontrado en Clerk: ${clerkUser.id}`);

    // 3. Actualizar metadata
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: 'admin'
      },
      privateMetadata: {
        ...clerkUser.privateMetadata,
        role: 'admin',
        permissions: userProfile.user_roles?.permissions || {},
        supabase_role_id: userProfile.role_id,
        last_sync: new Date().toISOString()
      }
    });

    console.log(`✅ Rol admin configurado exitosamente para ${email}`);

    // 4. Actualizar clerk_user_id en Supabase
    if (!userProfile.clerk_user_id) {
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          clerk_user_id: clerkUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error(`❌ Error actualizando clerk_user_id: ${updateError.message}`);
      } else {
        console.log(`✅ clerk_user_id actualizado en Supabase`);
      }
    }

    return {
      success: true,
      message: `Rol admin sincronizado exitosamente para ${email}`
    };

  } catch (error) {
    console.error('❌ Error sincronizando santiago admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncSantiagoAdmin()
    .then((result) => {
      if (result.success) {
        console.log('🎉', result.message);
        process.exit(0);
      } else {
        console.error('❌', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { syncAdminRole, syncSantiagoAdmin };
