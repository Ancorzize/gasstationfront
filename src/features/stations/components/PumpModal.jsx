import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Hash, Fuel, Barcode } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useToast } from '../../../context/ToastContext';

export const PumpModal = ({ isOpen, onClose, onSave, pumpToEdit }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    codigo: '', 
    estacion_id: '' 
  });

  useEffect(() => {
    const loadStations = async () => {
      const res = await stationService.getStations();
      if (res.status) {
        setStations(Array.isArray(res.data) ? res.data : res.data.items || []);
      }
    };
    if (isOpen) loadStations();
    
    if (pumpToEdit) {
      setFormData({ 
        nombre: pumpToEdit.nombre || '', 
        codigo: pumpToEdit.codigo || '', 
        estacion_id: pumpToEdit.estacion_id || '' 
      });
    } else {
      setFormData({ nombre: '', codigo: '', estacion_id: '' });
    }
  }, [pumpToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await stationService.savePump(formData, pumpToEdit?.id);
      if (res.status) {
        showToast(res.message, "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-left">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
              <Hash size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Configurar Bomba</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-white p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Estación</label>
            <select 
              required
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 appearance-none uppercase"
              value={formData.estacion_id}
              onChange={(e) => setFormData({ ...formData, estacion_id: e.target.value })}
            >
              <option value="">-- Seleccionar Sede --</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Código Interno</label>
            <input
              type="text" 
              required 
              placeholder="Ej: B-001"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 uppercase"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre / Descripción</label>
            <input
              type="text" 
              required 
              placeholder="Ej: Bomba 01 - Principal"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 uppercase"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 hover:bg-black transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
            Guardar Bomba
          </button>
        </form>
      </div>
    </div>
  );
};