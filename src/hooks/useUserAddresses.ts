// ===================================
// PINTEYA E-COMMERCE - HOOK PARA DIRECCIONES DE USUARIO
// ===================================

import { useState, useEffect } from 'react';

export interface UserAddress {
  id: number;
  user_id: string;
  name: string;
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  name: string;
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}

export interface UseUserAddressesReturn {
  addresses: UserAddress[];
  loading: boolean;
  error: string | null;
  createAddress: (data: CreateAddressData) => Promise<boolean>;
  updateAddress: (id: number, data: Partial<CreateAddressData>) => Promise<boolean>;
  deleteAddress: (id: number) => Promise<boolean>;
  refreshAddresses: () => void;
}

export function useUserAddresses(): UseUserAddressesReturn {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener las direcciones
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/addresses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener direcciones');
      }

      if (data.success) {
        setAddresses(data.addresses);
      } else {
        throw new Error('Error al obtener direcciones');
      }
    } catch (err) {
      console.error('Error en useUserAddresses:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una nueva dirección
  const createAddress = async (addressData: CreateAddressData): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear dirección');
      }

      if (data.success) {
        // Refrescar la lista de direcciones
        await fetchAddresses();
        return true;
      } else {
        throw new Error('Error al crear dirección');
      }
    } catch (err) {
      console.error('Error al crear dirección:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  };

  // Función para actualizar una dirección
  const updateAddress = async (id: number, updateData: Partial<CreateAddressData>): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar dirección');
      }

      if (data.success) {
        // Refrescar la lista de direcciones
        await fetchAddresses();
        return true;
      } else {
        throw new Error('Error al actualizar dirección');
      }
    } catch (err) {
      console.error('Error al actualizar dirección:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  };

  // Función para eliminar una dirección
  const deleteAddress = async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar dirección');
      }

      if (data.success) {
        // Refrescar la lista de direcciones
        await fetchAddresses();
        return true;
      } else {
        throw new Error('Error al eliminar dirección');
      }
    } catch (err) {
      console.error('Error al eliminar dirección:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  };

  // Función para refrescar las direcciones
  const refreshAddresses = () => {
    fetchAddresses();
  };

  // Cargar direcciones al montar el componente
  useEffect(() => {
    fetchAddresses();
  }, []);

  return {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    refreshAddresses,
  };
}
