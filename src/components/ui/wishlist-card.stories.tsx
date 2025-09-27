import type { Meta, StoryObj } from '@storybook/react'
import { WishlistCard } from './wishlist-card'

const meta: Meta<typeof WishlistCard> = {
  title: 'Design System/E-commerce/WishlistCard',
  component: WishlistCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Componente para mostrar productos en la lista de deseos con acciones específicas.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Variante de la tarjeta',
    },
    // showRemoveButton: {
    //   control: 'boolean',
    //   description: 'Mostrar botón de eliminar',
    // },
    // showAddToCartButton: {
    //   control: 'boolean',
    //   description: 'Mostrar botón de agregar al carrito',
    // },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockProduct = {
  id: '1',
  name: 'Pintura Látex Interior Blanco 4L',
  price: 15000,
  originalPrice: 18000,
  image: '/images/products/pintura-latex-blanco.jpg',
  brand: 'Sherwin Williams',
  stock: 25,
  addedDate: '2024-01-15',
}

const mockActions = {
  onRemove: () => console.log('Producto removido de wishlist'),
  onAddToCart: () => console.log('Producto agregado al carrito'),
  onView: () => console.log('Ver detalles del producto'),
}

export const Default: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'default',
    // showRemoveButton: true,
    // showAddToCartButton: true,
  },
}

export const Compact: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'compact',
    // showRemoveButton: true,
    // showAddToCartButton: false,
  },
}

export const Detailed: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'detailed',
    // showRemoveButton: true,
    // showAddToCartButton: true,
  },
}

export const OutOfStock: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    // stock: 0,
    variant: 'default',
    // showRemoveButton: true,
    // showAddToCartButton: false,
  },
}

export const WithoutRemoveButton: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'default',
    // showRemoveButton: false,
    // showAddToCartButton: true,
  },
}

export const WithoutAddToCartButton: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'default',
    // showRemoveButton: true,
    // showAddToCartButton: false,
  },
}

export const MinimalActions: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'compact',
    // showRemoveButton: false,
    // showAddToCartButton: false,
  },
}

export const OnSale: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    variant: 'default',
    // showRemoveButton: true,
    // showAddToCartButton: true,
  },
}

export const RecentlyAdded: Story = {
  args: {
    ...mockProduct,
    ...mockActions,
    // addedDate: new Date().toISOString().split('T')[0],
    variant: 'detailed',
    // showRemoveButton: true,
    // showAddToCartButton: true,
  },
}
