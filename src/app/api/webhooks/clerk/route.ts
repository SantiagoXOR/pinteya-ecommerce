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
    // Verificar que tenemos el webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
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

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('[CLERK_WEBHOOK] Headers de verificación faltantes');
      return NextResponse.json(
        { error: 'Headers de verificación faltantes' },
        { status: 400 }
      );
    }

    // Obtener el body del request
    const body = await req.text();

    // Crear instancia de Webhook para verificación
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    try {
      // Verificar la firma del webhook
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('[CLERK_WEBHOOK] Error verificando webhook:', err);
      return NextResponse.json(
        { error: 'Verificación de webhook fallida' },
        { status: 400 }
      );
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

    // Insertar usuario en Supabase
    const { error } = await supabase
      .from('users')
      .insert({
        clerk_id: userData.id,
        email: primaryEmail,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        avatar_url: userData.image_url || '',
        role: 'customer', // Rol por defecto
        created_at: new Date(userData.created_at).toISOString(),
        updated_at: new Date(userData.updated_at).toISOString(),
      });

    if (error) {
      console.error('[CLERK_WEBHOOK] Error creando usuario en Supabase:', error);
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario creado exitosamente: ${primaryEmail}`);
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserCreated:', error);
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

    // Actualizar usuario en Supabase
    const { error } = await supabase
      .from('users')
      .update({
        email: primaryEmail,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        avatar_url: userData.image_url || '',
        updated_at: new Date(userData.updated_at).toISOString(),
      })
      .eq('clerk_id', userData.id);

    if (error) {
      console.error('[CLERK_WEBHOOK] Error actualizando usuario en Supabase:', error);
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario actualizado exitosamente: ${primaryEmail}`);
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserUpdated:', error);
  }
}

async function handleUserDeleted(userData: ClerkWebhookEvent['data']) {
  try {
    // Marcar usuario como eliminado (soft delete)
    const { error } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userData.id);

    if (error) {
      console.error('[CLERK_WEBHOOK] Error eliminando usuario en Supabase:', error);
    } else {
      console.log(`[CLERK_WEBHOOK] Usuario eliminado exitosamente: ${userData.id}`);
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error en handleUserDeleted:', error);
  }
}
