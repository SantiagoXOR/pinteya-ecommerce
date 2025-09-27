import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  TrustBadge,
  SecurePurchaseBadge,
  MoneyBackBadge,
  FastShippingBadge,
  QualityBadge,
  SupportBadge,
  PaymentSecurityBadge,
  LocalBusinessBadge,
  InstantDeliveryBadge,
  TrustBadgeGroup,
} from '@/components/ui/trust-badges'
import { Shield } from 'lucide-react'

describe('TrustBadge', () => {
  it('renders with default props', () => {
    render(<TrustBadge icon={<Shield className='w-4 h-4' />}>Test Badge</TrustBadge>)

    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    const { container } = render(
      <TrustBadge variant='security' icon={<Shield className='w-4 h-4' />}>
        Security Badge
      </TrustBadge>
    )

    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-green-50', 'text-green-700', 'border-green-200')
  })

  it('applies correct size classes', () => {
    const { container } = render(
      <TrustBadge size='lg' icon={<Shield className='w-4 h-4' />}>
        Large Badge
      </TrustBadge>
    )

    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base')
  })

  it('applies animation classes', () => {
    const { container } = render(
      <TrustBadge animation='pulse' icon={<Shield className='w-4 h-4' />}>
        Animated Badge
      </TrustBadge>
    )

    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('animate-pulse')
  })
})

