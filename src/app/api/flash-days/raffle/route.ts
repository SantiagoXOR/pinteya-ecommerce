// ===================================
// FLASH DAYS RAFFLE API - CAMPAÑA FINALIZADA
// ===================================
// Estado: DESHABILITADA - Tabla flash_days_participants eliminada

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Campaña Flash Days finalizada'
  }, { status: 410 })
}
