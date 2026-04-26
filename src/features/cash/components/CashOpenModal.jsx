import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LockOpen, Banknote, Save, Loader2, AlignLeft, CreditCard } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashOpenModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [displayEfectivo, setDisplayEfectivo] = useState('');
  const [displayDigital, setDisplayDigital] = useState('');
  
  const [formData, setFormData] = useState({
    monto_apertura_efectivo: '',
    monto_apertura_digital: '',
    observacion_apertura: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        monto_apertura_efectivo: '', 
        monto_apertura_digital: '', 
        observacion_apertura: '' 
      });
      setDisplayEfectivo('');
      setDisplayDigital('');
    }
  }, [isOpen]);

  const handleMoneyChange = (e, field) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    
    if (rawValue === '') {
      field === 'efectivo' ? setDisplayEfectivo('') : setDisplayDigital('');
      setFormData(prev => ({ 
        ...prev, 
        [field === 'efectivo' ? 'monto_apertura_efectivo' : 'monto_apertura_digital']: '' 
      }));
      return;
    }

    const formatted = new Intl.NumberFormat('es-CO').format(rawValue);
    
    if (field === 'efectivo') {
      setDisplayEfectivo(formatted);
      setFormData(prev => ({ ...prev, monto_apertura_efectivo: rawValue }));
    } else {
      setDisplayDigital(formatted);
      setFormData(prev => ({ ...prev, monto_apertura_digital: rawValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const efectivo = parseFloat(formData.monto_apertura_efectivo || 0);
    const digital = parseFloat(formData.monto_apertura_digital || 0);

    if (efectivo < 0 || digital < 0) {
      return showToast("Los montos de apertura deben ser 0 o superiores", "error");
    }

    setLoading(true);
    try {
      const res = await cashService.openCash({
        efectivo: efectivo,
        digital: digital,
        observacion: formData.observacion_apertura
      });

      if (res.status) {
        showToast(res.message || "Cajas abiertas correctamente", "success");
        onSave(); 
        onClose();
      } else {
        showToast(res.message || "Error al abrir cajas", "error");
      }
    } catch (e) {
      showToast("Error de conexión al abrir cajas", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <LockOpen size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight">Apertura de Cajas</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar-light">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                  Monto Inicial Efectivo
                </label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    required 
                    type="text"
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="0"
                    value={displayEfectivo}
                    onChange={(e) => handleMoneyChange(e, 'efectivo')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                  Monto Inicial Digital
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    required 
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="0"
                    value={displayDigital}
                    onChange={(e) => handleMoneyChange(e, 'digital')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                  Observaciones de Apertura
                </label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 text-slate-300" size={18} />
                  <textarea 
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all h-24 resize-none"
                    placeholder="Ej: Inicio de jornada..."
                    value={formData.observacion_apertura}
                    onChange={e => setFormData({...formData, observacion_apertura: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Abrir Cajas</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};