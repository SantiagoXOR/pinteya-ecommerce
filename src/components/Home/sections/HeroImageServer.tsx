/**
 * HeroImageServer - Server Component para LCP
 *
 * Renderiza la imagen hero en el HTML inicial para que el LCP no espere a la
 * hidratación del cliente. Se usa dentro del contenedor de HeroSection (mismo aspect-ratio).
 */
import Image from 'next/image'

interface HeroImageServerProps {
  heroUrl: string
  alt: string
}

export function HeroImageServer({ heroUrl, alt }: HeroImageServerProps) {
  return (
    <div className="absolute inset-0 z-10">
      <Image
        src={heroUrl}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        quality={80}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
