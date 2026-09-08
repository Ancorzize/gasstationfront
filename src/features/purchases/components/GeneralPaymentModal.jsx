import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../../suppliers/services/supplierService'; 
import { useToast } from '../../../context/ToastContext';
import { cashService } from '../../cash/services/cashService';

export const GeneralPaymentModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCajas, setLoadingCajas] = useState(true);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  
  const [cajas, setCajas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [resultadoDistribucion, setResultadoDistribucion] = useState(null);

  const [formData, setFormData] = useState({
    proveedor_id: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    monto: '',
    metodo_pago: 'efectivo',
    caja_id: '',
    observacion: ''
  });

  const [montoDisplay, setMontoDisplay] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCajas();
      loadProveedores();
      setFormData({
        proveedor_id: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        monto: '',
        metodo_pago: 'efectivo',
        caja_id: '',
        observacion: ''
      });
      setMontoDisplay('');
      setResultadoDistribucion(null);
    }
  }, [isOpen]);

  const loadCajas = async () => {
    setLoadingCajas(true);
    try {
      const res = await cashService.getCurrentCash();
      
      if (res.status && Array.isArray(res.data)) {
        setCajas(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, caja_id: res.data[0].id.toString() }));
        }
      }
    } catch (e) {
        console.log(e);
      showToast("Error al cargar las cajas", "error");
    } finally {
      setLoadingCajas(false);
    }
  };

  const loadProveedores = async () => {
    setLoadingProveedores(true);
    try {
      
      const res = await supplierService.getSuppliers({ per_page: 1000 });
      if (res.status && res.data && Array.isArray(res.data.items)) {
        setProveedores(res.data.items);
      } else if (Array.isArray(res)) {
        setProveedores(res);
      }
    } catch (e) {
      showToast("Error al cargar proveedores", "error");
    } finally {
      setLoadingProveedores(false);
    }
  };

  const handleMontoChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.,]/g, '');

    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    let cleanVal = value.replace(/\./g, '');
    
    if (cleanVal.includes(',')) {
      const [integerPart, decimalPart] = cleanVal.split(',');
      const formattedInteger = integerPart ? Number(integerPart).toLocaleString('es-CO') : '';
      value = formattedInteger !== '' ? `${formattedInteger},${decimalPart}` : `,${decimalPart}`;
      
      const numericVal = parseFloat(`${integerPart || 0}.${decimalPart}`);
      setFormData(prev => ({ ...prev, monto: isNaN(numericVal) ? '' : numericVal }));
    } else {
      const formattedInteger = cleanVal ? Number(cleanVal).toLocaleString('es-CO') : '';
      value = formattedInteger;
      
      const numericVal = parseFloat(cleanVal);
      setFormData(prev => ({ ...prev, monto: isNaN(numericVal) ? '' : numericVal }));
    }

    setMontoDisplay(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.proveedor_id) {
      return showToast("Debe seleccionar un proveedor", "error");
    }
    if (!formData.caja_id) {
      return showToast("Debe seleccionar una caja", "error");
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      return showToast("Debe ingresar un monto válido", "error");
    }

    setLoading(true);
    try {
      const res = await purchaseService.registrarPagoProveedor(formData);
      if (res && (res.status !== false)) {
        showToast("Abono general registrado correctamente", "success");
        if (res.distribucion || res.data?.distribucion) {
          setResultadoDistribucion(res.distribucion || res.data.distribucion);
        } else {
          onSave();
          onClose();
        }
      } else { 
        showToast(res.message || "Error al registrar el abono", "error"); 
      }
    } catch (e) { 
      showToast("Error de conexión al procesar el abono", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFinish = () => {
    onSave();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">Abono General a Proveedor</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Distribución automática por antigüedad</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {resultadoDistribucion ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase">¡Abono aplicado exitosamente!</h4>
                      <p className="text-[10px] font-bold text-emerald-700">El monto se ha distribuido correctamente entre las facturas pendientes.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de distribución:</h5>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {resultadoDistribucion.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-black text-slate-800 uppercase block">{item.numero_documento}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Aplicado: $ {parseFloat(item.monto_aplicado).toLocaleString('es-CO')}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${item.estado_pago === 'pagado' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                            {item.estado_pago}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleFinish} className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all">
                    Entendido / Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} id="abono-general-form" className="space-y-4">
                  {/* Proveedor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
                    <select
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900"
                      value={formData.proveedor_id}
                      onChange={e => setFormData({...formData, proveedor_id: e.target.value})}
                      disabled={loadingProveedores}
                    >
                      <option value="">Seleccione un proveedor...</option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre} {prov.nit ? `- NIT: ${prov.nit}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Caja Destino */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Caja Destino</label>
                    <select
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900"
                      value={formData.caja_id}
                      onChange={e => setFormData({...formData, caja_id: e.target.value})}
                      disabled={loadingCajas}
                    >
                      <option value="">Seleccione una caja...</option>
                      {cajas.map((caja) => (
                        <option key={caja.id} value={caja.id}>
                          {caja.nombre} - {caja.tipo_caja}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monto */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Monto del Abono</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={16} />
                      <input 
                        required 
                        type="text" 
                        inputMode="decimal"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-zinc-900"
                        value={montoDisplay} 
                        onChange={handleMontoChange} 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  {/* Fecha y Método */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Pago</label>
                      <input type="date" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                        value={formData.fecha_pago} onChange={e => setFormData({...formData, fecha_pago: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Método de Pago</label>
                      <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-zinc-900"
                        value={formData.metodo_pago} onChange={e => setFormData({...formData, metodo_pago: e.target.value})}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="consignacion">Consignación</option>
                        <option value="qr">QR</option>
                        <option value="datafono">Datáfono</option>
                      </select>
                    </div>
                  </div>

                  {/* Observación */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observación (Opcional)</label>
                    <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 h-20 resize-none"
                      value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Detalle del abono general..." />
                  </div>

                  <button type="submit" disabled={loading || loadingCajas || loadingProveedores} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2 mt-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Registrar Abono General"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};