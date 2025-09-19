// =====================================================
// API: LOGISTICS REDIRECT
// Descripción: Redirección a dashboard de logística
// Endpoint: GET /api/admin/logistics
// =====================================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirigir a la API del dashboard
  const url = new URL('/api/admin/logistics/dashboard', request.url);
  
  // Copiar query parameters si los hay
  const searchParams = new URL(request.url).searchParams;
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  
  // Hacer la llamada interna
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
      'Authorization': request.headers.get('authorization') || '',
    },
  });
  
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Error al obtener datos de logística' },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}









