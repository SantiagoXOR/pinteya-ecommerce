# 🧪 **GUÍA COMPLETA DE TESTING - PINTEYA E-COMMERCE**

## 📋 **RESUMEN EJECUTIVO**

Esta guía documenta el sistema completo de testing implementado para Pinteya E-commerce, incluyendo tests unitarios, de integración y end-to-end (E2E).

---

## 🏗️ **ARQUITECTURA DE TESTING**

### **Niveles de Testing Implementados**

1. **🔬 Tests Unitarios** - Jest + React Testing Library
2. **🔗 Tests de Integración** - Jest + MSW (Mock Service Worker)
3. **🌐 Tests E2E** - Playwright
4. **📊 Tests de API** - Jest + Supertest
5. **🎨 Tests de Componentes** - React Testing Library

---

## 🚀 **COMANDOS DISPONIBLES**

### **Tests Unitarios y de Integración**
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar solo tests de componentes
npm run test:components

# Ejecutar solo tests de hooks
npm run test:hooks

# Ejecutar solo tests de APIs
npm run test:api
```

### **Tests E2E**
```bash
# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar tests E2E en modo debug
npx playwright test --debug

# Generar reporte HTML
npx playwright show-report
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
src/
├── __tests__/
│   ├── components/
│   │   ├── Header.test.tsx
│   │   ├── Shop.test.tsx
│   │   └── Cart.test.tsx
│   ├── hooks/
│   │   ├── useProducts.test.ts
│   │   ├── useCheckout.test.ts
│   │   └── useCart.test.ts
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── checkout.test.ts
│   │   └── categories.test.ts
│   └── utils/
│       ├── helpers.test.ts
│       └── validation.test.ts
├── e2e/
│   ├── shopping-flow.spec.ts
│   ├── checkout-flow.spec.ts
│   ├── authentication.spec.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── jest.config.js
├── jest.setup.js
└── playwright.config.ts
```

---

## 🔧 **CONFIGURACIÓN**

### **Jest Configuration**
- **Environment**: jsdom para tests de React
- **Setup**: Mocks para Next.js, Clerk, Supabase
- **Coverage**: 70% threshold mínimo
- **Timeout**: 10 segundos por test

### **Playwright Configuration**
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Base URL**: http://localhost:3001
- **Timeout**: 30 segundos por test
- **Retries**: 2 en CI, 0 en desarrollo

---

## 📊 **COBERTURA DE TESTING**

### **Componentes Testeados**
- ✅ Header - Navegación, carrito, autenticación
- ✅ Shop - Productos, filtros, búsqueda
- ✅ Cart - Agregar, remover, actualizar cantidades
- ✅ Checkout - Formularios, validación, envío
- ✅ ProductCard - Precios, descuentos, acciones

### **Hooks Testeados**
- ✅ useProducts - Fetch, filtros, paginación
- ✅ useCheckout - Proceso de compra, validación
- ✅ useCart - Estado del carrito, persistencia
- ✅ useAuth - Autenticación con Clerk

### **APIs Testeadas**
- ✅ /api/products - CRUD, filtros, búsqueda
- ✅ /api/categories - Listado, jerarquía
- ✅ /api/payments/create-preference - Checkout
- ✅ /api/payments/webhook - Confirmaciones
- ✅ /api/user/* - Gestión de usuarios

### **Flujos E2E Testeados**
- ✅ Navegación completa del sitio
- ✅ Búsqueda y filtrado de productos
- ✅ Proceso completo de compra
- ✅ Gestión del carrito
- ✅ Autenticación de usuarios
- ✅ Responsive design

---

## 🎯 **CASOS DE PRUEBA CRÍTICOS**

### **1. Flujo de Compra Completo**
```typescript
test('user can complete full purchase flow', async () => {
  // 1. Navegar a la tienda
  // 2. Buscar producto
  // 3. Agregar al carrito
  // 4. Proceder al checkout
  // 5. Completar formulario
  // 6. Confirmar pago
  // 7. Verificar orden creada
})
```

### **2. Validación de Stock**
```typescript
test('prevents purchase when insufficient stock', async () => {
  // 1. Intentar comprar más cantidad que stock disponible
  // 2. Verificar mensaje de error
  // 3. Verificar que no se crea la orden
})
```

### **3. Cálculo de Precios**
```typescript
test('calculates prices correctly with discounts', async () => {
  // 1. Agregar productos con descuento
  // 2. Verificar precio original y con descuento
  // 3. Verificar total del carrito
  // 4. Verificar total en checkout
})
```

---

## 🔍 **ESTRATEGIAS DE TESTING**

### **Mocking Strategy**
- **Supabase**: Mock completo de respuestas de DB
- **Clerk**: Mock de autenticación y usuarios
- **MercadoPago**: Mock de API de pagos
- **Next.js**: Mock de router y componentes

### **Data Strategy**
- **Test Data**: Productos y categorías de prueba
- **User Data**: Usuarios temporales para testing
- **Order Data**: Órdenes de prueba con diferentes estados

### **Error Handling**
- **Network Errors**: Simulación de fallos de conexión
- **API Errors**: Respuestas de error del servidor
- **Validation Errors**: Datos inválidos en formularios
- **Edge Cases**: Casos límite y datos extremos

---

## 📈 **MÉTRICAS Y REPORTES**

### **Coverage Goals**
- **Lines**: 70% mínimo
- **Functions**: 70% mínimo
- **Branches**: 70% mínimo
- **Statements**: 70% mínimo

### **Performance Metrics**
- **Test Execution Time**: < 5 minutos total
- **E2E Test Time**: < 10 minutos total
- **CI/CD Integration**: Tests automáticos en cada PR

---

## 🚨 **DEBUGGING Y TROUBLESHOOTING**

### **Common Issues**
1. **Tests timeout**: Aumentar timeout o verificar mocks
2. **Mock failures**: Verificar configuración de mocks
3. **E2E flakiness**: Agregar waits apropiados
4. **Coverage issues**: Verificar archivos excluidos

### **Debug Commands**
```bash
# Debug tests específicos
npm test -- --testNamePattern="specific test"

# Debug con verbose output
npm test -- --verbose

# Debug E2E paso a paso
npx playwright test --debug --headed

# Ver coverage detallado
npm run test:coverage -- --verbose
```

---

## 🔄 **CI/CD INTEGRATION**

### **GitHub Actions**
```yaml
- name: Run Tests
  run: |
    npm run test:coverage
    npm run test:e2e
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### **Pre-commit Hooks**
```bash
# Ejecutar tests antes de commit
npm test -- --passWithNoTests
npm run lint
```

---

## 📚 **RECURSOS Y DOCUMENTACIÓN**

### **Testing Libraries**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### **Best Practices**
- Escribir tests legibles y mantenibles
- Usar data-testid para selectores estables
- Mockear dependencias externas
- Probar casos de error y edge cases
- Mantener tests independientes entre sí

---

## ✅ **CHECKLIST DE TESTING**

### **Antes de Deploy**
- [ ] Todos los tests unitarios pasan
- [ ] Coverage mínimo del 70% alcanzado
- [ ] Tests E2E críticos pasan
- [ ] No hay tests skipped o disabled
- [ ] Performance tests dentro de límites

### **Para Nuevas Features**
- [ ] Tests unitarios para nuevos componentes
- [ ] Tests de integración para nuevas APIs
- [ ] Tests E2E para nuevos flujos
- [ ] Actualizar mocks si es necesario
- [ ] Documentar nuevos casos de prueba

---

**🎉 TESTING COMPLETO IMPLEMENTADO - PINTEYA READY FOR PRODUCTION!**
