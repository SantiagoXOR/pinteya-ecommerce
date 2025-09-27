'use client'

import React, { useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface CheckoutTransitionAnimationProps {
  isActive: boolean
  onComplete?: () => void
  skipAnimation?: boolean
  enablePerformanceMode?: boolean
  customDuration?: number
  onAnimationStart?: () => void
  onAnimationProgress?: (progress: number) => void
}

interface AnimationSequence {
  name: string
  delay: number
  duration: number
  element: string
}

export const CheckoutTransitionAnimation: React.FC<CheckoutTransitionAnimationProps> = ({
  isActive,
  onComplete,
  skipAnimation = false,
  enablePerformanceMode = false,
  customDuration,
  onAnimationStart,
  onAnimationProgress,
}) => {
  const router = useRouter()
  const animationControls = useAnimation()
  const progressValue = useMotionValue(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationStartTimeRef = useRef<number | null>(null)

  // Configuración de duración optimizada
  const animationDuration = useMemo(() => {
    if (customDuration) {
      return customDuration
    }
    if (skipAnimation) {
      return 100
    }
    if (enablePerformanceMode) {
      return 1500
    } // Versión más rápida para dispositivos lentos
    return 2500 // Duración completa
  }, [customDuration, skipAnimation, enablePerformanceMode])

  // Secuencia de animaciones optimizada
  const animationSequence: AnimationSequence[] = useMemo(() => {
    if (skipAnimation) {
      return []
    }

    const baseSequence = [
      { name: 'wave', delay: 0.3, duration: 1.5, element: 'wave' },
      { name: 'logo', delay: 0.8, duration: 1.8, element: 'logo' },
      { name: 'particles', delay: 1.2, duration: 1.2, element: 'particles' },
      { name: 'text', delay: 1.5, duration: 1.5, element: 'text' },
    ]

    // Optimizar para modo performance
    if (enablePerformanceMode) {
      return baseSequence.map(seq => ({
        ...seq,
        duration: seq.duration * 0.6, // 40% más rápido
        delay: seq.delay * 0.6,
      }))
    }

    return baseSequence
  }, [skipAnimation, enablePerformanceMode])

  // Callback optimizado para progreso
  const handleProgress = useCallback(
    (progress: number) => {
      progressValue.set(progress)
      onAnimationProgress?.(progress)
    },
    [progressValue, onAnimationProgress]
  )

  // Cleanup mejorado
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      animationControls.stop()
    }
  }, [animationControls])

  useEffect(() => {
    if (isActive) {
      animationStartTimeRef.current = performance.now()
      onAnimationStart?.()

      if (skipAnimation) {
        // Navegación inmediata para skip
        timeoutRef.current = setTimeout(() => {
          router.push('/checkout')
          onComplete?.()
        }, 100)
      } else {
        // Iniciar secuencia de animación
        animationControls.start('animate')

        // Progress tracking
        const progressInterval = setInterval(() => {
          if (animationStartTimeRef.current) {
            const elapsed = performance.now() - animationStartTimeRef.current
            const progress = Math.min((elapsed / animationDuration) * 100, 100)
            handleProgress(progress)
          }
        }, 16) // 60fps

        // Secuencia completa de animación
        timeoutRef.current = setTimeout(() => {
          clearInterval(progressInterval)
          handleProgress(100)
          router.push('/checkout')
          onComplete?.()
        }, animationDuration)

        return () => {
          clearInterval(progressInterval)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
        }
      }
    }
  }, [
    isActive,
    skipAnimation,
    router,
    onComplete,
    animationDuration,
    animationControls,
    handleProgress,
    onAnimationStart,
  ])

  // Variantes de animación optimizadas
  const containerVariants = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
      exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' },
      },
    }),
    []
  )

  const waveVariants = useMemo(
    () => ({
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: enablePerformanceMode ? [0, 6, 8] : [0, 8, 12],
        opacity: [0, 0.8, 0.6, 0],
      },
    }),
    [enablePerformanceMode]
  )

  const logoVariants = useMemo(
    () => ({
      initial: { scale: 0, opacity: 0, rotate: -180 },
      animate: {
        scale: enablePerformanceMode ? [0, 2, 1] : [0, 2.5, 1],
        opacity: [0, 1, 1, 0],
        rotate: [180, 0, 0],
      },
    }),
    [enablePerformanceMode]
  )

  if (!isActive || skipAnimation) {
    return null
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        className='fixed inset-0 z-[99999] pointer-events-none checkout-transition-container'
        variants={containerVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        style={{
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      >
        {/* Onda circular amarilla optimizada */}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          variants={waveVariants}
          initial='initial'
          animate='animate'
          transition={{
            duration: animationSequence.find(seq => seq.name === 'wave')?.duration || 1.5,
            delay: animationSequence.find(seq => seq.name === 'wave')?.delay || 0.3,
            times: [0, 0.6, 0.8, 1],
            ease: 'easeOut',
          }}
        >
          <div
            className={`w-32 h-32 rounded-full checkout-transition-wave ${
              enablePerformanceMode ? '' : 'checkout-transition-overlay'
            }`}
            style={{
              background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 50%, transparent 70%)',
              filter: enablePerformanceMode ? 'none' : 'blur(2px)',
            }}
          />
        </motion.div>

        {/* Logo crash zoom optimizado */}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          variants={logoVariants}
          initial='initial'
          animate='animate'
          transition={{
            duration: animationSequence.find(seq => seq.name === 'logo')?.duration || 1.8,
            delay: animationSequence.find(seq => seq.name === 'logo')?.delay || 0.8,
            times: [0, 0.3, 0.7, 1],
            ease: [0.68, -0.55, 0.265, 1.55], // Bounce effect
          }}
        >
          <div className='relative'>
            {/* Efecto de resplandor optimizado */}
            {!enablePerformanceMode && (
              <motion.div
                className='absolute inset-0 rounded-full css-logo-glow'
                style={{
                  background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.3],
                }}
                transition={{
                  duration: 1,
                  delay: 1,
                  repeat: 1,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Logo principal con optimizaciones */}
            <Image
              src='/images/logo/LOGO POSITIVO.svg'
              alt='Pinteya Logo'
              width={enablePerformanceMode ? 80 : 120}
              height={enablePerformanceMode ? 80 : 120}
              className='relative z-10 checkout-transition-logo'
              priority
              style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </motion.div>

        {/* Partículas decorativas optimizadas */}
        {!enablePerformanceMode &&
          [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className='absolute w-2 h-2 bg-yellow-400 rounded-full'
              style={{
                left: '50%',
                top: '50%',
                willChange: 'transform, opacity',
              }}
              initial={{
                scale: 0,
                x: 0,
                y: 0,
                opacity: 0,
              }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * Math.PI * 2) / 8) * (enablePerformanceMode ? 150 : 200),
                y: Math.sin((i * Math.PI * 2) / 8) * (enablePerformanceMode ? 150 : 200),
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: animationSequence.find(seq => seq.name === 'particles')?.duration || 1.2,
                delay:
                  (animationSequence.find(seq => seq.name === 'particles')?.delay || 1.2) + i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}

        {/* Texto de transición optimizado */}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          initial={{ opacity: 0, y: 50 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [50, 0, 0, -20],
          }}
          transition={{
            duration: animationSequence.find(seq => seq.name === 'text')?.duration || 1.5,
            delay: animationSequence.find(seq => seq.name === 'text')?.delay || 1.5,
            times: [0, 0.3, 0.7, 1],
            ease: 'easeOut',
          }}
        >
          <div className='text-center'>
            <h3
              className={`font-bold text-gray-800 mb-2 ${
                enablePerformanceMode ? 'text-xl' : 'text-2xl'
              }`}
            >
              ¡Procesando tu compra!
            </h3>
            <p className='text-gray-600'>Te llevamos al checkout...</p>
          </div>
        </motion.div>

        {/* Overlay de fondo optimizado */}
        <motion.div
          className='absolute inset-0 bg-white'
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0.5, 0.8] }}
          transition={{
            duration: animationDuration / 1000,
            ease: 'easeInOut',
          }}
        />

        {/* Skip button para accesibilidad */}
        <motion.button
          className='checkout-transition-skip-button'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            router.push('/checkout')
            onComplete?.()
          }}
          aria-label='Saltar animación e ir al checkout'
        >
          Saltar animación
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}

export default CheckoutTransitionAnimation
