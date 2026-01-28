"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Calculator } from "@/lib/optimized-imports"
import { cn } from "@/lib/utils"
import { useTenantSafe } from "@/contexts/TenantContext"
import { getTenantPromoAssetWithFallback } from "@/lib/tenant/tenant-assets"

/**
 * Imagen de fondo: diseñar a 400×800px (1:2) o 800×1600px para retina.
 * Todo el texto y elementos de color deben estar en la imagen; solo el botón es UI.
 */
interface CalculatorCardProps {
  className?: string
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ className }) => {
  const tenant = useTenantSafe()
  const [isHovered, setIsHovered] = useState(false)

  const localFallback = tenant ? `/tenants/${tenant.slug}/promo/calculator.webp` : '/images/promo/calculator.webp'
  const { src, fallback } = getTenantPromoAssetWithFallback(tenant, 'calculator.webp', localFallback)
  const [currentSrc, setCurrentSrc] = useState(src)
  useEffect(() => setCurrentSrc(src), [src])

  return (
    <Link
      href="/calculator"
      className={cn(
        "relative rounded-xl md:rounded-[1.5rem] shadow-[0_10px_20px_rgba(0,0,0,0.1)] w-full cursor-pointer overflow-hidden",
        "block aspect-[1/2] min-h-[280px] sm:min-h-[320px] max-h-[560px]",
        "transition-all duration-300 ease-out hover:-translate-y-[5px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen de fondo: todo el diseño (texto, colores) debe estar en la imagen */}
      <img
        src={currentSrc}
        alt="Calculá tu pintura - Presupuesto al instante"
        className="absolute inset-0 w-full h-full object-cover object-center"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="eager"
        onError={(e) => {
          const el = e.target as HTMLImageElement
          if (el.src !== fallback) el.src = fallback
        }}
      />

      {/* Solo el botón como elemento interactivo */}
      <div
        className={cn(
          "absolute bottom-6 right-6 z-10 w-11 h-11 rounded-full bg-[#FF6B00] text-white",
          "flex items-center justify-center shadow-lg",
          "transform transition-all duration-300",
          isHovered ? "scale-110" : "",
        )}
      >
        <Calculator className="w-6 h-6" strokeWidth={2.5} />
      </div>
    </Link>
  )
}

export default CalculatorCard
