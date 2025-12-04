# 🎨 Testing Visual Regression

Guía completa para configurar y ejecutar tests de regresión visual en el Design System de Pinteya E-commerce.

## 🎯 Objetivo

Los tests de regresión visual nos permiten:

- 📸 Detectar cambios visuales no intencionados
- 🔍 Revisar cambios antes de merge
- 📚 Mantener documentación visual actualizada
- 🚀 Deploy automático de Storybook

## 🛠️ Herramientas

### Chromatic

- **Propósito**: Visual regression testing y deploy de Storybook
- **URL**: https://chromatic.com
- **Integración**: GitHub Actions automático

### Lighthouse

- **Propósito**: Performance testing y Core Web Vitals
- **Métricas**: FCP, LCP, CLS, Accessibility Score
- **Reportes**: HTML y JSON detallados

### Storybook Test Runner

- **Propósito**: Accessibility testing automatizado
- **Herramienta**: axe-core + Playwright
- **Cobertura**: WCAG 2.1 AA compliance

## 🚀 Configuración Inicial

### 1. Configurar Chromatic

```bash
# 1. Ve a https://chromatic.com
# 2. Conecta tu repositorio GitHub
# 3. Obtén el PROJECT_TOKEN
# 4. Agrega a .env.local:
CHROMATIC_PROJECT_TOKEN=tu_chromatic_token_aqui
```

### 2. Configurar GitHub Secrets

```bash
# En GitHub > Settings > Secrets and variables > Actions
CHROMATIC_PROJECT_TOKEN=tu_chromatic_token_aqui
```

### 3. Verificar Configuración

```bash
# Ejecutar setup automático
node scripts/setup-chromatic.js

# Verificar que Storybook funciona
npm run storybook
```

## 📋 Scripts Disponibles

### Tests Individuales

```bash
# Visual regression con Chromatic
npm run test:visual

# Performance con Lighthouse
npm run test:performance

# Accessibility con Storybook Test Runner
npm run test:a11y

# Suite completa de calidad
npm run test:quality
```

### Desarrollo

```bash
# Iniciar Storybook para desarrollo
npm run storybook

# Build de Storybook para producción
npm run build-storybook

# Deploy manual a Chromatic
npm run chromatic
```

## 🎨 Workflow de Visual Regression

### 1. Desarrollo Local

```bash
# 1. Desarrollar componente
# 2. Crear/actualizar stories
# 3. Verificar en Storybook local
npm run storybook

# 4. Ejecutar tests locales
npm run test:quality
```

### 2. Pull Request

```bash
# 1. Crear PR
# 2. GitHub Actions ejecuta automáticamente:
#    - Build de Storybook
#    - Deploy a Chromatic
#    - Tests de accesibilidad
#    - Performance tests

# 3. Revisar cambios en Chromatic UI
# 4. Aprobar o rechazar cambios visuales
```

### 3. Merge a Main

```bash
# 1. Merge del PR
# 2. Deploy automático a producción
# 3. Baseline actualizado en Chromatic
# 4. Storybook actualizado en Vercel
```

## 📊 Interpretación de Resultados

### Chromatic

#### Estados de Tests

- ✅ **Passed**: Sin cambios visuales
- 🔍 **Changes**: Cambios detectados, requiere revisión
- ❌ **Failed**: Error en build o configuración
- ⏭️ **Skipped**: Branch o commit ignorado

#### Tipos de Cambios

- **UI Changes**: Cambios en componentes
- **Story Changes**: Nuevas stories o modificaciones
- **Dependency Changes**: Actualizaciones de dependencias

### Lighthouse Performance

#### Métricas Clave

- **Performance Score**: > 90 (Excelente), 50-90 (Bueno), < 50 (Pobre)
- **FCP**: < 1.8s (Excelente), 1.8-3s (Bueno), > 3s (Pobre)
- **LCP**: < 2.5s (Excelente), 2.5-4s (Bueno), > 4s (Pobre)
- **CLS**: < 0.1 (Excelente), 0.1-0.25 (Bueno), > 0.25 (Pobre)

#### Accessibility Score

- **95-100**: Excelente compliance
- **80-94**: Bueno, mejoras menores
- **< 80**: Requiere atención inmediata

### Test Runner Accessibility

#### Reglas Verificadas

- **color-contrast**: Contraste de colores WCAG AA
- **focus-order-semantics**: Orden de foco lógico
- **keyboard-navigation**: Navegación por teclado
- **aria-labels**: Etiquetas ARIA correctas

## 🔧 Troubleshooting

### Chromatic

#### Error: "Build failed"

```bash
# Verificar build local
npm run build-storybook

# Limpiar cache
rm -rf node_modules/.cache
rm -rf storybook-static
npm ci
```

#### Error: "Token invalid"

```bash
# Verificar token en .env.local
cat .env.local | grep CHROMATIC

# Regenerar token en chromatic.com
# Actualizar GitHub Secrets
```

### Lighthouse

#### Error: "Storybook not running"

```bash
# Verificar que Storybook está en puerto 6006
npm run storybook

# Verificar en navegador
open http://localhost:6006
```

#### Performance Score Bajo

```bash
# Verificar bundle size
npm run build-storybook --analyze

# Optimizar imágenes
npm run images:optimize

# Revisar dependencias pesadas
npm run test:performance
```

### Accessibility Tests

#### Error: "axe-core violations"

```bash
# Ejecutar tests específicos
npm run test:a11y

# Revisar violaciones en Storybook
# Addon A11y panel en Storybook UI

# Corregir problemas comunes:
# - Agregar alt text a imágenes
# - Mejorar contraste de colores
# - Agregar aria-labels
```

## 📈 Mejores Prácticas

### Stories para Visual Testing

```tsx
// ✅ Buena práctica
export const AllVariants: Story = {
  render: () => (
    <div className='grid grid-cols-2 gap-4'>
      <Button variant='primary'>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='outline'>Outline</Button>
      <Button variant='ghost'>Ghost</Button>
    </div>
  ),
  parameters: {
    chromatic: {
      // Configuración específica para Chromatic
      viewports: [375, 768, 1200],
      delay: 300, // Esperar animaciones
    },
  },
}
```

### Performance Optimization

```tsx
// ✅ Lazy loading de componentes pesados
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// ✅ Memoización de componentes
const OptimizedComponent = memo(({ data }) => {
  return <ExpensiveRender data={data} />
})

// ✅ Preload de recursos críticos
export const WithPreload: Story = {
  parameters: {
    chromatic: {
      preload: ['/images/hero-image.jpg'],
    },
  },
}
```

### Accessibility Testing

```tsx
// ✅ Tests de accesibilidad específicos
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-order-semantics',
            enabled: true,
          },
        ],
      },
    },
  },
}
```

## 📚 Recursos Adicionales

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Storybook Test Runner](https://storybook.js.org/docs/react/writing-tests/test-runner)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

## 🎯 Métricas de Éxito

### Objetivos del Proyecto

- **Visual Regression**: 0 regresiones no intencionadas
- **Performance Score**: > 90 promedio
- **Accessibility Score**: > 95 promedio
- **Build Success Rate**: > 98%
- **Review Time**: < 24h para cambios visuales

### KPIs de Calidad

- **Coverage Visual**: 100% de componentes con stories
- **Test Automation**: 100% de tests automatizados
- **Documentation**: 100% de componentes documentados
- **Performance Budget**: < 50KB bundle size por componente
