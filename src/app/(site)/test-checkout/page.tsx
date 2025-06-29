"use client";
import React, { useState } from 'react';
import { testCheckoutFlow, testAPIs, simulateUserFlow } from '@/utils/testCheckoutFlow';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { selectCartItems, selectTotalPrice, addItemToCart } from '@/redux/features/cart-slice';
import Breadcrumb from '@/components/Common/Breadcrumb';

const TestCheckoutPage = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');

  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectTotalPrice);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true);
    setActiveTest(testName);
    setTestResults(null);

    try {
      const result = await testFunction();
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setIsLoading(false);
      setActiveTest('');
    }
  };

  const addTestProductsToCart = () => {
    const testProducts = [
      {
        id: 1,
        title: 'Pintura Látex Interior Blanco 20L',
        price: 18000,
        discountedPrice: 15000,
        quantity: 1,
        imgs: {
          thumbnails: ['/images/products/pintura-latex.jpg'],
          previews: ['/images/products/pintura-latex.jpg'],
        },
      },
      {
        id: 2,
        title: 'Rodillo Antigota 23cm',
        price: 4000,
        discountedPrice: 3500,
        quantity: 1,
        imgs: {
          thumbnails: ['/images/products/rodillo.jpg'],
          previews: ['/images/products/rodillo.jpg'],
        },
      },
    ];

    testProducts.forEach(product => {
      dispatch(addItemToCart(product));
    });
  };

  return (
    <>
      <Breadcrumb title="Test Checkout" pages={["Test", "Checkout"]} />
      
      <section className="py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="bg-white rounded-xl shadow-1 p-8">
            <h1 className="text-3xl font-bold text-dark mb-8">
              🧪 Panel de Testing - Pinteya Checkout
            </h1>

            {/* Estado del carrito */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-xl font-semibold text-dark mb-4">🛒 Estado del Carrito</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue">{cartItems.length}</p>
                  <p className="text-sm text-gray-600">Productos únicos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue">
                    {cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Items totales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue">${totalPrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
              
              <button
                onClick={addTestProductsToCart}
                className="mt-4 bg-tahiti-gold-500 text-white px-4 py-2 rounded-lg hover:bg-tahiti-gold-700 transition-colors"
              >
                Agregar Productos de Prueba
              </button>
            </div>

            {/* Botones de testing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => runTest('APIs', testAPIs)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeTest === 'APIs'
                    ? 'border-tahiti-gold-500 bg-tahiti-gold-500 text-white'
                    : 'border-gray-300 hover:border-tahiti-gold-500 hover:bg-tahiti-gold-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-semibold">Test APIs</div>
                  <div className="text-sm opacity-75">Productos, Categorías</div>
                </div>
              </button>

              <button
                onClick={() => runTest('Checkout', testCheckoutFlow)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeTest === 'Checkout'
                    ? 'border-blue bg-blue text-white'
                    : 'border-gray-300 hover:border-blue hover:bg-blue-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💳</div>
                  <div className="font-semibold">Test Checkout</div>
                  <div className="text-sm opacity-75">Flujo de pago</div>
                </div>
              </button>

              <button
                onClick={() => runTest('Flujo Completo', simulateUserFlow)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeTest === 'Flujo Completo'
                    ? 'border-blue bg-blue text-white'
                    : 'border-gray-300 hover:border-blue hover:bg-blue-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-semibold">Flujo Completo</div>
                  <div className="text-sm opacity-75">Simulación usuario</div>
                </div>
              </button>

              <a
                href="/checkout"
                className="p-4 rounded-lg border-2 border-green-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-semibold">Ir a Checkout</div>
                  <div className="text-sm opacity-75">Prueba real</div>
                </div>
              </a>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  <p className="text-yellow-800">Ejecutando test: {activeTest}...</p>
                </div>
              </div>
            )}

            {/* Resultados */}
            {testResults && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-dark mb-4">📊 Resultados del Test</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}

            {/* Información adicional */}
            <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-dark mb-4">ℹ️ Información</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Test APIs:</strong> Verifica que todas las APIs estén funcionando</li>
                <li>• <strong>Test Checkout:</strong> Prueba la creación de preferencias de pago</li>
                <li>• <strong>Flujo Completo:</strong> Simula todo el proceso de un usuario</li>
                <li>• <strong>Ir a Checkout:</strong> Prueba real con el carrito actual</li>
              </ul>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>Nota:</strong> Esta página es solo para desarrollo. 
                  Asegúrate de tener productos en el carrito antes de probar el checkout real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TestCheckoutPage;
