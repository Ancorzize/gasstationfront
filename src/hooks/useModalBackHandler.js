import { useEffect } from 'react';
import { modalStack } from '../utils/modalStack';

/**
 * Hook para registrar un modal en la pila del botón Atrás de Android.
 * Cuando el modal está abierto, se añade a modalStack; al cerrarse o desmontarse, se retira.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {Function} onClose - Función a invocar para cerrar el modal cuando se presione Atrás.
 */
export const useModalBackHandler = (isOpen, onClose) => {
  useEffect(() => {
    if (isOpen && typeof onClose === 'function') {
      return modalStack.push(onClose);
    }
  }, [isOpen, onClose]);
};
