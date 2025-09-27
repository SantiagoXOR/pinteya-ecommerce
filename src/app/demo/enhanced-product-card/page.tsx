'use client'

import React from 'react'
import { EnhancedProductCard } from '@/components/ui/product-card-enhanced'

export default function EnhancedProductCardDemo() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            ✨ Enhanced ProductCard - Configuración Automática
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            ProductCard inteligente que aplica automáticamente las mejores prácticas del Design
            System según el contexto de uso y configuración del producto.
          </p>
        </div>

        {/* Características */}
        <section className='mb-12'>
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <h2 className='text-2xl font-semibold mb-6'>🚀 Características Automáticas</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <h3 className='font-semibold text-green-600'>💰 Cálculo de Cuotas</h3>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Productos {'>'}$50.000: 12 cuotas</li>
                  <li>• Productos {'>'}$20.000: 6 cuotas</li>
                  <li>• Productos {'>'}$10.000: 3 cuotas</li>
                  <li>• Automáticamente sin interés</li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold text-blue-600'>🚚 Envío Gratis</h3>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Productos {'>'}$50.000: Automático</li>
                  <li>• Badge destacado cuando aplica</li>
                  <li>• Configurable por contexto</li>
                  <li>• Integrado con ShippingInfo</li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold text-orange-600'>📦 Gestión de Stock</h3>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Estados automáticos por cantidad</li>
                  <li>• Umbrales configurables</li>
                  <li>• Unidades personalizables</li>
                  <li>• Información contextual</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase de diferentes contextos */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>🎭 Configuración por Contexto</h2>

          <div className='space-y-8'>
            {/* Contexto Default */}
            <div>
              <h3 className='text-lg font-semibold mb-4'>Contexto: Default (Grid de productos)</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <EnhancedProductCard
                  context='default'
                  title='Pintura Sherwin Williams 4L'
                  price={8500}
                  originalPrice={10000}
                  stock={12}
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
                  stockUnit='latas'
                  onAddToCart={() => console.log('Agregado desde default')}
                />
                <EnhancedProductCard
                  context='default'
                  title='Esmalte Petrilac 1L'
                  price={2300}
                  stock={8}
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg'
                  stockUnit='latas'
                  onAddToCart={() => console.log('Agregado desde default')}
                />
              </div>
            </div>

            {/* Contexto Product Detail */}
            <div>
              <h3 className='text-lg font-semibold mb-4'>
                Contexto: Product Detail (Información completa)
              </h3>
              <div className='max-w-sm mx-auto'>
                <EnhancedProductCard
                  context='productDetail'
                  title='Pintura Sherwin Williams ProClassic 4L'
                  price={8500}
                  originalPrice={10000}
                  stock={12}
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
                  stockUnit='latas'
                  onAddToCart={() => console.log('Agregado desde detalle')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ejemplos específicos */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>🎯 Ejemplos Específicos</h2>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Producto Premium */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <h3 className='text-lg font-semibold mb-4'>💎 Producto Premium ({'>'}$50.000)</h3>
              <div className='flex justify-center'>
                <EnhancedProductCard
                  context='demo'
                  title='Pintura Premium Sherwin Williams 20L'
                  price={65000}
                  originalPrice={78000}
                  stock={5}
                  stockUnit='latas'
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
                  onAddToCart={() => alert('Producto premium agregado')}
                />
              </div>
              <div className='mt-4 text-sm text-gray-600'>
                <p>✅ 12 cuotas sin interés automáticas</p>
                <p>✅ Envío gratis destacado</p>
                <p>✅ Stock exacto visible</p>
                <p>✅ Descuento calculado automáticamente</p>
              </div>
            </div>

            {/* Producto Económico */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <h3 className='text-lg font-semibold mb-4'>💡 Producto Económico ({'<'}$10.000)</h3>
              <div className='flex justify-center'>
                <EnhancedProductCard
                  context='demo'
                  title='Pincel Sintético 2 pulgadas'
                  price={850}
                  stock={25}
                  stockUnit='pinceles'
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/plavicon/impermeabilizante-plavicon.jpg'
                  onAddToCart={() => alert('Pincel agregado')}
                />
              </div>
              <div className='mt-4 text-sm text-gray-600'>
                <p>❌ Sin cuotas (precio bajo)</p>
                <p>❌ Sin envío gratis destacado</p>
                <p>✅ Stock disponible</p>
                <p>✅ Precio simple y claro</p>
              </div>
            </div>

            {/* Producto con Stock Bajo */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <h3 className='text-lg font-semibold mb-4'>⚠️ Stock Bajo (Urgencia)</h3>
              <div className='flex justify-center'>
                <EnhancedProductCard
                  context='demo'
                  title='Adhesivo Estructural Poximix 250ml'
                  price={2300}
                  stock={2}
                  lowStockThreshold={5}
                  stockUnit='tubos'
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg'
                  onAddToCart={() => alert('¡Última unidad agregada!')}
                />
              </div>
              <div className='mt-4 text-sm text-gray-600'>
                <p>⚠️ Indicador de stock bajo</p>
                <p>✅ 3 cuotas sin interés</p>
                <p>✅ Cantidad exacta visible</p>
                <p>🔥 Sensación de urgencia</p>
              </div>
            </div>

            {/* Producto Sin Stock */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <h3 className='text-lg font-semibold mb-4'>❌ Sin Stock (Información clara)</h3>
              <div className='flex justify-center'>
                <EnhancedProductCard
                  context='demo'
                  title='Lija El Galgo Grano 120'
                  price={450}
                  stock={0}
                  stockUnit='unidades'
                  image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg'
                  onAddToCart={() => alert('Producto sin stock')}
                />
              </div>
              <div className='mt-4 text-sm text-gray-600'>
                <p>❌ Estado sin stock claro</p>
                <p>🔴 Botón deshabilitado</p>
                <p>📅 Información de reposición</p>
                <p>💡 Alternativas sugeridas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Configuración Manual */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>⚙️ Configuración Manual (Override)</h2>

          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Cuotas personalizadas */}
              <div>
                <h3 className='font-semibold mb-3'>💳 Cuotas Personalizadas</h3>
                <EnhancedProductCard
                  context='demo'
                  title='Producto con Cuotas Especiales'
                  price={15000}
                  customInstallments={{
                    quantity: 18,
                    amount: 833,
                    interestFree: true,
                  }}
                  stock={10}
                  onAddToCart={() => alert('Cuotas especiales')}
                />
                <p className='text-xs text-gray-600 mt-2'>
                  18 cuotas personalizadas en lugar de las 6 automáticas
                </p>
              </div>

              {/* Forzar nuevos componentes */}
              <div>
                <h3 className='font-semibold mb-3'>🔧 Componentes Forzados</h3>
                <EnhancedProductCard
                  context='default'
                  forceNewComponents={true}
                  title='Forzando Nuevos Componentes'
                  price={5000}
                  stock={15}
                  showExactStock={true}
                  onAddToCart={() => alert('Componentes forzados')}
                />
                <p className='text-xs text-gray-600 mt-2'>
                  Nuevos componentes activados manualmente
                </p>
              </div>

              {/* Datos del producto */}
              <div>
                <h3 className='font-semibold mb-3'>📊 Datos Adicionales</h3>
                <EnhancedProductCard
                  context='demo'
                  title='Producto con Metadata'
                  price={12000}
                  stock={8}
                  productData={{
                    category: 'pinturas',
                    weight: 4.5,
                    dimensions: {
                      length: 20,
                      width: 15,
                      height: 25,
                    },
                  }}
                  onAddToCart={() => alert('Con metadata')}
                />
                <p className='text-xs text-gray-600 mt-2'>Incluye datos para cálculos de envío</p>
              </div>
            </div>
          </div>
        </section>

        {/* Código de ejemplo */}
        <section className='mb-12'>
          <div className='bg-gray-900 rounded-lg p-6 text-white'>
            <h2 className='text-xl font-semibold mb-4'>💻 Código de Ejemplo</h2>
            <pre className='text-sm overflow-x-auto'>
              {`// Uso básico con configuración automática
<EnhancedProductCard
  context="demo"
  title="Pintura Sherwin Williams"
  price={8500}
  originalPrice={10000}
  stock={12}
  stockUnit="latas"
  onAddToCart={() => handleAddToCart()}
/>

// Con configuración personalizada
<EnhancedProductCard
  context="productDetail"
  forceNewComponents={true}
  customInstallments={{
    quantity: 18,
    amount: 833,
    interestFree: true
  }}
  title="Producto Premium"
  price={65000}
  stock={5}
  onAddToCart={() => handleAddToCart()}
/>`}
            </pre>
          </div>
        </section>

        {/* Footer */}
        <div className='text-center py-8 border-t border-gray-200'>
          <p className='text-gray-600'>
            ✨ Enhanced ProductCard - Configuración inteligente del Design System Pinteya
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            Automatiza las mejores prácticas de UX/UI para e-commerce argentino
          </p>
        </div>
      </div>
    </div>
  )
}
