# Rules: TypeScript y Tipado

## Estándares de TypeScript

Este proyecto requiere **100% de tipado**. **NUNCA** usar `any` types.

## Reglas de TypeScript

### 1. Tipado Estricto

- **NUNCA** usar `any`
- **SIEMPRE** definir tipos explícitos para:
  - Props de componentes
  - Parámetros de funciones
  - Valores de retorno
  - Variables de estado

### 2. Interfaces vs Types

- Usar `interface` para objetos que pueden extenderse
- Usar `type` para uniones, intersecciones y tipos complejos
- Preferir `interface` para props de componentes

### 3. Tipos de Base de Datos

- **SIEMPRE** usar tipos generados de Supabase cuando estén disponibles
- Importar desde `@/types/database`
- Crear tipos derivados cuando sea necesario:
  ```typescript
  type ProductWithCategory = Database['public']['Tables']['products']['Row'] & {
    category: Category;
  };
  ```

### 4. Tipos de API

- **SIEMPRE** definir tipos para requests y responses
- Usar Zod para validación y inferencia de tipos
- Ejemplo:
  ```typescript
  const ProductSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
  });
  
  type ProductInput = z.infer<typeof ProductSchema>;
  ```

### 5. Tipos de Componentes

- **SIEMPRE** tipar props con interfaces
- Usar `React.FC` solo cuando sea necesario
- Preferir función con props tipadas:
  ```typescript
  interface ProductCardProps {
    product: Product;
    onAddToCart?: (id: string) => void;
  }
  
  export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    // ...
  }
  ```

### 6. Hooks Personalizados

- **SIEMPRE** tipar valores de retorno de hooks
- Usar genéricos cuando sea apropiado:
  ```typescript
  function useApi<T>(url: string): { data: T | null; loading: boolean } {
    // ...
  }
  ```

### 7. Tipos de Eventos

- **SIEMPRE** usar tipos de React para eventos:
  ```typescript
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };
  ```

### 8. Tipos Opcionales

- Usar `?` para propiedades opcionales
- Usar `| null` o `| undefined` explícitamente cuando sea necesario
- Preferir `| null` sobre `| undefined` para consistencia

### 9. Tipos de Errores

- **SIEMPRE** tipar errores en catch blocks:
  ```typescript
  try {
    // ...
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
  ```

### 10. Tipos de Next.js

- Usar tipos de Next.js cuando estén disponibles:
  - `NextRequest`, `NextResponse` para API routes
  - `Metadata` para metadata de páginas
  - `PageProps` para props de páginas

## Archivos de Tipos

- `src/types/` - Tipos compartidos del proyecto
- `src/types/database.ts` - Tipos de base de datos
- `src/types/api.ts` - Tipos de API

## Verificación

- El proyecto debe compilar sin errores de TypeScript
- `tsc --noEmit` debe pasar sin errores
- No hay `@ts-ignore` o `@ts-expect-error` sin comentarios explicativos
