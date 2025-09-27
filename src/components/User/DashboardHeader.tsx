'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Bell, LogOut, Home, User, Settings, Package, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = () => {
    setShowLogoutDialog(false)
    signOut()
  }

  return (
    <header className='bg-white border-b border-gray-200 lg:pl-64'>
      <div className='flex items-center justify-between h-16 px-6'>
        {/* Left side - Breadcrumb or title */}
        <div className='flex items-center space-x-4'>
          <Link
            href='/'
            className='flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            <Home className='h-4 w-4 mr-1' />
            Volver a la tienda
          </Link>
        </div>

        {/* Right side - User info and actions */}
        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <button className='p-2 text-gray-400 hover:text-gray-600 relative transition-colors rounded-md hover:bg-gray-100'>
            <Bell className='h-5 w-5' />
            {/* Notification badge */}
            <span className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></span>
          </button>

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='flex items-center space-x-3 h-auto p-2 hover:bg-gray-100 transition-colors'
              >
                {/* User avatar */}
                <div className='h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-gray-300 transition-all'>
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'Usuario'}
                      width={32}
                      height={32}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <span className='text-sm font-medium text-gray-700'>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                {/* User info - Hidden on mobile */}
                <div className='hidden md:block text-left'>
                  <p className='text-sm font-medium text-gray-900'>{user?.name || 'Usuario'}</p>
                  <p className='text-xs text-gray-500'>{user?.email}</p>
                </div>

                {/* Dropdown indicator */}
                <ChevronDown className='h-4 w-4 text-gray-400' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-64'>
              {/* User Info Header */}
              <DropdownMenuLabel className='font-normal'>
                <div className='flex items-center space-x-3'>
                  <div className='h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden'>
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'Usuario'}
                        width={40}
                        height={40}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <span className='text-lg font-medium text-gray-700'>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {user?.name || 'Usuario'}
                    </p>
                    <p className='text-xs text-gray-500 truncate'>{user?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Navigation Options */}
              <DropdownMenuItem asChild>
                <Link href='/dashboard/profile' className='flex items-center'>
                  <User className='mr-2 h-4 w-4' />
                  <span>Ver Perfil</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href='/dashboard/security' className='flex items-center'>
                  <Settings className='mr-2 h-4 w-4' />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href='/orders' className='flex items-center'>
                  <Package className='mr-2 h-4 w-4' />
                  <span>Mis Órdenes</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout with confirmation */}
              <DropdownMenuItem
                className='text-red-600 focus:text-red-600 focus:bg-red-50'
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className='mr-2 h-4 w-4' />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión
              para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
            >
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
