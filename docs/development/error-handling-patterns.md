# 🛠️ Patrones de Error Handling - Pinteya E-commerce

**Fecha de Implementación**: 21 de Enero, 2025  
**Estado**: ✅ IMPLEMENTADO Y VERIFICADO  
**Contexto**: Solución definitiva del error JSON persistente

---

## 🎯 **Objetivo**

Documentar los patrones estándar de manejo de errores implementados en Pinteya E-commerce para prevenir errores JSON y garantizar la estabilidad de la aplicación.

## 🔧 **Patrones Implementados**

### 1. **API Routes - Patrón Estándar**

#### ✅ **Patrón Correcto (Implementado)**
```typescript
// src/app/api/products/route.ts
export async function GET(request: NextRequest) {
  try {
    // Lógica de la API
    const { data, error } = await supabase.from('products').select();

    if (error) {
      console.error('Error en GET /api/products - Supabase:', error);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error obteniendo productos de la base de datos',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Respuesta exitosa estructurada
    const response: PaginatedResponse<ProductWithCategory> = {
      data: products || [],
      pagination: { /* ... */ },
      success: true,
      message: `${products?.length || 0} productos encontrados`,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en GET /api/products:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

#### ❌ **Patrón Problemático (Corregido)**
```typescript
// NUNCA HACER ESTO
if (error) {
  handleSupabaseError(error, 'GET /api/products'); // Lanza excepción!
}
```

### 2. **Frontend API Calls - Patrón Estándar**

#### ✅ **Patrón Correcto (Implementado)**
```typescript
// src/lib/api/products.ts
export async function getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> {
  try {
    const response = await fetch(`/api/products?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    // Usar parsing seguro de JSON
    const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response);
    
    if (!result.success) {
      // Return fallback instead of throwing
      return {
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        success: false,
        message: result.error || 'Error loading products',
      };
    }

    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    
    // Return fallback instead of throwing
    return {
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
      success: false,
      message: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
```

#### ❌ **Patrón Problemático (Corregido)**
```typescript
// NUNCA HACER ESTO
const result = await safeApiResponseJson(response);
if (!result.success) {
  throw new Error(result.error); // Lanza excepción!
}
```

### 3. **JSON Parsing Seguro**

#### ✅ **Utilidad safeApiResponseJson (Implementada)**
```typescript
// src/lib/json-utils.ts
export async function safeApiResponseJson<T = any>(response: Response): Promise<SafeJsonResult<T>> {
  const DEBUG_MODE = process.env.NODE_ENV === 'development';
  
  try {
    if (DEBUG_MODE) {
      console.log('🔍 safeApiResponseJson - Response status:', response.status, response.statusText);
    }
    
    // Verificar que la respuesta sea válida
    if (!response.ok) {
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
```

### 4. **React Hooks - Patrón Estándar**

#### ✅ **Patrón Correcto (Implementado)**
```typescript
// src/hooks/useProducts.ts
const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
  setState(prev => ({ ...prev, loading: true, error: null }));

  try {
    const response: PaginatedResponse<ProductWithCategory> = await getProducts(filtersToUse);

    if (response.success) {
      setState(prev => ({
        ...prev,
        products: adaptedProducts,
        loading: false,
        pagination: response.pagination,
      }));
    } else {
      setState(prev => ({
        ...prev,
        loading: false,
        error: response.error || 'Error obteniendo productos',
      }));
    }
  } catch (error: any) {
    setState(prev => ({
      ...prev,
      loading: false,
      error: error.message || 'Error inesperado',
    }));
  }
}, [filters]);
```

## 🛡️ **Reglas de Implementación**

### **Reglas Obligatorias**

1. **NUNCA usar** `JSON.parse()` directamente
2. **SIEMPRE usar** `safeJsonParse()` o `safeApiResponseJson()`
3. **NUNCA lanzar excepciones** en API routes - devolver respuestas estructuradas
4. **SIEMPRE proporcionar fallbacks** en lugar de propagación de errores
5. **USAR logging condicional** basado en NODE_ENV

### **Tipos de Respuesta Estándar**

```typescript
// Respuesta exitosa
interface ApiResponse<T> {
  data: T;
  success: true;
  message?: string;
}

// Respuesta de error
interface ApiResponse<T> {
  data: null;
  success: false;
  error: string;
}

// Respuesta paginada
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 🧪 **Herramientas de Testing**

### **1. test-api.html**
- **Ubicación**: `public/test-api.html`
- **Propósito**: Testing directo de APIs
- **Uso**: `http://localhost:3000/test-api.html`

### **2. clear-storage.html**
- **Ubicación**: `public/clear-storage.html`
- **Propósito**: Limpieza de localStorage corrupto
- **Uso**: `http://localhost:3000/clear-storage.html`

### **3. Comandos de Debug**
```javascript
// En consola del navegador
window.detectJsonProblems()     // Detectar problemas JSON
window.cleanCorruptedStorage()  // Limpiar datos corruptos
window.clearAllPinteyaStorage() // Reset completo
```

## 📊 **Verificación de Implementación**

### **Checklist de Verificación**

- ✅ API routes devuelven respuestas JSON estructuradas
- ✅ No hay excepciones sin manejar en API routes
- ✅ Frontend usa `safeApiResponseJson` para parsing
- ✅ Hooks proporcionan fallbacks en lugar de crashes
- ✅ Logging condicional implementado
- ✅ Herramientas de debug disponibles
- ✅ Tests verifican manejo de errores

### **Indicadores de Éxito**

1. **Console Clean**: No hay errores "Unexpected token" en consola
2. **Graceful Degradation**: Errores se muestran como mensajes, no crashes
3. **API Stability**: APIs devuelven respuestas válidas o errores estructurados
4. **User Experience**: Aplicación funciona sin interrupciones

---

**Estado**: ✅ **PATRONES IMPLEMENTADOS Y VERIFICADOS**  
**Aplicación**: 🚀 **COMPLETAMENTE ESTABLE SIN ERRORES JSON**  
**Mantenimiento**: 🛠️ **HERRAMIENTAS DE DEBUG DISPONIBLES**

---

**Implementado por**: Augment Agent  
**Fecha**: Enero 2025  
**Criticidad**: 🔴 **CRÍTICA** - Prevención de errores en producción  
**Estado**: ✅ **IMPLEMENTADO DEFINITIVAMENTE**



