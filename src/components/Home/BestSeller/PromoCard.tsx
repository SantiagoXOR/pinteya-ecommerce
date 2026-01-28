"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "@/lib/optimized-imports"
import { cn } from "@/lib/utils"
import { useTenantSafe } from "@/contexts/TenantContext"
import { getTenantPromoAssetWithFallback } from "@/lib/tenant/tenant-assets"

/**
 * Imagen de fondo: diseñar a 400×800px (1:2) o 800×1600px para retina.
 * Todo el texto y elementos de color deben estar en la imagen; solo el botón es UI.
 */
interface PromoCardProps {
  className?: string
}

const PromoCard: React.FC<PromoCardProps> = ({ className }) => {
  const tenant = useTenantSafe()
  const [isHovered, setIsHovered] = useState(false)

  const localFallback = tenant ? `/tenants/${tenant.slug}/promo/30-off.webp` : '/images/promo/30-off.webp'
  const { src, fallback } = getTenantPromoAssetWithFallback(tenant, '30-off.webp', localFallback)
  const [currentSrc, setCurrentSrc] = useState(src)
  useEffect(() => setCurrentSrc(src), [src])

  return (
    <Link
      href="/products"
      className={cn(
        "relative rounded-xl md:rounded-[1.5rem] shadow-lg w-full cursor-pointer overflow-hidden",
        "block aspect-[1/2] min-h-[280px] sm:min-h-[320px] max-h-[560px]",
        "transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen de fondo: todo el diseño (texto, colores) debe estar en la imagen */}
      <img
        src={currentSrc}
        alt="30% OFF en todos nuestros productos"
        className={cn(
          "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700",
          isHovered ? "scale-105" : "scale-100",
        )}
        onError={(e) => {
          const el = e.target as HTMLImageElement
          if (el.src !== fallback) el.src = fallback
        }}
      />

      {/* Solo el botón como elemento interactivo */}
      <div
        className={cn(
          "absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-[#FFC805] text-[#FF6B00]",
          "flex items-center justify-center shadow-lg",
          "transform transition-all duration-300",
          isHovered ? "bg-white scale-110" : "",
        )}
      >
        <ArrowRight className="w-6 h-6" strokeWidth={3.5} />
      </div>
    </Link>
  )
}

export default PromoCard
