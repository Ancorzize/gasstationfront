import React, { useEffect, useState } from 'react';
import { Search, Edit2, Plus, Loader2, Fuel, Power, Hash } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useToast } from '../../../context/ToastContext';
import { PumpModal } from '../components/PumpModal';

export const PumpListPage = () => {
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const { showToast } = useToast();

  const fetchPumps = async () => {
    setLoading(true);
    try {
      const result = await stationService.getPumps();
      if (result.status) setPumps(result.data.items);
    } catch (error) {
      showToast("Error al cargar bombas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPumps(); }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Bombas / Islas</h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Dispensadores por estación</p>
        </div>
        <button 
          onClick={() => { setSelectedPump(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl shadow-zinc-200"
        >
          <Plus size={16} /> Nueva Bomba
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-300">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : pumps.map((p) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 space-y-4 shadow-sm hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                <Hash size={20} />
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {p.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase">{p.nombre}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.estacion?.nombre}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-end gap-1">
              <button onClick={() => { setSelectedPump(p); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all">
                <Edit2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <PumpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchPumps} pumpToEdit={selectedPump} />
    </div>
  );
};