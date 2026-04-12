import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Hash, User, Phone, MapPin, AlignLeft, Star, Loader2 } from 'lucide-react';
import { warehouseService } from '../services/warehouseService';
import { userService } from '../../users/services/userService';
import { useToast } from '../../../context/ToastContext';

export const WarehouseModal = ({ isOpen, onClose, onSave, warehouseToEdit = null }) => {
  const [formData, setFormData] = useState({
    nombre: '', codigo: '', descripcion: '', direccion: '',
    telefono: '', responsable_id: '', is_principal: false
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (warehouseToEdit) {
        setFormData({
          nombre: warehouseToEdit.nombre || '',
          codigo: warehouseToEdit.codigo || '',
          descripcion: warehouseToEdit.descripcion || '',
          direccion: warehouseToEdit.direccion || '',
          telefono: warehouseToEdit.telefono || '',
          responsable_id: warehouseToEdit.responsable_id || '',
          is_principal: !!warehouseToEdit.is_principal
        });
      } else {
        setFormData({
          nombre: '', codigo: '', descripcion: '', direccion: '',
          telefono: '', responsable_id: '', is_principal: false
        });
      }
    }
  }, [isOpen, warehouseToEdit]);

  const loadUsers = async () => {
    const res = await userService.getUsers();
    if (res.items) setUsers(res.items);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = { ...formData, responsable_id: formData.responsable_id || null };
      const result = warehouseToEdit 
        ? await warehouseService.updateWarehouse(warehouseToEdit.id, dataToSend)
        : await warehouseService.createWarehouse(dataToSend);

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
            className="relative bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                  <Home size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">{warehouseToEdit ? 'Editar Bodega' : 'Nueva Bodega'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestión de puntos de almacenamiento</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar-light">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Código Identificador</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <input required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none transition-all"
                      value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} placeholder="BOD-001" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre de Bodega</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none transition-all"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Bodega Central" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción / Notas</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <textarea className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none h-24 resize-none"
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Detalles sobre la bodega..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dirección Física</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <input className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none"
                      value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono de Contacto</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <input className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none"
                      value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Usuario Responsable</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <select className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-zinc-900 appearance-none"
                    value={formData.responsable_id} onChange={e => setFormData({...formData, responsable_id: e.target.value})}>
                    <option value="">Sin Responsable Asignado</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between
                ${formData.is_principal ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                onClick={() => setFormData({...formData, is_principal: !formData.is_principal})}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.is_principal ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Star size={16} fill={formData.is_principal ? "white" : "none"} />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase ${formData.is_principal ? 'text-yellow-700' : 'text-slate-500'}`}>Marcar como Principal</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Solo puede existir una bodega principal en el sistema</p>
                  </div>
                </div>
                <input type="checkbox" className="hidden" checked={formData.is_principal} readOnly />
                <div className={`w-12 h-6 rounded-full relative transition-all ${formData.is_principal ? 'bg-yellow-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_principal ? 'left-7' : 'left-1'}`} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-slate-100 text-slate-500 font-black text-[10px] uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : (warehouseToEdit ? "Actualizar Bodega" : "Guardar Bodega")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};