import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'Design System/Guide',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Guía del Design System Pinteya E-commerce

Guía completa para desarrolladores sobre cómo usar el Design System de Pinteya E-commerce.

## 🎯 Principios de Diseño

### 1. Mobile-First
Todos los componentes están diseñados primero para dispositivos móviles y luego adaptados para desktop.

### 2. Especialización en Pinturería
- Paleta de colores Tahiti Gold (#fc9d04)
- Terminología específica del rubro
- Iconografía relacionada con pinturería y construcción

### 3. Accesibilidad
- WCAG 2.1 AA compliant
- Contraste optimizado
- Navegación por teclado
- Screen reader friendly

### 4. Performance
- Componentes optimizados
- Lazy loading
- Tree shaking
- Bundle size mínimo

## 🎨 Tokens de Diseño

### Colores
\`\`\`css
/* Primarios */
--primary: #fc9d04;        /* Tahiti Gold */
--primary-hover: #ef7d00;  /* Hover state */
--primary-active: #b95004; /* Active state */

/* Semánticos */
--success: #22ad5c;
--error: #f23030;
--warning: #fbbf24;
--info: #3b82f6;

/* Neutros */
--gray-50: #f8f9fa;
--gray-900: #1a1a1a;
\`\`\`

### Tipografía
\`\`\`css
/* Headings */
--text-heading-1: 60px/72px;
--text-heading-2: 48px/64px;
--text-heading-3: 40px/48px;

/* Body */
--text-lg: 18px/24px;
--text-base: 16px/24px;
--text-sm: 14px/22px;
--text-xs: 12px/20px;
\`\`\`

### Espaciado
\`\`\`css
/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
\`\`\`

### Border Radius
\`\`\`css
--radius-button: 5px;
--radius-card: 10px;
--radius-modal: 12px;
\`\`\`

## 🧩 Componentes

### Jerarquía de Componentes
1. **Atoms**: Button, Input, Badge
2. **Molecules**: Card, Modal, Form
3. **Organisms**: ProductCard, SearchAutocomplete
4. **Templates**: Layouts, Forms
5. **Pages**: Complete page examples

### Naming Convention
- **Componentes**: PascalCase (Button, ProductCard)
- **Props**: camelCase (variant, size, onClick)
- **CSS Classes**: kebab-case (btn-primary, card-elevated)
- **Files**: kebab-case (button.tsx, product-card.tsx)

## 📱 Responsive Design

### Breakpoints
\`\`\`css
/* Mobile First */
/* xs: 0px - 374px */
/* sm: 375px - 424px */
/* md: 425px - 767px */
/* lg: 768px - 1023px */
/* xl: 1024px - 1279px */
/* 2xl: 1280px+ */
\`\`\`

### Grid System
\`\`\`tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Producto 1</Card>
  <Card>Producto 2</Card>
  <Card>Producto 3</Card>
</div>
\`\`\`

## 🔧 Uso de Componentes

### Importación
\`\`\`tsx
// Componentes individuales
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, useModal } from '@/components/ui/modal'

// Múltiples componentes
import { 
  Form, 
  FormSection, 
  FormRow, 
  FormActions 
} from '@/components/ui/form'
\`\`\`

### Composición
\`\`\`tsx
// Ejemplo de composición correcta
<Card variant="elevated" hover="lift">
  <CardContent className="p-6">
    <h3 className="text-lg font-semibold mb-2">Título</h3>
    <p className="text-gray-600 mb-4">Descripción</p>
    <Button variant="primary" size="md">
      Acción
    </Button>
  </CardContent>
</Card>
\`\`\`

## ⚡ Performance

### Bundle Size
- Button: ~2KB
- Modal: ~8KB
- Form: ~12KB
- Total Design System: ~45KB (gzipped)

### Optimizaciones
- Tree shaking habilitado
- CSS-in-JS optimizado
- Lazy loading de modales
- Memoización de componentes pesados

## 🧪 Testing

### Unit Tests
\`\`\`tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})
\`\`\`

### E2E Tests
\`\`\`tsx
// Playwright example
test('product card interaction', async ({ page }) => {
  await page.goto('/products')
  await page.click('[data-testid="product-card-1"]')
  await expect(page.locator('[data-testid="quick-view-modal"]')).toBeVisible()
})
\`\`\`

## 📚 Recursos Adicionales

### Documentación
- [Storybook](./storybook) - Documentación interactiva
- [API Reference](./api) - Referencia completa de APIs
- [Examples](./examples) - Ejemplos de uso real

### Herramientas
- **Figma**: Design tokens y componentes
- **VS Code**: Snippets y extensiones
- **Chrome DevTools**: Debugging y performance

### Comunidad
- **GitHub**: Issues y contribuciones
- **Slack**: Canal #design-system
- **Wiki**: Documentación extendida
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Guía visual de colores
export const ColorPalette: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Paleta de Colores</h2>
        
        {/* Primary Colors */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Colores Primarios</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Primary', value: '#fc9d04', class: 'bg-primary' },
              { name: 'Primary Hover', value: '#ef7d00', class: 'bg-primary-hover' },
              { name: 'Primary Active', value: '#b95004', class: 'bg-primary-active' },
              { name: 'Primary Light', value: '#ffd448', class: 'bg-primary/20' },
            ].map((color) => (
              <Card key={color.name}>
                <div className={`h-20 ${color.class} rounded-t-lg`}></div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{color.name}</p>
                  <p className="text-xs text-gray-600">{color.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Colores Semánticos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Success', value: '#22ad5c', class: 'bg-green-600' },
              { name: 'Error', value: '#f23030', class: 'bg-red-600' },
              { name: 'Warning', value: '#fbbf24', class: 'bg-yellow-500' },
              { name: 'Info', value: '#3b82f6', class: 'bg-blue-600' },
            ].map((color) => (
              <Card key={color.name}>
                <div className={`h-20 ${color.class} rounded-t-lg`}></div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{color.name}</p>
                  <p className="text-xs text-gray-600">{color.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
}

// Guía de tipografía
export const Typography: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Tipografía</h2>
      
      <div className="space-y-4">
        <div>
          <h1 className="text-heading-1 font-bold">Heading 1 - 60px</h1>
          <code className="text-sm text-gray-600">text-heading-1 font-bold</code>
        </div>
        
        <div>
          <h2 className="text-heading-2 font-bold">Heading 2 - 48px</h2>
          <code className="text-sm text-gray-600">text-heading-2 font-bold</code>
        </div>
        
        <div>
          <h3 className="text-heading-3 font-semibold">Heading 3 - 40px</h3>
          <code className="text-sm text-gray-600">text-heading-3 font-semibold</code>
        </div>
        
        <div>
          <p className="text-lg">Large text - 18px</p>
          <code className="text-sm text-gray-600">text-lg</code>
        </div>
        
        <div>
          <p className="text-base">Base text - 16px</p>
          <code className="text-sm text-gray-600">text-base</code>
        </div>
        
        <div>
          <p className="text-sm">Small text - 14px</p>
          <code className="text-sm text-gray-600">text-sm</code>
        </div>
        
        <div>
          <p className="text-xs">Extra small text - 12px</p>
          <code className="text-sm text-gray-600">text-xs</code>
        </div>
      </div>
    </div>
  ),
}

// Guía de espaciado
export const Spacing: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sistema de Espaciado</h2>
      
      <div className="space-y-4">
        {[
          { name: 'space-1', value: '4px', class: 'w-1 h-4' },
          { name: 'space-2', value: '8px', class: 'w-2 h-4' },
          { name: 'space-3', value: '12px', class: 'w-3 h-4' },
          { name: 'space-4', value: '16px', class: 'w-4 h-4' },
          { name: 'space-6', value: '24px', class: 'w-6 h-4' },
          { name: 'space-8', value: '32px', class: 'w-8 h-4' },
          { name: 'space-12', value: '48px', class: 'w-12 h-4' },
          { name: 'space-16', value: '64px', class: 'w-16 h-4' },
        ].map((space) => (
          <div key={space.name} className="flex items-center gap-4">
            <div className={`${space.class} bg-primary`}></div>
            <div>
              <span className="font-medium">{space.name}</span>
              <span className="text-gray-600 ml-2">({space.value})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
}

// Guía de componentes
export const ComponentShowcase: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Showcase de Componentes</h2>
      
      {/* Buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Botones</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </div>

      {/* Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Default Card</h4>
              <p className="text-sm text-gray-600">Contenido de la card por defecto</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Elevated Card</h4>
              <p className="text-sm text-gray-600">Card con sombra elevada</p>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Outlined Card</h4>
              <p className="text-sm text-gray-600">Card con borde definido</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}
