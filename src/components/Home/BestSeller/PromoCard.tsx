"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "@/lib/optimized-imports"
import { cn } from "@/lib/utils"

interface PromoCardProps {
  className?: string
}

const PromoCard: React.FC<PromoCardProps> = ({ className }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageSrc = "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/promo/30-off.webp"

  return (
    <Link
      href="https://www.pinteya.com/products"
      className={cn(
        "relative rounded-xl md:rounded-[1.5rem] shadow-lg flex flex-col w-full cursor-pointer overflow-hidden",
        "min-h-[280px] sm:min-h-[320px] md:h-[400px] lg:h-[440px]",
        "transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- LAYER 0: Background Image --- */}
      <div className="absolute inset-0 z-0 w-full h-full bg-gradient-to-br from-[#FF9000] to-[#FF5000]">
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Fondo Promoción"
          className={cn(
            "w-full h-full object-cover object-center transition-transform duration-700",
            isHovered ? "scale-105" : "scale-100",
            imageError && "hidden",
          )}
          onError={() => setImageError(true)}
        />
      </div>

      {/* --- LAYER 1: Content Container --- */}
      <div className="relative z-10 flex flex-col h-full w-full px-5 pt-4 pb-4">
        {/* 1. Espacio superior para empujar la caja amarilla hacia abajo (ajuste visual) */}
        <div className="h-8 sm:h-12 shrink-0"></div>

        {/* 2. La Caja Amarilla (Badge) */}
        {/* Usamos mx-auto para centrarla y medidas fijas para evitar que se estire como en tu captura */}
        <div className="mx-auto bg-[#FFC805] w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[220px] md:h-[220px] rounded-[45px] shadow-sm flex flex-col items-center justify-center shrink-0 transform rotate-[-2deg]">
          <span className="text-[#FF6B00] text-[4rem] sm:text-[5rem] md:text-[5.5rem] leading-[0.8] font-black tracking-tighter">
            30%
          </span>
          <span className="text-[#FF6B00] text-[4rem] sm:text-[5rem] md:text-[5.5rem] leading-[0.8] font-black tracking-tighter">
            OFF
          </span>
        </div>

        {/* 3. Contenedor Inferior: Texto + Botón */}
        {/* mt-auto empuja esto al fondo de la tarjeta */}
        <div className="mt-auto flex items-end justify-between w-full">
          <div className="text-white font-extrabold leading-[1.1] text-xl sm:text-2xl drop-shadow-md text-left">
            <p>En todos nuestros</p>
            <p>productos</p>
          </div>

          {/* Botón Circular */}
          <div
            className={cn(
              "w-[65px] h-[65px] rounded-full bg-[#FFC805] text-[#FF6B00]",
              "flex items-center justify-center shadow-lg",
              "transform transition-all duration-300",
              isHovered ? "bg-white scale-110" : "",
            )}
          >
            <ArrowRight className="w-8 h-8" strokeWidth={3.5} />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PromoCard
