'use client';

import { UseFormReturn, FieldErrors } from 'react-hook-form';
import { AdminCard } from '../ui/AdminCard';
import { Package, AlertTriangle, TrendingDown, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/core/utils';

interface ProductInventoryProps {
  form: UseFormReturn<any>;
  errors: FieldErrors<any>;
  className?: string;
}

export function ProductInventory({ form, errors, className }: ProductInventoryProps) {
  const { register, watch, setValue } = form;
  const watchedData = watch();

  const stock = watchedData.stock || 0;
  const lowStockThreshold = watchedData.low_stock_threshold || 0;
  const trackInventory = watchedData.track_inventory;
  const allowBackorder = watchedData.allow_backorder;

  // Stock status
  const getStockStatus = () => {
    if (!trackInventory) {return { status: 'untracked', label: 'No rastreado', color: 'gray' };}
    if (stock === 0) {return { status: 'out', label: 'Sin stock', color: 'red' };}
    if (stock <= lowStockThreshold) {return { status: 'low', label: 'Stock bajo', color: 'yellow' };}
    return { status: 'good', label: 'Stock disponible', color: 'green' };
  };

  const stockStatus = getStockStatus();

  // Quick stock actions
  const quickStockActions = [
    { label: '+10', value: 10 },
    { label: '+50', value: 50 },
    { label: '+100', value: 100 },
    { label: 'Reset', value: 0, isReset: true },
  ];

  const adjustStock = (adjustment: number, isReset = false) => {
    const currentStock = watchedData.stock || 0;
    const newStock = isReset ? adjustment : currentStock + adjustment;
    setValue('stock', Math.max(0, newStock));
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inventory Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Tracking */}
          <AdminCard title="Configuración de Inventario" className="p-6">
            <div className="space-y-6">
              {/* Track Inventory Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Rastrear Inventario
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Controla automáticamente el stock cuando se realizan ventas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('track_inventory')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blaze-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blaze-orange-600"></div>
                </label>
              </div>

              {/* Stock Quantity */}
              {trackInventory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad en Stock *
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register('stock', { valueAsNumber: true })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    {errors.stock && (
                      <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Umbral de Stock Bajo
                    </label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register('low_stock_threshold', { valueAsNumber: true })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                    {errors.low_stock_threshold && (
                      <p className="text-red-600 text-sm mt-1">{errors.low_stock_threshold.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Recibir alertas cuando el stock esté por debajo de este número
                    </p>
                  </div>
                </div>
              )}

              {/* Allow Backorders */}
              {trackInventory && (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Permitir Pedidos Pendientes
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Permite a los clientes comprar cuando no hay stock disponible
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('allow_backorder')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blaze-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blaze-orange-600"></div>
                  </label>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Quick Stock Actions */}
          {trackInventory && (
            <AdminCard title="Ajustes Rápidos de Stock" className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ajusta rápidamente la cantidad en stock:
                </p>
                <div className="flex flex-wrap gap-3">
                  {quickStockActions.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => adjustStock(action.value, action.isReset)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        action.isReset
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-blaze-orange-100 text-blaze-orange-700 hover:bg-blaze-orange-200"
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <span className="text-sm text-gray-600">Stock actual:</span>
                  <span className="text-lg font-bold text-gray-900">{stock} unidades</span>
                </div>
              </div>
            </AdminCard>
          )}
        </div>

        {/* Inventory Status & Analytics */}
        <div className="space-y-6">
          {/* Stock Status */}
          <AdminCard title="Estado del Stock" className="p-6">
            <div className="space-y-4">
              {/* Current Status */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                stockStatus.color === 'green' && "bg-green-50 border-green-200",
                stockStatus.color === 'yellow' && "bg-yellow-50 border-yellow-200",
                stockStatus.color === 'red' && "bg-red-50 border-red-200",
                stockStatus.color === 'gray' && "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    stockStatus.color === 'green' && "bg-green-500",
                    stockStatus.color === 'yellow' && "bg-yellow-500",
                    stockStatus.color === 'red' && "bg-red-500",
                    stockStatus.color === 'gray' && "bg-gray-500"
                  )}></div>
                  <span className={cn(
                    "font-medium",
                    stockStatus.color === 'green' && "text-green-800",
                    stockStatus.color === 'yellow' && "text-yellow-800",
                    stockStatus.color === 'red' && "text-red-800",
                    stockStatus.color === 'gray' && "text-gray-800"
                  )}>
                    {stockStatus.label}
                  </span>
                </div>
                
                {trackInventory && (
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {stock} <span className="text-sm font-normal text-gray-600">unidades</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Alerts */}
              {trackInventory && (
                <div className="space-y-3">
                  {stock === 0 && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Sin Stock
                        </p>
                        <p className="text-xs text-red-600">
                          {allowBackorder 
                            ? "Se permiten pedidos pendientes" 
                            : "Producto no disponible para compra"
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {stock > 0 && stock <= lowStockThreshold && lowStockThreshold > 0 && (
                    <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Stock Bajo
                        </p>
                        <p className="text-xs text-yellow-600">
                          Considera reabastecer pronto
                        </p>
                      </div>
                    </div>
                  )}

                  {!trackInventory && (
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Inventario No Rastreado
                        </p>
                        <p className="text-xs text-blue-600">
                          El stock no se reducirá automáticamente con las ventas
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AdminCard>

          {/* Inventory Metrics */}
          {trackInventory && (
            <AdminCard title="Métricas de Inventario" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Días de stock estimados</span>
                  <span className="font-medium">
                    {/* TODO: Calculate based on sales velocity */}
                    ~30 días
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor del inventario</span>
                  <span className="font-medium">
                    ${((watchedData.cost_price || 0) * stock).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Punto de reorden</span>
                  <span className="font-medium">
                    {lowStockThreshold || 'No configurado'}
                  </span>
                </div>
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}









