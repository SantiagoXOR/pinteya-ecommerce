/**
 * API para sincronizar usuarios entre Clerk y Supabase
 * 
 * ✅ SOLUCIONADO: Error "This module cannot be imported from a Client Component module"
 * Se eliminó la importación problemática de auth() de Clerk y se implementó
 * un enfoque alternativo compatible con Next.js 15
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types/api';

// Verificar configuración de Clerk
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

export async function GET(request: NextRequest) {
  try {

    const url = new URL(request.url);
    const email = url.searchParams.get('email');


    // Verificar configuración básica
    const clerkConfigured = isClerkConfigured();

    if (!clerkConfigured) {
      console.error('Clerk no está configurado correctamente');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de autenticación no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }


    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    if (!email) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Email es requerido como parámetro de consulta',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Buscar usuario en la base de datos
    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();


    if (error) {
      if (error.code === 'PGRST116') {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Usuario no encontrado',
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }
      console.error('Error fetching user:', error);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error al obtener usuario',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const successResponse: ApiResponse<any> = {
      data: { user },
      success: true,
      message: 'Usuario obtenido exitosamente'
    };
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Error en GET sync-user:', error);
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    
    // Verificar configuración básica
    if (!isClerkConfigured()) {
      console.error('Clerk no está configurado correctamente');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de autenticación no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'JSON inválido en el cuerpo de la petición',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { email, firstName, lastName, clerkUserId } = body;


    // Validaciones
    if (!clerkUserId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'clerkUserId es requerido en el cuerpo de la petición',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!email) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Email es requerido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verificar si el usuario ya existe (por email O clerk_user_id)
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .or(`email.eq.${email},clerk_user_id.eq.${clerkUserId}`)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error al verificar usuario',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (existingUser) {
      // Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          clerk_user_id: clerkUserId,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Error al actualizar usuario',
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }

      const successResponse: ApiResponse<any> = {
        data: {
          user: updatedUser,
          action: 'updated'
        },
        success: true,
        message: 'Usuario actualizado exitosamente'
      };
      return NextResponse.json(successResponse);
    } else {
      // Crear nuevo usuario
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          clerk_user_id: clerkUserId,
          email,
          first_name: firstName,
          last_name: lastName,
          is_active: true
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);

        // Manejar error de clave duplicada específicamente
        if (insertError.code === '23505') {
          console.log('Usuario ya existe (clave duplicada), intentando obtener usuario existente...');
          const { data: existingUserRetry, error: retryError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .or(`email.eq.${email},clerk_user_id.eq.${clerkUserId}`)
            .single();

          if (!retryError && existingUserRetry) {
            const successResponse: ApiResponse<any> = {
              data: {
                user: existingUserRetry,
                action: 'found_existing'
              },
              success: true,
              message: 'Usuario encontrado exitosamente'
            };
            return NextResponse.json(successResponse);
          }
        }

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Error al crear usuario',
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }

      const successResponse: ApiResponse<any> = {
        data: {
          user: newUser,
          action: 'created'
        },
        success: true,
        message: 'Usuario creado exitosamente'
      };
      return NextResponse.json(successResponse);
    }

  } catch (error) {
    console.error('Error en POST sync-user:', error);
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
