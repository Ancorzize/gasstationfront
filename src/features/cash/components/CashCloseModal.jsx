import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, Banknote, Save, Loader2, AlertCircle, Calculator } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashCloseModal = ({ isOpen, onClose, summary, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [montoReal, setMontoReal] = useState('');
  const [observacion, setObservacion] = useState('');

  // Cálculo de diferencia en tiempo real
  const saldoSistema = summary?.saldo_efectivo_sistema || 0;
  const diferencia = montoReal !== '' ? parseFloat(montoReal) - saldoSistema : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (montoReal === '') return showToast("Debe ingresar el monto físico contado", "error");

    if (!window.confirm("¿Está seguro de cerrar la caja? Esta acción no se puede deshacer.")) return;

    setLoading(true);
    try {
      const res = await cashService.closeCash({
        monto_cierre_real: parseFloat(montoReal),
        observacion_cierre: observacion
      });

      if (res.success) {
        showToast("Caja cerrada exitosamente", "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b flex justify-between items-center bg-red-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                  <Power size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Arqueo y Cierre</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verificación de saldos finales</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Comparativa de Saldos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest text-center">Saldo en Sistema</p>
                  <p className="text-xl font-black text-slate-700 text-center tracking-tighter">
                    $ {saldoSistema.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className={`p-4 rounded-3xl border transition-colors ${
                  diferencia === 0 ? 'bg-slate-50 border-slate-100' : 
                  diferencia > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                  'bg-red-50 border-red-100 text-red-700'
                }`}>
                  <p className="text-[9px] font-black uppercase mb-1 tracking-widest text-center opacity-70">Diferencia</p>
                  <p className="text-xl font-black text-center tracking-tighter">
                    {diferencia > 0 ? '+' : ''} $ {diferencia.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Dinero Físico Contado (Efectivo)</label>
                  <div className="relative">
                    <Calculator className="absolute left-5 top-4 text-slate-300" size={20} />
                    <input 
                      required type="number" step="any" autoFocus
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-lg font-black outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-inner"
                      placeholder="Ingrese el monto real..."
                      value={montoReal}
                      onChange={e => setMontoReal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Novedades del Cierre</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs outline-none focus:border-zinc-900 focus:bg-white transition-all h-24 resize-none"
                    placeholder="Ej: Se dejó base para mañana de $50.000..."
                    value={observacion}
                    onChange={e => setObservacion(e.target.value)}
                  />
                </div>
              </div>

              {diferencia !== 0 && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${diferencia < 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase leading-tight">
                    {diferencia < 0 
                      ? "Atención: Existe un faltante de dinero respecto al saldo calculado por el sistema."
                      : "Nota: Existe un sobrante de dinero en la caja física."}
                  </p>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Power size={20}/> Realizar Cierre Definitivo</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};