import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, ShieldCheck, Save, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { profileService } from '../services/profileService';
import { useToast } from '../../../context/ToastContext';

export const ProfilePage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Cargamos los datos iniciales del localStorage (donde se guardan al hacer login)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación Frontend: Si intenta cambiar password, validar longitud
    if (formData.password && formData.password.length < 8) {
      return showToast("La nueva contraseña debe tener al menos 8 caracteres", "error");
    }

    if (formData.password !== formData.password_confirmation) {
      return showToast("Las contraseñas no coinciden", "error");
    }

    setLoading(true);
    try {
      // Limpiamos los campos de password si están vacíos para no enviarlos innecesariamente
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.current_password;
        delete dataToSend.password;
        delete dataToSend.password_confirmation;
      }

      const res = await profileService.updateProfile(dataToSend);

      if (res.status) {
        showToast(res.message, "success");
        // Actualizamos el usuario en el storage para que el nombre cambie en el sidebar/header
        localStorage.setItem('user', JSON.stringify(res.data));
        
        // Limpiamos campos de password por seguridad
        setFormData(prev => ({
          ...prev,
          current_password: '',
          password: '',
          password_confirmation: ''
        }));
      } else {
        showToast(res.message || "Error al actualizar", "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            <User className="text-yellow-500" size={28} /> Mi Perfil
          </h2>
          <p className="text-slate-500 text-sm italic font-medium">Actualiza tu información personal y seguridad.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={14} /> Información de Cuenta
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    required name="name" value={formData.name} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-yellow-500 focus:bg-white outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    required type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-yellow-500 focus:bg-white outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" disabled={loading}
              className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Columna Derecha: Seguridad */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lock size={80} />
            </div>

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock size={14} className="text-yellow-500" /> Seguridad
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contraseña Actual</label>
                <input 
                  type={showPass ? "text" : "password"} name="current_password" 
                  value={formData.current_password} onChange={handleChange}
                  placeholder="Requerida para cambios"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPass ? "text" : "password"} name="password" 
                    value={formData.password} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" 
                  />
                  <button 
                    type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Confirmar Nueva</label>
                <input 
                  type={showPass ? "text" : "password"} name="password_confirmation" 
                  value={formData.password_confirmation} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="pt-2 flex items-start gap-2 text-[9px] text-slate-400 uppercase font-bold leading-tight">
              <AlertCircle size={12} className="text-yellow-500 shrink-0" />
              <span>Deja estos campos en blanco si no deseas cambiar tu contraseña.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};