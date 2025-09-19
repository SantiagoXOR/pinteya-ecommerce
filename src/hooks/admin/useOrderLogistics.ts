// =====================================================
// HOOK: useOrderLogistics
// Descripción: Hook para integración entre órdenes y logística
// Gestiona: Creación de envíos, tracking, estados
// =====================================================

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface CreateShipmentRequest {
  carrier_id: number;
  shipping_service: string;
  items: Array<{
    order_item_id: string;
    quantity: number;
  }>;
  pickup_address?: {
    street_name: string;
    street_number: string;
    city_name: string;
    state_name: string;
    zip_code: string;
    country?: string;
  };
  delivery_address: {
    street_name: string;
    street_number: string;
    apartment?: string;
    city_name: string;
    state_name: string;
    zip_code: string;
    country?: string;
  };
  weight_kg?: number;
  dimensions_cm?: string;
  special_instructions?: string;
  notes?: string;
  estimated_delivery_date?: string;
}

export interface Shipment {
  id: string;
  shipment_number: string;
  order_id: string;
  status: string;
  carrier_id: number;
  shipping_service: string;
  pickup_address?: any;
  delivery_address: any;
  weight_kg?: number;
  dimensions_cm?: string;
  special_instructions?: string;
  notes?: string;
  estimated_delivery_date?: string;
  created_at: string;
  updated_at: string;
  carrier?: {
    id: number;
    name: string;
    code: string;
    logo_url?: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    weight_kg?: number;
    order_item: {
      id: string;
      quantity: number;
      unit_price: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    };
  }>;
  tracking_events?: Array<{
    id: string;
    status: string;
    description: string;
    occurred_at: string;
    location?: string;
  }>;
}

export interface Carrier {
  id: number;
  name: string;
  code: string;
  logo_url?: string;
  is_active: boolean;
  services: string[];
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useOrderLogistics(orderId: string) {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // =====================================================
  // QUERIES
  // =====================================================

  // Query para obtener envíos de la orden
  const {
    data: shipmentsData,
    isLoading: shipmentsLoading,
    error: shipmentsError,
    refetch: refetchShipments
  } = useQuery({
    queryKey: ['order-shipments', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders/${orderId}/shipments`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!orderId,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Query para obtener carriers disponibles
  const {
    data: carriersData,
    isLoading: carriersLoading,
    error: carriersError
  } = useQuery({
    queryKey: ['logistics-carriers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/logistics/couriers?active_only=true');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 300000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // =====================================================
  // MUTATIONS
  // =====================================================

  // Mutation para crear envío
  const createShipmentMutation = useMutation({
    mutationFn: async (shipmentData: CreateShipmentRequest) => {
      const response = await fetch(`/api/admin/orders/${orderId}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-shipments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logistics'] });
      setSelectedItems([]);
    }
  });

  // Mutation para actualizar estado de envío
  const updateShipmentStatusMutation = useMutation({
    mutationFn: async ({ shipmentId, status, notes }: { 
      shipmentId: string; 
      status: string; 
      notes?: string;
    }) => {
      const response = await fetch(`/api/admin/logistics/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-shipments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-logistics'] });
    }
  });

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const createShipment = useCallback((shipmentData: CreateShipmentRequest) => {
    return createShipmentMutation.mutateAsync(shipmentData);
  }, [createShipmentMutation]);

  const updateShipmentStatus = useCallback((
    shipmentId: string, 
    status: string, 
    notes?: string
  ) => {
    return updateShipmentStatusMutation.mutateAsync({ shipmentId, status, notes });
  }, [updateShipmentStatusMutation]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAllItems = useCallback((itemIds: string[]) => {
    setSelectedItems(itemIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // =====================================================
  // MÉTRICAS DERIVADAS
  // =====================================================

  const derivedMetrics = {
    totalShipments: shipmentsData?.data?.length || 0,
    pendingShipments: shipmentsData?.data?.filter((s: Shipment) => s.status === 'pending').length || 0,
    inTransitShipments: shipmentsData?.data?.filter((s: Shipment) => s.status === 'in_transit').length || 0,
    deliveredShipments: shipmentsData?.data?.filter((s: Shipment) => s.status === 'delivered').length || 0,
    
    hasShipments: (shipmentsData?.data?.length || 0) > 0,
    canCreateShipment: selectedItems.length > 0,
    
    availableCarriers: carriersData?.data || [],
    selectedItemsCount: selectedItems.length
  };

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Datos
    shipments: shipmentsData?.data || [],
    carriers: carriersData?.data || [],
    
    // Estados de carga
    isLoading: shipmentsLoading || carriersLoading,
    isLoadingShipments: shipmentsLoading,
    isLoadingCarriers: carriersLoading,
    
    // Errores
    error: shipmentsError || carriersError,
    shipmentsError,
    carriersError,
    
    // Acciones
    createShipment,
    updateShipmentStatus,
    refetchShipments,
    
    // Selección de items
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    
    // Estados de mutations
    isCreatingShipment: createShipmentMutation.isPending,
    isUpdatingStatus: updateShipmentStatusMutation.isPending,
    
    // Métricas derivadas
    derivedMetrics,
    
    // Helpers
    getShipmentsByStatus: (status: string) => 
      shipmentsData?.data?.filter((s: Shipment) => s.status === status) || [],
    
    getLatestTrackingEvent: (shipment: Shipment) => 
      shipment.tracking_events?.[0] || null,
    
    canShipItems: (itemIds: string[]) => itemIds.length > 0,
    
    getShipmentProgress: (shipment: Shipment) => {
      const statusOrder = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
      const currentIndex = statusOrder.indexOf(shipment.status);
      return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
    }
  };
}

// =====================================================
// HOOK PARA TRACKING EN TIEMPO REAL
// =====================================================

export function useShipmentTracking(shipmentId: string) {
  const {
    data: trackingData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['shipment-tracking', shipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/logistics/tracking/${shipmentId}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!shipmentId,
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 10000,
    refetchOnWindowFocus: true
  });

  return {
    trackingEvents: trackingData?.data || [],
    isLoading,
    error,
    refetch,
    
    latestEvent: trackingData?.data?.[0] || null,
    isDelivered: trackingData?.data?.[0]?.status === 'delivered',
    isInTransit: ['in_transit', 'out_for_delivery'].includes(trackingData?.data?.[0]?.status),
    hasException: trackingData?.data?.[0]?.status === 'exception'
  };
}









