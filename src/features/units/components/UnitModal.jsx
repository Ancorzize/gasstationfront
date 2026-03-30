import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Type, AlignLeft } from 'lucide-react';
import { unitService } from '../services/unitService';
import { useToast } from '../../../context/ToastContext';

export const UnitModal = ({ isOpen, onClose, onSave, unitToEdit = null }) => {
  const [formData, setFormData] = useState({ nombre: '', abreviatura: '', descripcion: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (unitToEdit) {
        setFormData({
          nombre: unitToEdit.nombre || '',
          abreviatura: unitToEdit.abreviatura || '',
          descripcion: unitToEdit.descripcion || ''
        });
      } else {
        setFormData({ nombre: '', abreviatura: '', descripcion: '' });
      }
    }
  }, [isOpen, unitToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = unitToEdit 
        ? await unitService.updateUnit(unitToEdit.id, formData)
        : await unitService.createUnit(formData);

      if (result.status) {
        showToast(result.message, "success");
        onSave();
        onClose();
      } else {
        showToast(result.message || "Error en la validación", "error");
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
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <Ruler size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                  {unitToEdit ? 'Editar Unidad' : 'Nueva Unidad'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                  <div className="relative">
                    <Ruler className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none"
                      value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Litro" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Abr.</label>
                  <div className="relative">
                    <Type className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none text-center"
                      value={formData.abreviatura} onChange={e => setFormData({...formData, abreviatura: e.target.value.toUpperCase()})} placeholder="L" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <textarea 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none min-h-[100px] resize-none"
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                    placeholder="Uso de esta unidad..."
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl uppercase">
                  {loading ? "..." : (unitToEdit ? "Actualizar" : "Guardar")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};