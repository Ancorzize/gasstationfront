import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, MapPin, Droplets, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { stationService } from '../../stations/services/stationService';
import { useToast } from '../../../context/ToastContext';

export const OpenShiftModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingHoses, setLoadingHoses] = useState(false);
  
  const [stations, setStations] = useState([]);
  const [availableHoses, setAvailableHoses] = useState([]);
  const [selectedHoses, setSelectedHoses] = useState([]); 
  
  const [formData, setFormData] = useState({
    estacion_id: '',
    observacion_apertura: '',
    lecturas_iniciales: [] 
  });

  useEffect(() => {
    if (isOpen) {
      stationService.getStations().then(res => res.status && setStations(res.data.items || []));
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setAvailableHoses([]);
    setSelectedHoses([]);
    setFormData({ estacion_id: '', observacion_apertura: '', lecturas_iniciales: [] });
  };

  useEffect(() => {
    if (formData.estacion_id) {
      loadHoses(formData.estacion_id);
    }
  }, [formData.estacion_id]);

  const loadHoses = async (id) => {
    setLoadingHoses(true);
    try {
      const res = await shiftService.getAvailableHoses(id);
      if (res.status) setAvailableHoses(res.data || []);
    } catch (e) {
      showToast("Error al cargar mangueras", "error");
    } finally {
      setLoadingHoses(false);
    }
  };

  const toggleHose = (hose) => {
    const isSelected = selectedHoses.includes(hose.id);
    if (isSelected) {
      setSelectedHoses(selectedHoses.filter(id => id !== hose.id));
      setFormData({
        ...formData,
        lecturas_iniciales: formData.lecturas_iniciales.filter(l => l.manguera_id !== hose.id)
      });
    } else {
      setSelectedHoses([...selectedHoses, hose.id]);
      if (hose.requiere_lectura_inicial) {
        setFormData({
          ...formData,
          lecturas_iniciales: [...formData.lecturas_iniciales, { manguera_id: hose.id, lectura_inicial: '' }]
        });
      }
    }
  };

  const handleReadingChange = (id, val) => {
    setFormData({
      ...formData,
      lecturas_iniciales: formData.lecturas_iniciales.map(l => 
        l.manguera_id === id ? { ...l, lectura_inicial: val } : l
      )
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedHoses.length === 0) return showToast("Selecciona al menos una manguera", "error");

    setLoading(true);
    try {
      const payload = {
        estacion_id: formData.estacion_id,
        mangueras: selectedHoses,
        observacion_apertura: formData.observacion_apertura,
        lecturas_iniciales: formData.lecturas_iniciales
      };

      const res = await shiftService.openShift(payload);
      if (res.status) {
        showToast("Turno abierto exitosamente", "success");
        onSave();
        onClose();
      } else {
     
        if (res.errors?.lecturas_iniciales_faltantes) {
          showToast("Faltan lecturas obligatorias", "error");
         
        } else {
          showToast(res.message, "error");
          if (res.message.includes("asignadas")) loadHoses(formData.estacion_id);
        }
      }
    } catch (error) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Abrir Nuevo Turno</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración de mangueras e isla</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-colors"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 text-left custom-scrollbar">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">1. Estación de Servicio</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
              <select
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 appearance-none uppercase"
                value={formData.estacion_id}
                onChange={(e) => setFormData({ ...formData, estacion_id: e.target.value })}
              >
                <option value="">-- Seleccionar Sede --</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>

       
          {formData.estacion_id && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">2. Mangueras Disponibles</label>
              
              {loadingHoses ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-zinc-300" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Consultando disponibilidad...</p>
                </div>
              ) : availableHoses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {availableHoses.map((h) => {
                    const isSelected = selectedHoses.includes(h.id);
                    return (
                      <div key={h.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'border-zinc-900 bg-zinc-50' : 'border-slate-100 bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <button 
                            type="button"
                            onClick={() => toggleHose(h)}
                            className="flex items-center gap-4 flex-1"
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-slate-200'}`}>
                              {isSelected && <CheckCircle2 size={14} />}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-800 uppercase">{h.nombre} | {h.bomba?.nombre}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{h.producto?.nombre}</p>
                            </div>
                          </button>
                          
                          <div className="text-right">
                            {h.requiere_lectura_inicial ? (
                              <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-tighter">Lectura inicial requerida</span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Última lectura</span>
                                <span className="text-[10px] font-black text-emerald-600 italic">{Number(h.ultima_lectura_final).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

              
                        {isSelected && h.requiere_lectura_inicial && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[9px] font-black text-slate-500 uppercase italic">Ingresar lectura inicial física:</span>
                              <input 
                                type="number" step="0.01" required
                                className="w-32 px-4 py-2 bg-white border-2 border-amber-200 rounded-xl text-xs font-black outline-none focus:border-zinc-900"
                                value={formData.lecturas_iniciales.find(l => l.manguera_id === h.id)?.lectura_inicial || ''}
                                onChange={(e) => handleReadingChange(h.id, e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                  <Info className="mx-auto mb-2 text-slate-400" size={24} />
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed">No hay mangueras disponibles para abrir turno en esta estación.</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">3. Observaciones</label>
            <textarea
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-zinc-900 h-20 resize-none"
              placeholder="Notas sobre el estado de la isla..."
              value={formData.observacion_apertura}
              onChange={(e) => setFormData({ ...formData, observacion_apertura: e.target.value })}
            />
          </div>
        </form>

        <footer className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
          <button
            type="button" onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedHoses.length === 0}
            className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            Abrir Turno con {selectedHoses.length} mangueras
          </button>
        </footer>
      </div>
    </div>
  );
};