import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, Filter, Loader2, ArrowLeft, 
  ChevronRight, AlertCircle, CheckCircle2, XCircle, User, MapPin 
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const ShiftHistoryPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const today = getTodayStr();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fecha_desde: today,
    fecha_hasta: today,
    estado: 'cerrado'
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await shiftService.getShiftHistory(filters);
      if (res.status) {
        setShifts(res.data.items || res.data || []);
      }
    } catch (e) {
      showToast("Error al cargar historial", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [filters.fecha_desde, filters.fecha_hasta, filters.estado]);

  return (
    <div className="p-4 md:p-8 space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Historial de Turnos</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditoría de cierres y balances</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Desde</span>
            <input 
              type="date" 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-zinc-900 shadow-sm uppercase"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Hasta</span>
            <input 
              type="date" 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-zinc-900 shadow-sm uppercase"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({...filters, fecha_hasta: e.target.value})}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-zinc-900" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando auditoría...</p>
          </div>
        ) : shifts.length > 0 ? (
          shifts.map((s) => {
            const balance = Number(s.balance_final || 0);
            return (
              <div 
                key={s.id}
                onClick={() => navigate(`/turnos-islero/${s.id}/resumen`)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {balance >= 0 ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Turno #{s.id} - {s.estacion?.nombre}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><User size={10} /> {s.usuario?.name || 'N/A'}</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><Calendar size={10} /> {s.fecha_apertura ? new Date(s.fecha_apertura).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:text-right">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sistema</p>
                    <p className="text-xs font-black text-slate-700">$ {Number(s.total_sistema || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reportado</p>
                    <p className="text-xs font-black text-slate-700">$ {Number(s.total_reportado || 0).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Balance</p>
                    <p className={`text-sm font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {balance >= 0 ? '+' : ''} $ {balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <ChevronRight className="hidden md:block text-slate-300" size={20} />
              </div>
            );
          })
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No se encontraron turnos cerrados en este rango de fechas</p>
          </div>
        )}
      </div>
    </div>
  );
};