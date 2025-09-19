import type { Meta, StoryObj } from '@storybook/react';
import { CartSummary } from './cart-summary';

const meta: Meta<typeof CartSummary> = {
  title: 'Design System/E-commerce/CartSummary',
  component: CartSummary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente para mostrar resumen del carrito de compras con diferentes variantes y configuraciones.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Variante del resumen del carrito',
    },
    // showShipping: {
    //   control: 'boolean',
    //   description: 'Mostrar información de envío',
    // },
    // showTaxes: {
    //   control: 'boolean',
    //   description: 'Mostrar información de impuestos',
    // },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockItems = [
  {
    id: '1',
    title: 'Pintura Látex Interior Blanco 4L',
    price: 18000,
    discountedPrice: 15000,
    quantity: 2,
    image: '/images/products/pintura-latex-blanco.jpg',
    category: 'Pinturas',
  },
  {
    id: '2',
    title: 'Rodillo Antigota 23cm',
    price: 3500,
    discountedPrice: 3500,
    quantity: 1,
    image: '/images/products/rodillo-antigota.jpg',
    category: 'Herramientas',
  },
];

export const Default: Story = {
  args: {
    cartItems: mockItems,
    variant: 'default',
    // showShipping: true,
    // showTaxes: true,
  },
};

export const Compact: Story = {
  args: {
    cartItems: mockItems,
    variant: 'compact',
    // showShipping: false,
    // showTaxes: false,
  },
};

export const Detailed: Story = {
  args: {
    cartItems: mockItems,
    variant: 'detailed',
    // showShipping: true,
    // showTaxes: true,
  },
};

export const EmptyCart: Story = {
  args: {
    cartItems: [],
    variant: 'default',
    // showShipping: true,
    // showTaxes: true,
  },
};

export const SingleItem: Story = {
  args: {
    cartItems: [mockItems[0]],
    variant: 'default',
    // showShipping: true,
    // showTaxes: true,
  },
};

export const WithoutShipping: Story = {
  args: {
    cartItems: mockItems,
    variant: 'default',
    // showShipping: false,
    // showTaxes: true,
  },
};

export const WithoutTaxes: Story = {
  args: {
    cartItems: mockItems,
    variant: 'default',
    // showShipping: true,
    // showTaxes: false,
  },
};









