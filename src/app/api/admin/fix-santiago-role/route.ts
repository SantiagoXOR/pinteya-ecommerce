/**
 * API para corregir el rol de santiago@xor.com.ar en Clerk
 * Esta API NO está protegida por el middleware para permitir la corrección
 */

import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Corrigiendo rol de santiago@xor.com.ar...');

    const body = await request.json().catch(() => ({}));
    const { email = 'santiago@xor.com.ar' } = body;

    // 1. Verificar usuario en Supabase
    console.log(`🔍 Verificando usuario ${email} en Supabase...`);
    
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
      console.error('❌ Error en Supabase:', supabaseError);
      return NextResponse.json({
        success: false,
        error: `Usuario no encontrado en Supabase: ${supabaseError.message}`
      }, { status: 404 });
    }

    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: `Usuario ${email} no encontrado en Supabase`
      }, { status: 404 });
    }

    console.log(`✅ Usuario encontrado en Supabase con rol: ${userProfile.user_roles?.role_name}`);

    if (userProfile.user_roles?.role_name !== 'admin') {
      return NextResponse.json({
        success: false,
        error: `Usuario ${email} no tiene rol admin en Supabase (rol actual: ${userProfile.user_roles?.role_name})`
      }, { status: 400 });
    }

    // 2. Buscar usuario en Clerk
    console.log(`🔍 Buscando usuario ${email} en Clerk...`);

    // Intentar obtener el cliente de Clerk
    let client;
    try {
      client = await clerkClient();
    } catch (error) {
      // Si falla como función, usar directamente
      client = clerkClient;
    }

    if (!client || !client.users) {
      throw new Error('Cliente de Clerk no disponible o no configurado correctamente');
    }

    const clerkUsers = await client.users.getUserList({
      emailAddress: [email]
    });

    if (clerkUsers.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Usuario ${email} no encontrado en Clerk`
      }, { status: 404 });
    }

    const clerkUser = clerkUsers.data[0];
    console.log(`✅ Usuario encontrado en Clerk: ${clerkUser.id}`);

    // 3. Verificar rol actual en Clerk
    const currentRole = clerkUser.publicMetadata?.role || clerkUser.privateMetadata?.role;
    console.log(`📋 Rol actual en Clerk: ${currentRole || 'undefined'}`);

    if (currentRole === 'admin') {
      return NextResponse.json({
        success: true,
        message: `Usuario ${email} ya tiene rol admin en Clerk`,
        details: {
          clerkUserId: clerkUser.id,
          currentRole: currentRole,
          action: 'no_change_needed'
        }
      });
    }

    // 4. Actualizar metadata en Clerk
    console.log(`🔄 Actualizando rol a 'admin' en Clerk...`);

    const updatedUser = await client.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: 'admin'
      },
      privateMetadata: {
        ...clerkUser.privateMetadata,
        role: 'admin',
        permissions: {
          admin_access: true,
          monitoring_access: true,
          system_admin: true,
          products_read: true,
          products_create: true,
          products_update: true,
          products_delete: true,
          ...userProfile.user_roles?.permissions
        },
        supabase_role_id: userProfile.role_id,
        last_sync: new Date().toISOString(),
        updated_by: 'fix_role_api'
      }
    });

    console.log(`✅ Metadata actualizada exitosamente en Clerk`);

    // 5. Actualizar clerk_user_id en Supabase si es necesario
    if (!userProfile.clerk_user_id) {
      console.log(`🔄 Actualizando clerk_user_id en Supabase...`);
      
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          clerk_user_id: clerkUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error(`⚠️ Error actualizando clerk_user_id: ${updateError.message}`);
      } else {
        console.log(`✅ clerk_user_id actualizado en Supabase`);
      }
    }

    // 6. Verificar cambios
    const verificationUser = await client.users.getUser(clerkUser.id);
    const newRole = verificationUser.publicMetadata?.role;

    console.log(`🎉 Rol corregido exitosamente: ${newRole}`);

    return NextResponse.json({
      success: true,
      message: `Rol admin configurado exitosamente para ${email}`,
      details: {
        clerkUserId: clerkUser.id,
        email: email,
        previousRole: currentRole || 'undefined',
        newRole: newRole,
        supabaseRoleId: userProfile.role_id,
        action: 'role_updated',
        timestamp: new Date().toISOString(),
        nextSteps: [
          'Cerrar sesión en Clerk',
          'Volver a iniciar sesión',
          'Probar acceso a APIs enterprise',
          'Verificar dashboard enterprise'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error en API fix-santiago-role:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      details: {
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'API para corregir rol de santiago@xor.com.ar',
      description: 'Sincroniza el rol admin desde Supabase hacia Clerk metadata',
      usage: {
        method: 'POST',
        body: {
          email: 'santiago@xor.com.ar (opcional)'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
