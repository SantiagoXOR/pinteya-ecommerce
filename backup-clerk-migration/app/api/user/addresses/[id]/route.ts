import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse } from '@/types/api';

type RouteContext = {
  params: {
    id: string;
  };
};

// ===================================
// GET - Obtener una dirección específica
// ===================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteContext['params']> }
) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/addresses/[id]');
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
    const params = await context.params;
    const addressId = params.id;

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener dirección
    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error al obtener dirección:', error);
      return NextResponse.json(
        { error: 'Error al obtener dirección' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address,
    });
  } catch (error) {
    console.error('Error en GET /api/user/addresses/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// PUT - Actualizar dirección
// ===================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<RouteContext['params']> }
) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en PUT /api/user/addresses/[id]');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    const params = await context.params;

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
    const addressId = params.id;
    const body = await request.json();

    // Validar datos requeridos
    const { name, street, city, postal_code, state, country, is_default } = body;
    if (!name || !street || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Nombre, dirección, ciudad y código postal son requeridos' },
        { status: 400 }
      );
    }

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const { data: existingAddress } = await supabaseAdmin
      .from('user_addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Si es dirección por defecto, quitar el default de las otras
    if (is_default) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', addressId);
    }

    // Actualizar dirección
    const { data: updatedAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .update({
        name,
        street,
        city,
        state: state || '',
        postal_code,
        country: country || 'Argentina',
        is_default: is_default || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar dirección:', error);
      return NextResponse.json(
        { error: 'Error al actualizar dirección' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: 'Dirección actualizada correctamente',
    });
  } catch (error) {
    console.error('Error en PUT /api/user/addresses/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// DELETE - Eliminar dirección
// ===================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en DELETE /api/user/addresses/[id]');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    const params = await context.params;

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
    const addressId = params.id;

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const { data: existingAddress } = await supabaseAdmin
      .from('user_addresses')
      .select('id, is_default')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar dirección
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Error al eliminar dirección:', error);
      return NextResponse.json(
        { error: 'Error al eliminar dirección' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dirección eliminada correctamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/user/addresses/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
