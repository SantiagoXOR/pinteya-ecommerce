// ===================================
// PINTEYA E-COMMERCE - WEBHOOK DE CLERK
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { syncUserWithSupabase, deleteUserFromSupabase } from '@/lib/clerk';

interface ClerkUser {
  id: string;
  email_addresses: {
    email_address: string;
    id: string;
    verification: {
      status: string;
      strategy: string;
    };
  }[];
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

interface WebhookEventData {
  data: ClerkUser;
  object: string;
  type: string;
}

// ===================================
// POST /api/auth/webhook - Webhook de Clerk
// ===================================
export async function POST(request: NextRequest) {
  try {
    // Obtener el secret del webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.warn('CLERK_WEBHOOK_SECRET no está configurado - webhook deshabilitado');
      return new Response('Webhook no configurado', { status: 200 });
    }

    // Obtener headers de forma segura
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    // Verificar que los headers estén presentes
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error: Headers de webhook faltantes', {
        status: 400,
      });
    }

    // Obtener el body
    const payload = await request.text();

    // Crear instancia de Webhook
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEventData;

    // Verificar el webhook
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEventData;
    } catch (err) {
      console.error('Error verificando webhook:', err);
      return new Response('Error verificando webhook', {
        status: 400,
      });
    }

    // Procesar el evento
    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
        try {
          await syncUserWithSupabase(evt.data);
          console.log(`Usuario creado y sincronizado: ${evt.data.email_addresses[0]?.email_address}`);
        } catch (error) {
          console.error('Error sincronizando usuario creado:', error);
          throw error;
        }
        break;

      case 'user.updated':
        try {
          await syncUserWithSupabase(evt.data);
          console.log(`Usuario actualizado y sincronizado: ${evt.data.email_addresses[0]?.email_address}`);
        } catch (error) {
          console.error('Error sincronizando usuario actualizado:', error);
          throw error;
        }
        break;

      case 'user.deleted':
        try {
          await deleteUserFromSupabase(evt.data.id);
          console.log('Usuario eliminado de Supabase');
        } catch (error) {
          console.error('Error eliminando usuario:', error);
          throw error;
        }
        break;

      default:
        console.log(`Evento webhook no manejado: ${eventType}`);
    }

    return new Response('Webhook procesado correctamente', { status: 200 });
  } catch (error) {
    console.error('Error en webhook:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}

// ===================================
// GET /api/auth/webhook - Health check
// ===================================
export async function GET() {
  return NextResponse.json({
    message: 'Webhook de Clerk funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
}
