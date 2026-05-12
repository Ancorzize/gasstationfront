import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, MapPin, Fuel, AlertTriangle } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { stationService } from '../../stations/services/stationService';
import { useToast } from '../../../context/ToastContext';

export const OpenShiftModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [step, setStep] = useState(1);
  const [hoses, setHoses] = useState([]);
  const [formData, setFormData] = useState({
    estacion_id: '',
    observacion_apertura: '',
    lecturas_iniciales: []
  });

  useEffect(() => {
    if (isOpen) {
      stationService.getStations().then(res => {
        if (res.status) setStations(res.data.items || []);
      });
      setStep(1);
      setFormData({ estacion_id: '', observacion_apertura: '', lecturas_iniciales: [] });
    }
  }, [isOpen]);

  const handleOpenAttempt = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await shiftService.openShift(formData);

      if (res.status) {
        showToast("Turno abierto exitosamente", "success");
        onSave();
        onClose();
      } 
  
      else if (res.errors && res.errors.lecturas_iniciales_faltantes) {
        const faltantes = res.errors.lecturas_iniciales_faltantes;

        if (faltantes.length > 0) {
         
          setHoses(faltantes.map(h => ({
            id: h.manguera_id,
            nombre: h.nombre,
            producto: h.producto,
            bomba: h.bomba
          })));

  
          setFormData(prev => ({
            ...prev,
            lecturas_iniciales: faltantes.map(h => ({
              manguera_id: h.manguera_id,
              lectura_inicial: ''
            }))
          }));

          setStep(2);
          showToast("Se requieren lecturas iniciales", "info");
        }
      } else {
        showToast(res.message || "Error al abrir turno", "error");
      }
    } catch (error) {
      showToast("Error de comunicación con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReadingChange = (mangueraId, value) => {
    setFormData(prev => ({
      ...prev,
      lecturas_iniciales: prev.lecturas_iniciales.map(l =>
        l.manguera_id === mangueraId ? { ...l, lectura_inicial: value } : l
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200">
              <Play size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Apertura de Turno</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {step === 1 ? 'Selección de Estación' : 'Lecturas Manuales Requeridas'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleOpenAttempt} className="p-8 space-y-6 text-left">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Selecciona tu Estación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                  <select
                    required
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 appearance-none uppercase"
                    value={formData.estacion_id}
                    onChange={(e) => setFormData({ ...formData, estacion_id: e.target.value })}
                  >
                    <option value="">-- Escoger Estación --</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nota de apertura (Opcional)</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-zinc-900 resize-none h-24"
                  placeholder="Ej: Turno mañana, todo en orden..."
                  value={formData.observacion_apertura}
                  onChange={(e) => setFormData({ ...formData, observacion_apertura: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-700">
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">Lectura Inicial Requerida</p>
                  <p className="text-[9px] font-bold uppercase leading-tight opacity-80">
                    Estas mangueras no tienen historial previo. Ingresa el contador físico actual.
                  </p>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {hoses.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{h.nombre}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">
                        {h.producto?.nombre} {h.bomba ? `| ${h.bomba.nombre}` : ''}
                      </p>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        required
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-zinc-900 transition-all"
                        value={formData.lecturas_iniciales.find(l => l.manguera_id === h.id)?.lectura_inicial || ''}
                        onChange={(e) => handleReadingChange(h.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => step === 2 ? setStep(1) : onClose()}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all border border-transparent"
            >
              {step === 2 ? 'Atrás' : 'Cancelar'}
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
              {step === 1 ? 'Iniciar Turno' : 'Confirmar Lecturas y Abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};