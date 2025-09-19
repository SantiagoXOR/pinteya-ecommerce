# 📝 Estándares de Código

> Guía completa de estándares y mejores prácticas para el desarrollo en Pinteya E-commerce

## 🎯 Principios Generales

### **1. Consistencia**
- Seguir convenciones establecidas en el proyecto
- Usar herramientas de formateo automático (Prettier, ESLint)
- Mantener estructura de archivos coherente

### **2. Legibilidad**
- Código auto-documentado con nombres descriptivos
- Comentarios para lógica compleja
- Funciones pequeñas y enfocadas

### **3. Mantenibilidad**
- Separación de responsabilidades
- Evitar duplicación de código
- Refactoring continuo

### **4. Performance**
- Optimizaciones conscientes
- Lazy loading cuando corresponda
- Memoización estratégica

## 📁 Estructura de Archivos

### **Convenciones de Nombres**
```
src/
├── components/
│   ├── Header/
│   │   ├── index.tsx              # Componente principal
│   │   ├── Header.test.tsx        # Tests
│   │   ├── Header.stories.tsx     # Storybook (opcional)
│   │   └── types.ts               # Tipos específicos
│   └── Common/
│       ├── Button/
│       ├── Modal/
│       └── LoadingSpinner/
├── hooks/
│   ├── useProducts.ts             # camelCase
│   ├── useCheckout.ts
│   └── useUserProfile.ts
├── lib/
│   ├── supabase.ts                # Configuraciones
│   ├── validations.ts             # Esquemas Zod
│   └── constants.ts               # Constantes
├── types/
│   ├── database.ts                # Tipos de DB
│   ├── api.ts                     # Tipos de API
│   └── components.ts              # Props de componentes
└── utils/
    ├── helpers.ts                 # Funciones utilitarias
    ├── formatters.ts              # Formateo de datos
    └── validators.ts              # Validaciones
```

### **Reglas de Importación**
```typescript
// 1. Imports de librerías externas
import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 2. Imports internos (absolutos)
import { supabase } from '@/lib/integrations/supabase';
import { ProductCard } from '@/components/Shop/ProductCard';
import { useProducts } from '@/hooks/useProducts';

// 3. Imports relativos
import './styles.css';
import { ProductType } from './types';
```

## 🔧 TypeScript Standards

### **Configuración Estricta**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### **Definición de Tipos**
```typescript
// ✅ Buenas prácticas
interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  stock: number;
  image_url: string | null;
  created_at: string;
}

// Tipos de respuesta API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Props de componentes
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
  className?: string;
}

// ❌ Evitar
const product: any = {}; // No usar 'any'
function getData() { return data; } // Especificar tipo de retorno
```

### **Funciones y Hooks**
```typescript
// ✅ Funciones con tipos explícitos
async function fetchProducts(
  filters: ProductFilters = {}
): Promise<ApiResponse<Product[]>> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .match(filters);
    
    if (error) throw error;
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ✅ Custom hooks tipados
interface UseProductsOptions {
  initialFilters?: ProductFilters;
  autoFetch?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(
  options: UseProductsOptions = {}
): UseProductsReturn {
  // implementación
}
```

## ⚛️ React Standards

### **Componentes Funcionales**
```typescript
// ✅ Componente bien estructurado
import React, { memo, useCallback } from 'react';
import { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
  className?: string;
}

export const ProductCard = memo<ProductCardProps>(({ 
  product, 
  onAddToCart, 
  className = '' 
}) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product.id);
  }, [product.id, onAddToCart]);

  return (
    <div className={`product-card ${className}`}>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>
        Agregar al Carrito
      </button>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
```

### **Custom Hooks**
```typescript
// ✅ Hook reutilizable y testeable
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
```

### **Estado y Efectos**
```typescript
// ✅ Manejo correcto de estado
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchProducts();
        
        if (isMounted) {
          if (response.success) {
            setProducts(response.data);
          } else {
            setError(response.error || 'Error loading products');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // render logic
}
```

## 🎨 CSS/Tailwind Standards

### **Clases Organizadas**
```typescript
// ✅ Clases ordenadas por categoría
const buttonClasses = cn(
  // Layout
  'flex items-center justify-center',
  // Spacing
  'px-4 py-2 gap-2',
  // Typography
  'text-sm font-medium',
  // Colors
  'bg-blaze-orange-500 text-white',
  // Effects
  'rounded-md shadow-sm',
  'hover:bg-blaze-orange-600',
  'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500',
  'transition-colors duration-200',
  // Responsive
  'md:px-6 md:py-3 md:text-base',
  // Conditional
  disabled && 'opacity-50 cursor-not-allowed',
  className
);
```

### **Componentes Reutilizables**
```typescript
// ✅ Sistema de variantes
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-tahiti-gold-500 text-white hover:bg-tahiti-gold-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## 🔌 API Standards

### **Estructura de Endpoints**
```typescript
// ✅ API Route bien estructurada
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/integrations/supabase';

// Esquema de validación
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category_id: z.number().int().positive(),
  stock: z.number().int().min(0),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validar entrada
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Lógica de negocio
    const { data, error } = await supabase
      .from('products')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data,
      message: 'Product created successfully'
    }, { status: 201 });

  } catch (error) {
    // Manejo de errores
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
```

### **Validación con Zod**
```typescript
// ✅ Esquemas reutilizables
export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category_id: z.number().int().positive(),
  stock: z.number().int().min(0),
  image_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  created_at: true,
});

export const updateProductSchema = createProductSchema.partial();

// Tipos derivados
export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
```

## 🧪 Testing Standards

### **Estructura de Tests**
```typescript
// ✅ Test bien estructurado
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/products';

describe('ProductCard', () => {
  const defaultProps = {
    product: mockProduct,
    onAddToCart: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product information', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.price}`)).toBeInTheDocument();
  });

  it('should call onAddToCart when button is clicked', async () => {
    render(<ProductCard {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(defaultProps.onAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  it('should handle loading state', () => {
    render(<ProductCard {...defaultProps} loading />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

## 📋 Checklist de Calidad

### **Antes de Commit**
- [ ] ✅ TypeScript sin errores (`npm run build`)
- [ ] ✅ ESLint sin warnings (`npm run lint`)
- [ ] ✅ Prettier aplicado (`npm run format`)
- [ ] ✅ Tests pasando (`npm test`)
- [ ] ✅ Cobertura mantenida
- [ ] ✅ Funcionalidad testeada manualmente

### **Antes de PR**
- [ ] ✅ Documentación actualizada
- [ ] ✅ Changelog actualizado (si aplica)
- [ ] ✅ Performance verificada
- [ ] ✅ Accesibilidad verificada
- [ ] ✅ Responsive design verificado

---

## 🔗 Enlaces Relacionados

- [🤝 Guía de Contribución](../contributing/guide.md)
- [🧪 Testing](../testing/README.md)
- [🏗️ Arquitectura](../architecture/overview.md)

---

*Última actualización: Junio 2025*



