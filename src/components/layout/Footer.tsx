'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'
import { ShippingIcon } from '@/components/ui/ShippingIcon'

// Fallback por defecto para cuando no hay tenant (sin URLs específicas de marca)
const DEFAULT_SOCIALS = [
  {
    label: 'Google',
    href: '/api/auth/signin',
    wrapperClass: 'bg-white',
    imageSrc: '/images/icons/Google.svg',
  },
  // Facebook e Instagram se agregan dinámicamente si el tenant tiene socialLinks configurados
]

const navLinks = [
  { label: 'Explorá la tienda', href: '/shop' },
  { label: 'Chateá con nosotros', href: '/contact' },
  { label: 'Conocé nuestra historia', href: '/about' },
  { label: 'Necesitás ayuda?', href: '/help' },
]

const Footer = () => {
  const year = new Date().getFullYear()
  
  // Obtener configuración del tenant (con fallback seguro)
  const tenant = useTenantSafe()
  
  // Assets del tenant desde Supabase Storage (con fallback local)
  const tenantAssets = tenant ? {
    logo: tenant.logoUrl || getTenantAssetPath(tenant, 'logo.svg', `/tenants/${tenant.slug}/logo.svg`),
    logoLocal: `/tenants/${tenant.slug}/logo.svg`, // Fallback local
  } : {
    logo: '/tenants/pinteya/logo.svg', // Usar estructura de tenant por defecto
    logoLocal: '/tenants/pinteya/logo.svg',
  }
  
  // Información del tenant
  const tenantName = tenant?.name || 'Pinteya'
  const tenantCity = tenant?.contactCity || 'Córdoba'
  const tenantProvince = tenant?.contactProvince || 'Argentina'
  
  // Redes sociales del tenant (con fallback)
  const socials = tenant?.socialLinks ? [
    {
      label: 'Google',
      href: '/api/auth/signin',
      wrapperClass: 'bg-white',
      imageSrc: '/images/icons/Google.svg',
    },
    ...(tenant.socialLinks.facebook ? [{
      label: 'Facebook',
      href: tenant.socialLinks.facebook,
      wrapperClass: 'bg-white',
      imageSrc: '/images/icons/fb.svg',
    }] : []),
    ...(tenant.socialLinks.instagram ? [{
      label: 'Instagram',
      href: tenant.socialLinks.instagram,
      wrapperClass: 'bg-white',
      imageSrc: '/images/icons/instagram.svg',
    }] : []),
  ] : DEFAULT_SOCIALS

  return (
    <footer className='text-white'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-24 space-y-8'>
        <div className='grid gap-4 md:grid-cols-3'>
          <article className='rounded-2xl bg-white/10 p-5 sm:p-6 shadow-lg shadow-black/10 backdrop-blur'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-white/70 font-semibold'>Pagás al instante</p>
                <p className='text-2xl font-black text-white'>Mercado Pago</p>
                <p className='text-sm text-white/80 mt-1'>Pago seguro con un clic.</p>
              </div>
              <Image
                src='/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg'
                alt='Mercado Pago'
                width={140}
                height={55}
                className='h-12 w-auto drop-shadow-[0_8px_25px_rgba(0,0,0,0.25)]'
                loading="lazy"
              />
            </div>
          </article>

          <article className='rounded-2xl bg-white/10 p-5 sm:p-6 shadow-lg shadow-black/10 backdrop-blur h-full'>
            <div className='flex items-end justify-between gap-4 h-full'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-white/70 font-semibold'>Pagás al recibir</p>
                <p className='text-2xl font-black text-white'>Tu pedido en mano</p>
                <p className='text-sm text-white/80 mt-1'>QR, efectivo o tarjetas sin vueltas.</p>
              </div>
              <Image
                src='/images/checkout/pagoalrecibir.png'
                alt='Pagás al recibir'
                width={105}
                height={85}
                className='w-20 h-auto drop-shadow-[0_12px_25px_rgba(0,0,0,0.25)] translate-y-1 -mb-2'
                loading="lazy"
              />
            </div>
          </article>

          <article className='rounded-2xl bg-white/10 p-5 sm:p-6 shadow-lg shadow-black/10 backdrop-blur'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.2em] text-white/70 font-semibold'>Envío gratis</p>
                <p className='text-2xl font-black text-white'>{tenantCity}</p>
                <p className='text-sm text-white/80 mt-1'>
                  {tenant?.slug === 'pintemas' ? 'Alta Gracia sin costo en el día.' : 'Sin costo extra en 24/48hs.'}
                </p>
              </div>
              {/* ShippingIcon usa URL canónica (useTenantAssets) sin ?v= para maximizar caché */}
              <ShippingIcon
                alt='Icono envío gratis'
                className='w-28 h-auto drop-shadow-[0_12px_25px_rgba(0,0,0,0.25)]'
                loading='lazy'
                style={{ width: 110, height: 'auto', display: 'block' }}
              />
            </div>
          </article>
        </div>

        <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
          {socials.map(item => (
            <Link
              key={item.label}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg shadow-black/20 ${item.wrapperClass}`}
              aria-label={item.label}
            >
              {/* ⚡ OPTIMIZACIÓN: Usar <img> para SVG en lugar de Next.js Image (más eficiente para SVG pequeños) */}
              <img 
                src={item.imageSrc} 
                alt={item.label} 
                width={20} 
                height={20}
                className="w-5 h-5"
                loading="lazy"
              />
            </Link>
          ))}
        </div>

        <nav className='flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-white/90'>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className='px-4 py-2 rounded-full border border-white/20 hover:border-white hover:text-white transition-colors duration-200'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className='border-t border-white/15 pt-6 flex flex-col gap-4 text-sm text-white/80 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <Image
              src={tenantAssets.logo}
              alt={tenantName}
              width={150}
              height={45}
              className='h-9 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]'
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                if (target.src !== tenantAssets.logoLocal) {
                  target.src = tenantAssets.logoLocal
                }
              }}
            />
            <div>
              <p className='font-semibold text-white'>{tenantCity}, {tenantProvince}</p>
              <p className='text-xs text-white/70'>SSL Seguro • Envíos rápidos • Atención humana</p>
            </div>
          </div>

          <div className='text-xs text-white/70'>© {year} {tenantName} — Desarrollado por XOR</div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
