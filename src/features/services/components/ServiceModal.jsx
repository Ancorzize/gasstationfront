import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, Hash, DollarSign, Clock, Ruler, AlignLeft, Info } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { unitService } from '../../units/services/unitService';
import { useToast } from '../../../context/ToastContext';

export const ServiceModal = ({ isOpen, onClose, onSave, serviceToEdit = null }) => {
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', descripcion: '', precio: '',
    unidad_medida_id: '', permite_decimal: false, duracion_minutos: ''
  });

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUnits();
      if (serviceToEdit) {
        setFormData({
          codigo: serviceToEdit.codigo || '',
          nombre: serviceToEdit.nombre || '',
          descripcion: serviceToEdit.descripcion || '',
          precio: serviceToEdit.precio || '',
          unidad_medida_id: serviceToEdit.unidad_medida_id || '',
          permite_decimal: !!serviceToEdit.permite_decimal,
          duracion_minutos: serviceToEdit.duracion_minutos || ''
        });
      } else {
        setFormData({
          codigo: '', nombre: '', descripcion: '', precio: '',
          unidad_medida_id: '', permite_decimal: false, duracion_minutos: ''
        });
      }
    }
  }, [isOpen, serviceToEdit]);

  const loadUnits = async () => {
    const res = await unitService.getUnits('', true);
    if (res.status) setUnits(res.data.items);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Limpiar unidad_medida_id si es string vacío para enviar null
      const dataToSend = { ...formData, unidad_medida_id: formData.unidad_medida_id || null };
      const result = serviceToEdit 
        ? await serviceService.updateService(serviceToEdit.id, dataToSend)
        : await serviceService.createService(dataToSend);

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
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Wrench size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase">{serviceToEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 outline-none"
                      value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} placeholder="SRV-001" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 outline-none"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre del servicio" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <textarea className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 outline-none h-20 resize-none"
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-emerald-500" size={16} />
                    <input required type="number" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 outline-none"
                      value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Duración (Mins)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input type="number" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-blue-500 outline-none"
                      value={formData.duracion_minutos} onChange={e => setFormData({...formData, duracion_minutos: e.target.value})} placeholder="Ej: 30" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-xs">Unidad de Medida (Opcional)</label>
                <div className="relative">
                  <Ruler className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <select className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 appearance-none"
                    value={formData.unidad_medida_id} onChange={e => setFormData({...formData, unidad_medida_id: e.target.value})}>
                    <option value="">Precio Fijo (Sin Unidad)</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
                <input type="checkbox" id="decimal_srv" className="w-4 h-4 accent-blue-600"
                  checked={formData.permite_decimal} onChange={e => setFormData({...formData, permite_decimal: e.target.checked})} />
                <label htmlFor="decimal_srv" className="text-[10px] font-black text-blue-700 cursor-pointer flex items-center gap-2 uppercase tracking-tighter">
                  Permite cantidades decimales <Info size={12} />
                </label>
              </div>

              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 uppercase shadow-xl">
                  {loading ? "..." : (serviceToEdit ? "Actualizar" : "Guardar Servicio")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};