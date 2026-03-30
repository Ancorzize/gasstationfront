import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, AlignLeft } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { useToast } from '../../../context/ToastContext';

export const CategoryModal = ({ isOpen, onClose, onSave, categoryToEdit = null }) => {
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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
        ? await categoryService.updateCategory(categoryToEdit.id, formData)
        : await categoryService.createCategory(formData);

      if (result.status) {
        showToast(result.message, "success");
        onSave();
        onClose();
      } else {
        showToast(result.message, "error");
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-md md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Layers size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                  {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 transition-all outline-none"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Aceites, Filtros..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <textarea 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 transition-all outline-none min-h-[120px] resize-none"
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                    placeholder="¿Qué productos incluye esta categoría?"
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl uppercase">
                  {loading ? "Cargando..." : (categoryToEdit ? "Actualizar" : "Crear Categoría")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};