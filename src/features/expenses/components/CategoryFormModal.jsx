import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlignLeft, Edit3 } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';

export const CategoryFormModal = ({ isOpen, onClose, onSave, categoryToEdit = null }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setFormData({
          nombre: categoryToEdit.nombre || '',
          descripcion: categoryToEdit.descripcion || ''
        });
      } else {
        setFormData({ nombre: '', descripcion: '' });
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = categoryToEdit 
        ? await expenseService.updateCategory(categoryToEdit.id, formData)
        : await expenseService.createCategory(formData);

      if (result.status) {
        showToast(categoryToEdit ? "Categoría actualizada" : "Categoría creada", "success");
        onSave();
        onClose();
      } else {
        showToast(result.message || "Error en la operación", "error");
      }
    } catch (err) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-md md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${categoryToEdit ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-600'}`}>
                  {categoryToEdit ? <Edit3 size={18} /> : <Layers size={18} />}
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase">
                  {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>


            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 custom-scrollbar-light">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre de Categoría</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 outline-none transition-all font-medium"
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                    placeholder="Ej: Nómina, Servicios..." 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción (Opcional)</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 text-slate-300" size={16} />
                  <textarea 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 outline-none h-32 resize-none transition-all"
                    placeholder="¿Para qué es esta categoría?" 
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                  />
                </div>
              </div>

      
              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs uppercase hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-[10px] md:text-xs hover:bg-black transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-zinc-200"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save size={16} />
                      {categoryToEdit ? "Actualizar Cambios" : "Guardar Categoría"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};