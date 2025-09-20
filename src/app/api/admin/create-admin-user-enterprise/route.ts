// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API Enterprise para crear usuario administrador
 * Refactorizada con utilidades enterprise + RLS + validaciones robustas
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { 
  requireCriticalAuth 
} from '@/lib/auth/enterprise-auth-utils';
import {
  executeWithRLS,
  checkRLSPermission
} from '@/lib/auth/enterprise-rls-utils';
import {
  invalidateUserCache
} from '@/lib/auth/enterprise-cache';

export async function POST(request: NextRequest) {
  try {
    // ENTERPRISE: Autenticación crítica para operaciones de creación de admin
    const authResult = await requireCriticalAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          operation: 'CREATE_ADMIN_USER'
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // ENTERPRISE: Verificar permisos específicos para crear admins
    if (!context.permissions.includes('admin_create') && context.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Permisos insuficientes para crear usuarios administradores',
          code: 'INSUFFICIENT_PERMISSIONS',
          enterprise: true,
          required_permissions: ['admin_create']
        },
        { status: 403 }
      );
    }

    const { 
      securityKey, 
      email, 
      password, 
      firstName = 'Admin', 
      lastName = 'User',
      permissions = ['admin_access', 'user_management', 'products_create', 'products_update', 'products_delete']
    } = await request.json();

    // ENTERPRISE: Validación de clave de seguridad
    if (securityKey !== 'CREATE_ADMIN_PINTEYA_ENTERPRISE_2025') {
      return NextResponse.json(
        { 
          error: 'Clave de seguridad enterprise incorrecta',
          code: 'INVALID_SECURITY_KEY',
          enterprise: true
        },
        { status: 403 }
      );
    }

    // ENTERPRISE: Validaciones robustas
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email y contraseña son requeridos',
          code: 'MISSING_REQUIRED_FIELDS',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // ENTERPRISE: Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Formato de email inválido',
          code: 'INVALID_EMAIL_FORMAT',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // ENTERPRISE: Validación de contraseña robusta
    if (password.length < 12) {
      return NextResponse.json(
        { 
          error: 'La contraseña debe tener al menos 12 caracteres para admin',
          code: 'WEAK_PASSWORD',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // ENTERPRISE: Validación de complejidad de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { 
          error: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
          code: 'PASSWORD_COMPLEXITY_FAILED',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // ENTERPRISE: Ejecutar creación con RLS y auditoría
    const result = await executeWithRLS(
      context,
      async (client, rlsContext) => {
        // Verificar permisos RLS específicos
        if (!checkRLSPermission(rlsContext, 'admin_create')) {
          throw new Error('Permisos RLS insuficientes para crear administradores');
        }

        // 1. Verificar si el usuario ya existe en auth.users
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingAuthUser.users.find(u => u.email === email);

        let authUser;

        if (userExists) {
          authUser = userExists;
        } else {
          // 2. Crear usuario en Supabase Auth con metadata enterprise
          const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              role: 'admin',
              created_by: context.userId,
              enterprise_admin: true,
              security_level: 'critical'
            }
          });

          if (authError) {
            throw new Error(`Error creando usuario en Auth: ${authError.message}`);
          }

          authUser = newAuthUser.user;
        }

        // 3. Verificar si el perfil ya existe
        const { data: existingProfile } = await client
          .from('user_profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (existingProfile) {
          // 4. Actualizar perfil existente con datos enterprise
          const { data: updatedProfile, error: updateError } = await client
            .from('user_profiles')
            .update({
              supabase_user_id: authUser.id,
              first_name: firstName,
              last_name: lastName,
              permissions: permissions,
              metadata: {
                ...existingProfile.metadata,
                updated_by: context.userId,
                enterprise_admin: true,
                last_admin_update: new Date().toISOString()
              },
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
            throw new Error(`Error actualizando perfil: ${updateError.message}`);
          }

          return {
            action: 'updated',
            authUser,
            profile: updatedProfile
          };
        } else {
          // 5. Obtener rol de admin
          const { data: adminRole } = await client
            .from('user_roles')
            .select('id')
            .eq('role_name', 'admin')
            .single();

          if (!adminRole) {
            throw new Error('Rol de admin no encontrado en la base de datos');
          }

          // 6. Crear nuevo perfil enterprise
          const { data: newProfile, error: profileError } = await client
            .from('user_profiles')
            .insert({
              supabase_user_id: authUser.id,
              email,
              first_name: firstName,
              last_name: lastName,
              role_id: adminRole.id,
              permissions: permissions,
              is_active: true,
              is_verified: true,
              metadata: {
                created_by: context.userId,
                enterprise_admin: true,
                security_level: 'critical',
                created_via: 'enterprise_api'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
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
            throw new Error(`Error creando perfil: ${profileError.message}`);
          }

          return {
            action: 'created',
            authUser,
            profile: newProfile
          };
        }
      },
      {
        enforceRLS: true,
        auditLog: true,
        adminOverride: true // Permitir bypass RLS para esta operación crítica
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          code: result.code,
          enterprise: true,
          rls: true
        },
        { status: 400 }
      );
    }

    const { action, authUser, profile } = result.data!;

    // ENTERPRISE: Invalidar cache relacionado
    invalidateUserCache(authUser.id);

    // ENTERPRISE: Respuesta enterprise con información completa
    return NextResponse.json({
      success: true,
      message: `Usuario administrador ${action === 'created' ? 'creado' : 'actualizado'} correctamente`,
      data: {
        action,
        user: {
          auth_id: authUser.id,
          email: authUser.email,
          profile: {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            role: profile.user_roles?.role_name,
            permissions: profile.permissions,
            is_active: profile.is_active,
            created_at: profile.created_at
          }
        }
      },
      enterprise: {
        security_level: 'critical',
        rls_enabled: true,
        created_by: context.userId,
        permissions_granted: permissions
      },
      timestamp: new Date().toISOString()
    }, { status: action === 'created' ? 201 : 200 });

  } catch (error) {
    console.error('[ENTERPRISE] Error en create-admin-user-enterprise:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor enterprise',
        code: 'INTERNAL_SERVER_ERROR',
        enterprise: true
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API Enterprise para crear usuario administrador',
    enterprise: true,
    instructions: {
      method: 'POST',
      required_fields: ['securityKey', 'email', 'password'],
      optional_fields: ['firstName', 'lastName', 'permissions'],
      security_key: 'CREATE_ADMIN_PINTEYA_ENTERPRISE_2025',
      password_requirements: {
        min_length: 12,
        must_contain: ['uppercase', 'lowercase', 'numbers', 'special_chars']
      }
    },
    features: [
      'Enterprise authentication with critical security level',
      'Row Level Security (RLS) enforcement',
      'Robust password validation',
      'Audit logging',
      'Cache invalidation',
      'Comprehensive error handling'
    ]
  });
}










