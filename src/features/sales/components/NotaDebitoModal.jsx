import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, FileText, Send, RotateCw, CheckCircle2, Loader2, Download
} from 'lucide-react';
import { documentosElectronicosService } from '../../settings/services/documentosElectronicosService';
import { useToast } from '../../../context/ToastContext';

const MOTIVOS_ND = [
  { id: 3, label: '3 - Cambio del valor' },
  { id: 1, label: '1 - Intereses' },
  { id: 2, label: '2 - Gastos por cobrar' },
  { id: 4, label: '4 - Otros' },
];

export const NotaDebitoModal = ({ sale, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [tipoAjuste, setTipoAjuste] = useState('valor'); // 'valor' | 'cantidad'
  const [responseId, setResponseId] = useState(3);
  const [motivo, setMotivo] = useState('Cambio del valor de la factura');
  const [valorAjusteAdicional, setValorAjusteAdicional] = useState('');
  const [selectedAddQuantities, setSelectedAddQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Documento electrónico resultante en las distintas etapas
  const [docND, setDocND] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'prepared' | 'transmitted'
  const [transmitting, setTransmitting] = useState(false);
  const [transmissionResult, setTransmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const formatCurrency = (amount) => {
    return '$ ' + parseFloat(amount || 0).toLocaleString('es-CO');
  };

  const handleAddQuantityChange = (detId, valStr) => {
    let val = parseFloat(valStr);
    if (isNaN(val) || val < 0) val = 0;
    setSelectedAddQuantities((prev) => ({
      ...prev,
      [detId]: val
    }));
  };

  const totalOriginal = parseFloat(sale?.total || 0);

  let adicion = 0;
  if (tipoAjuste === 'valor') {
    adicion = parseFloat(valorAjusteAdicional || 0);
  } else {
    if (sale?.detalles && Array.isArray(sale.detalles)) {
      sale.detalles.forEach((det) => {
        const cantAdd = selectedAddQuantities[det.id] || 0;
        const price = parseFloat(det.precio_unitario || 0);
        const subtotalLine = cantAdd * price;
        const ivaPorcentaje = parseFloat(det.iva || 0);
        const ivaLine = subtotalLine * (ivaPorcentaje / 100);
        adicion += subtotalLine + ivaLine;
      });
    }
  }

  const totalResultante = totalOriginal + adicion;

  // 1. Preparar la Nota Débito
  const handlePrepararND = async (e) => {
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
      const incremento = parseFloat(valorAjusteAdicional) || 0;
      if (incremento <= 0) {
        showToast('El monto de incremento debe ser mayor a cero.', 'error');
        setSubmitting(false);
        return;
      }
      payload.monto_incremento = incremento;
    } else {
      const itemsPayload = Object.entries(selectedAddQuantities)
        .filter(([_, cant]) => parseFloat(cant) > 0)
        .map(([detId, cant]) => ({
          detalle_venta_id: Number(detId),
          cantidad_adicional: parseFloat(cant)
        }));

      if (itemsPayload.length === 0) {
        showToast('Debe especificar al menos un producto con cantidad adicional mayor a cero.', 'error');
        setSubmitting(false);
        return;
      }
      payload.items = itemsPayload;
    }

    try {
      const res = await documentosElectronicosService.prepararND(payload);

      if (res && res.status && res.data) {
        setDocND(res.data);
        setStep('prepared');
        showToast(res.message || 'Nota Débito preparada exitosamente.', 'success');
      } else {
        const errorText = res?.message || 'No se pudo preparar la Nota Débito.';
        setErrorMessage(errorText);
        showToast(errorText, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error al conectar con el servidor para preparar la Nota Débito.';
      setErrorMessage(text);
      showToast(text, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Transmitir la Nota Débito a DIAN / MATIAS
  const handleTransmitirND = async () => {
    const docId = docND?.datos_tecnicos?.documento_electronico_id || docND?.id;
    if (!docId) {
      showToast('No se encontró el ID del documento para transmitir.', 'error');
      return;
    }

    setTransmitting(true);
    setErrorMessage(null);

    try {
      const res = await documentosElectronicosService.transmitirND(docId);

      if (res && res.status && res.data) {
        setTransmissionResult(res.data);
        setStep('transmitted');
        if (res.data.exitoso || res.data.estado === 'emitido') {
          showToast(res.message || 'Nota Débito emitida correctamente ante la DIAN.', 'success');
          if (onSuccess) onSuccess();
        } else if (res.data.estado === 'rechazado') {
          showToast(res.message || 'Nota Débito fue rechazada por MATIAS / DIAN.', 'error');
        } else {
          showToast(res.message || 'La Nota Débito se encuentra pendiente de transmisión.', 'info');
        }
      } else {
        const text = res?.message || 'Error al transmitir la Nota Débito.';
        setErrorMessage(text);
        showToast(text, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error de conexión al transmitir la Nota Débito.';
      setErrorMessage(text);
      showToast(text, 'error');
    } finally {
      setTransmitting(false);
    }
  };

  // 3. Reintentar transmisión de la Nota Débito
  const handleReintentarND = async () => {
    const docId = docND?.datos_tecnicos?.documento_electronico_id || docND?.id;
    if (!docId) {
      showToast('No se encontró el ID del documento para reintentar.', 'error');
      return;
    }

    setTransmitting(true);
    setErrorMessage(null);

    try {
      const res = await documentosElectronicosService.reintentarND(docId);

      if (res && res.status && res.data) {
        setTransmissionResult(res.data);
        setStep('transmitted');
        if (res.data.exitoso || res.data.estado === 'emitido') {
          showToast(res.message || 'Nota Débito emitida correctamente tras el reintento.', 'success');
          if (onSuccess) onSuccess();
        } else if (res.data.estado === 'rechazado') {
          showToast(res.message || 'Nota Débito fue rechazada por la DIAN.', 'error');
        } else {
          showToast(res.message || 'Proceso de reintento ejecutado. Estado actual: ' + (res.data.estado || 'pendiente'), 'info');
        }
      } else {
        const text = res?.message || 'Error al reintentar la transmisión de la Nota Débito.';
        setErrorMessage(text);
        showToast(text, 'error');
      }
    } catch (error) {
      const text = error?.message || 'Error de conexión al reintentar la Nota Débito.';
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
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">
                Crear Nota Débito Electrónica
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ajuste de incremento / Recargo fiscal a Factura Electrónica
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
            <form onSubmit={handlePrepararND} className="space-y-5">
              
              <div className="space-y-4">
                {/* Selector Tipo de Ajuste */}
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
                          ? 'bg-white text-blue-600 shadow-sm' 
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
                          ? 'bg-white text-blue-600 shadow-sm' 
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
                      const found = MOTIVOS_ND.find(m => m.id === selId);
                      if (found) setMotivo(found.label.split(' - ')[1]);
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all uppercase"
                  >
                    {MOTIVOS_ND.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {tipoAjuste === 'valor' ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1.5">
                      Monto de Incremento / Recargo a Cobrar ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Escriba el monto adicional de incremento..."
                      value={valorAjusteAdicional}
                      onChange={(e) => setValorAjusteAdicional(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Selección de Cantidades Adicionales a Incremento
                    </span>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/60 border-b border-slate-100">
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase">Producto</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-center">Precio Unit.</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-center w-28">Cant. Adicional</th>
                            <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-right">Subtotal Recargo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sale.detalles && sale.detalles.length > 0 ? (
                            sale.detalles.map((det) => {
                              const cantAdd = selectedAddQuantities[det.id] || 0;
                              const price = parseFloat(det.precio_unitario || 0);
                              const subtotalLine = cantAdd * price;

                              return (
                                <tr key={det.id}>
                                  <td className="p-3">
                                    <p className="font-bold text-slate-800 uppercase">{det.producto?.nombre || 'Producto'}</p>
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-700">
                                    {formatCurrency(price)}
                                  </td>
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={cantAdd}
                                      onChange={(e) => handleAddQuantityChange(det.id, e.target.value)}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-xl text-center text-xs font-black outline-none focus:border-blue-500 transition-all"
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
                    placeholder="Escriba el motivo del ajuste o recargo..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-blue-500 transition-all resize-none"
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
                    <span className="text-[9px] font-bold text-blue-400 uppercase block">Ajuste Nota Débito</span>
                    <span className="text-xs font-black text-blue-400 block mt-1">
                      +{formatCurrency(adicion)}
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
                  <p>• Se generará una Nota Débito Electrónica por el valor de incremento de {formatCurrency(adicion)}.</p>
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
                  disabled={submitting || !motivo.trim() || adicion <= 0}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  {submitting ? 'Preparando Nota...' : 'Preparar Nota Débito'}
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
                  Nota Débito Preparada Exitosamente
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  El documento electrónico ha sido creado en estado <strong className="text-amber-600 uppercase">Pendiente</strong> y está listo para ser transmitido a la DIAN.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3 text-xs max-w-lg mx-auto">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-500 uppercase">Consecutivo Reservado:</span>
                  <span className="font-black text-slate-800 uppercase text-sm">
                    {docND?.numero_nota_debito || (docND?.datos_tecnicos?.prefijo ? `${docND.datos_tecnicos.prefijo}${docND.datos_tecnicos.consecutivo}` : 'ND-PENDIENTE')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Estado Inicial:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200">
                    {docND?.estado || 'pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Factura Referencia:</span>
                  <span className="font-bold text-slate-700">{sale.prefijo}-{sale.numero_factura}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase">Monto Incremento Nota:</span>
                  <span className="font-black text-blue-600">+{formatCurrency(adicion)}</span>
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
                  onClick={handleTransmitirND}
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
                      Nota Débito Emitida Exitosamente
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      La Nota Débito fue aceptada y firmada electrónicamente ante la DIAN mediante MATIAS API.
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 text-left space-y-3 text-xs max-w-lg mx-auto">
                    <div className="flex justify-between items-center border-b border-emerald-200/80 pb-2">
                      <span className="font-bold text-emerald-800 uppercase">Número Nota:</span>
                      <span className="font-black text-emerald-900 text-sm uppercase">
                        {transmissionResult.numero_nota_debito || transmissionResult.numero_factura || 'Emitida'}
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
                      Nota Débito Rechazada
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
                    onClick={handleReintentarND}
                    disabled={transmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
