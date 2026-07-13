import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LockOpen, Save, Loader2, Wand2, CheckSquare, Square } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashOpenModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [destinos, setDestinos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '', tipo_caja: 'efectivo', destino_recaudo_id: '', monto_apertura: '', observacion_apertura: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ nombre: '', tipo_caja: 'efectivo', destino_recaudo_id: '', monto_apertura: '', observacion_apertura: '' });
      setSelectedIds([]);
      Promise.all([
        cashService.getDestinosRecaudo(true),
        cashService.getSuggestedOpenings()
      ]).then(([destRes, sugRes]) => {
        if (destRes.status) setDestinos(destRes.data.items);
        if (sugRes.status) setSugerencias(sugRes.data);
      });
    }
  }, [isOpen]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleProcessOpenings = async () => {
    const hasManualData = formData.nombre && formData.destino_recaudo_id && formData.monto_apertura;
    if (selectedIds.length === 0 && !hasManualData) {
      showToast("Selecciona al menos una sugerencia o llena el formulario manual", "error");
      return;
    }

    setLoading(true);
    try {
      for (const id of selectedIds) {
        const sug = sugerencias.find(s => s.id === id);
        await cashService.openCash({
          nombre: sug.nombre,
          tipo_caja: sug.tipo_caja,
          destino_recaudo_id: sug.destino_recaudo_id,
          monto_apertura: sug.ultimo_monto_cierre,
          observacion_apertura: 'Apertura automática'
        });
      }

      if (hasManualData) {
        await cashService.openCash(formData);
      }

      showToast("Proceso de apertura completado", "success");
      onSave(); onClose();
    } catch (e) {
      showToast("Error al abrir algunas cajas", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase flex items-center gap-2"><LockOpen size={18} /> Apertura de Caja</h3>
              <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sugerencias.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Wand2 size={12}/> Sugerencias de la apertura anterior</h4>
                  <div className="space-y-2">
                    {sugerencias.map(s => (
                      <div key={s.id} onClick={() => toggleSelection(s.id)} className="cursor-pointer bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-[10px] hover:border-emerald-300 transition-all">
                        <div className="flex items-center gap-3">
                          {selectedIds.includes(s.id) ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-slate-300" />}
                          <span className="font-bold text-slate-700">{s.nombre}</span>
                        </div>
                        <span className="font-black text-slate-500">${Number(s.ultimo_monto_cierre).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario Manual */}
              <div className="space-y-4 pt-2 border-t">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-2">O apertura manual (Opcional)</p>
                <input className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-black outline-none" placeholder="Nombre de la caja" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 bg-slate-50 border rounded-2xl text-sm font-black" onChange={e => setFormData({...formData, tipo_caja: e.target.value})}>
                    <option value="efectivo">Efectivo</option>
                    <option value="digital">Digital</option>
                  </select>
                  <select className="p-4 bg-slate-50 border rounded-2xl text-sm font-black" onChange={e => setFormData({...formData, destino_recaudo_id: e.target.value})}>
                    <option value="">Destino...</option>
                    {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl text-lg font-black outline-none" placeholder="Monto Inicial (Solo si es manual)" value={formData.monto_apertura} onChange={e => setFormData({...formData, monto_apertura: e.target.value})} />

                <button 
                  type="button" 
                  onClick={handleProcessOpenings}
                  disabled={loading} 
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16}/> Abrir Seleccionadas</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};