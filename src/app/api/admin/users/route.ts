/**
 * API de Gestión de Usuarios Enterprise
 * Utiliza las nuevas utilidades enterprise para autenticación y gestión
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkCRUDPermissions, logAdminAction } from '@/lib/auth/admin-auth';
import {
  requireAdminAuth
} from '@/lib/auth/enterprise-auth-utils';
import {
  searchEnterpriseUsers,
  getEnterpriseUser,
  updateEnterpriseUser,
  getUserStatistics
} from '@/lib/auth/enterprise-user-management';
import {
  withCache,
  getCacheStats,
  invalidateUserCache
} from '@/lib/auth/enterprise-cache';

/**
 * GET /api/admin/users
 * Obtener lista de usuarios con información de roles (ENTERPRISE)
 */
export async function GET(request: NextRequest) {
  try {
    // ENTERPRISE: Usar nueva autenticación enterprise
    const authResult = await requireAdminAuth(request, ['user_management', 'user_read']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const { searchParams } = new URL(request.url);

    // ENTERPRISE: Parámetros de búsqueda optimizados
    const searchOptions = {
      query: searchParams.get('search') || undefined,
      role: searchParams.get('role') as 'admin' | 'user' | 'moderator' || undefined,
      isActive: searchParams.get('status') ? searchParams.get('status') === 'active' : undefined,
      limit: parseInt(searchParams.get('pageSize') || '20'),
      offset: (parseInt(searchParams.get('page') || '1') - 1) * parseInt(searchParams.get('pageSize') || '20'),
      sortBy: searchParams.get('sortBy') as 'name' | 'email' | 'createdAt' | 'lastLoginAt' || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
    };

    // ENTERPRISE: Usar cache para búsquedas frecuentes
    const cacheKey = `users_search:${JSON.stringify(searchOptions)}`;

    const result = await withCache(
      cacheKey,
      () => searchEnterpriseUsers(searchOptions, context),
      2 * 60 * 1000 // 2 minutos de cache
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          enterprise: true
        },
        { status: 400 }
      );
    }

    // ENTERPRISE: Obtener estadísticas si se solicitan
    let statistics;
    if (searchParams.get('includeStats') === 'true') {
      statistics = await withCache(
        'user_statistics',
        () => getUserStatistics(context),
        5 * 60 * 1000 // 5 minutos de cache
      );
    }

    // ENTERPRISE: Log access con contexto enterprise
    await logAdminAction(
      context.userId,
      'READ',
      'users',
      'list',
      null,
      {
        searchOptions,
        securityLevel: context.securityLevel,
        permissions: context.permissions
      }
    );

    // ENTERPRISE: Respuesta con formato enterprise
    return NextResponse.json({
      success: true,
      data: {
        users: result.users,
        total: result.total,
        pagination: {
          limit: searchOptions.limit,
          offset: searchOptions.offset,
          page: Math.floor(searchOptions.offset / searchOptions.limit) + 1,
          totalPages: Math.ceil((result.total || 0) / searchOptions.limit),
          hasMore: (result.total || 0) > searchOptions.offset + searchOptions.limit
        },
        statistics,
        cache: {
          stats: getCacheStats(),
          enabled: true
        }
      },
      enterprise: true,
      timestamp: new Date().toISOString(),
      context: {
        userId: context.userId,
        role: context.role,
        securityLevel: context.securityLevel
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Crear nuevo usuario (ENTERPRISE)
 */
export async function POST(request: NextRequest) {
  try {
    // ENTERPRISE: Usar autenticación enterprise para creación de usuarios
    const authResult = await requireAdminAuth(request, ['user_management', 'user_create']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();

    const {
      email,
      first_name,
      last_name,
      role_id,
      password,
      send_invitation = true
    } = body;

    // Validaciones básicas
    if (!email || !role_id) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el rol existe
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', role_id)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Verificar que el email no existe
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Crear usuario en Supabase Auth (si se proporciona contraseña)
    let authUser = null;
    if (password) {
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          role: role.role_name
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: 'Error al crear usuario de autenticación' },
          { status: 500 }
        );
      }

      authUser = newAuthUser.user;
    }

    // Crear perfil de usuario
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        supabase_user_id: authUser?.id || null,
        email,
        first_name,
        last_name,
        role_id,
        is_active: true,
        is_verified: !!authUser,
        metadata: {
          created_by: user.id,
          created_via: 'admin_panel'
        }
      })
      .select(`
        *,
        user_roles (
          id,
          role_name,
          display_name,
          description
        )
      `)
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return NextResponse.json(
        { error: 'Error al crear perfil de usuario' },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      user.id,
      'CREATE',
      'user',
      newProfile.id,
      null,
      newProfile
    );

    // TODO: Enviar invitación por email si send_invitation es true

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        data: newProfile
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
