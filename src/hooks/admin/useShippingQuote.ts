// =====================================================
// HOOK: SHIPPING QUOTE ENTERPRISE
// Descripción: Hook para cotización de envíos con múltiples couriers
// Basado en: TanStack Query + React Hook Form
// =====================================================

'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  ShippingQuoteRequest,
  ShippingQuoteResponse,
  ShippingQuote,
  Courier 
} from '@/types/logistics';

// =====================================================
// FUNCIONES DE API
// =====================================================

async function getShippingQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
  const response = await fetch('/api/admin/logistics/couriers/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
}

async function getCouriers(): Promise<Courier[]> {
  const response = await fetch('/api/admin/logistics/couriers?active_only=true', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
}

// =====================================================
// HOOK PRINCIPAL: useShippingQuote
// =====================================================

export function useShippingQuote() {
  const [lastQuoteRequest, setLastQuoteRequest] = useState<ShippingQuoteRequest | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null);
  
  const quoteMutation = useMutation({
    mutationFn: getShippingQuote,
    onSuccess: (data) => {
      toast.success(`${data.quotes.length} cotizaciones obtenidas`, {
        description: `Mejor precio: $${data.cheapest_quote?.cost || 0}`
      });
    },
    onError: (error: Error) => {
      toast.error('Error al obtener cotizaciones', {
        description: error.message
      });
    }
  });
  
  const getQuote = useCallback(async (request: ShippingQuoteRequest) => {
    setLastQuoteRequest(request);
    return quoteMutation.mutateAsync(request);
  }, [quoteMutation]);
  
  const selectQuote = useCallback((quote: ShippingQuote) => {
    setSelectedQuote(quote);
    toast.success('Cotización seleccionada', {
      description: `${quote.courier_name} - $${quote.cost}`
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedQuote(null);
    setLastQuoteRequest(null);
  }, []);
  
  return {
    getQuote,
    selectQuote,
    clearSelection,
    selectedQuote,
    lastQuoteRequest,
    quotes: quoteMutation.data?.quotes || [],
    cheapestQuote: quoteMutation.data?.cheapest_quote,
    fastestQuote: quoteMutation.data?.fastest_quote,
    recommendedQuote: quoteMutation.data?.recommended_quote,
    isLoading: quoteMutation.isPending,
    error: quoteMutation.error,
    isSuccess: quoteMutation.isSuccess
  };
}

// =====================================================
// HOOK: useCouriers
// =====================================================

export function useCouriers(options?: { activeOnly?: boolean; includeStats?: boolean }) {
  const queryKey = ['admin', 'logistics', 'couriers', options];
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.activeOnly) params.append('active_only', 'true');
      if (options?.includeStats) params.append('include_stats', 'true');
      
      return fetch(`/api/admin/logistics/couriers?${params}`)
        .then(res => res.json())
        .then(result => result.data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3
  });
  
  return {
    data: data || [],
    isLoading,
    error,
    refetch
  };
}

// =====================================================
// HOOK: useQuoteComparison
// =====================================================

export function useQuoteComparison(quotes: ShippingQuote[]) {
  const comparison = {
    cheapest: quotes.reduce((prev, current) => 
      prev.cost < current.cost ? prev : current
    ),
    fastest: quotes.reduce((prev, current) => 
      prev.estimated_delivery_days < current.estimated_delivery_days ? prev : current
    ),
    mostReliable: quotes.reduce((prev, current) => {
      // Lógica simple: courier con mejor balance precio/tiempo
      const prevScore = (1 / prev.cost) + (1 / prev.estimated_delivery_days);
      const currentScore = (1 / current.cost) + (1 / current.estimated_delivery_days);
      return currentScore > prevScore ? current : prev;
    }),
    averageCost: quotes.reduce((acc, quote) => acc + quote.cost, 0) / quotes.length,
    averageDeliveryTime: quotes.reduce((acc, quote) => acc + quote.estimated_delivery_days, 0) / quotes.length,
    priceRange: {
      min: Math.min(...quotes.map(q => q.cost)),
      max: Math.max(...quotes.map(q => q.cost))
    },
    deliveryRange: {
      min: Math.min(...quotes.map(q => q.estimated_delivery_days)),
      max: Math.max(...quotes.map(q => q.estimated_delivery_days))
    }
  };
  
  return comparison;
}

// =====================================================
// HOOK: useQuoteCalculator
// =====================================================

export function useQuoteCalculator() {
  const [calculatorData, setCalculatorData] = useState({
    weight: 0,
    dimensions: '',
    origin: '',
    destination: '',
    serviceType: 'standard'
  });
  
  const updateCalculatorData = useCallback((updates: Partial<typeof calculatorData>) => {
    setCalculatorData(prev => ({ ...prev, ...updates }));
  }, []);
  
  const calculateEstimate = useCallback((courier: Courier) => {
    if (!calculatorData.weight || !courier) return null;
    
    // Cálculo básico basado en la configuración del courier
    let cost = courier.base_cost + (courier.cost_per_kg * calculatorData.weight);
    
    // Ajustes por tipo de servicio
    const serviceMultipliers = {
      standard: 1,
      express: 1.5,
      next_day: 2,
      same_day: 3
    };
    
    cost *= serviceMultipliers[calculatorData.serviceType as keyof typeof serviceMultipliers] || 1;
    
    // Estimación de días de entrega
    const baseDays = {
      standard: 5,
      express: 3,
      next_day: 1,
      same_day: 1
    };
    
    const estimatedDays = baseDays[calculatorData.serviceType as keyof typeof baseDays] || 5;
    
    return {
      cost: Math.round(cost * 100) / 100,
      estimatedDays,
      courier: courier.name
    };
  }, [calculatorData]);
  
  return {
    calculatorData,
    updateCalculatorData,
    calculateEstimate
  };
}

// =====================================================
// HOOK: useQuoteHistory
// =====================================================

export function useQuoteHistory() {
  const [quoteHistory, setQuoteHistory] = useState<Array<{
    id: string;
    request: ShippingQuoteRequest;
    response: ShippingQuoteResponse;
    selectedQuote?: ShippingQuote;
    timestamp: string;
  }>>([]);
  
  const addToHistory = useCallback((
    request: ShippingQuoteRequest, 
    response: ShippingQuoteResponse,
    selectedQuote?: ShippingQuote
  ) => {
    const historyItem = {
      id: Date.now().toString(),
      request,
      response,
      selectedQuote,
      timestamp: new Date().toISOString()
    };
    
    setQuoteHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Mantener últimas 10
  }, []);
  
  const clearHistory = useCallback(() => {
    setQuoteHistory([]);
  }, []);
  
  const getHistoryItem = useCallback((id: string) => {
    return quoteHistory.find(item => item.id === id);
  }, [quoteHistory]);
  
  return {
    quoteHistory,
    addToHistory,
    clearHistory,
    getHistoryItem
  };
}

// =====================================================
// TIPOS EXTENDIDOS
// =====================================================

export interface UseShippingQuoteReturn {
  getQuote: (request: ShippingQuoteRequest) => Promise<ShippingQuoteResponse>;
  selectQuote: (quote: ShippingQuote) => void;
  clearSelection: () => void;
  selectedQuote: ShippingQuote | null;
  lastQuoteRequest: ShippingQuoteRequest | null;
  quotes: ShippingQuote[];
  cheapestQuote?: ShippingQuote;
  fastestQuote?: ShippingQuote;
  recommendedQuote?: ShippingQuote;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
}

export interface UseCouriersReturn {
  data: Courier[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
