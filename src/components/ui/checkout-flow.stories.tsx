import type { Meta, StoryObj } from '@storybook/react'
import { CheckoutFlow } from './checkout-flow'

const meta: Meta<typeof CheckoutFlow> = {
  title: 'Design System/E-commerce/CheckoutFlow',
  component: CheckoutFlow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Componente para mostrar el flujo de checkout paso a paso con diferentes estados y configuraciones.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentStep: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Paso actual del checkout (0-3)',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Variante del flujo de checkout',
    },
    // showProgress: {
    //   control: 'boolean',
    //   description: 'Mostrar barra de progreso',
    // },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockData = {
  totalPrice: 30000,
  shippingCost: 1500,
  discount: 0,
  finalTotal: 31500,
  shippingMethod: 'standard' as const,
  appliedCoupon: null,
}

export const StepCart: Story = {
  args: {
    currentStep: 0,
    checkoutData: mockData,
    variant: 'default',
    // showProgress: true,
  },
}

export const StepShipping: Story = {
  args: {
    currentStep: 1,
    checkoutData: mockData,
    variant: 'default',
    // showProgress: true,
  },
}

export const StepPayment: Story = {
  args: {
    currentStep: 2,
    checkoutData: mockData,
    variant: 'default',
    // showProgress: true,
  },
}

export const StepConfirmation: Story = {
  args: {
    currentStep: 3,
    checkoutData: mockData,
    variant: 'default',
    // showProgress: true,
  },
}

export const CompactVariant: Story = {
  args: {
    currentStep: 1,
    checkoutData: mockData,
    variant: 'compact',
    // showProgress: false,
  },
}

export const DetailedVariant: Story = {
  args: {
    currentStep: 2,
    checkoutData: mockData,
    variant: 'detailed',
    // showProgress: true,
  },
}

export const WithoutProgress: Story = {
  args: {
    currentStep: 1,
    checkoutData: mockData,
    variant: 'default',
    // showProgress: false,
  },
}
