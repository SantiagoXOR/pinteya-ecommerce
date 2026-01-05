/**
 * API Route para Paint Visualizer
 * Genera visualizaciones de pintura usando Gemini API
 * Incluye rate limiting para proteger el servicio
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { PaintRequest, PaintResponse } from '@/components/PaintVisualizer/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// Tamaño máximo de imagen: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/**
 * Valida el formato y tamaño de la imagen base64
 */
function validateImageBase64(imageBase64: string): { valid: boolean; error?: string } {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { valid: false, error: 'Imagen no válida' }
  }

  // Validar formato base64
  const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/
  if (!base64Regex.test(imageBase64)) {
    return { valid: false, error: 'Formato de imagen no válido. Use JPEG, PNG o WebP' }
  }

  // Calcular tamaño aproximado (base64 es ~33% más grande que el archivo original)
  const base64Data = imageBase64.split(',')[1]
  const sizeInBytes = (base64Data.length * 3) / 4
  if (sizeInBytes > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Imagen demasiado grande. Tamaño máximo: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Valida el código hexadecimal de color
 */
function validateColorHex(colorHex: string): { valid: boolean; error?: string } {
  if (!colorHex || typeof colorHex !== 'string') {
    return { valid: false, error: 'Color no válido' }
  }

  // Aceptar formatos: #RRGGBB, #RGB, rgb(r,g,b), rgba(r,g,b,a)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/

  if (!hexRegex.test(colorHex) && !rgbRegex.test(colorHex)) {
    return { valid: false, error: 'Formato de color no válido. Use formato hexadecimal (#RRGGBB) o RGB' }
  }

  return { valid: true }
}

/**
 * POST /api/paint-visualizer/generate
 * Genera análisis de imagen usando Gemini Vision API
 */
export async function POST(request: NextRequest): Promise<NextResponse<PaintResponse>> {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.paintVisualizer, async () => {
    try {
      // Verificar API key de Gemini
      if (!GEMINI_API_KEY) {
        console.error('[Paint Visualizer] GEMINI_API_KEY no configurada')
        return NextResponse.json(
          {
            success: false,
            error: 'Servicio de visualización no disponible. Contacte al administrador.',
          },
          { status: 500 }
        )
      }

      // Parsear y validar request body
      let body: PaintRequest
      try {
        body = await request.json()
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Formato de solicitud no válido',
          },
          { status: 400 }
        )
      }

      // Validar campos requeridos
      if (!body.imageBase64 || !body.colorHex || !body.colorName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Faltan campos requeridos: imageBase64, colorHex, colorName',
          },
          { status: 400 }
        )
      }

      // Validar imagen
      const imageValidation = validateImageBase64(body.imageBase64)
      if (!imageValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: imageValidation.error,
          },
          { status: 400 }
        )
      }

      // Validar color
      const colorValidation = validateColorHex(body.colorHex)
      if (!colorValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: colorValidation.error,
          },
          { status: 400 }
        )
      }

      // Construir prompt para Gemini - Pedir que identifique áreas a pintar
      const prompt = `Eres un asistente experto en análisis de imágenes arquitectónicas y de interiores.

Analiza esta imagen y identifica TODAS las superficies que normalmente se pintan (paredes, techos, fachadas, muros, etc.). 

El usuario quiere pintar estas superficies con el color: ${body.colorName} (código hexadecimal: ${body.colorHex})

${body.productName ? `Producto de pintura a usar: ${body.productName}` : ''}

IMPORTANTE: 
- Identifica todas las paredes y superficies pintables en la imagen
- Describe las áreas principales que deben pintarse (por ejemplo: "pared frontal completa", "paredes laterales", "fachada de la casa", etc.)
- Si hay múltiples áreas, enuméralas claramente
- Sé específico sobre qué partes de la imagen son superficies pintables

Responde SOLO con una descripción clara y concisa de las áreas identificadas, separadas por punto y coma.`

      // Preparar payload para Gemini API
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: body.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
            ],
          },
        ],
      }

      // Llamar a Gemini API
      const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => 'Unknown error')
        console.error('[Paint Visualizer] Error de Gemini API:', {
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          error: errorText,
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Error al procesar la imagen. Intente nuevamente.',
          },
          { status: 500 }
        )
      }

      const geminiData = await geminiResponse.json()
      const analysis =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Análisis completado. Puede proceder con la visualización.'

      // Respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          analysis,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('[Paint Visualizer] Error interno:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor. Intente nuevamente más tarde.',
        },
        { status: 500 }
      )
    }
  })
}

