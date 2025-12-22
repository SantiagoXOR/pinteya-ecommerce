// ===================================
// PINTEYA E-COMMERCE - API DE TERMINACIONES DE PALETA
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'

// Terminaciones predefinidas comunes (fallback)
const PREDEFINED_FINISHES = [
  'Mate',
  'Satinado',
  'Semi-brillante',
  'Brillante',
  'Rústico',
  'Texturizado',
]

// ===================================
// GET /api/admin/finishes - Obtener todas las terminaciones de la paleta
// ===================================
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<string[]>>> {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.public, async () => {
    try {
      // Obtener terminaciones personalizadas de la base de datos
      const { data: customFinishes, error: finishesError } = await supabaseAdmin
        .from('finish_palette')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('created_at', { ascending: false })

      if (finishesError) {
        console.error('❌ Error obteniendo terminaciones personalizadas:', finishesError)
        // Si falla, devolver solo las predefinidas
        return NextResponse.json({
          success: true,
          data: PREDEFINED_FINISHES,
          message: 'Terminaciones predefinidas (error al cargar personalizadas)',
        })
      }

      // Extraer solo los nombres de las terminaciones personalizadas
      const customFinishNames: string[] = (customFinishes || []).map((f) => f.finish)

      // Combinar terminaciones predefinidas con personalizadas
      // Las personalizadas tienen prioridad si hay duplicados por nombre
      const finishSet = new Set<string>()

      // Primero agregar predefinidas
      PREDEFINED_FINISHES.forEach((finish) => {
        finishSet.add(finish)
      })

      // Luego agregar personalizadas (sobrescribirán duplicados)
      customFinishNames.forEach((finish) => {
        finishSet.add(finish)
      })

      // Ordenar: primero populares, luego alfabéticamente
      const allFinishes = Array.from(finishSet).sort((a, b) => {
        const aIsPopular = customFinishes?.find(f => f.finish === a)?.is_popular || false
        const bIsPopular = customFinishes?.find(f => f.finish === b)?.is_popular || false
        
        if (aIsPopular && !bIsPopular) return -1
        if (!aIsPopular && bIsPopular) return 1
        return a.localeCompare(b)
      })

      return NextResponse.json({
        success: true,
        data: allFinishes,
        message: `Paleta completa: ${PREDEFINED_FINISHES.length} predefinidas + ${customFinishNames.length} personalizadas`,
      })
    } catch (error: any) {
      console.error('❌ Error en GET /api/admin/finishes:', error)
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

