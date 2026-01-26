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
import { useRouter } from 'next/navigation'
import { useTenantAssets, useTenantSafe } from '@/contexts/TenantContext'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'

const NewHeader = () => {
  // Obtener assets del tenant (con fallback seguro)
  const tenant = useTenantSafe()
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NewHeader.tsx:16',message:'Tenant loaded in NewHeader',data:{tenantSlug:tenant?.slug,tenantName:tenant?.name,headerBgColor:tenant?.headerBgColor,primaryColor:tenant?.primaryColor,hasTenant:!!tenant},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  // ⚡ MULTITENANT: Assets desde Supabase Storage con fallback local
  const tenantAssets = tenant ? {
    logo: tenant.logoUrl || getTenantAssetPath(tenant, 'logo.svg', `/tenants/${tenant.slug}/logo.svg`),
    logoDark: tenant.logoDarkUrl || getTenantAssetPath(tenant, 'logo-dark.svg', `/tenants/${tenant.slug}/logo-dark.svg`),
    logoLocal: `/tenants/${tenant.slug}/logo.svg`,
    logoDarkLocal: `/tenants/${tenant.slug}/logo-dark.svg`,
  } : {
    logo: '/images/logo/LOGO POSITIVO.svg',
    logoDark: '/images/logo/LOGO NEGATIVO.svg',
    logoLocal: '/images/logo/LOGO POSITIVO.svg',
    logoDarkLocal: '/images/logo/LOGO NEGATIVO.svg',
  }
  const tenantName = tenant?.name || 'Pinteya'
  const router = useRouter()
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
  
  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const cssVarHeaderBg = getComputedStyle(root).getPropertyValue('--tenant-header-bg').trim();
      const cssVarGradientStart = getComputedStyle(root).getPropertyValue('--tenant-gradient-start').trim();
      const cssVarGradientEnd = getComputedStyle(root).getPropertyValue('--tenant-gradient-end').trim();
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NewHeader.tsx:42',message:'CSS variables from root',data:{cssVarHeaderBg,cssVarGradientStart,cssVarGradientEnd,tenantHeaderBg:tenant?.headerBgColor,tenantGradientStart:tenant?.backgroundGradientStart,tenantGradientEnd:tenant?.backgroundGradientEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    }
  }, [tenant])
  // #endregion

  const handleSearch = (query: string) => {
    // Implementar lógica de búsqueda
  }

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    console.log('🔍 handleSuggestionSelect ejecutado con:', suggestion)
    if (suggestion.type === 'product' && suggestion.id) {
      // Redirigir directamente al detalle del producto usando slug si está disponible
      const productSlug = (suggestion as any).slug
      const productUrl = productSlug ? `/products/${productSlug}` : `/products/${suggestion.id}`
      router.push(productUrl)
      return
    }
    // Para otros tipos, dejar comportamiento actual (no-op aquí)
    console.log('⚠️ Sugerencia no es producto:', suggestion.type)
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
          'sticky top-0 z-50 w-full transition-all duration-300',
          stickyMenu && 'shadow-md'
        )}
        style={{ 
          // ⚡ FIX: Usar valor del tenant directamente si está disponible, sino usar variable CSS
          backgroundColor: tenant?.headerBgColor || 'var(--tenant-header-bg)',
          borderBottomColor: tenant?.primaryDark || 'var(--tenant-primary-dark)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid'
        }}
      >
        <div className='max-w-[1170px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 lg:h-20'>
            {/* Logo - Sección izquierda (dinámico por tenant) */}
            <div className='flex-shrink-0'>
              <Link href='/' className='flex items-center'>
                <Image
                  src={tenantAssets.logo}
                  alt={`${tenantName} Logo`}
                  width={200}
                  height={40}
                  className='h-10 w-auto'
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src !== tenantAssets.logoLocal) {
                      target.src = tenantAssets.logoLocal
                    }
                  }}
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
