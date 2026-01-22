# 🤝 Guía de Contribución

> Guía completa para contribuir al proyecto Pinteya E-commerce

## 🎯 Bienvenido Contribuidor

¡Gracias por tu interés en contribuir a Pinteya E-commerce! Este proyecto está diseñado para ser un e-commerce moderno y escalable, y valoramos todas las contribuciones que ayuden a mejorarlo.

## 📋 Tipos de Contribuciones

### 🐛 **Bug Reports**

- Reportar errores o comportamientos inesperados
- Incluir pasos para reproducir el problema
- Proporcionar información del entorno

### 💡 **Feature Requests**

- Sugerir nuevas funcionalidades
- Explicar el caso de uso y beneficios
- Considerar el impacto en la arquitectura existente

### 🔧 **Code Contributions**

- Corrección de bugs
- Implementación de nuevas features
- Mejoras de performance
- Refactoring de código

### 📚 **Documentation**

- Mejorar documentación existente
- Agregar ejemplos de código
- Traducir contenido
- Corregir errores tipográficos

## 🚀 Proceso de Contribución

### **1. Fork y Clone**

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/tu-usuario/pintureria-digital.git
cd pintureria-digital

# Agregar upstream remote
git remote add upstream https://github.com/SantiagoXOR/pintureria-digital.git
```

### **2. Configurar Entorno**

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Verificar que todo funciona
npm run dev
npm test
```

### **3. Crear Branch**

```bash
# Crear branch desde main
git checkout main
git pull upstream main
git checkout -b feature/nombre-descriptivo

# Ejemplos de nombres de branch:
# feature/add-product-reviews
# bugfix/fix-checkout-validation
# docs/update-api-documentation
# refactor/optimize-product-queries
```

### **4. Desarrollar**

```bash
# Hacer cambios siguiendo las convenciones
# Ejecutar tests frecuentemente
npm test

# Verificar linting
npm run lint

# Verificar formato
npm run format:check
```

### **5. Commit**

```bash
# Seguir convención de commits
git add .
git commit -m "feat: add product review system"

# Ejemplos de commits:
# feat: add new feature
# fix: resolve bug in checkout
# docs: update API documentation
# refactor: optimize database queries
# test: add unit tests for products
```

### **6. Push y Pull Request**

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Crear Pull Request en GitHub
# Incluir descripción detallada
# Referenciar issues relacionados
```

## 📝 Convenciones de Código

### **TypeScript**

```typescript
// Usar tipos explícitos
interface Product {
  id: number
  name: string
  price: number
  category_id: number
}

// Funciones con tipos de retorno
async function getProducts(): Promise<Product[]> {
  // implementación
}

