import type { Meta, StoryObj } from '@storybook/react'
import { ProductComparison } from './product-comparison'

const meta: Meta<typeof ProductComparison> = {
  title: 'Design System/E-commerce/ProductComparison',
  component: ProductComparison,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Componente para comparar productos lado a lado con características detalladas.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxProducts: {
      control: { type: 'number', min: 2, max: 4 },
      description: 'Número máximo de productos a comparar',
    },
    // showSpecs: {
    //   control: 'boolean',
    //   description: 'Mostrar especificaciones técnicas',
    // },
    // showReviews: {
    //   control: 'boolean',
    //   description: 'Mostrar reseñas y calificaciones',
    // },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockProducts = [
  {
    id: '1',
    title: 'Pintura Látex Interior Blanco 4L',
    price: 15000,
    originalPrice: 18000,
    image: '/images/products/pintura-latex-blanco.jpg',
    brand: 'Sherwin Williams',
    rating: 4.5,
    reviews: 128,
    specs: {
      Rendimiento: '12-14 m²/L',
      'Tiempo de secado': '2-4 horas',
      Dilución: 'Agua hasta 10%',
      Acabado: 'Mate',
    },
  },
  {
    id: '2',
    title: 'Pintura Látex Interior Marfil 4L',
    price: 16500,
    originalPrice: 19000,
    image: '/images/products/pintura-latex-marfil.jpg',
    brand: 'Petrilac',
    rating: 4.2,
    reviews: 89,
    specs: {
      Rendimiento: '10-12 m²/L',
      'Tiempo de secado': '3-5 horas',
      Dilución: 'Agua hasta 15%',
      Acabado: 'Satinado',
    },
  },
  {
    id: '3',
    title: 'Pintura Látex Premium Blanco 4L',
    price: 22000,
    image: '/images/products/pintura-latex-premium.jpg',
    brand: 'Sinteplast',
    rating: 4.8,
    reviews: 256,
    specs: {
      Rendimiento: '14-16 m²/L',
      'Tiempo de secado': '1-2 horas',
      Dilución: 'Agua hasta 5%',
      Acabado: 'Semi-mate',
    },
  },
]

export const TwoProducts: Story = {
  args: {
    products: mockProducts.slice(0, 2),
    maxProducts: 4,
    // showSpecs: true,
    // showReviews: true,
  },
}

export const ThreeProducts: Story = {
  args: {
    products: mockProducts,
    maxProducts: 4,
    // showSpecs: true,
    // showReviews: true,
  },
}

export const WithoutSpecs: Story = {
  args: {
    products: mockProducts.slice(0, 2),
    maxProducts: 4,
    // showSpecs: false,
    // showReviews: true,
  },
}

export const WithoutReviews: Story = {
  args: {
    products: mockProducts.slice(0, 2),
    maxProducts: 4,
    // showSpecs: true,
    // showReviews: false,
  },
}

export const MinimalComparison: Story = {
  args: {
    products: mockProducts.slice(0, 2),
    maxProducts: 4,
    // showSpecs: false,
    // showReviews: false,
  },
}

export const EmptyComparison: Story = {
  args: {
    products: [],
    maxProducts: 4,
    // showSpecs: true,
    // showReviews: true,
  },
}
