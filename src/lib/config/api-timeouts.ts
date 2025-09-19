// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN CENTRALIZADA DE TIMEOUTS
// ===================================
// Configuración centralizada para todos los timeouts de APIs
// con valores por defecto y variables de entorno

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface TimeoutConfig {
  default: number;
  database: number;
  external: number;
  upload: number;
  payment: number;
  auth: number;
  admin: number;
  webhook: number;
  email: number;
  image: number;
}

export interface EndpointTimeouts {
  connection: number;
  request: number;
  response: number;
  total: number;
}

// ===================================
// CONFIGURACIÓN BASE DE TIMEOUTS
// ===================================

const DEFAULT_TIMEOUTS = {
  // Timeout por defecto para operaciones generales
  default: 30000,        // 30 segundos
  
  // Timeout para operaciones de base de datos
  database: 15000,       // 15 segundos
  
  // Timeout para APIs externas (MercadoPago, etc.)
  external: 45000,       // 45 segundos
  
  // Timeout para uploads de archivos
  upload: 120000,        // 2 minutos
  
  // Timeout para operaciones de pago
  payment: 60000,        // 1 minuto
  
  // Timeout para operaciones de autenticación
  auth: 20000,           // 20 segundos
  
  // Timeout para operaciones administrativas
  admin: 45000,          // 45 segundos
  
  // Timeout para webhooks
  webhook: 10000,        // 10 segundos
  
  // Timeout para envío de emails
  email: 30000,          // 30 segundos
  
  // Timeout para procesamiento de imágenes
  image: 90000,          // 1.5 minutos
} as const;

// ===================================
// FUNCIÓN PARA OBTENER TIMEOUT DESDE ENV
// ===================================

