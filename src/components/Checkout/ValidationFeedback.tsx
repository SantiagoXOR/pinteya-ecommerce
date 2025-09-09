import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ValidationFeedbackProps {
  field: string;
  value: string;
  error?: string;
  isValid?: boolean;
  showValidation?: boolean;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => boolean;
  };
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  field,
  value,
  error,
  isValid,
  showValidation = true,
  validationRules = {}
}) => {
  const { required = true, minLength, pattern, customValidator } = validationRules;

  // Determinar el estado de validación
  const getValidationState = () => {
    if (!showValidation || !value.trim()) return null;
    
    if (error) return 'error';
    if (isValid !== undefined) return isValid ? 'valid' : 'error';
    
    // Validación automática basada en reglas
    if (required && !value.trim()) return 'error';
    if (minLength && value.length < minLength) return 'warning';
    if (pattern && !pattern.test(value)) return 'error';
    if (customValidator && !customValidator(value)) return 'error';
    
    return 'valid';
  };

  const validationState = getValidationState();

  if (!showValidation || !validationState) return null;

  const getIcon = () => {
    switch (validationState) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (error) return error;
    
    switch (validationState) {
      case 'valid':
        return getValidMessage(field);
      case 'warning':
        return getWarningMessage(field, minLength);
      case 'error':
        return getErrorMessage(field);
      default:
        return '';
    }
  };

  const getValidMessage = (field: string) => {
    const messages: Record<string, string> = {
      email: '✓ Email válido',
      phone: '✓ Teléfono válido',
      streetAddress: '✓ Dirección válida',
      firstName: '✓ Nombre válido',
      lastName: '✓ Apellido válido'
    };
    return messages[field] || '✓ Campo válido';
  };

  const getWarningMessage = (field: string, minLength?: number) => {
    if (field === 'streetAddress' && minLength) {
      return `⚠ Dirección muy corta (mínimo ${minLength} caracteres)`;
    }
    return '⚠ Campo incompleto';
  };

  const getErrorMessage = (field: string) => {
    const messages: Record<string, string> = {
      email: '✗ Email inválido',
      phone: '✗ Teléfono inválido',
      streetAddress: '✗ Dirección requerida',
      firstName: '✗ Nombre requerido',
      lastName: '✗ Apellido requerido'
    };
    return messages[field] || '✗ Campo inválido';
  };

  const getTextColor = () => {
    switch (validationState) {
      case 'valid':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-1 text-sm ${getTextColor()}`}>
      {getIcon()}
      <span>{getMessage()}</span>
    </div>
  );
};

export default ValidationFeedback;

// Hook personalizado para validación en tiempo real
export const useRealTimeValidation = (field: string, value: string) => {
  const [isValid, setIsValid] = React.useState<boolean | undefined>(undefined);
  const [showValidation, setShowValidation] = React.useState(false);

  React.useEffect(() => {
    // Mostrar validación después de que el usuario empiece a escribir
    if (value.length > 0) {
      setShowValidation(true);
    }

    // Validar según el campo
    const validateField = () => {
      switch (field) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          setIsValid(emailRegex.test(value));
          break;
        case 'phone':
          const phoneRegex = /^(\+54\s?)?[0-9]{2,4}\s?[0-9]{3}\s?[0-9]{4}$/;
          setIsValid(phoneRegex.test(value.replace(/\s/g, '')));
          break;
        case 'streetAddress':
          setIsValid(value.length >= 10);
          break;
        default:
          setIsValid(value.trim().length > 0);
      }
    };

    if (showValidation) {
      validateField();
    }
  }, [field, value, showValidation]);

  return { isValid, showValidation };
};