// ===================================
// PINTEYA E-COMMERCE - WEBHOOK CLERK PARA PRODUCCIÓN
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipos de eventos de Clerk
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at: number;
    updated_at: number;
  };
};

export async function POST(req: NextRequest) {
  try {
    console.log('[CLERK_WEBHOOK] Recibiendo webhook...');

    // Verificar que tenemos el webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!webhookSecret) {
      console.error('[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET no configurado');
      return NextResponse.json(
        { error: 'Webhook secret no configurado' },
        { status: 500 }
      );
    }

    // Obtener headers necesarios para verificación
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    console.log('[CLERK_WEBHOOK] Headers recibidos:', {
      svix_id: svix_id ? 'presente' : 'faltante',
      svix_timestamp: svix_timestamp ? 'presente' : 'faltante',
      svix_signature: svix_signature ? 'presente' : 'faltante'
    });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('[CLERK_WEBHOOK] Headers de verificación faltantes');
      return NextResponse.json(
        { error: 'Headers de verificación faltantes' },
        { status: 400 }
      );
    }

    // Obtener el body del request
    const body = await req.text();
    console.log('[CLERK_WEBHOOK] Body recibido, longitud:', body.length);

    let evt: ClerkWebhookEvent;

    // En desarrollo, permitir bypass de verificación si el secret es de prueba
    if (isDevelopment && webhookSecret.includes('development')) {
      console.log('[CLERK_WEBHOOK] Modo desarrollo: parseando body directamente');
      try {
        evt = JSON.parse(body) as ClerkWebhookEvent;
      } catch (parseError) {
        console.error('[CLERK_WEBHOOK] Error parseando JSON:', parseError);
        return NextResponse.json(
          { error: 'JSON inválido' },
          { status: 400 }
        );
      }
    } else {
      // Crear instancia de Webhook para verificación en producción
      try {
        const wh = new Webhook(webhookSecret);
        evt = wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        }) as ClerkWebhookEvent;
        console.log('[CLERK_WEBHOOK] Firma verificada exitosamente');
      } catch (err) {
        console.error('[CLERK_WEBHOOK] Error verificando webhook:', err);
        return NextResponse.json(
          { error: 'Verificación de webhook fallida' },
          { status: 400 }
        );
      }
    }

    // Procesar diferentes tipos de eventos
    const { type, data } = evt;
    console.log(`[CLERK_WEBHOOK] Evento recibido: ${type} para usuario ${data.id}`);

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`[CLERK_WEBHOOK] Evento no manejado: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// HANDLERS PARA EVENTOS DE CLERK
// ===================================

async function handleUserCreated(userData: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = userData.email_addresses.find(email =>
      email.email_address
    )?.email_address;

    if (!primaryEmail) {
      console.error('[CLERK_WEBHOOK] Usuario sin email:', userData.id);
      return;
    }

    console.log(`[CLERK_WEBHOOK] Iniciando creación de usuario: ${primaryEmail} (${userData.id})`);

    // Primero obtener el role_id para 'customer'
    const { data: customerRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_name', 'customer')
      .single();

    if (roleError) {
      console.error('[CLERK_WEBHOOK] Error obteniendo rol customer:', roleError);
      return;
    }

    // Insertar usuario en user_profiles (tabla correcta)
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        clerk_user_id: userData.id, // Columna correcta
        email: primaryEmail,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role_id: customerRole.id, // ID del rol customer
        is_active: true,
        metadata: {
          avatar_url: userData.image_url || '',
          clerk_created_at: new Date(userData.created_at).toISOString(),
          source: 'clerk_webhook'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('[CLERK_WEBHOOK] Error creando usuario en user_profiles:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario creado exitosamente en user_profiles:`, {
        email: primaryEmail,
        clerk_id: userData.id,
        user_profile_id: data?.[0]?.id,
        role_id: customerRole.id
      });
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserCreated:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
  }
}

async function handleUserUpdated(userData: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = userData.email_addresses.find(email =>
      email.email_address
    )?.email_address;

    if (!primaryEmail) {
      console.error('[CLERK_WEBHOOK] Usuario sin email para actualizar:', userData.id);
      return;
    }

    console.log(`[CLERK_WEBHOOK] Iniciando actualización de usuario: ${primaryEmail} (${userData.id})`);

    // Actualizar usuario en user_profiles (tabla correcta)
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        email: primaryEmail,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        metadata: {
          avatar_url: userData.image_url || '',
          clerk_updated_at: new Date(userData.updated_at).toISOString(),
          last_sync: new Date().toISOString()
        },
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userData.id) // Columna correcta
      .select();

    if (error) {
      console.error('[CLERK_WEBHOOK] Error actualizando usuario en user_profiles:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario actualizado exitosamente en user_profiles:`, {
        email: primaryEmail,
        clerk_id: userData.id,
        updated_records: data?.length || 0
      });
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserUpdated:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
  }
}

async function handleUserDeleted(userData: ClerkWebhookEvent['data']) {
  try {
    console.log(`[CLERK_WEBHOOK] Iniciando eliminación de usuario: ${userData.id}`);

    // Marcar usuario como eliminado (soft delete) en user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false, // Desactivar usuario
        metadata: {
          deleted_at: new Date().toISOString(),
          deletion_source: 'clerk_webhook',
          clerk_deleted_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userData.id) // Columna correcta
      .select();

    if (error) {
      console.error('[CLERK_WEBHOOK] Error eliminando usuario en user_profiles:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario eliminado exitosamente en user_profiles:`, {
        clerk_id: userData.id,
        deactivated_records: data?.length || 0
      });
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserDeleted:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
  }
}
