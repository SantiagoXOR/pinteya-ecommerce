# Skill: Testing y QA

## Descripción

Habilidad especializada para escribir y mantener tests en el proyecto, incluyendo tests unitarios, de integración, E2E con Playwright, y tests de accesibilidad.

## Cuándo Usar

- Escribir tests para nuevas funcionalidades
- Debuggear tests fallidos
- Mejorar cobertura de tests
- Configurar tests E2E
- Implementar tests de accesibilidad

## Archivos Clave

- `jest.config.js` - Configuración de Jest
- `playwright.config.ts` - Configuración de Playwright
- `src/__tests__/` - Tests unitarios e integración
- `e2e/` - Tests E2E
- `__mocks__/` - Mocks compartidos

## Comandos Útiles

```bash
# Tests unitarios
npm run test

# Tests con watch
npm run test:watch

# Tests E2E
npm run test:e2e

# Tests de cobertura
npm run test:coverage

# Tests específicos
npm run test:multitenant
npm run test:admin:products
```

## Ejemplos de Uso

### Test Unitario de Componente

```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/Product/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Pintura Blanca',
    price: 5000,
    image: '/images/product.jpg',
  };
  
  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Pintura Blanca')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });
  
  it('should call onAddToCart when button is clicked', () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    const button = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(button);
    
    expect(onAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### Test de API

```typescript
import { GET } from '@/app/api/products/route';
import { NextRequest } from 'next/server';

describe('/api/products', () => {
  it('should return products for tenant', async () => {
    const request = new NextRequest('http://localhost/api/products', {
      headers: {
        'x-tenant-id': 'test-tenant-id',
      },
    });
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('tenant_id');
  });
});
```

### Test E2E con Playwright

```typescript
import { test, expect } from '@playwright/test';

test('should complete checkout flow', async ({ page }) => {
  // 1. Navegar a producto
  await page.goto('/product/pintura-blanca');
  
  // 2. Agregar al carrito
  await page.click('button:has-text("Agregar al carrito")');
  
  // 3. Ir al checkout
  await page.click('a[href="/checkout"]');
  
  // 4. Completar formulario
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="address"]', 'Av. Corrientes 1234');
  
  // 5. Verificar que se muestra resumen
  await expect(page.locator('text=Resumen de compra')).toBeVisible();
});
```

### Test de Accesibilidad

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProductCard } from '@/components/Product/ProductCard';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<ProductCard product={mockProduct} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Mejores Prácticas

1. **AAA Pattern**: Arrange, Act, Assert
2. **Test Isolation**: Cada test debe ser independiente
3. **Descriptive Names**: Nombres de tests claros y descriptivos
4. **Mock External Services**: Mockear APIs y servicios externos
5. **Test User Behavior**: Testear comportamiento, no implementación

## Checklist de Testing

- [ ] Tests unitarios para lógica de negocio
- [ ] Tests de componentes con React Testing Library
- [ ] Tests de APIs
- [ ] Tests E2E para flujos críticos
- [ ] Tests de accesibilidad
- [ ] Mocks configurados correctamente
- [ ] Cobertura > 70%
