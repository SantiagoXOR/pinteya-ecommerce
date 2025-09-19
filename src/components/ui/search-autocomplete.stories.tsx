import type { Meta, StoryObj } from '@storybook/react'
import { SearchAutocomplete, type SearchSuggestion } from './search-autocomplete'
// import { action } from '@storybook/addon-actions'

// Helper functions for stories
const onSearch = (query: string) => console.log('onSearch:', query)
const onSuggestionSelect = (suggestion: SearchSuggestion) => console.log('onSuggestionSelect:', suggestion)

const meta = {
  title: 'UI/SearchAutocomplete',
  component: SearchAutocomplete,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# SearchAutocomplete

Componente de búsqueda avanzada con autocompletado, sugerencias en tiempo real y búsquedas recientes.

## Características

- **Autocompletado inteligente**: Sugerencias de productos en tiempo real
- **Búsquedas recientes**: Guarda y muestra las últimas búsquedas del usuario
- **Trending searches**: Muestra búsquedas populares cuando no hay query
- **Navegación por teclado**: Soporte completo para flechas, Enter y Escape
- **Debounce**: Optimiza las llamadas a la API
- **Responsive**: Adaptado para móviles y desktop

## Casos de uso

- Búsqueda principal en e-commerce
- Filtros de productos con sugerencias
- Búsqueda de contenido con historial
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del componente',
    },
    showRecentSearches: {
      control: 'boolean',
      description: 'Mostrar búsquedas recientes',
    },
    showTrendingSearches: {
      control: 'boolean',
      description: 'Mostrar búsquedas populares',
    },
    maxSuggestions: {
      control: { type: 'number', min: 3, max: 20 },
      description: 'Número máximo de sugerencias',
    },
    debounceMs: {
      control: { type: 'number', min: 100, max: 1000, step: 100 },
      description: 'Tiempo de debounce en milisegundos',
    },
  },
} satisfies Meta<typeof SearchAutocomplete>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Busco productos de pinturería...",
    onSearch,
    onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: "Buscar...",
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: "¿Qué estás buscando?",
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
}

export const WithoutRecentSearches: Story = {
  args: {
    placeholder: "Busco productos de pinturería...",
    showRecentSearches: false,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export const WithoutTrendingSearches: Story = {
  args: {
    placeholder: "Busco productos de pinturería...",
    showTrendingSearches: false,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export const MinimalSuggestions: Story = {
  args: {
    placeholder: "Busco productos de pinturería...",
    maxSuggestions: 3,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export const FastDebounce: Story = {
  args: {
    placeholder: "Búsqueda rápida...",
    debounceMs: 100,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Configuración con debounce rápido para búsquedas instantáneas.',
      },
    },
  },
}

export const SlowDebounce: Story = {
  args: {
    placeholder: "Búsqueda con delay...",
    debounceMs: 800,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Configuración con debounce lento para reducir llamadas a la API.',
      },
    },
  },
}

export const FullWidth: Story = {
  args: {
    placeholder: "Busco productos de pinturería...",
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Búsqueda a ancho completo para headers principales.',
      },
    },
  },
}

export const MobileOptimized: Story = {
  args: {
    size: 'md',
    placeholder: "Buscar productos...",
    maxSuggestions: 5,
    debounceMs: 400,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-80 mx-auto">
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Configuración optimizada para dispositivos móviles.',
      },
    },
  },
}

export const EcommerceHeader: Story = {
  args: {
    size: 'md',
    placeholder: "Busco productos de pinturería...",
    showRecentSearches: true,
    showTrendingSearches: true,
    maxSuggestions: 8,
    debounceMs: 300,
    onSearch: onSearch,
    onSuggestionSelect: onSuggestionSelect,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="text-primary font-bold text-xl">Pinteya</div>
            <div className="flex-1">
              <Story />
            </div>
            <div className="text-sm text-gray-600">🛒 3</div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de integración en header de e-commerce.',
      },
    },
  },
}









