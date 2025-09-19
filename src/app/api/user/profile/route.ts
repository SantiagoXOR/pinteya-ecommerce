// ===================================
// PINTEYA E-COMMERCE - API DE PERFIL DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';
import { logProfileActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import {
  withRateLimit,
  RATE_LIMIT_CONFIGS
} from '@/lib/rate-limiting/rate-limiter';
import {
  API_TIMEOUTS,
  withDatabaseTimeout,
  getEndpointTimeouts
} from '@/lib/config/api-timeouts';
import { createSecurityLogger } from '@/lib/logging/security-logger';

// ===================================
// GET - Obtener perfil de usuario
// ===================================
export async function GET(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request);

  // Aplicar rate limiting para APIs de usuario
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.auth,
    async () => {
      // Log de acceso a la API
      securityLogger.logEvent('api_access', 'low', {
        endpoint: '/api/user/profile',
        method: 'GET',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      try {
        // Verificar que el cliente administrativo esté disponible
        if (!supabaseAdmin) {
          console.error('Cliente administrativo de Supabase no disponible en GET /api/user/profile');

          // Log de error de seguridad
          securityLogger.logEvent('service_unavailable', 'high', {
            service: 'supabase_admin',
            endpoint: '/api/user/profile'
          });

          return NextResponse.json(
            { error: 'Servicio de base de datos no disponible' },
            { status: 503 }
          );
        }

        // Autenticación con Clerk
        const session = await auth();
        if (!session?.user) {
          // Log de intento de acceso no autorizado
          securityLogger.logEvent('unauthorized_access', 'medium', {
            endpoint: '/api/user/profile',
            reason: 'no_session'
          });

          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Usuario no autenticado',
          };
          return NextResponse.json(errorResponse, { status: 401 });
        }

        // Buscar usuario en Supabase
        const userId = session.user.id;
        const { data: user, error } = await withDatabaseTimeout(
          supabaseAdmin
            .from('users')
            .select('*')
            .eq('clerk_id', userId)
            .single(),
          API_TIMEOUTS.database
        );

        if (error && error.code !== 'PGRST116') {
          console.error('Error al obtener usuario:', error);

          // Log de error de base de datos
          securityLogger.logEvent('database_error', 'medium', {
            error: error.message,
            endpoint: '/api/user/profile',
            operation: 'select_user',
            userId: userId
          });

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

        // Log de operación exitosa
        securityLogger.logEvent('user_profile_retrieved', 'low', {
          userId: userId,
          hasUser: !!user
        });

        return NextResponse.json({
          success: true,
          user,
        });

      } catch (error) {
        console.error('Error en GET /api/user/profile:', error);

        // Log de error de seguridad
        securityLogger.logEvent('api_error', 'high', {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/api/user/profile',
          stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        );
      }
    }
  );

  // Manejar rate limit excedido
  if (rateLimitResult instanceof NextResponse) {
    securityLogger.logRateLimitExceeded(
      securityLogger.context,
      { endpoint: '/api/user/profile', method: 'GET' }
    );
    return rateLimitResult;
  }

  return rateLimitResult;
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
    const session = await auth();
    if (!session?.user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json();

    // Validar datos requeridos
    const { name, email, phone } = body;
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
        phone: phone || null,
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

    // Registrar actividad de actualización de perfil
    const requestInfo = getRequestInfo(request);
    await logProfileActivity(
      updatedUser.id,
      'update_profile',
      {
        fields_updated: Object.keys(body),
        previous_name: updatedUser.name !== name ? 'changed' : 'unchanged',
        previous_email: updatedUser.email !== email ? 'changed' : 'unchanged',
        previous_phone: updatedUser.phone !== phone ? 'changed' : 'unchanged',
      },
      requestInfo
    );

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









