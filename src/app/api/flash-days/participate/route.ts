// ===================================
// FLASH DAYS API - CAMPAÑA FINALIZADA
// ===================================
// Fecha finalización: Noviembre 2025
// Estado: DESHABILITADA - Campaña terminada
// Tabla eliminada: flash_days_participants

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Campaña Flash Days finalizada - retornar mensaje informativo
  return NextResponse.json({
    success: false,
    message: 'La campaña Flash Days ha finalizado. ¡Gracias por tu interés!'
  }, { status: 410 }) // 410 Gone - recurso ya no disponible
}
