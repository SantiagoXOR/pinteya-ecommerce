'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar,
  ArrowLeft,
  Edit
} from 'lucide-react';
import Link from 'next/link';

/**
 * Página de Perfil Básica del Usuario
 * Implementación simplificada que solo muestra información
 * Reemplaza el dashboard complejo con vista de solo lectura
 */
export default function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/api/auth/signin?callbackUrl=/profile');
    }
  }, [isSignedIn, isLoaded, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blaze-orange-600"></div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isSignedIn || !user) {
    return null;
  }

  // Obtener inicial para fallback del avatar
  const getUserInitial = () => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Formatear fecha de creación (si está disponible)
  const getJoinDate = () => {
    // NextAuth.js no proporciona fecha de creación por defecto
    // Se podría obtener de la base de datos si es necesario
    return 'Información no disponible';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la página */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Botón de regreso */}
            <Link
              href="/"
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a la tienda
            </Link>

            {/* Título */}
            <h1 className="text-lg font-semibold text-gray-900">Mi Perfil</h1>

            {/* Espacio para balance */}
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Tarjeta de información del usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Tu información básica de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Avatar grande */}
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={user.image || undefined} 
                    alt={user.name || 'Usuario'} 
                  />
                  <AvatarFallback className="bg-blaze-orange-100 text-blaze-orange-700 text-2xl font-medium">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>

                {/* Información del usuario */}
                <div className="flex-1 space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.name || 'No especificado'}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </p>
                  </div>

                  {/* Fecha de registro */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Miembro desde</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {getJoinDate()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accede rápidamente a las funcionalidades principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ver órdenes */}
                <Link
                  href="/orders"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Mis Órdenes</h3>
                    <p className="text-sm text-gray-600">Ver historial de compras</p>
                  </div>
                </Link>

                {/* Volver a la tienda */}
                <Link
                  href="/"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <ArrowLeft className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Seguir Comprando</h3>
                    <p className="text-sm text-gray-600">Volver a la tienda</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Nota sobre edición */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Edición de Perfil</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Para editar tu información personal, puedes hacerlo a través de tu proveedor de autenticación (Google). 
                    Los cambios se reflejarán automáticamente en tu perfil.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}









