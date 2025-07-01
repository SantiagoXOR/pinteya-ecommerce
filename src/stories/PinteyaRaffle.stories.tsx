import type { Meta, StoryObj } from '@storybook/react';
import PinteyaRaffle from '@/components/Home/PinteyaRaffle';

const meta: Meta<typeof PinteyaRaffle> = {
  title: 'Components/PinteyaRaffle',
  component: PinteyaRaffle,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Componente de Sorteo Pinteya

Un componente interactivo que muestra un sorteo temático de productos de pinturería con:

## Características principales:
- **Contador regresivo en tiempo real** con días, horas, minutos y segundos
- **Diseño responsive** optimizado para mobile, tablet y desktop
- **Paleta de colores Pinteya** (Blaze Orange, Fun Green, Bright Sun)
- **Animaciones suaves** y efectos hover
- **Imágenes de productos reales** de la base de datos
- **Instrucciones claras** de participación
- **Badges informativos** con iconos Lucide

## Uso:
Perfecto para promociones especiales, sorteos de productos y campañas de marketing.

## Integración:
- Usa componentes del Design System (Card, Badge, Button)
- Compatible con el sistema de colores de Pinteya
- Optimizado para SEO y accesibilidad
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No hay props configurables por ahora
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Historia principal
export const Default: Story = {
  name: 'Sorteo por Defecto',
  parameters: {
    docs: {
      description: {
        story: 'Versión estándar del sorteo con contador de 15 días y productos premium.',
      },
    },
  },
};

// Historia con fondo oscuro para contraste
export const DarkBackground: Story = {
  name: 'Con Fondo Oscuro',
  decorators: [
    (Story) => (
      <div className="bg-gray-900 min-h-screen">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Muestra cómo se ve el componente sobre un fondo oscuro.',
      },
    },
  },
};

// Historia con padding reducido
export const Compact: Story = {
  name: 'Versión Compacta',
  decorators: [
    (Story) => (
      <div className="py-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Versión con menos espaciado vertical para integración en páginas densas.',
      },
    },
  },
};

// Historia mostrando responsive design
export const Mobile: Story = {
  name: 'Vista Mobile',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Cómo se adapta el componente en dispositivos móviles.',
      },
    },
  },
};

export const Tablet: Story = {
  name: 'Vista Tablet',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Adaptación del componente para tablets.',
      },
    },
  },
};

// Historia con contexto de página completa
export const InPageContext: Story = {
  name: 'En Contexto de Página',
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50">
        {/* Header simulado */}
        <div className="bg-white shadow-sm p-4 mb-8">
          <div className="max-w-[1170px] mx-auto">
            <h1 className="text-2xl font-bold text-blaze-orange-600">Pinteya E-commerce</h1>
          </div>
        </div>
        
        {/* Contenido antes del sorteo */}
        <div className="max-w-[1170px] mx-auto px-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Promociones Especiales</h2>
          <p className="text-gray-600 mb-8">
            Descubrí nuestras ofertas exclusivas y participá en sorteos increíbles.
          </p>
        </div>
        
        {/* Componente de sorteo */}
        <Story />
        
        {/* Contenido después del sorteo */}
        <div className="max-w-[1170px] mx-auto px-4 mt-8">
          <h3 className="text-lg font-semibold mb-4">Otros Productos Destacados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-gray-200 h-32 rounded mb-3"></div>
                <h4 className="font-medium">Producto {i}</h4>
                <p className="text-sm text-gray-600">Descripción del producto</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Muestra el componente integrado en el contexto de una página completa.',
      },
    },
  },
};

// Historia para testing de accesibilidad
export const AccessibilityTest: Story = {
  name: 'Test de Accesibilidad',
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
    docs: {
      description: {
        story: 'Versión optimizada para testing de accesibilidad y contraste de colores.',
      },
    },
  },
};
