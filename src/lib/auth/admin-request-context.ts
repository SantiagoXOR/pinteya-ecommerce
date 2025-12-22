import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger'
import { existsSync } from 'fs'
import path from 'path'

const ADMIN_BYPASS_EMAIL = process.env.ADMIN_BYPASS_EMAIL || 'admin@bypass.dev'
const ADMIN_BYPASS_NAME = process.env.ADMIN_BYPASS_NAME || 'Dev Admin'

type AdminRequestContextSuccess = {
  success: true
  context: {
    user: {
      id: string | null
      email: string
      name?: string
    }
    actorId: string | null
    isBypass: boolean
  }
}

type AdminRequestContextFailure = {
  success: false
  status: number
  error: string
}

export type AdminRequestContextResult = AdminRequestContextSuccess | AdminRequestContextFailure

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isValidUUID = (value?: string | null): value is string =>
  !!value && UUID_REGEX.test(value)

async function resolveBypassActor(email: string) {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .single()

    if (data?.id && isValidUUID(data.id)) {
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
      return {
        id: data.id,
        name: fullName.length > 0 ? fullName : undefined,
      }
    }
  } catch (error) {
    logger.log(LogLevel.WARN, LogCategory.AUTH, 'No se pudo resolver actor para bypass', {
      error,
    })
  }

  const fallbackId = process.env.ADMIN_BYPASS_USER_ID
  return {
    id: isValidUUID(fallbackId) ? fallbackId : null,
    name: undefined,
  }
}

export async function getAdminRequestContext(): Promise<AdminRequestContextResult> {
  try {
    const bypassEnabled =
      process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true'

    if (bypassEnabled) {
      const envLocalPath = path.join(process.cwd(), '.env.local')
      if (existsSync(envLocalPath)) {
        const actor = await resolveBypassActor(ADMIN_BYPASS_EMAIL)

        return {
          success: true,
          context: {
            user: {
              id: actor.id ?? 'dev-admin',
              email: ADMIN_BYPASS_EMAIL,
              name: actor.name || ADMIN_BYPASS_NAME,
            },
            actorId: actor.id,
            isBypass: true,
          },
        }
      }
    }

    const session = await auth()

    if (!session?.user) {
      return { success: false, status: 401, error: 'Usuario no autenticado' }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    if (session.user.role !== 'admin') {
      return {
        success: false,
        status: 403,
        error: 'Acceso denegado - Se requieren permisos de administrador',
      }
    }

    const actorId = isValidUUID(session.user.id) ? session.user.id : null

    return {
      success: true,
      context: {
        user: {
          id: session.user.id ?? null,
          email: session.user.email,
          name: session.user.name || undefined,
        },
        actorId,
        isBypass: false,
      },
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error al validar admin request', { error })
    return { success: false, status: 500, error: 'Error de autenticación' }
  }
}

