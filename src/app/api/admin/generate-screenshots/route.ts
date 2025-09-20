// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// API ENDPOINT PARA GENERAR SCREENSHOTS AUTOMÁTICAMENTE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

interface GenerateScreenshotsRequest {
  flow: 'checkout' | 'admin' | 'shop'
  force?: boolean
}

interface GenerateScreenshotsResponse {
  success: boolean
  count?: number
  screenshots?: string[]
  error?: string
  duration?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateScreenshotsRequest = await request.json()
    
    if (!body.flow) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro "flow" es requerido'
      }, { status: 400 })
    }

    console.log(`🚀 Iniciando generación de screenshots para flujo: ${body.flow}`)
    
    const startTime = Date.now()
    
    // Determinar qué script ejecutar
    let scriptPath: string
    const scriptArgs: string[] = []
    
    switch (body.flow) {
      case 'checkout':
        scriptPath = path.join(process.cwd(), 'scripts', 'generate-checkout-screenshots.js')
        break
      case 'admin':
        scriptPath = path.join(process.cwd(), 'scripts', 'admin-panel-audit.js')
        break
      case 'shop':
        scriptPath = path.join(process.cwd(), 'scripts', 'generate-shop-screenshots.js')
        break
      default:
        return NextResponse.json({
          success: false,
          error: `Flujo no soportado: ${body.flow}`
        }, { status: 400 })
    }

    // Verificar que el servidor esté corriendo
    try {
      const healthCheck = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 5000
      })
      
      if (!healthCheck.ok) {
        throw new Error('Servidor no disponible')
      }
    } catch (healthError) {
      return NextResponse.json({
        success: false,
        error: 'El servidor debe estar corriendo en localhost:3000 para generar screenshots'
      }, { status: 503 })
    }

    // Ejecutar script de generación
    try {
      console.log(`📸 Ejecutando script: ${scriptPath}`)
      
      const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutos timeout
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      })

      if (stderr && !stderr.includes('Warning')) {
        console.warn('Advertencias del script:', stderr)
      }

      console.log('Salida del script:', stdout)

      // Parsear resultados del script
      const lines = stdout.split('\n')
      const screenshotLines = lines.filter(line => line.includes('Screenshot guardado:'))
      const screenshotCount = screenshotLines.length

      const screenshots = screenshotLines.map(line => {
        const match = line.match(/Screenshot guardado: (.+)/)
        return match ? match[1] : ''
      }).filter(Boolean)

      const duration = Date.now() - startTime

      console.log(`✅ Generación completada: ${screenshotCount} screenshots en ${duration}ms`)

      return NextResponse.json({
        success: true,
        count: screenshotCount,
        screenshots,
        duration
      })

    } catch (execError: any) {
      console.error('Error ejecutando script:', execError)
      
      return NextResponse.json({
        success: false,
        error: `Error ejecutando script: ${execError.message}`,
        details: execError.stderr || execError.stdout
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error general:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Endpoint GET para verificar estado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flow = searchParams.get('flow')

    if (!flow) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro "flow" es requerido'
      }, { status: 400 })
    }

    // Verificar si existen screenshots para el flujo
    const fs = require('fs/promises')
    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots')
    
    try {
      const files = await fs.readdir(screenshotsDir)
      const flowScreenshots = files.filter((file: string) => 
        file.includes(flow) && file.endsWith('.png')
      )

      return NextResponse.json({
        success: true,
        flow,
        exists: flowScreenshots.length > 0,
        count: flowScreenshots.length,
        screenshots: flowScreenshots
      })

    } catch (dirError) {
      return NextResponse.json({
        success: true,
        flow,
        exists: false,
        count: 0,
        screenshots: []
      })
    }

  } catch (error) {
    console.error('Error verificando screenshots:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Endpoint DELETE para limpiar screenshots
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flow = searchParams.get('flow')
    const olderThan = searchParams.get('olderThan') // en horas

    const fs = require('fs/promises')
    const screenshotsDir = path.join(process.cwd(), 'public', 'test-screenshots')
    
    try {
      const files = await fs.readdir(screenshotsDir)
      let deletedCount = 0

      for (const file of files) {
        if (!file.endsWith('.png')) {continue}

        // Filtrar por flujo si se especifica
        if (flow && !file.includes(flow)) {continue}

        // Filtrar por antigüedad si se especifica
        if (olderThan) {
          const filepath = path.join(screenshotsDir, file)
          const stats = await fs.stat(filepath)
          const hoursOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60)
          
          if (hoursOld <= parseInt(olderThan)) {continue}
        }

        // Eliminar archivo
        const filepath = path.join(screenshotsDir, file)
        await fs.unlink(filepath)
        deletedCount++
        console.log(`🗑️ Screenshot eliminado: ${file}`)
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










