import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Banknote, Droplets, Users } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftClosingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  
  const [formData, setFormData] = useState({
    lecturas_finales: [],
    destinos_recaudo: []
  });

  useEffect(() => {
    const loadSummary = async () => {
      const res = await shiftService.getClosingSummary(id);
      if (res.status && res.data) {
        const data = res.data;
        setSummary(data);
        setFormData({
          lecturas_finales: data.lecturas.map(l => ({ 
            manguera_id: l.manguera_id, 
            lectura_final: l.lectura_sugerida,
            lectura_inicial: l.lectura_inicial,
            precio_galon: l.precio_galon 
          })),
          destinos_recaudo: data.destinos_recaudo.map(d => ({
            destino_recaudo_id: d.destino_recaudo_id,
            nombre: d.nombre,
            pagos: { ...d.pagos }
          }))
        });
      }
    };
    loadSummary();
  }, [id]);

  const calculatedValues = useMemo(() => {
    if (!summary) return { totalEsperado: 0, totalReportado: 0, balance: 0 };
    
    const totalCombustible = formData.lecturas_finales.reduce((acc, l) => {
      const galonesVendidos = Math.max(0, l.lectura_final - l.lectura_inicial);
      return acc + (galonesVendidos * l.precio_galon);
    }, 0);
    
    const totalEsperado = totalCombustible + summary.totales_sistema.ventas_lubricantes  - summary.totales_sistema.creditos;

    const totalReportado = formData.destinos_recaudo.reduce((acc, d) => {
      return acc + Object.values(d.pagos).reduce((sum, val) => sum + val, 0);
    }, 0);
                        
    return { totalEsperado, totalReportado, balance: totalReportado - totalEsperado };
  }, [summary, formData]);

  const handleReadingChange = (mangueraId, value) => {
    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => 
        l.manguera_id === mangueraId ? { ...l, lectura_final: parseFloat(value) || 0 } : l
      )
    }));
  };

  const handlePaymentChange = (destinoId, medio, value) => {
    setFormData(prev => ({
      ...prev,
      destinos_recaudo: prev.destinos_recaudo.map(d => 
        d.destino_recaudo_id === destinoId 
          ? { ...d, pagos: { ...d.pagos, [medio]: value } } 
          : d
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        lecturas_finales: formData.lecturas_finales.map(({manguera_id, lectura_final}) => ({manguera_id, lectura_final})),
        destinos_recaudo: formData.destinos_recaudo,
        otros_movimientos: 0,
        otros_movimientos_detalle: null,
        observacion_cierre: '' 
      };
      const res = await shiftService.closeShift(id, payload);
      if (res.status) {
        showToast("Turno cerrado exitosamente", "success");
        navigate('/operacion/turnos');
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al cerrar el turno", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm"><ArrowLeft size={20} /></button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cierre de Turno</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estación: {summary.turno?.estacion?.nombre}</p>
        </div>
      </header>

      <div className={`p-6 rounded-[2rem] shadow-sm border flex items-center justify-between ${calculatedValues.balance === 0 ? 'bg-emerald-50 border-emerald-100' : calculatedValues.balance < 0 ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
        <div>
          <h4 className="text-xs font-black uppercase">Balance del Turno</h4>
          <p className="text-[10px] font-bold opacity-70">Esperado: ${calculatedValues.totalEsperado.toLocaleString()} | Reportado: ${calculatedValues.totalReportado.toLocaleString()}</p>
        </div>
        <div className="text-right"><p className="text-xl font-black">{calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(calculatedValues.balance).toLocaleString()}</p></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mangueras */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Droplets size={16} /> Mangueras</h3>
            {summary.lecturas?.map((l, index) => (
              <div key={l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4 items-center">
                <div>
                    <p className="text-[9px] font-bold uppercase">{l.manguera.nombre}</p>
                    <p className="text-[10px] font-black">${l.precio_galon.toLocaleString()}</p>
                </div>
                <input type="number" step="0.01" className="p-3 rounded-xl border text-right font-black outline-none focus:ring-2 focus:ring-zinc-900" value={formData.lecturas_finales[index]?.lectura_final || ''} onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* Destinos de Recaudo */}
            {formData.destinos_recaudo.map((destino) => (
              <div key={destino.destino_recaudo_id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><Banknote size={16} /> {destino.nombre}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(destino.pagos).map((medio) => (
                    <div key={medio} className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">{medio}</label>
                      <input type="text" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-black text-right outline-none" value={destino.pagos[medio].toLocaleString()} onChange={(e) => handlePaymentChange(destino.destino_recaudo_id, medio, parseInt(e.target.value.replace(/\D/g, "") || 0))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}


            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2 text-slate-800">
                <Users size={16} /> Total Abonos de Cartera
              </h3>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                  value={`$ ${(summary.abonos_recibidos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0).toLocaleString()}`}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest text-right">
                {summary.abonos_recibidos?.length || 0} abono(s) registrado(s) en este turno
              </p>
            </div>
          </div>

        </div>

        <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-black transition-all">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Finalizar y Cerrar Turno"}
        </button>
      </form>
    </div>
  );
};