describe('SecurePurchaseBadge', () => {
  it('renders with default text', () => {
    render(<SecurePurchaseBadge />)
    expect(screen.getByText('Compra Protegida')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<SecurePurchaseBadge text='Pago Seguro' />)
    expect(screen.getByText('Pago Seguro')).toBeInTheDocument()
  })

  it('has security variant by default', () => {
    const { container } = render(<SecurePurchaseBadge />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-green-50')
  })
})

describe('MoneyBackBadge', () => {
  it('renders with default days', () => {
    render(<MoneyBackBadge />)
    expect(screen.getByText('30 días de garantía')).toBeInTheDocument()
  })

  it('renders with custom days', () => {
    render(<MoneyBackBadge days={15} />)
    expect(screen.getByText('15 días de garantía')).toBeInTheDocument()
  })
})

describe('FastShippingBadge', () => {
  it('renders with default hours', () => {
    render(<FastShippingBadge />)
    expect(screen.getByText('Envío en 24hs')).toBeInTheDocument()
  })

  it('renders with custom hours', () => {
    render(<FastShippingBadge hours={48} />)
    expect(screen.getByText('Envío en 48hs')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<FastShippingBadge text='Envío Gratis' />)
    expect(screen.getByText('Envío Gratis')).toBeInTheDocument()
  })
})

describe('QualityBadge', () => {
  it('renders with default text', () => {
    render(<QualityBadge />)
    expect(screen.getByText('Calidad Premium')).toBeInTheDocument()
  })

  it('renders with rating', () => {
    render(<QualityBadge rating={5} text='Excelente' />)
    expect(screen.getByText('5★ Excelente')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<QualityBadge text='Alta Calidad' />)
    expect(screen.getByText('Alta Calidad')).toBeInTheDocument()
  })
})

describe('SupportBadge', () => {
  it('renders phone support by default', () => {
    render(<SupportBadge />)
    expect(screen.getByText('Soporte 24/7')).toBeInTheDocument()
  })

  it('renders chat support', () => {
    render(<SupportBadge type='chat' />)
    expect(screen.getByText('Chat en vivo')).toBeInTheDocument()
  })

  it('renders email support', () => {
    render(<SupportBadge type='email' hours='48hs' />)
    expect(screen.getByText('Respuesta 48hs')).toBeInTheDocument()
  })

  it('renders custom hours', () => {
    render(<SupportBadge hours='9-18hs' />)
    expect(screen.getByText('Soporte 9-18hs')).toBeInTheDocument()
  })
})

describe('PaymentSecurityBadge', () => {
  it('renders MercadoPago by default', () => {
    render(<PaymentSecurityBadge />)
    expect(screen.getByText('MercadoPago Seguro')).toBeInTheDocument()
  })

  it('renders SSL variant', () => {
    render(<PaymentSecurityBadge provider='ssl' />)
    expect(screen.getByText('SSL Certificado')).toBeInTheDocument()
  })

  it('renders secure variant', () => {
    render(<PaymentSecurityBadge provider='secure' />)
    expect(screen.getByText('Pago 100% Seguro')).toBeInTheDocument()
  })
})

describe('LocalBusinessBadge', () => {
  it('renders with default values', () => {
    render(<LocalBusinessBadge />)
    expect(screen.getByText('15 años en Córdoba')).toBeInTheDocument()
  })

  it('renders with custom values', () => {
    render(<LocalBusinessBadge city='Buenos Aires' years={20} />)
    expect(screen.getByText('20 años en Buenos Aires')).toBeInTheDocument()
  })
})

describe('InstantDeliveryBadge', () => {
  it('renders with default text', () => {
    render(<InstantDeliveryBadge />)
    expect(screen.getByText('Entrega Inmediata')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<InstantDeliveryBadge text='Entrega Express' />)
    expect(screen.getByText('Entrega Express')).toBeInTheDocument()
  })

  it('has glow animation by default', () => {
    const { container } = render(<InstantDeliveryBadge />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('animate-pulse', 'shadow-lg')
  })
})

describe('TrustBadgeGroup', () => {
  it('renders default badges', () => {
    render(<TrustBadgeGroup />)

    expect(screen.getByText('Compra Protegida')).toBeInTheDocument()
    expect(screen.getByText('30 días de garantía')).toBeInTheDocument()
    expect(screen.getByText('Envío en 24hs')).toBeInTheDocument()
  })

  it('renders custom badges', () => {
    render(<TrustBadgeGroup badges={['secure', 'payment', 'support']} />)

    expect(screen.getByText('Compra Protegida')).toBeInTheDocument()
    expect(screen.getByText('MercadoPago Seguro')).toBeInTheDocument()
    expect(screen.getByText('Soporte 24/7')).toBeInTheDocument()
  })

  it('applies horizontal layout by default', () => {
    const { container } = render(<TrustBadgeGroup />)
    const group = container.firstChild as HTMLElement
    expect(group).toHaveClass('flex', 'flex-wrap', 'gap-2')
  })

  it('applies vertical layout', () => {
    const { container } = render(<TrustBadgeGroup layout='vertical' />)
    const group = container.firstChild as HTMLElement
    expect(group).toHaveClass('flex', 'flex-col', 'gap-2')
  })

  it('applies grid layout', () => {
    const { container } = render(<TrustBadgeGroup layout='grid' />)
    const group = container.firstChild as HTMLElement
    expect(group).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-2')
  })

  it('applies size to all badges', () => {
    render(<TrustBadgeGroup size='lg' badges={['secure']} />)

    const badge = screen.getByText('Compra Protegida').closest('div')
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base')
  })

  it('renders all badge types', () => {
    render(
      <TrustBadgeGroup
        badges={[
          'secure',
          'guarantee',
          'shipping',
          'quality',
          'support',
          'payment',
          'local',
          'instant',
        ]}
      />
    )

    expect(screen.getByText('Compra Protegida')).toBeInTheDocument()
    expect(screen.getByText('30 días de garantía')).toBeInTheDocument()
    expect(screen.getByText('Envío en 24hs')).toBeInTheDocument()
    expect(screen.getByText('Calidad Premium')).toBeInTheDocument()
    expect(screen.getByText('Soporte 24/7')).toBeInTheDocument()
    expect(screen.getByText('MercadoPago Seguro')).toBeInTheDocument()
    expect(screen.getByText('15 años en Córdoba')).toBeInTheDocument()
    expect(screen.getByText('Entrega Inmediata')).toBeInTheDocument()
  })

  it('handles unknown badge types gracefully', () => {
    render(<TrustBadgeGroup badges={['secure', 'unknown' as any]} />)

    expect(screen.getByText('Compra Protegida')).toBeInTheDocument()
    // Unknown badge should not render anything
    expect(screen.queryByText('unknown')).not.toBeInTheDocument()
  })
})
