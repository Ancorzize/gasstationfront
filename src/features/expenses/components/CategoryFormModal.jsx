import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlignLeft } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';

export const CategoryFormModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await expenseService.createCategory(formData);
      if (res.status) {
        showToast("Categoría creada", "success");
        onSave();
        onClose();
        setFormData({ nombre: '', descripcion: '' });
      } else {
        showToast(res.message, "error");
      }
    } catch (e) { showToast("Error al crear categoría", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                <Layers size={18} className="text-zinc-400" /> Nueva Categoría
              </h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre de Categoría</label>
                <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  placeholder="Ej: Nómina, Servicios..." value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción (Opcional)</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <textarea className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 h-24 resize-none"
                    placeholder="¿Para qué es esta categoría?" value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black flex items-center justify-center gap-2 transition-all shadow-xl">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Guardar Categoría</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};