import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Landmark, Users, DollarSign, ArrowRight, 
  Loader2, Activity, PieChart, History 
} from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { useToast } from '../../../context/ToastContext';

export const CustomerPortfolioPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await portfolioService.getSummary();
        if (res.status) setSummary(res.data);
      } catch (e) {
        showToast("Error al cargar resumen de cartera", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cartera de Clientes</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control global de cuentas por cobrar</p>
        </div>
        <button 
          onClick={() => navigate('/cartera/movimientos')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
        >
          <History size={16} /> Ver Movimientos
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-200 relative overflow-hidden">
          <DollarSign className="absolute -right-4 -bottom-4 opacity-10" size={100} />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">Total en Cartera</p>
          <p className="text-3xl font-black tracking-tighter">$ {Number(summary?.total_cartera).toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Clientes con Deuda</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{summary?.clientes_con_deuda}</p>
            <Activity className="text-red-400 mb-1" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Clientes al Día</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{summary?.clientes_al_dia}</p>
            <PieChart className="text-emerald-400 mb-1" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Clientes Crédito</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{summary?.clientes_credito}</p>
            <Users className="text-blue-400 mb-1" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-100 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
          <Landmark size={40} />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-black text-slate-800 uppercase italic">Gestión de Cobranza</h3>
          <p className="text-xs text-slate-400 font-medium">Para gestionar la cartera de un cliente específico, búscalo en el módulo de clientes y accede a su estado de cuenta.</p>
        </div>
        <button 
          onClick={() => navigate('/clientes')}
          className="inline-flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-black transition-all shadow-xl shadow-zinc-200"
        >
          Ir a Clientes <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};