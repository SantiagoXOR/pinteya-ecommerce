'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Star, Building, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AddressFormAdvanced, AdvancedAddress } from '@/components/Address/AddressFormAdvanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

export default function AddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<AdvancedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AdvancedAddress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
    }
  }, [session]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      const data = await response.json();

      if (response.ok && data.success) {
        setAddresses(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar direcciones',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (addressData: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAddresses(prev => [...prev, data.data]);
        setIsAddDialogOpen(false);
        toast({
          title: 'Éxito',
          description: 'Dirección agregada correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al agregar dirección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const handleEditAddress = async (addressData: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingAddress?.id) return;

    try {
      console.log('🔄 Actualizando dirección:', { id: editingAddress.id, ...addressData });

      const response = await fetch(`/api/user/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();
      console.log('📝 Respuesta de actualización:', data);

      if (response.ok && data.success) {
        setAddresses(prev =>
          prev.map(addr => addr.id === editingAddress.id ? data.data : addr)
        );
        setIsEditDialogOpen(false);
        setEditingAddress(null);
        toast({
          title: 'Éxito',
          description: 'Dirección actualizada correctamente',
        });

        // Recargar direcciones para asegurar sincronización
        await fetchAddresses();
      } else {
        console.error('❌ Error en respuesta:', data);
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar dirección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error updating address:', error);
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        toast({
          title: 'Éxito',
          description: 'Dirección eliminada correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar dirección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAddresses(prev =>
          prev.map(addr => ({
            ...addr,
            is_default: addr.id === addressId
          }))
        );
        toast({
          title: 'Éxito',
          description: 'Dirección predeterminada actualizada',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar dirección predeterminada',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (address: AdvancedAddress) => {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingAddress(null);
  };

  const formatAddress = (address: AdvancedAddress) => {
    const parts = [address.street];
    if (address.apartment) parts.push(address.apartment);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    parts.push(address.postal_code);
    return parts.join(', ');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'shipping':
        return <Badge variant="outline">Envío</Badge>;
      case 'billing':
        return <Badge variant="outline">Facturación</Badge>;
      case 'both':
        return <Badge variant="default">Ambos</Badge>;
      default:
        return null;
    }
  };

  const getValidationBadge = (status?: string) => {
    switch (status) {
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validada</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Inválida</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso requerido
            </h1>
            <p className="text-gray-600">
              Debes iniciar sesión para ver tus direcciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando direcciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mis Direcciones
              </h1>
              <p className="text-gray-600">
                Gestiona tus direcciones de envío y facturación
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Dirección
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Dirección</DialogTitle>
                  <DialogDescription>
                    Completa los datos de tu nueva dirección.
                  </DialogDescription>
                </DialogHeader>
                <AddressFormAdvanced
                  mode="create"
                  onSubmit={handleAddAddress}
                  onCancel={closeDialogs}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes direcciones guardadas
              </h3>
              <p className="text-gray-600 mb-6">
                Agrega tu primera dirección para facilitar tus compras futuras.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Dirección
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address) => (
              <Card key={address.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="flex items-center space-x-2">
                        <Building className="w-5 h-5" />
                        <span>{address.name}</span>
                        {address.is_default && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(address.type)}
                        {getValidationBadge(address.validation_status)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La dirección será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAddress(address.id!)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{formatAddress(address)}</span>
                    </div>
                    {address.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{address.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-500">
                        {address.is_default ? 'Dirección predeterminada' : 'Dirección secundaria'}
                      </div>
                      {!address.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id!)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Hacer predeterminada
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
            <DialogHeader>
              <DialogTitle>Editar Dirección</DialogTitle>
              <DialogDescription>
                Modifica los datos de tu dirección.
              </DialogDescription>
            </DialogHeader>
            {editingAddress && (
              <AddressFormAdvanced
                mode="edit"
                initialData={editingAddress}
                onSubmit={handleEditAddress}
                onCancel={closeDialogs}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}









