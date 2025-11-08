# Testing - Modal Cyber Monday WhatsApp

Documentación completa de los tests del modal de Cyber Monday para captura de números de WhatsApp y sorteo de gift cards.

## 📋 Índice

- [Suite de Tests](#suite-de-tests)
- [Estructura de Archivos](#estructura-de-archivos)
- [Ejecutar Tests](#ejecutar-tests)
- [Cobertura](#cobertura)
- [Casos de Prueba](#casos-de-prueba)

## 🧪 Suite de Tests

### Tests Unitarios (Jest + React Testing Library)

**Archivo:** `src/components/Common/__tests__/WhatsAppPopup.test.tsx`

- **Total de tests:** ~40
- **Cobertura esperada:** > 95%
- **Duración:** ~2-3 segundos

**Categorías:**
- Renderizado y Visibilidad (6 tests)
- Diseño Responsive (3 tests)
- Elementos Visuales (6 tests)
- Validación de Input (6 tests)
- Envío del Formulario (7 tests)
- LocalStorage (4 tests)

### Tests de Integración (Jest + RTL)

**Archivo:** `src/components/Common/__tests__/WhatsAppPopup.integration.test.tsx`

- **Total de tests:** ~15
- **Cobertura esperada:** > 90%
- **Duración:** ~3-4 segundos

**Categorías:**
- Integración con Google Analytics
- Integración con localStorage
- Integración con window.open (WhatsApp)
- Detección de viewport con window.resize
- Flujo completo de integración

### Tests E2E (Playwright)

**Archivo:** `e2e/cyber-monday-popup.spec.ts`

- **Total de tests:** ~25
- **Navegadores:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Duración:** ~5-10 minutos

**Categorías:**
- Flujo Completo Desktop (7 tests)
- Flujo Completo Mobile (5 tests)
- Validación de Formulario (4 tests)
- Interacciones (4 tests)
- Accesibilidad (5 tests)
- Cross-Browser (2 tests)
- Performance (2 tests)

## 📁 Estructura de Archivos

```
src/components/Common/
├── WhatsAppPopup.tsx                    # Componente principal
└── __tests__/
    ├── WhatsAppPopup.test.tsx           # Tests unitarios
    ├── WhatsAppPopup.integration.test.tsx # Tests de integración
    └── mocks/
        └── analytics.mock.ts            # Mock de Google Analytics

e2e/
└── cyber-monday-popup.spec.ts           # Tests E2E con Playwright

test-results/
├── cyber-monday-desktop.png             # Screenshots desktop
├── cyber-monday-mobile.png              # Screenshots mobile
├── cyber-monday-contrast.png            # Verificación de contraste
└── cyber-monday-*.png                   # Screenshots por navegador
```

## 🚀 Ejecutar Tests

### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm test WhatsAppPopup

# Tests en modo watch
npm run test:watch WhatsAppPopup

# Tests con coverage
npm run test:coverage -- WhatsAppPopup

# Tests específicos
npm test -- WhatsAppPopup.test.tsx
npm test -- WhatsAppPopup.integration.test.tsx
```

### Tests E2E

```bash
# Ejecutar todos los tests E2E del popup
npx playwright test cyber-monday-popup

# Tests con UI interactiva
npx playwright test cyber-monday-popup --ui

# Tests en modo debug
npx playwright test cyber-monday-popup --debug

# Tests en un navegador específico
npx playwright test cyber-monday-popup --project=chromium
npx playwright test cyber-monday-popup --project=firefox
npx playwright test cyber-monday-popup --project=webkit

# Tests en mobile
npx playwright test cyber-monday-popup --project="Mobile Chrome"
npx playwright test cyber-monday-popup --project="Mobile Safari"

# Tests con headed mode (ver el navegador)
npx playwright test cyber-monday-popup --headed

# Tests de un grupo específico
npx playwright test cyber-monday-popup -g "Desktop"
npx playwright test cyber-monday-popup -g "Mobile"
npx playwright test cyber-monday-popup -g "Accesibilidad"
```

### Ejecutar Todos los Tests

```bash
# Tests unitarios + integración + E2E
npm test WhatsAppPopup && npx playwright test cyber-monday-popup
```

## 📊 Cobertura

### Objetivo de Cobertura

- **Líneas:** > 95%
- **Funciones:** > 95%
- **Branches:** > 90%
- **Statements:** > 95%

### Ver Reporte de Cobertura

```bash
# Generar reporte
npm run test:coverage -- WhatsAppPopup

# Abrir reporte HTML
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
```

## ✅ Casos de Prueba

### A. Renderizado y Visibilidad

| Test | Descripción | Tipo |
|------|-------------|------|
| No se muestra inmediatamente | Modal no está visible al cargar la página | Unit |
| Se muestra después de 5s | Modal aparece automáticamente tras 5 segundos | Unit/E2E |
| No se muestra si ya fue visto | localStorage previene múltiples apariciones | Unit/E2E |
| Se puede cerrar con botón X | Botón de cerrar funciona correctamente | Unit/E2E |
| Se cierra al hacer clic fuera | Click en backdrop cierra el modal | Unit |

### B. Diseño Responsive

| Test | Descripción | Tipo |
|------|-------------|------|
| Diseño mobile < 768px | Muestra layout vertical en móviles | Unit/E2E |
| Diseño desktop >= 768px | Muestra layout de 2 columnas en desktop | Unit/E2E |
| Detecta cambios de viewport | Responde a eventos resize | Unit |
| Scroll funciona en mobile | Contenido largo es scrolleable | E2E |
| Elementos táctiles accesibles | Botones tienen mínimo 44px de altura | E2E |

### C. Elementos Visuales

| Test | Descripción | Tipo |
|------|-------------|------|
| Badge Cyber Monday visible | Muestra "CYBER MONDAY .COM.AR" | Unit/E2E |
| 3 gift cards apiladas | Visualiza las 3 tarjetas | Unit/E2E |
| Monto correcto ($75.000) | Muestra el premio correcto | Unit/E2E |
| Cantidad de premios (3) | Indica 3 gift cards | Unit/E2E |
| Fechas del sorteo | Muestra 3-5 de noviembre | Unit/E2E |
| Feature "Sin obligación de compra" | Disclaimer visible | Unit/E2E |

### D. Validación de Input

| Test | Descripción | Tipo |
|------|-------------|------|
| Acepta solo números | Filtra caracteres no numéricos | Unit/E2E |
| Remueve 0 inicial | Auto-limpieza del formato | Unit |
| Remueve 15 inicial | Auto-limpieza de código de área | Unit |
| Limita a 10 dígitos | Máximo 10 caracteres | Unit |
| Valida longitud mínima (8) | Rechaza números muy cortos | Unit/E2E |
| Valida longitud máxima (10) | Acepta números de 8-10 dígitos | Unit |

### E. Envío del Formulario

| Test | Descripción | Tipo |
|------|-------------|------|
| No se envía con número inválido | Validación previa al envío | Unit/E2E |
| Abre WhatsApp con número válido | Redirección correcta | Unit/E2E |
| Construye URL correcta | Formato wa.me correcto | Unit/E2E |
| Incluye mensaje de Cyber Monday | Texto personalizado en URL | Unit/E2E |
| Cierra el modal después de enviar | Flujo completo | Unit/E2E |
| Trackea eventos en Analytics | Integración con GA | Unit/Integration |

### F. LocalStorage

| Test | Descripción | Tipo |
|------|-------------|------|
| Guarda flag al mostrarse | Persiste en localStorage | Unit/Integration |
| Usa clave correcta | "cyberMondayPopupShown" | Unit |
| Respeta el flag al recargar | No muestra si ya se vio | Unit/E2E |

### G. Accesibilidad

| Test | Descripción | Tipo |
|------|-------------|------|
| Navegación por teclado (Tab) | Foco correcto en elementos | E2E |
| Enter envía el formulario | Teclado funcional | E2E |
| Escape cierra el modal | Atajo de teclado | E2E |
| ARIA labels correctos | Accesibilidad para screen readers | E2E |
| Contraste de colores adecuado | WCAG AA compliance | E2E |

### H. Performance

| Test | Descripción | Tipo |
|------|-------------|------|
| Modal se carga rápidamente | < 7 segundos total | E2E |
| Sin errores de recursos | Imágenes cargan correctamente | E2E |

## 🐛 Debugging

### Tests Unitarios

```bash
# Ver output detallado
npm test WhatsAppPopup -- --verbose

# Ver errores específicos
npm test WhatsAppPopup -- --no-coverage
```

### Tests E2E

```bash
# Modo debug (pausa en cada paso)
npx playwright test cyber-monday-popup --debug

# Ver trace de un test fallido
npx playwright show-trace trace.zip

# Screenshots automáticos en fallos
# Los screenshots se guardan en test-results/
```

## 📝 Notas Técnicas

### Mocks Utilizados

1. **Google Analytics:** Mock de `trackEvent` para verificar eventos
2. **localStorage:** Mock completo con getItem/setItem/clear
3. **window.open:** Mock para interceptar redirecciones a WhatsApp
4. **window.innerWidth:** Mock para tests responsive
5. **Timers:** Jest fake timers para simular delay de 5 segundos

### Configuración de Jest

Los tests usan la configuración estándar de Next.js con:
- `testEnvironment: 'jsdom'`
- Fake timers habilitados
- Mocks de @testing-library/jest-dom

### Configuración de Playwright

Los tests E2E usan:
- Proyecto `ui-public` (sin autenticación)
- Screenshots en fallos
- Video en fallos
- Trace en primer retry

## 🎯 Próximos Pasos

- [ ] Agregar tests de visual regression con Percy/Chromatic
- [ ] Implementar tests de performance con Lighthouse
- [ ] Agregar tests de seguridad (XSS, CSRF)
- [ ] Tests de internacionalización (i18n)
- [ ] Tests de analytics tracking completo

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

