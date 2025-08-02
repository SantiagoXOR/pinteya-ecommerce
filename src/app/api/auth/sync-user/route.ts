/**
 * API para sincronizar usuarios entre Clerk y Supabase
 * Versión mejorada con servicio de sincronización robusto
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types/api';
import {
  syncUserToSupabase,
  syncUserFromClerk,
  bulkSyncUsersFromClerk,
  type ClerkUserData,
  type SyncOptions
} from '@/lib/auth/user-sync-service';
import { getAuthenticatedUser } from '@/lib/auth/admin-auth';

// Verificar configuración de Clerk
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

/**
 * GET /api/auth/sync-user
 * Obtiene información de sincronización de un usuario
 * Parámetros: email, clerkUserId, action (get|sync|bulk)
 */
export async function GET(request: NextRequest) {
  console.log('[SYNC-USER API] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');

  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API temporalmente deshabilitada para evitar recursión',
  };
  return NextResponse.json(disabledResponse, { status: 503 });

  // CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
  // try {
  //   const url = new URL(request.url);
  //   const email = url.searchParams.get('email');
  //   const clerkUserId = url.searchParams.get('clerkUserId');
  //   const action = url.searchParams.get('action') || 'get';

  //   // Verificar configuración básica
  //   if (!isClerkConfigured()) {
  //     const errorResponse: ApiResponse<null> = {
  //       data: null,
  //       success: false,
  //       error: 'Servicio de autenticación no disponible',
  //     };
  //     return NextResponse.json(errorResponse, { status: 503 });
  //   }

    if (!supabaseAdmin) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Manejar diferentes acciones
    switch (action) {
      case 'sync':
        // Sincronizar usuario específico desde Clerk
        if (!clerkUserId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'clerkUserId es requerido para sincronización',
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        const syncResult = await syncUserFromClerk(clerkUserId, {
          retryAttempts: 2,
          logEvents: true
        });

        const syncResponse: ApiResponse<any> = {
          data: syncResult,
          success: syncResult.success,
          message: syncResult.success ? 'Usuario sincronizado exitosamente' : 'Error en sincronización'
        };
        return NextResponse.json(syncResponse, {
          status: syncResult.success ? 200 : 500
        });

      case 'bulk':
        // Verificar permisos de admin para sincronización masiva
        try {
          const authResult = await getAuthenticatedUser(request);
          if (!authResult.userId) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'Autenticación requerida para sincronización masiva',
            };
            return NextResponse.json(errorResponse, { status: 401 });
          }
        } catch (authError) {
          console.warn('[SYNC] No se pudo verificar autenticación para bulk sync');
        }

        const batchSize = parseInt(url.searchParams.get('batchSize') || '10');
        const maxUsers = parseInt(url.searchParams.get('maxUsers') || '50');

        const bulkResult = await bulkSyncUsersFromClerk({
          batchSize: Math.min(batchSize, 20), // Límite de seguridad
          maxUsers: Math.min(maxUsers, 100), // Límite de seguridad
          retryAttempts: 1,
          logEvents: false
        });

        const bulkResponse: ApiResponse<any> = {
          data: bulkResult,
          success: bulkResult.success,
          message: `Sincronización masiva: ${bulkResult.successful} exitosos, ${bulkResult.failed} fallidos`
        };
        return NextResponse.json(bulkResponse);

      case 'get':
      default:
        // Obtener usuario existente
        if (!email && !clerkUserId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Email o clerkUserId es requerido',
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        let query = supabaseAdmin
          .from('user_profiles')
          .select(`
            *,
            user_roles (
              id,
              role_name,
              display_name,
              permissions
            )
          `);

        if (email) {
          query = query.eq('email', email);
        } else if (clerkUserId) {
          query = query.eq('clerk_user_id', clerkUserId);
        }

        const { data: user, error } = await query.single();

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
    }
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

/**
 * POST /api/auth/sync-user
 * Sincroniza un usuario específico con datos proporcionados
 * Body: { userData: ClerkUserData, options?: SyncOptions } o { email, firstName, lastName, clerkUserId }
 */
export async function POST(request: NextRequest) {
  console.log('[SYNC-USER API POST] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');

  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API POST temporalmente deshabilitada para evitar recursión',
  };
  return NextResponse.json(disabledResponse, { status: 503 });

  // CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
  // try {
  //   // Verificar configuración básica
  //   if (!isClerkConfigured()) {
  //     const errorResponse: ApiResponse<null> = {
  //       data: null,
  //       success: false,
  //       error: 'Servicio de autenticación no disponible',
  //     };
  //     return NextResponse.json(errorResponse, { status: 503 });
  //   }

  //   if (!supabaseAdmin) {
  //     const errorResponse: ApiResponse<null> = {
  //       data: null,
  //       success: false,
  //       error: 'Servicio de base de datos no disponible',
  //     };
  //     return NextResponse.json(errorResponse, { status: 503 });
  //   }

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

    // Soportar tanto el formato nuevo (userData) como el formato legacy
    if (body.userData) {
      // Formato nuevo con servicio de sincronización robusto
      const { userData, options = {} } = body;

      const syncOptions: SyncOptions = {
        retryAttempts: 3,
        retryDelay: 1000,
        validateData: true,
        createMissingRole: true,
        logEvents: true,
        ...options
      };

      const result = await syncUserToSupabase(userData as ClerkUserData, syncOptions);

      if (result.success) {
        const successResponse: ApiResponse<any> = {
          data: result,
          success: true,
          message: `Usuario ${result.action} exitosamente`
        };
        return NextResponse.json(successResponse);
      } else {
        const errorResponse: ApiResponse<any> = {
          data: { error: result.error, details: result.details },
          success: false,
          error: result.error || 'Error al sincronizar usuario',
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }
    }

    // Formato legacy - mantener compatibilidad hacia atrás
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
