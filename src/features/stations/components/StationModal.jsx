import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Fuel, MapPin, Hash, Globe } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useToast } from '../../../context/ToastContext';

export const StationModal = ({ isOpen, onClose, onSave, stationToEdit }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    ciudad: ''
  });

  useEffect(() => {
    if (stationToEdit) {
      setFormData({
        nombre: stationToEdit.nombre || '',
        codigo: stationToEdit.codigo || '',
        direccion: stationToEdit.direccion || '',
        ciudad: stationToEdit.ciudad || ''
      });
    } else {
      setFormData({ nombre: '', codigo: '', direccion: '', ciudad: '' });
    }
  }, [stationToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await stationService.saveStation(formData, stationToEdit?.id);
      if (res.status) {
        showToast(res.message, "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al procesar la solicitud", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
              <Fuel size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {stationToEdit ? 'Editar Estación' : 'Nueva Estación'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información de sede</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre Comercial</label>
              <div className="relative">
                <Fuel className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Código / ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Ciudad</label>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Dirección Física</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {stationToEdit ? 'Actualizar Sede' : 'Crear Estación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};