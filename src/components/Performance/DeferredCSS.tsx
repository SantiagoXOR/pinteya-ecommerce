/**
 * Componente para cargar CSS de forma diferida
 * ⚡ OPTIMIZACIÓN V2: Reduce bloqueo de renderización con múltiples técnicas
 * 
 * Técnicas implementadas:
 * 1. media="print" para carga asíncrona de CSS
 * 2. rel="preload" as="style" para priorización
 * 3. requestIdleCallback para no bloquear el hilo principal
 * 4. Chunking inteligente de CSS por prioridad
 */

'use client'

import { useEffect } from 'react'

interface CSSResource {
  path: string
  priority: 'high' | 'medium' | 'low'
  condition?: () => boolean // Condición para cargar (ej: solo en mobile, solo en homepage)
  routes?: string[] // Rutas específicas donde se necesita este CSS
}

export function DeferredCSS() {
  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: CSS categorizado por prioridad y rutas
    const cssResources: CSSResource[] = [
      // Prioridad ALTA: CSS que afecta interacciones comunes
      {
        path: '/styles/z-index-hierarchy.css',
        priority: 'high',
      },
      
      // Prioridad MEDIA: CSS para secciones específicas
      {
        path: '/styles/checkout-mobile.css',
        priority: 'medium',
        condition: () => window.innerWidth < 768, // Solo en mobile
        routes: ['/checkout', '/checkout/*'], // Solo en checkout
      },
      {
        path: '/styles/checkout-transition.css',
        priority: 'medium',
        routes: ['/checkout', '/checkout/*'], // Solo en checkout
      },
      {
        path: '/styles/checkout-animations.css', // Nuevo: animaciones del checkout
        priority: 'low',
        routes: ['/checkout', '/checkout/*'], // Solo en checkout
      },
      
      // Prioridad MEDIA-BAJA: CSS del carousel (solo en homepage)
      {
        path: '/styles/hero-carousel.css',
        priority: 'medium',
        routes: ['/'], // Solo en homepage
        condition: () => {
          // Verificar si estamos en homepage
          const isHomepage = window.location.pathname === '/' || window.location.pathname === ''
          return isHomepage
        },
      },
      
      // Prioridad BAJA: CSS decorativo o animaciones adicionales
      {
        path: '/styles/home-v2-animations.css',
        priority: 'low',
        routes: ['/'], // Solo en homepage
      },
      {
        path: '/styles/mobile-modals.css',
        priority: 'low',
        condition: () => window.innerWidth < 768,
      },
      {
        path: '/styles/collapsible.css',
        priority: 'low',
      },
    ]

    // Función para cargar CSS con técnica media="print" + preload
    const loadCSS = (cssPath: string, usePreload = false) => {
      const fileName = cssPath.split('/').pop()
      
      // Verificar si ya está cargado
      if (document.querySelector(`link[href*="${fileName}"]`)) {
        return Promise.resolve()
      }

      return new Promise<void>((resolve, reject) => {
        if (usePreload) {
          // ⚡ TÉCNICA 1: Usar preload para priorización alta
          const preload = document.createElement('link')
          preload.rel = 'preload'
          preload.as = 'style'
          preload.href = cssPath
          document.head.appendChild(preload)
        }

        // ⚡ TÉCNICA 2: Media="print" para carga no bloqueante
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cssPath
        link.media = 'print' // Inicialmente como print para no bloquear
        
        // Cambiar a 'all' cuando se carga
        link.onload = () => {
          link.media = 'all'
          // Forzar repaint para aplicar estilos inmediatamente
          link.onload = null
          resolve()
        }

        link.onerror = () => {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Failed to load CSS: ${cssPath}`)
          }
          reject()
        }

        document.head.appendChild(link)
      })
    }

    // ⚡ OPTIMIZACIÓN: Cargar CSS en orden de prioridad
    const loadDeferredCSS = async () => {
      const currentPath = window.location.pathname
      
      // Filtrar recursos según condiciones y rutas
      const filteredResources = cssResources.filter((resource) => {
        // Verificar condición general
        if (resource.condition && !resource.condition()) {
          return false
        }
        
        // Verificar si hay restricción de rutas
        if (resource.routes && resource.routes.length > 0) {
          // Verificar si la ruta actual coincide con alguna ruta permitida
          const matchesRoute = resource.routes.some((route) => {
            if (route.endsWith('/*')) {
              // Wildcard: /checkout/* coincide con /checkout/payment
              const baseRoute = route.slice(0, -2)
              return currentPath === baseRoute || currentPath.startsWith(baseRoute + '/')
            }
            return currentPath === route
          })
          
          if (!matchesRoute) {
            return false
          }
        }
        
        return true
      })

      // Separar por prioridad
      const highPriority = filteredResources.filter(r => r.priority === 'high')
      const mediumPriority = filteredResources.filter(r => r.priority === 'medium')
      const lowPriority = filteredResources.filter(r => r.priority === 'low')

      try {
        // Cargar prioridad alta inmediatamente con preload
        await Promise.all(highPriority.map(r => loadCSS(r.path, true)))
        
        // Cargar prioridad media después de un pequeño delay
        setTimeout(() => {
          Promise.all(mediumPriority.map(r => loadCSS(r.path)))
        }, 50)
        
        // Cargar prioridad baja cuando el navegador esté idle
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            Promise.all(lowPriority.map(r => loadCSS(r.path)))
          }, { timeout: 3000 })
        } else {
          setTimeout(() => {
            Promise.all(lowPriority.map(r => loadCSS(r.path)))
          }, 500)
        }
      } catch (error) {
        // Errores ya manejados en loadCSS
      }
    }

    // ⚡ OPTIMIZACIÓN: Usar requestIdleCallback para no bloquear el hilo principal
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDeferredCSS, { timeout: 1000 })
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(loadDeferredCSS, 0)
    }

    // Cleanup: remover event listeners si el componente se desmonta
    return () => {
      // No es necesario limpiar los links CSS ya que se necesitan en toda la app
    }
  }, [])

  return null
}

