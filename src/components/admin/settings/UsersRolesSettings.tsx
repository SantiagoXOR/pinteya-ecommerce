'use client'

import { AdminCard } from '../ui/AdminCard'
import Link from 'next/link'
import { Users, Shield, ExternalLink, Info } from '@/lib/optimized-imports'
import { SystemSettings } from '@/hooks/admin/useSettings'

interface UsersRolesSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function UsersRolesSettings({ settings, onChange }: UsersRolesSettingsProps) {
  return (
    <div className='space-y-6'>
      <AdminCard 
        title='Usuarios y Roles' 
        description='Gestiona usuarios administradores y asigna roles de acceso'
      >
        <div className='space-y-6'>
          {/* Información sobre autenticación */}
          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-start space-x-3'>
              <Info className='w-5 h-5 text-blue-600 mt-0.5' />
              <div className='flex-1'>
                <h4 className='font-medium text-blue-900 mb-1'>Autenticación con Google OAuth</h4>
                <p className='text-sm text-blue-800'>
                  Los usuarios se registran automáticamente usando su cuenta de Google. 
                  Una vez registrados, puedes asignarles roles de administrador desde el panel de Usuarios.
                </p>
              </div>
            </div>
          </div>

          {/* Sistema de Roles */}
          <div className='p-6 bg-gray-50 border border-gray-200 rounded-lg'>
            <div className='flex items-center space-x-3 mb-4'>
              <Shield className='w-5 h-5 text-gray-700' />
              <h3 className='text-lg font-semibold text-gray-900'>Sistema de Roles</h3>
            </div>
            <p className='text-sm text-gray-600 mb-4'>
              El sistema utiliza un sistema de roles basado en permisos. Los roles se gestionan mediante 
              las tablas <code className='px-2 py-1 bg-white rounded text-xs font-mono'>user_roles</code> y{' '}
              <code className='px-2 py-1 bg-white rounded text-xs font-mono'>user_profiles</code> en la base de datos.
            </p>
            <div className='space-y-2 text-sm text-gray-700'>
              <p><strong>Rol Admin:</strong> Acceso completo al panel de administración</p>
              <p><strong>Rol Usuario:</strong> Acceso limitado, solo puede realizar compras</p>
            </div>
          </div>

          {/* Link al panel de usuarios */}
          <div className='p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Users className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Gestionar Usuarios</h3>
                  <p className='text-sm text-gray-600'>
                    Ve al panel de usuarios para asignar roles, crear nuevos administradores y gestionar permisos
                  </p>
                </div>
              </div>
              <Link
                href='/admin/users'
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap'
              >
                <span>Ir al Panel</span>
                <ExternalLink className='w-4 h-4' />
              </Link>
            </div>
          </div>

          {/* Instrucciones */}
          <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <h4 className='font-medium text-gray-900 mb-2'>Cómo asignar rol de administrador:</h4>
            <ol className='list-decimal list-inside space-y-1 text-sm text-gray-600'>
              <li>Ve al panel de Usuarios usando el botón arriba</li>
              <li>Busca el usuario que quieres hacer administrador</li>
              <li>Asigna el rol "admin" desde la interfaz de gestión</li>
              <li>El usuario ahora tendrá acceso completo al panel administrativo</li>
            </ol>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}

