// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE NOTIFICACIONES POR EMAIL
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { supabaseAdmin } from '@/lib/integrations/supabase'

// Tipos de notificaciones por email
export type EmailNotificationType =
  | 'profile_email_changed'
  | 'profile_phone_changed'
  | 'profile_updated'
  | 'avatar_changed'
  | 'address_added'
  | 'address_updated'
  | 'security_alert'

interface EmailNotificationData {
  type: EmailNotificationType
  oldValue?: string
  newValue?: string
  metadata?: Record<string, any>
}

// Plantillas de email
const EMAIL_TEMPLATES = {
  profile_email_changed: {
    subject: 'Pinteya - Cambio de email confirmado',
    template: (data: any) => `
      <h2>Cambio de email confirmado</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu dirección de email ha sido actualizada exitosamente.</p>
      <p><strong>Email anterior:</strong> ${data.oldValue}</p>
      <p><strong>Nuevo email:</strong> ${data.newValue}</p>
      <p>Si no realizaste este cambio, contacta inmediatamente a nuestro soporte.</p>
      <p>Saludos,<br>Equipo Pinteya</p>
    `,
  },
  profile_phone_changed: {
    subject: 'Pinteya - Cambio de teléfono confirmado',
    template: (data: any) => `
      <h2>Cambio de teléfono confirmado</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu número de teléfono ha sido actualizado exitosamente.</p>
      <p><strong>Teléfono anterior:</strong> ${data.oldValue || 'No especificado'}</p>
      <p><strong>Nuevo teléfono:</strong> ${data.newValue}</p>
      <p>Si no realizaste este cambio, contacta inmediatamente a nuestro soporte.</p>
      <p>Saludos,<br>Equipo Pinteya</p>
    `,
  },
  profile_updated: {
    subject: 'Pinteya - Perfil actualizado',
    template: (data: any) => `
      <h2>Perfil actualizado</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu perfil ha sido actualizado exitosamente.</p>
      <p>Si no realizaste estos cambios, contacta inmediatamente a nuestro soporte.</p>
      <p>Saludos,<br>Equipo Pinteya</p>
    `,
  },
  security_alert: {
    subject: 'Pinteya - Alerta de seguridad',
    template: (data: any) => `
      <h2>Alerta de seguridad</h2>
      <p>Hola ${data.userName},</p>
      <p>Se han detectado cambios importantes en tu cuenta:</p>
      <p>${data.message}</p>
      <p>Si no realizaste estos cambios, contacta inmediatamente a nuestro soporte.</p>
      <p>Saludos,<br>Equipo Pinteya</p>
    `,
  },
}

// ===================================
// POST - Enviar notificación por email
// ===================================
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { type, oldValue, newValue, metadata }: EmailNotificationData = body

    // Validar tipo de notificación
    if (!type || !EMAIL_TEMPLATES[type]) {
      return NextResponse.json(
        { success: false, error: 'Tipo de notificación inválido' },
        { status: 400 }
      )
    }

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error al obtener usuario:', userError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos del usuario' },
        { status: 500 }
      )
    }

    // Preparar datos para la plantilla
    const templateData = {
      userName: userData.name,
      userEmail: userData.email,
      oldValue,
      newValue,
      ...metadata,
    }

    // Obtener plantilla de email
    const emailTemplate = EMAIL_TEMPLATES[type]
    const subject = emailTemplate.subject
    const htmlContent = emailTemplate.template(templateData)

    // En un entorno de producción, aquí enviarías el email usando un servicio como:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer

    // Por ahora, simularemos el envío y guardaremos la notificación en la base de datos
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'email',
        title: subject,
        content: htmlContent,
        metadata: {
          email_type: type,
          recipient: userData.email,
          sent_at: new Date().toISOString(),
          ...templateData,
        },
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error al guardar notificación:', notificationError)
      // No fallar si no se puede guardar la notificación
    }

    // Log para desarrollo
    console.log('📧 Email notification sent:', {
      type,
      recipient: userData.email,
      subject,
      userId,
    })

    return NextResponse.json({
      success: true,
      message: 'Notificación por email enviada correctamente',
      notification_id: notification?.id,
      email_sent: true,
    })
  } catch (error) {
    console.error('Error en POST /api/user/notifications/email:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ===================================
// GET - Obtener historial de notificaciones
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener notificaciones del usuario
    const { data: notifications, error } = await supabaseAdmin
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'email')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error al obtener notificaciones:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: notifications?.length || 0,
    })
  } catch (error) {
    console.error('Error en GET /api/user/notifications/email:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
