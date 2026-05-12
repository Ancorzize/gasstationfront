import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Fuel, Package, CreditCard, Receipt, Calculator, ChevronRight } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await shiftService.getClosingSummary(id);
      if (res.status) setSummary(res.data);
    } catch (e) {
      showToast("Error al cargar resumen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Calculando balance del sistema...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Resumen de Control</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pre-cierre de turno #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Fuel} label="Combustible" value={summary?.totales?.combustible} color="bg-blue-600" />
        <StatCard icon={Package} label="Lubricantes" value={summary?.totales?.lubricantes} color="bg-zinc-900" />
        <StatCard icon={creditCard} label="Créditos" value={summary?.totales?.creditos} color="bg-red-500" />
        <StatCard icon={Receipt} label="Abonos" value={summary?.totales?.abonos} color="bg-emerald-600" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Detalle de Mangueras</h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Lecturas Iniciales vs Sistema</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Manguera</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Inicial</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendido</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary?.lecturas?.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold">
                  <td className="p-5 uppercase">
                    <p className="text-slate-800">{l.manguera}</p>
                    <p className="text-[9px] text-slate-400 italic">{l.producto}</p>
                  </td>
                  <td className="p-5 text-slate-600">{Number(l.inicial).toLocaleString()}</td>
                  <td className="p-5 text-slate-600">{Number(l.actual).toLocaleString()}</td>
                  <td className="p-5 text-zinc-900 font-black">{Number(l.vendido).toLocaleString()} gal</td>
                  <td className="p-5 text-right font-black text-slate-800">$ {Number(l.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[3rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-zinc-200">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Esperado en Sistema</p>
          <h4 className="text-4xl font-black tracking-tighter italic">$ {Number(summary?.totales?.total_sistema).toLocaleString()}</h4>
        </div>
        
        <button 
          onClick={() => navigate(`/turnos-islero/${id}/cerrar`)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-zinc-900 px-10 py-5 rounded-2xl font-black uppercase text-xs hover:scale-105 transition-transform"
        >
          <Calculator size={18} /> Registrar Pagos y Cerrar <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 space-y-4">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800">$ {Number(value || 0).toLocaleString()}</p>
    </div>
  </div>
);