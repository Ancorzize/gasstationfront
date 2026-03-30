import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Lock, Shield } from 'lucide-react';
import { userService } from '../services/userService';
import { useToast } from '../../../context/ToastContext';

export const UserModal = ({ isOpen, onClose, onSave, userToEdit = null }) => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Cargar roles y resetear errores al abrir
      fetchRoles();
      setError(null);
      
      if (userToEdit) {
        setFormData({
          name: userToEdit.name,
          email: userToEdit.email,
          password: '', 
          role: userToEdit.roles[0] || ''
        });
      } else {
        setFormData({ name: '', email: '', password: '', role: '' });
      }
    }
  }, [isOpen, userToEdit]);

  const fetchRoles = async () => {
    try {
      const res = await userService.getRoles();
      // Ajusta según tu API: res.data o res
      setRoles(res.data || res); 
    } catch (err) {
      console.error("Error al cargar roles");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (userToEdit) {
        result = await userService.updateUser(userToEdit.id, formData);
      } else {
        result = await userService.createUser(formData);
      }

      if (result.status) {
        showToast(userToEdit ? "Usuario actualizado" : "Usuario creado con éxito", "success");
        onSave(); // Recarga la lista en el padre
        onClose(); // Cierra el modal
      } else {
        // Manejo de errores de validación de Laravel
        const errorMsg = result.message || "Error en la operación";
        setError(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err) {
      showToast("Error de conexión con el servidor", "error");
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

 return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay con Blur */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />

          {/* Contenedor del Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Header dinámico */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-tight">
                <User size={18} className="text-yellow-500" /> 
                {userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Campo: Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    required 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500 transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              {/* Campo: Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    required 
                    type="email" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500 transition-all" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              {/* Grid: Password y Rol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      type="password" 
                      placeholder={userToEdit ? "Opcional..." : "••••••••"}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500 transition-all" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required={!userToEdit}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rol</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 text-slate-400" size={16} />
                    <select 
                      required 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer" 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="">Seleccionar...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[10px] hover:bg-slate-50 transition-colors uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-[10px] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 uppercase"
                >
                  {loading ? "Procesando..." : (userToEdit ? "Actualizar" : "Guardar")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};