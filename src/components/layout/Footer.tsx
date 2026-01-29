'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'
import { ShippingIcon } from '@/components/ui/ShippingIcon'
import { MercadoPagoLogo } from '@/components/ui/MercadoPagoLogo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Package, LayoutDashboard, LogIn, Shield } from '@/lib/optimized-imports'

/** Iconos de redes en color del tenant (primaryColor) - SVG con fill currentColor */
const SocialIcon = ({ type, className }: { type: 'google' | 'facebook' | 'instagram'; className?: string }) => {
  const c = className ?? 'w-5 h-5'
  if (type === 'google') {
    return (
      <svg className={c} viewBox='0 0 24 24' fill='currentColor' aria-hidden>
        <path d='M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z' />
      </svg>
    )
  }
  if (type === 'facebook') {
    return (
      <svg className={c} viewBox='0 0 24 24' fill='currentColor' aria-hidden>
        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
      </svg>
    )
  }
  if (type === 'instagram') {
    return (
      <svg className={c} viewBox='0 0 24 24' fill='currentColor' aria-hidden>
        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' />
      </svg>
    )
  }
  return null
}

const navLinks = [
  { label: 'Explorá la tienda', href: '/shop' },
  { label: 'Chateá con nosotros', href: '/contact' },
  { label: 'Conocé nuestra historia', href: '/about' },
  { label: 'Necesitás ayuda?', href: '/help' },
]

type FooterSocialLink = { kind: 'link'; label: string; href: string; type: 'google' | 'facebook' | 'instagram' }
type FooterSocialUser = { kind: 'user'; session: { user?: { name?: string | null; email?: string | null; image?: string | null; role?: string } } }
type FooterSocialItem = FooterSocialLink | FooterSocialUser

const Footer = () => {
  const year = new Date().getFullYear()
  const router = useRouter()
  const { data: session, status } = useSession()
  const isSignedIn = !!session && status !== 'loading'

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
  const accentColor = tenant?.accentColor ?? '#ffd549'
  const pagoAlRecibirSrc = tenant
    ? getTenantAssetPath(tenant, 'pagoalrecibir.png', `/tenants/${tenant.slug}/pagoalrecibir.png`)
    : '/images/checkout/pagoalrecibir.png'

  // Primer slot: con sesión = avatar + dropdown; sin sesión = enlace Google. Resto: Facebook, Instagram
  const primaryColor = tenant?.primaryColor ?? '#7c3aed'
  const footerSocialItems: FooterSocialItem[] = [
    isSignedIn && session
      ? { kind: 'user', session }
      : { kind: 'link', label: 'Google', href: '/api/auth/signin', type: 'google' },
    ...(tenant?.socialLinks?.facebook ? [{ kind: 'link' as const, label: 'Facebook', href: tenant.socialLinks.facebook, type: 'facebook' as const }] : []),
    ...(tenant?.socialLinks?.instagram ? [{ kind: 'link' as const, label: 'Instagram', href: tenant.socialLinks.instagram, type: 'instagram' as const }] : []),
  ]

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
              <MercadoPagoLogo color={accentColor} width={140} className="h-12 w-auto" alt="Mercado Pago" />
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
                src={pagoAlRecibirSrc}
                alt='Tu pedido en mano'
                width={105}
                height={85}
                className='w-20 h-auto drop-shadow-[0_12px_25px_rgba(0,0,0,0.25)] translate-y-1 -mb-2'
                loading="lazy"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  if (t.src !== '/images/checkout/pagoalrecibir.png') t.src = '/images/checkout/pagoalrecibir.png'
                }}
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
          {footerSocialItems.map((item) =>
            item.kind === 'user' ? (
              <DropdownMenu key="user">
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg shadow-black/20 bg-white overflow-hidden ring-2 ring-transparent hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Mi cuenta"
                  >
                    <Avatar className="h-11 w-11 rounded-full border-2 border-white/20">
                      <AvatarImage src={item.session.user?.image ?? ''} alt="" />
                      <AvatarFallback className="text-sm font-medium" style={{ backgroundColor: primaryColor, color: 'white' }}>
                        {item.session.user?.name?.[0]?.toUpperCase() ?? item.session.user?.email?.[0]?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-white/95 backdrop-blur border-white/20 text-gray-900">
                  {item.session.user?.role === 'admin' && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          router.push('/admin')
                        }}
                        className="cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Panel Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      router.push('/dashboard')
                    }}
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Mi Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      router.push('/mis-ordenes')
                    }}
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Mis Órdenes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer">
                    <LogIn className="mr-2 h-4 w-4 rotate-180" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg shadow-black/20 bg-white"
                aria-label={item.label}
                style={{ color: primaryColor }}
              >
                <SocialIcon type={item.type} className="w-5 h-5" />
              </Link>
            )
          )}
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
