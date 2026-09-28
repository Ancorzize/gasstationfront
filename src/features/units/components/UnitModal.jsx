import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Type, AlignLeft, Hash, Tag } from 'lucide-react';
import { unitService } from '../services/unitService';
import { useToast } from '../../../context/ToastContext';

export const UnitModal = ({ isOpen, onClose, onSave, unitToEdit = null }) => {
  const [formData, setFormData] = useState({ 
    nombre: '', 
    abreviatura: '', 
    descripcion: '',
    codigo_dian: '',
    simbolo_dian: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (unitToEdit) {
        setFormData({
          nombre: unitToEdit.nombre || '',
          abreviatura: unitToEdit.abreviatura || '',
          descripcion: unitToEdit.descripcion || '',
          codigo_dian: unitToEdit.codigo_dian || '',
          simbolo_dian: unitToEdit.simbolo_dian || ''
        });
      } else {
        setFormData({ 
          nombre: '', 
          abreviatura: '', 
          descripcion: '',
          codigo_dian: '',
          simbolo_dian: ''
        });
      }
    }
  }, [isOpen, unitToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    ['descripcion', 'codigo_dian', 'simbolo_dian'].forEach(field => {
      if (payload[field] === '' || payload[field] === undefined) {
        payload[field] = null;
      }
    });

    try {
      const result = unitToEdit 
        ? await unitService.updateUnit(unitToEdit.id, payload)
        : await unitService.createUnit(payload);

      if (result.status) {
        showToast(result.message, "success");
        onSave();
        onClose();
      } else {
        showToast(result.message || "Error en la validación", "error");
      }
    } catch {
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

            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar-light">
              
              {/* DATOS GENERALES */}
              <div className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none min-h-[80px] resize-none"
                      value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                      placeholder="Uso de esta unidad..."
                    />
                  </div>
                </div>
              </div>

              {/* DATOS DIAN (FACTURACIÓN ELECTRÓNICA) */}
              <div className="pt-2 space-y-3 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos DIAN (Facturación Electrónica)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código DIAN</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none"
                        value={formData.codigo_dian} onChange={e => setFormData({...formData, codigo_dian: e.target.value})} placeholder="Ej: 94" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Símbolo DIAN</label>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-orange-500 transition-all outline-none uppercase"
                        value={formData.simbolo_dian} onChange={e => setFormData({...formData, simbolo_dian: e.target.value.toUpperCase()})} placeholder="LTR" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
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