function getTimeoutFromEnv(key: string, defaultValue: number): number {
  const envValue = process.env[`API_TIMEOUT_${key.toUpperCase()}`];
  if (!envValue) {return defaultValue;}
  
  const parsed = parseInt(envValue, 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.warn(`[TIMEOUT_CONFIG] Invalid timeout value for ${key}: ${envValue}, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

// ===================================
// CONFIGURACIÓN FINAL DE TIMEOUTS
// ===================================

export const API_TIMEOUTS: TimeoutConfig = {
  default: getTimeoutFromEnv('DEFAULT', DEFAULT_TIMEOUTS.default),
  database: getTimeoutFromEnv('DATABASE', DEFAULT_TIMEOUTS.database),
  external: getTimeoutFromEnv('EXTERNAL', DEFAULT_TIMEOUTS.external),
  upload: getTimeoutFromEnv('UPLOAD', DEFAULT_TIMEOUTS.upload),
  payment: getTimeoutFromEnv('PAYMENT', DEFAULT_TIMEOUTS.payment),
  auth: getTimeoutFromEnv('AUTH', DEFAULT_TIMEOUTS.auth),
  admin: getTimeoutFromEnv('ADMIN', DEFAULT_TIMEOUTS.admin),
  webhook: getTimeoutFromEnv('WEBHOOK', DEFAULT_TIMEOUTS.webhook),
  email: getTimeoutFromEnv('EMAIL', DEFAULT_TIMEOUTS.email),
  image: getTimeoutFromEnv('IMAGE', DEFAULT_TIMEOUTS.image),
};

// ===================================
// TIMEOUTS ESPECÍFICOS POR ENDPOINT
// ===================================

export const ENDPOINT_TIMEOUTS: Record<string, EndpointTimeouts> = {
  // APIs de productos
  '/api/products': {
    connection: 5000,
    request: API_TIMEOUTS.database,
    response: 10000,
    total: API_TIMEOUTS.database + 15000, // database + buffer
  },

  // APIs de órdenes
  '/api/orders': {
    connection: 5000,
    request: API_TIMEOUTS.database,
    response: 15000,
    total: API_TIMEOUTS.database + 20000, // database + buffer
  },
  
  // APIs de pagos
  '/api/payments': {
    connection: 10000,
    request: API_TIMEOUTS.payment,
    response: 20000,
    total: Math.max(API_TIMEOUTS.payment + 30000, API_TIMEOUTS.external),
  },

  // APIs de autenticación
  '/api/auth': {
    connection: 3000,
    request: API_TIMEOUTS.auth,
    response: 5000,
    total: API_TIMEOUTS.auth + 8000,
  },

  // APIs administrativas
  '/api/admin': {
    connection: 5000,
    request: API_TIMEOUTS.admin,
    response: 15000,
    total: API_TIMEOUTS.admin + 20000,
  },

  // Webhooks
  '/api/webhooks': {
    connection: 2000,
    request: API_TIMEOUTS.webhook,
    response: 3000,
    total: API_TIMEOUTS.webhook + 5000,
  },

  // APIs de upload
  '/api/upload': {
    connection: 10000,
    request: API_TIMEOUTS.upload,
    response: 30000,
    total: API_TIMEOUTS.upload + 40000,
  },
};

// ===================================
// HELPERS PARA OBTENER TIMEOUTS
// ===================================

/**
 * Obtiene el timeout apropiado para un tipo de operación
 */
export function getTimeout(type: keyof TimeoutConfig): number {
  return API_TIMEOUTS[type];
}

/**
 * Obtiene los timeouts específicos para un endpoint
 */
export function getEndpointTimeouts(path: string): EndpointTimeouts {
  // Buscar coincidencia exacta primero
  if (ENDPOINT_TIMEOUTS[path]) {
    return ENDPOINT_TIMEOUTS[path];
  }
  
  // Buscar coincidencia por prefijo
  const matchingPath = Object.keys(ENDPOINT_TIMEOUTS).find(key => 
    path.startsWith(key)
  );
  
  if (matchingPath) {
    return ENDPOINT_TIMEOUTS[matchingPath];
  }
  
  // Fallback a timeouts por defecto
  return {
    connection: 5000,
    request: API_TIMEOUTS.default,
    response: 10000,
    total: API_TIMEOUTS.default,
  };
}

/**
 * Crea un AbortController con timeout automático
 */
export function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return { controller, timeoutId };
}

/**
 * Wrapper para fetch con timeout automático
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const timeout = options.timeout || API_TIMEOUTS.default;
  const { controller, timeoutId } = createTimeoutController(timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Wrapper para operaciones de base de datos con timeout
 */
export function withDatabaseTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeout: number = API_TIMEOUTS.database
): Promise<T> {
  const { controller, timeoutId } = createTimeoutController(timeout);
  
  return operation(controller.signal)
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Wrapper para operaciones externas con timeout
 */
export function withExternalTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeout: number = API_TIMEOUTS.external
): Promise<T> {
  const { controller, timeoutId } = createTimeoutController(timeout);

  return operation(controller.signal)
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Wrapper genérico para operaciones con timeout
 */
export function withTimeout<T>(
  operation: () => Promise<T>,
  timeout: number = API_TIMEOUTS.default
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timeout after ${timeout}ms`));
    }, timeout);

    operation()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

// ===================================
// CONFIGURACIÓN DE LOGGING
// ===================================

/**
 * Log de timeout configurado
 */
export function logTimeoutConfig(): void {
  console.log('[TIMEOUT_CONFIG] Configuración de timeouts cargada:', {
    environment: process.env.NODE_ENV,
    timeouts: API_TIMEOUTS,
    customEnvVars: Object.keys(process.env)
      .filter(key => key.startsWith('API_TIMEOUT_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>),
  });
}

// ===================================
// VALIDACIÓN DE CONFIGURACIÓN
// ===================================

/**
 * Valida que todos los timeouts estén configurados correctamente
 */
export function validateTimeoutConfig(): boolean {
  const errors: string[] = [];
  
  Object.entries(API_TIMEOUTS).forEach(([key, value]) => {
    if (typeof value !== 'number' || value <= 0) {
      errors.push(`Invalid timeout for ${key}: ${value}`);
    }
    
    if (value > 300000) { // 5 minutos máximo
      errors.push(`Timeout too high for ${key}: ${value}ms (max: 300000ms)`);
    }
  });
  
  if (errors.length > 0) {
    console.error('[TIMEOUT_CONFIG] Validation errors:', errors);
    return false;
  }
  
  return true;
}

// ===================================
// INICIALIZACIÓN
// ===================================

// Validar configuración al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  validateTimeoutConfig();
  
  if (process.env.NODE_ENV === 'development') {
    logTimeoutConfig();
  }
}









