// 🔧 Enterprise Middleware Composer

export function composeMiddlewares(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Utility function to create typed middleware
export function createMiddleware<T = any>(middleware: (handler: Function) => Function) {
  return middleware
}

// Common middleware combinations
export const withStandardMiddlewares = (handler: Function) => {
  const { withErrorHandler } = require('./error-handler')
  const { withApiLogging } = require('./api-logger')

  return composeMiddlewares(withErrorHandler, withApiLogging)(handler)
}

export const withAdminMiddlewares = (permissions: string[] = []) => {
  return (handler: Function) => {
    const { withErrorHandler } = require('./error-handler')
    const { withApiLogging } = require('./api-logger')
    const { withAdminAuth } = require('../auth/api-auth-middleware')

    return composeMiddlewares(withErrorHandler, withApiLogging, withAdminAuth(permissions))(handler)
  }
}

export const withValidatedAdminMiddlewares = (schema: any, permissions: string[] = []) => {
  return (handler: Function) => {
    const { withErrorHandler } = require('./error-handler')
    const { withApiLogging } = require('./api-logger')
    const { withAdminAuth } = require('../auth/api-auth-middleware')
    const { withValidation } = require('../validation/admin-schemas')

    return composeMiddlewares(
      withErrorHandler,
      withApiLogging,
      withAdminAuth(permissions),
      withValidation(schema)
    )(handler)
  }
}
