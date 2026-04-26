import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, Banknote, Save, Loader2, AlertCircle, Calculator, CreditCard } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashCloseModal = ({ isOpen, onClose, summary, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [montoRealEfectivo, setMontoRealEfectivo] = useState('');
  const [montoRealDigital, setMontoRealDigital] = useState('');
  const [observacion, setObservacion] = useState('');

  const saldoSistemaEfectivo = summary?.efectivo?.saldo_sistema || 0;
  const saldoSistemaDigital = summary?.digital?.saldo_sistema || 0;

  const diferenciaEfectivo = montoRealEfectivo !== '' ? parseFloat(montoRealEfectivo) - saldoSistemaEfectivo : 0;
  const diferenciaDigital = montoRealDigital !== '' ? parseFloat(montoRealDigital) - saldoSistemaDigital : 0;

  useEffect(() => {
    if (isOpen) {
      setMontoRealEfectivo('');
      setMontoRealDigital('');
      setObservacion('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (montoRealEfectivo === '' || montoRealDigital === '') {
      return showToast("Debe ingresar ambos montos reales (Efectivo y Digital)", "error");
    }

    if (!window.confirm("¿Está seguro de cerrar ambas cajas? Esta acción no se puede deshacer.")) return;

    setLoading(true);
    try {
      const res = await cashService.closeCash({
        efectivo: parseFloat(montoRealEfectivo),
        digital: parseFloat(montoRealDigital),
        observacion: observacion
      });

      if (res.status) {
        showToast("Cajas cerradas exitosamente", "success");
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
            className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b flex justify-between items-center bg-red-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                  <Power size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Arqueo y Cierre Global</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conciliación Efectivo y Digital</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar-light">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <Banknote size={14} /> Caja Efectivo
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema</p>
                    <p className="text-sm font-black text-slate-700">$ {saldoSistemaEfectivo.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Monto Real Físico</label>
                    <input 
                      required type="number" step="any"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-emerald-500 transition-all"
                      placeholder="0"
                      value={montoRealEfectivo}
                      onChange={e => setMontoRealEfectivo(e.target.value)}
                    />
                  </div>
                  <div className={`p-3 rounded-2xl border text-center ${diferenciaEfectivo === 0 ? 'bg-slate-50 border-slate-100' : diferenciaEfectivo > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <p className="text-[9px] font-black uppercase opacity-60">Diferencia Efectivo</p>
                    <p className="text-sm font-black">{diferenciaEfectivo > 0 ? '+' : ''} $ {diferenciaEfectivo.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={14} /> Caja Digital
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema</p>
                    <p className="text-sm font-black text-slate-700">$ {saldoSistemaDigital.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Monto Real Digital</label>
                    <input 
                      required type="number" step="any"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-blue-500 transition-all"
                      placeholder="0"
                      value={montoRealDigital}
                      onChange={e => setMontoRealDigital(e.target.value)}
                    />
                  </div>
                  <div className={`p-3 rounded-2xl border text-center ${diferenciaDigital === 0 ? 'bg-slate-50 border-slate-100' : diferenciaDigital > 0 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <p className="text-[9px] font-black uppercase opacity-60">Diferencia Digital</p>
                    <p className="text-sm font-black">{diferenciaDigital > 0 ? '+' : ''} $ {diferenciaDigital.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Novedades del Cierre</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs outline-none focus:border-zinc-900 transition-all h-20 resize-none"
                  placeholder="Observaciones de ambos arqueos..."
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Power size={20}/> Ejecutar Cierre de Sesión</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};