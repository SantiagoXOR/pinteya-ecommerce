/**
 * Utilidades para manejo seguro de JSON
 * Previene errores de parsing con datos corruptos o malformados
 */

export interface SafeJsonResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Parsea JSON de forma segura, manejando casos edge y datos corruptos
 */
export function safeJsonParse<T = any>(jsonString: string | null | undefined): SafeJsonResult<T> {
  // Validaciones básicas
  if (!jsonString) {
    return {
      success: false,
      data: null,
      error: 'JSON string is null or undefined'
    };
  }

  // Limpiar string
  const trimmed = jsonString.trim();
  
  // Detectar casos problemáticos
  if (trimmed === '' || trimmed === '""' || trimmed === "''" || trimmed === 'null' || trimmed === 'undefined') {
    return {
      success: false,
      data: null,
      error: 'JSON string is empty or invalid'
    };
  }

  // Detectar comillas dobles corruptas
  if (trimmed.includes('""') && trimmed.length < 5) {
    return {
      success: false,
      data: null,
      error: 'Detected corrupted JSON with empty quotes'
    };
  }

  // Intentar parsear
  try {
    const parsed = JSON.parse(trimmed);
    return {
      success: true,
      data: parsed,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown JSON parse error'
    };
  }
}

/**
 * Stringify JSON de forma segura, manejando objetos circulares
 */
export function safeJsonStringify(data: any, space?: number): SafeJsonResult<string> {
  try {
    const result = JSON.stringify(data, null, space);
    return {
      success: true,
      data: result,
      error: undefined
    };
  } catch (error) {
    // Intentar con replacer para objetos circulares
    try {
      const seen = new WeakSet();
      const result = JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }, space);
      
      return {
        success: true,
        data: result,
        error: undefined
      };
    } catch (fallbackError) {
      return {
        success: false,
        data: null,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown JSON stringify error'
      };
    }
  }
}

/**
 * Carga datos de localStorage de forma segura
 */
export function safeLocalStorageGet<T = any>(key: string): SafeJsonResult<T> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      data: null,
      error: 'localStorage not available (SSR)'
    };
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {
        success: false,
        data: null,
        error: 'No data found in localStorage'
      };
    }

    return safeJsonParse<T>(stored);
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'localStorage access error'
    };
  }
}

/**
 * Guarda datos en localStorage de forma segura
 */
export function safeLocalStorageSet(key: string, data: any): SafeJsonResult<boolean> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      data: false,
      error: 'localStorage not available (SSR)'
    };
  }

  try {
    const stringifyResult = safeJsonStringify(data);
    if (!stringifyResult.success) {
      return {
        success: false,
        data: false,
        error: `Failed to stringify data: ${stringifyResult.error}`
      };
    }

    localStorage.setItem(key, stringifyResult.data!);
    return {
      success: true,
      data: true,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      data: false,
      error: error instanceof Error ? error.message : 'localStorage write error'
    };
  }
}

/**
 * Limpia localStorage de datos corruptos
 */
export function cleanCorruptedLocalStorage(keys: string[]): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  let cleanedCount = 0;

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parseResult = safeJsonParse(stored);
        if (!parseResult.success) {
          console.warn(`Cleaning corrupted localStorage key: ${key}`, parseResult.error);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.warn(`Error checking localStorage key ${key}:`, error);
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });

  return cleanedCount;
}

/**
 * Valida que una respuesta de API tenga JSON válido
 */
export async function safeApiResponseJson<T = any>(response: Response): Promise<SafeJsonResult<T>> {
  const DEBUG_MODE = process.env.NODE_ENV === 'development';

  try {
    if (DEBUG_MODE) {
      console.log('🔍 safeApiResponseJson - Response status:', response.status, response.statusText);
    }

    // Verificar que la respuesta sea válida
    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      try {
        const errorText = await response.text();
        if (DEBUG_MODE) {
          console.log('❌ Error response body:', errorText);
        }
        errorDetails = errorText ? ` - ${errorText}` : '';
      } catch (textError) {
        if (DEBUG_MODE) {
          console.warn('Could not read error response body:', textError);
        }
      }

      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}${errorDetails}`
      };
    }

    // Obtener el texto primero
    const text = await response.text();
    if (DEBUG_MODE) {
      console.log('📄 Response text length:', text.length);
      console.log('📄 Response text preview:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    }

    // Parsear de forma segura
    const parseResult = safeJsonParse<T>(text);
    if (DEBUG_MODE) {
      console.log('🔍 Parse result:', { success: parseResult.success, error: parseResult.error });
    }

    return parseResult;
  } catch (error) {
    console.error('❌ safeApiResponseJson error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'API response error'
    };
  }
}

/**
 * Constantes para keys de localStorage comunes
 */
export const STORAGE_KEYS = {
  CART: 'pinteya-cart',
  RECENT_SEARCHES: 'pinteya-recent-searches',
  USER_PREFERENCES: 'pinteya-user-preferences',
  ANALYTICS: 'pinteya-analytics',
} as const;

/**
 * Función de inicialización para limpiar localStorage corrupto al cargar la app
 */
export function initializeJsonSafety(): void {
  if (typeof window === 'undefined') return;

  const keysToCheck = Object.values(STORAGE_KEYS);
  const cleanedCount = cleanCorruptedLocalStorage(keysToCheck);
  
  if (cleanedCount > 0) {
    console.info(`🧹 Cleaned ${cleanedCount} corrupted localStorage entries`);
  }
}
