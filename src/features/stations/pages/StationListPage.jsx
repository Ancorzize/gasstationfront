import React, { useEffect, useState } from 'react';
import { Search, Edit2, MapPin, Plus, Loader2, Fuel, Power } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useToast } from '../../../context/ToastContext';
import { StationModal } from '../components/StationModal';

export const StationListPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const { showToast } = useToast();

  const fetchStations = async () => {
    setLoading(true);
    try {
      const result = await stationService.getStations();
      if (result.status) setStations(result.data.items);
    } catch (error) {
      showToast("Error al cargar estaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const filteredStations = Array.isArray(stations) 
  ? stations.filter(s => 
      s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Estaciones de Servicio</h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Sedes y puntos de venta</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar estación..." 
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <button 
            onClick={() => { setSelectedStation(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <Plus size={16} /> Nueva Estación
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-300 gap-3">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando estaciones...</p>
          </div>
        ) : filteredStations.length > 0 ? (
          filteredStations.map((s) => (
            <div key={s.id} className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-6 space-y-5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg shadow-zinc-200">
                    <Fuel size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight line-clamp-1">{s.nombre}</h4>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{s.codigo}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {s.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase truncate">{s.direccion || 'Sin dirección'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Ciudad</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{s.ciudad || 'No definida'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setSelectedStation(s); setIsModalOpen(true); }}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all">
                    <Power size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 italic text-sm">No se encontraron estaciones configuradas.</p>
          </div>
        )}
      </div>

      <StationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchStations} 
        stationToEdit={selectedStation} 
      />
    </div>
  );
};