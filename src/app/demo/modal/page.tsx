'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import ShopDetailModalV2 from '@/components/ShopDetails/ShopDetailModalV2'
import { Product } from '@/types/product'
import { X } from '@/lib/optimized-imports'

export default function ModalDemoPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpen2, setIsOpen2] = useState(false)
  const [isOpenV2, setIsOpenV2] = useState(false)

  // Producto de ejemplo para testing
  const sampleProduct: Product = {
    id: 'demo-1',
    name: 'Pintura Látex Interior Premium',
    price: 15500,
    original_price: 18000,
    description: 'Pintura látex de alta calidad para interiores. Excelente cobertura y durabilidad. Ideal para paredes y techos. Secado rápido y fácil aplicación.',
    image_url: '/images/products/pintura-latex.jpg',
    category: 'Pinturas',
    brand: 'Alba',
    stock: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Demo de Modales</h1>
        
        {/* Modal Original (Versión Actual) */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Modal Original (Versión Actual)</h2>
          <p className="text-gray-600 mb-4">
            Este es el modal actual que está presentando problemas con los botones de cierre.
          </p>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                Abrir Modal Original
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Modal Original</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600 mb-4">
                  Este modal debería cerrarse con:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>El botón X en la esquina superior derecha</li>
                  <li>Haciendo clic fuera del modal</li>
                  <li>El botón "Cerrar" personalizado</li>
                </ul>
                
                <div className="mt-6 flex justify-end space-x-2">
                  <DialogClose asChild>
                    <Button variant="outline">
                      Cerrar con DialogClose
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={() => setIsOpen(false)}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Cerrar con onClick
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal Mejorado (Nueva Versión) */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Modal Mejorado (Nueva Versión)</h2>
          <p className="text-gray-600 mb-4">
            Esta será la nueva versión del modal con mejores prácticas de ShadCN UI.
          </p>
          
          <Dialog open={isOpen2} onOpenChange={setIsOpen2}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 text-white hover:bg-green-600">
                Abrir Modal Mejorado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] z-modal">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Modal Mejorado</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Este modal implementa las mejores prácticas de ShadCN UI:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Z-index correctamente configurado</li>
                    <li>Uso apropiado de DialogClose</li>
                    <li>Manejo de eventos optimizado</li>
                    <li>Accesibilidad mejorada</li>
                  </ul>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Funcionalidades:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>✅ Botón X funcional</li>
                      <li>✅ Click fuera del modal</li>
                      <li>✅ Botones de cierre personalizados</li>
                      <li>✅ Escape key</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button className="bg-yellow-400 text-black hover:bg-yellow-500" size="sm">
                      Confirmar
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal ShopDetail V2 (Versión Completa) */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Modal ShopDetail V2 (Versión Completa)</h2>
          <p className="text-gray-600 mb-4">
            Esta es la nueva versión completa del modal de detalles de producto basada en las mejores prácticas de ShadCN UI.
          </p>
          
          <Button 
            onClick={() => setIsOpenV2(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Abrir ShopDetail Modal V2
          </Button>
          
          <ShopDetailModalV2
            product={sampleProduct}
            open={isOpenV2}
            onOpenChange={setIsOpenV2}
            onAddToCart={(product) => {
              console.log('Producto agregado al carrito:', product)
              alert(`${product.name} agregado al carrito!`)
            }}
            onAddToWishlist={(product) => {
              console.log('Producto agregado a favoritos:', product)
              alert(`${product.name} agregado a favoritos!`)
            }}
          />
        </div>

        {/* Información de Debug */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Información de Debug</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-yellow-700 mb-2">Z-Index Values:</h4>
              <ul className="space-y-1 text-yellow-600">
                <li>• bottom-nav: 1300</li>
                <li>• modal-backdrop: 5000</li>
                <li>• modal: 5100</li>
                <li>• dialog: 5200</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-yellow-700 mb-2">Estados:</h4>
              <ul className="space-y-1 text-yellow-600">
                <li>• Modal 1: {isOpen ? 'Abierto' : 'Cerrado'}</li>
                <li>• Modal 2: {isOpen2 ? 'Abierto' : 'Cerrado'}</li>
                <li>• Modal V2: {isOpenV2 ? 'Abierto' : 'Cerrado'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón de carrito simulado para testing */}
        <div className="fixed bottom-4 right-4 z-bottom-nav">
          <Button className="bg-orange-500 text-white rounded-full w-12 h-12 shadow-lg">
            🛒
          </Button>
        </div>
      </div>
    </div>
  )
}