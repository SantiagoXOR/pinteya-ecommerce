// =====================================================
// HOOK: SHIPMENTS MANAGEMENT ENTERPRISE
// Descripción: Hook para gestión completa de envíos
// Basado en: Patrones TanStack Query + React Hook Form
// =====================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Shipment,
  CreateShipmentRequest,
  UpdateShipmentRequest,
  GetShipmentsRequest,
  PaginatedResponse,
  UseShipmentsReturn,
  ShipmentStatus 
} from '@/types/logistics';

// =====================================================
// CONFIGURACIÓN DE QUERIES
// =====================================================

const SHIPMENTS_QUERY_KEY = ['admin', 'logistics', 'shipments'];
const STALE_TIME = 30000; // 30 segundos

// =====================================================
// FUNCIONES DE API
// =====================================================

async function fetchShipments(params: GetShipmentsRequest): Promise<PaginatedResponse<Shipment>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/admin/logistics/shipments?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function createShipment(data: CreateShipmentRequest): Promise<Shipment> {
  const response = await fetch('/api/admin/logistics/shipments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
}

async function updateShipment(id: number, data: UpdateShipmentRequest): Promise<Shipment> {
  const response = await fetch(`/api/admin/logistics/shipments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
}

async function deleteShipment(id: number): Promise<void> {
  const response = await fetch(`/api/admin/logistics/shipments/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
}

// =====================================================
// HOOK PRINCIPAL: useShipments
// =====================================================

export function useShipments(params: GetShipmentsRequest = {}): UseShipmentsReturn {
  const queryClient = useQueryClient();
  
  const queryKey = [...SHIPMENTS_QUERY_KEY, params];
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchShipments(params),
    staleTime: STALE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch
  };
}

// =====================================================
// HOOK: useCreateShipment
// =====================================================

export function useCreateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createShipment,
    onSuccess: (newShipment) => {
      // Invalidar cache de shipments
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      
      // Invalidar dashboard de logística
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] });
      
      toast.success('Envío creado exitosamente', {
        description: `Número de envío: ${newShipment.shipment_number}`
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear envío', {
        description: error.message
      });
    }
  });
}

// =====================================================
// HOOK: useUpdateShipment
// =====================================================

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShipmentRequest }) => 
      updateShipment(id, data),
    onSuccess: (updatedShipment) => {
      // Actualizar cache específico del shipment
      queryClient.setQueryData(
        ['admin', 'logistics', 'shipment', updatedShipment.id],
        updatedShipment
      );
      
      // Invalidar listas de shipments
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      
      // Invalidar dashboard si cambió el estado
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] });
      
      toast.success('Envío actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar envío', {
        description: error.message
      });
    }
  });
}

// =====================================================
// HOOK: useDeleteShipment
// =====================================================

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteShipment,
    onSuccess: (_, deletedId) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: ['admin', 'logistics', 'shipment', deletedId] });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] });
      
      toast.success('Envío eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar envío', {
        description: error.message
      });
    }
  });
}

// =====================================================
// HOOK: useShipmentFilters
// =====================================================

export function useShipmentFilters() {
  const [filters, setFilters] = useState<GetShipmentsRequest>({
    page: 1,
    limit: 20,
    order_by: 'created_at',
    order_direction: 'desc'
  });
  
  const updateFilter = useCallback((key: keyof GetShipmentsRequest, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      order_by: 'created_at',
      order_direction: 'desc'
    });
  }, []);
  
  const setPage = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);
  
  const setStatus = useCallback((status: ShipmentStatus | undefined) => {
    updateFilter('status', status);
  }, [updateFilter]);
  
  const setSearch = useCallback((search: string) => {
    updateFilter('search', search || undefined);
  }, [updateFilter]);
  
  const setDateRange = useCallback((dateFrom?: string, dateTo?: string) => {
    setFilters(prev => ({
      ...prev,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1
    }));
  }, []);
  
  return {
    filters,
    updateFilter,
    resetFilters,
    setPage,
    setStatus,
    setSearch,
    setDateRange
  };
}

// =====================================================
// HOOK: useShipmentStats
// =====================================================

export function useShipmentStats(shipments?: Shipment[]) {
  return {
    total: shipments?.length || 0,
    byStatus: shipments?.reduce((acc, shipment) => {
      acc[shipment.status] = (acc[shipment.status] || 0) + 1;
      return acc;
    }, {} as Record<ShipmentStatus, number>) || {},
    totalCost: shipments?.reduce((acc, shipment) => acc + shipment.total_cost, 0) || 0,
    averageCost: shipments?.length 
      ? (shipments.reduce((acc, shipment) => acc + shipment.total_cost, 0) / shipments.length)
      : 0
  };
}

// =====================================================
// HOOK: useBulkShipmentOperations
// =====================================================

export function useBulkShipmentOperations() {
  const queryClient = useQueryClient();
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ shipmentIds, status }: { shipmentIds: number[]; status: ShipmentStatus }) => {
      const promises = shipmentIds.map(id => updateShipment(id, { status }));
      return Promise.all(promises);
    },
    onSuccess: (_, { shipmentIds, status }) => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] });
      
      toast.success(`${shipmentIds.length} envíos actualizados a ${status}`);
      setSelectedShipments([]);
    },
    onError: (error: Error) => {
      toast.error('Error en operación masiva', {
        description: error.message
      });
    }
  });
  
  const bulkDelete = useMutation({
    mutationFn: async (shipmentIds: number[]) => {
      const promises = shipmentIds.map(id => deleteShipment(id));
      return Promise.all(promises);
    },
    onSuccess: (_, shipmentIds) => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logistics', 'dashboard'] });
      
      toast.success(`${shipmentIds.length} envíos eliminados`);
      setSelectedShipments([]);
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar envíos', {
        description: error.message
      });
    }
  });
  
  const toggleSelection = useCallback((shipmentId: number) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId)
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  }, []);
  
  const selectAll = useCallback((shipmentIds: number[]) => {
    setSelectedShipments(shipmentIds);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedShipments([]);
  }, []);
  
  return {
    selectedShipments,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkDelete,
    isLoading: bulkUpdateStatus.isPending || bulkDelete.isPending
  };
}
