'use client'

import { useEffect, useState, useId } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'

interface InitialLoadingSpinnerProps {
  /** Duración mínima de visualización en ms (para evitar parpadeo) */
  minDisplayTime?: number
  /** Ocultar automáticamente cuando el contenido esté listo */
  autoHide?: boolean
}

export function InitialLoadingSpinner({
  minDisplayTime = 300, // Reducido de 800ms a 300ms para respuesta más rápida
  autoHide = true,
}: InitialLoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const gradientId = useId()

  useEffect(() => {
    if (!autoHide) return

    const startTime = Date.now()
    let animationFrame: number
    let hideTimeout: NodeJS.Timeout | null = null
    let isHiding = false

    // Simular progreso de carga
    const updateProgress = () => {
      if (isHiding) return
      
      const elapsed = Date.now() - startTime
      const progressValue = Math.min((elapsed / minDisplayTime) * 100, 95) // Máximo 95% hasta que esté listo
      setProgress(progressValue)

      if (elapsed < minDisplayTime && !isHiding) {
        animationFrame = requestAnimationFrame(updateProgress)
      }
    }

    animationFrame = requestAnimationFrame(updateProgress)

    // Ocultar cuando el contenido esté listo
    const hideLoader = () => {
      if (isHiding) return
      isHiding = true

      const elapsed = Date.now() - startTime
      // Si ya pasó el tiempo mínimo, ocultar inmediatamente
      // Si no, esperar solo lo necesario para completar el mínimo
      const remainingTime = Math.max(0, minDisplayTime - elapsed)

      if (hideTimeout) clearTimeout(hideTimeout)
      
      hideTimeout = setTimeout(() => {
        setProgress(100)
        // Fade out más rápido (150ms en lugar de 300ms)
        setTimeout(() => {
          setIsVisible(false)
        }, 150)
      }, remainingTime)
    }

    // Detectar cuando el contenido está listo
    if (typeof window !== 'undefined') {
      // Si el contenido ya está listo al montar, ocultar inmediatamente
      if (document.readyState === 'complete') {
        // Si ya pasó suficiente tiempo, ocultar inmediatamente
        // Si no, esperar solo el mínimo necesario
        const elapsed = Date.now() - startTime
        if (elapsed >= minDisplayTime) {
          setProgress(100)
          setTimeout(() => setIsVisible(false), 150)
        } else {
          hideLoader()
        }
      } else {
        // Escuchar eventos de carga
        window.addEventListener('load', hideLoader, { once: true })
        document.addEventListener('DOMContentLoaded', hideLoader, { once: true })
      }

      // Detectar First Contentful Paint (FCP) - más rápido que 'load'
      let observer: PerformanceObserver | null = null
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              hideLoader()
              break
            }
          }
        })
        observer.observe({ entryTypes: ['paint'] })
      } catch (e) {
        // Fallback si PerformanceObserver no está disponible
        // Usar DOMContentLoaded como fallback
      }

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
        if (hideTimeout) {
          clearTimeout(hideTimeout)
        }
        window.removeEventListener('load', hideLoader)
        document.removeEventListener('DOMContentLoaded', hideLoader)
        if (observer) {
          observer.disconnect()
        }
      }
    }
  }, [autoHide, minDisplayTime])

  if (!isVisible) return null

  // Calcular el stroke-dasharray para el círculo de progreso
  // Radio del círculo interno (donde está el logo)
  const innerRadius = 70
  // Radio del spinner (alrededor del círculo)
  const spinnerRadius = 80
  const circumference = 2 * Math.PI * spinnerRadius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center',
        'transition-opacity duration-150', // Reducido de 300ms a 150ms para fade out más rápido
        !isVisible && 'opacity-0 pointer-events-none'
      )}
      style={{
        background: 'linear-gradient(180deg, #ffd549 0%, #fff4c6 50%, #ffffff 100%)',
        backgroundAttachment: 'fixed',
      }}
      aria-label="Cargando Pinteya"
      role="status"
      data-z-index="10000"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Contenedor del círculo con logo y spinner */}
        <div className="relative">
          {/* SVG con el spinner alrededor */}
          <svg
            className="transform -rotate-90"
            width="200"
            height="200"
            viewBox="0 0 200 200"
          >
            {/* Círculo de fondo del spinner (gris claro) */}
            <circle
              cx="100"
              cy="100"
              r={spinnerRadius}
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200"
            />
            {/* Círculo de progreso del spinner con gradiente */}
            <circle
              cx="100"
              cy="100"
              r={spinnerRadius}
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-300 ease-out"
            />
            {/* Definir gradiente con colores de Pinteya */}
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f27a1d" /> {/* blaze-orange-500 */}
                <stop offset="50%" stopColor="#00f269" /> {/* fun-green-500 */}
                <stop offset="100%" stopColor="#f9a007" /> {/* bright-sun-500 */}
              </linearGradient>
            </defs>
          </svg>

          {/* Círculo naranja con el logo dentro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full bg-blaze-orange-500 flex items-center justify-center shadow-lg"
              style={{
                width: `${innerRadius * 2}px`,
                height: `${innerRadius * 2}px`,
              }}
            >
              {/* Logo positivo sin filtros */}
              <Image
                src="/images/logo/LOGO POSITIVO.svg"
                alt="Pinteya"
                width={100}
                height={40}
                priority
                className="object-contain"
                style={{
                  width: '100px',
                  height: 'auto',
                }}
              />
            </div>
          </div>
        </div>

        {/* Texto opcional de carga */}
        <p className="mt-8 text-sm font-medium text-gray-600 animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  )
}

