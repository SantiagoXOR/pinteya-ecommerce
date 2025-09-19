// ===================================
// API ENDPOINT PARA GENERAR SCREENSHOTS DE TESTING
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import fs from 'fs/promises'
import path from 'path'

interface ScreenshotRequest {
  url: string
  stepName: string
  description: string
  selector?: string
  fullPage?: boolean
  width?: number
  height?: number
}

interface ScreenshotResponse {
  success: boolean
  screenshot?: {
    id: string
    filename: string
    path: string
    url: string
    metadata: {
      width: number
      height: number
      size: number
      timestamp: string
    }
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ScreenshotRequest = await request.json()
    
    // Validar parámetros requeridos
    if (!body.url || !body.stepName) {
      return NextResponse.json({
        success: false,
        error: 'URL y stepName son requeridos'
      }, { status: 400 })
    }

    // Configurar directorio de screenshots
    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    // Generar nombre de archivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeName = body.stepName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename = `checkout-flow-${safeName}-${timestamp}.png`
    const filepath = path.join(screenshotsDir, filename)

    // Lanzar browser y capturar screenshot
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: {
        width: body.width || 1920,
        height: body.height || 1080
      }
    })

    try {
      // Navegar a la URL
      await page.goto(body.url, { waitUntil: 'networkidle' })

      // Esperar un poco para que la página se estabilice
      await page.waitForTimeout(1000)

      // Si hay un selector específico, esperar a que sea visible
      if (body.selector) {
        await page.waitForSelector(body.selector, { timeout: 10000 })
      }

      // Capturar screenshot
      const screenshotOptions: any = {
        path: filepath,
        fullPage: body.fullPage !== false,
        type: 'png'
      }

      await page.screenshot(screenshotOptions)

      // Obtener información del archivo
      const stats = await fs.stat(filepath)
      const screenshot = {
        id: `${safeName}-${timestamp}`,
        filename,
        path: filepath,
        url: `/test-screenshots/${filename}`,
        metadata: {
          width: body.width || 1920,
          height: body.height || 1080,
          size: stats.size,
          timestamp: new Date().toISOString()
        }
      }

      console.log(`📸 Screenshot capturado: ${body.stepName} -> ${filename}`)

      return NextResponse.json({
        success: true,
        screenshot
      })

    } finally {
      await browser.close()
    }

  } catch (error) {
    console.error('Error capturando screenshot:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Endpoint GET para listar screenshots existentes
export async function GET(request: NextRequest) {
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots')
    
    try {
      const files = await fs.readdir(screenshotsDir)
      const screenshots = []

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filepath = path.join(screenshotsDir, file)
          const stats = await fs.stat(filepath)
          
          screenshots.push({
            filename: file,
            url: `/test-screenshots/${file}`,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString()
          })
        }
      }

      return NextResponse.json({
        success: true,
        screenshots: screenshots.sort((a, b) => 
          new Date(b.created).getTime() - new Date(a.created).getTime()
        )
      })

    } catch (dirError) {
      // Directorio no existe, devolver lista vacía
      return NextResponse.json({
        success: true,
        screenshots: []
      })
    }

  } catch (error) {
    console.error('Error listando screenshots:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Endpoint DELETE para limpiar screenshots antiguos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const olderThan = searchParams.get('olderThan') // en horas
    const pattern = searchParams.get('pattern') // patrón de nombre de archivo

    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots')
    
    try {
      const files = await fs.readdir(screenshotsDir)
      let deletedCount = 0

      for (const file of files) {
        if (!file.endsWith('.png')) {continue}

        let shouldDelete = false

        // Filtrar por patrón si se especifica
        if (pattern && !file.includes(pattern)) {continue}

        // Filtrar por antigüedad si se especifica
        if (olderThan) {
          const filepath = path.join(screenshotsDir, file)
          const stats = await fs.stat(filepath)
          const hoursOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60)
          
          if (hoursOld > parseInt(olderThan)) {
            shouldDelete = true
          }
        } else {
          // Si no se especifica antigüedad, eliminar todos los que coincidan con el patrón
          shouldDelete = true
        }

        if (shouldDelete) {
          const filepath = path.join(screenshotsDir, file)
          await fs.unlink(filepath)
          deletedCount++
          console.log(`🗑️ Screenshot eliminado: ${file}`)
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `${deletedCount} screenshots eliminados`
      })

    } catch (dirError) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'Directorio de screenshots no existe'
      })
    }

  } catch (error) {
    console.error('Error eliminando screenshots:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}









