import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Droplets, Banknote, CreditCard, QrCode, Smartphone, Info, Landmark, AlertTriangle, CheckCircle, Package, Receipt } from 'lucide-react';
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
    pagos_efectivo: 0,
    pagos_datafono: 0,
    pagos_qr: 0,
    pagos_transferencia: 0,
    pagos_consignacion: 0,
    abonos_islero: 0,
    observacion_cierre: ''
  });

  useEffect(() => {
    const loadSummary = async () => {
      const res = await shiftService.getClosingSummary(id);
      if (res.status && res.data) {
        const data = res.data;
        setSummary(data);
        setFormData(prev => ({
          ...prev,
          lecturas_finales: data.lecturas.map(l => ({ manguera_id: l.manguera_id, lectura_final: l.lectura_sugerida })),
          pagos_efectivo: data.totales_pago_sugeridos?.efectivo || 0,
          pagos_datafono: data.totales_pago_sugeridos?.datafono || 0,
          pagos_qr: data.totales_pago_sugeridos?.qr || 0,
          pagos_transferencia: data.totales_pago_sugeridos?.transferencia || 0,
          pagos_consignacion: data.totales_pago_sugeridos?.consignacion || 0,
          abonos_islero: data.totales_sistema?.abonos || 0
        }));
      }
    };
    loadSummary();
  }, [id]);

  const calculatedValues = useMemo(() => {
    if (!summary) return { totalEsperado: 0, totalReportado: 0, balance: 0 };
    
    const totalCombustible = summary.lecturas.reduce((acc, l) => {
      const lecturaFinal = formData.lecturas_finales.find(f => f.manguera_id === l.manguera_id)?.lectura_final || 0;
      return acc + ((lecturaFinal - l.lectura_inicial) * l.precio_galon);
    }, 0);
    
    const totalEsperado = totalCombustible + summary.totales_sistema.ventas_lubricantes + summary.totales_sistema.abonos + summary.totales_sistema.creditos;
    
    const totalReportado = formData.pagos_efectivo + formData.pagos_datafono + formData.pagos_qr + formData.pagos_transferencia + formData.pagos_consignacion + formData.abonos_islero;
    
    return {
      totalEsperado,
      totalReportado,
      balance: totalReportado - totalEsperado
    };
  }, [summary, formData]);

  const handleReadingChange = (mangueraId, value) => {
    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => l.manguera_id === mangueraId ? { ...l, lectura_final: parseFloat(value) || 0 } : l)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, ...calculatedValues };
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
        <div className="text-right">
            <p className="text-xl font-black">{calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(calculatedValues.balance).toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Droplets size={16} /> Mangueras</h3>
            {summary.lecturas?.map((l, index) => (
              <div key={l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[9px] font-bold uppercase">{l.manguera.nombre}</p>
                    <p className="text-[10px] font-black">${l.precio_galon.toLocaleString()}</p>
                </div>
                <input type="number" step="0.01" className="p-2 rounded-xl border text-right font-black" value={formData.lecturas_finales[index]?.lectura_final} onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)} />
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2"><Package size={16} /> Productos Vendidos</h3>
            {summary.ventas_productos.map(p => (
                <div key={p.id} className="flex justify-between text-[10px] py-1 border-b"><span>{p.nombre} (x{p.cantidad})</span><span className="font-bold">${p.total.toLocaleString()}</span></div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase mb-6"><Banknote size={16} className="inline mr-2" /> Reporte de Dinero</h3>
            <div className="grid grid-cols-2 gap-4">
              <PaymentInput label="Efectivo" value={formData.pagos_efectivo} onChange={(v) => setFormData({...formData, pagos_efectivo: v})} />
              <PaymentInput label="Datafono" value={formData.pagos_datafono} onChange={(v) => setFormData({...formData, pagos_datafono: v})} />
              <PaymentInput label="QR" value={formData.pagos_qr} onChange={(v) => setFormData({...formData, pagos_qr: v})} />
              <PaymentInput label="Transferencia" value={formData.pagos_transferencia} onChange={(v) => setFormData({...formData, pagos_transferencia: v})} />
              <PaymentInput label="Consignacion" value={formData.pagos_consignacion} onChange={(v) => setFormData({...formData, pagos_consignacion: v})} />
              <PaymentInput label="Abonos" value={formData.abonos_islero} onChange={(v) => setFormData({...formData, abonos_islero: v})} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2"><Receipt size={16} /> Abonos Recibidos</h3>
            {summary.abonos_recibidos.map(a => (
                <div key={a.id} className="flex justify-between text-[10px] py-1 border-b"><span>{a.cliente}</span><span className="font-bold">${a.monto.toLocaleString()}</span></div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Finalizar y Cerrar Turno"}
          </button>
        </div>
      </form>
    </div>
  );
};

const PaymentInput = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-slate-400 uppercase">{label}</label>
    <input type="text" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-black text-right" value={value.toLocaleString()} onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, "") || 0))} />
  </div>
);