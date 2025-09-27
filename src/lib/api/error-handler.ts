// 🔧 Enterprise Error Handler

import { NextRequest, NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function withErrorHandler(handler: Function) {
  return async function (request: NextRequest, context: any) {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: error.statusCode }
        )
      }

      // Error no controlado
      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          path: request.url,
        },
        { status: 500 }
      )
    }
  }
}

// Errores específicos
export const NotFoundError = (resource: string) =>
  new ApiError(`${resource} no encontrado`, 404, 'NOT_FOUND')

export const ValidationError = (message: string, details?: any) =>
  new ApiError(message, 422, 'VALIDATION_ERROR', details)

export const UnauthorizedError = (message: string = 'No autorizado') =>
  new ApiError(message, 401, 'UNAUTHORIZED')

export const ForbiddenError = (message: string = 'Sin permisos') =>
  new ApiError(message, 403, 'FORBIDDEN')

export const ConflictError = (message: string, details?: any) =>
  new ApiError(message, 409, 'CONFLICT', details)
