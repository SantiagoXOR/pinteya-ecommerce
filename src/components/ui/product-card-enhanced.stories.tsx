import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedProductCard } from './product-card-enhanced';

const meta: Meta<typeof EnhancedProductCard> = {
  title: 'Design System/E-commerce/EnhancedProductCard',
  component: EnhancedProductCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente avanzado de tarjeta de producto con configuración automática basada en contexto y Design System.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    context: {
      control: 'select',
      options: ['default', 'productDetail', 'checkout', 'demo'],
      description: 'Contexto de uso del componente',
    },
    // size: {
    //   control: 'select',
    //   options: ['sm', 'md', 'lg'],
    //   description: 'Tamaño del componente',
    // },
    // showBadge: {
    //   control: 'boolean',
    //   description: 'Mostrar badge personalizado',
    // },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockProduct = {
  id: '1',
  name: 'Pintura Látex Interior Blanco 4L',
  price: 15000,
  originalPrice: 18000,
  image: '/images/products/pintura-latex-blanco.jpg',
  category: 'Pinturas',
  brand: 'Sherwin Williams',
  stock: 25,
};

export const ShopContext: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'md',
    // showBadge: true,
  },
};

export const SearchContext: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'sm',
    // showBadge: true,
  },
};

export const WishlistContext: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'md',
    // showBadge: false,
  },
};

export const CartContext: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'lg',
    // quantity: 2,
    // showBadge: true,
  },
};

export const CheckoutContext: Story = {
  args: {
    ...mockProduct,
    context: 'checkout',
    // size: 'lg',
    // quantity: 1,
    // showBadge: true,
  },
};

export const ComparisonContext: Story = {
  args: {
    ...mockProduct,
    context: 'demo',
    // size: 'md',
    // showBadge: false,
  },
};

export const OutOfStock: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'md',
    stock: 0,
    // showBadge: true,
  },
};

export const LowStock: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'md',
    stock: 3,
    // showBadge: true,
  },
};

export const WithCustomBadge: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'md',
    badge: 'Nuevo',
    // showBadge: true,
  },
};

export const SmallSize: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'sm',
    // showBadge: true,
  },
};

export const LargeSize: Story = {
  args: {
    ...mockProduct,
    context: 'default',
    // size: 'lg',
    // quantity: 3,
    // showBadge: true,
  },
};
