/**
 * API para sincronizar roles entre Supabase y Clerk
 * Endpoint: /api/admin/sync-roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncSantiagoAdmin } from '@/scripts/sync-admin-role';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Iniciando sincronización de roles...');

    // Verificar que sea una request válida
    const body = await request.json().catch(() => ({}));
    const { action = 'sync_santiago' } = body;

    if (action === 'sync_santiago') {
      console.log('🔄 Sincronizando rol admin para santiago@xor.com.ar...');
      
      const result = await syncSantiagoAdmin();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Acción no válida'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error en API sync-roles:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'API de sincronización de roles',
      endpoints: {
        'POST /api/admin/sync-roles': {
          description: 'Sincronizar roles entre Supabase y Clerk',
          body: {
            action: 'sync_santiago | sync_all'
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
