/**
 * Hook para manejar la lógica de un carousel de hero con autoplay
 * Incluye navegación automática, manual, pausa en hover y controles completos
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseHeroCarouselProps {
  images: string[]
  autoPlayInterval?: number
  pauseOnHover?: boolean
}

interface UseHeroCarouselReturn {
  currentIndex: number
  isPlaying: boolean
  isPaused: boolean
  goToSlide: (index: number) => void
  goToNext: () => void
  goToPrevious: () => void
  pause: () => void
  resume: () => void
  setHover: (isHovering: boolean) => void
}

/**
 * Hook que maneja la lógica completa de un carousel con autoplay
 * @param images - Array de URLs de imágenes
 * @param autoPlayInterval - Intervalo de autoplay en ms (default: 5000)
 * @param pauseOnHover - Si debe pausar en hover (default: true)
 * @returns objeto con estado y funciones de control del carousel
 */
export const useHeroCarousel = ({
  images,
  autoPlayInterval = 5000,
  pauseOnHover = true,
}: UseHeroCarouselProps): UseHeroCarouselReturn => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para ir al siguiente slide
  const goToNext = useCallback(() => {
    if (images.length <= 1) {
      return
    } // No navegar si solo hay una imagen
    setCurrentIndex(prevIndex => (prevIndex + 1) % images.length)
  }, [images.length])

  // Función para ir al slide anterior
  const goToPrevious = useCallback(() => {
    if (images.length <= 1) {
      return
    } // No navegar si solo hay una imagen
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }, [images.length])

  // Función para ir a un slide específico
  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < images.length) {
        setCurrentIndex(index)
      }
    },
    [images.length]
  )

  // Función para pausar el autoplay
  const pause = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Función para reanudar el autoplay
  const resume = useCallback(() => {
    setIsPlaying(true)
    setIsPaused(false)
  }, [])

  // Función para manejar hover
  const setHover = useCallback(
    (hovering: boolean) => {
      setIsHovering(hovering)
      if (pauseOnHover) {
        if (hovering) {
          pause()
        } else {
          resume()
        }
      }
    },
    [pauseOnHover, pause, resume]
  )

  // Efecto para manejar el autoplay
  useEffect(() => {
    // No iniciar autoplay si hay una sola imagen o menos
    if (images.length <= 1) {
      setIsPlaying(false)
      return
    }

    // Limpiar intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Iniciar nuevo intervalo si está reproduciendo y no está pausado
    if (isPlaying && !isPaused && (!pauseOnHover || !isHovering)) {
      intervalRef.current = setInterval(() => {
        goToNext()
      }, autoPlayInterval)
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, isPaused, isHovering, pauseOnHover, autoPlayInterval, goToNext, images.length])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    currentIndex,
    isPlaying,
    isPaused,
    goToSlide,
    goToNext,
    goToPrevious,
    pause,
    resume,
    setHover,
  }
}

export default useHeroCarousel
