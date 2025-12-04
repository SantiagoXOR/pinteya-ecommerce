// ===================================
// FLASH DAYS PARTICIPANTS API - CAMPAÑA FINALIZADA
// ===================================
// Estado: DESHABILITADA - Tabla flash_days_participants eliminada
// Fecha: Noviembre 2025

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Campaña Flash Days finalizada',
    data: []
  }, { status: 410 })
}
