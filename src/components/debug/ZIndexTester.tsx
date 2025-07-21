"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';

/**
 * Componente para probar la jerarquía de z-index
 * Verifica que modales, notificaciones y overlays aparezcan correctamente por encima del Header
 */
export const ZIndexTester = () => {
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShowLoader = () => {
    setShowLoader(true);
    setTimeout(() => setShowLoader(false), 3000);
  };

  const handleShowToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-debug">
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="text-sm font-semibold mb-3">Z-Index Tester</h3>
        <div className="space-y-2">
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="w-full text-xs"
          >
            Modal (z-modal: 5100)
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowErrorModal(true)}
            variant="destructive"
            className="w-full text-xs"
          >
            Error Modal (z-error-critical: 9200)
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowNotification(true)}
            className="w-full text-xs"
          >
            Notification (z-notification: 8000)
          </Button>
          
          <Button
            size="sm"
            onClick={handleShowLoader}
            className="w-full text-xs"
          >
            Loader (z-loader: 9000)
          </Button>
          
          <Button
            size="sm"
            onClick={handleShowToast}
            className="w-full text-xs"
          >
            Toast (z-toast: 8100)
          </Button>
        </div>
      </div>

      {/* Modal Normal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-modal-backdrop" />
          <div className="fixed inset-0 flex items-center justify-center z-modal">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Modal Normal</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-600 mb-4">
                Este modal debería aparecer por encima del Header (z-index: 5100 vs 1100)
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setShowModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Error Crítico */}
      {showErrorModal && (
        <>
          <div className="fixed inset-0 bg-red-900/50 z-overlay-critical" />
          <div className="fixed inset-0 flex items-center justify-center z-error-critical">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border-2 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-red-700">Error Crítico</h2>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowErrorModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-600 mb-4">
                Este modal de error crítico debería tener la máxima prioridad (z-index: 9200)
              </p>
              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowErrorModal(false)}
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notificación */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-notification">
          <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Notificación</h3>
                  <p className="text-sm opacity-90">z-index: 8000</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNotification(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loader Global */}
      {showLoader && (
        <div className="fixed inset-0 bg-black/30 z-loader flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <div>
                <h3 className="font-semibold">Cargando...</h3>
                <p className="text-sm text-gray-600">z-index: 9000</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 left-4 z-toast">
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Toast Notification</h3>
              <p className="text-sm opacity-90">z-index: 8100</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZIndexTester;
