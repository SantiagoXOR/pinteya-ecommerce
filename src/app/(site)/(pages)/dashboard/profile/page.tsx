'use client';


// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Camera, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export default function UserProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  const handleSave = () => {
    // TODO: Implementar guardado
    console.log('Guardando perfil:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal, avatar y direcciones de envío.</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Avatar
          </CardTitle>
          <CardDescription>
            Tu imagen de perfil se mostrará en toda la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Usuario'}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm">
                Cambiar Avatar
              </Button>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG o GIF. Máximo 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Actualiza tu información personal. Los cambios se guardarán automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="+54 11 2345-6789"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Editar Información
              </Button>
            ) : (
              <>
                <Button onClick={handleSave}>
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









