'use client'

import React from 'react'
import { User, ShoppingCart, LogIn, Package, LayoutDashboard, Shield } from '@/lib/optimized-imports'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useAppSelector } from '@/redux/store'
import { useSelector } from 'react-redux'
import { selectTotalPrice } from '@/redux/features/cart-slice'

// Componente para el icono de Google
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox='0 0 24 24' fill='currentColor'>
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      fill='#EA4335'
    />
  </svg>
)

interface ActionButtonsProps {
  className?: string
  variant?: 'header' | 'mobile'
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ className, variant = 'header' }) => {
  // Integración con NextAuth
  const { data: session, status } = useSession()
  const isSignedIn = !!session
  const isLoaded = status !== 'loading'
  const isAdmin = session?.user?.role === 'admin'

  // Integración con carrito
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const totalPrice = useSelector(selectTotalPrice)
  const cartItemCount = cartItems.length

  const handleCartClick = () => {
    openCartModal()
  }

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Componente skeleton para estado de carga
  const AuthSkeleton = () => (
    <div className='flex items-center gap-2'>
      <div className='h-8 w-24 bg-white/20 rounded animate-pulse' />
    </div>
  )

  if (variant === 'mobile') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Carrito móvil */}
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCartClick}
          className='relative p-2 text-white dark:text-gray-200 hover:text-black dark:hover:text-gray-100 hover:bg-bright-sun dark:hover:bg-gray-800 transition-all duration-200 z-maximum'
          data-testid='cart-icon'
        >
          <Image
            src='/images/categories/carrito.png'
            alt='Carrito'
            width={20}
            height={20}
            className='w-5 h-5'
          />
          {cartItemCount > 0 && (
            <Badge
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold text-white shadow-md z-maximum'
              style={{ backgroundColor: '#007639' }}
            >
              {cartItemCount}
            </Badge>
          )}
        </Button>

        {/* Usuario móvil con integración Clerk */}
        {!isLoaded ? (
          <AuthSkeleton />
        ) : isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='p-1 hover:bg-bright-sun dark:hover:bg-gray-800 hover:text-black dark:hover:text-gray-200 transition-all duration-200 rounded-full'
              >
                <Avatar className='h-8 w-8 ring-2 ring-transparent hover:ring-bright-sun transition-all duration-200'>
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className='bg-primary-100 text-primary-700 text-sm font-medium'>
                    {session?.user?.name?.[0]?.toUpperCase() ||
                      session?.user?.email?.[0]?.toUpperCase() ||
                      'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href='/admin'>
                      <Shield className='mr-2 h-4 w-4' />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href='/dashboard'>
                  <LayoutDashboard className='mr-2 h-4 w-4' />
                  Mi Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/mis-ordenes'>
                  <Package className='mr-2 h-4 w-4' />
                  Mis Órdenes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogIn className='mr-2 h-4 w-4 rotate-180' />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleSignIn}
            className='p-2 hover:bg-bright-sun dark:hover:bg-gray-800 text-white dark:text-gray-200 hover:text-black dark:hover:text-gray-100 transition-all duration-200'
          >
            <div className='flex items-center gap-1'>
              <GoogleIcon className='w-4 h-4' />
              <User className='w-4 h-4' />
            </div>
          </Button>
        )}
      </div>
    )
  }

  // Versión desktop con integración Clerk
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Carrito desktop */}
      <Button
        variant='ghost'
        size='sm'
        onClick={handleCartClick}
        className='relative text-white dark:text-gray-200 hover:text-black dark:hover:text-gray-100 hover:bg-bright-sun dark:hover:bg-gray-800 px-3 py-2 transition-all duration-200 z-maximum'
        data-testid='cart-icon'
        aria-label={`Carrito con ${cartItemCount} productos`}
      >
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Image
              src='/images/categories/carrito.png'
              alt='Carrito'
              width={20}
              height={20}
              className='w-5 h-5'
            />
            {cartItemCount > 0 && (
              <Badge
                className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold text-white shadow-md z-maximum'
                style={{ backgroundColor: '#007639' }}
              >
                {cartItemCount}
              </Badge>
            )}
          </div>
          <span className='text-sm font-medium hidden lg:inline'>
            Carrito {cartItemCount > 0 && `(${cartItemCount})`}
          </span>
        </div>
      </Button>

      {/* Usuario desktop */}
      {!isLoaded ? (
        <AuthSkeleton />
      ) : isSignedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='flex items-center gap-2 px-3 py-2 text-white dark:text-gray-200 hover:text-black dark:hover:text-gray-100 hover:bg-bright-sun dark:hover:bg-gray-800 transition-all duration-200 rounded-full'
            >
              <Avatar className='h-8 w-8 ring-2 ring-transparent hover:ring-bright-sun transition-all duration-200'>
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className='bg-white text-blaze-orange-700 text-sm font-medium'>
                  {session?.user?.name?.[0]?.toUpperCase() ||
                    session?.user?.email?.[0]?.toUpperCase() ||
                    'U'}
                </AvatarFallback>
              </Avatar>
              <span className='text-sm font-medium'>
                {session?.user?.name?.split(' ')[0] ||
                  session?.user?.email?.split('@')[0] ||
                  'Usuario'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href='/admin'>
                    <Shield className='mr-2 h-4 w-4' />
                    Panel Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href='/dashboard'>
                <LayoutDashboard className='mr-2 h-4 w-4' />
                Mi Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/mis-ordenes'>
                <Package className='mr-2 h-4 w-4' />
                Mis Órdenes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogIn className='mr-2 h-4 w-4 rotate-180' />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className='flex items-center gap-2'>
          {/* Botón "Iniciar Sesión" */}
          <Button
            variant='ghost'
            size='sm'
            onClick={handleSignIn}
            className='text-white dark:text-gray-200 hover:text-black dark:hover:text-gray-100 hover:bg-bright-sun dark:hover:bg-gray-800 transition-all duration-200'
          >
            <div className='flex items-center gap-2'>
              <GoogleIcon className='w-4 h-4' />
              <LogIn className='w-4 h-4' />
              <span className='text-sm font-medium'>Iniciar Sesión</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  )
}

export default ActionButtons
