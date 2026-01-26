"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Calculator } from "@/lib/optimized-imports"
import { cn } from "@/lib/utils"
import { useTenantSafe } from "@/contexts/TenantContext"
import { getTenantPromoAssetWithFallback } from "@/lib/tenant/tenant-assets"

interface CalculatorCardProps {
  className?: string
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ className }) => {
  const tenant = useTenantSafe()
  const [isHovered, setIsHovered] = useState(false)

  // ⚡ MULTITENANT: Imagen desde Supabase Storage con fallback local
  const localFallback = tenant ? `/tenants/${tenant.slug}/promo/calculator.webp` : '/images/promo/calculator.webp'
  const { src, fallback } = getTenantPromoAssetWithFallback(tenant, 'calculator.webp', localFallback)
  const [currentSrc, setCurrentSrc] = useState(src)
  useEffect(() => setCurrentSrc(src), [src])

  return (
    <Link
      href="/calculator"
      className={cn(
        "relative rounded-xl md:rounded-[1.5rem] bg-[#FFC805] shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col w-full cursor-pointer",
        "overflow-hidden",
        "min-h-[280px] sm:min-h-[320px] md:h-[400px] lg:h-[440px]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[5px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Layer - Sección superior (60%) (z-0) */}
      <div className="relative w-full h-[60%] bg-[#0044cc] overflow-hidden">
        <img
          src={currentSrc}
          alt="Calculadora de pintura"
          className="absolute inset-0 w-full h-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="eager"
          onError={(e) => {
            const el = e.target as HTMLImageElement
            if (el.src !== fallback) el.src = fallback
          }}
        />
      </div>

      {/* Badge blanco superpuesto - Por encima del cuadro de color (z-20) - 2 líneas - Tamaño fijo */}
      <div className="absolute top-[88px] left-5 right-5 z-20 bg-white text-[#006400] px-5 py-3 rounded-[20px] font-bold text-sm text-left shadow-[0_4px_6px_rgba(0,0,0,0.1)] leading-tight">
        Obtené un presupuesto
        <br />
        detallado al instante.
      </div>

      {/* Content Layer - Sección inferior (40%) (z-10) */}
      <div className="relative h-[40%] bg-[#FFC805] flex flex-col pt-16 px-5 pb-6">
        <div className="absolute top-[37px] left-5 text-left pr-20">
          <div className="text-[#FF6B00] text-xl leading-none font-black mb-1">Calculá</div>
          <div className="text-[#FF6B00] text-base leading-tight font-extrabold">tu pintura</div>
        </div>

        {/* Ícono calculadora en círculo naranja - Tamaño fijo */}
        <div className="absolute bottom-6 right-6 w-[43px] h-[43px] rounded-full bg-[#FF6B00] text-white flex items-center justify-center z-10 shadow-lg">
          <Calculator className="w-[30px] h-[27px]" strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  )
}

export default CalculatorCard
