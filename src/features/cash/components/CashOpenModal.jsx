import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LockOpen, Banknote, Save, Loader2 } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashOpenModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monto_apertura: '',
    observacion_apertura: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto_apertura || formData.monto_apertura < 0) {
      return showToast("El monto de apertura debe ser 0 o superior", "error");
    }

    setLoading(true);
    try {
      const res = await cashService.openCash(formData);
      if (res.success) {
        showToast(res.message, "success");
        onSave(); // Refresca la página de caja
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Error de conexión al abrir caja", "error");
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
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                  <LockOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">Apertura de Caja</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inicio de jornada laboral</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Monto Inicial en Efectivo</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    required 
                    type="number" 
                    step="any"
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-zinc-900 focus:bg-white transition-all"
                    placeholder="0.00"
                    value={formData.monto_apertura}
                    onChange={e => setFormData({...formData, monto_apertura: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones</label>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 focus:bg-white transition-all h-24 resize-none"
                  placeholder="Ej: Base de caja recibida del turno anterior..."
                  value={formData.observacion_apertura}
                  onChange={e => setFormData({...formData, observacion_apertura: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Abrir Caja Ahora</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};