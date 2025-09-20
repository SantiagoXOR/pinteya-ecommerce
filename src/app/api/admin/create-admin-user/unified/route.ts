// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// API Unificada para Creación de Usuario Administrador
// Combina funcionalidad básica y enterprise en un solo endpoint
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
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

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const CreateAdminUserSchema = z.object({
  securityKey: z.string().min(1, 'Clave de seguridad requerida'),
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().default('Admin'),
  lastName: z.string().default('User'),
  permissions: z.array(z.string()).default([
    'admin_access', 
    'user_management', 
    'products_create', 
    'products_update', 
    'products_delete'
  ]),
  mode: z.enum(['basic', 'enterprise']).default('basic'),
  enforceComplexPassword: z.boolean().default(false)
});

type CreateAdminUserRequest = z.infer<typeof CreateAdminUserSchema>;

// ===================================
// CONFIGURACIÓN DE SEGURIDAD
// ===================================

const SECURITY_KEYS = {
  basic: 'CREATE_ADMIN_PINTEYA_2025',
  enterprise: 'CREATE_ADMIN_PINTEYA_ENTERPRISE_2025'
};

const PASSWORD_REQUIREMENTS = {
  basic: {
    minLength: 8,
    requireComplexity: false
  },
  enterprise: {
    minLength: 12,
    requireComplexity: true
  }
};

// ===================================
// UTILIDADES DE VALIDACIÓN
// ===================================

function validatePassword(password: string, mode: 'basic' | 'enterprise', enforceComplexity: boolean = false) {
  const requirements = PASSWORD_REQUIREMENTS[mode];
  const shouldCheckComplexity = mode === 'enterprise' || enforceComplexity;

  // Validar longitud mínima
  if (password.length < requirements.minLength) {
    return {
      valid: false,
      error: `La contraseña debe tener al menos ${requirements.minLength} caracteres${mode === 'enterprise' ? ' para admin enterprise' : ''}`
    };
  }

  // Validar complejidad si es requerida
  if (shouldCheckComplexity) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return {
        valid: false,
        error: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'
      };
    }
  }

  return { valid: true };
}

function validateSecurityKey(key: string, mode: 'basic' | 'enterprise') {
  return key === SECURITY_KEYS[mode];
}

// ===================================
// FUNCIONES DE CREACIÓN
// ===================================

async function createAdminUserBasic(params: CreateAdminUserRequest) {
  const { email, password, firstName, lastName } = params;

  // Usar cliente básico de Supabase
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
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        created_via: 'basic_api'
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
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
    // Actualizar el perfil existente
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        supabase_user_id: authUser.id,
        first_name: firstName,
        last_name: lastName,
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
    // Obtener rol de admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_name', 'admin')
      .single();

    if (!adminRole) {
      throw new Error('Rol de admin no encontrado en la base de datos');
    }

    // Crear nuevo perfil
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        supabase_user_id: authUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role_id: adminRole.id,
        is_active: true,
        metadata: { 
          created_by: 'admin_setup', 
          is_super_admin: true,
          created_via: 'basic_api'
        }
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
}

async function createAdminUserEnterprise(params: CreateAdminUserRequest, request: NextRequest) {
  const { email, password, firstName, lastName, permissions } = params;

  // Autenticación crítica enterprise
  const authResult = await requireCriticalAuth(request);

  if (!authResult.success) {
    throw new Error(`Autenticación enterprise fallida: ${authResult.error}`);
  }

  const context = authResult.context!;

  // Verificar permisos específicos
  if (!context.permissions.includes('admin_create') && context.role !== 'admin') {
    throw new Error('Permisos insuficientes para crear usuarios administradores');
  }

  // Ejecutar con RLS y auditoría
  const result = await executeWithRLS(
    context,
    async (client, rlsContext) => {
      // Verificar permisos RLS
      if (!checkRLSPermission(rlsContext, 'admin_create')) {
        throw new Error('Permisos RLS insuficientes para crear administradores');
      }

      // Verificar si el usuario ya existe
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingAuthUser.users.find(u => u.email === email);

      let authUser;

      if (userExists) {
        authUser = userExists;
      } else {
        // Crear usuario con metadata enterprise
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
            security_level: 'critical',
            created_via: 'enterprise_api'
          }
        });

        if (authError) {
          throw new Error(`Error creando usuario en Auth: ${authError.message}`);
        }

        authUser = newAuthUser.user;
      }

      // Verificar si el perfil ya existe
      const { data: existingProfile } = await client
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        // Actualizar perfil con datos enterprise
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
          profile: updatedProfile,
          context
        };
      } else {
        // Obtener rol de admin
        const { data: adminRole } = await client
          .from('user_roles')
          .select('id')
          .eq('role_name', 'admin')
          .single();

        if (!adminRole) {
          throw new Error('Rol de admin no encontrado en la base de datos');
        }

        // Crear nuevo perfil enterprise
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
          profile: newProfile,
          context
        };
      }
    },
    {
      enforceRLS: true,
      auditLog: true,
      adminOverride: true
    }
  );

  if (!result.success) {
    throw new Error(`Error en operación enterprise: ${result.error}`);
  }

  return result.data!;
}

