/**
 * Pila LIFO centralizada para registro y cierre de overlays (modales y drawer móvil).
 */
const stack = [];

export const modalStack = {
  /**
   * Registra una función de cierre en la cima de la pila.
   * @param {Function} onClose - Callback para cerrar el overlay.
   * @returns {Function} Función para desregistrar el callback.
   */
  push: (onClose) => {
    if (typeof onClose !== 'function') return () => {};
    // Evitar registrar la misma función duplicada
    const existingIndex = stack.indexOf(onClose);
    if (existingIndex !== -1) {
      stack.splice(existingIndex, 1);
    }
    stack.push(onClose);

    return () => {
      const index = stack.lastIndexOf(onClose);
      if (index !== -1) {
        stack.splice(index, 1);
      }
    };
  },

  /**
   * Verifica si existen overlays activos registrados en la pila.
   * @returns {boolean}
   */
  hasModals: () => stack.length > 0,

  /**
   * Cierra únicamente el último overlay registrado en la cima de la pila.
   * @returns {boolean} True si se cerró un overlay, false si la pila estaba vacía.
   */
  closeTop: () => {
    if (stack.length > 0) {
      const closeFn = stack.pop();
      if (typeof closeFn === 'function') {
        closeFn();
        return true;
      }
    }
    return false;
  },

  /**
   * Remueve una función de cierre específica si se requiere manualmente.
   * @param {Function} onClose
   */
  remove: (onClose) => {
    const index = stack.lastIndexOf(onClose);
    if (index !== -1) {
      stack.splice(index, 1);
    }
  }
};
