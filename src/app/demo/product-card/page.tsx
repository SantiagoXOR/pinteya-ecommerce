'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import React from 'react'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ProductCardDemoPage() {
  const handleAddToCart = (productName: string) => {
    alert(`🛒 ${productName} agregado al carrito`)
  }

  return (
    <div className='min-h-screen bg-[#FFFEF0]'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                🧱 CommercialProductCard Component
              </h1>
              <p className='text-gray-600 mt-1'>
                Componente comercial con diseño compacto y elegante
              </p>
            </div>
            <Button variant='outline' asChild>
              <Link href='/'>← Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Ejemplo principal */}
        <section className='mb-12'>
          <div className='bg-white rounded-lg p-6 shadow-sm mb-6'>
            <h2 className='text-2xl font-semibold mb-4'>📱 Ejemplo Principal</h2>
            <p className='text-gray-600 mb-6'>
              Implementación exacta del wireframe con todos los elementos visuales especificados.
            </p>

            <div className='flex justify-center'>
              <div className='w-80'>
                <CommercialProductCard
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
                  title='Pintura Látex Premium Sherwin Williams'
                  brand='Sherwin Williams'
                  price={2500}
                  originalPrice={3200}
                  discount='25%'
                  cta='Agregar al carrito'
                  onAddToCart={() => handleAddToCart('Pintura Látex Premium Sherwin Williams')}
                  freeShipping={true}
                  installments={{
                    quantity: 3,
                    amount: 833,
                    interestFree: true,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Wireframe visual */}
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <h3 className='text-lg font-semibold mb-4'>🎨 Estructura Visual</h3>
            <div className='bg-gray-100 p-4 rounded-lg font-mono text-sm'>
              <pre>{`┌────────────────────────────┐
│ 🔴 25% Descuento especial   │
│                            │
│  🖼 Imagen del producto     │
│                            │
│ 🟢 Llega gratis hoy         │
│ 🧾 Nombre del producto      │
│ 💲 $2.500   ~$3.200~        │
│ [🛒 Agregar al carrito]     │
└────────────────────────────┘`}</pre>
            </div>
          </div>
        </section>

        {/* Grid de productos */}
        <section className='mb-12'>
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <h2 className='text-2xl font-semibold mb-4'>🏪 Grid de Productos</h2>
            <p className='text-gray-600 mb-6'>
              Adaptable a grilla de 2 o 3 columnas, optimizado para mobile y desktop.
            </p>

            <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg'
                title='Esmalte Sintético Petrilac Brillante'
                brand='Petrilac'
                price={1850}
                originalPrice={2200}
                discount='15%'
                stock={8}
                cta='Comprar ahora'
                onAddToCart={() => handleAddToCart('Esmalte Sintético Petrilac')}
                installments={{
                  quantity: 3,
                  amount: 617,
                  interestFree: true,
                }}
                shippingText='Envío rápido'
              />

              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sinteplast/latex-sinteplast.jpg'
                title='Látex Interior Sinteplast Blanco'
                brand='Sinteplast'
                price={1200}
                stock={3}
                cta='Agregar al carrito'
                onAddToCart={() => handleAddToCart('Látex Interior Sinteplast')}
                shippingText='Stock limitado'
              />

              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/plavicon/impermeabilizante-plavicon.jpg'
                title='Impermeabilizante Plavicon 20L'
                brand='Plavicon'
                price={4500}
                originalPrice={5200}
                discount='13%'
                cta='Ver detalles'
                onAddToCart={() => handleAddToCart('Impermeabilizante Plavicon')}
                shippingText='Oferta especial'
              />

              <CommercialProductCard
                title='Producto sin imagen'
                brand='Genérico'
                price={999}
                isNew={true}
                cta='Agregar al carrito'
                onAddToCart={() => handleAddToCart('Producto sin imagen')}
              />

              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg'
                title='Lija El Galgo Grano 120'
                brand='El Galgo'
                price={350}
                cta='Agregar'
                onAddToCart={() => handleAddToCart('Lija El Galgo')}
              />

              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg'
                title='Adhesivo Estructural Poximix'
                brand='Akapol'
                price={0}
                stock={0}
                cta='Sin stock'
                onAddToCart={() => handleAddToCart('Adhesivo Poximix')}
              />
            </div>
          </div>
        </section>

        {/* Especificaciones */}
        <section>
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <h2 className='text-2xl font-semibold mb-4'>📋 Especificaciones</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div>
                <h3 className='text-lg font-semibold mb-3 text-blaze-orange-600'>
                  🎨 Estilos Visuales
                </h3>
                <ul className='space-y-2 text-gray-600'>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Fondo: blanco puro para máximo contraste</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Bordes: suaves, redondeados</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Hover state: elevación con sombra sutil</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Tipografía: jerarquía clara entre elementos</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Íconos: carrito de compras integrado</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 text-blaze-orange-600'>
                  ⚡ Funcionalidades
                </h3>
                <ul className='space-y-2 text-gray-600'>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Adaptable a grilla de 2 o 3 columnas</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Legible y claro en mobile</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Compatible con badges y descuentos</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>Facilita escaneo visual rápido</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-fun-green-500 mt-1'>•</span>
                    <span>CTA personalizable por producto</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
