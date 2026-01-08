// ===================================
// PINTEYA E-COMMERCE - API DE COLORES DE PALETA
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import type { ColorOption } from '@/components/ui/advanced-color-picker'
// Importar PAINT_COLORS de forma dinámica para evitar problemas en servidor
let PAINT_COLORS: ColorOption[] = []
try {
  const colorPicker = await import('@/components/ui/advanced-color-picker')
  PAINT_COLORS = colorPicker.PAINT_COLORS || []
} catch (error) {
  console.error('Error importing PAINT_COLORS:', error)
  PAINT_COLORS = []
}

// ===================================
// GET /api/admin/colors - Obtener todos los colores de la paleta
// ===================================
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ColorOption[]>>> {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.public, async () => {
    try {
      // Asegurar que PAINT_COLORS esté cargado
      if (!PAINT_COLORS || PAINT_COLORS.length === 0) {
        try {
          const colorPicker = await import('@/components/ui/advanced-color-picker')
          PAINT_COLORS = Array.isArray(colorPicker.PAINT_COLORS) ? colorPicker.PAINT_COLORS : []
        } catch (error) {
          console.error('Error importing PAINT_COLORS:', error)
          PAINT_COLORS = []
        }
      }

      // Obtener colores personalizados de la base de datos
      const { data: customColors, error: colorsError } = await supabaseAdmin
        .from('color_palette')
        .select('*')
        .order('created_at', { ascending: false })

      if (colorsError) {
        console.error('❌ Error obteniendo colores personalizados:', colorsError)
        // Si falla, devolver solo los predefinidos
        return NextResponse.json({
          success: true,
          data: Array.isArray(PAINT_COLORS) ? PAINT_COLORS : [],
          message: 'Colores predefinidos (error al cargar personalizados)',
        })
      }

      // Convertir colores de BD a formato ColorOption
      const customColorOptions: ColorOption[] = (customColors || []).map((color) => ({
        id: color.name.toLowerCase().replace(/\s+/g, '-'),
        name: color.name.toLowerCase().replace(/\s+/g, '-'),
        displayName: color.display_name || color.name,
        hex: color.hex,
        category: color.category || 'Personalizado',
        family: color.family || 'Personalizados',
        isPopular: color.is_popular || false,
        description: color.description || `Color personalizado: ${color.name}`,
      }))

      // Combinar colores predefinidos con personalizados
      // Los personalizados tienen prioridad si hay duplicados por nombre
      const colorMap = new Map<string, ColorOption>()

      // Primero agregar predefinidos - verificar que sea un array
      if (Array.isArray(PAINT_COLORS)) {
        PAINT_COLORS.forEach((color) => {
          colorMap.set(color.name.toLowerCase(), color)
        })
      } else {
        console.error('❌ PAINT_COLORS no es un array:', typeof PAINT_COLORS, PAINT_COLORS)
      }

      // Luego agregar/sobrescribir con personalizados
      customColorOptions.forEach((color) => {
        colorMap.set(color.name.toLowerCase(), color)
      })

      const allColors = Array.from(colorMap.values())

      return NextResponse.json({
        success: true,
        data: allColors,
        message: `Paleta completa: ${PAINT_COLORS.length} predefinidos + ${customColorOptions.length} personalizados`,
      })
    } catch (error: any) {
      console.error('❌ Error en GET /api/admin/colors:', error)
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

