import { Capacitor, registerPlugin } from '@capacitor/core';

// Registro del plugin nativo local de Capacitor 8
const PosPrinter = registerPlugin('PosPrinter');

export const printService = {
  /**
   * Imprime la factura actual respetando la plataforma de ejecución:
   * - En Android: activa el PrintManager nativo para enviar el documento a POSPrinter.
   * - En escritorio: ejecuta window.print().
   *
   * En caso de fallo en Android, propaga el error directamente al llamante sin recurrir
   * a window.print(), garantizando que no se oculte el problema en el WebView.
   *
   * @param {string} jobName - Nombre descriptivo para el trabajo de impresión.
   * @returns {Promise<{ started: boolean }>}
   */
  printInvoice: async (jobName = 'Factura_POS') => {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await PosPrinter.print({ name: jobName });
        return result;
      } catch (error) {
        // En Android no se realiza fallback a window.print()
        throw new Error(error?.message || 'Error al iniciar la impresión nativa en el dispositivo');
      }
    } else {
      // En navegadores de escritorio convencionales
      window.print();
      return { started: true };
    }
  }
};
