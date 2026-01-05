// ===================================
// PINTEYA E-COMMERCE - API DE MEDIDAS DE PALETA
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'

// Medidas predefinidas comunes
const PREDEFINED_MEASURES = [
  '1L',
  '2.5L',
  '4L',
  '5L',
  '10L',
  '20L',
  '25L',
  '1KG',
  '4KG',
  '10KG',
  '20KG',
  'Nº10',
  'Nº12',
  'Nº14',
  'Nº16',
  'Nº18',
  'Nº20',
  '250ml',
  '500ml',
  '750ml',
]

interface MeasureOption {
  measure: string
  category?: string
  unitType?: string
  isPopular?: boolean
  description?: string
}

// ===================================
// GET /api/admin/measures - Obtener todas las medidas de la paleta
// ===================================
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<string[]>>> {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.public, async () => {
    try {
      // Obtener medidas personalizadas de la base de datos
      const { data: customMeasures, error: measuresError } = await supabaseAdmin
        .from('measure_palette')
        .select('*')
        .order('created_at', { ascending: false })

      if (measuresError) {
        console.error('❌ Error obteniendo medidas personalizadas:', measuresError)
        // Si falla, devolver solo las predefinidas
        return NextResponse.json({
          success: true,
          data: PREDEFINED_MEASURES,
          message: 'Medidas predefinidas (error al cargar personalizadas)',
        })
      }

      // Extraer solo los nombres de las medidas personalizadas
      const customMeasureNames: string[] = (customMeasures || []).map((m) => m.measure)

      // Combinar medidas predefinidas con personalizadas
      // Las personalizadas tienen prioridad si hay duplicados por nombre
      const measureSet = new Set<string>()

      // Primero agregar predefinidas
      PREDEFINED_MEASURES.forEach((measure) => {
        measureSet.add(measure)
      })

      // Luego agregar personalizadas (sobrescribirán duplicados)
      customMeasureNames.forEach((measure) => {
        measureSet.add(measure)
      })

      const allMeasures = Array.from(measureSet).sort((a, b) => {
        // Ordenar: primero números (Nº), luego volumen (L, ml, CC), luego peso (KG)
        const getOrder = (m: string) => {
          if (m.match(/^Nº|^N°|^N/i)) return 0
          if (m.match(/L|ml|CC/i)) return 1
          if (m.match(/KG|G/i)) return 2
          return 3
        }
        const orderA = getOrder(a)
        const orderB = getOrder(b)
        if (orderA !== orderB) return orderA - orderB
        return a.localeCompare(b)
      })

      return NextResponse.json({
        success: true,
        data: allMeasures,
        message: `Paleta completa: ${PREDEFINED_MEASURES.length} predefinidas + ${customMeasureNames.length} personalizadas`,
      })
    } catch (error: any) {
      console.error('❌ Error en GET /api/admin/measures:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          data: null,
        },
        { status: 500 }
      )
    }
  })
}

