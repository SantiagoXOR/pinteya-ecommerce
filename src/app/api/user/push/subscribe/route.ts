// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: SUSCRIBIRSE A NOTIFICACIONES PUSH
// Endpoint: POST /api/user/push/subscribe
// Descripción: Guarda la suscripción push del usuario
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'
import { getPushNotificationService } from '@/lib/notifications/push-notifications'
import { createClient } from '@/lib/integrations/supabase/server'

// Helper para obtener tenant_id
async function getTenantId(request: NextRequest): Promise<string> {
  // Intentar obtener del header o cookie
  const tenantHeader = request.headers.get('x-tenant-id')
  if (tenantHeader) return tenantHeader

  // Obtener del dominio o usar default
  const host = request.headers.get('host') || ''
  // Lógica para extraer tenant del dominio si es necesario
  // Por ahora, usar un tenant por defecto o obtenerlo de la sesión
  const session = await auth()
  if (session?.user) {
    const supabase = await createClient()
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('email', session.user.email)
      .single()
    
    if (userProfile?.tenant_id) {
      return userProfile.tenant_id
    }
  }

  // Fallback: usar tenant por defecto
  return 'default-tenant'
}

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint debe ser una URL válida'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key es requerida'),
    auth: z.string().min(1, 'auth key es requerida'),
  }),
})

// =====================================================
// POST: SUSCRIBIRSE A NOTIFICACIONES PUSH
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const tenantId = await getTenantId(request)

    // Parsear y validar body
    const body = await request.json()
    const validatedData = PushSubscriptionSchema.parse(body)

    // Guardar suscripción
    const service = getPushNotificationService()
    const success = await service.saveSubscription(userId, validatedData, tenantId)

    if (!success) {
      return NextResponse.json(
        { error: 'Error al guardar suscripción' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción guardada exitosamente',
    })
  } catch (error) {
    console.error('Error en POST /api/user/push/subscribe:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.reduce(
            (acc, err) => {
              acc[err.path.join('.')] = [err.message]
              return acc
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: DESUSCRIBIRSE DE NOTIFICACIONES PUSH
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const tenantId = await getTenantId(request)

    // Obtener endpoint del query
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 })
    }

    // Eliminar suscripción
    const service = getPushNotificationService()
    const success = await service.removeSubscription(userId, endpoint, tenantId)

    if (!success) {
      return NextResponse.json(
        { error: 'Error al eliminar suscripción' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/user/push/subscribe:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
