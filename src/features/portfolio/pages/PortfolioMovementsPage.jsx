import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Loader2, Download, Filter, RefreshCcw } from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const PortfolioMovementsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const today = getTodayStr();

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ 
    search: '', 
    fecha_desde: today, 
    fecha_hasta: today 
  });

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await portfolioService.getMovements(filter);
      if (res.status) {
        setMovements(res.data.items);
      }
    } catch (e) {
      showToast("Error al cargar movimientos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMovements(); 
  }, [filter.fecha_desde, filter.fecha_hasta]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cartera')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Historial de Cartera</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditoría de abonos y créditos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
         
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Desde</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="date" 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-zinc-900 shadow-sm"
                value={filter.fecha_desde}
                onChange={(e) => setFilter({...filter, fecha_desde: e.target.value})}
              />
            </div>
          </div>

          
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Hasta</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="date" 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-zinc-900 shadow-sm"
                value={filter.fecha_hasta}
                onChange={(e) => setFilter({...filter, fecha_hasta: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-end gap-2 pt-4 lg:pt-0">
            <button 
              onClick={fetchMovements}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
              title="Refrescar"
            >
              <RefreshCcw size={16} />
            </button>
            
            <button 
              onClick={() => exportToExcel(movements, `Movimientos_Cartera_${today}`)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <Download size={14} /> Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest">Filtrando historial...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo Movimiento</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.length > 0 ? movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase">
                          {new Date(mov.fecha_movimiento).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {new Date(mov.fecha_movimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-xs font-black text-slate-700 uppercase leading-tight">
                        {mov.cliente?.nombre} {mov.cliente?.apellidos}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {mov.cliente?.documento}
                      </p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          mov.tipo_movimiento === 'abono' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {mov.tipo_movimiento}
                        </span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">
                          {mov.descripcion}
                        </span>
                      </div>
                    </td>
                    <td className={`p-5 text-right font-black text-sm ${mov.tipo_movimiento === 'abono' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mov.tipo_movimiento === 'abono' ? '-' : '+'} ${Number(mov.valor).toLocaleString()}
                    </td>
                    <td className="p-5 text-right">
                      <span className="text-xs font-black text-slate-800 tracking-tighter">
                        ${Number(mov.saldo_nuevo).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-[10px] font-black text-slate-300 uppercase italic">
                      No se encontraron movimientos en el rango seleccionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};