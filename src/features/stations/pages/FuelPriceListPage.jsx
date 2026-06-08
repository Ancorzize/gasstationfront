import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Fuel, History, Calendar, 
  ArrowLeft, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';
import { fuelPriceService } from '../services/fuelPriceService';
import { useToast } from '../../../context/ToastContext';
import { FuelPriceModal } from '../components/FuelPriceModal';

export const FuelPriceListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState({ search: '', is_active: '' });

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fuelPriceService.getPrices(filter);
      
     
      if (res.status || res.success) {
        setPrices(res.data.items || []);
      }
    } catch (e) {
      showToast("Error al cargar historial de precios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPrices(); 
  }, [filter.is_active]);

  return (
    <div className="p-4 md:p-8 space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Precios de Combustible Isla</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial y vigencias por producto</p>
          </div>a
        </div>

        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-zinc-900 shadow-sm"
            value={filter.is_active}
            onChange={(e) => setFilter({...filter, is_active: e.target.value})}
          >
            <option value="">Todos los estados</option>
            <option value="true">Solo Activos</option>
            <option value="false">Solo Inactivos</option>
          </select>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <Plus size={16} /> Nuevo Precio
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto Combustible</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Vigente</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Fin</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-zinc-900" size={30} />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Cargando histórico...</span>
                    </div>
                  </td>
                </tr>
              ) : prices.length > 0 ? (
                prices.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50/30 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Fuel size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase">{p.producto?.nombre}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{p.producto?.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-black text-slate-800">$ {Number(p.precio).toLocaleString()}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <Calendar size={12} /> {new Date(p.fecha_inicio).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : '— Vigente'}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                        p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {p.is_active ? 'Activo' : 'Cerrado'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-[10px] font-black text-slate-300 uppercase italic">
                    No se registran históricos de precios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FuelPriceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchPrices} 
      />
    </div>
  );
};