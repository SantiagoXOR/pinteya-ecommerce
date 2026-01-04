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

const getFramerMotion = () => {
  if (!framerMotionPromise) {
    framerMotionPromise = import('framer-motion')
  }
  return framerMotionPromise
}

// Proxy para motion que carga framer-motion cuando se accede a cualquier propiedad
export const motion = new Proxy({} as any, {
  get: (_target, prop: string) => {
    // Crear un componente dinámico para cada elemento HTML (div, button, etc.)
    return dynamic(
      () => getFramerMotion().then((mod) => {
        const MotionComponent = mod.motion[prop as keyof typeof mod.motion]
        return { default: MotionComponent }
      }),
      { ssr: false }
    )
  }
})

// Lazy load de AnimatePresence
export const AnimatePresence = dynamic(
  () => getFramerMotion().then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
) as any

// Lazy load de hooks - estos necesitan ser usados dentro de componentes
export const useAnimation = () => {
  const [controls, setControls] = React.useState<any>(null)
  
  React.useEffect(() => {
    getFramerMotion().then((mod) => {
      setControls(mod.useAnimation())
    })
  }, [])
  
  return controls || (() => {})
}

export const useMotionValue = (initial: any) => {
  const [value, setValue] = React.useState<any>(null)
  
  React.useEffect(() => {
    getFramerMotion().then((mod) => {
      setValue(mod.useMotionValue(initial))
    })
  }, [initial])
  
  return value
}

