import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, DollarSign, Loader2, Save } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useToast } from '../../../context/ToastContext';

export const CreditConfigModal = ({ isOpen, onClose, onSave, client }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maneja_credito: false,
    cupo_credito: 0,
    dias_credito: 30
  });

  useEffect(() => {
    if (client) {
      setFormData({
        maneja_credito: client.maneja_credito || false,
        cupo_credito: client.cupo_credito || 0,
        dias_credito: client.dias_credito || 30
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clientService.configureCredit(client.id, formData);
      if (res.status) {
        showToast("Crédito configurado correctamente", "success");
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
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Parámetros de Crédito</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{client?.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-800 uppercase">Habilitar Crédito</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Permite ventas a plazos</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, maneja_credito: !formData.maneja_credito })}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.maneja_credito ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.maneja_credito ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className={`space-y-6 transition-all ${formData.maneja_credito ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cupo de Crédito Máximo</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="number"
                  required={formData.maneja_credito}
                  placeholder="0.00"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                  value={formData.cupo_credito}
                  onChange={(e) => setFormData({ ...formData, cupo_credito: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Días de Plazo</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="number"
                  required={formData.maneja_credito}
                  placeholder="30"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                  value={formData.dias_credito}
                  onChange={(e) => setFormData({ ...formData, dias_credito: e.target.value })}
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
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};