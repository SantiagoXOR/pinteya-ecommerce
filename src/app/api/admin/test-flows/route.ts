// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// API: Test Flows Management
// Endpoint para gestión de flujos de testing automatizados
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { testFlowManager } from '@/lib/testing/advanced-test-flows'
import { ScreenshotMetadata } from '@/lib/testing/screenshot-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const flowId = searchParams.get('flowId')
    const executionId = searchParams.get('executionId')

    switch (action) {
      case 'flows':
        // Obtener todos los flujos disponibles
        const flows = testFlowManager.getAvailableFlows()
        return NextResponse.json({
          success: true,
          data: flows,
          total: flows.length,
        })

      case 'executions':
        // Obtener ejecuciones (todas o de un flujo específico)
        const executions = testFlowManager.getExecutions(flowId || undefined)
        return NextResponse.json({
          success: true,
          data: executions.map(exec => ({
            ...exec,
            screenshots: exec.screenshots || [],
            screenshotCount:
              (exec.screenshots || []).length +
              exec.steps.reduce((total, step) => total + (step.screenshots || []).length, 0),
          })),
          total: executions.length,
          flowId: flowId || 'all',
        })

      case 'execution':
        // Obtener ejecución específica
        if (!executionId) {
          return NextResponse.json({ error: 'executionId es requerido' }, { status: 400 })
        }

        const execution = testFlowManager.getExecution(executionId)
        if (!execution) {
          return NextResponse.json({ error: 'Ejecución no encontrada' }, { status: 404 })
        }

        // Incluir estadísticas de screenshots
        const screenshotStats = testFlowManager.getScreenshotStats(executionId)

        return NextResponse.json({
          success: true,
          data: {
            ...execution,
            screenshotStats,
          },
        })

      default:
        // Por defecto, retornar resumen
        const allFlows = testFlowManager.getAvailableFlows()
        const allExecutions = testFlowManager.getExecutions()

        const summary = {
          totalFlows: allFlows.length,
          totalExecutions: allExecutions.length,
          recentExecutions: allExecutions
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, 10),
          flowStats: allFlows.map(flow => {
            const flowExecutions = allExecutions.filter(e => e.flowId === flow.id)
            const successful = flowExecutions.filter(e => e.status === 'success').length
            const failed = flowExecutions.filter(e => e.status === 'failed').length
            const running = flowExecutions.filter(e => e.status === 'running').length

            return {
              flowId: flow.id,
              name: flow.name,
              totalExecutions: flowExecutions.length,
              successful,
              failed,
              running,
              successRate:
                flowExecutions.length > 0 ? (successful / flowExecutions.length) * 100 : 0,
              lastExecution:
                flowExecutions.length > 0
                  ? flowExecutions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0]
                  : null,
            }
          }),
        }

        return NextResponse.json({
          success: true,
          data: summary,
        })
    }
  } catch (error) {
    console.error('Error en API de test flows:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, flowId, trigger = 'manual' } = body

    switch (action) {
      case 'execute':
        // Ejecutar un flujo específico
        if (!flowId) {
          return NextResponse.json(
            { error: 'flowId es requerido para ejecutar un flujo' },
            { status: 400 }
          )
        }

        console.log(`🚀 Iniciando ejecución de flujo: ${flowId}`)

        // Ejecutar flujo de manera asíncrona
        const execution = await testFlowManager.executeFlow(flowId, trigger)

        return NextResponse.json({
          success: true,
          data: execution,
          message: `Flujo ${flowId} iniciado exitosamente`,
        })

      case 'register':
        // Registrar un nuevo flujo (para casos avanzados)
        const { flow } = body
        if (!flow) {
          return NextResponse.json(
            { error: 'Configuración de flujo es requerida' },
            { status: 400 }
          )
        }

        testFlowManager.registerFlow(flow)

        return NextResponse.json({
          success: true,
          message: `Flujo ${flow.id} registrado exitosamente`,
        })

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error ejecutando flujo:', error)
    return NextResponse.json(
      {
        error: 'Error ejecutando flujo',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
