import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, FileText, Send, RotateCw, CheckCircle2, Loader2, Download
} from 'lucide-react';
import { documentosElectronicosService } from '../../settings/services/documentosElectronicosService';
import { useToast } from '../../../context/ToastContext';

const MOTIVOS_NC = [
  { id: 2, label: '2 - Anulación de factura electrónica' },
  { id: 1, label: '1 - Devolución parcial de los bienes y/o no aceptación del servicio' },
  { id: 3, label: '3 - Rebaja o descuento parcial o total' },
  { id: 4, label: '4 - Ajuste de precio' },
  { id: 5, label: '5 - Otros' },
];

export const NotaCreditoModal = ({ sale, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [tipoAjuste, setTipoAjuste] = useState('cantidad'); // 'valor' | 'cantidad'
  const [responseId, setResponseId] = useState(2);
  const [motivo, setMotivo] = useState('Anulación de factura electrónica');
  const [montoAjusteValor, setMontoAjusteValor] = useState('');
  const [devolucionInventario, setDevolucionInventario] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cantidades a acreditar por cada detalle_venta_id
  const [selectedQuantities, setSelectedQuantities] = useState(() => {
    const initial = {};
    if (sale?.detalles && Array.isArray(sale.detalles)) {
      sale.detalles.forEach((det) => {
        initial[det.id] = parseFloat(det.cantidad || 0);
      });
    }
    return initial;
  });

  // Documento electrónico resultante en las distintas etapas (preparado / transmitido)
  const [docNC, setDocNC] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'prepared' | 'transmitted'
  const [transmitting, setTransmitting] = useState(false);
  const [transmissionResult, setTransmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const formatCurrency = (amount) => {
    return '$ ' + parseFloat(amount || 0).toLocaleString('es-CO');
  };

  // Manejo de cambio en la cantidad a acreditar por ítem
  const handleQuantityChange = (detId, maxQty, valStr) => {
    let val = parseFloat(valStr);
    if (isNaN(val) || val < 0) val = 0;
    if (val > maxQty) val = maxQty;
    setSelectedQuantities((prev) => ({
      ...prev,
      [detId]: val
    }));
  };

  // Cálculo dinámico del total del ajuste según modo activo
  const totalOriginal = parseFloat(sale?.total || 0);

  let totalAjuste = 0;

  if (tipoAjuste === 'valor') {
    totalAjuste = parseFloat(montoAjusteValor || 0);
  } else {
    let subtotalLineas = 0;
    let impuestosLineas = 0;

    if (sale?.detalles && Array.isArray(sale.detalles)) {
      sale.detalles.forEach((det) => {
        const cantAcreditar = selectedQuantities[det.id] || 0;
        const cantOriginal = parseFloat(det.cantidad || 0);
        const precio = parseFloat(det.precio_unitario || 0);
        const subtotalLine = cantAcreditar * precio;
        const factor = cantOriginal > 0 ? (cantAcreditar / cantOriginal) : 1;
        const ivaLine = parseFloat(det.iva_valor || 0) * factor;

        subtotalLineas += subtotalLine;
        impuestosLineas += ivaLine;
      });
    }

    totalAjuste = subtotalLineas + impuestosLineas;
  }

  const totalResultante = Math.max(0, totalOriginal - totalAjuste);

  // 1. Preparar la Nota Crédito
  const handlePrepararNC = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      venta_id: sale.id,
      tipo_ajuste: tipoAjuste,
      response_id: Number(responseId),
      motivo: motivo.trim() || undefined,
    };

    if (tipoAjuste === 'valor') {
      const montoVal = parseFloat(montoAjusteValor) || 0;
      if (montoVal <= 0) {
        showToast('El monto del ajuste por valor debe ser mayor a cero.', 'error');
        setSubmitting(false);
        return;
      }
      if (montoVal > totalOriginal) {
        showToast(`El monto del ajuste (${formatCurrency(montoVal)}) no puede superar el total facturado (${formatCurrency(totalOriginal)}).`, 'error');
        setSubmitting(false);
        return;
      }
      payload.monto_descuento = montoVal;
    } else {
      const itemsPayload = Object.entries(selectedQuantities)
        .filter(([_, cant]) => parseFloat(cant) > 0)
        .map(([detId, cant]) => ({
          detalle_venta_id: Number(detId),
          cantidad: parseFloat(cant)
        }));

      if (itemsPayload.length === 0) {
        showToast('Debe especificar al menos un producto con cantidad a acreditar mayor a cero.', 'error');
        setSubmitting(false);
        return;
      }

      payload.items = itemsPayload;
      payload.devolucion_inventario = devolucionInventario;
    }

    try {
      const res = await documentosElectronicosService.prepararNC(payload);

      if (res && res.status && res.data) {
        setDocNC(res.data);
        setStep('prepared');
        showToast(res.message || 'Nota Crédito preparada exitosamente.', 'success');
      } else {
        const errorText = res?.message || 'No se pudo preparar la Nota Crédito.';
        setErrorMessage(errorText);
        showToast(errorText, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error al conectar con el servidor para preparar la Nota Crédito.';
      setErrorMessage(text);
      showToast(text, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Transmitir la Nota Crédito a DIAN / MATIAS
  const handleTransmitirNC = async () => {
    const docId = docNC?.datos_tecnicos?.documento_electronico_id || docNC?.id;
    if (!docId) {
      showToast('No se encontró el ID del documento para transmitir.', 'error');
      return;
    }

    setTransmitting(true);
    setErrorMessage(null);

    try {
      const res = await documentosElectronicosService.transmitirNC(docId);

      if (res && res.status && res.data) {
        setTransmissionResult(res.data);
        setStep('transmitted');
        if (res.data.exitoso || res.data.estado === 'emitido') {
          showToast(res.message || 'Nota Crédito emitida correctamente ante la DIAN.', 'success');
          if (onSuccess) onSuccess();
        } else if (res.data.estado === 'rechazado') {
          showToast(res.message || 'Nota Crédito fue rechazada por MATIAS / DIAN.', 'error');
        } else {
          showToast(res.message || 'La Nota Crédito se encuentra pendiente de transmisión.', 'info');
        }
      } else {
        const text = res?.message || 'Error al transmitir la Nota Crédito.';
        setErrorMessage(text);
        showToast(text, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error de conexión al transmitir la Nota Crédito.';
      setErrorMessage(text);
      showToast(text, 'error');
    } finally {
      setTransmitting(false);
    }
  };

  // 3. Reintentar transmisión de la Nota Crédito
  const handleReintentarNC = async () => {
    const docId = docNC?.datos_tecnicos?.documento_electronico_id || docNC?.id;
    if (!docId) {
      showToast('No se encontró el ID del documento para reintentar.', 'error');
      return;
    }

    setTransmitting(true);
    setErrorMessage(null);

    try {
      const res = await documentosElectronicosService.reintentarNC(docId);

      if (res && res.status && res.data) {
        setTransmissionResult(res.data);
        setStep('transmitted');
        if (res.data.exitoso || res.data.estado === 'emitido') {
          showToast(res.message || 'Nota Crédito emitida correctamente tras el reintento.', 'success');
          if (onSuccess) onSuccess();
        } else if (res.data.estado === 'rechazado') {
          showToast(res.message || 'Nota Crédito fue rechazada por la DIAN.', 'error');
        } else {
          showToast(res.message || 'Proceso de reintento ejecutado. Estado actual: ' + (res.data.estado || 'pendiente'), 'info');
        }
      } else {
        const text = res?.message || 'Error al reintentar la transmisión de la Nota Crédito.';
        setErrorMessage(text);
        showToast(text, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error de conexión al reintentar la Nota Crédito.';
      setErrorMessage(text);
      showToast(text, 'error');
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
      >
        {/* Header del Modal */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">
                Crear Nota Crédito Electrónica
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ajuste / Anulación fiscal de Factura Electrónica
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar-light">
          
          {/* Tarjeta de Resumen Factura Original */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Factura Original Ref.
              </span>
              <span className="text-xs font-black text-blue-600 uppercase">
                {sale.prefijo ? `${sale.prefijo}-` : ''}{sale.numero_factura}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Fecha</span>
                <span className="font-bold text-slate-700 block mt-0.5">
                  {new Date(sale.fecha_venta).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Cliente</span>
                <span className="font-bold text-slate-700 truncate block mt-0.5">
                  {sale.cliente ? `${sale.cliente.nombre} ${sale.cliente.apellidos || ''}` : 'Público General'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Doc. Cliente</span>
                <span className="font-bold text-slate-700 block mt-0.5">
                  {sale.cliente?.documento || '222222222222'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Facturado</span>
                <span className="font-black text-zinc-900 block mt-0.5">
                  {formatCurrency(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de Error Si Ocurre */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3 text-xs font-bold">
              <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-black uppercase">Error de Procesamiento</p>
                <p className="mt-0.5 text-red-600/90 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ETAPA 1: Formulario y Vista Previa */}
          {step === 'form' && (
            <form onSubmit={handlePrepararNC} className="space-y-5">
              
              <div className="space-y-4">
                {/* Selector Modo de Ajuste */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1.5">
                    Modo de Ajuste Fiscal *
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTipoAjuste('valor')}
                      className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                        tipoAjuste === 'valor' 
                          ? 'bg-white text-red-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ajuste por Valor ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoAjuste('cantidad')}
                      className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                        tipoAjuste === 'cantidad' 
                          ? 'bg-white text-red-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ajuste por Cantidad
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1.5">
                    Motivo / Discrepancia Fiscal (response_id) *
                  </label>
                  <select 
                    value={responseId}
                    onChange={(e) => {
                      const selId = Number(e.target.value);
                      setResponseId(selId);
                      const found = MOTIVOS_NC.find(m => m.id === selId);
                      if (found) setMotivo(found.label.split(' - ')[1]);
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-red-500 transition-all uppercase"
                  >
                    {MOTIVOS_NC.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {tipoAjuste === 'valor' ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1.5">
                      Monto de Descuento / Ajuste ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalOriginal}
                      step="0.01"
                      required
                      placeholder="Escriba el valor de la diferencia a descontar..."
                      value={montoAjusteValor}
                      onChange={(e) => setMontoAjusteValor(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-red-500 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-1 ml-1">
                      • Este ajuste es exclusivamente monetario y NO afectará el inventario.
                    </p>
                  </div>
                ) : (
                  /* Detalle de Líneas de Productos de la Factura Original con Input de Cantidad a Acreditar */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Selección de Ítems a Acreditar
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFull = {};
                          sale?.detalles?.forEach((d) => { allFull[d.id] = parseFloat(d.cantidad || 0); });
                          setSelectedQuantities(allFull);
                        }}
                        className="text-[9px] font-bold text-red-600 hover:underline uppercase"
                      >
                        Acreditar todo (100%)
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/60 border-b border-slate-100">
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase">Producto</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-center">Facturado</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-center w-28">Cant. Acreditar</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-right">Subtotal Ajuste</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sale.detalles && sale.detalles.length > 0 ? (
                            sale.detalles.map((det) => {
                              const maxCant = parseFloat(det.cantidad || 0);
                              const currentQty = selectedQuantities[det.id] ?? maxCant;
                              const price = parseFloat(det.precio_unitario || 0);
                              const subtotalLine = currentQty * price;

                              return (
                                <tr key={det.id}>
                                  <td className="p-3">
                                    <p className="font-bold text-slate-800 uppercase">{det.producto?.nombre || 'Producto'}</p>
                                    <p className="text-[9px] font-medium text-slate-400">P. Unit: {formatCurrency(price)}</p>
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-700">
                                    {maxCant.toLocaleString('es-CO')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxCant}
                                      step="any"
                                      value={currentQty}
                                      onChange={(e) => handleQuantityChange(det.id, maxCant, e.target.value)}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-xl text-center text-xs font-black outline-none focus:border-red-500 transition-all"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-black text-zinc-900">
                                    {formatCurrency(subtotalLine)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="p-4 text-center text-slate-400 italic text-xs">Sin ítems</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Toggle de Devolución Física a Inventario */}
                    <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-amber-900 uppercase block">
                          Devolución Física a Inventario (+Stock)
                        </span>
                        <p className="text-[10px] text-amber-700 font-medium">
                          Registrar la entrada de física devolución de productos al stock de la bodega.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={devolucionInventario}
                        onChange={(e) => setDevolucionInventario(e.target.checked)}
                        className="w-5 h-5 text-amber-600 rounded-lg border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1.5">
                    Descripción / Observaciones de la Nota *
                  </label>
                  <textarea
                    required
                    rows="3"
                    maxLength={255}
                    placeholder="Escriba la razón de la nota crédito..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-red-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Vista Previa de Cálculo */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-lg">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Vista Previa del Ajuste Fiscal
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-800 pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Factura Original</span>
                    <span className="text-xs font-black text-slate-200 block mt-1">
                      {formatCurrency(totalOriginal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-red-400 uppercase block">Ajuste Nota Crédito</span>
                    <span className="text-xs font-black text-red-400 block mt-1">
                      -{formatCurrency(totalAjuste)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase block">Valor Resultante</span>
                    <span className="text-xs font-black text-emerald-400 block mt-1">
                      {formatCurrency(totalResultante)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium space-y-0.5">
                  <p>• La factura original no será modificada en la base de datos.</p>
                  <p>• Se generará una Nota Crédito Electrónica vinculada formalmente a esta factura por el monto del ajuste.</p>
                  {tipoAjuste === 'cantidad' && (
                    <p className={devolucionInventario ? "text-amber-400 font-bold" : ""}>
                      • Inventario: {devolucionInventario ? 'Se generará entrada de inventario por reingreso de mercancía.' : 'Sin movimientos de inventario.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !motivo.trim() || totalAjuste <= 0}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  {submitting ? 'Preparando Nota...' : 'Preparar Nota Crédito'}
                </button>
              </div>
            </form>
          )}

          {/* ETAPA 2: Documento Preparado */}
          {step === 'prepared' && (
            <div className="space-y-6 text-center py-2 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <FileText size={32} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  Nota Crédito Preparada Exitosamente
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  El documento electrónico ha sido creado en estado <strong className="text-amber-600 uppercase">Pendiente</strong> y está listo para ser transmitido a la DIAN.
                </p>
              </div>

              {/* Detalle del documento preparado */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3 text-xs max-w-lg mx-auto">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-500 uppercase">Consecutivo Reservado:</span>
                  <span className="font-black text-slate-800 uppercase text-sm">
                    {docNC?.numero_nota_credito || (docNC?.datos_tecnicos?.prefijo ? `${docNC.datos_tecnicos.prefijo}${docNC.datos_tecnicos.consecutivo}` : 'NC-PENDIENTE')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Estado Inicial:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200">
                    {docNC?.estado || 'pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Factura Referencia:</span>
                  <span className="font-bold text-slate-700">{sale.prefijo}-{sale.numero_factura}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Monto Total Nota Crédito:</span>
                  <span className="font-black text-red-600">-{formatCurrency(totalAjuste)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-2xl transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleTransmitirNC}
                  disabled={transmitting}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {transmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {transmitting ? 'Transmitiendo a DIAN...' : 'Transmitir a DIAN'}
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: Transmitido / Resultado Final */}
          {step === 'transmitted' && (
            <div className="space-y-6 text-center py-2 animate-in fade-in duration-300">
              
              {transmissionResult?.exitoso || transmissionResult?.estado === 'emitido' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      Nota Crédito Emitida Exitosamente
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      La Nota Crédito fue aceptada y firmada electrónicamente ante la DIAN mediante MATIAS API.
                    </p>
                  </div>

                  {/* Resumen Fiscal Emitido */}
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 text-left space-y-3 text-xs max-w-lg mx-auto">
                    <div className="flex justify-between items-center border-b border-emerald-200/80 pb-2">
                      <span className="font-bold text-emerald-800 uppercase">Número Nota:</span>
                      <span className="font-black text-emerald-900 text-sm uppercase">
                        {transmissionResult.numero_nota_credito || transmissionResult.numero_factura || 'Emitida'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-800 uppercase">Estado:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                        {transmissionResult.estado || 'emitido'}
                      </span>
                    </div>

                    {transmissionResult.cude && (
                      <div>
                        <span className="font-bold text-emerald-800 uppercase block mb-1">CUDE / UUID Fiscal</span>
                        <span className="font-mono text-[10px] font-bold bg-white p-2 rounded-xl block break-all text-slate-800 border border-emerald-200">
                          {transmissionResult.cude}
                        </span>
                      </div>
                    )}

                    {transmissionResult.mensaje && (
                      <div className="pt-1 text-[11px] text-emerald-800 font-medium">
                        {transmissionResult.mensaje}
                      </div>
                    )}
                  </div>

                  {/* Botones de Descarga PDF / XML */}
                  <div className="flex justify-center gap-3">
                    {transmissionResult.pdf_url && (
                      <a 
                        href={transmissionResult.pdf_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <Download size={14} /> Ver PDF
                      </a>
                    )}
                    {transmissionResult.xml_url && (
                      <a 
                        href={transmissionResult.xml_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <Download size={14} /> Descargar XML
                      </a>
                    )}
                  </div>
                </>
              ) : transmissionResult?.estado === 'rechazado' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={36} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      Nota Crédito Rechazada
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      MATIAS API / DIAN reportó un rechazo en la emisión del documento.
                    </p>
                  </div>

                  <div className="bg-red-50 p-5 rounded-2xl border border-red-200 text-left space-y-3 text-xs max-w-lg mx-auto">
                    <div className="flex justify-between items-center border-b border-red-200 pb-2">
                      <span className="font-bold text-red-800 uppercase">Estado:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white">
                        Rechazado
                      </span>
                    </div>

                    {transmissionResult.mensaje && (
                      <div>
                        <span className="font-bold text-red-800 uppercase block mb-1">Detalle del Rechazo</span>
                        <p className="text-xs text-red-700 font-medium bg-white p-3 rounded-xl border border-red-200">
                          {transmissionResult.mensaje}
                        </p>
                      </div>
                    )}

                    {transmissionResult.errores && Object.keys(transmissionResult.errores).length > 0 && (
                      <div>
                        <span className="font-bold text-red-800 uppercase block mb-1">Errores DIAN</span>
                        <pre className="text-[10px] font-mono text-red-800 bg-white p-3 rounded-xl border border-red-200 overflow-x-auto">
                          {JSON.stringify(transmissionResult.errores, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                    <RotateCw size={36} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      Documento Pendiente de Transmisión
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      No se obtuvo respuesta fiscal inmediata de MATIAS API. El documento permanece en estado pendiente para reintento.
                    </p>
                  </div>
                </>
              )}

              {/* Botón de Reintento cuando sea rechazado o pendiente */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-2xl transition-all"
                >
                  Cerrar
                </button>
                {(!transmissionResult?.exitoso && transmissionResult?.estado !== 'emitido') && (
                  <button
                    type="button"
                    onClick={handleReintentarNC}
                    disabled={transmitting}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {transmitting ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                    {transmitting ? 'Reintentando...' : 'Reintentar Transmisión'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
