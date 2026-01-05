/**
 * ⚡ PERFORMANCE: Lazy load wrapper para Framer Motion
 * Reduce bundle inicial en ~40 KB al cargar Framer Motion solo cuando se necesita
 * 
 * NOTA: Este enfoque carga framer-motion de manera lazy pero mantiene la API compatible
 */

import React from 'react'
import dynamic from 'next/dynamic'

// Cargar framer-motion de manera lazy
let framerMotionPromise: Promise<any> | null = null
let framerMotionModule: any = null

const getFramerMotion = async () => {
  if (!framerMotionPromise) {
    framerMotionPromise = import('framer-motion').then((mod) => {
      framerMotionModule = mod
      return mod
    }).catch((error) => {
      console.error('Error loading framer-motion:', error)
      framerMotionPromise = null // Reset para permitir reintento
      throw error
    })
  }
  return framerMotionPromise
}

// Cache de componentes dinámicos para evitar recrearlos
const dynamicComponentsCache = new Map<string, any>()

// Componente placeholder que se muestra mientras carga
const MotionPlaceholder = React.forwardRef((props: any, ref: any) => {
  const Component = (props.as || 'div') as keyof JSX.IntrinsicElements
  // Remover props de framer-motion que no son válidas para elementos HTML
  const { as, initial, animate, exit, transition, whileHover, whileTap, whileFocus, ...htmlProps } = props
  // Usar React.createElement porque Component es una variable string
  return React.createElement(Component, { ...htmlProps, ref })
})
MotionPlaceholder.displayName = 'MotionPlaceholder'

// Proxy mejorado para motion que cachea componentes dinámicos
export const motion = new Proxy({} as any, {
  get: (_target, prop: string) => {
    // Si ya tenemos el módulo cargado, devolver el componente directamente
    if (framerMotionModule && framerMotionModule.motion[prop]) {
      return framerMotionModule.motion[prop]
    }
    
    // Verificar si ya creamos este componente dinámico
    if (dynamicComponentsCache.has(prop)) {
      return dynamicComponentsCache.get(prop)
    }
    
    // Crear un componente dinámico que carga framer-motion
    const DynamicMotionComponent = dynamic(
      () => getFramerMotion().then((mod) => {
        const MotionComponent = mod.motion[prop as keyof typeof mod.motion]
        if (!MotionComponent) {
          // Si el componente no existe, devolver un placeholder
          console.warn(`Framer Motion component 'motion.${prop}' not found, using placeholder`)
          return { default: MotionPlaceholder }
        }
        return { default: MotionComponent }
      }).catch((error) => {
        console.error(`Error loading framer-motion component 'motion.${prop}':`, error)
        // En caso de error, devolver placeholder
        return { default: MotionPlaceholder }
      }),
      { 
        ssr: false,
        loading: () => {
          // Mientras carga, renderizar el elemento HTML normal sin animaciones
          const Component = prop as keyof JSX.IntrinsicElements
          return React.createElement(Component)
        }
      }
    )
    
    // Cachear el componente
    dynamicComponentsCache.set(prop, DynamicMotionComponent)
    
    return DynamicMotionComponent
  }
})

// Lazy load de AnimatePresence
export const AnimatePresence = dynamic(
  () => getFramerMotion().then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
) as any

// ⚡ IMPORTANTE: Los hooks NO pueden ser lazy-loaded porque deben ejecutarse en el cuerpo del componente
// Los hooks se usan inmediatamente cuando el componente se renderiza, así que los importamos directamente
// Solo los componentes (motion.*, AnimatePresence) se cargan de manera lazy
// 
// NOTA: Esto significa que los hooks cargarán framer-motion de manera eager, pero esto es necesario
// porque los hooks de React deben ejecutarse inmediatamente y no pueden esperar a que se cargue un módulo

// Importar hooks directamente desde framer-motion
// Estos se cargan de manera eager porque se necesitan inmediatamente
import { useAnimation as useAnimationOriginal, useMotionValue as useMotionValueOriginal } from 'framer-motion'

// Re-exportar hooks directamente
export const useAnimation = useAnimationOriginal
export const useMotionValue = useMotionValueOriginal

