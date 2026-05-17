import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Droplets, Banknote, CreditCard, QrCode, Smartphone, Info, Landmark, AlertTriangle, CheckCircle } from 'lucide-react';
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
      if (res.status && res.data) {
        const data = res.data;
        setSummary(data);
        
        // PRECARGA AUTOMÁTICA SUGERIDA (EDITABLE)
        setFormData({
          lecturas_finales: (data.lecturas || []).map(l => ({
            manguera_id: l.manguera_id,
            lectura_final: l.lectura_sugerida ?? '' // Lectura sugerida inicial editable
          })),
          pagos_efectivo: data.totales_pago_sugeridos?.efectivo || 0,
          pagos_datafono: data.totales_pago_sugeridos?.datafono || 0,
          pagos_qr: data.totales_pago_sugeridos?.qr || 0,
          pagos_transferencia: data.totales_pago_sugeridos?.transferencia || 0,
          pagos_consignacion: data.totales_pago_sugeridos?.consignacion || 0,
          otros_movimientos: 0,
          otros_movimientos_detalle: '',
          observacion_cierre: ''
        });
      }
    };
    loadSummary();
  }, [id]);

  const handleReadingChange = (mangueraId, value) => {
    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => 
        l.manguera_id === mangueraId ? { ...l, lectura_final: value } : l
      )
    }));
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

  // Renderizador dinámico del estado del balance preliminar
  const renderBalanceStatus = (balance) => {
    if (balance === 0) {
      return (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100">
          <CheckCircle size={16} />
          <span className="text-xs font-black uppercase tracking-tight">Balance correcto</span>
        </div>
      );
    }
    if (balance < 0) {
      return (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-2xl border border-rose-100">
          <AlertTriangle size={16} />
          <span className="text-xs font-black uppercase tracking-tight">Faltante de $ {Math.abs(balance).toLocaleString()}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100">
        <Info size={16} />
        <span className="text-xs font-black uppercase tracking-tight">Sobrante de $ {balance.toLocaleString()}</span>
      </div>
    );
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Estación: {summary.turno?.estacion?.nombre || "Estación Operativa"}
          </p>
        </div>
      </header>

      {/* BANNER DE BALANCE PRELIMINAR */}
      <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Auditoría del Turno</h4>
          <p className="text-[10px] text-slate-400 font-medium">Estado financiero calculado por el sistema en base a mangueras y ventas.</p>
        </div>
        {renderBalanceStatus(summary.balance_preliminar || 0)}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        
        {/* COLUMNA IZQUIERDA: LECTURAS DE MANGUERAS */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" /> Control Físico de Mangueras
            </h3>
            <div className="space-y-4">
              {summary.lecturas?.map((l, index) => (
                <div key={l.manguera_id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase">{l.manguera?.nombre || `Manguera ${l.manguera_id}`}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Precio Galón: ${Number(l.precio_galon).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] bg-slate-200/70 px-2 py-1 rounded-lg text-slate-600 font-bold uppercase">
                        {l.galones_vendidos_sistema} Gls vendidos
                      </span>
                      <p className="text-[10px] font-black text-slate-700 mt-1">Sist: $ {Number(l.total_venta_sistema).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Inicial</p>
                      <p className="text-xs font-black text-slate-700">{l.lectura_inicial}</p>
                    </div>
                    <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                      <p className="text-[8px] font-black text-blue-500 uppercase">Sugerida</p>
                      <p className="text-xs font-black text-blue-700">{l.lectura_sugerida}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <input
                        type="number" step="0.01" required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-right outline-none focus:border-zinc-900 transition-all shadow-sm"
                        value={formData.lecturas_finales[index]?.lectura_final}
                        onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: REPORTE DE DINERO Y RESUMEN SISTEMA */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Banknote size={16} className="text-emerald-500" /> Reporte de Dinero Físico (Editable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaymentInput icon={Banknote} label="Efectivo" value={formData.pagos_efectivo} onChange={(v) => setFormData({...formData, pagos_efectivo: v})} />
              <PaymentInput icon={CreditCard} label="Datafono" value={formData.pagos_datafono} onChange={(v) => setFormData({...formData, pagos_datafono: v})} />
              <PaymentInput icon={QrCode} label="Pagos QR" value={formData.pagos_qr} onChange={(v) => setFormData({...formData, pagos_qr: v})} />
              <PaymentInput icon={Smartphone} label="Transferencias" value={formData.pagos_transferencia} onChange={(v) => setFormData({...formData, pagos_transferencia: v})} />
              <PaymentInput icon={Landmark} label="Consignaciones" value={formData.pagos_consignacion} onChange={(v) => setFormData({...formData, pagos_consignacion: v})} />
            </div>
            <div className="mt-6 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Observaciones de Cierre</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-zinc-900 resize-none h-20"
                  placeholder="Detalles o novedades encontradas en el turno físico..."
                  value={formData.observacion_cierre}
                  onChange={(e) => setFormData({...formData, observacion_cierre: e.target.value})}
                />
            </div>
          </div>

          {/* CUADRO INFORMATIVO DE TOTALES SISTEMA */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-200 space-y-6">
            <div>
              <h3 className="text-xs font-black text-zinc-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                <Info size={14} className="text-yellow-500" /> Resumen Total del Sistema
              </h3>
              
              <div className="space-y-2 text-xs font-bold border-b border-zinc-800 pb-4">
                <div className="flex justify-between text-zinc-300">
                  <span>Combustible:</span>
                  <span>$ {Number(summary.totales_sistema?.ventas_combustible || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Lubricantes:</span>
                  <span>$ {Number(summary.totales_sistema?.ventas_lubricantes || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Créditos de Turno:</span>
                  <span>$ {Number(summary.totales_sistema?.creditos || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Abonos Recibidos:</span>
                  <span>$ {Number(summary.totales_sistema?.abonos || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Neto Sistema:</span>
                 <span className="text-lg font-black text-yellow-500">$ {Number(summary.totales_sistema?.total_sistema || 0).toLocaleString()}</span>
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

const PaymentInput = ({ icon: Icon, label, value, onChange }) => {
  const displayValue = value && value !== 0 
    ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
    : "";

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const rawNumberStr = inputValue.replace(/\D/g, "");
    const numericValue = rawNumberStr ? parseInt(rawNumberStr, 10) : 0;
    onChange(numericValue);
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-3.5 text-slate-300" size={14} />
        <input
          type="text"
          inputMode="numeric"
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 transition-all text-right"
          placeholder="$ 0"
          value={displayValue}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};