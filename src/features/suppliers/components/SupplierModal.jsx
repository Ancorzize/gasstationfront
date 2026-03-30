import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Hash, Phone, MapPin, Mail, Building } from 'lucide-react';
import { supplierService } from '../services/supplierService';
import { useToast } from '../../../context/ToastContext';

export const SupplierModal = ({ isOpen, onClose, onSave, supplierToEdit = null }) => {
  const [formData, setFormData] = useState({ 
    nombre: '', nit: '', telefono: '', direccion: '', email: '' 
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setFormData({
          nombre: supplierToEdit.nombre || '',
          nit: supplierToEdit.nit || '',
          telefono: supplierToEdit.telefono || '',
          direccion: supplierToEdit.direccion || '',
          email: supplierToEdit.email || ''
        });
      } else {
        setFormData({ nombre: '', nit: '', telefono: '', direccion: '', email: '' });
      }
    }
  }, [isOpen, supplierToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = supplierToEdit 
        ? await supplierService.updateSupplier(supplierToEdit.id, formData)
        : await supplierService.createSupplier(formData);

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
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Truck size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                  {supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Razón Social / Nombre</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-emerald-500 transition-all"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Distribuidora de Lubricantes" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">NIT</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-emerald-500 transition-all"
                      value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} placeholder="900.xxx.xxx-x" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-emerald-500 transition-all"
                      value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="300..." />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email de Contacto</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input type="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-emerald-500 transition-all"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ventas@proveedor.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-emerald-500 transition-all"
                    value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Calle, Barrio, Ciudad..." />
                </div>
              </div>

              <div className="pt-6 pb-2 md:pb-0 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl uppercase">
                  {loading ? "Procesando..." : (supplierToEdit ? "Actualizar Proveedor" : "Registrar Proveedor")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};