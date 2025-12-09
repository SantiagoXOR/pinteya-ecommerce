// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para obtener interacciones de usuarios desde la base de datos
 * Usado para el heatmap y análisis de comportamiento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserInteraction {
  type: 'click' | 'hover' | 'scroll' | 'focus' | 'input'
  x: number
  y: number
  element: string
  page: string
  sessionId: string
  timestamp: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const page = searchParams.get('page')
    const userId = searchParams.get('userId')
    const statsOnly = searchParams.get('statsOnly') === 'true'

    // Si solo se piden estadísticas por página
    if (statsOnly) {
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('page, interaction_type')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (error) {
        console.error('Error obteniendo estadísticas de interacciones:', error)
        return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
      }

      // Agrupar por página
      const pageStats = (interactions || []).reduce(
        (acc, interaction) => {
          const pagePath = interaction.page || 'unknown'
          if (!acc[pagePath]) {
            acc[pagePath] = 0
          }
          acc[pagePath]++
          return acc
        },
        {} as Record<string, number>
      )

      // Mapear a formato de respuesta
      const stats = Object.entries(pageStats)
        .map(([page, count]) => ({
          page,
          interactions: count,
        }))
        .sort((a, b) => b.interactions - a.interactions)
        .slice(0, 10)

      return NextResponse.json({ stats })
    }

    // Construir query para obtener interacciones completas
    let query = supabase
      .from('user_interactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (page) {
      query = query.eq('page', page)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: interactions, error } = await query

    if (error) {
      console.error('Error obteniendo interacciones:', error)
      return NextResponse.json({ error: 'Error obteniendo interacciones' }, { status: 500 })
    }

    // Mapear a formato UserInteraction
    const mappedInteractions: UserInteraction[] = (interactions || []).map(interaction => ({
      type: (interaction.interaction_type as 'click' | 'hover' | 'scroll' | 'focus' | 'input') || 'click',
      x: interaction.x_coordinate || 0,
      y: interaction.y_coordinate || 0,
      element: interaction.element_selector || '',
      page: interaction.page || '',
      sessionId: interaction.session_id || '',
      timestamp: new Date(interaction.created_at).getTime(),
    }))

    return NextResponse.json({ interactions: mappedInteractions })
  } catch (error) {
    console.error('Error en API de interacciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

