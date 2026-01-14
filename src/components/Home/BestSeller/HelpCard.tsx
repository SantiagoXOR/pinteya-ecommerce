"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { MessageCircle } from "@/lib/optimized-imports"
import { cn } from "@/lib/utils"

interface HelpCardProps {
  categoryName?: string | null
  className?: string
}

const HelpCard: React.FC<HelpCardProps> = ({ categoryName, className }) => {
  const [isHovered, setIsHovered] = useState(false)
  const whatsappNumber = "5493513411796"

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const categoryText = categoryName ? `la categoría ${categoryName}` : "el catálogo"
    const message = `Hola, estoy buscando productos en ${categoryText} y necesito ayuda`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className={cn(
        "relative rounded-xl md:rounded-[1.5rem] bg-[#E86C1A] shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col w-full cursor-pointer",
        "overflow-hidden",
        "min-h-[280px] sm:min-h-[320px] md:h-[400px] lg:h-[440px]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[5px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]",
        className,
      )}
      onClick={handleWhatsAppClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Layer - Sección superior (60%) (z-0) */}
      <div className="relative w-full h-[60%] overflow-hidden">
        <Image
          src="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/promo/help.webp"
          alt="Asesoramiento por WhatsApp"
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          quality={90}
        />
      </div>

      <div className="absolute top-[126px] left-5 right-20 z-20 bg-[#00703C] text-white px-[11px] py-[5px] rounded-[20px] font-bold text-sm leading-[21px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] text-left w-[147px] h-[57px]">
        ¿No encontraste lo que buscabas?
      </div>

      {/* Content Layer - Sección inferior (40%) (z-10) */}
      <div className="relative h-[40%] bg-[#E86C1A] flex flex-col pt-16 px-5 pb-6">
        <div className="absolute top-[21px] left-3 w-[138px] text-[#FFC805] text-[17px] font-extrabold mb-1">Te ayudamos</div>
        <div className="absolute top-[46px] left-3 w-[103px] text-white text-[13px] font-bold">por WhatsApp</div>

        {/* Ícono WhatsApp en círculo blanco - Icono verde - Tamaño fijo */}
        <div className="absolute left-[122px] top-[50px] w-[43px] h-[43px] rounded-full bg-white flex items-center justify-center z-10 shadow-lg">
          <MessageCircle className="w-[36px] h-[29px] text-[#25D366]" strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}

export default HelpCard
