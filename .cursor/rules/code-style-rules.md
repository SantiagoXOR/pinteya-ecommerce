# Rules: Estilo de Código y Convenciones

## Convenciones de Nomenclatura

### Archivos y Directorios

- **Componentes**: PascalCase - `ProductCard.tsx`
- **Hooks**: camelCase con prefijo `use` - `useProductSearch.ts`
- **Utilidades**: camelCase - `formatCurrency.ts`
- **Configuración**: kebab-case - `next.config.js`
- **Tipos/Interfaces**: PascalCase - `Product.ts`

### Variables y Funciones

- **Variables**: camelCase - `productList`, `isLoading`
- **Constantes**: UPPER_SNAKE_CASE - `MAX_CART_ITEMS`, `API_BASE_URL`
- **Funciones**: camelCase - `calculateTotal()`, `getUserData()`
- **Componentes**: PascalCase - `ProductCard`, `ShoppingCart`

### Clases y Tipos

- **Clases**: PascalCase - `ProductService`, `OrderManager`
- **Interfaces**: PascalCase con prefijo `I` opcional - `IProduct` o `Product`
- **Types**: PascalCase - `ProductData`, `ApiResponse`

## Estructura de Componentes

### Orden de Imports

1. React y Next.js
2. Librerías de terceros
3. Componentes internos
4. Hooks personalizados
5. Utilidades y helpers
6. Tipos e interfaces
7. Estilos (si hay CSS modules)

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Third-party
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/Product/ProductCard';

// 4. Custom hooks
import { useProductSearch } from '@/hooks/useProductSearch';

// 5. Utils
import { formatCurrency } from '@/utils/formatCurrency';

// 6. Types
import type { Product } from '@/types/product';
```

### Estructura de Componente

```typescript
// 1. Imports
import ...

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 7. Computed values
  const computedValue = useMemo(() => {
    // ...
  }, [deps]);
  
  // 8. Render
  return (
    // JSX
  );
}
```

## Formato de Código

### Indentación

- Usar 2 espacios (no tabs)
- Configurado en `.prettierrc` o `prettier.config.js`

### Líneas

- Máximo 100 caracteres por línea
- Usar saltos de línea apropiados para legibilidad

### Comentarios

- **SIEMPRE** comentar código complejo o no obvio
- Usar comentarios JSDoc para funciones públicas:
  ```typescript
  /**
   * Calcula el total del carrito incluyendo impuestos
   * @param items - Array de items del carrito
   * @param taxRate - Tasa de impuesto (0-1)
   * @returns Total calculado
   */
  function calculateTotal(items: CartItem[], taxRate: number): number {
    // ...
  }
  ```

### Strings

- Preferir comillas simples para strings normales
- Usar template literals para strings con variables
- Usar comillas dobles para JSX attributes

## Organización de Archivos

### Estructura de Componente Complejo

```
components/
  Product/
    ProductCard.tsx          # Componente principal
    ProductCard.test.tsx     # Tests
    ProductCard.stories.tsx  # Storybook
    index.ts                # Export
    types.ts                # Tipos específicos
    utils.ts                # Utilidades específicas
```

### Estructura de Hook

```
hooks/
  useProductSearch.ts       # Hook principal
  useProductSearch.test.ts  # Tests
  index.ts                  # Export
```

## Mejores Prácticas

### 1. Early Returns

Preferir early returns para reducir anidación:

```typescript
// ✅ Correcto
function processOrder(order: Order) {
  if (!order) return null;
  if (!order.items.length) return null;
  
  // Lógica principal
}

// ❌ Evitar
function processOrder(order: Order) {
  if (order) {
    if (order.items.length) {
      // Lógica principal
    }
  }
}
```

### 2. Destructuring

Usar destructuring cuando sea apropiado:

```typescript
// ✅ Correcto
const { name, price, category } = product;

// ❌ Evitar cuando no mejora legibilidad
const name = product.name;
const price = product.price;
```

### 3. Optional Chaining

Usar optional chaining para acceso seguro:

```typescript
// ✅ Correcto
const categoryName = product?.category?.name;

// ❌ Evitar
const categoryName = product && product.category && product.category.name;
```

### 4. Nullish Coalescing

Usar `??` para valores por defecto:

```typescript
// ✅ Correcto
const price = product.price ?? 0;

// ❌ Evitar
const price = product.price || 0; // Falso si price es 0
```

## Verificación

- Ejecutar `npm run format` antes de commitear
- Ejecutar `npm run lint` para verificar errores
- El proyecto usa Prettier y ESLint configurados