// ===================================
// ENDPOINTS
// ===================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = CreateAdminUserSchema.parse(body);
    const timestamp = new Date().toISOString();

    console.log(`🔐 Unified Admin User Creation: Mode ${params.mode}`);

    // Validar clave de seguridad
    if (!validateSecurityKey(params.securityKey, params.mode)) {
      return NextResponse.json(
        { 
          error: `Clave de seguridad ${params.mode} incorrecta`,
          code: 'INVALID_SECURITY_KEY',
          mode: params.mode
        },
        { status: 403 }
      );
    }

    // Validar contraseña
    const passwordValidation = validatePassword(
      params.password, 
      params.mode, 
      params.enforceComplexPassword
    );

    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: passwordValidation.error,
          code: params.mode === 'enterprise' ? 'PASSWORD_COMPLEXITY_FAILED' : 'WEAK_PASSWORD',
          mode: params.mode
        },
        { status: 400 }
      );
    }

    let result;

    // Ejecutar según el modo
    if (params.mode === 'enterprise') {
      result = await createAdminUserEnterprise(params, request);
      
      // Invalidar cache en modo enterprise
      if (result.authUser) {
        invalidateUserCache(result.authUser.id);
      }
    } else {
      result = await createAdminUserBasic(params);
    }

    const { action, authUser, profile, context } = result;

    // Respuesta unificada
    const response = {
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
            permissions: profile.permissions || profile.user_roles?.permissions,
            is_active: profile.is_active,
            created_at: profile.created_at
          }
        }
      },
      meta: {
        mode: params.mode,
        api_version: '1.0.0',
        unified: true,
        timestamp
      }
    };

    // Agregar información enterprise si aplica
    if (params.mode === 'enterprise' && context) {
      response['enterprise'] = {
        security_level: 'critical',
        rls_enabled: true,
        created_by: context.userId,
        permissions_granted: params.permissions
      };
    }

    return NextResponse.json(response, { 
      status: action === 'created' ? 201 : 200 
    });

  } catch (error: any) {
    console.error('❌ Error en Unified Admin User Creation:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        mode: 'unknown',
        unified: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API Unificada para crear usuario administrador',
    unified: true,
    modes: {
      basic: {
        description: 'Creación básica de admin sin autenticación previa',
        security_key: 'CREATE_ADMIN_PINTEYA_2025',
        password_requirements: {
          min_length: 8,
          complexity: 'optional'
        },
        features: ['Basic user creation', 'Simple validation', 'Standard profiles']
      },
      enterprise: {
        description: 'Creación enterprise con autenticación crítica y RLS',
        security_key: 'CREATE_ADMIN_PINTEYA_ENTERPRISE_2025',
        password_requirements: {
          min_length: 12,
          complexity: 'required',
          must_contain: ['uppercase', 'lowercase', 'numbers', 'special_chars']
        },
        features: [
          'Enterprise authentication with critical security level',
          'Row Level Security (RLS) enforcement',
          'Robust password validation',
          'Audit logging',
          'Cache invalidation',
          'Comprehensive error handling'
        ]
      }
    },
    usage: {
      method: 'POST',
      required_fields: ['securityKey', 'email', 'password'],
      optional_fields: ['firstName', 'lastName', 'permissions', 'mode', 'enforceComplexPassword'],
      examples: {
        basic: {
          securityKey: 'CREATE_ADMIN_PINTEYA_2025',
          email: 'admin@example.com',
          password: 'password123',
          mode: 'basic'
        },
        enterprise: {
          securityKey: 'CREATE_ADMIN_PINTEYA_ENTERPRISE_2025',
          email: 'admin@example.com',
          password: 'ComplexPass123!',
          mode: 'enterprise',
          firstName: 'Admin',
          lastName: 'User',
          permissions: ['admin_access', 'user_management']
        }
      }
    },
    migration: {
      from: [
        '/api/admin/create-admin-user',
        '/api/admin/create-admin-user-enterprise'
      ],
      to: '/api/admin/create-admin-user/unified',
      backward_compatible: true
    }
  });
}










