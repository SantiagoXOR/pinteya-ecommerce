'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Edit, Trash2, Star, StarOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddressForm } from './AddressForm';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export interface Address {
  id: string;
  user_id: string;
  title: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressManagerProps {
  className?: string;
}

export function AddressManager({ className }: AddressManagerProps) {
  const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserAddresses();
  const { notifyAddressChange } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manejar agregar nueva dirección
  const handleAddAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const success = await addAddress(addressData);
    if (success) {
      setIsDialogOpen(false);
      await notifyAddressChange('Dirección agregada correctamente');
    }
  };

  // Manejar editar dirección
  const handleEditAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingAddress) {return;}

    const success = await updateAddress(editingAddress.id, addressData);
    if (success) {
      setIsDialogOpen(false);
      setEditingAddress(null);
      await notifyAddressChange('Dirección actualizada correctamente');
    }
  };

  // Manejar eliminar dirección
  const handleDeleteAddress = async (addressId: string) => {
    setDeletingId(addressId);
    const success = await deleteAddress(addressId);
    if (success) {
      await notifyAddressChange('Dirección eliminada correctamente');
    }
    setDeletingId(null);
  };

  // Manejar marcar como principal
  const handleSetDefault = async (addressId: string) => {
    const success = await setDefaultAddress(addressId);
    if (success) {
      await notifyAddressChange('Dirección principal actualizada');
    }
  };

  // Abrir dialog para editar
  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  // Cerrar dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando direcciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Mis Direcciones</span>
            </CardTitle>
            <CardDescription>
              Gestiona tus direcciones de envío y facturación.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Agregar Dirección</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                </DialogTitle>
                <DialogDescription>
                  {editingAddress 
                    ? 'Modifica los datos de tu dirección.' 
                    : 'Agrega una nueva dirección de envío o facturación.'
                  }
                </DialogDescription>
              </DialogHeader>
              <AddressForm
                initialData={editingAddress}
                onSubmit={editingAddress ? handleEditAddress : handleAddAddress}
                onCancel={closeDialog}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes direcciones guardadas
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega tu primera dirección para facilitar tus compras.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Agregar Primera Dirección</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{address.title}</h4>
                      {address.is_default && (
                        <Badge variant="default" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {address.street}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.country}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(address.id)}
                        className="flex items-center space-x-1"
                      >
                        <Star className="h-4 w-4" />
                        <span className="sr-only">Marcar como principal</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(address)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={deletingId === address.id}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}









