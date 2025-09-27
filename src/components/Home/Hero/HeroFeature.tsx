import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const featureData = [
  {
    img: '/images/icons/icon-01.svg',
    title: 'Envío Gratis',
    description: 'En compras mayores a $15.000',
    badge: 'Gratis',
    badgeVariant: 'success' as const,
  },
  {
    img: '/images/icons/icon-02.svg',
    title: 'Devoluciones',
    description: 'Hasta 30 días para cambios',
    badge: '30 días',
    badgeVariant: 'info' as const,
  },
  {
    img: '/images/icons/icon-03.svg',
    title: 'Pagos Seguros',
    description: 'MercadoPago y transferencias',
    badge: 'Seguro',
    badgeVariant: 'default' as const,
  },
  {
    img: '/images/icons/icon-04.svg',
    title: 'Asesoramiento',
    description: 'Expertos en pinturería',
    badge: 'Experto',
    badgeVariant: 'warning' as const,
  },
]

const HeroFeature = () => {
  return (
    <div className='max-w-[1060px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 mt-10'>
        {featureData.map((item, key) => (
          <Card
            key={key}
            className='group transition-all duration-200 hover:shadow-2 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm'
            padding='sm'
          >
            <div className='flex items-center gap-3 min-h-[60px]'>
              <div className='flex-shrink-0 relative'>
                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200'>
                  <Image
                    src={item.img}
                    alt={`${item.title} icon`}
                    width={24}
                    height={24}
                    className='group-hover:scale-110 transition-transform duration-200'
                  />
                </div>
                <Badge
                  variant={item.badgeVariant}
                  size='sm'
                  className='absolute -top-1 -right-1 text-2xs px-1.5 py-0.5'
                >
                  {item.badge}
                </Badge>
              </div>

              <div className='flex-1'>
                <h3 className='font-semibold text-base lg:text-lg text-gray-900 leading-tight group-hover:text-primary transition-colors duration-200'>
                  {item.title}
                </h3>
                <p className='text-xs lg:text-sm text-gray-600 leading-tight mt-0.5'>
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HeroFeature
