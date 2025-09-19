'use client';

import React, { useState } from 'react';
import { User, Settings, MapPin, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from './AvatarUpload';
import { ProfileEditor } from './ProfileEditor';
import { AddressManager } from './AddressManager';
import { useUserProfile } from '@/hooks/useUserProfile';

export function ProfilePage() {
  const { profile, loading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('profile');

  const handleAvatarChange = (avatarUrl: string | null) => {
    // El hook useUserProfile se actualizará automáticamente
    console.log('Avatar actualizado:', avatarUrl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Mi Perfil</span>
          </CardTitle>
          <CardDescription>
            Gestiona tu información personal, avatar y direcciones de envío.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Información Personal</span>
          </TabsTrigger>
          <TabsTrigger value="avatar" className="flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Direcciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Información Personal */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileEditor />
        </TabsContent>

        {/* Gestión de Avatar */}
        <TabsContent value="avatar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Foto de Perfil</span>
              </CardTitle>
              <CardDescription>
                Sube o actualiza tu foto de perfil. Se recomienda una imagen cuadrada de al menos 200x200 píxeles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                userName={profile?.name || 'Usuario'}
                onAvatarChange={handleAvatarChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Direcciones */}
        <TabsContent value="addresses" className="space-y-6">
          <AddressManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}









