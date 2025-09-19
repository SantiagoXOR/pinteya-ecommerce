import React, { useState } from "react";

interface CouponProps {
  onCouponApply: (couponCode: string, discount: number) => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
  isLoading?: boolean;
}

// Cupones de ejemplo para testing
const AVAILABLE_COUPONS = {
  'PINTEYA10': { discount: 10, type: 'percentage' as const, description: '10% de descuento' },
  'BIENVENIDO': { discount: 5000, type: 'fixed' as const, description: '$5000 de descuento' },
  'ENVIOGRATIS': { discount: 1500, type: 'fixed' as const, description: 'Envío gratis' },
  'FERRETERIA15': { discount: 15, type: 'percentage' as const, description: '15% en productos de ferretería' },
};

const Coupon: React.FC<CouponProps> = ({ onCouponApply, appliedCoupon, isLoading = false }) => {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Ingresa un código de cupón');
      return;
    }

    setIsApplying(true);
    setError('');

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const upperCouponCode = couponCode.toUpperCase();
    const coupon = AVAILABLE_COUPONS[upperCouponCode as keyof typeof AVAILABLE_COUPONS];

    if (coupon) {
      onCouponApply(upperCouponCode, coupon.discount);
      setCouponCode('');
      setError('');
    } else {
      setError('Código de cupón inválido');
    }

    setIsApplying(false);
  };

  const handleRemoveCoupon = () => {
    onCouponApply('', 0);
  };

  return (
    <div className="bg-white shadow-1 rounded-[10px] mt-7.5">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Código de Descuento</h3>
      </div>

      <div className="py-8 px-4 sm:px-8.5">
        {appliedCoupon ? (
          // Cupón aplicado
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">✅ Cupón aplicado: {appliedCoupon.code}</p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.type === 'percentage'
                    ? `${appliedCoupon.discount}% de descuento`
                    : `$${appliedCoupon.discount.toLocaleString()} de descuento`
                  }
                </p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          // Formulario de cupón
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                name="coupon"
                id="coupon"
                placeholder="Ingresa tu código de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                disabled={isLoading || isApplying}
                className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                  error ? 'border-red-500' : 'border-gray-3'
                }`}
              />

              <button
                onClick={handleApplyCoupon}
                disabled={isLoading || isApplying || !couponCode.trim()}
                className={`flex justify-center font-medium text-white py-2.5 px-6 rounded-md ease-out duration-200 ${
                  isLoading || isApplying || !couponCode.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-tahiti-gold-500 hover:bg-tahiti-gold-700'
                }`}
              >
                {isApplying ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Aplicando...
                  </div>
                ) : (
                  'Aplicar'
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-2">
                {error instanceof Error ? error.message : typeof error === 'string' ? error : 'Error desconocido'}
              </p>
            )}

            {/* Cupones disponibles para testing */}
            <div className="mt-4 p-3 bg-tahiti-gold-50 border border-tahiti-gold-200 rounded-lg">
              <p className="text-sm font-medium text-tahiti-gold-800 mb-2">Cupones disponibles para testing:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(AVAILABLE_COUPONS).map(([code, coupon]) => (
                  <div key={code} className="flex justify-between">
                    <span className="font-mono bg-white px-2 py-1 rounded">{code}</span>
                    <span className="text-tahiti-gold-600">{coupon.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Coupon;









