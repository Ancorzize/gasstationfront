import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Smartphone, MapPin, Contact2, Mail } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useToast } from '../../../context/ToastContext';

export const ClientModal = ({ isOpen, onClose, onSave, clientToEdit = null }) => {
  const [formData, setFormData] = useState({ 
    nombre: '', apellidos: '', documento: '', telefono_uno: '',  telefono_dos: '', email: '', direccion: '' 
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setFormData({
          nombre: clientToEdit.nombre || '',
          apellidos: clientToEdit.apellidos || '',
          documento: clientToEdit.documento || '',
          telefono_uno: clientToEdit.telefono_uno || '',
          telefono_dos: clientToEdit.telefono_dos || '',
          email: clientToEdit.email || '',
          direccion: clientToEdit.direccion || ''
        });
      } else {
        setFormData({ nombre: '', apellidos: '', documento: '', telefono_uno: '',  telefono_dos: '', email: '', direccion: '' });
      }
    }
  }, [isOpen, clientToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = clientToEdit 
        ? await clientService.updateClient(clientToEdit.id, formData)
        : await clientService.createClient(formData);

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
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          
          {/* Contenedor del Modal */}
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header Fijo */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <Contact2 size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                  {clientToEdit ? 'Editar Cliente' : 'Nuevo Registro'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Formulario con Scroll */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 custom-scrollbar-light">
              
              {/* Sección: Datos Personales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombres</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Luis" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apellidos</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} placeholder="Ej: Cordoba" />
                  </div>
                </div>
              </div>

              {/* Sección: Identificación y Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Documento / NIT</label>
                  <div className="relative">
                    <Contact2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} placeholder="C.C o NIT" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input type="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="usuario@correo.com" />
                  </div>
                </div>
              </div>

              {/* Sección: Teléfonos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono Principal</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.telefono_uno} onChange={e => setFormData({...formData, telefono_uno: e.target.value})} placeholder="300..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono Secundario</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.telefono_dos} onChange={e => setFormData({...formData, telefono_dos: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Sección: Dirección */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección de Residencia/Empresa</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Calle, Barrio, Ciudad..." />
                </div>
              </div>

              {/* Botones de Acción (Fijos al final en móvil) */}
              <div className="pt-6 pb-2 md:pb-0 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 uppercase">
                  {loading ? "Procesando..." : (clientToEdit ? "Actualizar Datos" : "Registrar Cliente")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};