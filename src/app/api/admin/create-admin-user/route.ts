/**
 * API para crear el usuario administrador en Supabase Auth
 * Solo debe ejecutarse una vez para configurar el sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Verificar que se proporcione una clave de seguridad
    const body = await request.json();
    const { securityKey, email, password } = body;

    // Clave de seguridad simple para evitar ejecución accidental
    if (securityKey !== 'CREATE_ADMIN_PINTEYA_2025') {
      return NextResponse.json(
        { error: 'Clave de seguridad incorrecta' },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe en auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const userExists = existingAuthUser.users.find(u => u.email === email);

    let authUser;

    if (userExists) {
      authUser = userExists;
    } else {
      // Crear usuario en Supabase Auth
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          first_name: 'Santiago',
          last_name: 'Admin',
          role: 'admin'
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: 'Error al crear usuario en Auth: ' + authError.message },
          { status: 500 }
        );
      }

      authUser = newAuthUser.user;
    }

    // Verificar si el perfil ya existe
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Actualizar el perfil existente con el supabase_user_id
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          supabase_user_id: authUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select(`
          *,
          user_roles (
            role_name,
            permissions
          )
        `)
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar perfil: ' + updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario administrador actualizado correctamente',
        user: {
          auth_id: authUser.id,
          email: authUser.email,
          profile: updatedProfile
        }
      });
    } else {
      // Crear nuevo perfil (esto no debería pasar si ya ejecutamos el script anterior)
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', 'admin')
        .single();

      if (!adminRole) {
        return NextResponse.json(
          { error: 'Rol de admin no encontrado' },
          { status: 500 }
        );
      }

      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          supabase_user_id: authUser.id,
          email,
          first_name: 'Santiago',
          last_name: 'Admin',
          role_id: adminRole.id,
          is_active: true,
          metadata: { created_by: 'admin_setup', is_super_admin: true }
        })
        .select(`
          *,
          user_roles (
            role_name,
            permissions
          )
        `)
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Error al crear perfil: ' + profileError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario administrador creado correctamente',
        user: {
          auth_id: authUser.id,
          email: authUser.email,
          profile: newProfile
        }
      });
    }
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para crear usuario administrador',
    instructions: 'Usar POST con securityKey, email y password'
  });
}
