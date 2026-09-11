import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Banknote, Droplets, Users, Send, CreditCard } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

// Funciones auxiliares estilo colombiano ajustadas a 3 decimales (ej: 4.123.334,234)
const formatPesos = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const stringValue = String(value);
  
  const parts = stringValue.split(',');
  let entera = parts[0].replace(/[^\d]/g, '');
  
  if (entera !== '') {
    entera = Number(entera).toLocaleString('es-CO');
  }
  
  if (parts.length > 1) {
    // Permite y limita hasta 3 dígitos decimales
    const decimal = parts[1].replace(/[^\d]/g, '').slice(0, 3);
    return `${entera},${decimal}`;
  }
  
  return entera;
};

const parsePesos = (str) => {
  if (!str) return '';
  const clean = String(str).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? '' : num;
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
          lecturas_finales: data.lecturas.map(l => {
            const val = l.lectura_sugerida !== null && l.lectura_sugerida !== undefined ? l.lectura_sugerida : '';
            const formattedVal = val !== '' ? formatPesos(String(val).replace('.', ',')) : '';
            return { 
              manguera_id: l.manguera_id, 
              lectura_final: val,
              lecturaFinalInput: formattedVal,
              lectura_inicial: l.lectura_inicial,
              precio_galon: l.precio_galon 
            };
          }),
          destinos_recaudo: data.destinos_recaudo.map(d => {
            const initialPagos = { ...d.pagos };
            const pagosInputs = {};
            Object.keys(initialPagos).forEach(medio => {
              const val = initialPagos[medio];
              pagosInputs[medio] = val ? formatPesos(String(val).replace('.', ',')) : '';
            });
            return {
              destino_recaudo_id: d.destino_recaudo_id,
              nombre: d.nombre,
              pagos: initialPagos,
              pagosInputs: pagosInputs
            };
          })
        });
      }
    };
    loadSummary();
  }, [id]);

  const calculatedValues = useMemo(() => {
    if (!summary) return { totalEsperado: 0, totalReportado: 0, balance: 0 };
    
    const totalCombustible = formData.lecturas_finales.reduce((acc, l) => {
      const inicial = Number(l.lectura_inicial) || 0;
      const final = l.lectura_final !== '' ? Number(l.lectura_final) : inicial;
      const galonesVendidos = Math.max(0, final - inicial);
      // Redondeo ajustado a 3 decimales (multiplicando y dividiendo por 1000)
      const galonesRedondeados = Math.round(galonesVendidos * 1000) / 1000;
      return acc + (galonesRedondeados * Number(l.precio_galon || 0));
    }, 0);
    
    const ventasLubricantes = Number(summary.totales_sistema?.ventas_lubricantes || 0);
    const abonos = (summary.abonos_recibidos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0);
    const creditos = Number(summary.totales_sistema?.creditos || summary.totales_pago_sugeridos?.creditos || 0);

    let totalEsperado = (totalCombustible + ventasLubricantes) - creditos + abonos;

    if (Math.abs(totalEsperado) < 100) {
      totalEsperado = 0;
    }

    const totalReportado = formData.destinos_recaudo.reduce((acc, d) => {
      return acc + Object.values(d.pagos).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, 0) + abonos;

    let balance = totalReportado - totalEsperado;

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
    const filtered = rawValue.replace(/[^0-9,.-]/g, '').replace(/\./g, ',');
    const parts = filtered.split(',');
    const cleanValue = parts.length > 1 ? `${parts[0]},${parts.slice(1).join('')}` : parts[0];

    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => {
        if (l.manguera_id !== mangueraId) return l;
        return {
          ...l,
          lecturaFinalInput: cleanValue,
          lectura_final: parsePesos(cleanValue)
        };
      })
    }));
  };

  const handleReadingBlur = (mangueraId) => {
    setFormData(prev => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map(l => {
        if (l.manguera_id !== mangueraId) return l;
        const num = l.lectura_final;
        return {
          ...l,
          lecturaFinalInput: num !== '' && !isNaN(num) ? formatPesos(String(num).replace('.', ',')) : ''
        };
      })
    }));
  };

  const handlePaymentChange = (destinoId, medio, rawValue) => {
    const filtered = rawValue.replace(/[^0-9,.-]/g, '').replace(/\./g, ',');
    const parts = filtered.split(',');
    const cleanValue = parts.length > 1 ? `${parts[0]},${parts.slice(1).join('')}` : parts[0];

    setFormData(prev => ({
      ...prev,
      destinos_recaudo: prev.destinos_recaudo.map(d => {
        if (d.destino_recaudo_id !== destinoId) return d;
        const numericVal = parsePesos(cleanValue);
        return {
          ...d,
          pagos: { ...d.pagos, [medio]: numericVal === '' ? 0 : numericVal },
          pagosInputs: { ...d.pagosInputs, [medio]: cleanValue }
        };
      })
    }));
  };

  const handlePaymentBlur = (destinoId, medio) => {
    setFormData(prev => ({
      ...prev,
      destinos_recaudo: prev.destinos_recaudo.map(d => {
        if (d.destino_recaudo_id !== destinoId) return d;
        const num = d.pagos[medio];
        return {
          ...d,
          pagosInputs: { ...d.pagosInputs, [medio]: num ? formatPesos(String(num).replace('.', ',')) : '' }
        };
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        lecturas_finales: formData.lecturas_finales.map(({manguera_id, lectura_final}) => ({
          manguera_id, 
          lectura_final: lectura_final === '' ? 0 : Number(lectura_final)
        })),
        destinos_recaudo: formData.destinos_recaudo.map(d => ({
          destino_recaudo_id: d.destino_recaudo_id,
          pagos: d.pagos
        })),
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
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20 text-left">
      
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
            <p className="text-[9px] md:text-[10px] font-bold opacity-75">Esperado: ${calculatedValues.totalEsperado.toLocaleString('es-CO')} | Reportado: ${calculatedValues.totalReportado.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm md:text-xl font-black">{calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(calculatedValues.balance).toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mangueras */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Droplets size={16} /> Mangueras</h3>
            {formData.lecturas_finales.map((l, index) => {
              const summaryItem = summary.lecturas[index];

              return (
                <div key={l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-600">{summaryItem?.manguera?.nombre || `Manguera #${l.manguera_id}`}</p>
                      <p className="text-[10px] font-black text-slate-800">${Number(l.precio_galon).toLocaleString('es-CO')} /gal</p>
                    </div>
                    <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                      Inicial: {Number(l.lectura_inicial).toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </span>
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Lectura Final</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0,000"
                      className="w-full p-3 rounded-xl border border-slate-200 text-right font-black outline-none focus:border-zinc-900 bg-white text-xs text-slate-800" 
                      value={l.lecturaFinalInput ?? ''} 
                      onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)} 
                      onBlur={() => handleReadingBlur(l.manguera_id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            {formData.destinos_recaudo.map((destino) => {
              const esLubricantes = destino.nombre === 'Lubricantes';

              return (
                <div key={destino.destino_recaudo_id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                  <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
                    <Banknote size={16} /> {destino.nombre}
                    {esLubricantes && <span className="text-[9px] font-bold text-slate-400 ml-auto">(Automático)</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(destino.pagos).map((medio) => (
                      <div key={medio} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">{medio}</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          readOnly={esLubricantes}
                          disabled={esLubricantes}
                          className={`w-full p-3 rounded-xl text-xs font-black text-right outline-none ${
                            esLubricantes 
                              ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed' 
                              : 'bg-slate-50 border border-slate-200 focus:border-zinc-900 text-slate-800'
                          }`} 
                          value={esLubricantes ? Number(destino.pagos[medio]).toLocaleString('es-CO') : (destino.pagosInputs?.[medio] ?? '')} 
                          placeholder="0,000"
                          onChange={(e) => handlePaymentChange(destino.destino_recaudo_id, medio, e.target.value)} 
                          onBlur={() => handlePaymentBlur(destino.destino_recaudo_id, medio)}
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
                  value={`$ ${creditosTotales.toLocaleString('es-CO')}`}
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
                  value={`$ ${(summary.abonos_recibidos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0).toLocaleString('es-CO')}`}
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