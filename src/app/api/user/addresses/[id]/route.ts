import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';

type RouteContext = {
  params: {
    id: string;
  };
};

// ===================================
// FUNCIONES HELPER PARA DIRECCIONES PREDETERMINADAS
// ===================================

/**
 * Asegura que el usuario tenga exactamente una dirección predeterminada
 */
async function ensureOneDefaultAddress(userId: string) {
  try {
    console.log('🔍 Verificando direcciones predeterminadas para usuario:', userId);

    // Obtener todas las direcciones predeterminadas del usuario
    const { data: defaultAddresses } = await supabaseAdmin
      .from('user_addresses')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('is_default', true)
      .order('created_at', { ascending: false });

    if (!defaultAddresses) {
      console.log('❌ Error al obtener direcciones predeterminadas');
      return;
    }

    const defaultCount = defaultAddresses.length;
    console.log(`🔍 Encontradas ${defaultCount} direcciones predeterminadas`);

    if (defaultCount === 0) {
      // No hay direcciones predeterminadas, marcar la más reciente
      const { data: allAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (allAddresses && allAddresses.length > 0) {
        console.log('🔄 Marcando dirección más reciente como predeterminada:', allAddresses[0].id);
        await supabaseAdmin
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', allAddresses[0].id);
      }
    } else if (defaultCount > 1) {
      // Hay múltiples direcciones predeterminadas, mantener solo la más reciente
      const keepDefaultId = defaultAddresses[0].id;
      const idsToUpdate = defaultAddresses.slice(1).map(addr => addr.id);

      console.log(`🔄 Desmarcando ${idsToUpdate.length} direcciones predeterminadas duplicadas`);
      console.log('🔄 Manteniendo como predeterminada:', keepDefaultId);

      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .in('id', idsToUpdate);
    } else {
      console.log('✅ Usuario tiene exactamente una dirección predeterminada');
    }
  } catch (error) {
    console.error('❌ Error en ensureOneDefaultAddress:', error);
  }
}

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
    const session = await auth();
    if (!session?.user) {
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

    if (!session?.user) {
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
    const session = await auth();
    if (!session?.user) {
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
    const {
      name,
      street,
      city,
      postal_code,
      state,
      country,
      is_default,
      latitude,
      longitude,
      validation_status
    } = body;

    if (!name || !street || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Nombre, dirección, ciudad y código postal son requeridos' },
        { status: 400 }
      );
    }

    // Obtener usuario
    const userId = session.user.id;
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
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
    const updateData: any = {
      name,
      street,
      city,
      state: state || '',
      postal_code,
      country: country || 'Argentina',
      is_default: is_default || false,
      updated_at: new Date().toISOString(),
    };

    // Incluir campos de validación si están presentes
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (validation_status !== undefined) updateData.validation_status = validation_status;

    const { data: updatedAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .update(updateData)
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
    const session = await auth();
    if (!session?.user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    const addressId = params.id;

    // Obtener usuario
    console.log('🔍 DELETE - Buscando usuario con id:', session.user.id);
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();

    console.log('🔍 DELETE - Usuario encontrado:', user);
    console.log('🔍 DELETE - Error de usuario:', userError);

    if (!user) {
      console.log('❌ DELETE - Usuario no encontrado en la base de datos');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    console.log('🔍 DELETE - Buscando dirección:', { addressId, userId: user.id });
    const { data: existingAddress, error: addressError } = await supabaseAdmin
      .from('user_addresses')
      .select('id, is_default')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    console.log('🔍 DELETE - Dirección encontrada:', existingAddress);
    console.log('🔍 DELETE - Error de dirección:', addressError);

    if (!existingAddress) {
      console.log('❌ DELETE - Dirección no encontrada o no pertenece al usuario');
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si se está eliminando la única dirección predeterminada
    const wasDefault = existingAddress.is_default;

    // Eliminar dirección
    console.log('🗑️ DELETE - Eliminando dirección:', addressId);
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('❌ DELETE - Error al eliminar dirección:', error);
      return NextResponse.json(
        { error: 'Error al eliminar dirección' },
        { status: 500 }
      );
    }

    // Si se eliminó la dirección predeterminada, marcar otra como predeterminada
    if (wasDefault) {
      console.log('🔄 DELETE - Se eliminó la dirección predeterminada, buscando otra para marcar');

      // Buscar la dirección más reciente del usuario para marcarla como predeterminada
      const { data: remainingAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (remainingAddresses && remainingAddresses.length > 0) {
        const newDefaultId = remainingAddresses[0].id;
        console.log('🔄 DELETE - Marcando dirección como nueva predeterminada:', newDefaultId);

        await supabaseAdmin
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', newDefaultId);
      }
    }

    console.log('✅ DELETE - Dirección eliminada exitosamente:', addressId);

    // Asegurar que el usuario tenga exactamente una dirección predeterminada
    await ensureOneDefaultAddress(user.id);

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
