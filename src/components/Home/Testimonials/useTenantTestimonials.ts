import { useMemo } from 'react'
import { useTenantSafe } from '@/contexts/TenantContext'
import type { Testimonial } from '@/types/testimonial'

// Testimonios para Pinteya (Córdoba Capital)
const pinteyaTestimonials: Testimonial[] = [
  {
    review: `Excelente calidad en pinturas. El envío fue súper rápido y el producto llegó en perfectas condiciones.`,
    authorName: 'María González',
    authorImg: '/images/users/femaleolder.jpeg',
    authorRole: 'Nueva Córdoba',
    product: 'Pintura Sherwin Williams',
    verified: true,
  },
  {
    review: `Muy buena atención al cliente. Me asesoraron perfectamente para elegir los productos correctos.`,
    authorName: 'Carlos Rodríguez',
    authorImg: '/images/users/maleolder.jpeg',
    authorRole: 'General Paz',
    product: 'Kit de Pinceles Profesionales',
    verified: true,
  },
  {
    review: `Precios competitivos y productos de primera calidad. Ya es mi tienda de confianza para pinturería.`,
    authorName: 'Ana Martínez',
    authorImg: '/images/users/femalemiddle.jpeg',
    authorRole: 'Villa Allende',
    product: 'Rodillo Premium',
    verified: true,
  },
  {
    review: `Increíble variedad de productos y marcas reconocidas. Siempre encuentro lo que necesito para mis proyectos.`,
    authorName: 'Roberto Silva',
    authorImg: '/images/users/malemiddle.jpeg',
    authorRole: 'Alta Gracia',
    product: 'Esmalte Sintético Petrilac',
    verified: true,
  },
  {
    review: `El servicio de entrega es excelente y los precios muy competitivos. Recomiendo totalmente Pinteya.`,
    authorName: 'Laura Fernández',
    authorImg: '/images/users/femaleyoung.jpeg',
    authorRole: 'Barrio Jardín',
    product: 'Látex Interior Sinteplast',
    verified: true,
  },
  {
    review: `Productos de calidad profesional y asesoramiento técnico excepcional. Perfecto para mis obras.`,
    authorName: 'Diego Morales',
    authorImg: '/images/users/maleyoung.jpeg',
    authorRole: 'Alberdi',
    product: 'Impermeabilizante Plavicon',
    verified: true,
  },
]

// Testimonios para Pintemas (Alta Gracia y alrededores)
const pintemasTestimonials: Testimonial[] = [
  {
    review: `Excelente calidad en pinturas. El envío fue súper rápido y el producto llegó en perfectas condiciones.`,
    authorName: 'María González',
    authorImg: '/images/users/femaleolder.jpeg',
    authorRole: 'Alta Gracia Centro',
    product: 'Pintura Sherwin Williams',
    verified: true,
  },
  {
    review: `Muy buena atención al cliente. Me asesoraron perfectamente para elegir los productos correctos.`,
    authorName: 'Carlos Rodríguez',
    authorImg: '/images/users/maleolder.jpeg',
    authorRole: 'Villa del Prado',
    product: 'Kit de Pinceles Profesionales',
    verified: true,
  },
  {
    review: `Precios competitivos y productos de primera calidad. Ya es mi tienda de confianza para pinturería.`,
    authorName: 'Ana Martínez',
    authorImg: '/images/users/femalemiddle.jpeg',
    authorRole: 'Barrio Norte, Alta Gracia',
    product: 'Rodillo Premium',
    verified: true,
  },
  {
    review: `Increíble variedad de productos y marcas reconocidas. Siempre encuentro lo que necesito para mis proyectos.`,
    authorName: 'Roberto Silva',
    authorImg: '/images/users/malemiddle.jpeg',
    authorRole: 'Anisacate',
    product: 'Esmalte Sintético Petrilac',
    verified: true,
  },
  {
    review: `El servicio de entrega es excelente y los precios muy competitivos. Recomiendo totalmente Pintemas.`,
    authorName: 'Laura Fernández',
    authorImg: '/images/users/femaleyoung.jpeg',
    authorRole: 'Villa Allende',
    product: 'Látex Interior Sinteplast',
    verified: true,
  },
  {
    review: `Productos de calidad profesional y asesoramiento técnico excepcional. Perfecto para mis obras.`,
    authorName: 'Diego Morales',
    authorImg: '/images/users/maleyoung.jpeg',
    authorRole: 'La Bolsa',
    product: 'Impermeabilizante Plavicon',
    verified: true,
  },
]

/**
 * Hook para obtener testimonios específicos del tenant
 * Retorna testimonios con barrios apropiados para cada tenant
 */
export function useTenantTestimonials(): Testimonial[] {
  const tenant = useTenantSafe()

  return useMemo(() => {
    // Si no hay tenant, usar testimonios de pinteya por defecto
    if (!tenant || !tenant.slug) {
      return pinteyaTestimonials
    }

    // Retornar testimonios según el tenant
    switch (tenant.slug) {
      case 'pintemas':
        return pintemasTestimonials
      case 'pinteya':
      default:
        return pinteyaTestimonials
    }
  }, [tenant])
}
