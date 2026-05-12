import React, { useEffect, useState } from 'react';
import { Search, Edit2, Plus, Loader2, Droplets, Hash } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useToast } from '../../../context/ToastContext';
import { HoseModal } from '../components/HoseModal';

export const HoseListPage = () => {
  const [hoses, setHoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHose, setSelectedHose] = useState(null);
  const { showToast } = useToast();

  const fetchHoses = async () => {
    setLoading(true);
    try {
      const result = await stationService.getHoses();
      if (result.status) setHoses(result.data.items);
    } catch (error) {
      showToast("Error al cargar mangueras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHoses(); }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Mangueras</h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Configuración de surtidores</p>
        </div>
        <button onClick={() => { setSelectedHose(null); setIsModalOpen(true); }} className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-zinc-200 flex items-center gap-2">
          <Plus size={16} /> Nueva Manguera
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-left">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Info Manguera</th>
              <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
              <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Producto</th>
              <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {hoses.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Droplets size={16} /></div>
                    <span className="text-xs font-black text-slate-800 uppercase">{h.nombre}</span>
                  </div>
                </td>
                <td className="p-5">
                  <p className="text-[10px] font-black text-slate-700 uppercase leading-tight">{h.bomba?.nombre}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{h.bomba?.estacion?.nombre}</p>
                </td>
                <td className="p-5 text-center">
                  <span className="px-3 py-1 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter italic">
                    {h.producto?.nombre}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => { setSelectedHose(h); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HoseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchHoses} hoseToEdit={selectedHose} />
    </div>
  );
};