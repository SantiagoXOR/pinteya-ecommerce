'use client'

import { ProductCard } from '@/components/ui/card'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

export default function CommercialProductCardDemoPage() {
  const productData = {
    image: '/images/products/barniz-campbell-4l-petrilac.jpg',
    title: 'Barniz Campbell 4L',
    brand: 'PETRILAC',
    price: 19350,
    originalPrice: 21500,
    discount: '10%',
    stock: 12,
    installments: {
      quantity: 3,
      amount: 6450,
      interestFree: true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#712F00]">
            Transformación: ProductCard Comercial Estilo MercadoLibre
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-600 mb-4">
              Comparación entre el diseño actual (izquierda) y el nuevo diseño comercial más impactante (derecha).
            </p>
          </div>

          {/* Comparación lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Diseño Actual */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-800">
                🔸 Diseño Actual
              </h2>
              <div className="flex justify-center">
                <ProductCard
                  image={productData.image}
                  title={productData.title}
                  brand={productData.brand}
                  price={productData.price}
                  originalPrice={productData.originalPrice}
                  discount={productData.discount}
                  isNew={true}
                  stock={productData.stock}
                  productId="current-1"
                  useNewComponents={true}
                  showFreeShipping={true}
                  showInstallments={true}
                  installments={productData.installments}
                  onAddToCart={() => console.log('Agregado al carrito - Actual')}
                />
              </div>
            </div>

            {/* Nuevo Diseño Comercial */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-800">
                ✨ Nuevo Diseño Comercial
              </h2>
              <div className="flex justify-center">
                <CommercialProductCard
                  image={productData.image}
                  title={productData.title}
                  brand={productData.brand}
                  price={productData.price}
                  originalPrice={productData.originalPrice}
                  discount={productData.discount}
                  isNew={true}
                  stock={productData.stock}
                  productId="commercial-1"
                  installments={productData.installments}
                  freeShipping={true}
                  onAddToCart={() => console.log('Agregado al carrito - Comercial')}
                />
              </div>
            </div>
          </div>

          {/* Características del nuevo diseño */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-[#712F00]">
              🚀 Mejoras del Nuevo Diseño Comercial
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 text-lg">📐 Cambios Visuales:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Imagen más grande:</strong> 200px de altura vs 120px</li>
                  <li>• <strong>Badge "Nuevo":</strong> Esquina superior derecha</li>
                  <li>• <strong>Título destacado:</strong> text-lg font-semibold</li>
                  <li>• <strong>Precio principal:</strong> text-2xl en color naranja</li>
                  <li>• <strong>Cuotas en verde:</strong> Más visibles y atractivas</li>
                  <li>• <strong>Envío destacado:</strong> Con ícono y ubicación</li>
                  <li>• <strong>Botón llamativo:</strong> Amarillo con hover effects</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-lg">⚡ Mejoras UX:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Jerarquía visual:</strong> Precio como elemento principal</li>
                  <li>• <strong>Información clara:</strong> Cuotas y envío destacados</li>
                  <li>• <strong>Call-to-action:</strong> Botón más grande y visible</li>
                  <li>• <strong>Hover effects:</strong> Interacciones mejoradas</li>
                  <li>• <strong>Responsive:</strong> Adaptable a diferentes pantallas</li>
                  <li>• <strong>Accesibilidad:</strong> Contraste y legibilidad mejorados</li>
                  <li>• <strong>Carga rápida:</strong> Optimizado para performance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ejemplos adicionales */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-[#712F00]">
              🎨 Variaciones del Nuevo Diseño
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Producto sin descuento */}
              <div className="space-y-2">
                <h3 className="font-medium text-center">Sin Descuento</h3>
                <CommercialProductCard
                  image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-10l-plavicon.jpg"
                  title="Pintura Látex Premium 20L"
                  brand="SHERWIN WILLIAMS"
                  price={25000}
                  stock={8}
                  installments={{
                    quantity: 6,
                    amount: 4167,
                    interestFree: true
                  }}
                  freeShipping={true}
                  onAddToCart={() => console.log('Agregado - Sin descuento')}
                />
              </div>

              {/* Producto con gran descuento */}
              <div className="space-y-2">
                <h3 className="font-medium text-center">Gran Descuento</h3>
                <CommercialProductCard
                  image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-4l-petrilac.jpg"
                  title="Esmalte Sintético Brillante 1L"
                  brand="SINTEPLAST"
                  price={8500}
                  originalPrice={12000}
                  discount="30%"
                  isNew={true}
                  stock={15}
                  installments={{
                    quantity: 3,
                    amount: 2833,
                    interestFree: true
                  }}
                  onAddToCart={() => console.log('Agregado - Gran descuento')}
                />
              </div>

              {/* Producto sin stock */}
              <div className="space-y-2">
                <h3 className="font-medium text-center">Sin Stock</h3>
                <CommercialProductCard
                  image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-3kg-poxipol.png"
                  title="Impermeabilizante Acrílico 10L"
                  brand="PLAVICON"
                  price={18500}
                  originalPrice={20000}
                  discount="8%"
                  stock={0}
                  onAddToCart={() => console.log('Sin stock')}
                />
              </div>
            </div>
          </div>

          {/* Implementación */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Cómo Implementar</h3>
            <p className="text-blue-700 text-sm">
              Para usar el nuevo diseño comercial, simplemente reemplaza 
              <code className="bg-blue-100 px-1 rounded mx-1">&lt;ProductCard&gt;</code> 
              por 
              <code className="bg-blue-100 px-1 rounded mx-1">&lt;CommercialProductCard&gt;</code> 
              en tus componentes. Mantiene la misma API pero con el nuevo diseño visual.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
