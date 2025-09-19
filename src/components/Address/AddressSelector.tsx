'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Check, Building, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AddressFormAdvanced, AdvancedAddress } from './AddressFormAdvanced';

interface AddressSelectorProps {
  addresses: AdvancedAddress[];
  selectedAddressId?: string;
  onAddressSelect: (address: AdvancedAddress) => void;
  onAddressAdd: (address: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onAddressEdit: (id: string, address: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loading?: boolean;
  className?: string;
  title?: string;
  description?: string;
  allowEdit?: boolean;
  allowAdd?: boolean;
  filterType?: 'shipping' | 'billing' | 'both';
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddressAdd,
  onAddressEdit,
  loading = false,
  className = '',
  title = 'Seleccionar Dirección',
  description = 'Elige la dirección para tu pedido',
  allowEdit = true,
  allowAdd = true,
  filterType = 'shipping'
}: AddressSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AdvancedAddress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filtrar direcciones según el tipo
  const filteredAddresses = addresses.filter(address =>
    filterType === 'both' || address.type === filterType || address.type === 'both'
  );

  // Dirección seleccionada
  const selectedAddress = filteredAddresses.find(addr => addr.id === selectedAddressId);

  // Manejar selección de dirección
  const handleAddressSelect = (address: AdvancedAddress) => {
    onAddressSelect(address);
  };

  // Manejar agregar nueva dirección
  const handleAddAddress = async (addressData: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await onAddressAdd(addressData);
    setIsAddDialogOpen(false);
  };

  // Manejar editar dirección
  const handleEditAddress = async (addressData: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingAddress?.id) return;
    await onAddressEdit(editingAddress.id, addressData);
    setIsEditDialogOpen(false);
    setEditingAddress(null);
  };

  // Abrir diálogo de edición
  const openEditDialog = (address: AdvancedAddress) => {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  };

  // Cerrar diálogos
  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingAddress(null);
  };

  // Formatear dirección para mostrar
  const formatAddress = (address: AdvancedAddress) => {
    const parts = [address.street];
    if (address.apartment) parts.push(address.apartment);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    parts.push(address.postal_code);
    return parts.join(', ');
  };

  // Obtener badge de tipo
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

  // Obtener badge de validación
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
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
              <MapPin className="w-5 h-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {allowAdd && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Dirección
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAddresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes direcciones guardadas
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega tu primera dirección para continuar con tu pedido.
            </p>
            {allowAdd && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Dirección
              </Button>
            )}
          </div>
        ) : (
          <RadioGroup
            value={selectedAddressId}
            onValueChange={(value) => {
              const address = filteredAddresses.find(addr => addr.id === value);
              if (address) handleAddressSelect(address);
            }}
            className="space-y-4"
          >
            {filteredAddresses.map((address) => (
              <div key={address.id} className="relative">
                <Label
                  htmlFor={address.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem value={address.id!} id={address.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{address.name}</h4>
                        {address.is_default && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {getTypeBadge(address.type)}
                        {getValidationBadge(address.validation_status)}
                      </div>
                      {allowEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            openEditDialog(address);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{formatAddress(address)}</span>
                      </div>
                      {address.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{address.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedAddressId === address.id && (
                    <Check className="w-5 h-5 text-green-600 mt-1" />
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Dirección seleccionada - Resumen */}
        {selectedAddress && (
          <>
            <Separator className="my-6" />
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Dirección seleccionada
              </h4>
              <div className="text-sm text-green-800">
                <p className="font-medium">{selectedAddress.name}</p>
                <p>{formatAddress(selectedAddress)}</p>
                {selectedAddress.phone && <p>Tel: {selectedAddress.phone}</p>}
              </div>
            </div>
          </>
        )}

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      </CardContent>
    </Card>
  );
}