// Componentes con props tipadas
interface ProductCardProps {
  product: Product
  onAddToCart: (id: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // implementación
}
```

### **React Components**

```typescript
// Usar functional components
// Extraer lógica a custom hooks
// Memoizar cuando sea necesario

import React, { memo } from 'react';
import { useProducts } from '@/hooks/useProducts';

export const ProductList = memo(() => {
  const { products, loading } = useProducts();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});
```

### **CSS/Tailwind**

```typescript
// Usar clases de Tailwind consistentemente
// Extraer componentes reutilizables
// Seguir mobile-first approach

const buttonStyles = {
  base: 'px-4 py-2 rounded-md font-medium transition-colors',
  primary: 'bg-tahiti-gold-500 text-white hover:bg-tahiti-gold-600',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
}
```

## 🧪 Testing Requirements

### **Tests Obligatorios**

```typescript
// Nuevas features deben incluir tests
describe('ProductReview Component', () => {
  it('should render review form', () => {
    render(<ProductReview productId={1} />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('should submit review successfully', async () => {
    const mockSubmit = jest.fn();
    render(<ProductReview productId={1} onSubmit={mockSubmit} />);

    // Simular interacción
    fireEvent.click(screen.getByText('Submit Review'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
```

### **Cobertura Mínima**

- **Nuevos archivos**: 80% cobertura mínima
- **Archivos modificados**: No reducir cobertura existente
- **Tests E2E**: Para features críticas

## 📋 Checklist Pre-PR

### **Código**

- [ ] ✅ Código sigue convenciones del proyecto
- [ ] ✅ TypeScript sin errores (`npm run build`)
- [ ] ✅ ESLint sin errores (`npm run lint`)
- [ ] ✅ Prettier aplicado (`npm run format`)
- [ ] ✅ Tests pasando (`npm test`)
- [ ] ✅ Cobertura mantenida o mejorada

### **Documentación**

- [ ] ✅ README actualizado si es necesario
- [ ] ✅ Documentación de API actualizada
- [ ] ✅ Comentarios en código complejo
- [ ] ✅ Changelog actualizado para features importantes

### **Testing**

- [ ] ✅ Tests unitarios para nueva funcionalidad
- [ ] ✅ Tests de integración si aplica
- [ ] ✅ Tests E2E para flujos críticos
- [ ] ✅ Manual testing completado

## 🧩 Estabilidad de Hooks

Antes de abrir un PR, revisa el siguiente checklist para evitar errores de orden de hooks (especialmente en checkout/pagos):

- [✅ Ver Checklist de Estabilidad de Hooks](./hooks-stability-checklist.md)

Incluye verificación de:
- Orden incondicional de hooks (`useEffect`, `useRef`, `useState`, `useCallback`)
- Guardas internas dentro de efectos/callbacks
- Inicialización segura de SDKs y listeners DOM

## 🔍 Review Process

### **Criterios de Aprobación**

1. **Funcionalidad**: Feature funciona como se espera
2. **Código**: Sigue estándares y buenas prácticas
3. **Tests**: Cobertura adecuada y tests pasando
4. **Performance**: No degrada performance existente
5. **Documentación**: Cambios documentados apropiadamente

### **Timeline**

- **Review inicial**: 1-2 días laborales
- **Feedback**: Respuesta esperada en 3-5 días
- **Merge**: Después de aprobación y CI verde

## 🚫 Qué NO Hacer

### **Código**

- ❌ No hacer commits directos a `main`
- ❌ No incluir archivos de configuración personal
- ❌ No agregar dependencias sin discusión previa
- ❌ No romper tests existentes

### **PRs**

- ❌ No hacer PRs masivos (>500 líneas)
- ❌ No mezclar múltiples features en un PR
- ❌ No hacer PRs sin descripción
- ❌ No ignorar feedback de reviewers

## 🎯 Áreas de Contribución Prioritarias

### **🔥 Alta Prioridad**

- **Performance**: Optimizaciones de carga
- **Accessibility**: Mejoras WCAG AA
- **Testing**: Aumentar cobertura E2E
- **Documentation**: Ejemplos de uso

### **📈 Media Prioridad**

- **Features**: Sistema de reviews
- **UI/UX**: Mejoras de interfaz
- **SEO**: Optimizaciones adicionales
- **Monitoring**: Métricas y analytics

### **💡 Baja Prioridad**

- **Refactoring**: Optimizaciones de código
- **Tooling**: Mejoras de desarrollo
- **Translations**: Internacionalización
- **Integrations**: Nuevos servicios

## 📞 Contacto y Soporte

### **Canales de Comunicación**

- **Issues**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Email**: santiago@xor.com.ar para temas urgentes

### **Recursos Útiles**

- [📖 Documentación Completa](../README.md)
- [🧪 Guía de Testing](../testing/README.md)
- [🏗️ Arquitectura](../architecture/overview.md)
- [🔌 APIs](../api/README.md)

---

## 🏆 Reconocimiento

Todos los contribuidores serán reconocidos en:

- **README.md**: Lista de contribuidores
- **CHANGELOG.md**: Créditos por features
- **GitHub**: Contributors page

¡Gracias por ayudar a hacer Pinteya E-commerce mejor! 🎨

---

_Última actualización: Junio 2025_
