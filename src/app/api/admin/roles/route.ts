// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API para gestión de roles del sistema
 * Requiere permisos de administrador para modificar
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions, logAdminAction } from '@/lib/auth/admin-auth'
import { z } from 'zod'

// Schema de validación para roles
const RoleSchema = z.object({
  role_name: z.string().min(1, 'El nombre del rol es requerido'),
  display_name: z.string().min(1, 'El nombre para mostrar es requerido'),
  description: z.string().optional(),
  permissions: z.record(z.any()).default({}),
  is_active: z.boolean().default(true),
})

/**
 * GET /api/admin/roles
 * Obtener lista de roles del sistema
 */
export async function GET(request: NextRequest) {
  try {
    // Para leer roles, solo necesita estar autenticado como admin/moderator
    const authResult = await checkCRUDPermissions('users', 'read')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { supabase, user } = authResult
    const { searchParams } = new URL(request.url)

    // Parámetros de consulta
    const includeInactive = searchParams.get('include_inactive') === 'true'

    // Construir query
    let query = supabase.from('user_roles').select('*').order('role_name')

    // Filtrar por estado activo si no se incluyen inactivos
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: roles, error } = await query

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
    }

    // Log access
    await logAdminAction(user.id, 'READ', 'roles', 'list', null, {
      include_inactive: includeInactive,
    })

    return NextResponse.json({
      data: roles,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/roles:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * POST /api/admin/roles
 * Crear nuevo rol (solo para super admins)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkCRUDPermissions('users', 'manage_roles')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { supabase, user } = authResult
    const body = await request.json()

    // Validar datos de entrada
    const roleData = RoleSchema.parse(body)

    // Verificar que el nombre del rol no existe
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_name', roleData.role_name)
      .single()

    if (existingRole) {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
    }

    // Crear nuevo rol
    const { data: newRole, error: createError } = await supabase
      .from('user_roles')
      .insert({
        ...roleData,
        is_system_role: false, // Los roles creados por admin no son del sistema
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating role:', createError)
      return NextResponse.json({ error: 'Error al crear rol' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(user.id, 'CREATE', 'role', newRole.id.toString(), null, newRole)

    return NextResponse.json(
      {
        message: 'Rol creado exitosamente',
        data: newRole,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/roles:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[id]
 * Actualizar rol existente
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await checkCRUDPermissions('users', 'manage_roles')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { supabase, user } = authResult
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('id')
    const body = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: 'ID de rol requerido' }, { status: 400 })
    }

    // Validar datos de entrada
    const roleData = RoleSchema.partial().parse(body)

    // Verificar que el rol existe y no es del sistema
    const { data: existingRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'No se pueden modificar roles del sistema' },
        { status: 403 }
      )
    }

    // Verificar nombre único si se está cambiando
    if (roleData.role_name && roleData.role_name !== existingRole.role_name) {
      const { data: duplicateRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', roleData.role_name)
        .neq('id', roleId)
        .single()

      if (duplicateRole) {
        return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
      }
    }

    // Actualizar rol
    const { data: updatedRole, error: updateError } = await supabase
      .from('user_roles')
      .update({
        ...roleData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating role:', updateError)
      return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(user.id, 'UPDATE', 'role', roleId, existingRole, updatedRole)

    return NextResponse.json({
      message: 'Rol actualizado exitosamente',
      data: updatedRole,
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/roles:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/roles/[id]
 * Eliminar rol (solo si no está en uso)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await checkCRUDPermissions('users', 'manage_roles')
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { supabase, user } = authResult
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('id')

    if (!roleId) {
      return NextResponse.json({ error: 'ID de rol requerido' }, { status: 400 })
    }

    // Verificar que el rol existe y no es del sistema
    const { data: existingRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'No se pueden eliminar roles del sistema' },
        { status: 403 }
      )
    }

    // Verificar que no hay usuarios con este rol
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el rol. Hay ${count} usuario(s) asignado(s) a este rol.` },
        { status: 400 }
      )
    }

    // Eliminar rol
    const { error: deleteError } = await supabase.from('user_roles').delete().eq('id', roleId)

    if (deleteError) {
      console.error('Error deleting role:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar rol' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(user.id, 'DELETE', 'role', roleId, existingRole, null)

    return NextResponse.json({
      message: 'Rol eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/roles:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
