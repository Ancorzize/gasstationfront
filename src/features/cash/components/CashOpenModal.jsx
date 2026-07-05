import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LockOpen, Save, Loader2 } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashOpenModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [destinos, setDestinos] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_caja: 'efectivo',
    destino_recaudo_id: '',
    monto_apertura: '',
    observacion_apertura: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ nombre: '', tipo_caja: 'efectivo', destino_recaudo_id: '', monto_apertura: '', observacion_apertura: '' });
      cashService.getDestinosRecaudo(true)
        .then(res => {
          if (res.status) setDestinos(res.data.items);
        })
        .catch(() => showToast("Error al cargar destinos", "error"));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await cashService.openCash(formData);
      if (res.status) {
        showToast("Caja abierta correctamente", "success");
        onSave(); onClose();
      } else {
        showToast(res.message || "Error al abrir", "error");
      }
    } catch (e) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <LockOpen size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight">Apertura de Caja</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nombre de la Caja</label>
                <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:border-emerald-500"
                  placeholder="Ej: Combustible Efectivo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tipo</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none" 
                    onChange={e => setFormData({...formData, tipo_caja: e.target.value})}>
                    <option value="efectivo">Efectivo</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Destino</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none" 
                    onChange={e => setFormData({...formData, destino_recaudo_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Monto Inicial</label>
                <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-emerald-500"
                  placeholder="0" value={formData.monto_apertura} onChange={e => setFormData({...formData, monto_apertura: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Abrir Caja</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};