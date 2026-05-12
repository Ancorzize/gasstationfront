import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Droplets, Banknote, CreditCard, QrCode, Smartphone, Info } from 'lucide-react';
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
    otros_movimientos: 0,
    otros_movimientos_detalle: '',
    observacion_cierre: ''
  });

  useEffect(() => {
    const loadSummary = async () => {
      const res = await shiftService.getClosingSummary(id);
      if (res.status) {
        setSummary(res.data);
        setFormData(prev => ({
          ...prev,
          lecturas_finales: res.data.lecturas.map(l => ({
            manguera_id: l.manguera_id,
            lectura_final: l.actual 
          }))
        }));
      }
    };
    loadSummary();
  }, [id]);

  const handleReadingChange = (mangueraId, value) => {
    setFormData({
      ...formData,
      lecturas_finales: formData.lecturas_finales.map(l => 
        l.manguera_id === mangueraId ? { ...l, lectura_final: value } : l
      )
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await shiftService.closeShift(id, formData);
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
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Arqueo y Cierre</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estación: {summary.estacion}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" /> Lecturas Finales de Mangueras
            </h3>
            <div className="space-y-4">
              {summary.lecturas.map((l, index) => (
                <div key={l.manguera_id} className="p-4 bg-slate-50 rounded-3xl flex items-center justify-between border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-700 uppercase">{l.manguera}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Inicial: {Number(l.inicial).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase mr-2">Lectura Actual</span>
                    <input
                      type="number" step="0.01" required
                      className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-right outline-none focus:border-zinc-900 transition-all"
                      value={formData.lecturas_finales[index]?.lectura_final}
                      onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Banknote size={16} className="text-emerald-500" /> Reporte de Dinero Físico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaymentInput icon={Banknote} label="Efectivo" value={formData.pagos_efectivo} onChange={(v) => setFormData({...formData, pagos_efectivo: v})} />
              <PaymentInput icon={CreditCard} label="Datafono" value={formData.pagos_datafono} onChange={(v) => setFormData({...formData, pagos_datafono: v})} />
              <PaymentInput icon={QrCode} label="Pagos QR" value={formData.pagos_qr} onChange={(v) => setFormData({...formData, pagos_qr: v})} />
              <PaymentInput icon={Smartphone} label="Transferencias" value={formData.pagos_transferencia} onChange={(v) => setFormData({...formData, pagos_transferencia: v})} />
            </div>
            <div className="mt-6 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Observaciones de Cierre</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-zinc-900 resize-none h-20"
                  placeholder="Detalles del turno..."
                  value={formData.observacion_cierre}
                  onChange={(e) => setFormData({...formData, observacion_cierre: e.target.value})}
                />
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-200">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2 text-zinc-400">
                 <Info size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Total en Sistema: $ {Number(summary.totales.total_sistema).toLocaleString()}</span>
               </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-yellow-500 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Finalizar y Cerrar Turno
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const PaymentInput = ({ icon: Icon, label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-3.5 text-slate-300" size={14} />
      <input
        type="number"
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 transition-all text-right"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);