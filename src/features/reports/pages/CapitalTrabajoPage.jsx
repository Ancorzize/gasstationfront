import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Building2, 
  CreditCard, Package, ShieldCheck, AlertCircle, Loader2, Calendar, RefreshCw 
} from 'lucide-react';
import { financialService } from '../services/financialService';
import { useToast } from '../../../context/ToastContext';

export const CapitalTrabajoPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const { showToast } = useToast();

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await financialService.getCapitalTrabajo();
      if (res.status && res.data) {
        setData(res.data);
      } else {
        showToast(res.message || "No se pudo cargar el indicador", "error");
      }
    } catch (error) {
      showToast("Error de conexión al obtener el informe", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });
  };

  const isSuperavit = data?.capital_trabajo?.estado === 'SUPERAVIT';

  return (
    <div className="p-4 md:p-8 space-y-6 text-left">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Capital de Trabajo</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Indicadores financieros y liquidez de la empresa</p>
        </div>
        <button 
          onClick={loadReport}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar Informe
        </button>
      </header>

      {loading ? (
        <div className="py-32 text-center bg-white rounded-[2.5rem] border border-slate-100">
          <Loader2 className="animate-spin mx-auto text-slate-300" size={40} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-3">Calculando indicador financiero...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Tarjeta de Resultado Principal / Estado */}
          <div className={`p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isSuperavit ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
            <div className="space-y-2 z-10">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isSuperavit ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-red-600 text-white shadow-md shadow-red-600/20'}`}>
                  {data.capital_trabajo.estado}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evaluación de Liquidez</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                $ {formatMoney(data.capital_trabajo.valor)}
              </h3>
              <p className="text-xs font-bold text-slate-600 max-w-xl">
                {data.capital_trabajo.mensaje}
              </p>
            </div>

            <div className={`p-5 rounded-3xl z-10 ${isSuperavit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isSuperavit ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
            </div>
          </div>

          {/* Cuadrícula de Desglose (Activos vs Pasivos) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Activos Corrientes */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 text-white rounded-2xl">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Activos Corrientes</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recursos líquidos y cuentas por cobrar</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600">
                  $ {formatMoney(data.activos.total_activos)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Efectivo</span>
                  <span className="text-xs font-black text-slate-800">$ {formatMoney(data.activos.efectivo)}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Bancos</span>
                  <span className="text-xs font-black text-slate-800">$ {formatMoney(data.activos.bancos)}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Cartera (Cuentas por Cobrar)</span>
                  <span className="text-xs font-black text-slate-800">$ {formatMoney(data.activos.cartera)}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Inventario</span>
                  <span className="text-xs font-black text-slate-800">$ {formatMoney(data.activos.inventario)}</span>
                </div>
              </div>
            </div>

            {/* Pasivos Corrientes */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 text-white rounded-2xl">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Pasivos Corrientes</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Obligaciones y deudas a corto plazo</p>
                  </div>
                </div>
                <span className="text-xs font-black text-zinc-900">
                  $ {formatMoney(data.pasivos.total_pasivos)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Proveedores</span>
                  <span className="text-xs font-black text-slate-800">$ {formatMoney(data.pasivos.proveedores)}</span>
                </div>
              </div>

              {/* Nota informativa de la fórmula */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-start gap-3">
                <ShieldCheck className="text-slate-400 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                  El capital de trabajo se calcula restando el total de pasivos corrientes al total de activos corrientes disponibles.
                </p>
              </div>
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
};