// ===================================
// PINTEYA E-COMMERCE - API DE DIRECCIONES DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';

// ===================================
// GET - Obtener direcciones del usuario
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/addresses');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Autenticación con Clerk
    const session = await auth();
    if (!session?.user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Obtener usuario primero
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener direcciones del usuario
    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener direcciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener direcciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      addresses: addresses || [],
    });
  } catch (error) {
    console.error('Error en GET /api/user/addresses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Crear nueva dirección
// ===================================
export async function POST(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en POST /api/user/addresses');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Autenticación con Clerk
    const session = await auth();
    if (!session?.user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si es dirección por defecto, quitar el default de las otras
    if (is_default) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Crear nueva dirección
    const { data: newAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .insert([
        {
          user_id: user.id,
          name,
          street,
          city,
          state: state || '',
          postal_code,
          country: country || 'Argentina',
          is_default: is_default || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear dirección:', error);
      return NextResponse.json(
        { error: 'Error al crear dirección' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: newAddress,
      message: 'Dirección creada correctamente',
    });
  } catch (error) {
    console.error('Error en POST /api/user/addresses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
