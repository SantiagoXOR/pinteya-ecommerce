/**
 * Middleware de autenticación específico para drivers
 * Verifica que el usuario sea un driver válido y tenga acceso a las rutas de driver
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/integrations/supabase/server';

export async function driverAuthMiddleware(request: NextRequest) {
  try {
    // Verificar autenticación básica
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }

    // Verificar que el usuario sea un driver válido
    const supabase = await createClient();
    
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('email', session.user.email)
      .eq('status', 'available')
      .single();

    if (error || !driver) {
      console.error('Driver not found or inactive:', error);
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    // Agregar información del driver a los headers para uso en las páginas
    const response = NextResponse.next();
    response.headers.set('x-driver-id', driver.id);
    response.headers.set('x-driver-name', driver.name);
    response.headers.set('x-driver-vehicle', driver.vehicle_type);
    
    return response;

  } catch (error) {
    console.error('Error in driver auth middleware:', error);
    return NextResponse.redirect(new URL('/driver/login', request.url));
  }
}

/**
 * Función helper para verificar si una ruta requiere autenticación de driver
 */
export function isDriverRoute(pathname: string): boolean {
  return pathname.startsWith('/driver') && !pathname.startsWith('/driver/login');
}

/**
 * Función para obtener información del driver desde los headers
 */
export function getDriverFromHeaders(request: NextRequest) {
  return {
    id: request.headers.get('x-driver-id'),
    name: request.headers.get('x-driver-name'),
    vehicle: request.headers.get('x-driver-vehicle'),
  };
}









