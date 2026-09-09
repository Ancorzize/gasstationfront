import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Banknote, Droplets, Users, Send, CreditCard } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

// Funciones auxiliares para formatear y parsear números estilo colombiano (609.477,99)
const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  
  // Convertimos a string por si viene como número
  const stringValue = String(value);
  
  // Separamos la parte entera de la decimal usando el punto original o la coma
  const parts = stringValue.includes('.') ? stringValue.split('.') : stringValue.split(',');
  
  let entera = parts[0].replace(/\D/g, ''); // Solo números en la parte entera
  
  if (entera !== '') {
    entera = Number(entera).toLocaleString('es-CO');
  }
  
  if (parts.length > 1) {
    // La parte decimal son los dígitos que siguen al punto/coma original
    const decimal = parts[1].replace(/\D/g, '');
    return `${entera},${decimal}`;
  }
  
  return entera;
};

const parseNumberInput = (value) => {
  if (!value) return 0;
  // Reemplazamos los puntos de miles por nada y la coma decimal por un punto estándar para JavaScript
  const cleanValue = String(value).replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

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
      const inicial = Number(l.lectura_inicial) || 0;
      const final = Number(l.lectura_final) || 0;
      const galonesVendidos = Math.max(0, final - inicial);
      const galonesRedondeados = Math.round(galonesVendidos * 100) / 100;
      return acc + (galonesRedondeados * Number(l.precio_galon || 0));
    }, 0);
    
    const ventasLubricantes = Number(summary.totales_sistema?.ventas_lubricantes || 0);
    const abonos = (summary.abonos_recibidos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0);
    const creditos = Number(summary.totales_sistema?.creditos || summary.totales_pago_sugeridos?.creditos || 0);

    let totalEsperado = (totalCombustible + ventasLubricantes) - creditos + abonos;

    // Si el total esperado en valor absoluto es menor a 100 pesos, lo fijamos en 0
    if (Math.abs(totalEsperado) < 100) {
      totalEsperado = 0;
    }

    const totalReportado = formData.destinos_recaudo.reduce((acc, d) => {
      return acc + Object.values(d.pagos).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, 0) + abonos;

    let balance = totalReportado - totalEsperado;

    // Si el balance en valor absoluto es menor a 100 pesos, lo fijamos en 0
    if (Math.abs(balance) < 100) {
      balance = 0;
    }
                
    return { 
      totalEsperado: Math.round(totalEsperado), 
      totalReportado: Math.round(totalReportado), 
      balance: Math.round(balance) 
    };
  }, [summary, formData]);

  const handleReadingChange = (mangueraId, rawValue) => {
    // Permitimos dígitos, puntos y comas
    const filteredValue = rawValue.replace(/[^0-9,]/g, '');
    const numericValue = parseNumberInput(filteredValue);

    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => 
        l.manguera_id === mangueraId ? { ...l, lectura_final: numericValue } : l
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
      
      const res = await shiftService.requestCloseShift(id, payload);
      if (res.status) {
        showToast("Cierre solicitado exitosamente. Pendiente de aprobación.", "success");
        navigate(`/operacion/turnos`);
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al solicitar el cierre del turno", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  const creditosTotales = Number(summary.totales_sistema?.creditos || summary.totales_pago_sugeridos?.creditos || 0);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20">
      
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
        <header className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm"><ArrowLeft size={20} /></button>
          <div className="text-right">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Solicitud de Cierre de Turno</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estación: {summary.turno?.estacion?.nombre}</p>
          </div>
        </header>

        <div className={`p-5 rounded-[2rem] shadow-md border flex items-center justify-between transition-colors ${calculatedValues.balance === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : calculatedValues.balance < 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
          <div>
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">Balance del Turno</h4>
            <p className="text-[9px] md:text-[10px] font-bold opacity-75">Esperado: ${calculatedValues.totalEsperado.toLocaleString()} | Reportado: ${calculatedValues.totalReportado.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm md:text-xl font-black">{calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(calculatedValues.balance).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mangueras */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Droplets size={16} /> Mangueras</h3>
            {summary.lecturas?.map((l, index) => {
              const currentVal = formData.lecturas_finales[index]?.lectura_final ?? '';
              const displayVal = formatNumberInput(currentVal);

              return (
                <div key={l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4 items-center">
                  <div>
                      <p className="text-[9px] font-bold uppercase">{l.manguera.nombre}</p>
                      <p className="text-[10px] font-black">${l.precio_galon.toLocaleString()}</p>
                  </div>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className="p-3 rounded-xl border text-right font-black outline-none focus:ring-2 focus:ring-zinc-900 bg-white" 
                    value={displayVal} 
                    onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)} 
                  />
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            {formData.destinos_recaudo.map((destino) => {
              const esLubricantes = destino.nombre === 'Lubricantes';

              return (
                <div key={destino.destino_recaudo_id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                  <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2">
                    <Banknote size={16} /> {destino.nombre}
                    {esLubricantes && <span className="text-[9px] font-bold text-slate-400 ml-auto">(Automático)</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(destino.pagos).map((medio) => (
                      <div key={medio} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">{medio}</label>
                        <input 
                          type="text" 
                          readOnly={esLubricantes}
                          disabled={esLubricantes}
                          className={`w-full p-3 rounded-xl text-xs font-black text-right outline-none ${
                            esLubricantes 
                              ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed' 
                              : 'bg-slate-50'
                          }`} 
                          value={destino.pagos[medio].toLocaleString()} 
                          onChange={(e) => handlePaymentChange(destino.destino_recaudo_id, medio, parseInt(e.target.value.replace(/\D/g, "") || 0))} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Créditos Totales */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2 text-slate-800">
                <CreditCard size={16} /> Créditos Totales
              </h3>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                  value={`$ ${creditosTotales.toLocaleString()}`}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest text-right">
                Total de créditos acumulados en el turno
              </p>
            </div>

            {/* Total Abonos de Cartera */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
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

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-black transition-all shadow-xl">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Solicitar aprobación de cierre
        </button>
      </form>
    </div>
  );
};