import React from 'react'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

export function ProductCardExample() {
  const handleAddToCart = () => {}

  return (
    <div className='p-8 bg-[#FFFEF0] min-h-screen'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
          🧱 Nuevo CommercialProductCard Component
        </h1>

        {/* Ejemplo individual */}
        <div className='mb-12'>
          <h2 className='text-xl font-semibold mb-4'>📱 Ejemplo Individual</h2>
          <div className='max-w-sm mx-auto'>
            <CommercialProductCard
              image='/productos/loxon-20l.png'
              title='Pintura Látex Premium Sherwin Williams'
              brand='Sherwin Williams'
              price={2500}
              originalPrice={3200}
              discount='25%'
              cta='Agregar al carrito'
              onAddToCart={handleAddToCart}
              freeShipping={true}
              installments={{
                quantity: 3,
                amount: 833,
                interestFree: true,
              }}
            />
          </div>
        </div>

        {/* Grid de productos */}
        <div className='mb-12'>
          <h2 className='text-xl font-semibold mb-4'>🏪 Grid de Productos</h2>
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
              title='Pintura Látex Premium Sherwin Williams'
              brand='Sherwin Williams'
              price={2500}
              originalPrice={3200}
              discount='25%'
              cta='Agregar al carrito'
              onAddToCart={handleAddToCart}
              freeShipping={true}
              installments={{
                quantity: 3,
                amount: 833,
                interestFree: true,
              }}
            />

            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg'
              title='Esmalte Sintético Petrilac Brillante'
              brand='Petrilac'
              price={1850}
              originalPrice={2200}
              discount='15%'
              cta='Comprar ahora'
              onAddToCart={handleAddToCart}
              shippingText='Envío rápido'
            />

            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sinteplast/latex-sinteplast.jpg'
              title='Látex Interior Sinteplast Blanco'
              brand='Sinteplast'
              price={1200}
              cta='Agregar al carrito'
              onAddToCart={handleAddToCart}
              stock={3}
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
              onAddToCart={handleAddToCart}
              shippingText='Oferta especial'
            />

            <CommercialProductCard
              title='Producto sin imagen'
              brand='Genérico'
              price={999}
              isNew={true}
              cta='Agregar al carrito'
              onAddToCart={handleAddToCart}
            />

            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg'
              title='Adhesivo Estructural Poximix'
              brand='Akapol'
              price={0}
              stock={0}
              cta='Sin stock'
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Variaciones de diseño */}
        <div className='mb-12'>
          <h2 className='text-xl font-semibold mb-4'>🎨 Variaciones de Diseño</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Solo precio */}
            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg'
              title='Lija El Galgo Grano 120'
              brand='El Galgo'
              price={350}
              cta='Agregar'
              onAddToCart={handleAddToCart}
            />

            {/* Con descuento grande */}
            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/genericos/pincel-angular.jpg'
              title='Kit Completo de Pinceles Profesionales'
              brand='Profesional'
              price={1500}
              originalPrice={2500}
              discount='40%'
              cta='¡Aprovechá!'
              onAddToCart={handleAddToCart}
              shippingText='Liquidación'
            />
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <div className='bg-white rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-semibold mb-4'>📋 Especificaciones Técnicas</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm'>
            <div>
              <h3 className='font-semibold mb-2'>🎨 Estilos Visuales</h3>
              <ul className='space-y-1 text-gray-600'>
                <li>• Fondo: gradiente amarillo claro a blanco</li>
                <li>• Bordes: suaves y redondeados</li>
                <li>• Hover: elevación con sombra</li>
                <li>• Tipografía: jerarquía clara</li>
                <li>• Íconos: carrito de compras integrado</li>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>⚡ Funcionalidades</h3>
              <ul className='space-y-1 text-gray-600'>
                <li>• Adaptable a grillas 2-3 columnas</li>
                <li>• Animaciones de hover y click</li>
                <li>• Estados de carga y sin stock</li>
                <li>• Badges personalizables</li>
                <li>• CTA configurable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCardExample
