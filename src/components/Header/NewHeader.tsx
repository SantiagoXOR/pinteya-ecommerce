'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TopBar from './TopBar'
import EnhancedSearchBar from './EnhancedSearchBar'
import ActionButtons from './ActionButtons'
import { ShopDetailModal } from '@/components/ShopDetails/ShopDetailModal'
import { cn } from '@/lib/utils'
import { SearchSuggestion } from '@/types/search'

const NewHeader = () => {
  const [stickyMenu, setStickyMenu] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sticky menu logic
  const handleStickyMenu = () => {
    if (window.scrollY >= 60) {
      setStickyMenu(true)
    } else {
      setStickyMenu(false)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleStickyMenu)
    return () => window.removeEventListener('scroll', handleStickyMenu)
  }, [])

  const handleSearch = (query: string) => {
    // Implementar lógica de búsqueda
  }

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    console.log('🔍 handleSuggestionSelect ejecutado con:', suggestion)

    if (suggestion.type === 'product') {
      console.log('✅ Es una sugerencia de producto, procesando...')
      try {
        console.log(`📡 Haciendo fetch a: /api/products/${suggestion.id}`)
        // Obtener los detalles completos del producto
        const response = await fetch(`/api/products/${suggestion.id}`)
        console.log('📡 Respuesta recibida:', response.status, response.statusText)

        if (response.ok) {
          const product = await response.json()
          console.log('📦 Producto obtenido:', product)
          console.log(
            '🔄 Estado anterior - selectedProduct:',
            !!selectedProduct,
            'isModalOpen:',
            isModalOpen
          )

          // Actualizar estados
          console.log('🎯 Actualizando selectedProduct...')
          setSelectedProduct(product)
          console.log('🎯 Actualizando isModalOpen a true...')
          setIsModalOpen(true)
          console.log('✅ Estados actualizados')
        } else {
          console.error('❌ Error al obtener el producto:', response.statusText)
        }
      } catch (error) {
        console.error('❌ Error al cargar el producto:', error)
      }
    } else {
      console.log('⚠️ No es una sugerencia de producto, tipo:', suggestion.type)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleAddToCart = (
    product: any,
    quantity: number,
    selectedColor?: string,
    selectedCapacity?: string
  ) => {
    // Implementar lógica de agregar al carrito
    console.log('Agregando al carrito:', { product, quantity, selectedColor, selectedCapacity })
    // Aquí puedes integrar con tu sistema de carrito existente
  }

  return (
    <>
      {/* TopBar superior - Solo desktop */}
      <TopBar />

      {/* Header principal */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full bg-blaze-orange-600 border-b border-blaze-orange-700 transition-all duration-300',
          stickyMenu && 'shadow-md'
        )}
      >
        <div className='max-w-[1170px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 lg:h-20'>
            {/* Logo - Sección izquierda */}
            <div className='flex-shrink-0'>
              <Link href='/' className='flex items-center'>
                <Image
                  src='/images/logo/LOGO POSITIVO.svg'
                  alt='Pinteya Logo'
                  width={200}
                  height={40}
                  className='h-10 w-auto'
                  priority
                />
              </Link>
            </div>

            {/* Buscador - Sección central */}
            <div className='hidden lg:flex flex-1 max-w-2xl mx-8'>
              <EnhancedSearchBar
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                size={stickyMenu ? 'sm' : 'md'}
                data-testid='desktop-search-input'
              />
            </div>

            {/* Acciones - Sección derecha */}
            <div className='flex items-center gap-4'>
              {/* Botones de acción desktop */}
              <div className='hidden lg:block'>
                <ActionButtons variant='header' />
              </div>

              {/* Botones móviles */}
              <div className='lg:hidden'>
                <ActionButtons variant='mobile' />
              </div>
            </div>
          </div>

          {/* Buscador móvil */}
          <div className='lg:hidden pb-4'>
            <EnhancedSearchBar
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              size='sm'
              data-testid='mobile-search-input'
            />
          </div>
        </div>
      </header>

      {/* Modal de detalles del producto */}
      {console.log(
        '🔍 Renderizando modal - isModalOpen:',
        isModalOpen,
        'selectedProduct:',
        !!selectedProduct
      )}
      {isModalOpen && selectedProduct && (
        <ShopDetailModal
          product={selectedProduct}
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  )
}

export default NewHeader
