import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Tag, FileText, Save } from 'lucide-react';
import { destinationService } from '../services/destinationService';
import { useToast } from '../../../context/ToastContext';

export const DestinationModal = ({ isOpen, onClose, onSave, destinoToEdit = null }) => {
  const [formData, setFormData] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData(destinoToEdit ? { ...destinoToEdit } : { codigo: '', nombre: '', descripcion: '' });
    }
  }, [isOpen, destinoToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = destinoToEdit 
        ? await destinationService.updateDestino(destinoToEdit.id, formData)
        : await destinationService.createDestino(formData);
      
      if (res.status) {
        showToast(res.message, "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch { showToast("Error al procesar", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-sm">{destinoToEdit ? 'Editar Destino' : 'Nuevo Destino'}</h3>
              <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código</label>
                  <input required maxLength={20} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                  <input required maxLength={100} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full py-4 bg-zinc-900 text-white font-bold text-xs rounded-2xl uppercase hover:bg-black">{loading ? "Guardando..." : "Guardar Registro"}</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};