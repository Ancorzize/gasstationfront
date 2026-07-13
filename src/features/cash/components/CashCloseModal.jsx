import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, Loader2, AlertTriangle } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashCloseModal = ({ isOpen, onClose, summary, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [montos, setMontos] = useState({}); 
  const [displayValues, setDisplayValues] = useState({}); 
  const [observacion, setObservacion] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const cajas = Array.isArray(summary) ? summary : [];

  useEffect(() => {
    if (isOpen) {
      setMontos({});
      setDisplayValues({});
      setObservacion('');
      setShowConfirm(false);
    }
  }, [isOpen]);

  const formatDisplay = (val) => {
    const clean = val.toString().replace(/\D/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat('es-CO').format(parseInt(clean, 10));
  };

  const handleMontoChange = (id, val) => {
    const numericValue = val.replace(/\./g, "");
    
    setMontos(prev => ({ ...prev, [id]: parseFloat(numericValue) || 0 }));
    setDisplayValues(prev => ({ ...prev, [id]: formatDisplay(numericValue) }));
  };

  const getBorderColor = (cajaId, valorNumerico) => {
    if (valorNumerico === undefined || valorNumerico === 0) return "border-slate-200";
    const saldoSistema = parseFloat(cajas.find(c => c.id === cajaId)?.saldo_sistema || 0);
    
    return valorNumerico === saldoSistema 
      ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50" 
      : "border-rose-500 ring-1 ring-rose-500 bg-rose-50";
  };

  const executeClosing = async () => {
    setLoading(true);
    try {
      const payload = {
        cierres: cajas.map(c => ({
          caja_id: c.id,
          monto_real: montos[c.id] || 0
        })),
        observacion_cierre: observacion
      };

      const res = await cashService.closeCash(payload);
      if (res.status) {
        showToast("Cajas cerradas exitosamente", "success");
        onSave();
        onClose();
      } else {
        showToast(res.message || "Error al procesar el cierre", "error");
        setShowConfirm(false);
      }
    } catch (e) {
      showToast("Error al procesar el cierre", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Power size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Arqueo de Cajas</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conciliación de saldos</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar-light">
              {cajas.map((caja) => (
                <div key={caja.id} className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{caja.nombre}</h4>
                    <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Sistema: ${Number(caja.saldo_sistema).toLocaleString('es-CO')}
                    </span>
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="Monto real contado" 
                    className={`w-full px-5 py-4 bg-white border rounded-2xl text-md font-black outline-none transition-all ${getBorderColor(caja.id, montos[caja.id])}`}
                    value={displayValues[caja.id] || ''}
                    onChange={(e) => handleMontoChange(caja.id, e.target.value)}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Observaciones</label>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-red-500 h-20 resize-none transition-all"
                  placeholder="Ej: Cierre de turno..."
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                />
              </div>

              <button onClick={() => setShowConfirm(true)} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-700 transition-all shadow-xl shadow-red-100">
                Ejecutar Cierre de Sesión
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase mb-2">Confirmar Cierre</h3>
                  <p className="text-xs text-slate-500 font-bold mb-8">¿Está seguro de cerrar todas las cajas? Esta acción no se puede deshacer.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                    <button onClick={executeClosing} disabled={loading} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">
                      {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirmar Cierre"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};