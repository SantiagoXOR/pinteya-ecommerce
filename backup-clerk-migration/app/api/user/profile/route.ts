// ===================================
// PINTEYA E-COMMERCE - API DE PERFIL DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse } from '@/types/api';

// ===================================
// GET - Obtener perfil de usuario
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/profile');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Autenticación con Clerk
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Buscar usuario en Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener usuario:', error);
      return NextResponse.json(
        { error: 'Error al obtener perfil de usuario' },
        { status: 500 }
      );
    }

    // Si no existe el usuario, crear uno demo
    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            clerk_id: userId,
            email: 'usuario@demo.com',
            name: 'Usuario Demo',
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error al crear usuario demo:', createError);
        return NextResponse.json(
          { error: 'Error al crear perfil de usuario' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: newUser,
      });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error en GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// PUT - Actualizar perfil de usuario
// ===================================
export async function PUT(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en PUT /api/user/profile');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Autenticación con Clerk
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    const body = await request.json();

    // Validar datos requeridos
    const { name, email } = body;
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    // Actualizar usuario en Supabase
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar usuario:', error);
      return NextResponse.json(
        { error: 'Error al actualizar perfil de usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    console.error('Error en PUT /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
