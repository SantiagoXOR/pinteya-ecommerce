// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// API: Test Screenshots Management
// Endpoint para gestión de screenshots de tests automatizados
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { testFlowManager } from '@/lib/testing/advanced-test-flows'
import { promises as fs } from 'fs'
import path from 'path'
import { ScreenshotMetadata } from '@/lib/testing/screenshot-manager'

interface ScreenshotListResponse {
  success: boolean
  data: ScreenshotMetadata[]
  total: number
  executionId?: string
  stats?: {
    total: number
    byStep: Record<string, number>
    totalSize: number
  }
}

interface ScreenshotUploadRequest {
  executionId: string
  stepId?: string
  filename: string
  description: string
  base64Data: string
  metadata?: {
    url?: string
    viewport?: { width: number; height: number }
    timestamp?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const executionId = searchParams.get('executionId')
    const filename = searchParams.get('filename')

    switch (action) {
      case 'list':
        // Listar screenshots de una ejecución
        if (!executionId) {
          return NextResponse.json(
            { error: 'executionId es requerido para listar screenshots' },
            { status: 400 }
          )
        }

        const screenshots = testFlowManager.getExecutionScreenshots(executionId)
        const stats = testFlowManager.getScreenshotStats(executionId)

        const response: ScreenshotListResponse = {
          success: true,
          data: screenshots,
          total: screenshots.length,
          executionId,
          stats,
        }

        return NextResponse.json(response)

      case 'download':
        // Descargar screenshot específico
        if (!filename) {
          return NextResponse.json(
            { error: 'filename es requerido para descargar' },
            { status: 400 }
          )
        }

        try {
          const screenshotsDir = path.join(process.cwd(), 'test-screenshots')
          const filePath = path.join(screenshotsDir, filename)

          // Verificar que el archivo existe y está en el directorio permitido
          const resolvedPath = path.resolve(filePath)
          const resolvedDir = path.resolve(screenshotsDir)

          if (!resolvedPath.startsWith(resolvedDir)) {
            return NextResponse.json({ error: 'Acceso no autorizado al archivo' }, { status: 403 })
          }

          const fileBuffer = await fs.readFile(resolvedPath)
          const fileExtension = path.extname(filename).toLowerCase()

          let contentType = 'application/octet-stream'
          if (fileExtension === '.png') {
            contentType = 'image/png'
          } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            contentType = 'image/jpeg'
          }

          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          })
        } catch (error) {
          return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
        }

      case 'preview':
        // Obtener preview base64 de screenshot
        if (!filename) {
          return NextResponse.json({ error: 'filename es requerido para preview' }, { status: 400 })
        }

        try {
          const screenshotsDir = path.join(process.cwd(), 'test-screenshots')
          const filePath = path.join(screenshotsDir, filename)

          const resolvedPath = path.resolve(filePath)
          const resolvedDir = path.resolve(screenshotsDir)

          if (!resolvedPath.startsWith(resolvedDir)) {
            return NextResponse.json({ error: 'Acceso no autorizado al archivo' }, { status: 403 })
          }

          const fileBuffer = await fs.readFile(resolvedPath)
          const base64Data = fileBuffer.toString('base64')
          const fileExtension = path.extname(filename).toLowerCase()

          let mimeType = 'image/png'
          if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            mimeType = 'image/jpeg'
          }

          return NextResponse.json({
            success: true,
            filename,
            base64: `data:${mimeType};base64,${base64Data}`,
            size: fileBuffer.length,
          })
        } catch (error) {
          return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
        }

      case 'stats':
        // Obtener estadísticas generales de screenshots
        try {
          const screenshotsDir = path.join(process.cwd(), 'test-screenshots')
          const files = await fs.readdir(screenshotsDir)

          let totalSize = 0
          const fileStats = []

          for (const file of files) {
            if (file.match(/\.(png|jpg|jpeg)$/i)) {
              const filePath = path.join(screenshotsDir, file)
              const stat = await fs.stat(filePath)
              totalSize += stat.size
              fileStats.push({
                filename: file,
                size: stat.size,
                created: stat.birthtime,
                modified: stat.mtime,
              })
            }
          }

          return NextResponse.json({
            success: true,
            stats: {
              totalFiles: fileStats.length,
              totalSize,
              averageSize: fileStats.length > 0 ? Math.round(totalSize / fileStats.length) : 0,
              oldestFile:
                fileStats.length > 0 ? Math.min(...fileStats.map(f => f.created.getTime())) : null,
              newestFile:
                fileStats.length > 0 ? Math.max(...fileStats.map(f => f.created.getTime())) : null,
            },
            files: fileStats.sort((a, b) => b.created.getTime() - a.created.getTime()),
          })
        } catch (error) {
          return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
        }

      default:
        return NextResponse.json(
          {
            error: 'Acción no válida',
            availableActions: ['list', 'download', 'preview', 'stats'],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en API de screenshots:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScreenshotUploadRequest = await request.json()
    const { executionId, stepId, filename, description, base64Data, metadata } = body

    // Validar datos requeridos
    if (!executionId || !filename || !base64Data) {
      return NextResponse.json(
        { error: 'executionId, filename y base64Data son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la ejecución existe
    const execution = testFlowManager.getExecution(executionId)
    if (!execution) {
      return NextResponse.json({ error: 'Ejecución no encontrada' }, { status: 404 })
    }

    try {
      // Crear directorio si no existe
      const screenshotsDir = path.join(process.cwd(), 'test-screenshots')
      await fs.mkdir(screenshotsDir, { recursive: true })

      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const finalFilename = `${executionId}_${timestamp}_${sanitizedFilename}`
      const filePath = path.join(screenshotsDir, finalFilename)

      // Decodificar y guardar imagen
      const imageBuffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      await fs.writeFile(filePath, imageBuffer)

      // Crear metadata del screenshot
      const screenshotMetadata: ScreenshotMetadata = {
        filename: finalFilename,
        path: filePath,
        timestamp: new Date().toISOString(),
        description,
        url: metadata?.url,
        viewport: metadata?.viewport,
        fileSize: imageBuffer.length,
      }

      // Agregar screenshot a la ejecución
      if (stepId) {
        // Agregar a un paso específico
        const step = execution.steps.find(s => s.stepId === stepId)
        if (step) {
          step.screenshots.push(screenshotMetadata)
        } else {
          return NextResponse.json({ error: 'Paso no encontrado' }, { status: 404 })
        }
      } else {
        // Agregar a la ejecución general
        execution.screenshots.push(screenshotMetadata)
      }

      return NextResponse.json({
        success: true,
        screenshot: screenshotMetadata,
        message: 'Screenshot guardado exitosamente',
      })
    } catch (error) {
      console.error('Error al guardar screenshot:', error)
      return NextResponse.json({ error: 'Error al guardar el screenshot' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error en POST de screenshots:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const executionId = searchParams.get('executionId')
    const action = searchParams.get('action')

    if (action === 'cleanup') {
      // Limpiar screenshots antiguos
      const daysOld = parseInt(searchParams.get('daysOld') || '7')
      const screenshotsDir = path.join(process.cwd(), 'test-screenshots')

      try {
        const files = await fs.readdir(screenshotsDir)
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
        let deletedCount = 0
        let totalSize = 0

        for (const file of files) {
          if (file.match(/\.(png|jpg|jpeg)$/i)) {
            const filePath = path.join(screenshotsDir, file)
            const stat = await fs.stat(filePath)

            if (stat.birthtime < cutoffDate) {
              totalSize += stat.size
              await fs.unlink(filePath)
              deletedCount++
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `Limpieza completada: ${deletedCount} archivos eliminados`,
          deletedFiles: deletedCount,
          freedSpace: totalSize,
        })
      } catch (error) {
        return NextResponse.json({ error: 'Error durante la limpieza' }, { status: 500 })
      }
    }

    if (!filename) {
      return NextResponse.json({ error: 'filename es requerido para eliminar' }, { status: 400 })
    }

    try {
      const screenshotsDir = path.join(process.cwd(), 'test-screenshots')
      const filePath = path.join(screenshotsDir, filename)

      // Verificar seguridad del path
      const resolvedPath = path.resolve(filePath)
      const resolvedDir = path.resolve(screenshotsDir)

      if (!resolvedPath.startsWith(resolvedDir)) {
        return NextResponse.json({ error: 'Acceso no autorizado al archivo' }, { status: 403 })
      }

      await fs.unlink(resolvedPath)

      // Remover de las ejecuciones si se especifica executionId
      if (executionId) {
        const execution = testFlowManager.getExecution(executionId)
        if (execution) {
          // Remover de screenshots generales
          execution.screenshots = execution.screenshots.filter(s => s.filename !== filename)

          // Remover de screenshots de pasos
          execution.steps.forEach(step => {
            step.screenshots = step.screenshots.filter(s => s.filename !== filename)
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Screenshot eliminado exitosamente',
        filename,
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Archivo no encontrado o error al eliminar' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error en DELETE de screenshots:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
